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

## Ranker textual v3

O contrato atual usa exclusivamente `project_description` e
`profile_description`. O segundo campo concatena a bio e as descrições dos
projetos do portfólio; skills, profissão, escolaridade e experiência não entram
como features separadas.

O script [`training/train_description_ranker.py`](training/train_description_ranker.py)
recebe um CSV de pares textuais com `label` 0/1 e, preferencialmente,
`project_id`. Quando o identificador existe, projetos inteiros são separados
entre treino e validação para evitar vazamento.

```bash
cd ml
python training/train_description_ranker.py \
  --input data/processed/description_pairs.csv \
  --output models/job_ranker.joblib
```

O artefato recebe a versão `description-ranker-v3`. A representação textual usa
`HashingVectorizer` com n-gramas de caracteres, sem vocabulário fixo, para não
descartar textos em português quando o conjunto de treino contém inglês. A
regressão usa regularização `C=0.1`, sem balanceamento artificial das classes.
O treinamento registra ROC-AUC, Average Precision, Brier loss, log loss,
NDCG@10, MRR, percentis dos scores e taxa de saturação. Por padrão, o artefato
não é publicado se mais de 1% da validação alcançar score igual ou superior a
99,5%, ou se não atingir os gates mínimos de ROC-AUC 0,60, Average Precision
0,35, NDCG@10 0,55 e MRR 0,65.

O índice representa afinidade com candidaturas históricas dentro do conjunto
negativo amostrado; não é probabilidade de contratação. Para uma implantação
organizacional, o próximo passo recomendado é validar um modelo de embeddings
multilíngues e recalibrá-lo com decisões reais, consentidas e auditadas em
português, mantendo separação de projetos entre treino e validação.

## Ranker legado v1

O script [`training/train_ranker.py`](training/train_ranker.py) treina um
`XGBRanker` usando o dataset `data/job-recommendation`.

Neste dataset, `apps.tsv` registra que um usuário se candidatou a uma vaga,
mas não informa contratação ou aprovação. Portanto, o treinamento usa:

- relevância `1`: candidatura observada para o par usuário-vaga;
- relevância `0`: vagas amostradas do catálogo para o mesmo usuário e janela,
  nas quais não há candidatura observada;
- consulta de ranking: `(UserID, WindowID)`;
- divisão temporal: janelas 1–5 para treino, 6 para validação e 7 para teste.

As features do modelo legado combinavam similaridade TF-IDF entre o histórico profissional e os
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

O artefato legado contém o ranker, o TF-IDF, o calibrador, a lista de features,
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
