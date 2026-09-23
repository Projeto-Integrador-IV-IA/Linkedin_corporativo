import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { api, ApiError } from '../api/client'
import { Badge } from '../components/Badge'
import { Card } from '../components/Card'
import { SkillInput } from '../components/SkillInput'
import { useAuth } from '../context/AuthContext'
import type { Project } from '../types'

export function ProjectsPage() {
  const { token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [requiredSkills, setRequiredSkills] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function loadProjects() {
    setLoading(true)
    try {
      const data = await api.get<Project[]>('/api/projects', token)
      setProjects(data)
      setError(null)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível carregar as vagas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (requiredSkills.length === 0) {
      setFormError('Adicione ao menos uma skill obrigatória')
      return
    }

    setCreating(true)
    try {
      await api.post('/api/projects', { title, description, requiredSkills }, token)
      setTitle('')
      setDescription('')
      setRequiredSkills([])
      await loadProjects()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível criar a vaga')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <h1 className="text-xl font-bold text-slate-900">Vagas e projetos</h1>
        <p className="mt-1 text-sm text-slate-500">Vagas abertas para recomendação de candidatos.</p>

        {loading && <p className="mt-6 text-sm text-slate-500">Carregando...</p>}
        {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{project.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{project.description}</p>
                </div>
                <Badge tone="neutral">{project.status}</Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.requiredSkills.map((skill) => (
                  <Badge key={skill} tone="brand">
                    {skill}
                  </Badge>
                ))}
              </div>
              <Link
                to="/recommendations"
                state={{ projectId: project.id }}
                className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Ver candidatos recomendados →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card>
          <h2 className="text-lg font-semibold text-slate-900">Nova vaga</h2>
          <form className="mt-4 flex flex-col gap-4" onSubmit={handleCreate}>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Título
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Descrição
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
              Skills obrigatórias
              <SkillInput skills={requiredSkills} onChange={setRequiredSkills} />
            </label>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              disabled={creating}
              className="mt-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {creating ? 'Criando...' : 'Criar vaga'}
            </button>
          </form>
        </Card>
      </section>
    </div>
  )
}
