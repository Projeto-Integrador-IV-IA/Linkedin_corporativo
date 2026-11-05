"use client"

import { useState } from "react"
import { Eye, EyeOff, KeyRound } from "lucide-react"

import { useApp } from "@/components/app-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { changePassword } from "@/lib/api"

export function ChangePasswordForm() {
  const { replaceAuthUser } = useApp()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setMessage("")
    if (newPassword !== confirmation) {
      setError("A confirmação precisa ser igual à nova senha.")
      return
    }
    setSaving(true)
    try {
      const user = await changePassword(currentPassword, newPassword)
      replaceAuthUser(user)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmation("")
      setMessage("Senha alterada. Sua sessão foi atualizada com segurança.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível trocar a senha.")
    } finally {
      setSaving(false)
    }
  }

  return <form onSubmit={submit} className="rounded-xl border border-border bg-card p-6">
    <div className="mb-6 flex items-start gap-3"><span className="rounded-lg bg-secondary p-3 text-primary"><KeyRound size={20} /></span><div><h3 className="text-sm font-medium">Trocar senha</h3><p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">Confirme sua senha atual e escolha uma nova senha com pelo menos 8 caracteres.</p></div></div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><Label htmlFor="current-password">Senha atual</Label><div className="relative mt-2"><Input id="current-password" type={showPassword ? "text" : "password"} autoComplete="current-password" className="pr-11" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"} className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
      <div><Label htmlFor="new-password">Nova senha</Label><Input id="new-password" className="mt-2" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required /></div>
      <div><Label htmlFor="confirm-password">Confirmar nova senha</Label><Input id="confirm-password" className="mt-2" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
    </div>
    {error && <p role="alert" className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
    {message && <p role="status" className="mt-4 rounded-lg bg-primary/10 p-3 text-xs text-primary">{message}</p>}
    <Button className="mt-5" type="submit" disabled={saving}>{saving ? "Alterando senha..." : "Salvar nova senha"}</Button>
  </form>
}
