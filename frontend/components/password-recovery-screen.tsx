"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowUpRight, CheckCircle2, Eye, EyeOff, KeyRound, Mail } from "lucide-react"

import { Brand } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { confirmPasswordReset, requestPasswordReset } from "@/lib/api"

function RecoveryAside() {
  return <aside className="auth-story"><Brand inverse /><div className="auth-story-content"><span className="eyebrow">ACESSO COM SEGURANÇA</span><h1>Um novo começo<br /><em>também começa aqui.</em></h1><p>Recupere o acesso com um link seguro e volte ao seu espaço de conexões.</p><div className="connection-art" aria-hidden="true"><div className="connection-node"><Mail size={28} /></div><div className="connection-line"><i /><i /><i /></div><div className="connection-node center-node"><KeyRound size={30} /></div><div className="connection-line"><i /><i /><i /></div><div className="connection-node"><CheckCircle2 size={28} /></div></div></div><p className="auth-story-bottom">SUA CONTA CONTINUA SEGURA.</p></aside>
}

export function ForgotPasswordScreen() {
  const [email, setEmail] = useState("")
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError("")
    try {
      await requestPasswordReset(email)
      setSubmitted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível solicitar a recuperação.")
    } finally {
      setSaving(false)
    }
  }

  return <div className="auth-layout"><RecoveryAside /><main className="auth-main"><Link href="/login" className="auth-back"><ArrowLeft size={15} /> Voltar para entrar</Link><div className="auth-form"><div className="mb-10 md:hidden"><Brand /></div>{submitted ? <div><span className="inline-flex rounded-xl bg-secondary p-3 text-primary"><Mail size={24} /></span><span className="eyebrow mb-3 mt-6 text-primary">CONFIRA SEU E-MAIL</span><h2>Se sua conta existir, enviamos o link.</h2><p>Por segurança, a confirmação é igual para todos os endereços. O link expira em 30 minutos e pode ser usado uma única vez.</p><Link href="/login" className="mt-8 inline-flex"><Button>Voltar para entrar <ArrowUpRight size={18} /></Button></Link></div> : <><span className="eyebrow mb-3 text-primary">RECUPERE SEU ACESSO</span><h2>Vamos criar uma nova senha.</h2><p>Informe seu e-mail. Se houver uma conta associada, você receberá um link seguro para continuar.</p><form onSubmit={submit} className="mt-8 flex flex-col gap-5"><div className="flex flex-col gap-2"><Label htmlFor="recovery-email">E-mail da conta</Label><Input id="recovery-email" type="email" autoComplete="email" placeholder="voce@exemplo.com" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>{error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" disabled={saving} className="h-12 justify-between px-5">{saving ? "Enviando..." : "Enviar link de recuperação"}<ArrowUpRight size={18} /></Button></form></>}</div></main></div>
}

export function ResetPasswordScreen() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    if (password !== confirmation) {
      setError("A confirmação precisa ser igual à nova senha.")
      return
    }
    setSaving(true)
    try {
      await confirmPasswordReset(token, password)
      setCompleted(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível redefinir a senha.")
    } finally {
      setSaving(false)
    }
  }

  const invalidLink = !token
  return <div className="auth-layout"><RecoveryAside /><main className="auth-main"><Link href="/login" className="auth-back"><ArrowLeft size={15} /> Voltar para entrar</Link><div className="auth-form"><div className="mb-10 md:hidden"><Brand /></div>{completed ? <div><span className="inline-flex rounded-xl bg-secondary p-3 text-primary"><CheckCircle2 size={24} /></span><span className="eyebrow mb-3 mt-6 text-primary">SENHA ATUALIZADA</span><h2>Pronto para voltar.</h2><p>Sua senha foi redefinida e as sessões anteriores foram encerradas. Entre novamente para continuar.</p><Link href="/login" className="mt-8 inline-flex"><Button>Entrar com a nova senha <ArrowUpRight size={18} /></Button></Link></div> : <><span className="eyebrow mb-3 text-primary">NOVA SENHA</span><h2>Escolha uma senha segura.</h2><p>Use pelo menos 8 caracteres. Este link funciona uma única vez.</p>{invalidLink ? <p role="alert" className="mt-6 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">Este link está incompleto. Solicite uma nova recuperação de senha.</p> : <form onSubmit={submit} className="mt-8 flex flex-col gap-5"><div className="flex flex-col gap-2"><Label htmlFor="reset-password">Nova senha</Label><div className="relative"><Input id="reset-password" type={showPassword ? "text" : "password"} autoComplete="new-password" className="pr-11" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? "Ocultar senhas" : "Mostrar senhas"} className="absolute inset-y-0 right-0 px-3 text-muted-foreground" onClick={() => setShowPassword((current) => !current)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div><div className="flex flex-col gap-2"><Label htmlFor="reset-confirmation">Confirmar nova senha</Label><Input id="reset-confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>{error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" disabled={saving} className="h-12 justify-between px-5">{saving ? "Redefinindo..." : "Redefinir senha"}<ArrowUpRight size={18} /></Button></form>} {invalidLink && <Link href="/forgot-password" className="mt-6 inline-flex text-sm font-semibold text-primary hover:underline">Solicitar novo link</Link>}</>}</div></main></div>
}
