"use client"

import { useEffect, useMemo, useState } from "react"
import { BadgeCheck, Check, FilterX, GraduationCap, Heart, ListFilter, MessageCircle, RefreshCw, Sparkles, Target, Users, X } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ChatPanel } from "@/components/chat-panel"
import { ProfileAvatar } from "@/components/profile-avatar"
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
  if (score >= 70)
    return {
      text: "text-chart-3",
      bar: "[&_[data-slot=progress-indicator]]:bg-chart-3",
      label: "Alta aderência",
    }
  if (score >= 50)
    return {
      text: "text-chart-4",
      bar: "[&_[data-slot=progress-indicator]]:bg-chart-4",
      label: "Aderência moderada",
    }
  return {
    text: "text-muted-foreground",
    bar: "[&_[data-slot=progress-indicator]]:bg-muted-foreground",
    label: "Baixa aderência",
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
            {profile.portfolioProjects && profile.portfolioProjects.length > 0 ? <div className="flex flex-col gap-2">
              {profile.portfolioProjects.map((project) => <div key={project.id} className="rounded-md border border-border p-2 text-sm">
                <p className="font-medium">{project.title}</p>
                {project.description && <p className="text-muted-foreground">{project.description}</p>}
              </div>)}
            </div> : <p className="text-sm text-muted-foreground">{profile.projects || "Nenhum projeto informado."}</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function CandidateCard({ result, decision, onChat, onDecision }: { result: MatchResult; decision?: CandidateDecision; onChat: () => void; onDecision: (status: CandidateDecision["status"]) => void }) {
  const { profile, score } = result
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
        {result.interested ? (
          <Badge variant="secondary" className="w-fit gap-1.5 text-primary">
            <Heart className="size-3 fill-current" /> Demonstrou interesse
          </Badge>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">
              Índice de aderência textual
            </span>
            <span className={`text-2xl font-bold tabular-nums ${tone.text}`}>
              {score}<span className="ml-0.5 text-sm font-medium">/100</span>
            </span>
          </div>
          <Progress
            value={score}
            className={`[&_[data-slot=progress-track]]:h-2 ${tone.bar}`}
          />
          <span className={`text-xs font-medium ${tone.text}`}>{tone.label}</span>
        </div>

        <p className="line-clamp-4 text-sm text-muted-foreground">
          {profile.projects || "Este profissional ainda não adicionou uma descrição profissional."}
        </p>

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
  const [recalculation, setRecalculation] = useState(0)
  const [minScore, setMinScore] = useState("0")
  const [interestFilter, setInterestFilter] = useState("all")
  const [recommendationLimit, setRecommendationLimit] = useState("10")
  const [filteredTotal, setFilteredTotal] = useState(0)

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
      setAllCandidates([])
      setFilteredTotal(0)
      setLoading(false)
      setError("")
      return
    }

    let active = true
    setLoading(true)
    setError("")
    Promise.all([
      listRecommendations(project.id, {
        minScore: Number(minScore),
        interestedOnly: interestFilter === "interested",
        limit: Number(recommendationLimit),
      }),
      listCandidateDecisions(project.id),
    ])
      .then(([response, savedDecisions]) => {
        if (!active) return
        setFilteredTotal(response.filteredTotal)
        const decisionMap = Object.fromEntries(savedDecisions.map((decision) => [decision.profileId, decision]))
        setDecisions(decisionMap)
        const mappedCandidates = response.results
            .map((result) => {
              const profile = profiles.find((item) => item.id === String(result.candidate_id))
              return profile ? toMatchResult(result, profile) : null
            })
            .filter((result): result is MatchResult => result !== null)
        setAllCandidates(mappedCandidates)
        setCandidates(mappedCandidates.filter((result) => decisionMap[result.profile.id]?.status !== "REJEITADO"))
      })
      .catch((reason: unknown) => {
        if (active) {
          setCandidates([])
          setAllCandidates([])
          setFilteredTotal(0)
          setError(reason instanceof Error ? reason.message : "Não foi possível calcular as recomendações.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [project, profiles, recalculation, minScore, interestFilter, recommendationLimit])

  function recalculate() {
    if (!loading) setRecalculation((value) => value + 1)
  }

  function clearFilters() {
    setMinScore("0")
    setInterestFilter("all")
    setRecommendationLimit("10")
  }

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
  const rejectedCandidates = Object.values(decisions).flatMap((decision) => {
    if (decision.status !== "REJEITADO") return []
    const result = allCandidates.find((item) => item.profile.id === decision.profileId)
    const profile = result?.profile ?? profiles.find((item) => item.id === decision.profileId)
    return profile ? [{ profile, score: result?.score }] : []
  })

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
              {projectId ? <CardTitle className="text-xl">Recomendações de profissionais</CardTitle> : <>
              <Badge variant="outline" className="w-fit gap-1.5 text-muted-foreground">
                <Sparkles className="size-3 text-primary" />
                Motor supervisionado de correlação
              </Badge>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <CardDescription className="max-w-2xl">
                {project.description}
              </CardDescription>
              </>}
            </div>
            <Button type="button" variant="outline" onClick={recalculate} disabled={loading} className="shrink-0">
              <RefreshCw data-icon="inline-start" className={loading ? "animate-spin" : ""} />
              {loading ? "Recalculando..." : "Recalcular recomendações"}
            </Button>
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
          {!projectId && <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Target className="size-4 text-primary" />
            Ranking calculado exclusivamente pelas descrições. O índice apoia a comparação textual e não representa chance de contratação. O interesse declarado é apenas informativo.
          </div>}
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="minimum-score-filter" className="text-sm font-medium">
                Aderência mínima
              </label>
              <Select value={minScore} onValueChange={(value) => setMinScore(value ?? "0")}>
                <SelectTrigger id="minimum-score-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="0">Qualquer pontuação</SelectItem>
                    <SelectItem value="50">50 pontos ou mais</SelectItem>
                    <SelectItem value="60">60 pontos ou mais</SelectItem>
                    <SelectItem value="70">70 pontos ou mais</SelectItem>
                    <SelectItem value="80">80 pontos ou mais</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="interest-filter" className="text-sm font-medium">
                Interesse no projeto
              </label>
              <Select value={interestFilter} onValueChange={(value) => setInterestFilter(value ?? "all")}>
                <SelectTrigger id="interest-filter" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">Todos os profissionais</SelectItem>
                    <SelectItem value="interested">Somente interessados</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="recommendation-limit" className="text-sm font-medium">
                Limite de recomendações
              </label>
              <Select value={recommendationLimit} onValueChange={(value) => setRecommendationLimit(value ?? "10")}>
                <SelectTrigger id="recommendation-limit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="5">Até 5 profissionais</SelectItem>
                    <SelectItem value="10">Até 10 profissionais</SelectItem>
                    <SelectItem value="20">Até 20 profissionais</SelectItem>
                    <SelectItem value="50">Até 50 profissionais</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={clearFilters}
              disabled={minScore === "0" && interestFilter === "all" && recommendationLimit === "10"}
            >
              <FilterX data-icon="inline-start" />
              Limpar
            </Button>
          </div>
          <Separator />
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <ListFilter className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{candidates.length}</strong>{" "}
                exibidos de <strong className="text-foreground">{filteredTotal}</strong> que atendem aos filtros
              </span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="size-4 text-chart-3" />
              <span className="text-sm text-muted-foreground">
                Maior aderência:{" "}
                <strong className="text-foreground">{topScore}/100</strong>
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
      {!loading && !error && candidates.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Users className="size-5" />
            <p>Nenhum profissional atende aos filtros selecionados.</p>
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>Limpar filtros</Button>
          </CardContent>
        </Card>
      )}
      {rejectedCandidates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico de decisões</CardTitle>
            <CardDescription>Profissionais rejeitados não aparecem na lista principal, mas podem ser reconsiderados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {rejectedCandidates.map(({ profile, score }) => (
              <div key={profile.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{profile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.profession}{score !== undefined ? ` · ${score}/100 de aderência` : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => decide(profile.id, "PENDENTE")}>Reconsiderar</Button>
                  <Button size="sm" onClick={() => decide(profile.id, "ACEITO")}>Aceitar</Button>
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
