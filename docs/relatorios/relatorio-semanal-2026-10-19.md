# Relatório semanal — Synapse

**Período:** [preencher]  
**Kanban:** [Projeto Linkedin](https://github.com/orgs/Projeto-Integrador-IV-IA/projects/4)  
**Escopo deste relatório:** desenvolvimento da plataforma. A revisão do artigo
acadêmico não está incluída.

## Atividades realizadas na semana

### 1. Assistentes LLM para projetos, perfil e portfólio

- **Descrição:** implementação do backend com suporte aos provedores Gemini e
  NVIDIA e integração do assistente de escrita às descrições de oportunidades,
  apresentação profissional e projetos do portfólio. O fluxo permite responder
  perguntas, revisar, editar, aceitar ou continuar com a IA, respeitando o
  limite de três reformulações e o bloqueio de 24 horas.
- **Responsável:** [preencher]
- **Status:** concluída no escopo da primeira versão.
- **Tasks:** [#32 — arquitetura e contratos](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/32),
  [#33 — backend Gemini/NVIDIA](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/33),
  [#34 — assistente nos projetos](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/34) e
  [#35 — assistente no perfil e portfólio](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/35).
- **Pull Request:** [PR #43](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/pull/43).
- **Commit:** [b79cc7b](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/commit/b79cc7b8fb51d361842408784961f4fdf22817f4).
- **Observações:** a estrutura será revisada na próxima semana para separar os
  prompts e os formatos de saída por contexto de uso.

### 2. Recomendação baseada nas descrições

- **Descrição:** alteração do contrato do motor de recomendação para considerar
  a descrição do projeto e a descrição consolidada do perfil e do portfólio,
  retirando skills e pesos manuais do cálculo principal.
- **Responsável:** [preencher]
- **Status:** contrato e integração concluídos; treinamento do modelo textual v2
  em andamento.
- **Tasks:** [#11 — retirada de skills e pesos](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/11) e
  [#37 — contrato por descrições](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/37).
- **Pull Request:** [PR #43](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/pull/43).
- **Commit:** [b79cc7b](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/commit/b79cc7b8fb51d361842408784961f4fdf22817f4).
- **Observações:** o ML Engine utiliza uma alternativa textual de
  desenvolvimento até a publicação do novo artefato treinado.

### 3. Feed de oportunidades e manifestação de interesse

- **Descrição:** criação do feed com projetos abertos, cartões de tamanho fixo,
  modal de detalhes, identificação da pessoa responsável, contagem agregada de
  interessados e ação para registrar ou retirar interesse. O backend impede que
  a pessoa demonstre interesse no próprio projeto.
- **Responsável:** [preencher]
- **Status:** concluída.
- **Tasks:** [#40 — feed e interesse](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/40) e
  [#42 — responsável pelo projeto](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/42).
- **Pull Request:** [PR #43](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/pull/43).
- **Commit:** [b79cc7b](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/commit/b79cc7b8fb51d361842408784961f4fdf22817f4).
- **Observações:** somente a contagem é pública; a lista de interessados não é
  exposta no feed.

### 4. Dashboard administrativo de uso das LLMs

- **Descrição:** criação de painel administrativo com quantidade de chamadas,
  tokens de entrada e saída, taxa de sucesso, latência, projeção mensal e
  estimativa de custo baseada apenas em entrada e saída.
- **Responsável:** [preencher]
- **Status:** concluída.
- **Task:** [#41 — dashboard administrativo](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/41).
- **Pull Request:** [PR #43](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/pull/43).
- **Commit:** [b79cc7b](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/commit/b79cc7b8fb51d361842408784961f4fdf22817f4).
- **Observações:** custos de contexto em cache e raciocínio não são apresentados
  como categorias independentes no painel.

### 5. Reformulação visual, landing page e navegação

- **Descrição:** reformulação da identidade visual da Synapse, criação de
  landing page responsiva, páginas próprias de autenticação, navegação
  autenticada, tema e área de configurações.
- **Responsável:** [preencher]
- **Status:** concluída na implementação local.
- **Task:** [#44 — identidade visual e landing page](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/44).
- **Pull Request:** não existe até o momento.
- **Commit:** alterações locais ainda não versionadas.
- **Observações:** a task foi registrada como concluída no Kanban, mas ainda
  precisa ser relacionada ao próximo commit e PR.

### 6. Conta unificada para perfil e publicação de projetos

- **Descrição:** remoção da escolha entre candidato e recrutador no cadastro.
  Uma conta comum pode manter perfil profissional, publicar projetos e
  demonstrar interesse em projetos de outras pessoas. A administração continua
  separada.
- **Responsável:** [preencher]
- **Status:** concluída na implementação local.
- **Task:** [#46 — conta unificada](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/46).
- **Pull Request:** não existe até o momento.
- **Commit:** alterações locais ainda não versionadas.
- **Observações:** a propriedade do projeto é validada no backend para impedir
  interesse no próprio projeto e alterações em projetos de terceiros.

### 7. Chat flutuante integrado ao feed

- **Descrição:** ajuste do componente de mensagens para expandir verticalmente,
  manter a lista de conversas e abrir a conversa ao lado, permitindo consulta e
  resposta sem abandonar o feed.
- **Responsável:** [preencher]
- **Status:** concluída na implementação local.
- **Task:** [#47 — chat flutuante](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/47).
- **Pull Request:** não existe até o momento.
- **Commit:** alterações locais ainda não versionadas.
- **Observações:** permanece disponível o acesso à página completa de mensagens.

### 8. Troca e recuperação de senha

- **Descrição:** criação da troca autenticada de senha e do fluxo de recuperação
  com token temporário, link de uso único, página de redefinição e envio por
  SMTP. O ambiente local utiliza Mailpit para inspeção das mensagens.
- **Responsável:** [preencher]
- **Status:** em andamento.
- **Task:** [#45 — troca e recuperação de senha](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/45).
- **Pull Request:** não existe até o momento.
- **Commit:** alterações locais ainda não versionadas.
- **Observações:** falta validar a entrega em uma caixa postal real e automatizar
  os testes de expiração, reutilização e isolamento do token.

### 9. Segurança, métricas e validação dos assistentes

- **Descrição:** implementação de limites de entrada e saída, timeout, mensagens
  de erro seguras, telemetria sem conteúdo sensível e validação funcional dos
  principais fluxos de IA e recomendação.
- **Responsável:** [preencher]
- **Status:** parcialmente concluída e em andamento.
- **Tasks:** [#36 — segurança e testes das LLMs](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/36) e
  [#39 — validação integrada](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/39).
- **Pull Request:** [PR #43](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/pull/43) contém a base; os ajustes locais posteriores ainda não possuem PR.
- **Commit:** [b79cc7b](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/commit/b79cc7b8fb51d361842408784961f4fdf22817f4) contém a implementação inicial.
- **Observações:** faltam testes automatizados dos limites, validação controlada
  dos dois provedores, política de retenção e testes com o modelo textual v2.

## Atividades previstas para a próxima semana

### 1. Reestruturar a arquitetura dos assistentes LLM

- **Descrição:** separar regras de negócio, contexto da página, templates de
  prompt, chamada ao provedor, validação da resposta e telemetria.
- **Responsável:** [preencher]
- **Prioridade:** alta.
- **Task:** [#48 — arquitetura LLM v2](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/48).
- **Dependências:** implementação atual das tasks #33, #34, #35 e pendências de
  segurança da #36.
- **Observações:** preservar revisão humana, limite de versões e bloqueio de 24
  horas durante a migração.

### 2. Especializar prompts por página

- **Descrição:** criar prompts próprios para apresentação profissional, projeto
  de portfólio e oportunidade publicada, evitando perguntas genéricas ou
  repetidas.
- **Responsável:** [preencher]
- **Prioridade:** alta.
- **Task:** [#49 — prompts por contexto](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/49).
- **Dependência:** arquitetura definida na #48.
- **Observações:** os prompts não poderão inventar experiências, resultados ou
  requisitos ausentes no texto do usuário.

### 3. Padronizar as estruturas de texto

- **Descrição:** definir estruturas distintas para apresentação profissional,
  projetos do portfólio e oportunidades, mantendo os textos comparáveis para o
  motor de recomendação.
- **Responsável:** [preencher]
- **Prioridade:** alta.
- **Task:** [#50 — estruturas de texto](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/50).
- **Dependências:** #48 e #49.
- **Observações:** todo texto continuará sujeito à edição e à confirmação humana.

### 4. Continuar o retreinamento do motor de recomendação

- **Descrição:** selecionar e documentar o conjunto de dados, construir pares
  textuais, separar treino, validação e teste, comparar alternativas e avaliar o
  modelo com NDCG@10, MRR, cobertura e análise de vieses.
- **Responsável:** [preencher]
- **Prioridade:** alta.
- **Task:** [#38 — retreinamento textual](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/38).
- **Dependências:** conjunto de dados adequado, contrato textual atual e
  estrutura de texto da #50.
- **Observações:** as tags/skills não bloquearão o baseline somente textual.

### 5. Avaliar tags e skills sugeridas no perfil

- **Descrição:** estudar uma taxonomia controlada e permitir que a IA sugira
  tags com base apenas nos textos confirmados do perfil e do portfólio. A pessoa
  deverá aceitar, editar ou rejeitar cada sugestão.
- **Responsável:** [preencher]
- **Prioridade:** média.
- **Task:** [#51 — skills no perfil](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/51).
- **Dependências:** prompts e estruturas das #49 e #50.
- **Observações:** evitar skills inventadas, duplicidades e sinônimos não
  normalizados.

### 6. Avaliar tags e skills sugeridas nos projetos

- **Descrição:** sugerir tags a partir da descrição confirmada do projeto,
  diferenciando skills essenciais, desejáveis e apenas mencionadas, sem
  transformar a sugestão em requisito publicado automaticamente.
- **Responsável:** [preencher]
- **Prioridade:** média.
- **Task:** [#52 — skills nos projetos](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/52).
- **Dependências:** #49, #50 e alinhamento de taxonomia com a #51.
- **Observações:** as sugestões deverão apresentar evidência textual e permitir
  revisão individual.

### 7. Avaliar recomendação híbrida por textos e skills

- **Descrição:** comparar o baseline textual com uma alternativa que utilize
  tags confirmadas como sinal adicional, mantendo separadas as contribuições de
  texto e skills na explicação da pontuação.
- **Responsável:** [preencher]
- **Prioridade:** média e condicionada aos resultados anteriores.
- **Task:** [#53 — recomendação híbrida](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/53).
- **Dependências:** modelo textual da #38 e sugestões estruturadas das #51 e #52.
- **Observações:** a integração somente deverá ocorrer se houver ganho
  quantitativo e se o uso das tags não introduzir distorções no ranking.

### 8. Finalizar segurança, recuperação de senha e validação integrada

- **Descrição:** concluir a validação do SMTP externo, testes de tokens,
  isolamento entre usuários, limites das sessões LLM e testes ponta a ponta com
  a arquitetura revisada e o novo modelo.
- **Responsável:** [preencher]
- **Prioridade:** alta.
- **Tasks:** [#45 — recuperação de senha](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/45),
  [#36 — segurança das LLMs](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/36) e
  [#39 — validação integrada](https://github.com/Projeto-Integrador-IV-IA/Linkedin_corporativo/issues/39).
- **Dependências:** credenciais SMTP e dos provedores em ambiente controlado,
  conclusão da #48 e artefato treinado da #38.
- **Observações:** registrar evidências reproduzíveis e relacionar os resultados
  ao futuro PR.

## Pendências de versionamento

As alterações de interface, conta unificada, chat e recuperação de senha ainda
estão no diretório de trabalho local. Por isso, as tasks #44, #45, #46 e #47 não
possuem commit nem Pull Request associado até o momento. Esses links devem ser
incluídos no relatório após o versionamento e a abertura do PR.
