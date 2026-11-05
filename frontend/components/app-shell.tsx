"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowUpRight,
  BriefcaseBusiness,
  ChevronRight,
  Globe2,
  LayoutDashboard,
  MessageCircle,
  Network,
  Plus,
  Rocket,
  Settings2,
  UserRound
} from "lucide-react"
import { AdminDashboard } from "@/components/admin-dashboard"
import { AppProvider, useApp } from "@/components/app-provider"
import { AuthScreen } from "@/components/auth-screen"
import { Brand } from "@/components/brand"
import { ChatPage } from "@/components/chat-page"
import { ChatDock } from "@/components/chat-dock"
import { ProjectFeed } from "@/components/project-feed"
import { ProfileAvatar } from "@/components/profile-avatar"
import { ProfileForm } from "@/components/profile-form"
import { ProjectDetail } from "@/components/project-detail"
import { ProjectForm } from "@/components/project-form"
import { ProjectList } from "@/components/project-list"
import { ForgotPasswordScreen, ResetPasswordScreen } from "@/components/password-recovery-screen"
import { SettingsPage } from "@/components/settings-page"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { Profile } from "@/lib/types"

type View =
  | "admin"
  | "feed"
  | "profile"
  | "projects"
  | "chats"
  | "settings"
  | "project-create"
  | "project-edit"
  | "project-detail"

function routeFor(pathname: string): {
  view: View
  projectId: string | null
  valid: boolean
} {
  const path = pathname.replace(/\/$/, "") || "/"
  if (
    [
      "/profile",
      "/admin",
      "/feed",
      "/projects",
      "/chats",
      "/settings"
    ].includes(path)
  )
    return { view: path.slice(1) as View, projectId: null, valid: true }
  if (path === "/projects/new")
    return { view: "project-create", projectId: null, valid: true }
  const editMatch = path.match(/^\/projects\/([^/]+)\/edit$/)
  if (editMatch)
    return { view: "project-edit", projectId: editMatch[1], valid: true }
  const detailMatch = path.match(/^\/projects\/([^/]+)$/)
  if (detailMatch)
    return { view: "project-detail", projectId: detailMatch[1], valid: true }
  return { view: "feed", projectId: null, valid: false }
}

const NAV = [
  {
    id: "admin",
    label: "Visão geral",
    icon: LayoutDashboard,
    roles: ["ADMIN"]
  },
  {
    id: "feed",
    label: "Oportunidades",
    icon: BriefcaseBusiness,
    roles: ["MEMBER", "CANDIDATE", "RECRUITER", "MANAGER"]
  },
  {
    id: "profile",
    label: "Meu perfil",
    icon: UserRound,
    roles: ["MEMBER", "CANDIDATE", "RECRUITER", "MANAGER"]
  },
  {
    id: "projects",
    label: "Meus projetos",
    icon: Rocket,
    roles: ["MEMBER", "CANDIDATE", "RECRUITER", "MANAGER"]
  },
  {
    id: "chats",
    label: "Mensagens",
    icon: MessageCircle,
    roles: ["MEMBER", "CANDIDATE", "RECRUITER", "MANAGER"]
  },
  {
    id: "settings",
    label: "Configurações",
    icon: Settings2,
    roles: ["ADMIN", "MEMBER", "CANDIDATE", "RECRUITER", "MANAGER"]
  }
]
const TITLES: Record<
  View,
  { title: string; description: string; label: string }
