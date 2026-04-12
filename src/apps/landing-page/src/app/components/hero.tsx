'use client'

import { Button } from '@timelapse/ui/components'

export function Hero() {
  return (
    <section
      id="hero"
      className="bg-background relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        {/* Gradient orbs */}
        <div
          className="lp-animate-float absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]"
          style={{ background: 'var(--primary)' }}
        />
        <div
          className="lp-animate-float lp-delay-300 absolute right-1/4 -bottom-32 h-[400px] w-[400px] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'var(--primary)' }}
        />

        {/* Dot pattern */}
        <div className="lp-dot-pattern absolute inset-0 opacity-40" />

        {/* Radial gradient fade */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, transparent 30%, var(--background) 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-32 text-center lg:px-8">
        {/* Badge */}
        <div
          className="lp-animate-fade-in-up mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: 'oklch(0.6635 0.1517 255.9445 / 0.12)',
            border: '1px solid oklch(0.6635 0.1517 255.9445 / 0.25)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: 'var(--primary)' }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ background: 'var(--primary)' }}
            />
          </span>
          <span className="text-primary text-sm font-medium">
            Novo: Integração nativa com GitHub
          </span>
        </div>

        {/* Headline */}
        <h1 className="lp-animate-fade-in-up lp-delay-100 text-foreground text-5xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Controle cada minuto.
          <br />
          <span
            className="lp-animate-gradient"
            style={{
              backgroundImage:
                'linear-gradient(135deg, var(--primary) 0%, oklch(0.7635 0.1117 255.9445) 50%, var(--primary) 100%)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Maximize sua eficiência.
          </span>
        </h1>

        {/* Subtext */}
        <p className="lp-animate-fade-in-up lp-delay-200 text-muted-foreground mx-auto mt-8 max-w-2xl text-lg leading-relaxed sm:text-xl">
          Plataforma inteligente de apontamento de horas com integrações
          poderosas. Conecte Jira, Redmine, Trello e mais — tudo sincronizado
          automaticamente.
        </p>

        {/* CTAs */}
        <div className="lp-animate-fade-in-up lp-delay-300 mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button> Começar Grátis </Button>
          <a
            id="cta-hero-demo"
            href="#demo"
            className="border-ring text-primary inline-flex h-13 items-center rounded-xl border px-8 text-base font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            style={{
              background: 'oklch(0.6635 0.1517 255.9445 / 0.06)',
            }}
          >
            <svg
              className="mr-2 h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Ver Demo
          </a>
        </div>

        {/* Stats */}
        <div className="lp-animate-fade-in-up lp-delay-500 mt-20 grid grid-cols-3 gap-8 sm:gap-16">
          {[
            { value: '10k+', label: 'Horas rastreadas' },
            { value: '6+', label: 'Integrações' },
            { value: '99.9%', label: 'Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-foreground text-2xl font-extrabold tracking-tight sm:text-3xl">
                {stat.value}
              </div>
              <div className="text-muted-foreground mt-1 text-sm font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute right-0 bottom-0 left-0 h-32"
        style={{
          background:
            'linear-gradient(to top, var(--card) 0%, transparent 100%)',
        }}
      />
    </section>
  )
}
