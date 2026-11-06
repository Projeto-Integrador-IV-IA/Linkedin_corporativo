import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Synapse — Conexões com propósito",
    template: "%s | Synapse"
  },
  description:
    "Conecte sua experiência a novas oportunidades. Explore projetos, apresente seu portfólio e encontre profissionais com a Synapse.",
  icons: {
    icon: "/synapse-icon.svg",
    apple: "/apple-icon.png"
  }
}

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#101c1b" }
  ]
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased transition-colors duration-200">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const theme = localStorage.getItem('synapse-theme'); if (theme === 'dark') { document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme = 'dark'; } } catch (_) {} })()`
          }}
        />
        {children}
      </body>
    </html>
  )
}
