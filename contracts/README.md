# Contratos de integração

Esta pasta é a referência para os formatos trocados entre frontend, serviços
Java e ML Engine. A documentação funcional está em
[`../docs/api.md`](../docs/api.md).

## Contrato disponível

- [`openapi/ml-engine.yaml`](openapi/ml-engine.yaml): healthcheck e predição
  do serviço Python.

O contrato define o payload usado pelo Match Orchestrator para enviar contexto
de vaga/candidato ao ML Engine e o retorno com scores.

## Superfície principal do Gateway

As rotas consumidas pelo frontend estão agrupadas em:

- `/api/auth/*`: cadastro, login, sessão e perfil da conta;
- `/api/profiles/*` e `/api/skills/*`: perfil profissional, avatar, skills e
  portfólio;
- `/api/projects/*`: CRUD de projetos, candidaturas e decisões;
- `/api/matches/*`: recomendações ordenadas;
- `/api/chats/*`: conversas, mensagens e notas particulares.

Os detalhes de métodos, payloads e regras de acesso ficam em
[`../docs/api.md`](../docs/api.md). O Gateway é a entrada pública; as URLs
internas dos serviços não fazem parte do contrato do navegador.

## Regras de evolução

1. Toda mudança de payload deve ser documentada aqui e em `docs/api.md` antes
   da implementação.
2. Prefira adicionar campos opcionais a remover ou renomear campos existentes.
3. Mudanças incompatíveis devem criar uma nova versão, como `v2`.
4. Não coloque classes específicas de Java ou Python no contrato.
5. A PR deve listar produtores, consumidores e exemplos de teste afetados.
