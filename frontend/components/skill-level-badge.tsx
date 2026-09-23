import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SkillLevel } from "@/lib/types"

const LEVEL_STYLES: Record<SkillLevel, string> = {
  Básico: "border-transparent bg-chart-4/15 text-chart-4",
  Intermediário: "border-transparent bg-chart-2/15 text-chart-2",
  Avançado: "border-transparent bg-chart-3/15 text-chart-3",
}

export function SkillLevelBadge({
  level,
  label,
  className,
}: {
  level: SkillLevel
  label?: string
  className?: string
}) {
  return (
    <Badge className={cn("font-medium", LEVEL_STYLES[level], className)}>
      {label ? `${label} · ${level}` : level}
    </Badge>
  )
}
