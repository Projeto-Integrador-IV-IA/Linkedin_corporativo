# Equipe Backend Java

## Responsabilidade

Implementar os microsserviços Spring Boot em `services/`:

- `api-gateway`: entrada pública, autenticação, CORS e roteamento;
- `profile-service`: perfis, skills, experiência e busca de colaboradores;
- `project-service`: projetos, vagas, requisitos e pesos;
- `match-orchestrator`: coordenação do matching e integração com o ML Engine.

O `ml-engine` é Python e possui instruções próprias em [`ml-engine/README.md`](ml-engine/README.md).

## Isolamento

Cada serviço possui seu próprio `pom.xml`, código, migrations e banco. Um serviço não deve importar classes de outro serviço nem compartilhar tabelas.

As chamadas entre serviços são HTTP, usando URLs configuradas por ambiente. Em Docker, use os nomes `profile-service`, `project-service`, `match-orchestrator` e `ml-engine`; nunca use `localhost` para comunicação interna.

## Estrutura recomendada de um serviço

```text
src/main/java/.../
├── controller/
├── service/
├── repository/
├── domain/       # entidades e regras do próprio serviço
├── dto/
└── config/
src/main/resources/
├── application.yml
└── db/migration/
```

## Desenvolvimento

É possível executar um serviço pelo Maven, mas as dependências locais (PostgreSQL e outros serviços) normalmente devem ser iniciadas pelo Compose:

```bash
docker compose up -d profile-db project-db match-db
cd services/profile-service
mvn spring-boot:run
```

Antes de alterar uma API:

1. atualize o contrato em `contracts/`;
2. confirme os consumidores impactados;
3. implemente DTOs e validações;
4. adicione testes;
5. documente a mudança na PR.

Não use `ddl-auto: create` ou `update` em ambientes compartilhados. Migrations devem ser versionadas pelo serviço dono do banco.
