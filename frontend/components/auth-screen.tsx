"use client"

import { useState } from "react"
import Image from "next/image"
import { LockKeyhole } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AuthScreen() {
  const { login, register } = useApp()
  const [mode, setMode] = useState<"login" | "register">("login")
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
      setError(reason instanceof Error ? reason.message : "Não foi possível autenticar.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="relative mx-auto mb-2 h-16 w-48">
            <Image src="/placeholder-logo-dark.png" alt="Logo da plataforma" fill className="object-contain dark:hidden" priority />
            <Image src="/placeholder-logo-light.png" alt="Logo da plataforma" fill className="hidden scale-[0.84] object-contain dark:block" priority />
          </div>
          <CardDescription>{mode === "login" ? "Entre para gerenciar seus projetos e conversas." : "Crie sua conta para publicar projetos."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            {mode === "register" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="auth-name">Nome</Label>
                <Input id="auth-name" value={name} onChange={(event) => setName(event.target.value)} required />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="auth-email">E-mail</Label>
              <Input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="auth-password">Senha</Label>
              <Input id="auth-password" type="password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving} className="w-full">
              <LockKeyhole data-icon="inline-start" />
              {saving ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }}>
              {mode === "login" ? "Ainda não tenho conta" : "Já tenho uma conta"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
