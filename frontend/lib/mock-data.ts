import type { Profile, Project } from "./types"

export const initialProfiles: Profile[] = [
  {
    id: "p-current",
    name: "Ana Beatriz Souza",
    profession: "Engenheira de Software Frontend",
    education: "Bacharelado em Ciência da Computação — USP",
    projects:
      "Redesign do portal do cliente, migração de legado para React, design system interno.",
    skills: [
      { id: "s1", name: "React", level: "Avançado" },
      { id: "s2", name: "TypeScript", level: "Avançado" },
      { id: "s3", name: "Node.js", level: "Intermediário" },
      { id: "s4", name: "UX Design", level: "Básico" },
    ],
  },
  {
    id: "p-2",
    name: "Carlos Mendes",
    profession: "Cientista de Dados",
    education: "Mestrado em Estatística — UFRJ",
    projects: "Modelos de previsão de churn, pipeline de dados em tempo real.",
    skills: [
      { id: "s5", name: "Python", level: "Avançado" },
      { id: "s6", name: "Machine Learning", level: "Avançado" },
      { id: "s7", name: "SQL", level: "Intermediário" },
      { id: "s8", name: "Node.js", level: "Básico" },
    ],
  },
  {
    id: "p-3",
    name: "Juliana Rocha",
    profession: "Engenheira Full Stack",
    education: "Bacharelado em Engenharia de Computação — Unicamp",
    projects: "Plataforma de pagamentos, APIs de integração bancária.",
    skills: [
      { id: "s9", name: "React", level: "Intermediário" },
      { id: "s10", name: "TypeScript", level: "Intermediário" },
      { id: "s11", name: "Node.js", level: "Avançado" },
      { id: "s12", name: "SQL", level: "Avançado" },
    ],
  },
  {
    id: "p-4",
    name: "Pedro Antunes",
    profession: "Product Designer",
    education: "Bacharelado em Design — PUC-Rio",
    projects: "Pesquisa de usuário, prototipação e design system de produto.",
    skills: [
      { id: "s13", name: "UX Design", level: "Avançado" },
      { id: "s14", name: "Figma", level: "Avançado" },
      { id: "s15", name: "React", level: "Básico" },
    ],
  },
  {
    id: "p-5",
    name: "Marina Lima",
    profession: "Engenheira de Machine Learning",
    education: "Doutorado em Inteligência Artificial — UFMG",
    projects: "Sistemas de recomendação, NLP para atendimento automatizado.",
    skills: [
      { id: "s16", name: "Python", level: "Avançado" },
      { id: "s17", name: "Machine Learning", level: "Intermediário" },
      { id: "s18", name: "SQL", level: "Intermediário" },
      { id: "s19", name: "React", level: "Básico" },
    ],
  },
]

export const initialProjects: Project[] = [
  {
    id: "proj-1",
    title: "Nova plataforma de recomendação interna",
    description:
      "Construir o frontend e a API do motor de recomendação de perfis. Buscamos alguém forte em React e com experiência em integração de serviços.",
    requirements: [
      { id: "r1", name: "React", minLevel: "Avançado" },
      { id: "r2", name: "TypeScript", minLevel: "Intermediário" },
      { id: "r3", name: "Node.js", minLevel: "Intermediário" },
    ],
  },
  {
    id: "proj-2",
    title: "Pesquisa de modelos preditivos de retenção",
    description:
      "Iniciativa de dados para prever retenção de clientes usando aprendizado de máquina e análise de grandes volumes de dados.",
    requirements: [
      { id: "r4", name: "Python", minLevel: "Avançado" },
      { id: "r5", name: "Machine Learning", minLevel: "Avançado" },
      { id: "r6", name: "SQL", minLevel: "Intermediário" },
    ],
  },
]

export const CURRENT_PROFILE_ID = "p-current"
