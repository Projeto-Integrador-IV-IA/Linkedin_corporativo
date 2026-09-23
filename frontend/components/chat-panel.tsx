"use client"

import { useEffect, useRef, useState } from "react"
import { MessageCircle, Send, X } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ProfileAvatar } from "@/components/profile-avatar"
import { SkillLevelBadge } from "@/components/skill-level-badge"
import { getRecruiterNote, listMessages, saveRecruiterNote, sendMessage, type ChatConversation, type ChatMessage } from "@/lib/api"
import type { Profile } from "@/lib/types"
import { playNotificationSound } from "@/lib/notification-sound"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface ChatPanelProps {
  conversation: ChatConversation
  profile?: Profile
  compact?: boolean
  onClose?: () => void
}

export function ChatPanel({ conversation, profile, compact = false, onClose }: ChatPanelProps) {
  const { authUser } = useApp()
  const isRecruiter = conversation.recruiterUserId === authUser?.id
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [content, setContent] = useState("")
  const [note, setNote] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const lastMessageId = useRef<string | null>(null)

  async function refresh() {
    const loadedMessages = await listMessages(conversation.id)
    const latest = loadedMessages.at(-1)
    if (lastMessageId.current !== null && latest && latest.id !== lastMessageId.current && latest.senderUserId !== authUser?.id) {
      playNotificationSound()
    }
    if (latest) lastMessageId.current = latest.id
    setMessages(loadedMessages)
  }

  useEffect(() => {
    let active = true
    Promise.all([listMessages(conversation.id), isRecruiter ? getRecruiterNote(conversation.id) : Promise.resolve({ content: "" })])
      .then(([loadedMessages, loadedNote]) => {
        if (!active) return
        const latest = loadedMessages.at(-1)
        if (latest) lastMessageId.current = latest.id
        setMessages(loadedMessages)
        setNote(loadedNote.content ?? "")
      })
      .catch(() => undefined)
    const timer = window.setInterval(() => { refresh().catch(() => undefined) }, 2000)
    return () => { active = false; window.clearInterval(timer) }
  }, [conversation.id, isRecruiter])

  async function submitMessage(event: React.FormEvent) {
    event.preventDefault()
    if (!content.trim()) return
    const sent = await sendMessage(conversation.id, content.trim())
    setMessages((previous) => [...previous, sent])
    setContent("")
  }

  async function saveNote() {
    setSavingNote(true)
    try { await saveRecruiterNote(conversation.id, note) } finally { setSavingNote(false) }
  }

  return (
    <Card className={compact ? "fixed bottom-2 right-2 z-50 flex h-[min(520px,calc(100dvh-1rem))] w-[calc(100vw-1rem)] max-w-[380px] flex-col shadow-2xl sm:bottom-4 sm:right-4" : "flex h-[min(650px,calc(100dvh-220px))] min-h-[520px] flex-col"}>
      <CardHeader className="flex flex-row items-center justify-between border-b py-3">
        <div className="flex min-w-0 items-center gap-2">
          {profile ? <ProfileAvatar profile={profile} className="size-9" /> : <MessageCircle className="size-5 text-primary" />}
          <div className="min-w-0">
            <CardTitle className="truncate text-base">{conversation.professionalName}</CardTitle>
            <p className="truncate text-xs text-muted-foreground">{conversation.projectTitle}</p>
          </div>
        </div>
        {onClose && <Button variant="ghost" size="icon" onClick={onClose}><X /></Button>}
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 p-3">
        {profile && <details className="rounded-lg border border-border p-2">
          <summary className="cursor-pointer text-sm font-medium">Ver perfil do profissional</summary>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            <p className="font-medium">{profile.name}</p>
            <p className="text-muted-foreground">{profile.profession}</p>
            {profile.education && <p className="text-xs text-muted-foreground">Formação: {profile.education}</p>}
            {profile.projects && <p className="text-xs text-muted-foreground">Projetos: {profile.projects}</p>}
            {profile.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{profile.skills.map((skill) => <SkillLevelBadge key={skill.id} level={skill.level} label={skill.name} />)}</div>}
          </div>
        </details>}
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-muted/30 p-3">
          {messages.length === 0 && <p className="m-auto text-center text-sm text-muted-foreground">Comece a conversa com este profissional.</p>}
          {messages.map((message) => {
            const own = message.senderUserId === authUser?.id
            return <div key={message.id} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${own ? "self-end bg-primary text-primary-foreground" : "self-start bg-background"}`}>{message.content}</div>
          })}
        </div>
        <form onSubmit={submitMessage} className="flex gap-2">
          <Input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Digite uma mensagem..." />
          <Button type="submit" size="icon" aria-label="Enviar mensagem"><Send /></Button>
        </form>
        {isRecruiter && <details className="rounded-lg border border-border p-2">
          <summary className="cursor-pointer text-sm font-medium">Nota particular do recrutador</summary>
          <div className="mt-2 flex flex-col gap-2">
            {profile && <p className="text-xs text-muted-foreground">Apenas você verá esta nota sobre {profile.name}.</p>}
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Registre uma observação privada..." rows={3} />
            <Button size="sm" variant="outline" onClick={saveNote} disabled={savingNote}>{savingNote ? "Salvando..." : "Salvar nota"}</Button>
          </div>
        </details>}
      </CardContent>
    </Card>
  )
}
