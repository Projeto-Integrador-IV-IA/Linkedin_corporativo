"use client"

import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"

import { ChatPanel } from "@/components/chat-panel"
import { ProfileAvatar } from "@/components/profile-avatar"
import { useApp } from "@/components/app-provider"
import { listChats, type ChatConversation } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const CHAT_POLL_INTERVAL = 2000

export function ChatPage() {
  const { profiles, authUser } = useApp()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const refresh = () => listChats().then((items) => {
      if (!active) return
      setConversations(items)
      setSelectedId((current) => current ?? items[0]?.id ?? null)
    }).catch(() => { if (active) setConversations([]) })
    refresh()
    const timer = window.setInterval(refresh, CHAT_POLL_INTERVAL)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const selected = conversations.find((item) => item.id === selectedId)
  const selectedIsRecruiter = selected ? selected.recruiterUserId === authUser?.id : false
  const profile = selected ? profiles.find((item) => item.id === (selectedIsRecruiter ? selected.professionalProfileId : selected.recruiterProfileId)) : undefined
  const unreadTotal = conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)

  return (
    <Card className="overflow-hidden">
      <div className="grid min-h-[calc(100dvh-220px)] md:min-h-[650px] md:grid-cols-[300px_1fr]">
        <aside className="border-b border-border bg-muted/20 md:border-b-0 md:border-r">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Conversas</h2>
            <div className="flex items-center justify-between gap-2"><p className="text-sm text-muted-foreground">Mensagens com profissionais recomendados.</p>{unreadTotal > 0 && <Badge variant="destructive">{unreadTotal} nova{unreadTotal === 1 ? "" : "s"}</Badge>}</div>
          </div>
          <div className="flex flex-col p-2">
            {conversations.length === 0 && <p className="p-3 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>}
            {conversations.map((conversation) => (
              <Button key={conversation.id} variant={selectedId === conversation.id ? "secondary" : "ghost"} className="h-auto justify-start gap-3 p-3 text-left" onClick={() => setSelectedId(conversation.id)}>
                {profiles.find((item) => item.id === (conversation.recruiterUserId === authUser?.id ? conversation.professionalProfileId : conversation.recruiterProfileId)) ? <ProfileAvatar profile={profiles.find((item) => item.id === (conversation.recruiterUserId === authUser?.id ? conversation.professionalProfileId : conversation.recruiterProfileId))!} className="size-9" /> : <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircle className="size-4" /></span>}
                <span className="min-w-0"><span className="block truncate font-medium">{conversation.recruiterUserId === authUser?.id ? conversation.professionalName : conversation.recruiterName}</span><span className="block truncate text-xs text-muted-foreground">{conversation.projectTitle}</span></span>
                {conversation.unreadCount > 0 && <Badge variant="destructive" className="ml-auto shrink-0">{conversation.unreadCount}</Badge>}
              </Button>
            ))}
          </div>
        </aside>
        <section className="min-w-0">
          {selected ? <ChatPanel conversation={selected} profile={profile} /> : <CardContent className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground"><MessageCircle className="size-10" /><p>Selecione uma conversa para começar.</p></CardContent>}
        </section>
      </div>
    </Card>
  )
}
