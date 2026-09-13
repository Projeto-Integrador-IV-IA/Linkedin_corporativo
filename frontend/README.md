# Equipe Frontend

## Responsabilidade

Construir a interface do gestor e do colaborador. A aplicação deve consumir somente o API Gateway, nunca os microsserviços internos diretamente.

## Integração

Durante o desenvolvimento local, use:

```text
http://localhost:8080
```

Quando o frontend estiver em um container, o navegador continuará usando o endereço publicado do Gateway. Comunicação entre containers deve usar o nome do serviço, por exemplo `http://api-gateway:8080`.

Centralize a URL em uma variável de ambiente, como `VITE_API_BASE_URL`, e não espalhe URLs pelo código.

## Regras

- Não criar endpoints no frontend para substituir APIs do backend.
- Não acessar PostgreSQL diretamente.
- Usar os contratos em [`../contracts/`](../contracts/README.md).
- Não duplicar regras de cálculo do Match Score; o score vem do backend.
- Manter componentes, páginas, testes e estilos dentro de `frontend/`.
- Não commitar `node_modules/`, `dist/` ou arquivos `.env`.

## Pull Requests

Toda PR deve informar a tela alterada, o endpoint utilizado, como executar o frontend e se houve alteração de contrato.

O framework ainda deve ser escolhido pela equipe. Quando isso acontecer, adicionar `package.json`, Dockerfile e o serviço do frontend ao Compose em uma alteração própria.
