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
