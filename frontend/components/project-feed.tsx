"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BriefcaseBusiness, Eye, Heart, RefreshCw, Users } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ProfileAvatar } from "@/components/profile-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { expressProjectInterest, listFeedProjects, withdrawProjectInterest, type FeedProject } from "@/lib/api"
import { cn } from "@/lib/utils"

function ownerProfile(project: FeedProject) {
  return {
    name: project.ownerName || "Recrutador da plataforma",
    avatarUrl: project.ownerAvatarUrl ?? "",
  }
}

function FeedCard({ project, saving, canExpressInterest, onToggle, onView }: {
  project: FeedProject
  saving: boolean
  canExpressInterest: boolean
  onToggle: (project: FeedProject) => void
  onView: (project: FeedProject) => void
}) {
  return (
    <Card className="flex h-[400px] flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="line-clamp-2 text-lg">{project.title}</CardTitle>
            <div className="mt-2 flex items-center gap-2">
              <ProfileAvatar profile={ownerProfile(project)} className="size-7 shrink-0" />
              <CardDescription className="line-clamp-1">{ownerProfile(project).name}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">{project.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-5">
        <p className="line-clamp-5 whitespace-pre-line text-sm leading-6 text-muted-foreground">{project.description || "Este projeto ainda não possui uma descrição."}</p>
        <div className="mt-auto flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" aria-hidden="true" />
            <strong className="text-foreground">{project.interestedCount}</strong>
            {project.interestedCount === 1 ? "pessoa interessada" : "pessoas interessadas"}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button type="button" variant="outline" size="sm" onClick={() => onView(project)} className="flex-1 sm:flex-none">
              <Eye data-icon="inline-start" /> Ver detalhes
            </Button>
            <Button
              type="button"
              size="sm"
              variant={project.interested ? "secondary" : "default"}
              disabled={saving || !canExpressInterest}
              aria-pressed={project.interested}
              onClick={() => onToggle(project)}
              className={cn("flex-1 sm:flex-none", project.interested && "text-primary")}
            >
              {saving ? <RefreshCw data-icon="inline-start" className="animate-spin" /> : <Heart data-icon="inline-start" className={cn(project.interested && "fill-current")} />}
              {saving ? "Salvando..." : project.interested ? "Retirar interesse" : "Demonstrar interesse"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectDetailsDialog({ project, saving, canExpressInterest, onToggle, onOpenChange }: {
  project: FeedProject | null
  saving: boolean
  canExpressInterest: boolean
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
              <ProfileAvatar profile={ownerProfile(project)} className="size-10 shrink-0" />
              <div className="min-w-0">
              <DialogTitle className="text-xl leading-7">{project.title}</DialogTitle>
              <DialogDescription className="mt-1 truncate">Publicado por {ownerProfile(project).name}</DialogDescription>
              </div>
            </div>
            <Badge variant="secondary">{project.status}</Badge>
          </div>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {project.area ? <Badge variant="outline">{project.area}</Badge> : null}
          <Badge variant="outline" className="gap-1.5"><Users className="size-3.5" /> {project.interestedCount} {project.interestedCount === 1 ? "interessado" : "interessados"}</Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Descrição do projeto</p>
          <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{project.description || "Este projeto ainda não possui uma descrição."}</p>
        </div>
        <div className="border-t border-border pt-4">
          <Button
            type="button"
            className={cn("w-full sm:w-auto", project.interested && "text-primary")}
            variant={project.interested ? "secondary" : "default"}
            disabled={saving || !canExpressInterest}
            aria-pressed={project.interested}
            onClick={() => onToggle(project)}
          >
            {saving ? <RefreshCw data-icon="inline-start" className="animate-spin" /> : <Heart data-icon="inline-start" className={cn(project.interested && "fill-current")} />}
            {saving ? "Salvando..." : project.interested ? "Retirar interesse" : "Demonstrar interesse"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ProjectFeed() {
  const router = useRouter()
  const { authUser } = useApp()
  const [projects, setProjects] = useState<FeedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [savingIds, setSavingIds] = useState<Set<string>>(() => new Set())
  const [selectedProject, setSelectedProject] = useState<FeedProject | null>(null)
  const canExpressInterest = Boolean(authUser?.profileId)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    listFeedProjects()
      .then((items) => { if (active) setProjects(items) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o feed.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function toggleInterest(project: FeedProject) {
    setSavingIds((previous) => new Set(previous).add(project.id))
    setError("")
    try {
      const updated = project.interested
        ? await withdrawProjectInterest(project.id)
        : await expressProjectInterest(project.id)
      setProjects((previous) => previous.map((item) => item.id === updated.id ? updated : item))
      setSelectedProject((previous) => previous?.id === updated.id ? updated : previous)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar seu interesse.")
    } finally {
      setSavingIds((previous) => {
        const next = new Set(previous)
        next.delete(project.id)
        return next
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-medium"><BriefcaseBusiness className="size-5 text-primary" /> Seu feed de oportunidades</p>
          <p className="mt-1 text-sm text-muted-foreground">Projetos publicados na rede. Seu interesse entra como um sinal adicional nas recomendações.</p>
        </div>
        <Badge variant="outline">{projects.length} {projects.length === 1 ? "projeto" : "projetos"}</Badge>
      </div>

      {!canExpressInterest && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">Complete e salve seu perfil para poder demonstrar interesse nas oportunidades.</p>
            <Button variant="outline" onClick={() => router.push("/profile")}>Completar perfil</Button>
          </CardContent>
        </Card>
      )}

      {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><RefreshCw className="size-4 animate-spin" /> Carregando oportunidades...</p> : null}

      {!loading && projects.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><BriefcaseBusiness className="size-9 text-muted-foreground" /><p className="font-medium">Nenhuma oportunidade aberta no momento.</p><p className="text-sm text-muted-foreground">Novos projetos publicados aparecerão aqui.</p></CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => <FeedCard key={project.id} project={project} saving={savingIds.has(project.id)} canExpressInterest={canExpressInterest} onToggle={toggleInterest} onView={setSelectedProject} />)}
        </div>
      )}
      <ProjectDetailsDialog project={selectedProject} saving={selectedProject ? savingIds.has(selectedProject.id) : false} canExpressInterest={canExpressInterest} onToggle={toggleInterest} onOpenChange={(open) => { if (!open) setSelectedProject(null) }} />
    </div>
  )
}
