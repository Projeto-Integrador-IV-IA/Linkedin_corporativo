"use client"

import { ArrowLeft, Pencil } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { MatchDashboard } from "@/components/match-dashboard"
import { SkillLevelBadge } from "@/components/skill-level-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProjectDetailProps {
  projectId: string
  onBack: () => void
  onEdit: () => void
}

export function ProjectDetail({ projectId, onBack, onEdit }: ProjectDetailProps) {
  const { projects } = useApp()
  const project = projects.find((item) => item.id === projectId)

  if (!project) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 py-10">
          <p>Projeto não encontrado.</p>
          <Button variant="outline" onClick={onBack}><ArrowLeft data-icon="inline-start" /> Voltar para projetos</Button>
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
            <div>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <CardDescription className="mt-2">{project.description}</CardDescription>
            </div>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
              {project.status ?? "ABERTO"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">Skills exigidas</p>
            <div className="flex flex-wrap gap-1.5">
              {project.requirements.length === 0 ? (
                <span className="text-sm text-muted-foreground">Nenhuma skill exigida.</span>
              ) : project.requirements.map((requirement) => (
                <SkillLevelBadge key={requirement.id} level={requirement.minLevel} label={requirement.name} />
              ))}
            </div>
          </div>
          {project.ownerName && (
            <p className="text-sm text-muted-foreground">
              Responsável: <span className="text-foreground">{project.ownerName}</span>
            </p>
          )}
        </CardContent>
      </Card>

      <MatchDashboard projectId={project.id} />
    </div>
  )
}
