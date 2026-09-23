export type SkillLevel = "Básico" | "Intermediário" | "Avançado"

export const SKILL_LEVELS: SkillLevel[] = ["Básico", "Intermediário", "Avançado"]

export interface Skill {
  id: string
  skillId?: string
  name: string
  level: SkillLevel
}

export interface Profile {
  id: string
  avatarUrl?: string
  email?: string
  name: string
  profession: string
  education: string
  projects: string
  skills: Skill[]
}

export interface Requirement {
  id: string
  name: string
  minLevel: SkillLevel
}

export interface Project {
  id: string
  title: string
  description: string
  requirements: Requirement[]
  area?: string
  ownerName?: string
  ownerEmail?: string
  status?: string
}

export interface SkillMatch {
  name: string
  candidateLevel: SkillLevel
  requiredLevel: SkillLevel
  meetsLevel: boolean
}

export interface MatchResult {
  profile: Profile
  score: number
  matchedSkills: SkillMatch[]
  missingSkills: string[]
}
