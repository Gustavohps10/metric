import { Github, Star } from 'lucide-react'

import logoIcon from '@/assets/logo-icon.svg'
import logoText from '@/assets/logo-text.svg'
import { ModeToggle } from '@/components/mode-toggle'
import { SidebarHeader } from '@/components/ui/sidebar'

export function AppSidebarDefaultHeader() {
  return (
    <SidebarHeader className="z-40">
      <div className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800">
        {/* Ícone */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-950 dark:ring-zinc-800">
          <img
            src={logoIcon}
            className="h-5 w-5 opacity-90 dark:opacity-100 dark:invert"
            alt="Logo Metric"
          />
        </div>

        {/* Texto */}
        <div className="flex min-w-0 flex-col leading-tight">
          <img
            src={logoText}
            className="h-3 w-auto max-w-[100px] opacity-90 dark:opacity-100 dark:invert"
            alt="Metric"
          />
          <span className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            Open Source
          </span>
        </div>

        {/* GitHub + Theme */}
        <div className="ml-auto flex shrink-0 items-center">
          <a
            href="https://github.com/gustavohps10/timelapse"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-zinc-600 transition-all duration-200 ease-out hover:-translate-y-[1px] hover:scale-[1.03] hover:bg-zinc-200 active:scale-[0.98] dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Github className="size-3.5 transition-transform duration-200 group-hover:rotate-6" />
            <Star className="-mr-0.5 size-3 opacity-70" />
            <span className="opacity-80">120</span>
          </a>

          <ModeToggle className="text-foreground size-8 shrink-0 cursor-pointer rounded-lg p-1 hover:bg-[#e7e7e9] dark:hover:bg-[#2e2e31]" />
        </div>
      </div>
    </SidebarHeader>
  )
}
