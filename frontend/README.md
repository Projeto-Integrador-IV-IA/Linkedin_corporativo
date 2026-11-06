# Synapse — Frontend

Frontend criado em Next.js, com landing page pública e espaço de trabalho responsivo. A aplicação usa o Gateway como única
entrada do backend e oferece login, perfil, projetos, recomendações, chat e
dashboard administrativo de uso das LLMs.

## Telas e fluxos

- **Landing page (`/`)**: apresentação da plataforma, prévia ilustrativa do produto, animações de entrada, etapas de uso e perguntas frequentes.
- **Login e cadastro (`/login`, `/register`)**: autenticação, criação de usuário e controle de visibilidade da senha. Após autenticação, usuários vão para o feed e administradores para o dashboard.
- **Senha e recuperação (`/settings`, `/forgot-password`, `/reset-password`)**: troca autenticada com senha atual e recuperação por link de e-mail de uso único.
- **Meu Perfil**: dados pessoais, descrição profissional, portfólio e foto.
- **Projetos**: lista dos projetos do recrutador, criação, edição e acesso aos
  detalhes.
- **Detalhes do projeto**: recomendações ordenadas pelo score, filtros por
  aderência e interesse, limite de profissionais exibidos, índice de aderência
  em pontos, foto do profissional e ações de aceitar, rejeitar e chat.
- **Chats**: conversas em layout responsivo, lista lateral, mensagens,
  perfil do profissional e notas particulares do recrutador.
- **Dashboard administrativo**: tokens de entrada/saída/cache/raciocínio,
  latência, falhas, custos configuráveis e projeção mensal.
- **Oportunidades**: feed de projetos abertos para profissionais, contagem
  agregada e botão para demonstrar ou retirar interesse.
- **Configurações (`/settings`)**: dados da conta, aparência, som de mensagens e saída da sessão atual. Disponível também para administradores.
- **Tema visual**: verde profundo, superfícies claras e detalhes em verde suave; modo escuro compartilhado por todas as telas internas. A landing mantém sua apresentação clara.
- **Busca e filtros**: pesquisa por descrição, projeto ou pessoa no feed; aba de interesses; ordenação por interesse; busca e filtro de projetos abertos; pesquisa de conversas.
- **Navegação responsiva**: menu lateral no desktop, navegação inferior no celular e chat flutuante que mantém a lista ao lado da conversa em telas maiores.

As mensagens são atualizadas automaticamente a cada dois segundos. O contador
de não lidas e o som de notificação são atualizados sem recarregar a página.
O som depende de uma primeira interação do usuário por regra dos navegadores.

O tema escolhido pelo usuário é salvo em `localStorage` com a chave
`synapse-theme` e permanece após recarregar ou fechar o navegador. A preferência
de som usa `synapse-notification-sound`. Ambas são locais ao navegador.
Animações respeitam `prefers-reduced-motion`. Ilustrações da landing são feitas
em HTML/CSS/SVG e identificadas como prévias, sem números de clientes ou avaliações fictícias.

As configurações de sessão oferecem a saída local já suportada pela aplicação;
não representam gerenciamento remoto de dispositivos ou autenticação em dois fatores.

## Tecnologias

- Next.js e React;
- TypeScript;
- Tailwind CSS e componentes Base UI/shadcn;
- `pnpm` como gerenciador local;
- API Gateway em `http://localhost:8080`.

## Desenvolvimento local

Com o backend executando pelo Compose:

```bash
pnpm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api pnpm dev
```

Acesse `http://localhost:3000`.

Para verificar os tipos:

```bash
pnpm exec tsc --noEmit
```

Para executar o frontend pelo ambiente oficial:

```bash
docker compose up --build frontend
```

## Configuração e sessão

O endereço da API é definido por `NEXT_PUBLIC_API_BASE_URL`. O token de login
fica no `localStorage` do navegador e é enviado como Bearer nas chamadas
protegidas. Ao sair, o token é removido.

## Fotos de perfil

O componente de formulário aceita PNG, JPEG ou WebP de até 512 KB. O arquivo é
convertido para uma `data URL`, enviada ao Profile Service e exibida por um
componente compartilhado no perfil, nas recomendações e no chat. Essa é uma
decisão adequada ao MVP; uma futura versão deve usar armazenamento de objetos.

## Organização

- `app/`: páginas e layouts do Next.js;
- `components/`: formulários, avatar, cards, chat e navegação;
- `lib/`: cliente HTTP, tipos e utilitários;
- `public/`: arquivos estáticos.

Para o comportamento funcional completo, consulte
[`../docs/features.md`](../docs/features.md) e, para os endpoints,
[`../docs/api.md`](../docs/api.md).

Em Compose, os e-mails de desenvolvimento são enviados ao Mailpit em
`http://localhost:8025`. Para enviar e-mails reais, configure as variáveis SMTP
e `APP_PUBLIC_URL` descritas em [`.env.example`](../.env.example).
