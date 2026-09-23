import { useEffect, useState, type FormEvent } from 'react'
import { api, ApiError } from '../api/client'
import { Card } from '../components/Card'
import { SkillInput } from '../components/SkillInput'
import { useAuth } from '../context/AuthContext'
import type { Colaborador } from '../types'

export function ProfilePage() {
  const { token, colaborador, updateColaborador } = useAuth()

  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [objective, setObjective] = useState('')
  const [skills, setSkills] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!colaborador) return
    api
      .get<Colaborador>(`/api/profiles/${colaborador.id}`, token)
      .then((data) => {
        setName(data.name)
        setTitle(data.title ?? '')
        setPhone(data.phone ?? '')
        setObjective(data.objective ?? '')
        setSkills(data.skills)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Não foi possível carregar seu perfil'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSuccess(false)

    if (skills.length === 0) {
      setError('Adicione pelo menos uma skill')
      return
    }

    if (!colaborador) return

    setSaving(true)
    try {
      const updated = await api.put<Colaborador>(
        `/api/profiles/${colaborador.id}`,
        { name, title, phone, objective, skills },
        token,
      )
      updateColaborador(updated)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o perfil')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando perfil...</p>
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-xl font-bold text-slate-900">Meu perfil</h1>
      <p className="mt-1 text-sm text-slate-500">
        Mantenha seus dados e habilidades atualizados para aparecer nas recomendações.
      </p>

      <Card className="mt-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Nome completo
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            E-mail
            <input
              disabled
              value={colaborador?.email ?? ''}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Telefone
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ex.: (11) 91234-5678"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Cargo / título
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Desenvolvedora Backend"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Descrição do objetivo
            <textarea
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              rows={3}
              placeholder="Ex.: Migrar para um time de plataforma, ganhar experiência com dados..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
            Skills
            <SkillInput skills={skills} onChange={setSkills} />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-emerald-600">Perfil atualizado com sucesso.</p>}

          <button
            type="submit"
            disabled={saving}
            className="mt-2 self-start rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </Card>
    </div>
  )
}
