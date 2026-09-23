# Frontend do LinkedIn Corporativo

Frontend do MVP criado em Next.js. A aplicação usa o Gateway como única
entrada do backend e oferece login, perfil, projetos, recomendações e chat.

## Telas e fluxos

- **Login e cadastro**: autenticação e criação de usuário.
- **Meu Perfil**: dados pessoais, skills, portfólio e foto.
- **Projetos**: lista dos projetos do recrutador, criação, edição e acesso aos
  detalhes.
- **Detalhes do projeto**: recomendações ordenadas pelo score, porcentagem de
  correspondência, foto do profissional e ações de aceitar, rejeitar e chat.
- **Chats**: conversas em layout responsivo, lista lateral, mensagens,
  perfil do profissional e notas particulares do recrutador.
- **Tema visual**: alternância entre modo claro e escuro, com paleta baseada
  no azul-marinho e ciano da identidade Synapse.

As mensagens são atualizadas automaticamente a cada dois segundos. O contador
de não lidas e o som de notificação são atualizados sem recarregar a página.
O som depende de uma primeira interação do usuário por regra dos navegadores.

O tema escolhido pelo usuário é salvo em `localStorage` com a chave
`synapse-theme` e permanece após recarregar ou fechar o navegador. A logo clara
é usada sobre fundos escuros e a logo escura sobre fundos claros.

## Tecnologias

- Next.js e React;
- TypeScript;
- Tailwind CSS e componentes Radix/shadcn;
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
