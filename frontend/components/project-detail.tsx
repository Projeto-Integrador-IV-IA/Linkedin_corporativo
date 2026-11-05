"use client"

import { ArrowLeft, Pencil, Rocket, Users } from "lucide-react"
import { ProfileAvatar } from "@/components/profile-avatar"

import { useApp } from "@/components/app-provider"
import { MatchDashboard } from "@/components/match-dashboard"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"

interface ProjectDetailProps {
  projectId: string
  onBack: () => void
  onEdit: () => void
}

export function ProjectDetail({
  projectId,
  onBack,
  onEdit
}: ProjectDetailProps) {
  const { projects } = useApp()
  const project = projects.find((item) => item.id === projectId)

  if (!project) {
    return (
      <Card className="border-t-4 border-t-primary/60">
        <CardContent className="flex flex-col gap-4 py-10">
          <p>Projeto não encontrado.</p>
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft data-icon="inline-start" /> Voltar para projetos
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft data-icon="inline-start" /> Voltar para projetos
        </Button>
        <Button onClick={onEdit}>
          <Pencil data-icon="inline-start" /> Editar projeto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="mb-5 inline-flex rounded-xl bg-secondary p-3 text-primary">
                <Rocket size={25} strokeWidth={1.5} />
              </span>
              <CardTitle className="text-2xl font-semibold tracking-tight">
                {project.title}
              </CardTitle>
              <CardDescription className="mt-4 whitespace-pre-line break-words text-sm leading-7">
                {project.description}
              </CardDescription>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {project.status ?? "ABERTO"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {project.ownerName && (
            <div className="flex items-center gap-3 border-t border-border pt-5">
              <ProfileAvatar
                profile={{
                  name: project.ownerName,
                  avatarUrl: project.ownerAvatarUrl
                }}
                className="size-9"
              />
              <div>
                <p className="text-[10px] text-muted-foreground">
                  Responsável pelo projeto
                </p>
                <p className="text-sm font-medium">{project.ownerName}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" />
            <strong className="text-foreground">
              {project.interestedCount ?? 0}
            </strong>
            {(project.interestedCount ?? 0) === 1
              ? "profissional demonstrou interesse"
              : "profissionais demonstraram interesse"}
          </div>
        </CardContent>
      </Card>

      <MatchDashboard projectId={project.id} />
    </div>
  )
}
