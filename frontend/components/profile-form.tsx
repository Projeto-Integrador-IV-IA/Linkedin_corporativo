"use client"

import { useEffect, useState } from "react"
import { Plus, Save, Sparkles, Trash2 } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { AiDescriptionAssistant } from "@/components/ai-description-assistant"
import { ProfileAvatar } from "@/components/profile-avatar"
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
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import type { Profile } from "@/lib/types"

let portfolioCounter = 0

function newPortfolioId() {
  portfolioCounter += 1
  return `new-portfolio-${Date.now()}-${portfolioCounter}`
}

export function ProfileForm() {
  const { currentProfile, authUser, saveCurrentProfile } = useApp()
  const [draft, setDraft] = useState<Profile>(currentProfile)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setDraft(currentProfile)
  }, [currentProfile])

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function updatePortfolio(id: string, patch: Partial<NonNullable<Profile["portfolioProjects"]>[number]>) {
    update("portfolioProjects", (draft.portfolioProjects ?? []).map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  function addPortfolio() {
    update("portfolioProjects", [
      ...(draft.portfolioProjects ?? []),
      { id: newPortfolioId(), title: "", description: "" },
    ])
  }

  function removePortfolio(id: string) {
    update("portfolioProjects", (draft.portfolioProjects ?? []).filter((item) => item.id !== id))
  }

  function handlePhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem.")
      return
    }
    if (file.size > 512 * 1024) {
      setError("A foto deve ter no máximo 512 KB.")
      return
    }
    const reader = new FileReader()
    reader.onload = () => update("avatarUrl", String(reader.result ?? ""))
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const persisted = await saveCurrentProfile({
        ...draft,
        email: authUser?.email ?? draft.email?.trim() ?? "",
      })
      setDraft(persisted)
      setSaved(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o perfil.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Dados profissionais</CardTitle>
            <CardDescription>
              Mantenha seu perfil atualizado para melhorar as recomendações do
              motor de correlação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nome</FieldLabel>
                <Input
                  id="name"
                  placeholder="Seu nome completo"
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="profession">Profissão</FieldLabel>
                <Input
                  id="profession"
                  placeholder="Ex.: Engenheira de Software"
                  value={draft.profession}
                  onChange={(e) => update("profession", e.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@empresa.com"
                  value={authUser?.email ?? draft.email ?? ""}
                  readOnly
                  disabled
                  required
                />
                <p className="text-xs text-muted-foreground">O e-mail do perfil é o mesmo usado no login e não pode ser alterado aqui.</p>
              </Field>
              <Field>
                <FieldLabel htmlFor="education">Escolaridade</FieldLabel>
                <Input
                  id="education"
                  placeholder="Ex.: Bacharelado em Ciência da Computação"
                  value={draft.education}
                  onChange={(e) => update("education", e.target.value)}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="professional-description">Descrição profissional</FieldLabel>
                <Textarea
                  id="professional-description"
                  rows={5}
                  placeholder="Resuma sua atuação, especialidades, experiências e resultados profissionais."
                  value={draft.projects}
                  onChange={(event) => update("projects", event.target.value)}
                />
                <div>
                  <AiDescriptionAssistant
                    contextType="PROFILE"
                    value={draft.projects}
                    onApply={(text) => update("projects", text)}
                  />
                </div>
              </Field>
              <FieldSet>
                <FieldLegend variant="label">Projetos realizados</FieldLegend>
                <p className="text-sm text-muted-foreground">Adicione vários projetos. Projetos aceitos em vagas entram automaticamente nesta lista.</p>
                <div className="flex flex-col gap-3">
                  {(draft.portfolioProjects ?? []).map((project) => (
                    <div key={project.id} className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-3">
                      <div className="flex items-start gap-2">
                        <Field className="flex-1">
                          <FieldLabel htmlFor={`portfolio-title-${project.id}`}>Título</FieldLabel>
                          <Input id={`portfolio-title-${project.id}`} placeholder="Ex.: Plataforma de pagamentos" value={project.title} onChange={(event) => updatePortfolio(project.id, { title: event.target.value })} readOnly={Boolean(project.sourceProjectId)} />
                        </Field>
                        {!project.sourceProjectId && <Button type="button" variant="ghost" size="icon" className="mt-6 text-muted-foreground hover:text-destructive" onClick={() => removePortfolio(project.id)} aria-label="Remover projeto"><Trash2 /></Button>}
                      </div>
                      {project.sourceProjectId && <p className="text-xs font-medium text-primary">Projeto aceito automaticamente</p>}
                      <Field>
                        <FieldLabel htmlFor={`portfolio-description-${project.id}`}>Descrição</FieldLabel>
                        <Textarea id={`portfolio-description-${project.id}`} rows={2} placeholder="Descreva sua atuação" value={project.description} onChange={(event) => updatePortfolio(project.id, { description: event.target.value })} readOnly={Boolean(project.sourceProjectId)} />
                        {!project.sourceProjectId && (
                          <div>
                            <AiDescriptionAssistant
                              contextType="PORTFOLIO"
                              value={project.description}
                              onApply={(text) => updatePortfolio(project.id, { description: text })}
                            />
                          </div>
                        )}
                      </Field>
                    </div>
                  ))}
                  {(draft.portfolioProjects ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum projeto adicionado ainda.</p>}
                </div>
                <Button type="button" variant="outline" className="w-fit" onClick={addPortfolio}><Plus data-icon="inline-start" />Adicionar projeto</Button>
              </FieldSet>
              <Field>
                <FieldLabel htmlFor="profile-photo">Foto de perfil</FieldLabel>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <ProfileAvatar profile={draft} className="size-16" />
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Input id="profile-photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePhoto} />
                    <p className="text-xs text-muted-foreground">PNG, JPG ou WebP, até 512 KB.</p>
                  </div>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            <Save data-icon="inline-start" />
            {saving ? "Salvando..." : "Salvar perfil"}
          </Button>
          {saved && (
            <span className="text-sm font-medium text-chart-3">
              Perfil salvo com sucesso.
            </span>
          )}
          {error && <span className="text-sm font-medium text-destructive">{error}</span>}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" />
              Pré-visualização
            </CardTitle>
            <CardDescription>Como seu perfil aparece para o time.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <ProfileAvatar profile={draft} className="size-12" />
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {draft.name || "Seu nome"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {draft.profession || "Sua profissão"}
                </p>
              </div>
            </div>
            {draft.education && (
              <p className="text-sm text-muted-foreground">{draft.education}</p>
            )}
            <Separator />
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Descrição profissional</p>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {draft.projects || "Adicione uma descrição profissional para melhorar sua apresentação e o matching."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
