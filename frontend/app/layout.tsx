import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Projetos e profissionais',
  description:
    'Plataforma interna de recomendação de perfis: cadastre seu perfil, publique projetos e encontre os melhores talentos por grau de compatibilidade.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased transition-colors duration-200">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { try { const theme = localStorage.getItem('synapse-theme'); if (theme === 'dark') { document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme = 'dark'; } } catch (_) {} })()`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
