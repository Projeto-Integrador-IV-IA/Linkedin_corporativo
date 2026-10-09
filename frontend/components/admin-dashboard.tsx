"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  BrainCircuit,
  CircleDollarSign,
  Clock3,
  DatabaseZap,
  LogIn,
  LogOut,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAdminUsageMetrics, type AdminUsageMetrics, type LlmUsageSummary } from "@/lib/api"

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 })
const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 6 })

const CONTEXT_LABELS: Record<string, string> = {
  VACANCY: "Vagas",
  PROFILE: "Perfis",
  PORTFOLIO: "Portfólios",
}

const REQUEST_LABELS: Record<string, string> = {
  QUESTIONS: "Perguntas",
  REWRITE: "Reformulações",
}

function compact(value: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value)
}

function KpiCard({ title, value, helper, icon: Icon }: { title: string; value: string; helper: string; icon: typeof Activity }) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 pt-5">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold tabular-nums">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="size-5" /></div>
      </CardContent>
    </Card>
  )
}

function Breakdown({ title, description, rows, labels }: {
  title: string
  description: string
  rows: AdminUsageMetrics["byContext"]
  labels?: Record<string, string>
}) {
  const maximum = Math.max(1, ...rows.map((row) => row.metrics.totalTokens))
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length === 0 && <p className="text-sm text-muted-foreground">Ainda não há chamadas neste período.</p>}
        {rows.map((row) => (
          <div key={row.label} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium">{labels?.[row.label] ?? row.label}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{compact(row.metrics.totalTokens)} tokens · {row.metrics.requests} req.</span>
            </div>
            <Progress value={(row.metrics.totalTokens / maximum) * 100} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AdminDashboard() {
  const [days, setDays] = useState("30")
  const [refreshKey, setRefreshKey] = useState(0)
  const [metrics, setMetrics] = useState<AdminUsageMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    getAdminUsageMetrics(Number(days))
      .then((response) => { if (active) setMetrics(response) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar as métricas.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [days, refreshKey])

  const peak = useMemo(() => Math.max(1, ...(metrics?.daily.map((item) => item.metrics.totalTokens) ?? [])), [metrics])

  if (loading && !metrics) return <div className="flex min-h-64 items-center justify-center text-muted-foreground"><RefreshCw className="mr-2 size-4 animate-spin" /> Carregando métricas...</div>

  if (!metrics) return (
    <Card><CardContent className="pt-6"><p className="text-sm text-destructive">{error || "Não foi possível carregar as métricas."}</p><Button className="mt-4" variant="outline" onClick={() => setRefreshKey((value) => value + 1)}>Tentar novamente</Button></CardContent></Card>
  )

  const totals = metrics.totals
  const month = metrics.currentMonth
  const monthProgress = Math.min(100, (month.elapsedDays / month.daysInMonth) * 100)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Badge variant="secondary">Somente administradores</Badge>{loading && <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />}</div>
          <p className="mt-2 text-sm text-muted-foreground">Atualizado em {new Date(metrics.generatedAt).toLocaleString("pt-BR")} · fuso {metrics.timeZone}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={(value) => value && setDays(value)}>
            <SelectTrigger className="w-36" aria-label="Período das métricas"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setRefreshKey((value) => value + 1)} disabled={loading} aria-label="Atualizar métricas"><RefreshCw /></Button>
        </div>
      </div>

      {error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

      <section aria-labelledby="token-summary" className="space-y-3">
        <div><h2 id="token-summary" className="text-lg font-semibold">Consumo de tokens</h2><p className="text-sm text-muted-foreground">Período de {new Date(`${metrics.periodStart}T12:00:00`).toLocaleDateString("pt-BR")} a {new Date(`${metrics.periodEnd}T12:00:00`).toLocaleDateString("pt-BR")}.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Total processado" value={number.format(totals.totalTokens)} helper={`${decimal.format(totals.averageTokensPerRequest)} por chamada`} icon={Sparkles} />
          <KpiCard title="Tokens de entrada" value={number.format(totals.inputTokens)} helper="Inclui contexto em cache" icon={LogIn} />
          <KpiCard title="Tokens de saída" value={number.format(totals.outputTokens)} helper="Respostas geradas" icon={LogOut} />
          <KpiCard title="Contexto em cache" value={number.format(totals.cachedContextTokens)} helper="Subconjunto da entrada" icon={DatabaseZap} />
          <KpiCard title="Raciocínio" value={number.format(totals.reasoningTokens)} helper="Quando informado pelo modelo" icon={BrainCircuit} />
          <KpiCard title="Requisições" value={number.format(totals.requests)} helper={`${totals.failedRequests} falha(s)`} icon={Activity} />
          <KpiCard title="Taxa de sucesso" value={`${decimal.format(totals.successRate)}%`} helper={`${totals.successfulRequests} concluída(s)`} icon={TrendingUp} />
          <KpiCard title="Latência média" value={`${decimal.format(totals.averageLatencyMs)} ms`} helper={`${totals.uniqueUsers} usuário(s) únicos`} icon={Clock3} />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-primary" /> Projeção do mês</CardTitle>
            <CardDescription>Estimativa linear baseada nos {month.elapsedDays} dias transcorridos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">Consumo atual</p><p className="text-2xl font-bold tabular-nums">{compact(month.actual.totalTokens)}</p></div>
              <div><p className="text-xs text-muted-foreground">Projeção até o fim</p><p className="text-2xl font-bold tabular-nums text-primary">{compact(month.projectedTotalTokens)}</p></div>
              <div><p className="text-xs text-muted-foreground">Chamadas atuais</p><p className="text-xl font-semibold tabular-nums">{number.format(month.actual.requests)}</p></div>
              <div><p className="text-xs text-muted-foreground">Chamadas projetadas</p><p className="text-xl font-semibold tabular-nums">{number.format(month.projectedRequests)}</p></div>
            </div>
            <div className="space-y-2"><div className="flex justify-between text-xs text-muted-foreground"><span>Dia {month.elapsedDays} de {month.daysInMonth}</span><span>{month.remainingDays} dias restantes</span></div><Progress value={monthProgress} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CircleDollarSign className="size-5 text-primary" /> Estimativa de custo</CardTitle>
            <CardDescription>Calculada com os preços por milhão de tokens configurados no servidor.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-muted-foreground">No período</p><p className="text-2xl font-bold tabular-nums">{usd.format(totals.estimatedCostUsd)}</p></div>
              <div><p className="text-xs text-muted-foreground">Projeção mensal</p><p className="text-2xl font-bold tabular-nums text-primary">{usd.format(month.projectedCostUsd)}</p></div>
            </div>
            {!metrics.pricing.configured && <div className="rounded-lg border border-chart-4/30 bg-chart-4/10 p-3 text-sm">Os preços ainda estão em zero. Configure as variáveis de custo para obter estimativas monetárias reais.</div>}
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <span>Entrada: {usd.format(metrics.pricing.inputPerMillion)}/1M</span>
              <span>Saída: {usd.format(metrics.pricing.outputPerMillion)}/1M</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Uso diário</CardTitle><CardDescription>Volume total de tokens por dia; passe o cursor sobre uma barra para ver o valor.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="flex h-52 min-w-[680px] items-end gap-1.5 border-b border-border px-1">
              {metrics.daily.map((item, index) => {
                const height = item.metrics.totalTokens === 0 ? 2 : Math.max(6, (item.metrics.totalTokens / peak) * 180)
                return <div key={item.date} className="group relative flex h-full flex-1 items-end" title={`${new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}: ${number.format(item.metrics.totalTokens)} tokens`}><div className="w-full rounded-t bg-primary/70 transition-colors group-hover:bg-primary" style={{ height }} /><span className="sr-only">{item.date}: {item.metrics.totalTokens} tokens</span>{(metrics.daily.length <= 7 || index % Math.ceil(metrics.daily.length / 7) === 0) && <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">{new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>}</div>
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Breakdown title="Por contexto" description="Onde os tokens foram consumidos." rows={metrics.byContext} labels={CONTEXT_LABELS} />
        <Breakdown title="Por provedor e modelo" description="Distribuição entre as integrações LLM." rows={metrics.byProvider} />
        <Breakdown title="Por operação" description="Perguntas de diagnóstico e reformulações." rows={metrics.byRequestType} labels={REQUEST_LABELS} />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><Users className="size-5 text-primary" /><div><p className="font-medium">{totals.uniqueUsers} usuário(s) utilizaram a IA</p><p className="text-sm text-muted-foreground">Falhas também entram na contagem de requisições e latência.</p></div></div>
          <Badge variant={totals.failedRequests > 0 ? "destructive" : "secondary"}>{totals.failedRequests > 0 ? `${totals.failedRequests} falha(s)` : "Sem falhas no período"}</Badge>
        </CardContent>
      </Card>
    </div>
  )
}
