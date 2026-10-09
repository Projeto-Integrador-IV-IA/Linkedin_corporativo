"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"

import {
  addPortfolioProject,
  createProfile,
  createProject,
  linkProfile,
  login as loginRequest,
  listProfiles,
  listProjects,
  listChats,
  logout as logoutRequest,
  me,
  register as registerRequest,
  removePortfolioProject,
  updateProject as updateProjectRequest,
  updateProfile,
  updatePortfolioProject,
} from "@/lib/api"
import type { AuthRole, AuthUser } from "@/lib/api"
import type { Profile, Project } from "@/lib/types"
import { playNotificationSound, unlockNotificationSound } from "@/lib/notification-sound"

const CHAT_POLL_INTERVAL = 2000

const EMPTY_PROFILE: Profile = {
  id: "new",
  email: "",
  name: "",
  profession: "",
  education: "",
  projects: "",
}

interface AppContextValue {
  profiles: Profile[]
  projects: Project[]
  currentProfile: Profile
  saveCurrentProfile: (profile: Profile) => Promise<Profile>
  addProject: (project: Project) => Promise<Project>
  updateProject: (project: Project, original: Project) => Promise<Project>
  loading: boolean
  error: string
  authUser: AuthUser | null
  authLoading: boolean
  unreadChats: number
  login: (email: string, password: string) => Promise<AuthUser>
  register: (email: string, password: string, displayName: string, role: AuthRole) => Promise<AuthUser>
  logout: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [unreadChats, setUnreadChats] = useState(0)

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage.getItem("talentmatch_token")) {
      setAuthLoading(false)
      setLoading(false)
      return
    }
    let active = true
    me()
      .then((user) => { if (active) setAuthUser(user) })
      .catch(() => { if (active) logoutRequest() })
      .finally(() => { if (active) setAuthLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!authUser) {
      setLoading(false)
      return
    }
    if (authUser.role === "ADMIN") {
      setProfiles([])
      setProjects([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    Promise.all([listProfiles(), listProjects()])
      .then(([loadedProfiles, loadedProjects]) => {
        if (!active) return
        setProfiles(loadedProfiles)
        setProjects(loadedProjects)
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [authUser])

  useEffect(() => {
    const unlock = () => unlockNotificationSound()
    window.addEventListener("pointerdown", unlock)
    window.addEventListener("keydown", unlock)
    return () => {
      window.removeEventListener("pointerdown", unlock)
      window.removeEventListener("keydown", unlock)
    }
  }, [])

  useEffect(() => {
    if (!authUser || authUser.role === "ADMIN") {
      setUnreadChats(0)
      return
    }
    let active = true
    let previousUnread: number | null = null
    const refreshUnread = () => listChats()
      .then((items) => {
        if (!active) return
        const nextUnread = items.reduce((total, item) => total + item.unreadCount, 0)
        if (previousUnread !== null && nextUnread > previousUnread) playNotificationSound()
        previousUnread = nextUnread
        setUnreadChats(nextUnread)
      })
      .catch(() => undefined)
    refreshUnread()
    const timer = window.setInterval(refreshUnread, CHAT_POLL_INTERVAL)
    return () => { active = false; window.clearInterval(timer) }
  }, [authUser])

  const currentProfile = useMemo(
    () =>
      profiles.find((profile) => profile.id === authUser?.profileId)
        ?? profiles.find((profile) => profile.email?.toLowerCase() === authUser?.email?.toLowerCase())
        ?? { ...EMPTY_PROFILE, email: authUser?.email ?? "" },
    [authUser, profiles]
  )

  useEffect(() => {
    if (!authUser || authUser.role === "ADMIN" || authUser.profileId || profiles.length === 0) return
    const matchingProfile = profiles.find((profile) => profile.email?.trim().toLowerCase() === authUser.email?.trim().toLowerCase())
    if (!matchingProfile) return
    let active = true
    linkProfile(matchingProfile.id)
      .then((linkedUser) => { if (active) setAuthUser(linkedUser) })
      .catch(() => undefined)
    return () => { active = false }
  }, [authUser, profiles])

  async function login(email: string, password: string) {
    const user = await loginRequest(email, password)
    setAuthUser(user)
    return user
  }

  async function register(email: string, password: string, displayName: string, role: AuthRole) {
    const user = await registerRequest(email, password, displayName, role)
    setAuthUser(user)
    return user
  }

  function logout() {
    logoutRequest()
    setAuthUser(null)
    setProfiles([])
    setProjects([])
    setUnreadChats(0)
  }

  async function saveCurrentProfile(profile: Profile) {
    setError("")
    const original = profiles.find((item) => item.id === profile.id)
    const profileWithLoginEmail = { ...profile, email: authUser?.email ?? profile.email }
    let persisted = profile.id === "new" ? await createProfile(profileWithLoginEmail) : await updateProfile(profileWithLoginEmail)

    const desiredPortfolio = profile.portfolioProjects ?? []
    const desiredPortfolioIds = new Set(desiredPortfolio.map((item) => item.id))
    for (const item of original?.portfolioProjects ?? []) {
      if (!desiredPortfolioIds.has(item.id) && /^\d+$/.test(item.id)) {
        await removePortfolioProject(persisted.id, item.id)
      }
    }
    for (const item of desiredPortfolio) {
      if (!item.title.trim()) continue
      if (!/^\d+$/.test(item.id)) {
        persisted = await addPortfolioProject(persisted.id, item)
        continue
      }
      const previous = original?.portfolioProjects?.find((oldItem) => oldItem.id === item.id)
      if (previous && JSON.stringify(previous) !== JSON.stringify(item)) {
        persisted = await updatePortfolioProject(persisted.id, item)
      }
    }

    const refreshed = (await listProfiles()).find((item) => item.id === persisted.id) ?? persisted
    const linkedUser = await linkProfile(refreshed.id)
    setAuthUser(linkedUser)
    setProfiles((previous) => {
      const exists = previous.some((item) => item.id === refreshed.id)
      return exists
        ? previous.map((item) => (item.id === refreshed.id ? refreshed : item))
        : [refreshed, ...previous]
    })
    return refreshed
  }

  async function addProject(project: Project) {
    setError("")
    const persisted = await createProject(project, currentProfile)
    setProjects((previous) => [persisted, ...previous.filter((item) => item.id !== persisted.id)])
    return persisted
  }

  async function updateProject(project: Project, _original: Project) {
    setError("")
    const persisted = await updateProjectRequest(project, currentProfile)

    setProjects((previous) => previous.map((item) => (item.id === persisted.id ? persisted : item)))
    return persisted
  }

  const value = useMemo<AppContextValue>(
    () => ({
      profiles,
      projects,
      currentProfile,
      saveCurrentProfile,
      addProject,
      updateProject,
      loading,
      error,
      authUser,
      authLoading,
      unreadChats,
      login,
      register,
      logout,
    }),
    [profiles, projects, currentProfile, loading, error, authUser, authLoading, unreadChats]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error("useApp deve ser usado dentro de AppProvider")
  }
  return ctx
}
