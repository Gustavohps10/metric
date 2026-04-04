'use client'

import {
  Accordion,
  Badge,
  Button,
  Card,
  Kbd,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  Tabs,
} from '@timelapse/ui/components'
import Link from 'next/link'
import * as React from 'react'

const features = [
  {
    title: 'Atalhos Globais',
    description:
      'Inicie trackers em qualquer lugar com comandos de teclado rápidos.',
    href: '/features/shortcuts',
  },
  {
    title: 'Analytics Avançado',
    description: 'Visualize sua distribuição de tempo por projeto ou cliente.',
    href: '/features/analytics',
  },
  {
    title: 'Sync com Calendário',
    description: 'Transforme reuniões em logs de horas automaticamente.',
    href: '/features/calendar',
  },
] as const

export default function Home() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col font-sans">
      <header className="bg-background/80 fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b px-8 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="bg-foreground text-background flex h-8 w-8 items-center justify-center rounded-lg">
            <span className="font-bold">T</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Traceable</span>
        </div>

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Funcionalidades</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {features.map((feature) => (
                    <ListItem
                      key={feature.title}
                      title={feature.title}
                      href={feature.href}
                    >
                      {feature.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="#pricing" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Planos
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link href="#faq" legacyBehavior passHref>
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  FAQ
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            Entrar
          </Button>
          <Button size="sm">Começar Agora</Button>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <section className="container mx-auto flex flex-col items-center px-4 py-24 text-center md:py-32">
          <Badge variant="outline" className="mb-6 gap-2 py-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Novo: Integração nativa com GitHub
          </Badge>

          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tighter sm:text-7xl">
            O tempo é seu ativo mais valioso.{' '}
            <span className="text-muted-foreground">
              Trace ele com precisão.
            </span>
          </h1>

          <p className="text-muted-foreground mt-8 max-w-2xl text-lg leading-8">
            A ferramenta de apontamento de horas projetada para desenvolvedores.
            Menos cliques, mais código.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="h-12 px-8 text-base">
              Começar Grátis
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base">
              Ver Demo
            </Button>
          </div>

          <div className="text-muted-foreground mt-16 flex items-center gap-3 text-sm font-medium">
            <span>Produtividade total com</span>
            <div className="flex gap-1">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </div>
            <span>Command Menu</span>
          </div>
        </section>

        <section id="features" className="bg-muted/30 border-y py-24">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-3">
              <FeatureCard
                icon="⚡"
                title="Atalhos Globais"
                description="Inicie trackers em qualquer lugar com comandos de teclado rápidos."
              />
              <FeatureCard
                icon="📊"
                title="Analytics Avançado"
                description="Visualize sua distribuição de tempo por projeto em tempo real."
              />
              <FeatureCard
                icon="🗓️"
                title="Sync com Calendário"
                description="Transforme reuniões em logs de horas automaticamente."
              />
            </div>
          </div>
        </section>

        <section id="pricing" className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Planos simples
            </h2>
            <Tabs
              defaultValue="monthly"
              className="mt-8 flex flex-col items-center"
            >
              <div className="grid w-full max-w-5xl gap-6 md:grid-cols-3">
                <PricingCard
                  title="Free"
                  price="R$ 0"
                  description="Solo"
                  features={['3 projetos', 'Exportação CSV']}
                />
                <PricingCard
                  title="Pro"
                  price="R$ 49"
                  highlight
                  description="Profissionais"
                  features={['Ilimitado', 'PDF', 'API']}
                />
                <PricingCard
                  title="Team"
                  price="R$ 199"
                  description="Times"
                  features={['Equipe', 'SSO', 'Faturamento']}
                />
              </div>
            </Tabs>
          </div>
        </section>

        <section id="faq" className="container mx-auto max-w-3xl px-4 py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            FAQ
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="1" title="Posso importar dados?">
              Sim, suportamos importação direta via CSV.
            </AccordionItem>
            <AccordionItem value="2" title="Segurança?">
              Seus dados são criptografados em repouso (AES-256).
            </AccordionItem>
          </Accordion>
        </section>
      </main>

      <footer className="bg-muted/20 border-t py-16">
        <div className="container mx-auto px-4">
          <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
            <div className="flex items-center gap-2">
              <div className="bg-foreground h-6 w-6 rounded" />
              <span className="text-foreground font-bold">Traceable</span>
            </div>
            <p>© 2026 Traceable UI.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground">
                Twitter
              </a>
              <a href="#" className="hover:text-foreground">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string
  title: string
  description: string
}) {
  return (
    <Card className="bg-card flex flex-col gap-4 border-none p-8 shadow-sm">
      <div className="text-3xl">{icon}</div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </Card>
  )
}

function PricingCard({
  title,
  price,
  description,
  features,
  highlight = false,
}: {
  title: string
  price: string
  description: string
  features: string[]
  highlight?: boolean
}) {
  return (
    <Card
      className={`flex flex-col p-8 ${highlight ? 'border-primary border-2 shadow-lg' : 'border-border'}`}
    >
      <h3 className="text-lg font-bold">{title}</h3>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight">{price}</span>
        <span className="text-muted-foreground">/mês</span>
      </div>
      <ul className="my-8 flex flex-col gap-3 text-left">
        {features.map((feature: string) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm font-medium"
          >
            <span className="text-primary">✓</span> {feature}
          </li>
        ))}
      </ul>
      <Button
        variant={highlight ? 'default' : 'outline'}
        className="mt-auto w-full"
      >
        Assinar
      </Button>
    </Card>
  )
}

function ListItem({
  title,
  children,
  href,
}: {
  title: string
  children: React.ReactNode
  href: string
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
        >
          <div className="text-sm leading-none font-medium">{title}</div>
          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  )
}

function AccordionItem({
  children,
  title,
  value,
}: {
  children: React.ReactNode
  title: string
  value: string
}) {
  return (
    <div className="border-b">
      <button className="hover:text-muted-foreground flex w-full items-center justify-between py-6 text-left font-semibold transition-all">
        {title}
        <span>↓</span>
      </button>
      <div className="text-muted-foreground pb-6 text-sm leading-relaxed">
        {children}
      </div>
    </div>
  )
}
