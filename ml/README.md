# Equipe de Machine Learning

## Responsabilidade

Esta pasta contém o pipeline de dados e treinamento, separado do serviço online de inferência.

```text
ml/
├── data/
│   ├── raw/          # entradas locais; não versionar dados sensíveis
│   └── processed/    # dados derivados; gerados de forma reproduzível
├── training/         # scripts e notebooks de treinamento
├── models/           # artefatos versionados conforme decisão do projeto
└── tests/
```

## Regras

- O processo de geração do dataset deve ser reproduzível.
- Documentar features, labels, divisão treino/teste e métricas.
- Não depender de chamadas ao banco durante o treinamento sem documentar a origem dos dados.
- O modelo publicado deve informar versão, data, features e métricas.
- O `ml-engine` deve conseguir carregar o modelo sem executar o treinamento.
- Dados reais, credenciais e grandes artefatos não devem ser commitados sem aprovação.

## Integração com o backend

O payload do modelo online é definido em `contracts/`. O Match Orchestrator prepara os dados; o ML Engine faz a inferência. A equipe de ML não deve criar dependência direta com entidades Java.

Os requisitos das issues 14, 15 e 16 devem ser entregues nesta separação: dataset e feature engineering em `ml/`, treinamento e avaliação em `ml/`, endpoint online em `services/ml-engine/`.


## Anotações

## Treinamento do ranking

O script [`training/train_ranker.py`](training/train_ranker.py) treina um
`XGBRanker` usando o dataset `data/job-recommendation`.

Neste dataset, `apps.tsv` registra que um usuário se candidatou a uma vaga,
mas não informa contratação ou aprovação. Portanto, o treinamento usa:

- relevância `1`: candidatura observada para o par usuário-vaga;
- relevância `0`: vagas amostradas do catálogo para o mesmo usuário e janela,
  nas quais não há candidatura observada;
- consulta de ranking: `(UserID, WindowID)`;
- divisão temporal: janelas 1–5 para treino, 6 para validação e 7 para teste.

As features combinam similaridade TF-IDF entre o histórico profissional e os
requisitos da vaga, sobreposição de palavras, localização, experiência e
informações de formação. Como os negativos são amostrados, a porcentagem
retornada é um índice calibrado de probabilidade de candidatura histórica,
não uma porcentagem real de chance de contratação.

Para testar o pipeline com uma amostra pequena:

```bash
cd ml
.venv/bin/python training/train_ranker.py \
  --data-dir data/job-recommendation \
  --output models/job_ranker.joblib \
  --max-queries 20000
```

Para o treinamento completo, remova `--max-queries` ou use `--max-queries 0`.
O script lê `jobs.tsv` diretamente; quando ele não estiver extraído, lê os
registros necessários de `jobs.zip` sem descompactar o arquivo inteiro.

O artefato salvo contém o ranker, o TF-IDF, o calibrador, a lista de features,
a definição da pontuação e as métricas `NDCG@10` e `MRR`. O serviço online deve
carregar esse artefato na inicialização; treinamento não deve ocorrer dentro
do endpoint `/predict`.

## Execução realizada no projeto

O artefato utilizado pelo MVP foi gerado com:

```bash
cd ml
.venv/bin/python training/train_ranker.py \
  --data-dir data/job-recommendation \
  --output models/job_ranker.joblib \
  --max-queries 20000
```

Configuração registrada no treinamento:

| Item | Valor |
|---|---|
| Consultas | 20.000 em cada janela de train, validation e test |
| Janelas de treino | 1–5 |
| Janela de validação | 6 |
| Janela de teste | 7 |
| Modelo | `xgboost.XGBRanker` |
| Razão de negativos | 3 |
| Máximo de negativos por consulta | 30 |
| Seed | 42 |
| Artefato | `ml/models/job_ranker.joblib` |

Resultado registrado:

| Divisão | Pares | NDCG@10 | MRR |
|---|---:|---:|---:|
| Validation | 935.062 | 0,8605886 | 0,8771451 |
| Test | 910.610 | 0,8478675 | 0,8626052 |

O conjunto de treino gerou 944.737 pares. As métricas indicam qualidade de
ordenação sobre o histórico disponível; não devem ser interpretadas como
precisão de contratação.
