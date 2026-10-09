import type { MatchResult, PortfolioProject, Profile, Project } from "./types"

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api"
).replace(/\/$/, "")

type RemoteProfile = {
  id: number
  fullName: string
  email: string
  avatarUrl?: string
  profession?: string
  educationLevel?: string
  yearsOfExperience?: number
  bio?: string
  portfolioProjects?: { id?: number; sourceProjectId?: number | string; title?: string; description?: string }[]
}

type RemoteProject = {
  id: number
  title: string
  description?: string
  area?: string
  ownerName?: string
  ownerAvatarUrl?: string
  ownerEmail?: string
  status?: string
  interestedCount?: number
}

function errorMessage(body: string, fallback: string) {
  if (!body.trim()) return fallback
  try {
    const parsed: unknown = JSON.parse(body)
    if (parsed && typeof parsed === "object" && "message" in parsed && typeof parsed.message === "string") {
      return parsed.message
    }
  } catch {
    // Respostas não JSON continuam exibindo o texto retornado pelo serviço.
  }
  return body
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  const isMultipart = typeof FormData !== "undefined" && init?.body instanceof FormData
  if (isMultipart) headers.delete("Content-Type")
  else headers.set("Content-Type", "application/json")
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
    throw new Error(errorMessage(body, `Erro ${response.status} ao acessar a API.`))
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function mapProfile(profile: RemoteProfile): Profile {
  return {
    id: String(profile.id),
    avatarUrl: profile.avatarUrl ?? "",
    email: profile.email ?? "",
    name: profile.fullName ?? "",
    profession: profile.profession ?? "",
    education: profile.educationLevel ?? "",
    projects: profile.bio ?? "",
    portfolioProjects: (profile.portfolioProjects ?? []).map((project) => ({
      id: String(project.id),
      sourceProjectId: project.sourceProjectId ? String(project.sourceProjectId) : undefined,
      title: project.title ?? "",
      description: project.description ?? "",
    })),
  }
}

export function mapProject(project: RemoteProject): Project {
  return {
    id: String(project.id),
    title: project.title ?? "",
    description: project.description ?? "",
    area: project.area ?? "",
    ownerName: project.ownerName ?? "",
    ownerAvatarUrl: project.ownerAvatarUrl ?? "",
    ownerEmail: project.ownerEmail ?? "",
    status: project.status ?? "ABERTO",
    interestedCount: Number(project.interestedCount ?? 0),
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

export function listRecommendations(projectId: string) {
  return request<{
    interestBoostPoints: number
    results: { candidate_id: string; score: number; text_score: number; interest_boost: number; interested: boolean }[]
  }>(`/matches/projects/${projectId}`)
}

export interface FeedProject extends Project {
  interested: boolean
  interestedCount: number
}

function mapFeedProject(project: RemoteProject & { interested?: boolean }): FeedProject {
  return {
    ...mapProject(project),
    interested: Boolean(project.interested),
    interestedCount: Number(project.interestedCount ?? 0),
  }
}

export function listFeedProjects() {
  return request<(RemoteProject & { interested?: boolean })[]>("/feed/projects").then((projects) => projects.map(mapFeedProject))
}

export function expressProjectInterest(projectId: string) {
  return request<RemoteProject & { interested?: boolean }>(`/feed/projects/${projectId}/interest`, { method: "POST" }).then(mapFeedProject)
}

export function withdrawProjectInterest(projectId: string) {
  return request<RemoteProject & { interested?: boolean }>(`/feed/projects/${projectId}/interest`, { method: "DELETE" }).then(mapFeedProject)
}

export type AiDescriptionContext = "VACANCY" | "PROFILE" | "PORTFOLIO"

export interface AiDescriptionSession {
  sessionId: number
  contextType: AiDescriptionContext
  status: "QUESTIONS" | "REVIEW" | "COMPLETED"
  versionCount: number
  maxVersions: number
  text: string
  questions: string[]
  canContinue: boolean
  availableAt: string
}

export function startAiDescription(contextType: AiDescriptionContext, text: string) {
  return request<AiDescriptionSession>("/ai/descriptions/sessions", {
    method: "POST",
    body: JSON.stringify({ contextType, text }),
  })
}

export function generateAiDescription(sessionId: number, text: string, answers: string[]) {
  return request<AiDescriptionSession>(`/ai/descriptions/sessions/${sessionId}/generate`, {
    method: "POST",
    body: JSON.stringify({ text, answers }),
  })
}

export function continueAiDescription(sessionId: number, text: string) {
  return request<AiDescriptionSession>(`/ai/descriptions/sessions/${sessionId}/continue`, {
    method: "POST",
    body: JSON.stringify({ text }),
  })
}

export function finishAiDescription(sessionId: number, action: "ACCEPT" | "EDIT", text: string) {
  return request<AiDescriptionSession>(`/ai/descriptions/sessions/${sessionId}/finish`, {
    method: "POST",
    body: JSON.stringify({ action, text }),
  })
}

export interface LlmUsageSummary {
  requests: number
  successfulRequests: number
  failedRequests: number
  successRate: number
  inputTokens: number
  outputTokens: number
  cachedContextTokens: number
  reasoningTokens: number
  totalTokens: number
  averageTokensPerRequest: number
  averageLatencyMs: number
  uniqueUsers: number
  estimatedCostUsd: number
}

export interface AdminUsageMetrics {
  generatedAt: string
  timeZone: string
  periodDays: number
  periodStart: string
  periodEnd: string
  totals: LlmUsageSummary
  currentMonth: {
    actual: LlmUsageSummary
    projectedRequests: number
    projectedTotalTokens: number
    projectedCostUsd: number
    elapsedDays: number
    daysInMonth: number
    remainingDays: number
  }
  daily: { date: string; metrics: LlmUsageSummary }[]
  byContext: { label: string; metrics: LlmUsageSummary }[]
  byProvider: { label: string; metrics: LlmUsageSummary }[]
  byRequestType: { label: string; metrics: LlmUsageSummary }[]
  pricing: {
    configured: boolean
    currency: "USD"
    inputPerMillion: number
    outputPerMillion: number
  }
}

export function getAdminUsageMetrics(days = 30) {
  return request<AdminUsageMetrics>(`/admin/metrics?days=${Math.max(1, Math.min(365, days))}`)
}

export function addPortfolioProject(profileId: string, project: PortfolioProject) {
  return request<RemoteProfile>(`/profiles/${profileId}/portfolio`, {
    method: "POST",
    body: JSON.stringify({
      sourceProjectId: project.sourceProjectId ? Number(project.sourceProjectId) : null,
      title: project.title,
      description: project.description,
    }),
  }).then(mapProfile)
}

export function updatePortfolioProject(profileId: string, project: PortfolioProject) {
  return request<RemoteProfile>(`/profiles/${profileId}/portfolio/${project.id}`, {
    method: "PUT",
    body: JSON.stringify({ title: project.title, description: project.description }),
  }).then(mapProfile)
}

export function removePortfolioProject(profileId: string, portfolioId: string) {
  return request<void>(`/profiles/${profileId}/portfolio/${portfolioId}`, { method: "DELETE" })
}

export interface AuthUser {
  id: string
  email: string
  displayName: string
  role: string
  profileId?: string
  token: string
}

export type AuthRole = "RECRUITER" | "CANDIDATE"

function saveAuth(response: AuthUser) {
  if (typeof window !== "undefined" && response.token) window.localStorage.setItem("talentmatch_token", response.token)
  return { ...response, id: String(response.id), profileId: response.profileId ? String(response.profileId) : undefined }
}

export function login(email: string, password: string) {
  return request<AuthUser>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }).then(saveAuth)
}

export function register(email: string, password: string, displayName: string, role: AuthRole) {
  return request<AuthUser>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, displayName, role }),
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
  recruiterName: string
  recruiterProfileId: string
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
  attachment?: {
    name: string
    contentType: string
    size: number
  }
}

