# Notas da revisão do artigo

## Alterações de conteúdo

- `matching` foi substituído por **compatibilidade**, **recomendação**,
  **correspondência textual** ou **relação entre profissionais e projetos**,
  conforme o contexto;
- a revisão sistemática foi retirada: o método agora declara corretamente uma
  pesquisa bibliográfica narrativa;
- a metodologia deixou de ser uma lista de nove etapas e passou a descrever,
  em sequência contínua, problema, construção, mudanças de escopo e validação;
- foi criada uma seção de resultados que apresenta somente fluxos existentes no
  repositório;
- foi acrescentada uma captura do feed atual como evidência visual do protótipo
  em execução;
- foram retiradas afirmações de comparação entre Regressão Logística, Random
  Forest e XGBoost, métricas ainda não obtidas, uso de JWT, diferenciação entre
  profissional e recrutador e monitoramento por n8n;
- o artigo agora registra que o modelo textual da versão atual ainda precisa ser
  treinado e avaliado;
- a arquitetura de microsserviços foi justificada pelo contexto do projeto e
  teve seu custo operacional reconhecido;
- o texto passou a refletir conta única, feed, interesse, chat, escrita assistida
  por LLM, recuperação de senha e recomendação baseada somente em descrições.

## Auditoria das referências antigas

- **Ray et al. (2024):** mantida, com o DOI corrigido de
  `10.1177/01492063231193360` para `10.1177/01492063231180826`;
- **Rao et al. (2024):** retirada. O documento indicado é assinado por Dagmar
  Christianson, não por Shishir Rao;
- **OECD (2024):** retirada. O DOI informado corresponde a uma publicação de
  2026 e o recorte específico da função pública francesa não sustentava as
  generalizações feitas no texto;
- **Gurung e Abbass (2026):** retirada por não representar o método implementado.
  A referência existe, mas as páginas corretas são 1292--1297, e não 1--6;
- **Tang et al. (2025):** mantida e utilizada apenas para fundamentar
  explicabilidade e cautela em recomendações pessoa--oportunidade;
- **Pressman e Maxim (2021):** mantida como referência de desenvolvimento de
  software, com ISBN corrigido;
- **conjunto de dados da HSE/Kaggle:** retirado, pois pertence ao plano anterior
  e não corresponde ao contrato atual baseado exclusivamente em descrições.

## Referências acrescentadas

- Bian et al. (2019), para compatibilidade textual entre descrições profissionais
  e descrições de oportunidades;
- Pahl e Jamshidi (2016), para caracterização e discussão de microsserviços;
- Peffers et al. (2007), para fundamentar a ciência do projeto;
- Brasil (2018), para a discussão sobre proteção de dados pessoais.

## Uso no Overleaf

Envie `artigo.tex`, `referencias.bib` e a pasta `figuras` ao mesmo projeto que
contém `sbc-template.sty` e `sbc.bst`. O arquivo principal deve ser
`artigo.tex`. A bibliografia já está configurada como
`\bibliography{referencias}`.
