"use client"

import { useState } from "react"
import { LoaderCircle, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import {
  continueAiDescription,
  finishAiDescription,
  generateAiDescription,
  startAiDescription,
  type AiDescriptionContext,
  type AiDescriptionSession,
} from "@/lib/api"

interface AiDescriptionAssistantProps {
  contextType: AiDescriptionContext
  value: string
  onApply: (text: string) => void
  disabled?: boolean
}

const CONTEXT_LABEL: Record<AiDescriptionContext, string> = {
  VACANCY: "descrição da vaga",
  PROFILE: "descrição profissional",
  PORTFOLIO: "descrição do projeto",
}

export function AiDescriptionAssistant({ contextType, value, onApply, disabled }: AiDescriptionAssistantProps) {
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<AiDescriptionSession | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function start() {
    setOpen(true)
    setLoading(true)
    setError("")
    try {
      const created = await startAiDescription(contextType, value)
      setSession(created)
      setAnswers(created.questions.map(() => ""))
      setDraft(created.text)
    } catch (reason) {
      setError(messageFrom(reason))
    } finally {
      setLoading(false)
    }
  }

  async function generate() {
    if (!session) return
    setLoading(true)
    setError("")
    try {
      const generated = await generateAiDescription(session.sessionId, draft, answers)
      setSession(generated)
      setDraft(generated.text)
      setAnswers([])
    } catch (reason) {
      setError(messageFrom(reason))
    } finally {
      setLoading(false)
    }
  }

  async function continueWithAi() {
    if (!session) return
    setLoading(true)
    setError("")
    try {
      const continued = await continueAiDescription(session.sessionId, draft)
      setSession(continued)
      setAnswers(continued.questions.map(() => ""))
    } catch (reason) {
      setError(messageFrom(reason))
    } finally {
      setLoading(false)
    }
  }

  async function apply(action: "ACCEPT" | "EDIT") {
    if (!session) return
    setLoading(true)
    setError("")
    try {
      const completed = await finishAiDescription(session.sessionId, action, draft)
      onApply(completed.text)
      setOpen(false)
      setSession(null)
    } catch (reason) {
      setError(messageFrom(reason))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={start} disabled={disabled || value.trim().length < 20}>
          <Sparkles data-icon="inline-start" />
          Melhorar com IA
        </Button>
        {value.trim().length < 20 && (
          <span className="text-xs text-muted-foreground">Escreva pelo menos 20 caracteres para ativar a IA.</span>
        )}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assistente para {CONTEXT_LABEL[contextType]}</DialogTitle>
            <DialogDescription>
              A IA fará perguntas para completar o texto. Revise tudo antes de aplicar; nenhuma alteração é salva automaticamente.
            </DialogDescription>
          </DialogHeader>

          {loading && !session && (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <LoaderCircle className="animate-spin" /> Preparando perguntas...
            </div>
          )}

          {session?.status === "QUESTIONS" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium">Responda somente o que souber:</p>
              {session.questions.map((question, index) => (
                <Field key={`${index}-${question}`}>
                  <FieldLabel htmlFor={`ai-answer-${index}`}>{question}</FieldLabel>
                  <Textarea
                    id={`ai-answer-${index}`}
                    rows={2}
                    value={answers[index] ?? ""}
                    onChange={(event) => setAnswers((previous) => previous.map((answer, answerIndex) => answerIndex === index ? event.target.value : answer))}
                    placeholder="Sua resposta (opcional)"
                  />
                </Field>
              ))}
              <Button type="button" onClick={generate} disabled={loading}>
                {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                Gerar versão {session.versionCount + 1} de {session.maxVersions}
              </Button>
            </div>
          )}

          {session?.status === "REVIEW" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Versão {session.versionCount} de {session.maxVersions}</p>
                {!session.canContinue && <span className="text-xs text-muted-foreground">Limite de reformulações atingido</span>}
              </div>
              <Textarea aria-label="Texto reformulado pela IA" rows={12} value={draft} onChange={(event) => setDraft(event.target.value)} />
              <p className="text-xs text-muted-foreground">Você pode editar o texto diretamente antes de aplicá-lo.</p>
            </div>
          )}

          {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

          {session?.status === "REVIEW" && (
            <DialogFooter>
              {session.canContinue && (
                <Button type="button" variant="outline" onClick={continueWithAi} disabled={loading}>
                  Continuar com IA
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={() => apply("EDIT")} disabled={loading || draft.trim().length < 20}>
                Aplicar texto editado
              </Button>
              <Button type="button" onClick={() => apply("ACCEPT")} disabled={loading || draft.trim().length < 20}>
                Aceitar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function messageFrom(reason: unknown) {
  if (!(reason instanceof Error)) return "Não foi possível usar a IA agora."
  try {
    const parsed = JSON.parse(reason.message) as { message?: string }
    if (parsed.message) {
      const nested = JSON.parse(parsed.message) as { message?: string; availableAt?: string }
      return nested.availableAt
        ? `${nested.message ?? "Limite de uso atingido"} Nova tentativa após ${new Date(nested.availableAt).toLocaleString("pt-BR")}.`
        : nested.message ?? parsed.message
    }
  } catch {
    // A API também pode devolver uma mensagem simples.
  }
  return reason.message
}
