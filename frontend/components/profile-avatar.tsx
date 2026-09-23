import { UserRound } from "lucide-react"

import type { Profile } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?"
}

export function ProfileAvatar({ profile, className }: { profile: Pick<Profile, "name" | "avatarUrl">; className?: string }) {
  return (
    <Avatar className={cn(className)}>
      {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt={`Foto de ${profile.name}`} />}
      <AvatarFallback className="bg-primary/10 text-primary">
        {profile.name ? initials(profile.name) : <UserRound className="size-4" />}
      </AvatarFallback>
    </Avatar>
  )
}
