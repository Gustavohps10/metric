import {
  Badge,
  Button,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@timelapse/ui/components'
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  ChevronRight,
  Clock,
  CloudOff,
  Database,
  Github,
  GitMerge,
  HardDrive,
  Layers,
  LayoutDashboard,
  Linkedin,
  Lock,
  Play,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Timer,
  Twitter,
  User,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react'
import * as React from 'react'

import { DownloadCTA } from '@/app/components/download-cta'
import { ServerSideModeToggle } from '@/components/mode-toggle'

// --- Mock Data ---

const FEATURES = [
  {
    icon: <Timer className="size-5" />,
    problem: 'Você esquece de registrar o que fez ontem',
    title: 'Apontamento que não interrompe seu fluxo',
    description:
      'Um atalho de teclado inicia o timer. Ele roda offline, sem latência, sem distrações. Quando você voltar, o contexto já está salvo.',
    tag: 'Core',
    accent: 'from-violet-500/20 to-indigo-500/5',
    border: 'hover:border-violet-500/40',
    glow: 'group-hover:shadow-violet-500/10',
  },
  {
    icon: <GitMerge className="size-5" />,
    problem: 'Seus dados ficam presos em silos de ferramentas',
    title: 'Uma camada de sync entre todos os seus trackers',
    description:
      'Conecte Redmine, Jira ou YouTrack. O Metric actua como bridge — os dados fluem nos dois sentidos sem conflito.',
    tag: 'Integração',
    accent: 'from-sky-500/20 to-cyan-500/5',
    border: 'hover:border-sky-500/40',
    glow: 'group-hover:shadow-sky-500/10',
  },
  {
    icon: <Activity className="size-5" />,
    problem: 'Você não sabe quantas horas realmente foram produtivas',
    title: 'Métricas de Deep Work com resolução de minutos',
    description:
      'Detecta trocas de contexto, calcula sessões de foco real e apresenta um score diário de performance — tudo calculado localmente.',
    tag: 'Insights',
    accent: 'from-emerald-500/20 to-teal-500/5',
    border: 'hover:border-emerald-500/40',
    glow: 'group-hover:shadow-emerald-500/10',
  },
]

const INTEGRATIONS = [
  {
    name: 'Jira',
    desc: 'Crie tickets, atualize status e registre horas diretamente nos issues. Nenhuma aba extra.',
    status: 'live' as const,
    accentBg: 'bg-[#0052CC]/5',
    accentBorder: 'border-[#0052CC]/15',
    icon: (
      <svg viewBox="0 0 32 32" className="size-5" fill="none">
        <path
          d="M2 18.857L13.143 7.714 16 4.571 18.857 7.714 29.143 18.857 16 27.429 2 18.857z"
          fill="#0052CC"
        />
        <path d="M16 4.571L13.143 7.714H18.857L16 4.571z" fill="#2684FF" />
      </svg>
    ),
  },
  {
    name: 'Redmine',
    desc: 'Sincroniza time entries e atualiza o percentual de avanço dos tickets via REST API.',
    status: 'live' as const,
    accentBg: 'bg-red-600/5',
    accentBorder: 'border-red-600/15',
    icon: <LayoutDashboard className="size-5 text-red-500" />,
  },
  {
    name: 'GitHub',
    desc: 'Linka commits e PRs com sessões de trabalho. Veja quanto tempo cada issue realmente levou.',
    status: 'live' as const,
    accentBg: 'bg-muted/30',
    accentBorder: 'border-border/40',
    icon: <Github className="size-5" />,
  },
  {
    name: 'YouTrack',
    desc: 'Registra work items e sprints. Compatível com instâncias cloud e self-hosted.',
    status: 'live' as const,
    accentBg: 'bg-amber-500/5',
    accentBorder: 'border-amber-500/15',
    icon: <Zap className="size-5 text-amber-500" />,
  },
  {
    name: 'Linear',
    desc: 'Sync de cycles e issues com resolução automática de estado via webhook.',
    status: 'soon' as const,
    accentBg: 'bg-violet-500/5',
    accentBorder: 'border-violet-500/15',
    icon: <Layers className="size-5 text-violet-400" />,
  },
  {
    name: 'GitLab',
    desc: 'Acompanha MRs, pipelines e time tracking nativo via GitLab API v4.',
    status: 'soon' as const,
    accentBg: 'bg-orange-500/5',
    accentBorder: 'border-orange-500/15',
    icon: <GitMerge className="size-5 text-orange-400" />,
  },
]

const OFFLINE_STEPS = [
  {
    icon: <HardDrive className="size-6 text-emerald-400" />,
    title: 'Dados armazenados localmente',
    description:
      'Todo o estado reside no seu disco. SQLite embarcado, sem dependência de rede para operar.',
    color: 'border-emerald-500/30 bg-emerald-500/5',
  },
  {
    icon: <CloudOff className="size-6 text-amber-400" />,
    title: 'Funciona 100% offline',
    description:
      'Sem internet? Sem problema. O timer roda, os dados são gravados, o contexto é preservado.',
    color: 'border-amber-500/30 bg-amber-500/5',
  },
  {
    icon: <RefreshCw className="size-6 text-sky-400" />,
    title: 'Sync inteligente quando conectado',
    description:
      'Quando a rede volta, o engine de sync resolve conflitos com CRDT e empurra os dados para os trackers configurados.',
    color: 'border-sky-500/30 bg-sky-500/5',
  },
  {
    icon: <Lock className="size-6 text-violet-400" />,
    title: 'Você controla seus dados',
    description:
      'Nenhum dado seu transita por nossos servidores. Exportação total em JSON ou CSV a qualquer momento.',
    color: 'border-violet-500/30 bg-violet-500/5',
  },
]

// --- Page ---

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground selection:bg-primary/30 flex min-h-screen flex-col antialiased">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <IntegrationsSection />
        <FeaturesSection />
        <OfflineArchitectureSection />
        <VideoShowcaseSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  )
}

