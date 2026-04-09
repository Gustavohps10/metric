'use client'

const footerLinks = {
  produto: [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'Integrações', href: '#integrations' },
    { label: 'Demo', href: '#demo' },
    { label: 'Changelog', href: '#' },
  ],
  empresa: [
    { label: 'Sobre', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Carreiras', href: '#' },
    { label: 'Contato', href: '#' },
  ],
  legal: [
    { label: 'Privacidade', href: '#' },
    { label: 'Termos de Uso', href: '#' },
    { label: 'Cookies', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-secondary">
      {/* Top divider */}
      <div className="lp-divider-glow" />

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <a href="#" className="flex items-center gap-2.5">
              <img
                src="/logo_metric_icone_sem_fundo.svg"
                alt="Metric"
                className="h-8 w-8"
              />
              <span className="text-foreground text-lg font-bold">Metric</span>
            </a>
            <p className="text-muted-foreground mt-4 max-w-xs text-sm leading-relaxed">
              Plataforma inteligente de apontamento de horas. Gerencie tempo,
              integre ferramentas, maximize resultados.
            </p>

            {/* Social */}
            <div className="mt-6 flex gap-4">
              {[
                {
                  label: 'Twitter',
                  path: 'M22.46 6c-.85.38-1.78.64-2.73.76 1-.6 1.76-1.54 2.12-2.67-.93.55-1.96.95-3.06 1.17A4.81 4.81 0 0 0 15.11 4c-2.65 0-4.79 2.15-4.79 4.79 0 .38.04.74.13 1.09C6.87 9.68 3.92 7.78 1.96 5.08c-.41.71-.65 1.54-.65 2.42 0 1.66.85 3.13 2.13 3.99-.78-.03-1.52-.24-2.17-.6v.06c0 2.32 1.65 4.26 3.84 4.7-.4.11-.83.17-1.27.17-.31 0-.61-.03-.91-.09.62 1.93 2.41 3.34 4.53 3.38A9.65 9.65 0 0 1 0 21.54 13.56 13.56 0 0 0 7.29 23.7c8.76 0 13.54-7.26 13.54-13.54 0-.21 0-.41-.01-.61.93-.67 1.73-1.51 2.37-2.47L22.46 6z',
                },
                {
                  label: 'GitHub',
                  path: 'M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z',
                },
                {
                  label: 'LinkedIn',
                  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="bg-card border-border flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 hover:scale-110"
                >
                  <svg
                    className="fill-muted-foreground h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-foreground text-sm font-semibold tracking-wider uppercase">
                {title}
              </h4>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-border mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            © 2026 Metric. Todos os direitos reservados.
          </p>
          <p className="text-muted-foreground text-sm">
            Feito com 💜 para times produtivos.
          </p>
        </div>
      </div>
    </footer>
  )
}
