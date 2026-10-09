import type { Profile, Project } from "./types"

export const initialProfiles: Profile[] = [
  {
    id: "p-current",
    name: "Ana Beatriz Souza",
    profession: "Engenheira de Software Frontend",
    education: "Bacharelado em Ciência da Computação — USP",
    projects: "Engenheira de software especializada em produtos web acessíveis e de alto desempenho. Atua na modernização de aplicações legadas, construção de design systems e integração de interfaces com APIs, acompanhando métricas de experiência, qualidade e velocidade de entrega.",
    portfolioProjects: [
      { id: "portfolio-ana-1", title: "Modernização do portal de clientes", description: "Liderou a migração gradual de um portal legado para uma arquitetura moderna em React e TypeScript. Estruturou componentes reutilizáveis, testes automatizados e monitoramento de desempenho, reduzindo falhas de interface e melhorando o tempo de carregamento das jornadas mais utilizadas." },
      { id: "portfolio-ana-2", title: "Design system corporativo", description: "Planejou e implantou um design system compartilhado por diferentes equipes de produto. Documentou padrões de acessibilidade, estados de interação e critérios de uso, apoiando a adoção dos componentes e tornando as entregas visuais mais consistentes." },
    ],
  },
  {
    id: "p-2",
    name: "Carlos Mendes",
    profession: "Cientista de Dados",
    education: "Mestrado em Estatística — UFRJ",
    projects: "Cientista de dados com experiência em transformar problemas de negócio em análises e modelos preditivos mensuráveis. Trabalha com preparação de dados, experimentação, validação estatística, monitoramento de modelos e comunicação dos resultados para áreas técnicas e executivas.",
    portfolioProjects: [
      { id: "portfolio-carlos-1", title: "Previsão de cancelamento de clientes", description: "Desenvolveu um modelo de propensão ao cancelamento a partir de dados de uso, atendimento e cobrança. Definiu a metodologia de validação, explicou os principais fatores de risco e integrou os resultados a uma rotina de priorização para o time de retenção." },
      { id: "portfolio-carlos-2", title: "Monitoramento de modelos em produção", description: "Criou indicadores de qualidade, estabilidade dos dados e degradação de desempenho para modelos já publicados. O acompanhamento passou a sinalizar mudanças de comportamento e orientar ciclos de reavaliação antes de impactos relevantes no negócio." },
    ],
  },
  {
    id: "p-3",
    name: "Juliana Rocha",
    profession: "Engenheira Full Stack",
    education: "Bacharelado em Engenharia de Computação — Unicamp",
    projects: "Engenheira full stack com atuação em sistemas transacionais, integrações financeiras e aplicações web. Participa desde o desenho da solução até a operação, com atenção a segurança, rastreabilidade, consistência de dados, experiência do usuário e evolução sustentável do produto.",
    portfolioProjects: [
      { id: "portfolio-juliana-1", title: "Plataforma de pagamentos empresariais", description: "Implementou jornadas de pagamento e conciliação integradas a diferentes instituições financeiras. Tratou idempotência, retentativas, auditoria e estados de transação, além de criar telas operacionais para acompanhamento e resolução de ocorrências." },
      { id: "portfolio-juliana-2", title: "Portal de gestão de contratos", description: "Construiu um portal para centralizar contratos, aprovações e notificações. Organizou APIs, regras de acesso e histórico de alterações, simplificando a colaboração entre áreas jurídicas, financeiras e comerciais." },
    ],
  },
  {
    id: "p-4",
    name: "Pedro Antunes",
    profession: "Product Designer",
    education: "Bacharelado em Design — PUC-Rio",
    projects: "Product designer dedicado a compreender problemas reais dos usuários e transformá-los em fluxos claros e inclusivos. Conduz pesquisa, síntese de evidências, prototipação e validação de soluções, trabalhando próximo a produto e engenharia para acompanhar resultados após o lançamento.",
    portfolioProjects: [
      { id: "portfolio-pedro-1", title: "Redesenho da jornada de contratação", description: "Mapeou dúvidas e abandonos por entrevistas, análise de atendimento e testes de usabilidade. Reorganizou a navegação, simplificou formulários e validou os protótipos com usuários antes da implementação da nova experiência." },
      { id: "portfolio-pedro-2", title: "Biblioteca de padrões de produto", description: "Estruturou padrões de conteúdo, componentes e acessibilidade para múltiplas equipes. A documentação incluiu orientações de decisão, exemplos de uso e critérios de qualidade para apoiar designers e desenvolvedores." },
    ],
  },
  {
    id: "p-5",
    name: "Marina Lima",
    profession: "Engenheira de Machine Learning",
    education: "Doutorado em Inteligência Artificial — UFMG",
    projects: "Engenheira de machine learning com experiência em sistemas de recomendação e processamento de linguagem natural. Desenvolve soluções desde a exploração dos dados até a publicação e o monitoramento, avaliando qualidade, latência, explicabilidade e impacto para o usuário final.",
    portfolioProjects: [
      { id: "portfolio-marina-1", title: "Sistema de recomendação personalizado", description: "Desenvolveu um serviço de recomendação que combina comportamento recente, histórico de preferências e contexto de navegação. Estruturou avaliações offline e testes controlados para comparar alternativas e acompanhar diversidade e relevância dos resultados." },
      { id: "portfolio-marina-2", title: "Classificação automática de atendimentos", description: "Criou um pipeline de linguagem natural para classificar solicitações e encaminhá-las ao time adequado. Organizou a rotulagem, avaliou erros recorrentes e implantou monitoramento para identificar mudanças no vocabulário dos usuários." },
    ],
  },
]

export const initialProjects: Project[] = [
  { id: "proj-1", title: "Nova plataforma de recomendação interna", description: "Desenvolver uma plataforma web para recomendar profissionais a oportunidades internas a partir das descrições de carreira e dos projetos realizados. A pessoa atuará na experiência do recrutador, integração com APIs, qualidade do código, acessibilidade e acompanhamento do comportamento da solução em produção." },
  { id: "proj-2", title: "Pesquisa de modelos preditivos de retenção", description: "Investigar e validar modelos capazes de antecipar risco de cancelamento de clientes. O trabalho envolve compreender os dados disponíveis, definir métricas, conduzir experimentos, explicar os fatores relevantes e colaborar com o time de negócio na transformação dos resultados em ações de retenção." },
]

export const CURRENT_PROFILE_ID = "p-current"
