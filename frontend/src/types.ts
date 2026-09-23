export interface Colaborador {
  id: number
  name: string
  email: string
  title: string | null
  phone: string | null
  objective: string | null
  skills: string[]
}

export interface AuthResponse {
  token: string
  colaborador: Colaborador
}

export interface Project {
  id: number
  title: string
  description: string | null
  status: string
  requiredSkills: string[]
  createdAt: string
}

export interface Recommendation {
  colaboradorId: number
  name: string
  score: number
  matchedSkills: string[]
  skillGaps: string[]
}

export interface RecommendationResponse {
  projectId: number
  projectTitle: string | null
  results: Recommendation[]
}
