"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Eye,
  Heart,
  RefreshCw,
  Search,
  Users
} from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ProfileAvatar } from "@/components/profile-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  expressProjectInterest,
  listFeedProjects,
  withdrawProjectInterest,
  type FeedProject
} from "@/lib/api"
import { cn } from "@/lib/utils"

function ownerProfile(project: FeedProject) {
  return {
    name: project.ownerName || "Recrutador da plataforma",
    avatarUrl: project.ownerAvatarUrl ?? ""
  }
}

function FeedCard({
  project,
  saving,
  canExpressInterest,
  ownProject,
  onToggle,
  onView
}: {
  project: FeedProject
  saving: boolean
  canExpressInterest: boolean
  ownProject: boolean
  onToggle: (project: FeedProject) => void
  onView: (project: FeedProject) => void
}) {
  return (
    <Card className="feed-card flex h-[390px] flex-col overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-5 flex items-center gap-2.5">
              <ProfileAvatar
                profile={ownerProfile(project)}
                className="size-9 shrink-0"
              />
              <div className="min-w-0">
                <CardDescription className="line-clamp-1 text-xs font-medium text-foreground">
                  {ownerProfile(project).name}
                </CardDescription>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {ownProject
                    ? "Publicado por você"
                    : "Compartilhou uma oportunidade"}
                </p>
              </div>
            </div>
            <CardTitle className="line-clamp-2">{project.title}</CardTitle>
          </div>
          <Badge variant="secondary" className="text-[10px] font-medium">
            {project.status === "ABERTO" ? "Aberto" : project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-5">
        <p className="line-clamp-4 whitespace-pre-line break-words text-[13px] leading-6 text-muted-foreground">
          {project.description ||
            "Este projeto ainda não possui uma descrição."}
        </p>
        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-4" aria-hidden="true" />
            <strong className="text-foreground">
              {project.interestedCount}
            </strong>
            {project.interestedCount === 1
              ? "pessoa interessada"
              : "pessoas interessadas"}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onView(project)}
              className="flex-1 sm:flex-none"
            >
              <Eye data-icon="inline-start" /> Ver detalhes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={project.interested ? "secondary" : "default"}
              disabled={saving || !canExpressInterest || ownProject}
              aria-pressed={project.interested}
              onClick={() => onToggle(project)}
              className={cn(
                "flex-1 sm:flex-none",
                project.interested && "text-primary"
              )}
            >
              {saving ? (
                <RefreshCw data-icon="inline-start" className="animate-spin" />
              ) : (
                <Heart
                  data-icon="inline-start"
                  className={cn(project.interested && "fill-current")}
                />
              )}
              {ownProject
                ? "Seu projeto"
                : saving
                  ? "Salvando..."
                  : project.interested
                    ? "Retirar interesse"
                    : "Demonstrar interesse"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectDetailsDialog({
  project,
  saving,
  canExpressInterest,
  ownProject,
  onToggle,
  onOpenChange
}: {
  project: FeedProject | null
  saving: boolean
  canExpressInterest: boolean
  ownProject: boolean
  onToggle: (project: FeedProject) => void
  onOpenChange: (open: boolean) => void
}) {
  if (!project) return null

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div className="flex min-w-0 items-center gap-3">
              <ProfileAvatar
                profile={ownerProfile(project)}
                className="size-10 shrink-0"
              />
              <div className="min-w-0">
                <DialogTitle className="text-xl leading-7">
                  {project.title}
                </DialogTitle>
                <DialogDescription className="mt-1 truncate">
                  Publicado por {ownerProfile(project).name}
                </DialogDescription>
              </div>
            </div>
            <Badge variant="secondary">{project.status}</Badge>
          </div>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {project.area ? (
            <Badge variant="outline">{project.area}</Badge>
          ) : null}
          <Badge variant="outline" className="gap-1.5">
            <Users className="size-3.5" /> {project.interestedCount}{" "}
            {project.interestedCount === 1 ? "interessado" : "interessados"}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Descrição do projeto</p>
          <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {project.description ||
              "Este projeto ainda não possui uma descrição."}
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <Button
            type="button"
            className={cn(
              "w-full sm:w-auto",
              project.interested && "text-primary"
            )}
            variant={project.interested ? "secondary" : "default"}
            disabled={saving || !canExpressInterest || ownProject}
            aria-pressed={project.interested}
            onClick={() => onToggle(project)}
          >
            {saving ? (
              <RefreshCw data-icon="inline-start" className="animate-spin" />
            ) : (
              <Heart
                data-icon="inline-start"
                className={cn(project.interested && "fill-current")}
              />
            )}
            {ownProject
              ? "Seu projeto"
              : saving
                ? "Salvando..."
                : project.interested
                  ? "Retirar interesse"
                  : "Demonstrar interesse"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProjectFeed() {
  const router = useRouter()
  const { authUser, projects: managedProjects } = useApp()
  const [projects, setProjects] = useState<FeedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set())
  const [selectedProject, setSelectedProject] = useState<FeedProject | null>(
    null
  )
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<"all" | "interested">("all")
  const [sort, setSort] = useState("recent")
  const canExpressInterest = Boolean(authUser?.profileId)
  const ownedProjectIds = new Set(
    managedProjects
      .filter(
        (project) =>
          project.ownerEmail?.toLowerCase() === authUser?.email.toLowerCase()
      )
      .map((project) => project.id)
  )
  const isOwnProject = (project: FeedProject) => ownedProjectIds.has(project.id)
  const matchingProjects = projects.filter(
    (project) =>
      (filter === "all" || project.interested) &&
      `${project.title} ${project.description} ${project.ownerName}`
        .toLocaleLowerCase("pt-BR")
        .includes(query.trim().toLocaleLowerCase("pt-BR"))
  )
  const visibleProjects =
    sort === "interest"
      ? [...matchingProjects].sort(
          (a, b) => b.interestedCount - a.interestedCount
        )
      : matchingProjects

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    listFeedProjects()
      .then((items) => {
        if (active) setProjects(items)
      })
      .catch((reason: unknown) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o feed."
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function toggleInterest(project: FeedProject) {
    setSavingIds((previous) => new Set(previous).add(project.id))
    setError("")
    try {
      const updated = project.interested
        ? await withdrawProjectInterest(project.id)
        : await expressProjectInterest(project.id)
      setProjects((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item))
      )
      setSelectedProject((previous) =>
        previous?.id === updated.id ? updated : previous
      )
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível atualizar seu interesse."
      )
    } finally {
      setSavingIds((previous) => {
        const next = new Set(previous)
        next.delete(project.id)
        return next
      })
    }
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
        <Input
          className="h-12 pl-11"
          aria-label="Buscar oportunidades"
          placeholder="Busque por projeto, descrição ou pessoa..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg bg-muted p-1">
          <button
            type="button"
            className="filter-tab"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            Explorar{" "}
            <span className="text-[10px] opacity-60">{projects.length}</span>
          </button>
          <button
            type="button"
            className="filter-tab"
            aria-pressed={filter === "interested"}
            onClick={() => setFilter("interested")}
          >
            <Heart size={13} /> Meus interesses
          </button>
        </div>
        <select
          aria-label="Ordenar oportunidades"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          className="max-w-full rounded-md border border-border bg-card px-2 py-2 text-[11px] text-muted-foreground"
        >
          <option value="recent">Mais recentes</option>
          <option value="interest">Mais interesse</option>
        </select>
      </div>

      {!canExpressInterest && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              Complete e salve seu perfil para poder demonstrar interesse nas
              oportunidades.
            </p>
            <Button variant="outline" onClick={() => router.push("/profile")}>
              Completar perfil
            </Button>
          </CardContent>
        </Card>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="size-4 animate-spin" /> Carregando
          oportunidades...
        </p>
      ) : null}

      {!loading && visibleProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="rounded-2xl bg-secondary p-4 text-primary">
              <BriefcaseBusiness className="size-7" />
            </span>
            <p className="mt-2 font-semibold">
              {query
                ? "Nenhum projeto com essa busca."
                : filter === "interested"
                  ? "Suas próximas conexões começam no feed."
                  : "Novas possibilidades estão a caminho."}
            </p>
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              {query
                ? "Experimente outro termo ou limpe a pesquisa."
                : filter === "interested"
                  ? "Demonstre interesse em um projeto para encontrá-lo aqui."
                  : "Os projetos publicados na rede aparecerão neste espaço."}
            </p>
            {(query || filter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("")
                  setFilter("all")
                }}
              >
                Explorar todos <ArrowUpRight size={15} />
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {visibleProjects.map((project) => (
            <FeedCard
              key={project.id}
              project={project}
              saving={savingIds.has(project.id)}
              canExpressInterest={canExpressInterest}
              ownProject={isOwnProject(project)}
              onToggle={toggleInterest}
              onView={setSelectedProject}
            />
          ))}
        </div>
      )}
      <ProjectDetailsDialog
        project={selectedProject}
        saving={selectedProject ? savingIds.has(selectedProject.id) : false}
        canExpressInterest={canExpressInterest}
        ownProject={selectedProject ? isOwnProject(selectedProject) : false}
        onToggle={toggleInterest}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null)
        }}
      />
    </div>
  )
}
