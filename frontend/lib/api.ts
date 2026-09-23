import type { MatchResult, Profile, Project, SkillLevel } from "./types"

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api"
).replace(/\/$/, "")

type RemoteSkill = {
  id: number
  skillId?: number
  skillName?: string
  name?: string
  proficiencyLevel?: string
}

type RemoteProfile = {
  id: number
  fullName: string
  email: string
  avatarUrl?: string
  profession?: string
  educationLevel?: string
  yearsOfExperience?: number
  bio?: string
  skills?: RemoteSkill[]
  portfolioProjects?: { title?: string; description?: string }[]
}

type RemoteProject = {
  id: number
  title: string
  description?: string
  requiredSkills?: { id: number; skillName: string; requiredLevel?: string }[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set("Content-Type", "application/json")
  if (typeof window !== "undefined") {
    const token = window.localStorage.getItem("talentmatch_token")
    if (token) headers.set("Authorization", `Bearer ${token}`)
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `Erro ${response.status} ao acessar a API.`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

function levelFromApi(value?: string): SkillLevel {
  const normalized = (value ?? "").toUpperCase()
  if (normalized === "AVANCADO" || normalized === "ESPECIALISTA") return "Avançado"
  if (normalized === "INTERMEDIARIO") return "Intermediário"
  return "Básico"
}

function levelToApi(value: SkillLevel) {
  if (value === "Avançado") return "AVANCADO"
  if (value === "Intermediário") return "INTERMEDIARIO"
  return "BASICO"
}

export function mapProfile(profile: RemoteProfile): Profile {
  return {
    id: String(profile.id),
    avatarUrl: profile.avatarUrl ?? "",
    email: profile.email ?? "",
    name: profile.fullName ?? "",
    profession: profile.profession ?? "",
    education: profile.educationLevel ?? "",
    projects:
      ((profile.portfolioProjects ?? [])
        .map((project) => [project.title, project.description].filter(Boolean).join(" — "))
        .join("\n") || profile.bio || ""),
    skills: (profile.skills ?? []).map((skill) => ({
      id: String(skill.id ?? skill.skillId),
      skillId: String(skill.skillId ?? skill.id),
      name: skill.skillName ?? skill.name ?? "",
      level: levelFromApi(skill.proficiencyLevel),
    })),
  }
}

export function mapProject(project: RemoteProject): Project {
  return {
    id: String(project.id),
    title: project.title ?? "",
    description: project.description ?? "",
    requirements: (project.requiredSkills ?? []).map((skill) => ({
      id: String(skill.id),
      name: skill.skillName,
      minLevel: levelFromApi(skill.requiredLevel),
    })),
    area: (project as RemoteProject & { area?: string }).area ?? "",
    ownerName: (project as RemoteProject & { ownerName?: string }).ownerName ?? "",
    ownerEmail: (project as RemoteProject & { ownerEmail?: string }).ownerEmail ?? "",
    status: (project as RemoteProject & { status?: string }).status ?? "ABERTO",
  }
}

export function listProfiles() {
  return request<RemoteProfile[]>("/profiles").then((profiles) => profiles.map(mapProfile))
}

export function createProfile(profile: Profile) {
  return request<RemoteProfile>("/profiles", {
    method: "POST",
    body: JSON.stringify({
      fullName: profile.name,
      email: profile.email ?? "",
      profession: profile.profession,
      educationLevel: profile.education,
      bio: profile.projects,
      yearsOfExperience: 0,
      avatarUrl: profile.avatarUrl ?? "",
    }),
  }).then(mapProfile)
}

export function updateProfile(profile: Profile) {
  return request<RemoteProfile>(`/profiles/${profile.id}`, {
    method: "PUT",
    body: JSON.stringify({
      fullName: profile.name,
      email: profile.email ?? "",
      profession: profile.profession,
      educationLevel: profile.education,
      bio: profile.projects,
      yearsOfExperience: 0,
      avatarUrl: profile.avatarUrl ?? "",
    }),
  }).then(mapProfile)
}

export function listProjects() {
  return request<RemoteProject[]>("/projects").then((projects) => projects.map(mapProject))
}

export function createProject(project: Project, owner: Profile) {
  return request<RemoteProject>("/projects", {
    method: "POST",
    body: JSON.stringify({
      title: project.title,
      description: project.description,
      area: "",
      ownerName: owner.name,
      ownerEmail: owner.email ?? "",
    }),
  }).then(mapProject)
}

export function updateProject(project: Project, owner: Profile) {
  return request<RemoteProject>(`/projects/${project.id}`, {
    method: "PUT",
    body: JSON.stringify({
      title: project.title,
      description: project.description,
      area: project.area ?? "",
      ownerName: project.ownerName || owner.name,
      ownerEmail: project.ownerEmail || owner.email || "",
    }),
  }).then(mapProject)
}

export function addRequiredSkill(projectId: string, name: string, level: SkillLevel) {
  return request<RemoteProject>(`/projects/${projectId}/required-skills`, {
    method: "POST",
    body: JSON.stringify({ skillName: name, requiredLevel: levelToApi(level) }),
  }).then(mapProject)
}

export function removeRequiredSkill(projectId: string, skillId: string) {
  return request<void>(`/projects/${projectId}/required-skills/${skillId}`, { method: "DELETE" })
}

export function listRecommendations(projectId: string) {
  return request<{
    results: { candidate_id: string; score: number; matched_skills?: string[]; skill_gaps?: string[] }[]
  }>(`/matches/projects/${projectId}`)
}

export function listSkills() {
  return request<{ id: number; name: string }[]>("/skills")
}

export function createSkill(name: string) {
  return request<{ id: number; name: string }>("/skills", {
    method: "POST",
    body: JSON.stringify({ name }),
  })
}

export function addProfileSkill(profileId: string, skillId: string, level: SkillLevel) {
  return request<RemoteProfile>(`/profiles/${profileId}/skills`, {
    method: "POST",
    body: JSON.stringify({ skillId: Number(skillId), proficiencyLevel: levelToApi(level), yearsOfExperience: 0 }),
  }).then(mapProfile)
}

export function removeProfileSkill(profileId: string, skillId: string) {
  return request<void>(`/profiles/${profileId}/skills/${skillId}`, { method: "DELETE" })
}

export function skillLevelToApi(level: SkillLevel) {
  return levelToApi(level)
}

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: string
  profileId?: string
  token: string
}

function saveAuth(response: AuthUser) {
  if (typeof window !== "undefined" && response.token) window.localStorage.setItem("talentmatch_token", response.token)
  return { ...response, id: String(response.id), profileId: response.profileId ? String(response.profileId) : undefined }
}

export function login(email: string, password: string) {
  return request<AuthUser>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }).then(saveAuth)
}

