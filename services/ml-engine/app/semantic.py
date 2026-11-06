from __future__ import annotations

import hashlib
import threading
from collections import OrderedDict
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


class SemanticEncoder:
    """Encoder E5 ONNX local com cache LRU e inferência em lotes."""

    def __init__(
        self,
        model_path: Path,
        tokenizer_path: Path,
        *,
        cache_size: int = 10_000,
        batch_size: int = 64,
        threads: int = 4,
    ) -> None:
        options = ort.SessionOptions()
        options.intra_op_num_threads = max(1, threads)
        options.inter_op_num_threads = 1
        self.session = ort.InferenceSession(
            str(model_path),
            sess_options=options,
            providers=["CPUExecutionProvider"],
        )
        self.tokenizer = Tokenizer.from_file(str(tokenizer_path))
        pad_id = self.tokenizer.token_to_id("<pad>")
        self.tokenizer.enable_truncation(max_length=512)
        self.tokenizer.enable_padding(pad_id=1 if pad_id is None else pad_id, pad_token="<pad>")
        self.input_names = {item.name for item in self.session.get_inputs()}
        self.cache_size = max(100, cache_size)
        self.batch_size = max(1, batch_size)
        self._cache: OrderedDict[str, np.ndarray] = OrderedDict()
        self._cache_lock = threading.Lock()
        self._inference_lock = threading.Lock()
        self.cache_hits = 0
        self.cache_misses = 0

    @staticmethod
    def _key(prefix: str, text: str) -> str:
        return hashlib.sha256(f"{prefix}\0{text}".encode("utf-8")).hexdigest()

    def _encode_batch(self, texts: list[str]) -> np.ndarray:
        with self._inference_lock:
            encoded = self.tokenizer.encode_batch(texts)
            input_ids = np.asarray([item.ids for item in encoded], dtype=np.int64)
            attention_mask = np.asarray([item.attention_mask for item in encoded], dtype=np.int64)
            inputs = {"input_ids": input_ids, "attention_mask": attention_mask}
            if "token_type_ids" in self.input_names:
                inputs["token_type_ids"] = np.zeros_like(input_ids)
            hidden = self.session.run(None, inputs)[0]
        expanded_mask = attention_mask[:, :, None].astype(np.float32)
        pooled = (hidden * expanded_mask).sum(axis=1) / np.maximum(expanded_mask.sum(axis=1), 1e-9)
        return pooled / np.maximum(np.linalg.norm(pooled, axis=1, keepdims=True), 1e-12)

    def encode_cached(self, prefix: str, texts: list[str]) -> np.ndarray:
        keys = [self._key(prefix, text) for text in texts]
        resolved: list[np.ndarray | None] = [None] * len(texts)
        missing: dict[str, tuple[str, list[int]]] = {}
        with self._cache_lock:
            for index, (key, text) in enumerate(zip(keys, texts)):
                cached = self._cache.get(key)
                if cached is not None:
                    self._cache.move_to_end(key)
                    resolved[index] = cached
                    self.cache_hits += 1
                elif key in missing:
                    missing[key][1].append(index)
                else:
                    missing[key] = (text, [index])
                    self.cache_misses += 1

        missing_items = list(missing.items())
        for start in range(0, len(missing_items), self.batch_size):
            chunk = missing_items[start : start + self.batch_size]
            embeddings = self._encode_batch([f"{prefix}: {item[1][0]}" for item in chunk])
            with self._cache_lock:
                for (key, (_, indices)), embedding in zip(chunk, embeddings):
                    stored = np.asarray(embedding, dtype=np.float32)
                    self._cache[key] = stored
                    self._cache.move_to_end(key)
                    while len(self._cache) > self.cache_size:
                        self._cache.popitem(last=False)
                    for index in indices:
                        resolved[index] = stored

        if not resolved:
            return np.empty((0, 384), dtype=np.float32)
        return np.stack([item for item in resolved if item is not None])

    def similarities(self, project: str, profiles: list[str]) -> np.ndarray:
        if not profiles:
            return np.empty(0, dtype=np.float32)
        project_embedding = self.encode_cached("query", [project])[0]
        scores = np.zeros(len(profiles), dtype=np.float32)
        non_empty = [(index, profile) for index, profile in enumerate(profiles) if profile]
        if non_empty:
            embeddings = self.encode_cached("passage", [profile for _, profile in non_empty])
            for (index, _), embedding in zip(non_empty, embeddings):
                scores[index] = float(project_embedding @ embedding)
        return scores

    def cache_info(self) -> dict[str, int]:
        with self._cache_lock:
            return {
                "size": len(self._cache),
                "max_size": self.cache_size,
                "hits": self.cache_hits,
                "misses": self.cache_misses,
            }
