'use client'

import { useEffect, useState } from 'react'

export function Navbar({
  darkMode,
  onToggleTheme,
}: {
  darkMode: boolean
  onToggleTheme: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // In light mode + scrolled, use dark navbar for contrast
  const lightScrolled = !darkMode && scrolled

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      id="navbar"
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled ? 'shadow-lg shadow-black/20' : 'bg-transparent'
      }`}
      style={
        scrolled
          ? {
              background: lightScrolled
                ? 'oklch(0.1773 0.0089 264.3183 / 0.92)'
                : 'oklch(0.1773 0.0089 264.3183 / 0.7)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderBottom: `1px solid ${lightScrolled ? 'oklch(1 0 0 / 0.08)' : 'var(--border)'}`,
            }
          : undefined
      }
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <a href="#" className="group flex items-center gap-2.5">
          <img
            src="/logo_metric_icone_sem_fundo.svg"
            alt="Metric"
            className="h-9 w-9 transition-transform duration-300 group-hover:scale-110"
          />
          <span
            className="text-xl font-bold tracking-tight"
            style={{
              color: lightScrolled ? 'oklch(1 0 0)' : 'var(--foreground)',
            }}
          >
            Metric
          </span>
        </a>

        {/* Desktop Nav + Theme Toggle */}
        <nav className="hidden items-center gap-6 md:flex">
          {/* Theme toggle with hover & click effects */}
          <button
            onClick={onToggleTheme}
            aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
            className="lp-theme-toggle group/toggle relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-all duration-300 hover:scale-110 active:scale-90"
            style={{
              background: darkMode
                ? 'oklch(1 0 0 / 0.06)'
                : 'oklch(0.6635 0.1517 255.9445 / 0.1)',
              border: '1px solid',
              borderColor: darkMode
                ? 'oklch(1 0 0 / 0.08)'
                : 'oklch(0.6635 0.1517 255.9445 / 0.25)',
            }}
          >
            {/* Hover glow ring */}
            <span
              className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover/toggle:opacity-100"
              style={{
                boxShadow:
                  '0 0 12px oklch(0.6635 0.1517 255.9445 / 0.4), inset 0 0 8px oklch(0.6635 0.1517 255.9445 / 0.1)',
              }}
            />
            <div
              className="relative h-5 w-5"
              style={{
                transform: darkMode ? 'rotate(0deg)' : 'rotate(180deg)',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              {darkMode ? (
                /* Moon icon */
                <svg
                  className="text-muted-foreground group-hover/toggle:text-primary h-5 w-5 transition-colors duration-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : (
                /* Sun icon */
                <svg
                  className="text-primary group-hover/toggle:text-primary h-5 w-5 transition-colors duration-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </div>
          </button>

          {/* Separator */}
          <div
            className="h-5 w-px"
            style={{
              background: lightScrolled
                ? 'oklch(1 0 0 / 0.15)'
                : 'var(--border)',
            }}
          />

          {/* Nav links */}
          {[
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Integrações', href: '#integrations' },
            { label: 'Demo', href: '#demo' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium transition-colors duration-200"
              style={{
                color: lightScrolled
                  ? 'oklch(1 0 0 / 0.7)'
                  : 'var(--muted-foreground)',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = lightScrolled
                  ? 'oklch(1 0 0)'
                  : 'var(--foreground)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = lightScrolled
                  ? 'oklch(1 0 0 / 0.7)'
                  : 'var(--muted-foreground)')
              }
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span
            className={`bg-foreground block h-0.5 w-6 transition-all duration-300 ${mobileOpen ? 'translate-y-1.5 rotate-45' : ''}`}
          />
          <span
            className={`bg-foreground block h-0.5 w-6 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`bg-foreground block h-0.5 w-6 transition-all duration-300 ${mobileOpen ? '-translate-y-1.5 -rotate-45' : ''}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${
          mobileOpen ? 'border-border max-h-80 border-t' : 'max-h-0'
        }`}
        style={{
          background: darkMode
            ? 'oklch(0.1773 0.0089 264.3183 / 0.95)'
            : 'oklch(0.9632 0.0034 247.8585 / 0.98)',
        }}
      >
        <nav className="flex flex-col gap-4 p-6">
          {[
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Integrações', href: '#integrations' },
            { label: 'Demo', href: '#demo' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-muted-foreground text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </a>
          ))}
          {/* Mobile theme toggle */}
          <button
            onClick={onToggleTheme}
            className="text-muted-foreground hover:bg-primary/10 mt-2 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-95"
          >
            {darkMode ? (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            )}
            {darkMode ? 'Modo Claro' : 'Modo Escuro'}
          </button>
          <a
            href="#pricing"
            className="bg-primary text-primary-foreground mt-2 rounded-xl px-5 py-2.5 text-center text-sm font-semibold"
          >
            Começar Agora
          </a>
        </nav>
      </div>
    </header>
  )
}
