"use client"

import { FolderPlus, Pencil, Rocket } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { SkillLevelBadge } from "@/components/skill-level-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Project } from "@/lib/types"

interface ProjectListProps {
  onCreate: () => void
  onOpen: (projectId: string) => void
}

export function ProjectList({ onCreate, onOpen }: ProjectListProps) {
  const { projects } = useApp()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Projetos publicados</h2>
          <p className="text-sm text-muted-foreground">
            Consulte os detalhes, edite requisitos e veja os profissionais recomendados.
          </p>
        </div>
        <Button onClick={onCreate}>
          <FolderPlus data-icon="inline-start" />
          Criar novo projeto
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Rocket className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum projeto publicado.</p>
            <p className="text-sm text-muted-foreground">Crie o primeiro projeto para começar.</p>
            <Button variant="outline" onClick={onCreate}>Criar projeto</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: (id: string) => void }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{project.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-3">{project.description}</CardDescription>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            {project.status ?? "ABERTO"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-wrap gap-1.5">
          {project.requirements.length === 0 ? (
            <span className="text-sm text-muted-foreground">Sem skills exigidas.</span>
          ) : (
            project.requirements.map((requirement) => (
              <SkillLevelBadge key={requirement.id} level={requirement.minLevel} label={requirement.name} />
            ))
          )}
        </div>
        <Button variant="outline" className="mt-auto w-full" onClick={() => onOpen(project.id)}>
          <Pencil data-icon="inline-start" />
          Ver detalhes do projeto
        </Button>
      </CardContent>
    </Card>
  )
}
