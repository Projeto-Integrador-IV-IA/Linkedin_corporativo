"use client"

import { useEffect, useState } from "react"
import { MessageCircle, Search } from "lucide-react"

import { ChatPanel } from "@/components/chat-panel"
import { ProfileAvatar } from "@/components/profile-avatar"
import { useApp } from "@/components/app-provider"
import { listChats, type ChatConversation } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

const CHAT_POLL_INTERVAL = 2000

export function ChatPage() {
  const { profiles, authUser } = useApp()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
    let active = true
    const refresh = () =>
      listChats()
        .then((items) => {
          if (!active) return
          setConversations(items)
          setSelectedId((current) => current ?? items[0]?.id ?? null)
        })
        .catch(() => {
          if (active) setConversations([])
        })
    refresh()
    const timer = window.setInterval(refresh, CHAT_POLL_INTERVAL)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const selected = conversations.find((item) => item.id === selectedId)
  const selectedIsRecruiter = selected
    ? selected.recruiterUserId === authUser?.id
    : false
  const profile = selected
    ? profiles.find(
        (item) =>
          item.id ===
          (selectedIsRecruiter
            ? selected.professionalProfileId
            : selected.recruiterProfileId)
      )
    : undefined
  const unreadTotal = conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0
  )
  const filteredConversations = conversations.filter((item) =>
    `${item.recruiterUserId === authUser?.id ? item.professionalName : item.recruiterName} ${item.projectTitle}`
      .toLocaleLowerCase("pt-BR")
      .includes(query.toLocaleLowerCase("pt-BR"))
  )

  return (
    <Card className="overflow-hidden !py-0">
      <div className="grid min-h-[calc(100dvh-220px)] lg:min-h-[650px] lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-border bg-muted/20 lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold">Conversas</h2>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                Conexões que continuam por aqui.
              </p>
              {unreadTotal > 0 && (
                <Badge variant="destructive">
                  {unreadTotal} nova{unreadTotal === 1 ? "" : "s"}
                </Badge>
              )}
            </div>
            <div className="relative mt-5">
              <Search className="absolute left-3 top-3.5 size-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Buscar conversas"
                placeholder="Buscar conversa"
                className="pl-9 text-xs"
              />
            </div>
          </div>
          <div className="flex max-h-64 flex-col overflow-y-auto p-2 md:max-h-[540px]">
            {conversations.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                Nenhuma conversa ainda.
              </p>
            )}
            {conversations.length > 0 && filteredConversations.length === 0 && (
              <p className="p-3 text-xs text-muted-foreground">
                Nenhuma conversa encontrada.
              </p>
            )}
            {filteredConversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={selectedId === conversation.id ? "secondary" : "ghost"}
                className="h-auto justify-start gap-3 p-3 text-left"
                onClick={() => setSelectedId(conversation.id)}
              >
                {profiles.find(
                  (item) =>
                    item.id ===
                    (conversation.recruiterUserId === authUser?.id
                      ? conversation.professionalProfileId
                      : conversation.recruiterProfileId)
                ) ? (
                  <ProfileAvatar
                    profile={
                      profiles.find(
                        (item) =>
                          item.id ===
                          (conversation.recruiterUserId === authUser?.id
                            ? conversation.professionalProfileId
                            : conversation.recruiterProfileId)
                      )!
                    }
                    className="size-9"
                  />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="size-4" />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {conversation.recruiterUserId === authUser?.id
                      ? conversation.professionalName
                      : conversation.recruiterName}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {conversation.projectTitle}
                  </span>
                </span>
                {conversation.unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto shrink-0">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </aside>
        <section className="min-w-0">
          {selected ? (
            <ChatPanel
              key={selected.id}
              conversation={selected}
              profile={profile}
            />
          ) : (
            <CardContent className="flex h-full min-h-80 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
              <span className="mb-3 rounded-2xl bg-secondary p-5 text-primary">
                <MessageCircle className="size-9" strokeWidth={1.3} />
              </span>
              <p className="font-medium text-foreground">
                Uma conversa pode abrir caminhos.
              </p>
              <p className="max-w-64 text-xs leading-relaxed">
                Selecione uma conexão ao lado para acompanhar mensagens e
                combinar os próximos passos.
              </p>
            </CardContent>
          )}
        </section>
      </div>
    </Card>
  )
}
