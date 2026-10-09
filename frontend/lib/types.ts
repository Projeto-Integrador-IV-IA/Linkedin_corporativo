export interface PortfolioProject {
  id: string
  title: string
  description: string
  sourceProjectId?: string
}

export interface Profile {
  id: string
  avatarUrl?: string
  email?: string
  name: string
  profession: string
  education: string
  projects: string
  portfolioProjects?: PortfolioProject[]
}

export interface Project {
  id: string
  title: string
  description: string
  area?: string
  ownerName?: string
  ownerAvatarUrl?: string
  ownerEmail?: string
  status?: string
  interestedCount?: number
}

export interface MatchResult {
  profile: Profile
  score: number
  textScore: number
  interestBoost: number
  interested: boolean
}
