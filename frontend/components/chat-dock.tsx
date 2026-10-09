"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronDown, ChevronUp, ExternalLink, MessageCircle } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ChatPanel } from "@/components/chat-panel"
import { ProfileAvatar } from "@/components/profile-avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { listChats, type ChatConversation } from "@/lib/api"
import type { Profile } from "@/lib/types"

const CHAT_DOCK_POLL_INTERVAL = 4000

type ActiveChat = { conversation: ChatConversation; profile?: Profile }

function participant(conversation: ChatConversation, userId?: string) {
  const isRecruiter = conversation.recruiterUserId === userId
  return {
    id: isRecruiter ? conversation.professionalProfileId : conversation.recruiterProfileId,
    name: isRecruiter ? conversation.professionalName : conversation.recruiterName,
  }
}

export function ChatDock({ onOpenChats }: { onOpenChats: () => void }) {
  const { profiles, authUser, unreadChats } = useApp()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [expanded, setExpanded] = useState(false)
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null)

  useEffect(() => {
    let active = true
    const refresh = () => listChats().then((items) => {
      if (active) setConversations(items)
    }).catch(() => { if (active) setConversations([]) })
    refresh()
    const timer = window.setInterval(refresh, CHAT_DOCK_POLL_INTERVAL)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const recentConversations = useMemo(() => conversations.slice(0, 5), [conversations])

  function openConversation(conversation: ChatConversation) {
    const person = participant(conversation, authUser?.id)
    setActiveChat({ conversation, profile: profiles.find((profile) => profile.id === person.id) })
    // Keep the conversation guide visible, so another chat can be selected quickly.
    setExpanded(true)
  }

  return (
    <aside className="fixed right-3 bottom-0 z-30 flex max-w-[calc(100vw-1.5rem)] items-end gap-2" aria-label="Mensagens rápidas">
      {activeChat ? <>
        <div className="hidden sm:block"><ChatPanel conversation={activeChat.conversation} profile={activeChat.profile} compact embedded onClose={() => setActiveChat(null)} /></div>
        <div className="sm:hidden"><ChatPanel conversation={activeChat.conversation} profile={activeChat.profile} compact onClose={() => setActiveChat(null)} /></div>
      </> : null}
      <div className="w-[min(360px,calc(100vw-1.5rem))]">
        <div className="overflow-hidden rounded-t-xl border border-b-0 border-border bg-card shadow-xl">
          <Button type="button" variant="ghost" className="flex h-12 w-full justify-between rounded-none px-4 hover:bg-muted" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
            <span className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /> <span className="font-semibold">Mensagens</span>{unreadChats > 0 ? <Badge variant="destructive" className="ml-1">{unreadChats > 99 ? "99+" : unreadChats}</Badge> : null}</span>
            {expanded ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
          </Button>
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="min-h-0 overflow-hidden border-t border-border">
              <div className="max-h-[min(360px,calc(100dvh-7rem))] overflow-y-auto p-1.5">
                {recentConversations.length === 0 ? <p className="px-3 py-6 text-center text-sm text-muted-foreground">Nenhuma conversa iniciada ainda.</p> : recentConversations.map((conversation) => {
                  const person = participant(conversation, authUser?.id)
                  const profile = profiles.find((item) => item.id === person.id)
                  const selected = activeChat?.conversation.id === conversation.id
                  return <Button key={conversation.id} type="button" variant={selected ? "secondary" : "ghost"} className="h-auto w-full justify-start gap-3 px-3 py-2.5 text-left" onClick={() => openConversation(conversation)}>
                    {profile ? <ProfileAvatar profile={profile} className="size-10" /> : <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircle className="size-4" /></span>}
                    <span className="min-w-0 flex-1"><span className="block truncate font-medium">{person.name}</span><span className="block truncate text-xs text-muted-foreground">{conversation.projectTitle}</span></span>
                    {conversation.unreadCount > 0 ? <Badge variant="destructive" className="shrink-0">{conversation.unreadCount}</Badge> : null}
                  </Button>
                })}
              </div>
              <div className="border-t border-border p-2">
                <Button type="button" variant="ghost" className="w-full justify-center text-primary" onClick={onOpenChats}><ExternalLink data-icon="inline-start" /> Abrir todas as mensagens</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