> = {
  admin: {
    label: "INTELIGÊNCIA & OPERAÇÃO",
    title: "Uma visão de cada conexão.",
    description:
      "Acompanhe o consumo de IA, os custos e as projeções de uso da plataforma."
  },
  feed: {
    label: "EXPLORE O QUE VEM A SEGUIR",
    title: "Seu próximo desafio está aqui.",
    description:
      "Descubra projetos, demonstre interesse e crie espaço para novas possibilidades."
  },
  profile: {
    label: "SUA EXPERIÊNCIA, EM DESTAQUE",
    title: "Toda trajetória tem valor.",
    description:
      "Mostre quem você é, o que construiu e a experiência que traz para o próximo projeto."
  },
  projects: {
    label: "IDEIAS QUE GANHAM FORMA",
    title: "O próximo passo dos seus projetos.",
    description:
      "Gerencie oportunidades e encontre profissionais para construir com você."
  },
  chats: {
    label: "MANTENHA A CONVERSA VIVA",
    title: "Boas conexões começam aqui.",
    description:
      "Acompanhe suas conversas e transforme interesse em próximos passos."
  },
  settings: {
    label: "DO SEU JEITO",
    title: "Seu espaço. Suas preferências.",
    description:
      "Consulte os dados da conta e ajuste sua experiência na plataforma."
  },
  "project-create": {
    label: "UM NOVO COMEÇO",
    title: "Dê forma à sua próxima ideia.",
    description:
      "Apresente o desafio com clareza. A IA pode ajudar a encontrar as palavras certas."
  },
  "project-edit": {
    label: "CADA DETALHE IMPORTA",
    title: "Refine sua oportunidade.",
    description:
      "Mantenha as informações do projeto atualizadas para encontrar boas conexões."
  },
  "project-detail": {
    label: "DO CONTEXTO À CONEXÃO",
    title: "Seu projeto, em perspectiva.",
    description:
      "Conheça os profissionais recomendados e acompanhe os próximos passos."
  }
}

export function AppShell() {
  return (
    <AppProvider>
      <AppShellContent />
    </AppProvider>
  )
}

function FeedProfilePreview({
  profile,
  displayName
}: {
  profile: Profile
  displayName: string
}) {
  const name = profile.name || displayName
  return (
    <aside className="feed-profile sticky top-24">
      <Card>
        <CardContent className="text-center">
          <ProfileAvatar
            profile={{ ...profile, name }}
            className="mx-auto size-[76px] ring-4 ring-secondary"
          />
          <p className="mt-5 break-words text-base font-semibold tracking-tight">
            {name}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {profile.profession || "Complete seu perfil profissional"}
          </p>
        </CardContent>
      </Card>
    </aside>
  )
}

