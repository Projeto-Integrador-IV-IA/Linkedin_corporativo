"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgeCheck, Check, GraduationCap, MessageCircle, Sparkles, Target, Users, X } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ChatPanel } from "@/components/chat-panel"
import { ProfileAvatar } from "@/components/profile-avatar"
import { SkillLevelBadge } from "@/components/skill-level-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createChat, decideCandidate, listCandidateDecisions, listRecommendations, toMatchResult, type CandidateDecision, type ChatConversation } from "@/lib/api"
import type { MatchResult, Profile } from "@/lib/types"

function scoreTone(score: number) {
  if (score >= 80)
    return {
      text: "text-chart-3",
      bar: "[&_[data-slot=progress-indicator]]:bg-chart-3",
      label: "Excelente match",
    }
  if (score >= 50)
    return {
      text: "text-chart-4",
      bar: "[&_[data-slot=progress-indicator]]:bg-chart-4",
      label: "Bom match",
    }
  return {
    text: "text-muted-foreground",
    bar: "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
    label: "Match parcial",
  }
}

function ProfileDetailDialog({ profile }: { profile: Profile }) {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="w-full">
            <BadgeCheck data-icon="inline-start" />
            Visualizar perfil completo
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <ProfileAvatar profile={profile} className="size-12" />
            <div>
              <DialogTitle>{profile.name}</DialogTitle>
              <DialogDescription>{profile.profession}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <GraduationCap className="mt-0.5 size-4 shrink-0" />
            <span>{profile.education}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">Projetos realizados</p>
            <p className="text-sm text-muted-foreground">{profile.projects}</p>
          </div>
          <Separator />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => (
                <SkillLevelBadge key={s.id} level={s.level} label={s.name} />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CandidateCard({ result, decision, onChat, onDecision }: { result: MatchResult; decision?: CandidateDecision; onChat: () => void; onDecision: (status: CandidateDecision["status"]) => void }) {
  const { profile, score, matchedSkills, missingSkills } = result
  const tone = scoreTone(score)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-3">
          <ProfileAvatar profile={profile} className="size-11" />
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{profile.name}</CardTitle>
            <CardDescription className="truncate">
              {profile.profession}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              Grau de compatibilidade
            </span>
            <span className={`text-2xl font-bold tabular-nums ${tone.text}`}>
              {score}%
            </span>
          </div>
          <Progress
            value={score}
            className={`[&_[data-slot=progress-track]]:h-2 ${tone.bar}`}
          />
          <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Skills em match
          </p>
          {matchedSkills.length === 0 ? (
            <span className="text-sm text-muted-foreground">
              Nenhuma skill correspondente.
            </span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((s) => (
                <Badge
                  key={s.name}
                  className="gap-1 border-transparent bg-chart-3/15 text-chart-3"
                >
                  <BadgeCheck className="size-3" />
                  {s.name}
                  {!s.meetsLevel && (
                    <span className="text-chart-4">({s.candidateLevel})</span>
                  )}
                </Badge>
              ))}
            </div>
          )}
          {missingSkills.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Faltam: {missingSkills.join(", ")}
            </p>
          )}
        </div>

        <div className="mt-auto pt-1">
          <ProfileDetailDialog profile={profile} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button size="sm" variant="outline" onClick={onChat}><MessageCircle data-icon="inline-start" /> Chat</Button>
          <Button size="sm" variant={decision?.status === "ACEITO" ? "default" : "outline"} onClick={() => onDecision("ACEITO")}><Check data-icon="inline-start" /> Aceitar</Button>
          <Button size="sm" variant={decision?.status === "REJEITADO" ? "destructive" : "ghost"} onClick={() => onDecision("REJEITADO")}><X data-icon="inline-start" /> Rejeitar</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MatchDashboard({ projectId }: { projectId?: string }) {
  const { projects, profiles } = useApp()
  const [selectedId, setSelectedId] = useState(projects[0]?.id ?? "")
  const [allCandidates, setAllCandidates] = useState<MatchResult[]>([])
  const [candidates, setCandidates] = useState<MatchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [decisions, setDecisions] = useState<Record<string, CandidateDecision>>({})
  const [chat, setChat] = useState<{ conversation: ChatConversation; profile: Profile } | null>(null)

  const project = useMemo(
    () => projects.find((p) => p.id === (projectId ?? selectedId)) ?? projects[0],
    [projects, projectId, selectedId]
  )

  useEffect(() => {
    if (!projectId && !selectedId && projects[0]) setSelectedId(projects[0].id)
  }, [projectId, projects, selectedId])

  useEffect(() => {
    if (!project || profiles.length === 0) {
      setCandidates([])
      return
    }

    let active = true
    setLoading(true)
    setError("")
    Promise.all([listRecommendations(project.id), listCandidateDecisions(project.id)])
      .then(([response, savedDecisions]) => {
        if (!active) return
        const decisionMap = Object.fromEntries(savedDecisions.map((decision) => [decision.profileId, decision]))
        setDecisions(decisionMap)
        const mappedCandidates = response.results
            .map((result) => {
              const profile = profiles.find((item) => item.id === String(result.candidate_id))
              return profile ? toMatchResult(result, profile, project) : null
            })
            .filter((result): result is MatchResult => result !== null)
        setAllCandidates(mappedCandidates)
        setCandidates(mappedCandidates.filter((result) => decisionMap[result.profile.id]?.status !== "REJEITADO"))
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Não foi possível calcular as recomendações.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [project, profiles])

  async function openChat(profile: Profile) {
    if (!project) return
    try {
      const conversation = await createChat(project.id, profile.id, profile.name, profile.email)
      setChat({ conversation, profile })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível abrir o chat.")
    }
  }

  async function decide(profileId: string, status: CandidateDecision["status"]) {
    if (!project) return
    try {
      const saved = await decideCandidate(project.id, profileId, status)
      setDecisions((previous) => ({ ...previous, [profileId]: saved }))
      if (status === "REJEITADO") {
        setCandidates((previous) => previous.filter((item) => item.profile.id !== profileId))
      } else {
        const restored = allCandidates.find((item) => item.profile.id === profileId)
        if (restored) setCandidates((previous) => previous.some((item) => item.profile.id === profileId) ? previous : [...previous, restored].sort((a, b) => b.score - a.score))
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar a decisão.")
    }
  }

  const topScore = candidates[0]?.score ?? 0

  if (!project) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Nenhum projeto disponível. Publique um projeto para ver as
          recomendações.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-1.5">
              <Badge variant="outline" className="w-fit gap-1.5 text-muted-foreground">
                <Sparkles className="size-3 text-primary" />
                Motor supervisionado de correlação
              </Badge>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <CardDescription className="max-w-2xl">
                {project.description}
              </CardDescription>
            </div>
            {!projectId && (
              <div className="flex w-full flex-col gap-1.5 lg:w-72">
                <label htmlFor="project-select" className="text-sm font-medium">
                  Projeto analisado
                </label>
                <Select
                  value={selectedId}
                  onValueChange={(value) => setSelectedId(value ?? "")}
                >
                  <SelectTrigger id="project-select" className="w-full">
                    <SelectValue>
                      {(value) => projects.find((p) => p.id === value)?.title ?? ""}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Target className="size-4 text-primary" />
              Skills exigidas:
            </span>
            {project.requirements.map((r) => (
              <SkillLevelBadge key={r.id} level={r.minLevel} label={r.name} />
            ))}
          </div>
          <Separator />
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{candidates.length}</strong>{" "}
                candidatos recomendados
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-chart-3" />
              <span className="text-sm text-muted-foreground">
                Melhor match:{" "}
                <strong className="text-foreground">{topScore}%</strong>
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && <p className="text-sm text-muted-foreground">Calculando recomendações pelo modelo...</p>}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {candidates.map((result) => (
          <CandidateCard key={result.profile.id} result={result} decision={decisions[result.profile.id]} onChat={() => openChat(result.profile)} onDecision={(status) => decide(result.profile.id, status)} />
        ))}
      </div>
      {Object.values(decisions).some((decision) => decision.status === "REJEITADO") && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de decisões</CardTitle>
            <CardDescription>Profissionais rejeitados não aparecem na lista principal, mas podem ser reconsiderados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {allCandidates.filter((result) => decisions[result.profile.id]?.status === "REJEITADO").map((result) => (
              <div key={result.profile.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{result.profile.name}</p>
                  <p className="text-sm text-muted-foreground">{result.profile.profession} · {result.score}% de compatibilidade</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => decide(result.profile.id, "PENDENTE")}>Reconsiderar</Button>
                  <Button size="sm" onClick={() => decide(result.profile.id, "ACEITO")}>Aceitar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
      {chat && <ChatPanel conversation={chat.conversation} profile={chat.profile} compact onClose={() => setChat(null)} />}
    </div>
  )
}
