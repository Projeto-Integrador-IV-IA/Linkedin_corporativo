"use client"

import { Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

const THEME_STORAGE_KEY = "synapse-theme"

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.style.colorScheme = theme
  let persisted = true
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    persisted = false
  }
  window.dispatchEvent(new Event("synapse-theme-change"))
  return persisted
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const sync = () =>
      setTheme(
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      )
    sync()
    window.addEventListener("synapse-theme-change", sync)
    return () => window.removeEventListener("synapse-theme-change", sync)
  }, [])

  function toggleTheme() {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark"
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
