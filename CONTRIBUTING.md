# Como contribuir

## Antes de começar

```bash
cp .env.example .env
docker compose config --quiet
```

Escolha uma branch curta relacionada à issue:

```bash
git switch develop
git switch -c feat/nome-da-tarefa
```

## Antes da Pull Request

- teste a área alterada;
- execute `git diff --check`;
- atualize o contrato se o payload mudou;
- atualize o README da equipe quando o fluxo de desenvolvimento mudou;
- não inclua `.env`, credenciais, arquivos gerados ou dados pessoais;
- descreva a issue, o comando de teste e os impactos para outras equipes.

## Commits

Prefira mensagens objetivas e relacionadas a uma única responsabilidade, por exemplo:

```text
feat(profile): criar cadastro de colaborador
fix(ml): ordenar resultados por score
docs(infra): documentar override local do compose
```

## Revisão

Alterações em `contracts/`, `docker-compose.yml` ou bancos/migrations precisam ser revisadas pelas equipes que consomem esses recursos.
