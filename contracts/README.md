# Contratos de integração

Esta pasta é a fonte de verdade para os formatos trocados entre frontend, Java e Python.

## Regras

- Toda mudança de payload deve ser feita aqui antes da implementação.
- Prefira adicionar campos opcionais a remover ou renomear campos existentes.
- Mudanças incompatíveis devem criar uma nova versão, como `v2`.
- O contrato não deve conter classes específicas de Java ou Python.
- A PR deve listar produtores e consumidores afetados.

## Arquivos atuais

- [`openapi/ml-engine.yaml`](openapi/ml-engine.yaml): healthcheck e predição do ML Engine.

Os contratos do Gateway, Profile Service e Project Service devem ser adicionados à medida que os endpoints das respectivas issues forem definidos.
