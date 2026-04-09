import '../index.css'

import type { Metadata } from 'next'
import { Geist_Mono, Inter } from 'next/font/google'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Metric — Apontamento de Horas Inteligente',
  description:
    'Controle cada minuto do seu time com integrações poderosas. Jira, Redmine, Trello, Slack, GitHub e Asana em um só lugar.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col"
        style={{
          fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  )
}
