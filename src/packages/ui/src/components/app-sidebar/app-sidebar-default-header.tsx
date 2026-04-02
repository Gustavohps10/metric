import logoAtak from '@/assets/logo-atak.png'
import { ModeToggle } from '@/components/mode-toggle'
import { SidebarHeader } from '@/components/ui/sidebar'

export function AppSidebarDefaultHeader() {
  return (
    <SidebarHeader className="z-40">
      <div className="flex items-center gap-2 rounded-md p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
        <img
          src={logoAtak}
          className="h-8 w-8 rounded-lg bg-zinc-200 p-2"
          alt="Logo"
        />
        <div className="flex flex-col">
          <h1 className="scroll-m-20 text-sm font-bold tracking-tighter">
            Metric
          </h1>
        </div>
        <ModeToggle className="text-foreground ml-auto size-8 cursor-pointer rounded-lg p-1 hover:bg-[#e7e7e9] dark:hover:bg-[#2e2e31]" />
      </div>
    </SidebarHeader>
  )
}
