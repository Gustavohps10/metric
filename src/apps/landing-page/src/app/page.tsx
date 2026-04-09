'use client'

import { useState } from 'react'

import { Features } from './components/features'
import { Footer } from './components/footer'
import { Hero } from './components/hero'
import { Integrations } from './components/integrations'
import { Navbar } from './components/navbar'
import { Pricing } from './components/pricing'
import { VideoShowcase } from './components/video-showcase'

export default function Home() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div
      className={`landing bg-background text-foreground flex min-h-screen flex-col ${darkMode ? 'dark' : ''}`}
    >
      <Navbar
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(!darkMode)}
      />

      <main className="flex-1">
        <Hero />

        {/* Divider */}
        <div className="lp-divider-glow" />

        <Integrations />

        {/* Divider */}
        <div className="lp-divider-glow" />

        <Features />

        {/* Divider */}
        <div className="lp-divider-glow" />

        <VideoShowcase />

        {/* Divider */}
        <div className="lp-divider-glow" />

        <Pricing />
      </main>

      <Footer />
    </div>
  )
}
