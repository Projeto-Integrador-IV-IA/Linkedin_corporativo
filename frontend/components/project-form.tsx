"use client"

import { useEffect, useState } from "react"
import { FolderPlus, ListChecks, Plus, Trash2 } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { SkillLevelBadge } from "@/components/skill-level-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  SKILL_LEVELS,
  type Project,
  type Requirement,
  type SkillLevel,
} from "@/lib/types"

let reqCounter = 0
function newReqId() {
  reqCounter += 1
  return `new-req-${Date.now()}-${reqCounter}`
}

function emptyRequirement(): Requirement {
  return { id: newReqId(), name: "", minLevel: "Intermediário" }
}

interface ProjectFormProps {
  project?: Project
  onSaved?: (project: Project) => void
  onCancel?: () => void
}

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const { addProject, updateProject, projects, currentProfile } = useApp()
  const [title, setTitle] = useState(project?.title ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [requirements, setRequirements] = useState<Requirement[]>(
    project?.requirements.length ? project.requirements : [emptyRequirement()]
  )
  const [justPublished, setJustPublished] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const editing = Boolean(project)

  useEffect(() => {
    setTitle(project?.title ?? "")
    setDescription(project?.description ?? "")
    setRequirements(project?.requirements.length ? project.requirements : [emptyRequirement()])
    setJustPublished(null)
    setError("")
  }, [project])

  function updateRequirement(id: string, patch: Partial<Requirement>) {
    setRequirements((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    )
    setJustPublished(null)
  }

  function addRequirement() {
    setRequirements((prev) => [...prev, emptyRequirement()])
  }

  function removeRequirement(id: string) {
    setRequirements((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = Array.from(new Map(requirements.filter((r) => r.name.trim() !== "").map((r) => [r.name.trim().toLowerCase(), { ...r, name: r.name.trim() }])).values())
    setSaving(true)
    setError("")
    try {
      const savedProject = {
        id: project?.id ?? `new-project-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        requirements: cleaned,
        area: project?.area ?? "",
        ownerName: project?.ownerName,
        ownerEmail: project?.ownerEmail,
        status: project?.status,
      }
      const persisted = editing
        ? await updateProject(savedProject, project!)
        : await addProject(savedProject)
      setJustPublished(editing ? "Projeto atualizado com sucesso." : title.trim())
      if (!editing) {
        setTitle("")
        setDescription("")
        setRequirements([emptyRequirement()])
      }
      onSaved?.(persisted)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível publicar o projeto.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
              <CardTitle>{editing ? "Editar projeto" : "Publicar novo projeto ou pesquisa"}</CardTitle>
            <CardDescription>
              {editing
                ? "Atualize os dados e as skills exigidas deste projeto."
                : "Descreva a oportunidade e defina as skills exigidas para que o time possa se candidatar."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="title">Título do projeto</FieldLabel>
                <Input
                  id="title"
                  placeholder="Ex.: Nova plataforma de recomendação interna"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    setJustPublished(null)
                  }}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="description">Descrição</FieldLabel>
                <Textarea
                  id="description"
                  rows={5}
                  placeholder="Explique o objetivo, o contexto e o que se espera dos candidatos."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value)
                    setJustPublished(null)
                  }}
                  required
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="size-5 text-primary" />
              Campos de exigência
            </CardTitle>
            <CardDescription>
              Liste as skills necessárias e o nível mínimo desejado para cada uma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldSet>
              <FieldLegend variant="label" className="sr-only">
                Skills exigidas
              </FieldLegend>
              <div className="flex flex-col gap-3">
                {requirements.map((req) => (
                  <div
                    key={req.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:flex-row sm:items-end"
                  >
                    <Field className="flex-1">
                      <FieldLabel htmlFor={`req-${req.id}`}>
                        Skill exigida
                      </FieldLabel>
                      <Input
                        id={`req-${req.id}`}
                        placeholder="Ex.: React, Python, SQL"
                        value={req.name}
                        onChange={(e) =>
                          updateRequirement(req.id, { name: e.target.value })
                        }
                      />
                    </Field>
                    <Field className="sm:w-48">
                      <FieldLabel htmlFor={`req-level-${req.id}`}>
                        Nível mínimo
                      </FieldLabel>
                      <Select
                        value={req.minLevel}
                        onValueChange={(value) =>
                          updateRequirement(req.id, {
                            minLevel: value as SkillLevel,
                          })
                        }
                      >
                        <SelectTrigger
                          id={`req-level-${req.id}`}
                          className="w-full"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {SKILL_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeRequirement(req.id)}
                      aria-label={`Remover exigência ${req.name || ""}`}
                    >
                      <Trash2 data-icon="inline-start" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-fit"
                onClick={addRequirement}
              >
                <Plus data-icon="inline-start" />
                Adicionar exigência
              </Button>
            </FieldSet>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={saving || !currentProfile.email}>
            <FolderPlus data-icon="inline-start" />
            {saving ? "Salvando..." : editing ? "Salvar alterações" : "Publicar projeto"}
          </Button>
          {justPublished && (
            <span className="text-sm font-medium text-chart-3">
              &quot;{justPublished}&quot; publicado com sucesso.
            </span>
          )}
          {error && <span className="text-sm font-medium text-destructive">{error}</span>}
        </div>
      </form>

      <div className="flex flex-col gap-4">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="text-base">Projetos publicados</CardTitle>
            <CardDescription>
              {projects.length} projeto(s) publicado(s).
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3"
              >
                <p className="text-sm font-medium leading-snug">
                  {project.title}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {project.requirements.map((r) => (
                    <SkillLevelBadge key={r.id} level={r.minLevel} label={r.name} />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
