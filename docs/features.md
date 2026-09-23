# Funcionalidades do MVP

Este documento descreve o comportamento disponível para recrutadores e
profissionais na versão atual do sistema.

## Acesso e permissões

- O usuário cria uma conta com e-mail, nome, senha e perfil (`RECRUITER` ou
  `CANDIDATE`).
- O login retorna um token Bearer usado pelo frontend nas chamadas ao Gateway.
- A senha precisa ter pelo menos seis caracteres.
- Cada recrutador pode criar, editar, consultar e excluir somente os próprios
  projetos. Projetos legados sem proprietário são associados ao proprietário
  correspondente pelo e-mail da sessão quando isso é possível.
- A sessão atual é recuperada pela API de autenticação e o frontend redireciona
  usuários não autenticados para o login.

## Perfil profissional

O perfil pode conter nome, e-mail, profissão, formação, experiência, biografia,
skills, portfólio e foto. A foto é selecionada no navegador e enviada como uma
`data URL` de imagem; o limite atual do frontend é 512 KB. Ela aparece no perfil,
nas recomendações e nas conversas.

O Profile Service mantém o PostgreSQL como fonte de verdade e usa Redis para
cachear a lista de perfis, perfis individuais e skills por 60 segundos. Se o
Redis estiver indisponível, a consulta continua usando o banco.

## Identidade visual e temas

O frontend oferece alternância entre modo claro e modo escuro no cabeçalho e
na tela de autenticação. A paleta usa azul-marinho para superfícies e textos
principais e ciano para destaque, acompanhando as logos Synapse. A preferência
fica salva no navegador e as versões clara/escura da logo são alternadas junto
com o tema.

## Projetos

Na aba **Projetos**, o recrutador visualiza apenas os projetos que possui e
pode:

1. criar um projeto com título, descrição, localização, modalidade, faixa
   salarial e skills obrigatórias/desejáveis;
2. abrir a página de detalhes;
3. editar os dados do projeto;
4. consultar as recomendações;
5. excluir o projeto.

O fluxo substitui a antiga aba de correlação por uma navegação centrada em
projetos. O detalhe do projeto também exibe as decisões tomadas sobre os
profissionais.

## Recomendação supervisionada

O Match Orchestrator combina dados do projeto, perfil e histórico e chama o ML
Engine. O modelo é um `XGBRanker` treinado com candidaturas históricas:

- relevância `1`: candidatura observada;
- relevância `0`: vaga negativa amostrada para o mesmo usuário e período;
- consulta de ranking: usuário e janela temporal;
- saída: profissionais ordenados do maior para o menor score.

Cada recomendação mostra uma porcentagem de correspondência de 0 a 100. Essa
porcentagem representa a probabilidade calibrada de candidatura histórica,
não uma garantia de contratação. O cartão do profissional permite abrir o
perfil, iniciar um chat, aceitar ou rejeitar.

Ao rejeitar, o profissional deixa de aparecer na lista ativa daquele projeto,
mas a decisão fica salva no histórico. É possível consultar o histórico e
alterar a decisão posteriormente, inclusive para reconsiderar um rejeitado.

## Chat e notificações

Há dois pontos de entrada para mensagens:

- botão **Chat** no cartão de uma recomendação, que abre uma janela flutuante
  no canto inferior;
- aba **Chats**, com conversas no estilo WhatsApp: lista de conversas à
  esquerda e conversa selecionada à direita.

As mensagens são gravadas no Project Service. O destinatário é resolvido pelo
perfil associado ou pelo e-mail informado no cadastro, para que o usuário
correto receba a mesma conversa.

O frontend atualiza as conversas automaticamente a cada dois segundos, sem
exigir recarregar a página. Mensagens não lidas atualizam o contador e o badge
da navegação. Um som de notificação é produzido via Web Audio depois que o
usuário já interagiu com a página, respeitando as restrições dos navegadores.

O layout se adapta a telas menores: no celular a lista de conversas e a
conversa alternam a área principal, e a janela flutuante ocupa a largura
disponível.

## Notas particulares

Na área de detalhes do profissional dentro do chat, o recrutador pode salvar
notas particulares. Elas pertencem ao recrutador e à conversa/profissional e
não são exibidas ao destinatário nem a outro recrutador.

## Limitações conhecidas

- A atualização de mensagens usa polling, não WebSocket ou SSE.
- A notificação atual é interna ao navegador: badge e som; não há push,
  e-mail ou notificação de sistema.
- O som precisa de uma primeira interação do usuário para ser liberado pelo
  navegador.
- A foto fica armazenada como `data URL` no PostgreSQL. Isso simplifica o MVP,
  mas para produção é recomendável migrar para armazenamento de objetos e
  salvar apenas uma URL.