function AppShellContent() {
  const pathname = usePathname()
  const router = useRouter()
  const { view, projectId, valid } = routeFor(pathname)
  const { projects, currentProfile, authUser, authLoading, unreadChats } =
    useApp()
  const isAuthRoute = ["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname)
  const isAdmin = authUser?.role === "ADMIN"
  const canManageProjects = Boolean(authUser) && !isAdmin

  useEffect(() => {
    if (authLoading || !authUser) return
    if (isAuthRoute || !valid) router.replace(isAdmin ? "/admin" : "/feed")
    else if (isAdmin && pathname !== "/admin" && pathname !== "/settings")
      router.replace("/admin")
    else if (!isAdmin && pathname === "/admin") router.replace("/feed")
    else if (pathname.startsWith("/projects") && !canManageProjects)
      router.replace("/feed")
  }, [
    authLoading,
    authUser,
    isAuthRoute,
    valid,
    isAdmin,
    pathname,
    canManageProjects,
    router
  ])

  if (authLoading || (authUser && isAuthRoute))
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5">
        <Brand />
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />{" "}
          Preparando seu espaço...
        </span>
      </div>
    )
  if (!authUser) {
    if (pathname === "/forgot-password") return <ForgotPasswordScreen />
    if (pathname === "/reset-password") return <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando recuperação...</div>}><ResetPasswordScreen /></Suspense>
    return <AuthScreen key={pathname} initialMode={pathname === "/register" ? "register" : "login"} />
  }
  const navigation = NAV.filter((item) => item.roles.includes(authUser.role))
  const activeNav = (id: string) =>
    id === "projects" ? pathname.startsWith("/projects") : view === id
  const navItems = navigation.map(({ id, label, icon: Icon }) => (
    <Link
      key={id}
      href={`/${id}`}
      aria-current={activeNav(id) ? "page" : undefined}
    >
      <Icon />
      <span>{label}</span>
      {id === "chats" && unreadChats > 0 ? (
        <span className="nav-count">
          {unreadChats > 99 ? "99+" : unreadChats}
        </span>
      ) : null}
    </Link>
  ))
  const profile = {
    ...currentProfile,
    name: currentProfile.name || authUser.displayName
  }

  return (
    <div className="workspace">
      <a href="#workspace-main" className="skip-link">
        Ir para o conteúdo
      </a>
      <aside className="workspace-sidebar">
        <Brand inverse href={isAdmin ? "/admin" : "/feed"} />
        <p className="workspace-sidebar-label">SEU ESPAÇO DE TRABALHO</p>
        <nav aria-label="Navegação principal" className="workspace-nav">
          {navItems}
        </nav>
        <div className="sidebar-note">
          <Network size={30} strokeWidth={1} />
          <p>
            O futuro se constrói
            <br />
            em boas conexões.
          </p>
          <span>
            Sua experiência faz parte
            <br />
            de algo maior.
          </span>
        </div>
        <div className="sidebar-bottom">
          <Link href="/">
            <Globe2 size={15} /> Conheça a Synapse{" "}
            <ArrowUpRight className="ml-auto" size={13} />
          </Link>
        </div>
      </aside>
      <div className="workspace-body">
        <header className="workspace-header">
          <div className="md:hidden">
            <Brand href={isAdmin ? "/admin" : "/feed"} />
          </div>
          <div className="workspace-header-location">
            <span>Meu espaço</span>
            <ChevronRight size={13} />
            <strong>
              {navigation.find((item) => activeNav(item.id))?.label ??
                "Projetos"}
            </strong>
          </div>
          <div className="workspace-header-actions">
            {canManageProjects && (
              <Button
                className="hidden lg:inline-flex"
                size="sm"
                onClick={() => router.push("/projects/new")}
              >
                <Plus size={15} /> Novo projeto
              </Button>
            )}
            <ThemeToggle />
            <span className="header-divider" />
            <Link
              href="/settings"
              aria-label="Abrir configurações da conta"
              className="flex items-center gap-2.5 rounded-lg"
            >
              <ProfileAvatar profile={profile} className="size-8" />
              <div className="hidden lg:block">
                <p className="max-w-32 truncate text-xs font-semibold">
                  {authUser.displayName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {isAdmin ? "Administração" : "Minha conta"}
                </p>
              </div>
            </Link>
          </div>
        </header>
        <main id="workspace-main" className="workspace-main">
          <div className="page-intro">
            <div>
              <span className="eyebrow">{TITLES[view].label}</span>
              <h1>{TITLES[view].title}</h1>
              <p>{TITLES[view].description}</p>
            </div>
            <Network className="page-intro-mark size-12" strokeWidth={1} />
          </div>
          <div key={view} className="workspace-content">
            {view === "admin" && <AdminDashboard />}
            {view === "settings" && <SettingsPage />}
            {view === "feed" && (
              <div className="feed-layout">
                <FeedProfilePreview
                  profile={currentProfile}
                  displayName={authUser.displayName}
                />
                <section className="min-w-0">
                  <ProjectFeed />
                </section>
              </div>
            )}
            {view === "profile" && <ProfileForm />}
            {view === "projects" && (
              <ProjectList
                onCreate={() => router.push("/projects/new")}
                onOpen={(id) => router.push(`/projects/${id}`)}
              />
            )}
            {view === "chats" && <ChatPage />}
            {view === "project-create" && (
              <ProjectForm
                onCancel={() => router.push("/projects")}
                onSaved={(project) => router.push(`/projects/${project.id}`)}
              />
            )}
            {view === "project-edit" && projectId && (
              <ProjectForm
                project={projects.find((item) => item.id === projectId)}
                onCancel={() => router.push(`/projects/${projectId}`)}
                onSaved={(project) => router.push(`/projects/${project.id}`)}
              />
            )}
            {view === "project-detail" && projectId && (
              <ProjectDetail
                projectId={projectId}
                onBack={() => router.push("/projects")}
                onEdit={() => router.push(`/projects/${projectId}/edit`)}
              />
            )}
          </div>
        </main>
      </div>
      {view === "feed" && (
        <ChatDock onOpenChats={() => router.push("/chats")} />
      )}
      <nav aria-label="Navegação móvel" className="mobile-nav md:hidden">
        {navItems}
      </nav>
    </div>
  )
}
