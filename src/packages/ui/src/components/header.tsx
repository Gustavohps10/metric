'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Activity,
  ChevronRight,
  Clock,
  CloudOff,
  Database,
  Monitor,
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

/**
 * CONSTANTS & HELPERS
 */
const COLLECTION_LABELS: Record<string, string> = {
  metadata: 'Metadata',
  tasks: 'Tarefas',
  timeEntries: 'Apontamentos',
}

const ERROR_CODES = { MISSING_TOKEN: 'MISSING_TOKEN' }

const getDisplayName = (id: string) =>
  id
    .split(/[-_]/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ')

const getRawErrorMessage = (error: any): string =>
  error?.parameters?.errors?.message ||
  error?.innerError?.message ||
  error?.message ||
  ''

const isAuthError = (error: any) =>
  getRawErrorMessage(error).includes(ERROR_CODES.MISSING_TOKEN)

function groupStatuses(statuses: Record<string, ReplicationStatus>) {
  const map = new Map<
    string,
    { collection: string; status: ReplicationStatus }[]
  >()
  Object.entries(statuses).forEach(([key, status]) => {
    const idx = key.indexOf('_')
    if (idx <= 0) return
    const collection = key.slice(0, idx)
    const dataSourceId = key.slice(idx + 1)
    if (!map.has(dataSourceId)) map.set(dataSourceId, [])
    map.get(dataSourceId)!.push({ collection, status })
  })
  return map
}

export function Header() {
  const { workspace } = useWorkspace()
  const statuses = useSyncStore((s) => s.statuses) ?? {}
  const dbName = useSyncStore((s) => s.db?.name)
  const isInitialized = useSyncStore((s) => s.isInitialized) ?? false

  const connections = workspace?.dataSourceConnections ?? []
  const hasRemote = connections.length > 0
  const grouped = groupStatuses(statuses)

  /**
   * SENIOR LOGIC: Status Global com Hierarquia de criticidade
   */
  const getGlobalState = () => {
    if (!isInitialized)
      return { color: 'bg-muted', label: 'Inicializando...', icon: 'sync' }
    if (!hasRemote)
      return { color: 'bg-zinc-400', label: 'Modo Local', icon: 'local' }

    const values = Object.values(statuses)

    // 1. ERRO TÉCNICO (Prioridade Máxima)
    if (values.some((v) => v.error && !isAuthError(v.error))) {
      return { color: 'bg-red-500', label: 'Erro técnico', icon: 'sync' }
    }

    // 2. ATIVIDADE (Sincronizando no momento)
    if (values.some((v) => v.isPulling || v.isPushing)) {
      return {
        color: 'bg-blue-500 animate-pulse',
        label: 'Sincronizando...',
        icon: 'sync',
      }
    }

    // 3. DESCONECTADO (Se ALGUM source configurado não estiver logado/sincronizado)
    const anyDisconnected = values.some(
      (v) => isAuthError(v.error) || v.lastReplication === null,
    )
    if (anyDisconnected) {
      return { color: 'bg-zinc-400', label: 'Conexões pendentes', icon: 'sync' }
    }

    // 4. SUCESSO TOTAL
    return { color: 'bg-green-500', label: 'Sincronizado', icon: 'sync' }
  }

  const globalStatus = getGlobalState()

  return (
    <header className="pointer-events-none absolute top-0 left-0 z-50 flex w-full justify-center bg-transparent pl-[calc(72px+240px)]">
      <div className="p-2">
        <div className="border-border bg-background/80 pointer-events-auto flex items-center justify-between gap-3 rounded-md border px-1 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm bg-zinc-100 p-1 shadow-sm">
              <img
                src={logoAtak}
                className="h-full w-full object-contain"
                alt="Logo"
              />
            </div>
            <div className="flex min-w-max flex-col leading-tight">
              <span className="text-foreground text-[10px] font-bold tracking-tight">
                {workspace?.name}
              </span>
              <span className="text-muted-foreground/70 font-mono text-[11px]">
                {workspace?.id}
              </span>
            </div>
          </div>

          <Separator orientation="vertical" className="h-5 opacity-50" />

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
                        {globalStatus.icon === 'local' ? (
                          <Monitor size={14} className="text-foreground/80" />
                        ) : (
                          <AiOutlineCloudSync
                            size={16}
                            className="text-foreground/80"
                          />
                        )}
                        <span
                          className={`border-background absolute right-0.5 bottom-0.5 h-2 w-2 rounded-full border ${globalStatus.color}`}
                        />
                      </Button>
                    </TooltipTrigger>
                  </PopoverTrigger>
                  <TooltipContent side="bottom" className="text-[10px]">
                    {globalStatus.label}
                  </TooltipContent>
                </Tooltip>

                <PopoverContent
                  className="border-border bg-background/95 w-auto max-w-md min-w-[280px] rounded-md p-0 shadow-2xl backdrop-blur-sm"
                  align="end"
                  sideOffset={6}
                >
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <div className="bg-secondary text-foreground/70 rounded-sm p-1.5">
                      {hasRemote ? (
                        <Activity size={14} />
                      ) : (
                        <Monitor size={14} />
                      )}
                    </div>
                    <div className="flex min-w-max flex-col">
                      <h4 className="text-[11px] leading-none font-bold">
                        Monitor de Sincronização
                      </h4>
                      <div className="text-muted-foreground mt-1 flex items-center gap-1 font-mono text-[9px]">
                        <Database size={10} className="shrink-0" />
                        <span>{dbName || 'Local Engine'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[300px] overflow-y-auto p-1">
                    {/* Caso Local */}
                    {isInitialized && !hasRemote && (
                      <div className="space-y-0.5 p-2 text-center">
                        <p className="text-muted-foreground text-[10px] italic">
                          Modo somente local ativado.
                        </p>
                      </div>
                    )}

                    {/* Caso Remoto com N Sources */}
                    {isInitialized &&
                      hasRemote &&
                      Array.from(grouped.entries()).map(([dsId, items]) => {
                        const isDsDisconnected = items.some(
                          (i) =>
                            isAuthError(i.status.error) ||
                            i.status.lastReplication === null,
                        )

                        return (
                          <Collapsible
                            key={dsId}
                            defaultOpen
                            className="mb-1 rounded-sm"
                          >
                            <CollapsibleTrigger className="hover:bg-accent/30 flex w-full items-center justify-between rounded-sm px-2 py-1.5 transition-colors">
                              <div className="flex items-center gap-1.5">
                                <ChevronRight
                                  size={12}
                                  className="text-muted-foreground shrink-0 transition-transform [&[data-state=open]]:rotate-90"
                                />
                                <span className="text-foreground/90 text-[10px] font-bold">
                                  {getDisplayName(dsId)}
                                </span>
                              </div>
                              {/* ÍCONE DE STATUS DO SOURCE (FLOAT RIGHT) */}
                              <div className="flex items-center">
                                {isDsDisconnected ? (
                                  <CloudOff
                                    size={12}
                                    className="text-zinc-400"
                                  />
                                ) : (
                                  <AiOutlineCloudSync
                                    size={14}
                                    className="text-green-500"
                                  />
                                )}
                              </div>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                              <div className="border-border/50 ml-4 space-y-0.5 border-l pb-1 pl-2">
                                {items.map(({ collection, status: s }) => {
                                  const isMissing = isAuthError(s.error)
                                  const isRealErr = s.error && !isMissing

                                  // Cores individuais das coleções
                                  let dotColor = 'bg-zinc-300'
                                  let label = 'Desconectado'

                                  if (isRealErr) {
                                    dotColor = 'bg-red-500'
                                    label = 'Erro'
                                  } else if (s.isPulling || s.isPushing) {
                                    dotColor = 'bg-blue-500 animate-pulse'
                                    label = 'Sincronizando'
                                  } else if (s.lastReplication && !isMissing) {
                                    dotColor = 'bg-green-500'
                                    label = 'Sincronizado'
                                  }

                                  return (
                                    <div
                                      key={collection}
                                      className="hover:bg-accent/20 rounded-sm px-1.5 py-1"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-muted-foreground text-[10px] font-medium">
                                          {COLLECTION_LABELS[collection] ??
                                            collection}
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`h-1.5 w-1.5 rounded-full ${dotColor}`}
                                          />
                                          <span className="text-muted-foreground text-[9px]">
                                            {label}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-muted-foreground/80 flex items-center gap-1 text-[8px]">
                                        <Clock size={8} />
                                        {isMissing
                                          ? 'Aguardando login'
                                          : s.lastReplication
                                            ? format(
                                                s.lastReplication,
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
                        )
                      })}
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
