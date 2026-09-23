"use client"

import { useEffect, useRef, useState } from "react"
import { Download, FileText, MessageCircle, Mic, Paperclip, Send, Square, X } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ProfileAvatar } from "@/components/profile-avatar"
import { SkillLevelBadge } from "@/components/skill-level-badge"
import { downloadChatAttachment, getRecruiterNote, listMessages, loadChatAttachment, saveRecruiterNote, sendMessage, type ChatConversation, type ChatMessage } from "@/lib/api"
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
  const otherParticipantName = isRecruiter ? conversation.professionalName : conversation.recruiterName
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [content, setContent] = useState("")
  const [attachment, setAttachment] = useState<File | null>(null)
  const [messageError, setMessageError] = useState("")
  const [note, setNote] = useState("")
  const [savingNote, setSavingNote] = useState(false)
  const [newMessagesStartId, setNewMessagesStartId] = useState<string | null>(null)
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({})
  const [recording, setRecording] = useState(false)
  const lastMessageId = useRef<string | null>(null)
  const messageIds = useRef<Set<string>>(new Set())
  const messagesViewport = useRef<HTMLDivElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const attachmentUrlsRef = useRef<Record<string, string>>({})
  const recorder = useRef<MediaRecorder | null>(null)
  const recordingChunks = useRef<Blob[]>([])
  const initialLoad = useRef(true)
  const scrollAfterUpdate = useRef(false)
  const programmaticScroll = useRef(false)

  function isNearBottom() {
    const element = messagesViewport.current
    if (!element) return true
    return element.scrollHeight - element.scrollTop - element.clientHeight < 72
  }

  function scrollToLatest(behavior: ScrollBehavior = "auto") {
    const element = messagesViewport.current
    if (!element) return
    programmaticScroll.current = true
    element.scrollTo({ top: element.scrollHeight, behavior })
    window.setTimeout(() => { programmaticScroll.current = false }, 150)
  }

  function applyMessages(loadedMessages: ChatMessage[]) {
    const firstLoad = initialLoad.current
    const nearBottom = isNearBottom()
    const incoming = loadedMessages.filter((message) => !messageIds.current.has(message.id) && message.senderUserId !== authUser?.id)

    if (firstLoad) {
      initialLoad.current = false
      scrollAfterUpdate.current = true
    } else if (incoming.length > 0) {
      setNewMessagesStartId((current) => current ?? incoming[0].id)
      if (nearBottom) {
        scrollAfterUpdate.current = true
      }
    }

    loadedMessages.forEach((message) => messageIds.current.add(message.id))
    setMessages(loadedMessages)
  }

  async function refresh() {
    const loadedMessages = await listMessages(conversation.id)
    const latest = loadedMessages.at(-1)
    if (lastMessageId.current !== null && latest && latest.id !== lastMessageId.current && latest.senderUserId !== authUser?.id) {
      playNotificationSound()
    }
    if (latest) lastMessageId.current = latest.id
    applyMessages(loadedMessages)
  }

  useEffect(() => {
    let active = true
    Promise.all([listMessages(conversation.id), isRecruiter ? getRecruiterNote(conversation.id) : Promise.resolve({ content: "" })])
      .then(([loadedMessages, loadedNote]) => {
        if (!active) return
        const latest = loadedMessages.at(-1)
        if (latest) lastMessageId.current = latest.id
        applyMessages(loadedMessages)
        setNote(loadedNote.content ?? "")
      })
      .catch(() => undefined)
    const timer = window.setInterval(() => { refresh().catch(() => undefined) }, 2000)
    return () => { active = false; window.clearInterval(timer) }
  }, [conversation.id, isRecruiter])

  useEffect(() => {
    if (!scrollAfterUpdate.current) return
    scrollAfterUpdate.current = false
    requestAnimationFrame(() => scrollToLatest())
  }, [messages])

  useEffect(() => {
    let active = true
    const candidates = messages.filter((message) => message.attachment && !attachmentUrlsRef.current[message.id] && (message.attachment.contentType.startsWith("image/") || message.attachment.contentType.startsWith("audio/")))
    Promise.all(candidates.map(async (message) => {
      try {
        return [message.id, await loadChatAttachment(conversation.id, message.id)] as const
      } catch {
        return null
      }
    })).then((loaded) => {
      if (!active) return
      setAttachmentUrls((current) => {
        const next = Object.fromEntries([...Object.entries(current), ...loaded.filter((item): item is readonly [string, string] => item !== null)])
        attachmentUrlsRef.current = next
        return next
      })
    })
    return () => { active = false }
  }, [conversation.id, messages])

  useEffect(() => {
    Object.values(attachmentUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
    attachmentUrlsRef.current = {}
    setAttachmentUrls({})
  }, [conversation.id])

  useEffect(() => () => {
    Object.values(attachmentUrlsRef.current).forEach((url) => URL.revokeObjectURL(url))
    recorder.current?.stream.getTracks().forEach((track) => track.stop())
  }, [])

  async function submitMessage(event: React.FormEvent) {
    event.preventDefault()
    if (!content.trim() && !attachment) return
    setMessageError("")
    try {
      const sent = await sendMessage(conversation.id, content.trim(), attachment ?? undefined)
      messageIds.current.add(sent.id)
      setMessages((previous) => [...previous, sent])
      setNewMessagesStartId(null)
      scrollAfterUpdate.current = true
      setContent("")
      setAttachment(null)
      if (fileInput.current) fileInput.current.value = ""
    } catch (reason) {
      setMessageError(reason instanceof Error ? reason.message : "Não foi possível enviar a mensagem.")
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorder.current?.stop()
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessageError("A gravação de áudio não é compatível com este navegador.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type))
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recordingChunks.current = []
      recorder.current = mediaRecorder
      mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) recordingChunks.current.push(event.data) }
      mediaRecorder.onstop = () => {
        const type = mediaRecorder.mimeType || "audio/webm"
        const extension = type.includes("ogg") ? "ogg" : type.includes("mp4") ? "mp4" : "webm"
        const file = new File(recordingChunks.current, `audio-${Date.now()}.${extension}`, { type })
        stream.getTracks().forEach((track) => track.stop())
        recorder.current = null
        setRecording(false)
        if (file.size > 5 * 1024 * 1024) setMessageError("O áudio deve ter no máximo 5 MB.")
        else { setMessageError(""); setAttachment(file) }
      }
      mediaRecorder.start()
      setMessageError("")
      setRecording(true)
    } catch {
      setMessageError("Não foi possível acessar o microfone. Verifique a permissão do navegador.")
    }
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
            <CardTitle className="truncate text-base">{otherParticipantName}</CardTitle>
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
            {profile.portfolioProjects && profile.portfolioProjects.length > 0 ? <div className="flex flex-col gap-1.5"><p className="text-xs font-medium">Projetos realizados</p>{profile.portfolioProjects.map((project) => <div key={project.id} className="rounded border border-border p-2 text-xs"><p className="font-medium">{project.title}</p>{project.description && <p className="text-muted-foreground">{project.description}</p>}</div>)}</div> : profile.projects && <p className="text-xs text-muted-foreground">Projetos: {profile.projects}</p>}
            {profile.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{profile.skills.map((skill) => <SkillLevelBadge key={skill.id} level={skill.level} label={skill.name} />)}</div>}
          </div>
        </details>}
        <div
          ref={messagesViewport}
          onScroll={() => { if (!programmaticScroll.current && isNearBottom()) setNewMessagesStartId(null) }}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-lg bg-muted/30 p-3"
        >
          {messages.length === 0 && <p className="m-auto text-center text-sm text-muted-foreground">Comece a conversa com este profissional.</p>}
          {messages.map((message) => {
            const own = message.senderUserId === authUser?.id
            return (
              <div key={message.id} className="flex flex-col gap-2">
                {newMessagesStartId === message.id && (
                  <div className="flex items-center gap-2 py-2 text-xs font-medium text-primary">
                    <span className="h-px flex-1 bg-primary/40" />
                    <span className="shrink-0">Novas mensagens</span>
                    <span className="h-px flex-1 bg-primary/40" />
                  </div>
                )}
                {message.content && <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${own ? "self-end bg-primary text-primary-foreground" : "self-start bg-background"}`}>{message.content}</div>}
                {message.attachment && (message.attachment.contentType.startsWith("image/") && attachmentUrls[message.id] ? <div className={`max-w-[85%] overflow-hidden rounded-xl border ${own ? "self-end border-primary-foreground/30" : "self-start border-border"}`}>
                  <img src={attachmentUrls[message.id]} alt={message.attachment.name} className="max-h-64 w-auto max-w-full object-contain" />
                  <button type="button" onClick={() => downloadChatAttachment(conversation.id, message.id, message.attachment!.name).catch(() => setMessageError("Não foi possível baixar o arquivo."))} className="flex w-full items-center gap-2 border-t px-2 py-1.5 text-left text-xs hover:underline"><Download className="size-3.5" />Baixar imagem</button>
                </div> : message.attachment && message.attachment.contentType.startsWith("audio/") && attachmentUrls[message.id] ? <div className={`flex max-w-[85%] flex-col gap-2 rounded-xl border p-2 ${own ? "self-end border-primary-foreground/30" : "self-start border-border"}`}>
                  <audio controls preload="metadata" src={attachmentUrls[message.id]} className="h-9 max-w-full" />
                  <button type="button" onClick={() => downloadChatAttachment(conversation.id, message.id, message.attachment!.name).catch(() => setMessageError("Não foi possível baixar o áudio."))} className="flex items-center gap-2 text-left text-xs hover:underline"><Download className="size-3.5" />Baixar áudio</button>
                </div> : message.attachment && <button type="button" onClick={() => downloadChatAttachment(conversation.id, message.id, message.attachment!.name).catch(() => setMessageError("Não foi possível baixar o arquivo."))} className={`flex max-w-[85%] items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs underline-offset-2 hover:underline ${own ? "self-end border-primary-foreground/30" : "self-start border-border"}`}>
                  <FileText className="size-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{message.attachment.name}</span><Download className="size-3.5 shrink-0" />
                </button>)}
              </div>
            )
          })}
        </div>
        {attachment && <div className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-xs"><span className="min-w-0 truncate">Arquivo: {attachment.name}</span><Button type="button" variant="ghost" size="icon" className="size-7" onClick={() => { setAttachment(null); if (fileInput.current) fileInput.current.value = "" }}><X /></Button></div>}
        {messageError && <p className="text-xs font-medium text-destructive">{messageError}</p>}
        <form onSubmit={submitMessage} className="flex gap-2">
          <input ref={fileInput} type="file" className="hidden" accept="image/png,image/jpeg,image/webp,audio/*,application/pdf,text/plain,text/csv,application/zip,.doc,.docx,.xls,.xlsx" onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (file.size > 5 * 1024 * 1024) { setMessageError("O arquivo deve ter no máximo 5 MB."); event.target.value = ""; return }
            setMessageError("")
            setAttachment(file)
          }} />
          <Button type="button" variant="outline" size="icon" aria-label="Anexar arquivo" onClick={() => fileInput.current?.click()}><Paperclip /></Button>
          <Button type="button" variant={recording ? "destructive" : "outline"} size="icon" aria-label={recording ? "Parar gravação" : "Gravar áudio"} onClick={toggleRecording}>
            {recording ? <Square className="size-4" /> : <Mic />}
          </Button>
          <Input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Digite uma mensagem..." />
          <Button type="submit" size="icon" aria-label="Enviar mensagem" disabled={recording}><Send /></Button>
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
