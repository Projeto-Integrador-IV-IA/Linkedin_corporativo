import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Colaborador } from '../types'

interface AuthState {
  token: string | null
  colaborador: Colaborador | null
  login: (token: string, colaborador: Colaborador) => void
  updateColaborador: (colaborador: Colaborador) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | undefined>(undefined)

const TOKEN_KEY = 'talentmatch.token'
const COLABORADOR_KEY = 'talentmatch.colaborador'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [colaborador, setColaborador] = useState<Colaborador | null>(() => {
    const stored = localStorage.getItem(COLABORADOR_KEY)
    return stored ? (JSON.parse(stored) as Colaborador) : null
  })

  const value = useMemo<AuthState>(
    () => ({
      token,
      colaborador,
      login: (newToken, newColaborador) => {
        localStorage.setItem(TOKEN_KEY, newToken)
        localStorage.setItem(COLABORADOR_KEY, JSON.stringify(newColaborador))
        setToken(newToken)
        setColaborador(newColaborador)
      },
      updateColaborador: (updated) => {
        localStorage.setItem(COLABORADOR_KEY, JSON.stringify(updated))
        setColaborador(updated)
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(COLABORADOR_KEY)
        setToken(null)
        setColaborador(null)
      },
    }),
    [token, colaborador],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
