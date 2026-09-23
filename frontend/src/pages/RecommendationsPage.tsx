import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { useAuth } from '../context/AuthContext'
import type { Project, RecommendationResponse } from '../types'

function scoreTone(score: number): 'success' | 'brand' | 'neutral' {
  if (score >= 70) return 'success'
  if (score >= 40) return 'brand'
  return 'neutral'
}

export function RecommendationsPage() {
  const { token } = useAuth()
  const location = useLocation() as { state?: { projectId?: number } }

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(location.state?.projectId ?? null)
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Project[]>('/api/projects', token).then((data) => {
      setProjects(data)
      setSelectedProjectId((current) => current ?? data[0]?.id ?? null)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleRecommend() {
    if (!selectedProjectId) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.post<RecommendationResponse>(
        `/api/matches/recommend/${selectedProjectId}`,
        {},
        token,
      )
      setRecommendation(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível gerar a recomendação')
    } finally {
      setLoading(false)
    }
  }

  const selectedProject = projects.find((project) => project.id === selectedProjectId)

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Recomendação de candidatos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Selecione uma vaga para ver os colaboradores mais compatíveis, ordenados por score.
      </p>

      <Card className="mt-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Vaga
            <select
              value={selectedProjectId ?? ''}
              onChange={(event) => setSelectedProjectId(Number(event.target.value))}
              className="min-w-[280px] rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleRecommend}
            disabled={!selectedProjectId || loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Calculando...' : 'Ver candidatos recomendados'}
          </button>
        </div>

        {selectedProject && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-slate-500">Skills exigidas:</span>
            {selectedProject.requiredSkills.map((skill) => (
              <Badge key={skill} tone="neutral">
                {skill}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {recommendation && (
        <div className="mt-6 flex flex-col gap-4">
          {recommendation.results.map((result) => (
            <Card key={result.colaboradorId}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">{result.name}</h3>
                <Badge tone={scoreTone(result.score)}>{result.score.toFixed(0)}% compatível</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {result.matchedSkills.map((skill) => (
                  <Badge key={skill} tone="success">
                    {skill}
                  </Badge>
                ))}
                {result.skillGaps.map((skill) => (
                  <Badge key={skill} tone="neutral">
                    {skill} (gap)
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
          {recommendation.results.length === 0 && (
            <p className="text-sm text-slate-500">Nenhum candidato encontrado.</p>
          )}
        </div>
      )}
    </div>
  )
}
