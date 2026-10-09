"use client"

import { useEffect } from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { BriefcaseBusiness, LayoutDashboard, LogOut, MessageCircle, Rocket, UserRound } from "lucide-react"

import { AdminDashboard } from "@/components/admin-dashboard"
import { AppProvider } from "@/components/app-provider"
import { useApp } from "@/components/app-provider"
import { AuthScreen } from "@/components/auth-screen"
import { ChatPage } from "@/components/chat-page"
import { ChatDock } from "@/components/chat-dock"
import { ProjectFeed } from "@/components/project-feed"
import { ProfileAvatar } from "@/components/profile-avatar"
import { ProfileForm } from "@/components/profile-form"
import { ProjectDetail } from "@/components/project-detail"
import { ProjectForm } from "@/components/project-form"
import { ProjectList } from "@/components/project-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

type View = "admin" | "feed" | "profile" | "projects" | "chats" | "project-create" | "project-edit" | "project-detail"

function routeFor(pathname: string): { view: View; projectId: string | null; valid: boolean } {
  const path = pathname.replace(/\/$/, "") || "/"
  if (path === "/" || path === "/profile") return { view: "profile", projectId: null, valid: path === "/profile" }
  if (path === "/admin") return { view: "admin", projectId: null, valid: true }
  if (path === "/feed") return { view: "feed", projectId: null, valid: true }
  if (path === "/projects") return { view: "projects", projectId: null, valid: true }
  if (path === "/projects/new") return { view: "project-create", projectId: null, valid: true }
  if (path === "/chats") return { view: "chats", projectId: null, valid: true }
  const editMatch = path.match(/^\/projects\/([^/]+)\/edit$/)
  if (editMatch) return { view: "project-edit", projectId: editMatch[1], valid: true }
  const detailMatch = path.match(/^\/projects\/([^/]+)$/)
  if (detailMatch) return { view: "project-detail", projectId: detailMatch[1], valid: true }
  return { view: "profile", projectId: null, valid: false }
}

