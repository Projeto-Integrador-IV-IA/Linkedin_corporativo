"use client"

import { useState } from "react"
import { ArrowUpRight, FolderPlus, Rocket, Search, Users } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import type { Project } from "@/lib/types"

interface ProjectListProps {
  onCreate: () => void
  onOpen: (projectId: string) => void
}

export function ProjectList({ onCreate, onOpen }: ProjectListProps) {
  const { projects } = useApp()
  const [query, setQuery] = useState("")
  const [onlyOpen, setOnlyOpen] = useState(false)
  const visibleProjects = projects.filter(
    (project) =>
      (!onlyOpen || project.status === "ABERTO") &&
      `${project.title} ${project.description}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.trim().toLocaleLowerCase("pt-BR"))
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="metric-strip !mb-0">
        <div className="metric-tile">
          <span>
            Projetos publicados <Rocket size={17} />
          </span>
          <strong>{projects.length}</strong>
        </div>
        <div className="metric-tile">
          <span>
            Em aberto <FolderPlus size={17} />
          </span>
          <strong>
            {projects.filter((project) => project.status === "ABERTO").length}
          </strong>
        </div>
        <div className="metric-tile">
          <span>
            Interesses recebidos <Users size={17} />
          </span>
          <strong>
            {projects.reduce(
              (sum, project) => sum + (project.interestedCount ?? 0),
              0
            )}
          </strong>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            type="button"
            className="filter-tab"
            aria-pressed={!onlyOpen}
            onClick={() => setOnlyOpen(false)}
          >
            Todos os projetos
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={onlyOpen}
            onClick={() => setOnlyOpen(true)}
          >
            Em aberto
          </button>
        </div>
        <Button onClick={onCreate}>
          <FolderPlus data-icon="inline-start" />
          Criar novo projeto
        </Button>
      </div>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-4 top-3.5 text-muted-foreground"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-11"
          aria-label="Buscar meus projetos"
          placeholder="Encontre um projeto pelo nome ou pela descrição"
        />
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Rocket className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum projeto publicado.</p>
            <p className="text-sm text-muted-foreground">
              Crie o primeiro projeto para começar.
            </p>
            <Button variant="outline" onClick={onCreate}>
              Criar projeto
            </Button>
          </CardContent>
        </Card>
      ) : visibleProjects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-5 py-14 text-center">
          <Search className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm">
            Nenhum projeto encontrado com esses filtros.
          </p>
          <Button
            variant="link"
            onClick={() => {
              setQuery("")
              setOnlyOpen(false)
            }}
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  onOpen
}: {
  project: Project
  onOpen: (id: string) => void
}) {
  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="mb-5 inline-flex rounded-lg bg-secondary p-3 text-primary">
              <Rocket size={21} strokeWidth={1.5} />
            </span>
            <CardTitle className="line-clamp-2 text-xl font-semibold tracking-tight">
              {project.title}
            </CardTitle>
            <CardDescription className="mt-3 line-clamp-3 text-xs leading-relaxed">
              {project.description}
            </CardDescription>
          </div>
          <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
            {project.status ?? "ABERTO"}
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="size-4" />
          <strong className="text-foreground">
            {project.interestedCount ?? 0}
          </strong>
          {(project.interestedCount ?? 0) === 1
            ? "pessoa interessada"
            : "pessoas interessadas"}
        </div>
        <Button
          variant="outline"
          className="mt-auto w-full"
          onClick={() => onOpen(project.id)}
        >
          Gerenciar projeto
          <ArrowUpRight className="ml-auto" />
        </Button>
      </CardContent>
    </Card>
  )
}
