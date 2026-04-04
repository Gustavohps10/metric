'use client'

import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'

export function ModeToggle({
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { setTheme, theme } = useTheme()

  function handleToggleTheme() {
    if (theme == 'dark') {
      setTheme('light')
      return
    }

    setTheme('dark')
  }
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        {...props}
        onClick={handleToggleTheme}
      >
        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
      </Button>
    </>
  )
}
