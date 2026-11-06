# Avaliação realista do ranker textual v3

Data: 5 de novembro de 2026
Execução: `20261105200802-d39077`

## Objetivo

Verificar se o modelo publicado ordena profissionais de forma coerente em
cenários realistas, se o valor exibido acompanha a relevância esperada e se o
fluxo completo funciona pelo Gateway autenticado.

O score avaliado é um **índice de afinidade aprendido com candidaturas
históricas amostradas**, e não uma probabilidade de contratação ou uma medição
calibrada de competência.

## Metodologia

- 5 contas de recrutador publicaram projetos de automação, dados, UX, DevOps e
  marketing.
- 16 contas profissionais receberam bios e portfólios em português.
- Cada par projeto/profissional recebeu, antes da inferência, relevância humana
  ordinal: `0` irrelevante, `1` adjacente, `2` relevante e `3` muito relevante.
- Foram avaliados 80 pares controlados.
- Cada projeto foi consultado 5 vezes pelo fluxo real
  `Gateway -> Project/Profile Services -> Match Orchestrator -> ML Engine`.
- Um profissional demonstrou interesse para validar o filtro correspondente.
- Um perfil sem descrição e um perfil adversarial com negação e palavras-chave
  copiadas foram incluídos deliberadamente.
- Projetos, perfis e as 21 contas temporárias foram removidos ao final. A
  verificação posterior encontrou zero registros E2E remanescentes.

O ensaio pode ser repetido com:

```bash
python ml/evaluation/evaluate_live_recommendations.py \
  --repetitions 5 \
  --output /tmp/synapse-live-recommendation-eval.json
```

## Resultado agregado

| Métrica | Resultado | Leitura |
|---|---:|---|
| Top-1 correto | 100% (5/5) | O primeiro colocado sempre tinha relevância humana máxima |
| NDCG@5 médio | 0,8930 | Boa qualidade no topo do ranking |
| NDCG@10 médio | 0,9292 | Boa ordenação global dos itens relevantes |
| Spearman médio | 0,4809 | Correlação apenas moderada entre score e grau humano |
| Acurácia par a par | 0,7776 | Cerca de 22% dos pares de graus diferentes ficaram invertidos |
| Precisão top-3 | 60% | O top-3 ainda inclui falsos positivos importantes |
| Repetibilidade | delta 0,00 | As cinco execuções produziram os mesmos scores |
| Latência mediana | 53,7 ms | Adequada ao fluxo interativo local |
| Latência p95 | 67,7 ms | Sem cauda relevante no ensaio local |
| Filtro de interesse | aprovado | Retornou somente o profissional interessado esperado |

## Distribuição do score por relevância humana

| Grau humano | Pares | Score médio | Mínimo | Máximo |
|---:|---:|---:|---:|---:|
| 0 - irrelevante | 55 | 26,67 | 0,00 | 68,91 |
| 1 - adjacente | 13 | 32,29 | 20,65 | 52,13 |
| 2 - relevante | 2 | 49,46 | 38,47 | 60,44 |
| 3 - muito relevante | 10 | 80,63 | 28,41 | 98,55 |

As faixas se sobrepõem. Portanto, `70` não significa literalmente "70% de
relevância", e a diferença entre `40` e `60` não deve ser interpretada como uma
diferença probabilística de vinte pontos.

## Comportamento dos filtros

Considerando como positivo um perfil de grau humano `2` ou `3`:

| Score mínimo | Precisão | Recall | F1 | Observação |
|---:|---:|---:|---:|---|
| 30 | 31,4% | 91,7% | 46,8% | Traz muitos irrelevantes |
| 40 | 58,8% | 83,3% | 69,0% | Ainda ruidoso |
| 50 | 83,3% | 83,3% | 83,3% | Melhor equilíbrio do ensaio |
| 60 | 90,9% | 83,3% | 87,0% | Melhor F1, mas ainda aceita o caso adversarial |
| 70 | 100% | 66,7% | 80,0% | Alta precisão, perde um terço dos relevantes |
| 80 | 100% | 50,0% | 66,7% | Muito restritivo |

Para uma lista curta assistiva, `50` ou `60` é um ponto inicial razoável. O
limiar não deve eliminar definitivamente pessoas; perfis abaixo dele ainda podem
ser relevantes por uso de sinônimos ou descrições menos literais.

## Acertos observados

- O melhor profissional ficou em primeiro nos cinco domínios.
- Dados, DevOps e marketing colocaram os dois especialistas esperados nas duas
  primeiras posições.
- Perfil vazio recebeu score `0` em todos os projetos.
- Interesse não alterou o score e foi filtrado corretamente.
- As execuções foram determinísticas.
- O sistema completo permaneceu saudável durante o ensaio.

## Falhas e riscos encontrados

### 1. Negação e repetição de palavras-chave

O perfil que dizia explicitamente não possuir experiência, mas repetia `Python`,
`automação`, `APIs REST`, `SQL`, `testes` e `Git`, recebeu **68,91** e ficou em
terceiro no projeto de automação. Esse é um falso positivo crítico e mostra que
o modelo mede principalmente proximidade lexical, sem compreender bem negação
ou veracidade.

### 2. Paráfrase e sinônimos

Um profissional muito relevante, descrito com `robotização de tarefas`,
`conectar plataformas` e `troca de informações entre sistemas`, recebeu apenas
**28,41** e ficou em nono. O texto expressava o mesmo trabalho sem repetir as
palavras da oportunidade. Esse é um falso negativo importante.

### 3. Score absoluto não calibrado para relevância

Perfis irrelevantes chegaram a `68,91`, enquanto um perfil muito relevante ficou
em `28,41`. O score funciona melhor para ordenar candidatos dentro do mesmo
projeto do que para comparar pessoas entre projetos ou afirmar uma porcentagem
absoluta de compatibilidade.

### 4. Ruído depois das primeiras posições

Apesar do top-1 correto e do NDCG alto, a precisão do top-3 foi 60%. A interface
não deve apresentar as três primeiras pessoas como igualmente recomendadas sem
revisão do texto e do portfólio.

### 5. Validade externa limitada

Os rótulos deste ensaio são controlados e transparentes, mas não substituem
decisões reais e auditadas em português. O conjunto de treino atual representa
candidaturas históricas amostradas e não desempenho, contratação ou sucesso no
projeto.

## Conclusão

O v3 **recomenda corretamente o melhor especialista nos cinco cenários e é útil
como ranker de shortlist**, mas **a porcentagem ainda não é uma medida confiável
de relevância absoluta**. Ele não deve decidir sozinho, excluir profissionais de
forma definitiva ou ser apresentado como probabilidade de contratação.

Prioridades para a próxima versão:

1. Exibir `índice de aderência: X/100` ou `X pontos`, removendo a interpretação
   probabilística do símbolo `%`.
2. Manter revisão humana e apresentar trechos que justificam a recomendação.
3. Comparar o ranker atual com embeddings multilíngues e um reranker que lide
   melhor com paráfrase e negação.
4. Criar um conjunto de validação em português, rotulado por mais de uma pessoa,
   contendo negações, sinônimos, textos longos, perfis incompletos e tentativas de
   preenchimento por palavras-chave.
5. Medir NDCG@5, precisão top-3, falsos positivos acima de 60 e falsos negativos
   abaixo de 40 a cada nova versão.