export function register(email: string, password: string, displayName: string) {
  return request<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName, role: "RECRUITER" }),
  }).then(saveAuth)
}

export function me() {
  return request<AuthUser>("/auth/me").then((response) => ({ ...response, id: String(response.id), profileId: response.profileId ? String(response.profileId) : undefined }))
}

export function logout() {
  if (typeof window !== "undefined") window.localStorage.removeItem("talentmatch_token")
}

export function linkProfile(profileId: string) {
  return request<AuthUser>("/auth/profile", { method: "PATCH", body: JSON.stringify({ profileId: Number(profileId) }) }).then((response) => ({ ...response, id: String(response.id), profileId: String(profileId) }))
}

export interface CandidateDecision {
  id: string
  profileId: string
  status: "PENDENTE" | "ACEITO" | "REJEITADO"
  updatedAt: string
}

export function listCandidateDecisions(projectId: string) {
  return request<CandidateDecision[]>(`/projects/${projectId}/candidate-decisions`).then((items) => items.map((item) => ({ ...item, id: String(item.id), profileId: String(item.profileId) })))
}

export function decideCandidate(projectId: string, profileId: string, status: CandidateDecision["status"]) {
  return request<CandidateDecision>(`/projects/${projectId}/candidate-decisions/${profileId}`, {
    method: "POST",
    body: JSON.stringify({ status }),
  }).then((item) => ({ ...item, id: String(item.id), profileId: String(item.profileId) }))
}

export interface ChatConversation {
  id: string
  projectId: string
  projectTitle: string
  recruiterUserId: string
  professionalProfileId: string
  professionalName: string
  professionalEmail: string
  updatedAt: string
  unreadCount: number
}

export interface ChatMessage {
  id: string
  conversationId: string
  senderUserId: string
  content: string
  createdAt: string
}

export function listChats() {
  return request<ChatConversation[]>("/chats").then((items) => items.map((item) => ({
    ...item,
    id: String(item.id),
    projectId: String(item.projectId),
    recruiterUserId: String(item.recruiterUserId),
    professionalProfileId: String(item.professionalProfileId),
    unreadCount: Number(item.unreadCount ?? 0),
  })))
}

export function createChat(projectId: string, professionalProfileId: string, professionalName: string, professionalEmail?: string) {
  return request<ChatConversation>("/chats", {
    method: "POST",
    body: JSON.stringify({ projectId: Number(projectId), professionalProfileId: Number(professionalProfileId), professionalName, professionalEmail: professionalEmail ?? "" }),
  }).then((item) => ({ ...item, id: String(item.id), projectId: String(item.projectId), recruiterUserId: String(item.recruiterUserId), professionalProfileId: String(item.professionalProfileId), unreadCount: Number(item.unreadCount ?? 0) }))
}

export function listMessages(conversationId: string) {
  return request<ChatMessage[]>(`/chats/${conversationId}/messages`).then((items) => items.map((item) => ({ ...item, id: String(item.id), conversationId: String(item.conversationId), senderUserId: String(item.senderUserId) })))
}

export function sendMessage(conversationId: string, content: string) {
  return request<ChatMessage>(`/chats/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ content }) }).then((item) => ({ ...item, id: String(item.id), conversationId: String(item.conversationId), senderUserId: String(item.senderUserId) }))
}

export function getRecruiterNote(conversationId: string) {
  return request<{ content: string }>(`/chats/${conversationId}/note`)
}

export function saveRecruiterNote(conversationId: string, content: string) {
  return request<{ content: string }>(`/chats/${conversationId}/note`, { method: "PUT", body: JSON.stringify({ content }) })
}

export type ApiMatch = Awaited<ReturnType<typeof listRecommendations>>["results"][number]

export function toMatchResult(result: ApiMatch, profile: Profile, project: Project): MatchResult {
  return {
    profile,
    score: Number(result.score ?? 0),
    matchedSkills: (result.matched_skills ?? []).map((name) => {
      const owned = profile.skills.find((skill) => skill.name.toLowerCase() === name.toLowerCase())
      const required = project.requirements.find((requirement) => requirement.name.toLowerCase() === name.toLowerCase())
      return {
        name,
        candidateLevel: owned?.level ?? "Básico",
        requiredLevel: required?.minLevel ?? "Básico",
        meetsLevel: true,
      }
    }),
    missingSkills: result.skill_gaps ?? [],
  }
}
