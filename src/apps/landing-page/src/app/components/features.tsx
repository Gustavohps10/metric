'use client'

const features = [
  {
    icon: (
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: 'Apontamento Sem Esforço',
    description:
      'Monitore cada minuto investido com precisão granular. Nosso sistema de apontamento permite registrar tempo por tarefa, ticket e atividade, gerando visibilidade total sobre o seu dia de trabalho.',
    tag: 'Produtividade',
    image: '/images/feature_apontamento.jpeg',
  },
  {
    icon: (
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
    title: 'Sincronize com suas ferramentas',
    description:
      'Conecte o Metric ao Redmine, Jira ou YouTrack em segundos. Importe suas tarefas e gerencie seu tempo sem sair do fluxo de trabalho que você já domina.',
    tag: 'Conectividade',
    image: '/images/feature_conectividade.jpeg',
  },
  {
    icon: (
      <svg
        className="h-7 w-7"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
    title: 'Métricas de Alta Performance',
    description:
      'Vá além do simples registro de horas. Analise seu nível de Deep Work, identifique trocas de contexto excessivas e monitore sua constância com gráficos avançados que mostram onde sua energia está sendo realmente investida.',
    tag: 'Dashboards',
    image: '/images/feature_dashboard.jpeg',
  },
]

export function Features() {
  return (
    <section id="features" className="bg-secondary relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-primary inline-block text-sm font-semibold tracking-widest uppercase">
            Funcionalidades
          </span>
          <h2 className="text-foreground mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Tudo que você precisa para
            <span className="text-primary"> gerenciar tempo</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`lp-card group lp-animate-fade-in-up overflow-hidden lp-delay-${(index + 1) * 100}`}
            >
              {/* Image area */}
              <div
                className="border-border relative overflow-hidden rounded-t-2xl border-b"
                style={{
                  aspectRatio: '16 / 10',
                }}
              >
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Tag */}
                <span
                  className="text-primary inline-block rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: 'oklch(0.6635 0.1517 255.9445 / 0.12)',
                  }}
                >
                  {feature.tag}
                </span>

                {/* Title */}
                <h3 className="text-foreground mt-4 flex items-center gap-3 text-xl font-bold">
                  <span className="text-primary">{feature.icon}</span>
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
