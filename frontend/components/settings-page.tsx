"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  Bell,
  Check,
  LogOut,
  Monitor,
  Palette,
  ShieldCheck,
  UserRound
} from "lucide-react"
import { useApp } from "@/components/app-provider"
import { ChangePasswordForm } from "@/components/change-password-form"
import { Button } from "@/components/ui/button"
import { applyTheme } from "@/components/theme-toggle"

export function SettingsPage() {
  const { authUser, logout } = useApp()
  const [theme, setTheme] = useState("light")
  const [sound, setSound] = useState(true)
  const [notice, setNotice] = useState("")
  useEffect(() => {
    const sync = () =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      )
    sync()
    try {
      setSound(localStorage.getItem("synapse-notification-sound") !== "off")
    } catch {
      /* Keep the default when storage is unavailable. */
    }
    window.addEventListener("synapse-theme-change", sync)
    return () => window.removeEventListener("synapse-theme-change", sync)
  }, [])

  function changeTheme(value: "light" | "dark") {
    const persisted = applyTheme(value)
    setTheme(value)
    setNotice(
      persisted
        ? "Aparência salva neste navegador."
        : "Aparência aplicada. Seu navegador não permitiu salvar a preferência."
    )
  }
  function changeSound() {
    const next = !sound
    setSound(next)
    try {
      localStorage.setItem("synapse-notification-sound", next ? "on" : "off")
      setNotice("Preferência de som salva neste navegador.")
    } catch {
      setSound(sound)
      setNotice("Seu navegador não permitiu salvar a preferência de som.")
    }
  }

  return (
    <div className="max-w-5xl">
      <div role="status" className="mb-3 min-h-6 text-xs text-primary">
        {notice}
      </div>
      <section className="settings-section">
        <div className="settings-section-title">
          <UserRound />
          <div>
            <h2>Minha conta</h2>
            <p>Informações usadas para acessar seu espaço.</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Nome da conta</dt>
              <dd className="mt-2 text-sm font-medium">
                {authUser?.displayName}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">
                E-mail de acesso
              </dt>
              <dd className="mt-2 break-all text-sm font-medium">
                {authUser?.email}
              </dd>
            </div>
          </dl>
          {authUser?.role !== "ADMIN" && (
            <Link
              href="/profile"
              className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-primary"
            >
              Editar meu perfil profissional <ArrowUpRight size={15} />
            </Link>
          )}
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title">
          <ShieldCheck />
          <div>
            <h2>Senha e acesso</h2>
            <p>Proteja sua conta e mantenha seu acesso atualizado.</p>
          </div>
        </div>
        <ChangePasswordForm />
      </section>
      <section className="settings-section">
        <div className="settings-section-title">
          <Palette />
          <div>
            <h2>Aparência</h2>
            <p>Escolha o ambiente mais confortável para você.</p>
          </div>
        </div>
        <div>
          <div className="grid max-w-lg grid-cols-2 gap-4">
            {(["light", "dark"] as const).map((value) => (
              <button
                key={value}
                className="theme-option"
                type="button"
                aria-pressed={theme === value}
                onClick={() => changeTheme(value)}
              >
                <span
                  className={`theme-preview ${value === "dark" ? "dark-preview" : ""}`}
                  aria-hidden="true"
                >
                  <i />
                  <span>
                    <b />
                    <b />
                    <b />
                  </span>
                </span>
                <span className="flex items-center justify-between">
                  {value === "light" ? "Claro" : "Escuro"}
                  {theme === value && <Check className="size-4 text-primary" />}
                </span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground">
            A preferência de aparência é salva neste navegador.
          </p>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title">
          <Bell />
          <div>
            <h2>Notificações</h2>
            <p>Escolha como acompanhar novas mensagens.</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-5 rounded-xl border border-border bg-card p-6">
          <div>
            <h3 className="text-sm font-medium">Som de novas mensagens</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Reproduzir um aviso ao receber mensagens com a plataforma aberta
              neste navegador.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={sound}
            aria-label="Som de novas mensagens"
            onClick={changeSound}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${sound ? "bg-primary" : "bg-muted-foreground/40"}`}
          >
            <span
              className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition-[left] ${sound ? "left-6" : "left-1"}`}
            />
          </button>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title">
          <ShieldCheck />
          <div>
            <h2>Conta e sessão</h2>
            <p>Controle o acesso neste navegador.</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <span className="rounded-lg bg-secondary p-3 text-primary">
              <Monitor size={22} />
            </span>
            <div>
              <h3 className="text-sm font-medium">Sessão atual</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Você está conectado neste navegador. Ao sair, será necessário
                entrar novamente para acessar seu espaço.
              </p>
              <p className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-medium text-primary">
                <span className="status-dot" /> Conectada agora
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <Button variant="outline" onClick={logout}>
              <LogOut size={15} /> Sair desta conta
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
