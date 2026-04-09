'use client'

import { useState } from 'react'

const personalPlans = [
  {
    name: 'Free',
    price: 'Grátis',
    period: '',
    badge: 'Uso pessoal',
    description:
      'Para profissionais autônomos e projetos pessoais. Sem limites de tempo.',
    features: [
      'Tracking de tempo ilimitado',
      '1 usuário',
      'Relatórios básicos',
      'Integrações com GitHub',
      'Até 3 projetos',
      'Suporte da comunidade',
      'Self-hosted',
    ],
    cta: 'Começar grátis',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: 'R$50',
    period: '/mês',
    badge: 'Até 3 funcionários',
    description:
      'Para pequenos times que precisam de colaboração e relatórios detalhados.',
    features: [
      'Tudo do Free',
      'Até 3 usuários',
      'Projetos ilimitados',
      'Relatórios avançados',
      'Integrações premium',
      'Suporte prioritário',
      'Dashboard do time',
      'Exportação PDF/CSV',
    ],
    cta: 'Começar teste grátis',
    highlighted: true,
  },
]

const enterprisePlans = [
  {
    name: 'Team',
    price: 'R$200',
    period: '/mês',
    badge: '5 – 100 funcionários',
    description:
      'Para empresas em crescimento que precisam de controle avançado e escala.',
    features: [
      'Tudo do Pro',
      '5 a 100 usuários',
      'SSO / SAML',
      'Auditoria completa',
      'Relatórios corporativos',
      'Gerente de conta dedicado',
      'Treinamento personalizado',
      'SLA garantido 99.9%',
    ],
    cta: 'Falar com vendas',
    highlighted: false,
  },
  {
    name: 'Business',
    price: 'R$1.000',
    period: '/mês',
    badge: '100 – 1.000 funcionários',
    description:
      'Para grandes organizações com necessidades avançadas de segurança e escala global.',
    features: [
      'Tudo do Team',
      '100 a 1.000 usuários',
      'API ilimitada',
      'Deploy on-premise',
      'Ambientes isolados',
      'Múltiplos gerentes de conta',
      'Integrações customizadas',
      'Compliance avançado (SOC 2, ISO)',
    ],
    cta: 'Falar com vendas',
    highlighted: false,
  },
]

type Tab = 'personal' | 'enterprise'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: 'personal',
    label: 'Uso Pessoal',
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    icon: (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
]

function PlanCard({
  plan,
  index,
}: {
  plan: (typeof personalPlans)[0]
  index: number
}) {
  return (
    <div
      className={`lp-animate-fade-in-up lp-delay-${(index + 1) * 100} relative flex flex-col overflow-hidden rounded-2xl border transition-all duration-350 ${
        plan.highlighted
          ? 'border-primary scale-[1.02] lg:scale-105'
          : 'border-border hover:border-ring'
      }`}
      style={{
        background: plan.highlighted
          ? 'linear-gradient(135deg, oklch(0.6635 0.1517 255.9445 / 0.08) 0%, var(--card) 50%, oklch(0.6635 0.1517 255.9445 / 0.05) 100%)'
          : 'var(--card)',
        boxShadow: plan.highlighted
          ? '0 0 60px oklch(0.6635 0.1517 255.9445 / 0.12), 0 0 0 1px oklch(0.6635 0.1517 255.9445 / 0.15)'
          : undefined,
      }}
    >
      {/* Recommended badge */}
      {plan.highlighted && (
        <div
          className="text-primary-foreground flex items-center justify-center py-2 text-xs font-bold tracking-wider uppercase"
          style={{
            background:
              'linear-gradient(135deg, var(--primary), oklch(0.7635 0.1117 255.9445))',
          }}
        >
          ⭐ Recomendado
        </div>
      )}

      <div className="flex flex-1 flex-col p-8">
        {/* Plan name + badge */}
        <div className="flex items-center gap-3">
          <h3 className="text-foreground text-lg font-bold">{plan.name}</h3>
          <span
            className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
            style={{
              background: plan.highlighted
                ? 'oklch(0.6635 0.1517 255.9445 / 0.15)'
                : 'var(--secondary)',
              color: plan.highlighted
                ? 'var(--primary)'
                : 'var(--muted-foreground)',
              border: plan.highlighted
                ? '1px solid oklch(0.6635 0.1517 255.9445 / 0.25)'
                : '1px solid var(--border)',
            }}
          >
            {plan.badge}
          </span>
        </div>

        {/* Price */}
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-foreground text-4xl font-extrabold tracking-tight">
            {plan.price}
          </span>
          {plan.period && (
            <span className="text-muted-foreground text-base">
              {plan.period}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {plan.description}
        </p>

        {/* Divider */}
        <div
          className="my-6 h-px"
          style={{
            background: plan.highlighted
              ? 'linear-gradient(90deg, transparent, oklch(0.6635 0.1517 255.9445 / 0.4), transparent)'
              : 'var(--border)',
          }}
        />

        {/* Features */}
        <ul className="flex-1 space-y-3">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="text-muted-foreground flex items-start gap-3 text-sm"
            >
              <svg
                className="text-primary mt-0.5 h-4 w-4 flex-shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA button */}
        <button
          className="mt-8 w-full cursor-pointer rounded-xl py-3 text-sm font-bold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: plan.highlighted
              ? 'linear-gradient(135deg, var(--primary), oklch(0.7635 0.1117 255.9445))'
              : 'var(--secondary)',
            color: plan.highlighted
              ? 'var(--primary-foreground)'
              : 'var(--foreground)',
            border: plan.highlighted ? 'none' : '1px solid var(--border)',
            boxShadow: plan.highlighted
              ? '0 4px 20px oklch(0.6635 0.1517 255.9445 / 0.3)'
              : undefined,
          }}
        >
          {plan.cta}
        </button>
      </div>
    </div>
  )
}

export function Pricing() {
  const [activeTab, setActiveTab] = useState<Tab>('personal')

  const activePlans = activeTab === 'personal' ? personalPlans : enterprisePlans

  return (
    <section id="pricing" className="bg-secondary relative py-24 lg:py-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[600px] w-[800px] rounded-full opacity-15 blur-[180px]"
          style={{ background: 'var(--primary)' }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-primary inline-block text-sm font-semibold tracking-widest uppercase">
            Preços
          </span>
          <h2 className="text-foreground mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Planos para cada
            <span className="text-primary"> tamanho de time</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Comece grátis e escale conforme sua equipe cresce. Sem surpresas,
            sem taxas escondidas.
          </p>
        </div>

        {/* ─── Tabs ─── */}
        <div className="mt-12 flex justify-center">
          <div
            className="inline-flex items-center gap-1 rounded-xl p-1"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-300"
                  style={{
                    background: isActive
                      ? 'linear-gradient(135deg, var(--primary), oklch(0.7635 0.1117 255.9445))'
                      : 'transparent',
                    color: isActive
                      ? 'var(--primary-foreground)'
                      : 'var(--muted-foreground)',
                    boxShadow: isActive
                      ? '0 4px 16px oklch(0.6635 0.1517 255.9445 / 0.3)'
                      : undefined,
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ─── Plan Cards (animated swap) ─── */}
        <div className="mt-12">
          <div
            key={activeTab}
            className="mx-auto grid max-w-4xl items-start gap-6 lg:grid-cols-2"
            style={{
              animation: 'lp-fade-in-up 0.45s ease-out forwards',
            }}
          >
            {activePlans.map((plan, index) => (
              <PlanCard key={plan.name} plan={plan} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
