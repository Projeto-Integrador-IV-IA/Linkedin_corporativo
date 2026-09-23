# Docker e infraestrutura local

O arquivo [`../docker-compose.yml`](../docker-compose.yml) é a forma oficial
de executar o MVP completo.

Para publicar no servidor com domínio e HTTPS, consulte o guia
[`../docs/deploy-dokploy.md`](../docs/deploy-dokploy.md).

## Subida do ambiente

```bash
cp .env.example .env
docker compose up --build
```

Serviços do Compose:

- `frontend`: Next.js, publicado em `3000`;
- `api-gateway`: entrada pública, publicado em `8080`;
- `profile-service` + `profile-db`;
- `project-service` + `project-db`;
- `match-orchestrator` + `match-db`;
- `ml-engine`;
- `redis`, com volume `redis-data`.

O Compose principal não publica portas no host: frontend e Gateway usam
`expose` para que o Dokploy/Traefik faça o roteamento. Para desenvolvimento
local, copie [`../docker-compose.override.yml.example`](../docker-compose.override.yml.example)
para `docker-compose.override.yml`; esse override publica o frontend em `3000`
e o Gateway em `8080`.

## Healthchecks

```bash
docker compose ps
curl http://localhost:8080/actuator/health
curl http://localhost:8080/health/dependencies
```

Os containers de domínio possuem healthchecks e o Gateway expõe a situação das
dependências. O Redis tem healthcheck próprio e o Profile Service o utiliza
como cache opcional.

## Dados e variáveis

As variáveis obrigatórias estão em [`.env.example`](../.env.example). O arquivo
`.env` local não deve ser commitado. Cada banco possui credencial e volume
próprios; o Redis mantém dados em `redis-data`, mas esses dados podem ser
reconstruídos a partir do PostgreSQL.

Para parar preservando os dados:

```bash
docker compose down
```

`docker compose down -v` remove os volumes e apaga os bancos locais. Use-o
somente quando realmente precisar reinicializar o ambiente de desenvolvimento.

## Imagens

- `docker/java/Dockerfile`: base compartilhada dos serviços Java;
- `services/ml-engine/Dockerfile`: runtime Python da inferência;
- `frontend/Dockerfile`: build multi-stage do Next.js.

Para validar a configuração sem iniciar containers:

```bash
docker compose config --quiet
```

Em mudanças de Compose ou Dockerfile, registre na PR o resultado desse comando
e de `docker compose ps`.
