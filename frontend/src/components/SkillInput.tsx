import { useState, type KeyboardEvent } from 'react'
import { Badge } from './Badge'

interface SkillInputProps {
  skills: string[]
  onChange: (skills: string[]) => void
  placeholder?: string
}

export function SkillInput({ skills, onChange, placeholder }: SkillInputProps) {
  const [draft, setDraft] = useState('')

  function addSkill() {
    const value = draft.trim()
    if (value && !skills.includes(value)) {
      onChange([...skills, value])
    }
    setDraft('')
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addSkill()
    }
  }

  function removeSkill(skill: string) {
    onChange(skills.filter((existing) => existing !== skill))
  }

  return (
    <div className="rounded-lg border border-slate-300 bg-white p-2">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => removeSkill(skill)}
            className="group"
            title="Remover"
          >
            <Badge tone="brand">
              {skill}
              <span className="ml-1 text-brand-400 group-hover:text-brand-700">×</span>
            </Badge>
          </button>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addSkill}
          placeholder={placeholder ?? 'Digite uma skill e pressione Enter'}
          className="min-w-[160px] flex-1 border-none px-1 py-1 text-sm text-slate-700 outline-none"
        />
      </div>
    </div>
  )
}