// --- Navbar ---

function Navbar() {
  return (
    <header className="border-border/40 bg-background/80 supports-[backdrop-filter]:bg-background/60 fixed top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-6">
        <div className="flex items-center gap-2.5 text-base font-bold tracking-tight">
          <div className="bg-primary flex size-7 items-center justify-center rounded-md shadow-sm">
            <Clock className="text-primary-foreground size-4" />
          </div>
          <span className="font-semibold">Metric</span>
        </div>

        <nav className="hidden items-center gap-6 md:flex">
          {[
            { href: '#features', label: 'Funcionalidades' },
            { href: '#integrations', label: 'Integrações' },
            { href: '#offline', label: 'Arquitetura' },
            { href: '#pricing', label: 'Preços' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
          <ServerSideModeToggle />
        </nav>
      </div>
    </header>
  )
}

// --- Hero ---

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-36 pb-0 lg:pt-48">
      {/* Background radial glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-primary/8 absolute top-0 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-60 blur-[160px]" />
        <div className="absolute top-48 left-1/4 h-[300px] w-[400px] rounded-full bg-violet-500/5 blur-[100px]" />
        <div className="absolute top-32 right-1/4 h-[250px] w-[350px] rounded-full bg-sky-500/5 blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 text-center">
        {/* Eyebrow badge */}
        <div className="border-border/60 bg-muted/40 text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
          Local-first · Offline-ready · Open-core
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-5xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Seu tempo registrado{' '}
          <span className="relative">
            <span className="from-primary to-primary bg-gradient-to-r via-violet-400 bg-clip-text text-transparent">
              sem depender da nuvem.
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
          Metric é um engine de produtividade local-first para devs e times
          técnicos. Funciona offline, sincroniza com Jira, Redmine e GitHub — e
          seus dados nunca saem da sua máquina sem sua permissão.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <DownloadCTA />
          <Button
            size="lg"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground border-border/50 hover:border-border h-11 gap-2 border px-6 text-sm"
          >
            <Play className="size-3.5 fill-current" />
            Ver Demo (2 min)
          </Button>
        </div>

        {/* Social proof */}
        <p className="text-muted-foreground/60 mt-5 text-xs">
          Sem cartão de crédito · Instalação em 30 segundos · MIT License
        </p>

        {/* Stats row */}
        <div className="mt-16 flex flex-wrap justify-center gap-12">
          {[
            { label: 'Horas rastreadas', value: '10k+' },
            { label: 'Integrações nativas', value: '6+' },
            { label: 'Uptime do sync', value: '99.9%' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
              <div className="text-muted-foreground mt-0.5 text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Product screenshot with gradient fade */}
        <div className="relative mx-auto mt-16 w-full max-w-5xl">
          {/* Glow halo behind the card */}
          <div className="bg-primary/15 absolute inset-x-0 top-1/4 bottom-0 -z-10 mx-auto w-3/4 rounded-full blur-[80px]" />

          {/* Screenshot container */}
          <div
            className="border-border/50 bg-card/80 relative overflow-hidden rounded-2xl border shadow-2xl shadow-black/30 backdrop-blur-sm"
            style={{
              boxShadow:
                '0 0 0 1px hsl(var(--border) / 0.5), 0 32px 80px -12px rgba(0,0,0,0.4), 0 0 60px -20px hsl(var(--primary) / 0.2)',
            }}
          >
            {/* Fake window chrome */}
            <div className="border-border/40 bg-muted/30 flex items-center gap-2 border-b px-4 py-3">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-500/50" />
                <div className="size-3 rounded-full bg-yellow-500/50" />
                <div className="size-3 rounded-full bg-green-500/50" />
              </div>
              <div className="mx-4 flex-1">
                <div className="bg-muted/60 mx-auto flex h-5 max-w-[260px] items-center justify-center gap-1.5 rounded-md px-3">
                  <Lock className="text-muted-foreground/50 size-2.5" />
                  <span className="text-muted-foreground/50 text-[10px]">
                    metric · local
                  </span>
                </div>
              </div>
            </div>

            {/* Main app mockup */}
            <div className="bg-background/50 p-6">
              {/* Toolbar row */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-muted/60 h-7 w-28 animate-pulse rounded-md" />
                  <div className="bg-muted/40 h-7 w-20 rounded-md" />
                  <div className="bg-muted/40 h-7 w-16 rounded-md" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs text-emerald-400">
                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                    00:47:23
                  </div>
                  <Button size="sm" className="bg-primary/90 h-7 px-3 text-xs">
                    <Timer className="mr-1 size-3" /> Stop
                  </Button>
                </div>
              </div>

              {/* Active task card — Productivity Card */}
              <div className="border-primary/20 bg-primary/5 relative mb-4 overflow-hidden rounded-xl border p-5">
                <div className="bg-primary/5 absolute top-0 right-0 h-48 w-48 translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 px-2 py-0.5 text-[10px]"
                      >
                        PROJ-4821
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        Jira · Em progresso
                      </span>
                    </div>
                    <h3 className="max-w-xs text-sm leading-snug font-semibold">
                      Refactor auth middleware to use edge runtime
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Engenharia · Sprint 24
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-primary font-mono text-3xl font-bold tabular-nums">
                      00:47
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-[10px]">
                      sessão atual
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="bg-muted/50 mt-4 h-1.5 overflow-hidden rounded-full">
                  <div className="from-primary h-full w-[62%] rounded-full bg-gradient-to-r to-violet-400" />
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground text-[10px]">
                    3h 12m hoje
                  </span>
                  <span className="text-muted-foreground text-[10px]">
                    meta: 5h
                  </span>
                </div>
              </div>

              {/* Recent entries */}
              <div className="space-y-2">
                {[
                  {
                    ticket: 'PROJ-4819',
                    title: 'Setup CI pipeline for staging',
                    time: '1h 23m',
                    tag: 'DevOps',
                  },
                  {
                    ticket: 'PROJ-4802',
                    title: 'Code review — payments module',
                    time: '0h 41m',
                    tag: 'Review',
                  },
                  {
                    ticket: 'PROJ-4798',
                    title: 'DB migration for user roles',
                    time: '2h 05m',
                    tag: 'Backend',
                  },
                ].map((entry) => (
                  <div
                    key={entry.ticket}
                    className="border-border/30 bg-muted/20 hover:border-border/60 flex items-center justify-between rounded-lg border px-4 py-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {entry.ticket}
                      </span>
                      <span className="text-foreground/80 max-w-[260px] truncate text-xs">
                        {entry.title}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="bg-muted/60 text-muted-foreground rounded-md px-2 py-0.5 text-[10px]">
                        {entry.tag}
                      </span>
                      <span className="text-muted-foreground font-mono text-xs">
                        {entry.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gradient fade bottom */}
          <div className="from-background via-background/80 pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t to-transparent" />
        </div>
      </div>
    </section>
  )
}

// --- Integrations ---

function IntegrationsSection() {
  return (
    <section id="integrations" className="pt-24 pb-20">
      <div className="container mx-auto px-6">
        <div className="mb-12 text-center">
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-widest uppercase">
            Ecossistema conectado
          </p>
          <h2 className="mx-auto max-w-xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Sincroniza com as ferramentas que seu time já usa.
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-sm text-sm leading-relaxed">
            Apontamentos fluem nos dois sentidos — sem copiar e colar, sem
            duplicação, sem atrito.
          </p>
        </div>

        <div className="border-border/40 bg-border/20 mx-auto grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((app) => (
            <div
              key={app.name}
              className="group bg-background hover:bg-muted/30 relative flex flex-col gap-3 p-6 transition-colors duration-200"
            >
              {/* Logo */}
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${app.accentBg} ${app.accentBorder}`}
              >
                {app.icon}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{app.name}</span>
                <span
                  className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${
                    app.status === 'live'
                      ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-500'
                      : 'border-amber-500/20 bg-amber-500/8 text-amber-500'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${app.status === 'live' ? 'bg-emerald-500' : 'bg-amber-400'}`}
                  />
                  {app.status === 'live' ? 'Disponível' : 'Em breve'}
                </span>
              </div>

              <p className="text-muted-foreground flex-1 text-xs leading-relaxed">
                {app.desc}
              </p>

              <div className="border-border/30 flex items-center justify-between border-t pt-3">
                <span className="text-muted-foreground/50 text-[10px] font-medium tracking-wider uppercase">
                  {app.status === 'live'
                    ? 'Sync bidirecional'
                    : 'Em desenvolvimento'}
                </span>
                <ArrowRight className="text-muted-foreground/30 group-hover:text-muted-foreground size-3.5 -translate-x-1 transition-colors duration-200 group-hover:translate-x-0" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-center">
          <a
            href="#"
            className="border-border/50 bg-muted/20 text-muted-foreground/60 hover:text-muted-foreground hover:border-border inline-flex items-center gap-2 rounded-full border border-dashed px-5 py-2 text-xs transition-colors duration-200"
          >
            <Plus className="size-3" />
            Sugira uma integração via GitHub Issues
          </a>
        </div>
      </div>
    </section>
  )
}
// --- Features ---

function FeaturesSection() {
  return (
    <section id="features" className="relative overflow-hidden py-24 lg:py-32">
      <div className="bg-muted/20 absolute inset-0 -z-10" />

      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
            Funcionalidades
          </p>
          <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Construído para a realidade de um desenvolvedor
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm leading-relaxed">
            Não é mais um tracker. É uma camada de observabilidade sobre como
            você gasta seu tempo técnico.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`group border-border/40 bg-card/60 relative rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${feature.border} ${feature.glow} overflow-hidden`}
            >
              {/* Background accent gradient */}
              <div
                className={`absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${feature.accent}`}
              />

              {/* Problem statement */}
              <div className="mb-5">
                <p className="text-muted-foreground/60 text-xs leading-relaxed italic">
                  "{feature.problem}"
                </p>
              </div>

              <Separator className="mb-5 opacity-30" />

              {/* Solution */}
              <div className="mb-3 flex items-center gap-2">
                <div className="bg-primary/10 text-primary rounded-md p-1.5">
                  {feature.icon}
                </div>
                <Badge variant="secondary" className="px-2 py-0.5 text-[10px]">
                  {feature.tag}
                </Badge>
              </div>
              <h3 className="mb-2 text-base leading-snug font-semibold">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// --- Offline Architecture ---

function OfflineArchitectureSection() {
  return (
    <section id="offline" className="relative overflow-hidden py-24 lg:py-32">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/4 blur-[140px]" />
      </div>

      <div className="container mx-auto px-6">
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-xs font-medium text-emerald-400">
            <HardDrive className="size-3.5" />
            Arquitetura local-first
          </div>
          <h2 className="mx-auto max-w-2xl text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Seu engine de produtividade não depende de nenhum servidor externo.
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-sm leading-relaxed">
            Enquanto outros SaaS ficam fora do ar, o Metric continua rodando.
            Offline é o padrão, não o fallback.
          </p>
        </div>

        {/* Flow diagram */}
        <div className="mx-auto max-w-4xl">
          {/* Visual flow: Local → Offline → Sync → Privacy */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {OFFLINE_STEPS.map((step, i) => (
              <React.Fragment key={step.title}>
                <div
                  className={`relative rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1 ${step.color}`}
                >
                  <div className="mb-4">{step.icon}</div>
                  <div className="text-muted-foreground/30 absolute top-4 right-4 font-mono text-xs">
                    0{i + 1}
                  </div>
                  <h4 className="mb-2 text-sm leading-snug font-semibold">
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Architecture diagram line */}
          <div className="border-border/30 bg-muted/20 mt-10 overflow-hidden rounded-2xl border p-6">
            <div className="text-muted-foreground/50 mb-4 flex items-center gap-2 font-mono text-xs">
              <Terminal className="size-3" />
              data flow · simplified
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              {[
                {
                  label: 'App',
                  icon: <Clock className="size-4" />,
                  color: 'text-primary border-primary/30 bg-primary/5',
                },
                {
                  label: 'SQLite local',
                  icon: <Database className="size-4" />,
                  color:
                    'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
                },
                {
                  label: 'Sync engine',
                  icon: <RefreshCw className="size-4" />,
                  color: 'text-sky-400 border-sky-500/30 bg-sky-500/5',
                },
                {
                  label: 'Jira / Redmine',
                  icon: <Server className="size-4" />,
                  color: 'text-violet-400 border-violet-500/30 bg-violet-500/5',
                },
              ].map((node, i, arr) => (
                <React.Fragment key={node.label}>
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${node.color}`}
                  >
                    {node.icon}
                    {node.label}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="text-muted-foreground/30 flex items-center gap-1">
                      <div className="bg-muted-foreground/20 h-px w-6" />
                      <ChevronRight className="size-3" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
                <WifiOff className="size-3 text-amber-400" />
                Offline: grava local, sem bloqueio
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
                <Wifi className="size-3 text-emerald-400" />
                Online: sync via CRDT, sem conflito
              </div>
              <div className="text-muted-foreground flex items-center gap-1.5 text-[10px]">
                <Lock className="size-3 text-violet-400" />
                Seus dados nunca passam por nossos servidores
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- Video ---

function VideoShowcaseSection() {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="bg-muted/15 absolute inset-0 -z-10" />

      <div className="container mx-auto px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Veja como funciona na prática
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            Do primeiro timer ao sync com Jira — em menos de 2 minutos.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Outer glow */}
          <div className="bg-primary/10 absolute inset-x-10 -inset-y-4 -z-10 rounded-full blur-3xl" />

          <div
            className="border-border/40 bg-card/80 group relative aspect-video cursor-pointer overflow-hidden rounded-2xl border shadow-2xl"
            style={{
              boxShadow:
                '0 40px 80px -20px rgba(0,0,0,0.5), 0 0 40px -10px hsl(var(--primary)/0.15)',
            }}
          >
            {/* Fake screen content */}
            <div className="from-background via-background to-muted/50 absolute inset-0 flex flex-col bg-gradient-to-br">
              <div className="flex gap-1.5 p-4">
                <div className="size-3 rounded-full bg-red-500/50" />
                <div className="size-3 rounded-full bg-yellow-500/50" />
                <div className="size-3 rounded-full bg-green-500/50" />
              </div>
              <div className="bg-muted/30 border-border/30 m-4 mt-0 flex-1 rounded-xl border" />
            </div>

            {/* Play overlay */}
            <div className="bg-background/60 group-hover:bg-background/50 absolute inset-0 flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300">
              <div className="relative mb-4">
                <div className="bg-primary/20 absolute inset-0 animate-ping rounded-full" />
                <div className="bg-primary shadow-primary/30 relative flex size-16 items-center justify-center rounded-full shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <Play className="fill-primary-foreground text-primary-foreground ml-0.5 size-6" />
                </div>
              </div>
              <p className="text-foreground text-sm font-medium">
                Assistir demo
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                2 min · sem cadastro
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// --- Pricing ---

function PricingSection() {
  return (
    <section id="pricing" className="relative overflow-hidden py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-primary/5 absolute bottom-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6">
        <div className="mb-12 text-center">
          <p className="text-primary mb-3 text-xs font-semibold tracking-widest uppercase">
            Preços
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Comece grátis. Pague quando fizer sentido.
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-md text-sm">
            Modelo open-core — o core é sempre free. Pro e Enterprise adicionam
            colaboração e compliance.
          </p>
        </div>

        <Tabs defaultValue="personal" className="mx-auto max-w-4xl">
          <div className="mb-10 flex justify-center">
            <TabsList className="h-9 gap-1 px-1">
              <TabsTrigger value="personal" className="gap-1.5 px-4 text-xs">
                <User className="size-3.5" /> Individual
              </TabsTrigger>
              <TabsTrigger value="enterprise" className="gap-1.5 px-4 text-xs">
                <Building2 className="size-3.5" /> Enterprise
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="personal" className="grid gap-5 md:grid-cols-2">
            <PricingCard
              name="Free"
              price="R$ 0"
              description="Para devs solo que querem clareza sobre o próprio tempo."
              features={[
                '1 usuário',
                'Até 3 projetos',
                'Armazenamento local ilimitado',
                'Export JSON/CSV',
                'Relatórios básicos',
              ]}
              cta="Baixar agora"
            />
            <PricingCard
              name="Pro"
              price="R$ 49"
              period="/mês"
              description="Para times que precisam de sync e visibilidade coletiva."
              features={[
                'Até 10 usuários',
                'Projetos ilimitados',
                'Sync bidirecional (Jira, Redmine, GitHub)',
                'Dashboard do time',
                'Deep work score',
                'Suporte prioritário',
              ]}
              highlighted
              badge="Mais popular"
              cta="Testar 14 dias grátis"
            />
          </TabsContent>
          <TabsContent value="enterprise" className="flex justify-center">
            <PricingCard
              name="Enterprise"
              price="Sob consulta"
              description="Para organizações que precisam de compliance, SSO e SLA."
              features={[
                'Usuários ilimitados',
                'SSO / SAML',
                'Auditoria completa',
                'Self-hosted disponível',
                'Gestor de conta dedicado',
                'SLA 99.9% garantido',
              ]}
              cta="Falar com o time"
              className="w-full max-w-md"
            />
          </TabsContent>
        </Tabs>

        {/* Trust signals */}
        <div className="text-muted-foreground/60 mt-12 flex flex-wrap justify-center gap-6 text-xs">
          {[
            {
              icon: <ShieldCheck className="size-3.5" />,
              label: 'SOC 2 em andamento',
            },
            {
              icon: <Lock className="size-3.5" />,
              label: 'Dados locais por padrão',
            },
            {
              icon: <CloudOff className="size-3.5" />,
              label: 'Funciona offline',
            },
            { icon: <RefreshCw className="size-3.5" />, label: '99.9% uptime' },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-1.5">
              {t.icon}
              {t.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

interface PricingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  highlighted?: boolean
  badge?: string
  cta: string
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  highlighted = false,
  badge,
  cta,
  className = '',
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-0.5 ${
        highlighted
          ? 'border-primary/50 bg-primary/5 shadow-primary/10 shadow-xl'
          : 'border-border/40 bg-card/60 hover:border-border/80'
      } ${className}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="px-3 py-0.5 text-[10px] shadow-sm">{badge}</Badge>
        </div>
      )}

      <div className="mb-6">
        <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
          {name}
        </p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold tracking-tight">{price}</span>
          {period && (
            <span className="text-muted-foreground text-sm">{period}</span>
          )}
        </div>
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mb-6 flex-1 space-y-2.5">
        {features.map((f) => (
          <div key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="text-primary mt-0.5 size-3.5 shrink-0" />
            <span className="text-foreground/80 text-xs leading-relaxed">
              {f}
            </span>
          </div>
        ))}
      </div>

      <Button
        variant={highlighted ? 'default' : 'outline'}
        className={`h-10 w-full text-sm ${highlighted ? 'shadow-primary/20 shadow-md' : ''}`}
      >
        {cta}
      </Button>
    </div>
  )
}

// --- Footer ---

function Footer() {
  return (
    <footer className="border-border/40 bg-background border-t py-12">
      <div className="container mx-auto px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="col-span-2">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold">
              <div className="bg-primary flex size-6 items-center justify-center rounded-md">
                <Clock className="text-primary-foreground size-3.5" />
              </div>
              <span>Metric</span>
            </div>
            <p className="text-muted-foreground max-w-xs text-xs leading-relaxed">
              Engine de produtividade local-first para devs e times técnicos.
              Seus dados. Sua máquina. Seu tempo.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" size="icon" className="size-8">
                <Github className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8">
                <Twitter className="size-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8">
                <Linkedin className="size-3.5" />
              </Button>
            </div>
          </div>
          <div>
            <h4 className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
              Produto
            </h4>
            <ul className="text-muted-foreground space-y-2.5 text-xs">
              {['Funcionalidades', 'Integrações', 'Changelog', 'Roadmap'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-muted-foreground mb-4 text-xs font-semibold tracking-wider uppercase">
              Recursos
            </h4>
            <ul className="text-muted-foreground space-y-2.5 text-xs">
              {['Documentação', 'GitHub', 'Status', 'Licença MIT'].map(
                (item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <Separator className="my-8 opacity-40" />

        <div className="text-muted-foreground/50 flex flex-col items-center justify-between gap-3 text-[11px] sm:flex-row">
          <p>© 2026 Metric. Todos os direitos reservados.</p>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400/70" />
            Todos os sistemas operacionais
          </div>
        </div>
      </div>
    </footer>
  )
}
