"use client"

import { useEffect, useState } from "react"
import { FolderPlus } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { AiDescriptionAssistant } from "@/components/ai-description-assistant"
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
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { Project } from "@/lib/types"

interface ProjectFormProps {
  project?: Project
  onSaved?: (project: Project) => void
  onCancel?: () => void
}

export function ProjectForm({ project, onSaved, onCancel }: ProjectFormProps) {
  const { addProject, updateProject, projects, currentProfile } = useApp()
  const [title, setTitle] = useState(project?.title ?? "")
  const [description, setDescription] = useState(project?.description ?? "")
  const [justPublished, setJustPublished] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const editing = Boolean(project)

  useEffect(() => {
    setTitle(project?.title ?? "")
    setDescription(project?.description ?? "")
    setJustPublished(null)
    setError("")
  }, [project])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const savedProject = {
        id: project?.id ?? `new-project-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
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
                ? "Atualize o título e a descrição completa desta oportunidade."
                : "Descreva a oportunidade com contexto, responsabilidades, resultados esperados e critérios relevantes."}
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
                <div>
                  <AiDescriptionAssistant
                    contextType="VACANCY"
                    value={description}
                    onApply={(text) => {
                      setDescription(text)
                      setJustPublished(null)
                    }}
                  />
                </div>
              </Field>
            </FieldGroup>
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
                <p className="line-clamp-3 text-sm text-muted-foreground">{project.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
