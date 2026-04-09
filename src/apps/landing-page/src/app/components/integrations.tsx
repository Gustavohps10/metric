'use client'

const integrations = [
  {
    name: 'Jira',
    description:
      'Sincronize sprints, épicos e tarefas diretamente com seu time tracking.',
    color: '#0052CC',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0052CC">
        <path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.594 24V12.518a1.005 1.005 0 0 0-1.023-1.005zM5.024 5.236H16.59a5.217 5.217 0 0 1-5.228 5.212h-2.13v2.06A5.218 5.218 0 0 1 3.999 17.72V6.241a1.005 1.005 0 0 1 1.025-1.005zM11.571 0h11.571a5.217 5.217 0 0 1-5.228 5.215h-2.134v2.057A5.215 5.215 0 0 1 10.547 12.484V1.005A1.005 1.005 0 0 1 11.571 0z" />
      </svg>
    ),
  },
  {
    name: 'Redmine',
    description: 'Importe projetos, issues e logs de tempo do seu Redmine.',
    color: '#B32024',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#B32024">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v2zm0-4H9V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z" />
      </svg>
    ),
  },
  {
    name: 'Trello',
    description: 'Conecte boards e cards para tracking automático de tarefas.',
    color: '#0079BF',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#0079BF">
        <path d="M21 0H3C1.34 0 0 1.34 0 3v18c0 1.66 1.34 3 3 3h18c1.66 0 3-1.34 3-3V3c0-1.66-1.34-3-3-3zM10.44 18.18c0 .62-.5 1.12-1.12 1.12H5.12C4.5 19.3 4 18.8 4 18.18V5.12C4 4.5 4.5 4 5.12 4h4.2c.62 0 1.12.5 1.12 1.12v13.06zM20 13.18c0 .62-.5 1.12-1.12 1.12h-4.2c-.62 0-1.12-.5-1.12-1.12V5.12c0-.62.5-1.12 1.12-1.12h4.2c.62 0 1.12.5 1.12 1.12v8.06z" />
      </svg>
    ),
  },
  {
    name: 'Slack',
    description:
      'Receba notificações em tempo real e registre horas via comandos.',
    color: '#4A154B',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#E01E5A">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zm-2.523 10.122a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    description: 'Rastreie tempo por commits, pull requests e issues.',
    color: '#ffffff',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="white">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    name: 'Asana',
    description:
      'Gerencie tarefas, projetos e portfolios com tracking integrado.',
    color: '#F06A6A',
    icon: (
      <svg viewBox="0 0 24 24" className="h-8 w-8" fill="#F06A6A">
        <path d="M18.78 12.653c-2.882 0-5.22 2.337-5.22 5.218S15.898 23.09 18.78 23.09 24 20.752 24 17.87s-2.338-5.218-5.22-5.218zm-13.56 0c-2.882 0-5.22 2.337-5.22 5.218S2.338 23.09 5.22 23.09s5.22-2.337 5.22-5.218-2.338-5.218-5.22-5.218zM17.22 5.218C17.22 2.337 14.882 0 12 0S6.78 2.337 6.78 5.218 9.118 10.436 12 10.436s5.22-2.337 5.22-5.218z" />
      </svg>
    ),
  },
]

export function Integrations() {
  return (
    <section id="integrations" className="bg-card relative py-24 lg:py-32">
      {/* Subtle top glow */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, oklch(0.6635 0.1517 255.9445 / 0.3) 50%, transparent 100%)',
        }}
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-primary inline-block text-sm font-semibold tracking-widest uppercase">
            Integrações
          </span>
          <h2 className="text-foreground mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Ecossistema de
            <span className="text-primary"> Integrações</span>
          </h2>
          <p className="text-muted-foreground mt-6 text-lg leading-relaxed">
            Conecte suas ferramentas favoritas e automatize o apontamento de
            horas. Tudo sincronizado em tempo real.
          </p>
        </div>

        {/* Ecosystem grid */}
        <div className="relative mt-16">
          {/* Center connector lines */}
          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex">
            <div className="border-primary h-48 w-48 rounded-full border opacity-20" />
            <div className="border-primary absolute h-80 w-80 rounded-full border opacity-10" />
          </div>

          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map((integration, index) => (
              <div
                key={integration.name}
                className={`lp-card group lp-animate-fade-in-up cursor-pointer p-6 lp-delay-${(index + 1) * 100}`}
              >
                {/* Icon + Name row */}
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{
                      background: `${integration.color}15`,
                      boxShadow: `0 0 0 1px ${integration.color}20`,
                    }}
                  >
                    {integration.icon}
                  </div>
                  <div>
                    <h3 className="text-foreground text-lg font-bold">
                      {integration.name}
                    </h3>
                    <span className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
                      Integrado
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
                  {integration.description}
                </p>

                {/* Bottom accent line */}
                <div
                  className="mt-5 h-0.5 w-0 rounded-full transition-all duration-500 group-hover:w-full"
                  style={{ background: integration.color }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground text-sm">
            E mais integrações em breve...
          </p>
        </div>
      </div>
    </section>
  )
}