const NAV: { id: View; label: string; icon: typeof UserRound; roles?: string[] }[] = [
  { id: "admin", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN"] },
  { id: "feed", label: "Oportunidades", icon: BriefcaseBusiness, roles: ["CANDIDATE", "RECRUITER", "MANAGER"] },
  { id: "profile", label: "Meu Perfil", icon: UserRound, roles: ["CANDIDATE", "RECRUITER", "MANAGER"] },
  { id: "projects", label: "Projetos", icon: Rocket, roles: ["RECRUITER", "MANAGER"] },
  { id: "chats", label: "Chats", icon: MessageCircle, roles: ["CANDIDATE", "RECRUITER", "MANAGER"] },
]

const TITLES: Record<View, { title: string; description: string }> = {
  admin: {
    title: "Métricas de inteligência artificial",
    description: "Acompanhe consumo, desempenho, custos estimados e projeções das chamadas LLM.",
  },
  feed: {
    title: "Feed de oportunidades",
    description: "Conheça os projetos abertos e sinalize aqueles nos quais deseja trabalhar.",
  },
  profile: {
    title: "Cadastro e edição de perfil",
    description: "Gerencie sua descrição profissional e os projetos usados no matching.",
  },
  projects: {
    title: "Projetos",
    description: "Consulte, publique e gerencie os projetos da rede corporativa.",
  },
  chats: {
    title: "Chats",
    description: "Converse com profissionais e mantenha suas notas particulares.",
  },
  "project-create": {
    title: "Novo projeto",
    description: "Publique uma oportunidade com uma descrição completa e objetiva.",
  },
  "project-edit": {
    title: "Editar projeto",
    description: "Atualize o título e a descrição da oportunidade.",
  },
  "project-detail": {
    title: "Detalhes do projeto",
    description: "Veja a descrição e os profissionais recomendados pela análise textual.",
  },
}

export function AppShell() {
  return (
    <AppProvider>
      <AppShellContent />
    </AppProvider>
  )
}

function FeedProfilePreview({ profile, displayName }: { profile: Profile; displayName: string }) {
  const name = profile.name || displayName
  const profileForPreview = { ...profile, name }

  return (
    <aside className="hidden lg:block">
      <Card className="sticky top-20">
        <CardContent className="px-5 py-6 text-center">
          <ProfileAvatar profile={profileForPreview} className="mx-auto size-[72px] shadow-sm" />
          <div className="mt-3 min-w-0">
            <p className="truncate text-base font-semibold">{name}</p>
            <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{profile.profession || "Complete seu perfil profissional"}</p>
          </div>
        </CardContent>
      </Card>
    </aside>
  )
}

function AppShellContent() {
  const pathname = usePathname()
  const router = useRouter()
  const route = routeFor(pathname)
  const { view, projectId: selectedProjectId } = route
  const { projects, currentProfile, authUser, authLoading, unreadChats, logout } = useApp()

  useEffect(() => {
    const canManageProjects = authUser?.role === "RECRUITER" || authUser?.role === "MANAGER"
    const isAdmin = authUser?.role === "ADMIN"
    const canViewFeed = authUser?.role === "CANDIDATE" || canManageProjects
    if (pathname === "/") router.replace(isAdmin ? "/admin" : canManageProjects ? "/projects" : "/feed")
    else if (isAdmin && pathname !== "/admin") router.replace("/admin")
    else if (pathname === "/admin" && authUser && !isAdmin) router.replace(canManageProjects ? "/projects" : "/profile")
    else if (pathname === "/feed" && authUser && !canViewFeed) router.replace(isAdmin ? "/admin" : "/profile")
    else if (pathname.startsWith("/projects") && authUser && !canManageProjects) router.replace("/profile")
    else if (!route.valid) router.replace(isAdmin ? "/admin" : "/profile")
  }, [authUser, pathname, route.valid, router])

  if (authLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando sessão...</div>
  if (!authUser) return <AuthScreen />

  function go(path: string) { router.push(path) }
  function openProject(projectId: string) { go(`/projects/${projectId}`) }

  return (
      <div className="min-h-screen bg-muted/30">
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 shadow-sm backdrop-blur">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-6">
            <div className="flex shrink-0 items-center">
              <div className="relative h-9 w-20 sm:w-32">
                <Image src="/placeholder-logo-dark.png" alt="Logo da plataforma" fill className="object-contain dark:hidden" priority />
                <Image src="/placeholder-logo-light.png" alt="Logo da plataforma" fill className="hidden scale-[0.84] object-contain dark:block" priority />
              </div>
            </div>
            <nav className="mx-auto flex min-w-0 items-stretch gap-0.5 self-stretch" aria-label="Navegação principal">
              {NAV.filter((item) => !item.roles || item.roles.includes(authUser.role)).map((item) => {
                const Icon = item.icon
                const active = item.id === "projects" ? pathname.startsWith("/projects") : view === item.id
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => go(item.id === "admin" ? "/admin" : item.id === "feed" ? "/feed" : item.id === "profile" ? "/profile" : item.id === "projects" ? "/projects" : "/chats")}
                    className={cn(
                      "relative h-auto min-w-11 flex-col gap-1 rounded-none px-2 text-[11px] font-medium sm:min-w-16 sm:px-3",
                      active ? "bg-transparent text-primary shadow-none hover:bg-muted/70 after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    <span className="relative"><Icon className="size-4" />{item.id === "chats" && unreadChats > 0 && <span className="absolute -right-3 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-semibold text-destructive-foreground">{unreadChats > 99 ? "99+" : unreadChats}</span>}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                )
              })}
            </nav>
            <div className="flex shrink-0 items-center gap-1.5">
              <div className="hidden sm:block"><ThemeToggle /></div>
              <Button variant="ghost" size="icon" onClick={logout} title={`Sair de ${authUser.email}`} aria-label="Sair"><LogOut className="size-4" /></Button>
            </div>
          </div>
        </header>

        <main className={cn("mx-auto px-4 py-6 sm:px-6 sm:py-8", view === "feed" ? "max-w-7xl" : "max-w-6xl")}>
          {view !== "feed" && <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {TITLES[view].title}
            </h1>
            <p className="text-muted-foreground">{TITLES[view].description}</p>
          </div>}

          {view === "admin" && <AdminDashboard />}
          {view === "feed" && <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[250px_minmax(0,660px)] lg:items-start">
            <FeedProfilePreview profile={currentProfile} displayName={authUser.displayName} />
            <section className="min-w-0"><ProjectFeed /></section>
          </div>}
          {view === "feed" && <ChatDock onOpenChats={() => go("/chats")} />}
          {view === "profile" && <ProfileForm />}
          {view === "projects" && (
            <ProjectList
              onCreate={() => go("/projects/new")}
              onOpen={openProject}
            />
          )}
          {view === "chats" && <ChatPage />}
          {view === "project-create" && (
            <ProjectForm
              onCancel={() => go("/projects")}
              onSaved={(project) => openProject(project.id)}
            />
          )}
          {view === "project-edit" && selectedProjectId && (
            <ProjectForm
              project={projects.find((item) => item.id === selectedProjectId)}
              onCancel={() => go(`/projects/${selectedProjectId}`)}
              onSaved={(project) => openProject(project.id)}
            />
          )}
          {view === "project-detail" && selectedProjectId && (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => go("/projects")}
              onEdit={() => go(`/projects/${selectedProjectId}/edit`)}
            />
          )}
        </main>
      </div>
  )
}
