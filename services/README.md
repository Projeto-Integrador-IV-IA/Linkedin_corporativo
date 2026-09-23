# Backend e microsserviços

O backend é formado por serviços Spring Boot, um serviço Python de inferência
e um API Gateway. Cada serviço possui código, configuração e banco próprios.

## Serviços

| Serviço | Porta interna | Responsabilidade |
|---|---:|---|
| `api-gateway` | 8080 | entrada pública, CORS, proxy e healthcheck de dependências |
| `profile-service` | 8081 | perfis, avatar, skills e portfólio |
| `project-service` | 8082 | contas, autenticação, projetos, decisões, conversas, mensagens e notas |
| `match-orchestrator` | 8083 | consulta dados de domínio, chama o ML Engine e monta recomendações |
| `ml-engine` | 8000 | carrega o modelo e executa a inferência de ranking |

O frontend chama somente o Gateway. Em Docker, as chamadas internas usam os
nomes `profile-service`, `project-service`, `match-orchestrator` e `ml-engine`;
`localhost` dentro de um container aponta para o próprio container.

## Autenticação e autorização

O Project Service mantém usuários e tokens de sessão no `project-db`. O Gateway
encaminha o Bearer token, e o interceptor do Project Service identifica o
usuário da requisição. Operações de projeto verificam o proprietário antes de
ler ou alterar os dados.

O MVP aplica a regra de isolamento por proprietário: um recrutador só gerencia
seus próprios projetos, decisões e conversas participantes. As notas são
filtradas pelo recrutador que as criou.

## Profile Service e Redis

O Profile Service persiste perfis no PostgreSQL. A lista de perfis, perfil por
ID e catálogo de skills são cacheados no Redis por 60 segundos. O cache usa
JSON, é invalidado nas mutações e possui tratamento de erro para continuar
consultando o PostgreSQL quando o Redis estiver fora do ar.

O avatar é armazenado como texto (`data URL`) no perfil. O endpoint valida um
limite de aproximadamente 700 mil caracteres; a interface limita a imagem a
512 KB antes do envio.

## Matching

O Match Orchestrator chama os serviços de perfil e projeto, prepara o payload
do contrato do ML Engine e recebe scores ordenados. Ele não treina modelo. O
ML Engine carrega `job_ranker.joblib` na inicialização e dispõe de fallback
determinístico se o artefato não estiver disponível, permitindo que o serviço
suba durante o desenvolvimento.

## Desenvolvimento

Para subir as dependências principais:

```bash
docker compose up -d profile-db project-db match-db redis
```

Para executar um serviço Java localmente:

```bash
cd services/profile-service
mvn spring-boot:run
```

Em mudanças de API, atualize primeiro os contratos em `contracts/`, implemente
DTOs/validações, adicione testes e registre o impacto na documentação.

## Isolamento de dados

| Banco | Dono | Dados |
|---|---|---|
| `profile-db` | Profile Service | perfis, skills e portfólio |
| `project-db` | Project Service | usuários, projetos, decisões, chats, mensagens e notas |
| `match-db` | Match Orchestrator | dados auxiliares/resultados de matching |

Nenhum serviço consulta tabelas de outro serviço diretamente.
