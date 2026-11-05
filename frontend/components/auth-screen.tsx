"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  Fingerprint,
  Layers3,
  LockKeyhole,
  Network
} from "lucide-react"
import { Brand } from "@/components/brand"

import { useApp } from "@/components/app-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthScreen({
  initialMode = "login"
}: {
  initialMode?: "login" | "register"
}) {
  const { login, register } = useApp()
  const mode = initialMode
  const [showPassword, setShowPassword] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      if (mode === "login") await login(email, password)
      else await register(email, password, name)
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível autenticar."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Brand inverse />
        <div className="auth-story-content">
          <span className="eyebrow">CONEXÕES COM PROPÓSITO</span>
          <h1>
            Seu próximo
            <br />
            capítulo começa
            <br />
            <em>com uma conexão.</em>
          </h1>
          <p>
            Um espaço para apresentar o que você construiu, descobrir novos
            desafios e encontrar pessoas para ir além.
          </p>
          <div className="connection-art" aria-hidden="true">
            <div className="connection-node">
              <Fingerprint size={28} />
            </div>
            <div className="connection-line">
              <i />
              <i />
              <i />
            </div>
            <div className="connection-node center-node">
              <Network size={30} />
            </div>
            <div className="connection-line">
              <i />
              <i />
              <i />
            </div>
            <div className="connection-node">
              <Layers3 size={28} />
            </div>
          </div>
        </div>
        <p className="auth-story-bottom">EXPERIÊNCIA ENCONTRA POSSIBILIDADE.</p>
      </aside>
      <main className="auth-main">
        <Link href="/" className="auth-back">
          <ArrowLeft size={15} /> Voltar ao início
        </Link>
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="auth-form">
          <div className="mb-10 md:hidden">
            <Brand />
          </div>
          <span className="eyebrow mb-3 text-primary">
            {mode === "login"
              ? "BOM TER VOCÊ DE VOLTA"
              : "NOVAS POSSIBILIDADES À VISTA"}
          </span>
          <h2>
            {mode === "login"
              ? "Entre no seu espaço."
              : "Sua história começa aqui."}
          </h2>
          <p>
            {mode === "login"
              ? "Acesse seus projetos, conexões e próximas oportunidades."
              : "Crie sua conta e dê o próximo passo na sua trajetória."}
          </p>
          <form onSubmit={submit} className="flex flex-col gap-5">
            {mode === "register" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-name">Nome</Label>
                  <Input
                    id="auth-name"
                    autoComplete="name"
                    placeholder="Como você quer ser chamado?"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                  />
                </div>
              </>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="auth-email">E-mail</Label>
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="auth-password">Senha</Label>
              <div className="relative">
                <Input
                  id="auth-password"
                  className="pr-11"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder={
                    mode === "register" ? "No mínimo 6 caracteres" : "Sua senha"
                  }
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 px-3 text-muted-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {mode === "login" && <Link href="/forgot-password" className="w-fit text-xs font-semibold text-primary hover:underline">Esqueci minha senha</Link>}
            </div>
            {error && (
              <p
                role="alert"
                className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}
            <Button
              type="submit"
              disabled={saving}
              className="mt-1 h-12 w-full justify-between px-5"
            >
              {saving
                ? "Aguarde..."
                : mode === "login"
                  ? "Entrar"
                  : "Criar conta"}
              <ArrowUpRight size={18} />
            </Button>
          </form>
          <p className="auth-switch">
            {mode === "login" ? "Ainda não faz parte? " : "Já tem uma conta? "}
            <Link href={mode === "login" ? "/register" : "/login"}>
              {mode === "login" ? "Crie sua conta" : "Entre aqui"}
            </Link>
          </p>
          <div className="mt-9 flex items-center justify-center gap-2 border-t border-border pt-6 text-[10px] text-muted-foreground">
            <LockKeyhole size={13} /> Seu espaço de trabalho, em uma só conta.
          </div>
        </div>
      </main>
    </div>
  )
}
