import {
  Badge,
  Button,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@metric-org/ui/components'
import {
  Activity,
  ArrowRight,
  BookOpenTextIcon,
  Building2,
  Check,
  ChevronRight,
  Clock,
  CloudOff,
  Database,
  Github,
  GitMerge,
  HardDrive,
  Linkedin,
  Lock,
  MessageSquarePlus,
  Play,
  RefreshCw,
  Server,
  ShieldCheck,
  Star,
  Terminal,
  Timer,
  Twitter,
  User,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import Image from 'next/image'
import * as React from 'react'

import { DownloadCTA } from '@/app/components/download-cta'
import { MobileMenu } from '@/components/mobile-menu'
import { ServerSideModeToggle } from '@/components/mode-toggle'

const TECH_STACK = [
  {
    name: 'TypeScript',
    url: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/typescript.svg',
  },
  {
    name: 'Node.js',
    url: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/nodejs-alt.svg',
  },
  {
    name: 'React',
    url: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/reactjs.svg',
  },
  {
    name: 'Next.js',
    url: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/nextjs-light.svg',
    invert: false,
  },
  {
    name: 'Tailwind',
    url: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/tailwind.svg',
  },
  {
    name: 'Electron',
    url: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/electron.svg',
  },
  {
    name: 'Turbopack',
    url: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/turbopack-light.svg',
  },
]

// --- Mock Data ---

const FEATURES = [
  {
    icon: <Timer className="size-5" />,
    problem: 'Você esquece de registrar o que fez ontem',
    title: 'Apontamento que não interrompe seu fluxo',
    description:
      'Um atalho de teclado inicia o timer. Ele roda offline, sem latência, sem distrações. Quando você voltar, o contexto já está salvo.',
    tag: 'Core',
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
    darkInvert: false,
    logoUrl:
      'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/jira.svg',
  },
  {
    name: 'Redmine',
    desc: 'Sincroniza time entries e atualiza o percentual de avanço dos tickets via REST API.',
    status: 'live' as const,
    accentBg: 'bg-red-600/5',
    accentBorder: 'border-red-600/15',
    darkInvert: false,
    logoUrl:
      'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/redmine.svg',
  },
  {
    name: 'GitHub',
    desc: 'Linka commits e PRs com sessões de trabalho. Veja quanto tempo cada issue realmente levou.',
    status: 'live' as const,
    accentBg: 'bg-muted/30',
    accentBorder: 'border-border/40',
    darkInvert: true,
    logoUrl:
      'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/github.svg',
  },
  {
    name: 'YouTrack',
    desc: 'Registra work items e sprints. Compatível com instâncias cloud e self-hosted.',
    status: 'live' as const,
    accentBg: 'bg-amber-500/5',
    accentBorder: 'border-amber-500/15',
    darkInvert: false,
    logoUrl:
      'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/jetbrains-youtrack.svg',
  },
  {
    name: 'Linear',
    desc: 'Sync de cycles e issues com resolução automática de estado via webhook.',
    status: 'soon' as const,
    accentBg: 'bg-violet-500/5',
    accentBorder: 'border-violet-500/15',
    darkInvert: true,
    logoUrl:
      'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/linear.svg',
  },
  {
    name: 'GitLab',
    desc: 'Acompanha MRs, pipelines e time tracking nativo via GitLab API v4.',
    status: 'soon' as const,
    accentBg: 'bg-orange-500/5',
    accentBorder: 'border-orange-500/15',
    darkInvert: false,
    logoUrl:
      'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/gitlab.svg',
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
    <header className="border-border/40 bg-background/80 supports-backdrop-filter:bg-background/60 fixed top-0 z-50 w-full border-b backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5 text-base font-bold tracking-tight">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
            <Image
              src="/logo-icon.svg"
              alt="Logo icon"
              width={16}
              height={16}
              className="object-contain dark:invert"
            />
          </div>

          <div className="flex min-w-0 flex-col leading-tight">
            <Image
              src="/logo-text.svg"
              alt="Metric"
              width={72}
              height={16}
              className="object-contain dark:invert"
            />
            <span className="mt-0.5 truncate pt-0.5 text-[11px] font-light text-zinc-500 dark:text-zinc-400">
              Open Core
            </span>
          </div>
        </div>

        <nav className="hidden h-full items-center py-2 md:flex">
          <div className="mr-4 flex items-center gap-5">
            {[
              { href: '#features', label: 'Funcionalidades' },
              { href: '#integrations', label: 'Integrações' },
              { href: '#offline', label: 'Arquitetura' },
              { href: '#pricing', label: 'Preços' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <Separator orientation="vertical" className="mx-3 h-4" />

          <a
            href="/docs"
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium transition-colors"
          >
            <BookOpenTextIcon className="size-4" />
            Docs
          </a>

          <Separator orientation="vertical" className="mx-2 h-4" />

          <div className="flex items-center">
            <ServerSideModeToggle />
          </div>

          <Separator orientation="vertical" className="mx-2 h-4" />

          <a
            href="https://github.com/gustavohps10/metric"
            target="_blank"
            rel="noreferrer"
            className="group text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-all"
          >
            <Github className="size-4" />
            <span className="text-foreground/90">gustavohps10/metric</span>
            <div className="ml-0.5 flex items-center gap-1">
              <Star className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
              <span className="text-xs tabular-nums opacity-80">120</span>
            </div>
          </a>
        </nav>

        <MobileMenu />
      </div>
    </header>
  )
}

// --- Hero ---

export function HeroSection() {
  return (
    <section className="bg-background relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-20 lg:py-48">
      {/* Background effects - Estilo Premium com Orbs e Dot Pattern */}
      <div className="pointer-events-none absolute inset-0">
        {/* Orbs com animação de flutuação suave */}
        <div
          className="absolute -top-32 left-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'var(--primary)',
            animation: 'hero-float 15s ease-in-out infinite',
          }}
        />
        <div
          className="absolute right-1/4 -bottom-32 h-[500px] w-[500px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: 'var(--primary)',
            animation: 'hero-float 20s ease-in-out infinite reverse',
          }}
        />

        {/* Dot pattern */}
        <div className="lp-dot-pattern absolute inset-0 opacity-[0.15]" />

        {/* Radial gradient fade central */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 45%, transparent 0%, var(--background) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        {/* Eyebrow badge */}
        <div className="border-border/60 bg-muted/40 text-muted-foreground mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
          <span className="size-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          Local-first &middot; Offline-ready &middot; Open-core
        </div>

        {/* Headline */}
        <h1 className="text-foreground mx-auto max-w-4xl text-5xl leading-[1.08] font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
          Seu tempo registrado{' '}
          <span className="relative">
            <span className="from-primary to-primary/60 bg-gradient-to-r bg-clip-text text-transparent">
              sem depender da nuvem.
            </span>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg">
          Metric &eacute; um engine de produtividade local-first para devs e
          times t&eacute;cnicos. Funciona offline, sincroniza com Jira, Redmine
          e GitHub &mdash; e seus dados nunca saem da sua m&aacute;quina sem sua
          permiss&atilde;o.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <DownloadCTA />
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground border-border/50 hover:border-border h-11 gap-2 border px-6 text-sm backdrop-blur-sm"
          >
            <Play className="size-3.5 fill-current" />
            Ver Demo (2 min)
          </Button>
        </div>

        {/* Social proof */}
        <p className="text-muted-foreground/60 mt-5 text-xs">
          Sem cart&atilde;o de cr&eacute;dito &middot; Instala&ccedil;&atilde;o
          em 30 segundos &middot; MIT License
        </p>

        {/* Stats row */}
        <div className="text-foreground mt-16 flex flex-wrap justify-center gap-12 text-center">
          {[
            { label: 'Horas rastreadas', value: '10k+' },
            { label: 'Integrações nativas', value: '6+' },
            { label: 'Uptime do sync', value: '99.9%' },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
              <div className="text-muted-foreground mt-0.5 text-xs">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Product screenshot */}
        <div className="relative mx-auto mt-16 w-full max-w-5xl">
          {/* Brilho suave atrás do card */}
          <div className="bg-primary/10 absolute inset-x-0 top-1/4 bottom-0 -z-10 mx-auto w-3/4 rounded-full blur-[80px]" />

          <Image
            src="/images/feature_apontamento2.jpeg"
            alt="Features"
            width={1920}
            height={800}
            className="rounded-lg"
          />

          {/* Bottom fade */}
          {/* <div className="from-background via-background/80 pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t to-transparent" /> */}
        </div>
      </div>
      {/* 
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes hero-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.02); }
        }
      `}} /> */}
    </section>
  )
}

// --- Integrations ---

function IntegrationsSection() {
  return (
    <section id="integrations" className="pb-20">
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

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INTEGRATIONS.map((app) => (
            <div
              key={app.name}
              className="group border-border/40 bg-background hover:border-border relative rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
            >
              {/* Top */}
              <div className="flex items-start justify-between">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${app.accentBg} ${app.accentBorder} overflow-hidden`}
                >
                  <Image
                    src={app.logoUrl}
                    alt={`${app.name} logo`}
                    width={22}
                    height={22}
                    className={`object-contain ${app.darkInvert ? 'dark:invert' : ''}`}
                  />
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                    app.status === 'live'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                      : 'border-amber-500/20 bg-amber-500/10 text-amber-500'
                  }`}
                >
                  <span
                    className={`size-1.5 rounded-full ${
                      app.status === 'live' ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                  />
                  {app.status === 'live' ? 'Disponível' : 'Em breve'}
                </span>
              </div>

              {/* Nome */}
              <div className="mt-5">
                <h3 className="text-base font-semibold tracking-tight">
                  {app.name}
                </h3>
              </div>

              {/* Descrição */}
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {app.desc}
              </p>

              {/* Footer */}
              <div className="mt-6 flex items-center justify-between">
                <span className="text-muted-foreground/50 text-[11px] font-medium tracking-wider uppercase">
                  {app.status === 'live'
                    ? 'Sync bidirecional'
                    : 'Em desenvolvimento'}
                </span>

                <div className="text-muted-foreground/40 group-hover:text-muted-foreground flex items-center gap-1 transition-all">
                  <span className="text-xs">Ver detalhes</span>
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-8 overflow-hidden rounded-3xl border border-dashed border-zinc-700 bg-[#0a0a0a] p-8 md:p-12">
          {/* Background Decorativo */}
          <div className="pointer-events-none absolute top-1/2 -right-6 -translate-y-1/2 text-zinc-500 opacity-10 select-none">
            <Terminal size={240} strokeWidth={1} />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <h3 className="text-2xl font-semibold tracking-tight text-zinc-100 md:text-3xl">
              Built by developers, for developers.
            </h3>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 md:text-base">
              O Metric é open-source e focado em privacidade. Sinta-se em casa
              para contribuir com código ou sugerir as ferramentas que faltam no
              seu workflow.
            </p>

            <div className="relative z-10 flex flex-col items-center">
              {/* Título e descrição que você já tem... */}

              <div className="mt-10 flex flex-col items-center gap-8">
                {/* Stack Badges - Minimalistas */}
                <div className="flex flex-wrap items-center justify-center gap-6 opacity-40 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
                  {TECH_STACK.map((tech) => (
                    <div
                      key={tech.name}
                      className="group relative flex items-center justify-center"
                    >
                      <Image
                        src={tech.url}
                        alt={tech.name}
                        width={20}
                        height={20}
                        className={`h-5 w-auto transition-transform duration-300 group-hover:scale-110 ${tech.invert ? 'dark:invert' : ''}`}
                      />
                      {/* Tooltip opcional (Estilo Linear) */}
                      <span className="absolute -top-8 scale-0 rounded bg-zinc-800 px-2 py-1 text-[10px] text-zinc-200 transition-all group-hover:scale-100">
                        {tech.name}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Divisória sutil */}
                <div className="h-px w-12 bg-zinc-800" />

                {/* Seção de Botões */}
                <div className="flex flex-col items-center gap-4 sm:flex-row">
                  <a
                    href="https://github.com/gustavohps10/metric"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex h-10 items-center justify-center gap-2 rounded-full bg-zinc-100 px-6 text-sm font-medium text-zinc-950 transition-all hover:bg-zinc-200 active:scale-95"
                  >
                    <Github className="size-4 transition-transform group-hover:rotate-12" />
                    Contribuir no GitHub
                  </a>

                  <a
                    href="https://github.com/gustavohps10/metric/issues/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/40 px-6 text-sm font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-900 hover:text-zinc-100 active:scale-95"
                  >
                    <MessageSquarePlus className="size-4" />
                    Sugerir Integração
                  </a>
                </div>
              </div>
            </div>
          </div>
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
              className={`group border-border/40 bg-card/60 relative rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${feature.border} ${feature.glow} overflow-hidden`}
            >
              {/* Background accent gradient */}
              <div
                className={`absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
              />

              {/* Problem statement */}
              <div className="mb-5">
                <p className="text-muted-foreground/60 text-xs leading-relaxed italic">
                  &quot;{feature.problem}&quot;
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
          <div className="border-border/30 bg-muted/20 mt-10 overflow-hidden rounded-xl border p-6">
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
            className="border-border/40 bg-card/80 group relative aspect-video cursor-pointer overflow-hidden rounded-xl border shadow-2xl"
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
              description="Essencial para o desenvolvedor organizar sua rotina local."
              features={[
                { text: 'App Desktop (Windows, Mac, Linux)', status: 'check' },
                { text: 'Persistência local (RxDB)', status: 'check' },
                { text: 'Atalhos e Timer global', status: 'check' },
                {
                  text: 'Analytics básico (Total de horas/dia)',
                  status: 'check',
                },
                { text: '1 Workspace e 1 DataSource', status: 'check' },
                { text: 'Analytics Individual Avançado', status: 'block' },
                { text: 'Gestão de Times e Squads', status: 'block' },
              ]}
              cta="Baixar agora"
            />

            <PricingCard
              name="Individual Pro"
              price="R$ 16,90"
              period="/mês"
              description="Para o dev que precisa de controle total do próprio tempo e produtividade."
              features={[
                { text: 'Workspaces ilimitados', status: 'check' },
                {
                  text: 'Múltiplas DataSources (Jira, Redmine, etc)',
                  status: 'check',
                },
                { text: 'Analytics Individual Avançado', status: 'check' },
                { text: 'Métricas de Deep Work e foco', status: 'check' },
                {
                  text: 'Relatórios de esforço e faturamento',
                  status: 'check',
                },
                {
                  text: 'Correlação com atividades (commits, tasks)',
                  status: 'check',
                },
                { text: 'Gestão de Times e Squads', status: 'block' },
              ]}
              highlighted
              badge="Para devs avançados"
              cta="Testar 14 dias grátis"
            />
          </TabsContent>

          <TabsContent value="enterprise" className="grid gap-5 md:grid-cols-2">
            <PricingCard
              name="Team"
              price="R$ 49"
              period="/mês por membro"
              description="Visibilidade e gestão de esforço para times de desenvolvimento."
              features={[
                {
                  text: 'Workspaces e DataSources ilimitados',
                  status: 'check',
                },
                {
                  text: 'Replicação Automática (Jira, Redmine)',
                  status: 'check',
                },
                {
                  text: 'Dashboard do Time (Analytics coletivo)',
                  status: 'check',
                },
                { text: 'Relatórios de Esforço por Sprint', status: 'check' },
                { text: 'Métricas de Deep Work individuais', status: 'check' },
                { text: 'Painel de gestão de membros', status: 'check' },
                { text: 'Modo Self-Hosted e API Pública', status: 'block' },
              ]}
              highlighted
              badge="O melhor para times"
              cta="Testar 14 dias grátis"
            />

            <PricingCard
              name="Enterprise"
              price="Sob consulta"
              description="Soberania total e governança para grandes operações."
              features={[
                {
                  text: 'Modo Self-Hosted (Soberania de Dados)',
                  status: 'check',
                },
                { text: 'API Pública (Integração ERP/BI)', status: 'check' },
                { text: 'Autenticação SSO / SAML', status: 'check' },
                {
                  text: 'Visualização Peer-To-Peer (Team Sync)',
                  status: 'check',
                },
                { text: 'Relatórios de Rentabilidade e ROI', status: 'check' },
                {
                  text: 'Configuração de Domínios Permitidos',
                  status: 'check',
                },
                { text: 'SLA 99.9% e Suporte Dedicado', status: 'check' },
              ]}
              cta="Falar com nosso time"
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

interface Feature {
  text: string
  status: 'check' | 'block'
}

interface PricingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  price: string
  period?: string
  description: string
  features: Feature[]
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
  ...props
}: PricingCardProps) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5 ${
        highlighted
          ? 'border-primary/50 bg-primary/5 shadow-primary/10 shadow-xl'
          : 'border-border/40 bg-card/60 hover:border-border/80'
      } ${className}`}
      {...props}
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
        {features.map((f, index) => (
          <div key={index} className="flex items-start gap-2.5 text-sm">
            {f.status === 'check' ? (
              <Check className="text-primary mt-0.5 size-3.5 shrink-0" />
            ) : (
              <X className="text-muted-foreground/30 mt-0.5 size-3.5 shrink-0" />
            )}
            <span
              className={`text-xs leading-relaxed ${
                f.status === 'check'
                  ? 'text-foreground/80'
                  : 'text-muted-foreground/40 decoration-muted-foreground/20 line-through'
              }`}
            >
              {f.text}
            </span>
          </div>
        ))}
      </div>

      <Button
        variant={highlighted ? 'default' : 'outline'}
        className={`h-10 w-full text-sm font-medium ${
          highlighted ? 'shadow-primary/20 shadow-md' : ''
        }`}
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
                <Image
                  src="/logo-icon.svg"
                  alt="Logo icon"
                  width={16}
                  height={16}
                  className="object-contain dark:invert"
                />
              </div>

              <div className="flex min-w-0 flex-col leading-tight">
                <Image
                  src="/logo-text.svg"
                  alt="Metric"
                  width={72}
                  height={16}
                  className="object-contain dark:invert"
                />
                <span className="mt-0.5 truncate pt-0.5 text-[11px] font-light text-zinc-500 dark:text-zinc-400">
                  Open Core
                </span>
              </div>
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