export function listChats() {
  return request<ChatConversation[]>("/chats").then((items) => items.map((item) => ({
    ...item,
    id: String(item.id),
    projectId: String(item.projectId),
    recruiterUserId: String(item.recruiterUserId),
    recruiterProfileId: item.recruiterProfileId ? String(item.recruiterProfileId) : "",
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

export function sendMessage(conversationId: string, content: string, file?: File) {
  if (file) {
    const form = new FormData()
    form.append("content", content)
    form.append("file", file)
    return request<ChatMessage>(`/chats/${conversationId}/messages`, { method: "POST", body: form }).then((item) => ({ ...item, id: String(item.id), conversationId: String(item.conversationId), senderUserId: String(item.senderUserId) }))
  }
  return request<ChatMessage>(`/chats/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ content }) }).then((item) => ({ ...item, id: String(item.id), conversationId: String(item.conversationId), senderUserId: String(item.senderUserId) }))
}

async function fetchChatAttachment(conversationId: string, messageId: string) {
  const token = typeof window !== "undefined" ? window.localStorage.getItem("talentmatch_token") : null
  const response = await fetch(`${API_BASE_URL}/chats/${conversationId}/messages/${messageId}/attachment`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    cache: "no-store",
  })
  if (!response.ok) throw new Error("Não foi possível carregar o arquivo.")
  return URL.createObjectURL(await response.blob())
}

export function loadChatAttachment(conversationId: string, messageId: string) {
  return fetchChatAttachment(conversationId, messageId)
}

export async function downloadChatAttachment(conversationId: string, messageId: string, name: string) {
  const url = await fetchChatAttachment(conversationId, messageId)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

export function getRecruiterNote(conversationId: string) {
  return request<{ content: string }>(`/chats/${conversationId}/note`)
}

export function saveRecruiterNote(conversationId: string, content: string) {
  return request<{ content: string }>(`/chats/${conversationId}/note`, { method: "PUT", body: JSON.stringify({ content }) })
}

export type ApiMatch = Awaited<ReturnType<typeof listRecommendations>>["results"][number]

export function toMatchResult(result: ApiMatch, profile: Profile): MatchResult {
  return {
    profile,
    score: Number(result.score ?? 0),
    textScore: Number(result.text_score ?? result.score ?? 0),
    interestBoost: Number(result.interest_boost ?? 0),
    interested: Boolean(result.interested),
  }
}
