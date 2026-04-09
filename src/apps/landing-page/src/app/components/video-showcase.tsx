'use client'

import { useState } from 'react'

export function VideoShowcase() {
  const [showMessage, setShowMessage] = useState(false)

  return (
    <section id="demo" className="bg-background relative py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[500px] w-[700px] rounded-full opacity-20 blur-[150px]"
          style={{ background: 'var(--primary)' }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-primary inline-block text-sm font-semibold tracking-widest uppercase">
            Demo
          </span>
          <h2 className="text-foreground mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
            Veja o Metric em ação
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Descubra como é simples gerenciar o tempo do seu time.
          </p>
        </div>

        <div className="mt-12">
          <div
            className="lp-animate-pulse-glow relative overflow-hidden rounded-2xl"
            style={{
              padding: '2px',
              background:
                'linear-gradient(135deg, var(--primary) 0%, oklch(0.7635 0.1117 255.9445) 50%, var(--primary) 100%)',
              backgroundSize: '200% 200%',
              animation: 'lp-gradient-shift 4s ease infinite',
            }}
          >
            <div
              className="bg-card relative overflow-hidden rounded-2xl"
              style={{ aspectRatio: '16 / 9' }}
            >
              <DashboardMockup />
              {showMessage ? (
                <ComingSoonOverlay onClose={() => setShowMessage(false)} />
              ) : (
                <PlayOverlay onPlay={() => setShowMessage(true)} />
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DashboardMockup() {
  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="bg-secondary border-border flex h-10 items-center gap-2 border-b px-4">
        <div className="flex gap-1.5">
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: '#ef4444' }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: '#eab308' }}
          />
          <div
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: '#22c55e' }}
          />
        </div>
        <div
          className="bg-card text-muted-foreground ml-4 flex-1 rounded px-3 py-1 text-xs"
          style={{ maxWidth: '300px' }}
        >
          app.metric.io/dashboard
        </div>
      </div>
      <div className="flex flex-1">
        <div className="border-border hidden w-48 flex-col gap-3 border-r p-4 sm:flex">
          {[
            'Dashboard',
            'Projetos',
            'Relatórios',
            'Integrações',
            'Config.',
          ].map((item, i) => (
            <div
              key={item}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}
              style={{
                background:
                  i === 0
                    ? 'oklch(0.6635 0.1517 255.9445 / 0.15)'
                    : 'transparent',
              }}
            >
              <div
                className={`h-1.5 w-1.5 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground'}`}
              />
              {item}
            </div>
          ))}
        </div>
        <div className="flex-1 p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: 'Horas Hoje', v: '6h 30m', t: '+12%' },
              { l: 'Projetos', v: '8', t: '+2' },
              { l: 'Eficiência', v: '94%', t: '+5%' },
            ].map((m) => (
              <div
                key={m.l}
                className="bg-card border-border rounded-xl border p-3"
              >
                <p className="text-muted-foreground text-[9px] sm:text-[10px]">
                  {m.l}
                </p>
                <p className="text-foreground mt-1 text-sm font-bold sm:text-lg">
                  {m.v}
                </p>
                <span
                  className="text-[9px] font-semibold sm:text-[10px]"
                  style={{ color: '#10b981' }}
                >
                  {m.t}
                </span>
              </div>
            ))}
          </div>
          <div
            className="bg-card border-border mt-4 flex items-end gap-1 rounded-xl border p-4"
            style={{ height: '120px' }}
          >
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95, 75, 50, 85, 70].map(
              (h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 13
                        ? 'var(--primary)'
                        : 'linear-gradient(to top, oklch(0.6635 0.1517 255.9445 / 0.3), oklch(0.6635 0.1517 255.9445 / 0.6))',
                    opacity: 0.4 + (h / 100) * 0.6,
                  }}
                />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayOverlay({ onPlay }: { onPlay: () => void }) {
  return (
    <div
      className="group/play absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 transition-opacity duration-300 hover:bg-black/20"
      onClick={onPlay}
    >
      <div
        className="bg-primary flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 group-hover/play:scale-110 sm:h-20 sm:w-20"
        style={{ boxShadow: '0 0 40px oklch(0.6635 0.1517 255.9445 / 0.4)' }}
      >
        <svg
          className="text-primary-foreground ml-1 h-7 w-7 sm:h-8 sm:w-8"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
      </div>
    </div>
  )
}

function ComingSoonOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center"
      style={{
        background: 'oklch(0.1773 0.0089 264.3183 / 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'lp-fade-in 0.4s ease-out forwards',
      }}
      onClick={onClose}
    >
      {/* Icon */}
      <div
        className="mb-5 flex h-16 w-16 items-center justify-center rounded-full sm:h-20 sm:w-20"
        style={{
          background: 'oklch(0.6635 0.1517 255.9445 / 0.15)',
          border: '1px solid oklch(0.6635 0.1517 255.9445 / 0.3)',
          boxShadow: '0 0 40px oklch(0.6635 0.1517 255.9445 / 0.2)',
        }}
      >
        <svg
          className="text-primary h-7 w-7 sm:h-8 sm:w-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-foreground text-xl font-bold sm:text-2xl">
        Disponível em breve
      </h3>
      <p className="text-muted-foreground mt-2 max-w-xs text-center text-sm">
        Estamos preparando um vídeo incrível para você. Fique ligado!
      </p>

      {/* Dismiss hint */}
      <span className="text-muted-foreground/60 mt-6 text-xs">
        Clique para fechar
      </span>
    </div>
  )
}
