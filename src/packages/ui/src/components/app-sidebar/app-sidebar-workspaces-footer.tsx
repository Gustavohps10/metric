import { User } from 'lucide-react'

/**
 * Placeholder for future global app login (ADR-002).
 * Connection/auth is per datasource and managed only on the Plugins page.
 */
export function AppSidebarWorkspacesFooter() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
      <User className="h-8 w-8 shrink-0 rounded-lg bg-zinc-200 p-2 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">Conta</p>
        <p className="truncate text-xs">Entrar (em breve)</p>
      </div>
    </div>
  )
}
