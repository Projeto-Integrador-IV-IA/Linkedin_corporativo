import type { MatchResult, Profile, Project, SkillLevel } from "./types"

const LEVEL_VALUE: Record<SkillLevel, number> = {
  Básico: 1,
  Intermediário: 2,
  Avançado: 3,
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

/**
 * Motor de correlação (simulação do Motor de IA).
 * Calcula o grau de compatibilidade de um perfil com um projeto com base
 * na cobertura das skills exigidas e na proximidade dos níveis.
 */
export function computeMatch(profile: Profile, project: Project): MatchResult {
  const requirements = project.requirements.filter((r) => r.name.trim() !== "")

  if (requirements.length === 0) {
    return { profile, score: 0, matchedSkills: [], missingSkills: [] }
  }

  const skillByName = new Map(profile.skills.map((s) => [normalize(s.name), s]))

  let earned = 0
  let total = 0
  const matchedSkills: MatchResult["matchedSkills"] = []
  const missingSkills: string[] = []

  for (const req of requirements) {
    total += LEVEL_VALUE[req.minLevel]
    const owned = skillByName.get(normalize(req.name))

    if (owned) {
      const contribution = Math.min(
        LEVEL_VALUE[owned.level],
        LEVEL_VALUE[req.minLevel]
      )
      earned += contribution
      matchedSkills.push({
        name: req.name,
        candidateLevel: owned.level,
        requiredLevel: req.minLevel,
        meetsLevel: LEVEL_VALUE[owned.level] >= LEVEL_VALUE[req.minLevel],
      })
    } else {
      missingSkills.push(req.name)
    }
  }

  const score = Math.round((earned / total) * 100)

  return { profile, score, matchedSkills, missingSkills }
}

export function rankCandidates(
  profiles: Profile[],
  project: Project
): MatchResult[] {
  return profiles
    .map((profile) => computeMatch(profile, project))
    .sort((a, b) => b.score - a.score)
}
