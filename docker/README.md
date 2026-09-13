# Equipe de Docker e infraestrutura

## Responsabilidade

Manter a execução local reproduzível, a rede interna, os healthchecks, os volumes e as imagens dos serviços.

O arquivo principal é [`../docker-compose.yml`](../docker-compose.yml). Ele deve continuar sendo a forma oficial de subir o ambiente:

```bash
docker compose up --build
```

## Regras do Compose

- Publicar no host somente portas necessárias ao usuário, inicialmente o API Gateway em `8080`.
- Usar nomes de serviço para comunicação interna.
- Adicionar `depends_on` com healthcheck quando houver dependência de inicialização.
- Não colocar segredos diretamente no YAML.
- Usar `.env.example` para documentar variáveis obrigatórias.
- Cada banco deve ter volume e credenciais próprias.
- Serviços opcionais, como n8n, devem usar profiles e não bloquear o MVP.

Para depuração direta, copie [`../docker-compose.override.yml.example`](../docker-compose.override.yml.example) para `docker-compose.override.yml`. Esse override não deve ser commitado.

## Dockerfiles

- `docker/java/Dockerfile`: imagem compartilhada para os microsserviços Java;
- `services/ml-engine/Dockerfile`: imagem do runtime Python de inferência;
- o frontend terá Dockerfile próprio quando o framework for escolhido.

Alterações no Compose ou em Dockerfiles devem incluir o comando de validação e o resultado de `docker compose ps` na PR.
