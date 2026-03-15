'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Activity,
  ChevronRight,
  Clock,
  Database,
  Share2Icon,
} from 'lucide-react'
import { AiOutlineCloudSync } from 'react-icons/ai'

import logoAtak from '@/assets/logo-atak.png'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useWorkspace } from '@/hooks'
import { type ReplicationStatus, useSyncStore } from '@/stores/syncStore'

const COLLECTION_LABELS: Record<string, string> = {
  metadata: 'Metadata',
  tasks: 'Tarefas',
  timeEntries: 'Apontamentos',
}

function dataSourceDisplayName(id: string): string {
  return id
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ')
}

function groupStatusesByDataSource(
  statuses: Record<string, ReplicationStatus>,
): Map<string, { collection: string; status: ReplicationStatus }[]> {
  const map = new Map<
    string,
    { collection: string; status: ReplicationStatus }[]
  >()
  for (const key of Object.keys(statuses)) {
    const idx = key.indexOf('_')
    if (idx <= 0) continue
    const collection = key.slice(0, idx)
    const dataSourceId = key.slice(idx + 1)
    if (!map.has(dataSourceId)) map.set(dataSourceId, [])
    map.get(dataSourceId)!.push({
      collection,
      status: statuses[key]!,
    })
  }
  return map
}

export function Header() {
  const { workspace } = useWorkspace()
  const statuses = useSyncStore((s) => s?.statuses)
  const dbName = useSyncStore((s) => s?.db?.name)
  const isInitialized = useSyncStore((s) => s?.isInitialized)

  const getOverallStatusColor = () => {
    if (!isInitialized || !statuses) return 'bg-muted'
    const values = Object.values(statuses)
    if (values.some((s) => s?.error)) return 'bg-red-500'
    if (values.some((s) => s?.isPulling || s?.isPushing))
      return 'bg-blue-500 animate-pulse'
    return 'bg-green-500'
  }

  const grouped = statuses
    ? groupStatusesByDataSource(statuses)
    : new Map<string, { collection: string; status: ReplicationStatus }[]>()

  return (
    <header className="pointer-events-none absolute top-0 left-0 z-50 flex w-full justify-center bg-transparent pl-[calc(72px+240px)]">
      <div className="p-2">
        <div className="border-border bg-background/80 pointer-events-auto flex items-center justify-between gap-3 rounded-md border px-1 shadow-sm backdrop-blur-xl">
          {/* Workspace Info Section - Compacto */}
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-zinc-100 p-1 shadow-sm">
              <img
                src={logoAtak}
                className="h-full w-full object-contain"
                alt="Logo"
              />
            </div>
            <div className="flex min-w-max flex-col leading-tight">
              <span className="text-foreground text-[10px] font-bold tracking-tight whitespace-nowrap">
                {workspace?.name}
              </span>
              <span className="text-muted-foreground/70 font-mono text-[11px] whitespace-nowrap">
                {workspace?.id}
              </span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-5 opacity-50" />

          {/* Actions Section */}
          <div className="flex items-center gap-0.5">
            <TooltipProvider delayDuration={200}>
              <Popover>
                <Tooltip>
                  <PopoverTrigger asChild>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-accent/50 relative h-6 w-6 rounded-sm"
                      >
                        <AiOutlineCloudSync
                          size={16}
                          className="text-foreground/80"
                        />
                        <span
                          className={`border-background absolute right-0.5 bottom-0.5 h-2 w-2 rounded-full border ${getOverallStatusColor()}`}
                        />
                      </Button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent side="bottom" className="text-[10px]">
                    Sincronização
                  </TooltipContent>
                </Tooltip>

                <PopoverContent
                  className="border-border bg-background/95 w-auto max-w-md min-w-[260px] rounded-md p-0 shadow-2xl backdrop-blur-sm"
                  align="end"
                  sideOffset={6}
                >
                  {/* Popover Header */}
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <div className="rounded-sm bg-blue-500/10 p-1.5 text-blue-600">
                      <Activity size={14} />
                    </div>
                    <div className="flex min-w-max flex-col">
                      <h4 className="text-[11px] leading-none font-bold">
                        Monitor de Sincronização
                      </h4>
                      <div className="text-muted-foreground mt-1 flex items-center gap-1 font-mono text-[9px] whitespace-nowrap">
                        <Database size={10} className="shrink-0" />
                        <span>{dbName || 'Conectando...'}</span>
                      </div>
                    </div>
                  </div>

                  {/* List grouped by datasource (ADR-002) */}
                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {isInitialized && grouped.size > 0 ? (
                      <div className="space-y-0.5">
                        {Array.from(grouped.entries()).map(
                          ([dataSourceId, items]) => (
                            <Collapsible
                              key={dataSourceId}
                              defaultOpen
                              className="rounded-sm border border-transparent"
                            >
                              <CollapsibleTrigger className="hover:bg-accent/30 flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left transition-colors [&[data-state=open]>svg]:rotate-90">
                                <ChevronRight
                                  size={12}
                                  className="text-muted-foreground shrink-0 transition-transform"
                                />
                                <span className="text-foreground/90 text-[10px] font-bold">
                                  {dataSourceDisplayName(dataSourceId)}
                                </span>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="border-border/50 ml-4 space-y-0.5 border-l pl-2">
                                  {items.map(({ collection, status }) => {
                                    const dotStatusColor = status.error
                                      ? 'bg-red-500'
                                      : status.isPulling || status.isPushing
                                        ? 'bg-blue-500 animate-pulse'
                                        : 'bg-green-500'
                                    return (
                                      <div
                                        key={collection}
                                        className="hover:bg-accent/20 rounded-sm px-1.5 py-1 transition-colors"
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-muted-foreground text-[10px] font-medium">
                                            {COLLECTION_LABELS[collection] ??
                                              collection}
                                          </span>
                                          <div className="flex items-center gap-1.5">
                                            <span
                                              className={`h-1.5 w-1.5 rounded-full ${dotStatusColor}`}
                                            />
                                            <span className="text-muted-foreground text-[9px]">
                                              {status.error
                                                ? 'Erro'
                                                : status.isPulling
                                                  ? 'Buscando...'
                                                  : 'Sincronizado'}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-muted-foreground/80 flex items-center gap-1 text-[8px]">
                                          <Clock
                                            size={8}
                                            className="shrink-0"
                                          />
                                          {status.lastReplication
                                            ? format(
                                                status.lastReplication,
                                                "HH:mm 'em' dd/MM",
                                                { locale: ptBR },
                                              )
                                            : 'Pendente'}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="text-muted-foreground py-4 text-center text-[9px] italic">
                        Inicializando...
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="hover:bg-accent/50 h-6 w-6 rounded-sm"
                  >
                    <Share2Icon size={14} className="text-foreground/70" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-[10px]">
                  Compartilhar
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </header>
  )
}
