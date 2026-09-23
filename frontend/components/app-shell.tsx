"use client"

import { useState } from "react"
import Image from "next/image"
import { LogOut, MessageCircle, Rocket, UserRound } from "lucide-react"

import { AppProvider } from "@/components/app-provider"
import { useApp } from "@/components/app-provider"
import { AuthScreen } from "@/components/auth-screen"
import { ChatPage } from "@/components/chat-page"
import { ProfileForm } from "@/components/profile-form"
import { ProjectDetail } from "@/components/project-detail"
import { ProjectForm } from "@/components/project-form"
import { ProjectList } from "@/components/project-list"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type View = "profile" | "projects" | "chats" | "project-create" | "project-edit" | "project-detail"

const NAV: { id: View; label: string; icon: typeof UserRound }[] = [
  { id: "profile", label: "Meu Perfil", icon: UserRound },
  { id: "projects", label: "Projetos", icon: Rocket },
  { id: "chats", label: "Chats", icon: MessageCircle },
]

const TITLES: Record<View, { title: string; description: string }> = {
  profile: {
    title: "Cadastro e edição de perfil",
    description: "Gerencie seus dados profissionais e suas skills.",
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
    description: "Publique uma oportunidade e defina as skills exigidas.",
  },
  "project-edit": {
    title: "Editar projeto",
    description: "Atualize os dados e os requisitos do projeto.",
  },
  "project-detail": {
    title: "Detalhes do projeto",
    description: "Veja os requisitos e os profissionais recomendados.",
  },
}

export function AppShell() {
  return (
    <AppProvider>
      <AppShellContent />
    </AppProvider>
  )
}

function AppShellContent() {
  const [view, setView] = useState<View>("profile")
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const { projects, authUser, authLoading, unreadChats, logout } = useApp()

  if (authLoading) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando sessão...</div>
  if (!authUser) return <AuthScreen />

  function openProject(projectId: string) {
    setSelectedProjectId(projectId)
    setView("project-detail")
  }

  return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative h-10 w-32 shrink-0">
                <Image src="/placeholder-logo-dark.png" alt="Logo da plataforma" fill className="object-contain dark:hidden" priority />
                <Image src="/placeholder-logo-light.png" alt="Logo da plataforma" fill className="hidden scale-[0.84] object-contain dark:block" priority />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-muted/40 p-1">
              {NAV.map((item) => {
                const Icon = item.icon
                const active = view === item.id
                return (
                  <Button
                    key={item.id}
                    type="button"
                    variant={active ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setView(item.id)}
                    className={cn(
                      "gap-2",
                      !active && "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon data-icon="inline-start" />
                    {item.label}
                    {item.id === "chats" && unreadChats > 0 && <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground">{unreadChats > 99 ? "99+" : unreadChats}</span>}
                  </Button>
                )
              })}
            </nav>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={logout} title={`Sair de ${authUser.email}`}><LogOut data-icon="inline-start" /> Sair</Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {TITLES[view].title}
            </h1>
            <p className="text-muted-foreground">{TITLES[view].description}</p>
          </div>

          {view === "profile" && <ProfileForm />}
          {view === "projects" && (
            <ProjectList
              onCreate={() => setView("project-create")}
              onOpen={openProject}
            />
          )}
          {view === "chats" && <ChatPage />}
          {view === "project-create" && (
            <ProjectForm
              onCancel={() => setView("projects")}
              onSaved={(project) => openProject(project.id)}
            />
          )}
          {view === "project-edit" && selectedProjectId && (
            <ProjectForm
              project={projects.find((item) => item.id === selectedProjectId)}
              onCancel={() => setView("project-detail")}
              onSaved={(project) => openProject(project.id)}
            />
          )}
          {view === "project-detail" && selectedProjectId && (
            <ProjectDetail
              projectId={selectedProjectId}
              onBack={() => setView("projects")}
              onEdit={() => setView("project-edit")}
            />
          )}
        </main>
      </div>
  )
}
