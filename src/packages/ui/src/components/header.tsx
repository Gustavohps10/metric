'use client'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Activity,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  CloudOff,
  DatabaseIcon,
  Monitor,
  RefreshCcw,
  Share2Icon,
  User2,
  XCircle,
} from 'lucide-react'
import { AiOutlineCloudSync } from 'react-icons/ai'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { Button } from '@/components/ui/button'
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
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  ReplicationStatus,
  useConnectionsWithSync,
  useSyncStore,
} from '@/stores/syncStore'

const COLLECTION_LABELS: Record<string, string> = {
  metadata: 'Metadados',
  tasks: 'Tarefas',
  timeEntries: 'Apontamentos',
}

const ERROR_CODES = { MISSING_TOKEN: 'MISSING_TOKEN' }

const getRawErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, any>
    return (
      err.parameters?.errors?.message ||
      err.innerError?.message ||
      err.message ||
      ''
    )
  }
  return ''
}

const isAuthError = (error: unknown) =>
  getRawErrorMessage(error).includes(ERROR_CODES.MISSING_TOKEN)

export function Header() {
  const { workspace } = useWorkspace()
  const connections = useConnectionsWithSync()
  const dbName = useSyncStore((s) => s.db?.name)
  const isInitialized = useSyncStore((s) => s.isInitialized) ?? false

  const hasRemote = connections.length > 0
  const allStatuses = connections.flatMap((c) =>
    Object.values(c.sync).filter((v): v is ReplicationStatus => Boolean(v)),
  )

  const getGlobalState = () => {
    if (!isInitialized)
      return { color: 'bg-muted', label: 'Inicializando...', icon: 'sync' }
    if (!hasRemote)
      return { color: 'bg-zinc-400', label: 'Modo Local', icon: 'local' }

    if (allStatuses.some((v) => v.error && !isAuthError(v.error)))
      return { color: 'bg-red-500', label: 'Erro técnico', icon: 'sync' }
    if (allStatuses.some((v) => v.isPulling || v.isPushing))
      return {
        color: 'bg-blue-500 animate-pulse',
        label: 'Sincronizando...',
        icon: 'sync',
      }

    const anyDisconnected = allStatuses.some(
      (v) => isAuthError(v.error) || v.lastReplication === null,
    )
    if (anyDisconnected)
      return { color: 'bg-zinc-400', label: 'Conexões pendentes', icon: 'sync' }

    return { color: 'bg-green-500', label: 'Sincronizado', icon: 'sync' }
  }

  const globalStatus = getGlobalState()

  return (
    <header className="pointer-events-none absolute top-0 left-0 z-50 flex w-full justify-center bg-transparent pl-[calc(72px+240px)]">
      <div className="p-2">
        <div className="border-border bg-background/80 pointer-events-auto flex items-center justify-between gap-3 rounded-md border shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-2 px-1">
            <Avatar className="ring-border/50 h-5 w-5 rounded-sm shadow-sm ring-1">
              <AvatarImage
                src={workspace?.avatarUrl || undefined}
                alt={workspace?.name}
              />
              <AvatarFallback className="text-[10px] font-bold">
                {workspace?.name?.[0]?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-max flex-col leading-tight">
              <span className="text-foreground text-[10px] font-bold tracking-tight uppercase">
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
                        className="relative h-6 w-6 rounded-sm"
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
                  className="border-border/50 bg-background/95 w-[360px] overflow-hidden rounded-lg p-0 shadow-2xl backdrop-blur-md"
                  align="end"
                  sideOffset={8}
                >
                  <div className="bg-muted/30 flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="bg-background text-primary flex h-8 w-8 items-center justify-center rounded-lg border shadow-sm">
                        <Activity size={14} />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold tracking-tight opacity-80">
                          Sincronização
                        </h4>
                        <div className="text-muted-foreground flex items-center gap-1 font-mono text-[10px] leading-4">
                          <DatabaseIcon size={10} />
                          <span>
                            {dbName || 'HOUVE UM ERRO AO CARREGAR O DATABASE '}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto p-2">
                    {isInitialized && hasRemote ? (
                      <div className="flex flex-col gap-2">
                        {connections.map((conn) => {
                          const syncEntries = Object.entries(conn.sync).filter(
                            ([, v]) => v,
                          ) as [string, ReplicationStatus][]
                          const isSyncing = syncEntries.some(
                            ([, s]) => s.isPulling || s.isPushing,
                          )

                          return (
                            <div
                              key={conn.connectionId}
                              className="bg-card/40 hover:bg-card/60 rounded-lg border p-3 shadow-sm transition-colors"
                            >
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="relative shrink-0">
                                    {/* NOVO CONTAINER DE LOGO DO ADDON */}
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-zinc-100 p-1 shadow-sm dark:bg-zinc-900">
                                      {conn.addon?.logo ? (
                                        <img
                                          src={conn.addon.logo}
                                          alt={conn.addon.name}
                                          className="h-full w-full object-contain"
                                        />
                                      ) : (
                                        <span className="text-lg">📦</span>
                                      )}
                                    </div>

                                    {isSyncing && (
                                      <div className="bg-primary border-background absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 shadow-sm">
                                        <RefreshCcw
                                          size={10}
                                          className="animate-spin text-white"
                                        />
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex min-w-0 flex-col">
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      <span className="truncate text-[11px] font-bold tracking-tight">
                                        {conn.addon?.name || conn.connectionId}
                                      </span>
                                      <span className="text-muted-foreground shrink-0 font-mono text-[9px] font-medium opacity-60">
                                        v{conn.addon?.version || '1.0'}
                                      </span>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1.5">
                                      <Avatar className="ring-border h-4 w-4 rounded-full shadow-sm ring-1">
                                        <AvatarImage
                                          src={conn.member?.avatarUrl}
                                        />
                                        <AvatarFallback className="bg-muted text-[8px]">
                                          <User2 size={8} />
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-muted-foreground max-w-[180px] text-[10px]">
                                        {conn.member?.name ||
                                          'NÃO IDENTIFICADO '}{' '}
                                        <span className="text-[9px] opacity-50">
                                          {conn.member?.login}
                                        </span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                {conn.status === 'connected' ? (
                                  <CheckCircle2
                                    size={14}
                                    className="shrink-0 text-green-500"
                                  />
                                ) : (
                                  <CloudOff
                                    size={14}
                                    className="text-muted-foreground shrink-0"
                                  />
                                )}
                              </div>

                              <div className="flex flex-col gap-1 px-1">
                                {syncEntries.map(([key, status]) => {
                                  const pulling =
                                    status.isPulling || status.isPushing
                                  const isErr =
                                    status.error && !isAuthError(status.error)

                                  let statusText = 'Sincronizado'
                                  let StatusIcon = (
                                    <CheckCircle
                                      size={12}
                                      className="text-green-500"
                                    />
                                  )

                                  if (pulling) {
                                    statusText = 'Sincronizando...'
                                    StatusIcon = (
                                      <RefreshCcw
                                        size={12}
                                        className="animate-spin text-blue-500"
                                      />
                                    )
                                  } else if (isErr) {
                                    statusText = 'Falha técnica'
                                    StatusIcon = (
                                      <XCircle
                                        size={12}
                                        className="text-red-500"
                                      />
                                    )
                                  } else if (isAuthError(status.error)) {
                                    statusText = 'Login expirado'
                                    StatusIcon = (
                                      <AlertCircle
                                        size={12}
                                        className="text-zinc-400"
                                      />
                                    )
                                  } else if (!status.lastReplication) {
                                    statusText = 'Aguardando'
                                    StatusIcon = (
                                      <Clock
                                        size={12}
                                        className="text-zinc-400"
                                      />
                                    )
                                  }

                                  return (
                                    <div
                                      key={key}
                                      className="border-border/30 flex items-center justify-between border-t py-1 first:border-0"
                                    >
                                      <span className="text-muted-foreground text-[10px] font-medium tracking-tight">
                                        {COLLECTION_LABELS[key] || key}
                                      </span>

                                      <div className="flex items-center gap-2">
                                        {StatusIcon}
                                        <div className="flex flex-col items-end">
                                          <span
                                            className={`text-[9px] font-bold ${isErr ? 'text-red-500' : pulling ? 'text-blue-500' : 'text-foreground/80'}`}
                                          >
                                            {statusText}
                                          </span>
                                          {status.lastReplication &&
                                            !pulling && (
                                              <span className="text-muted-foreground/60 mt-0.5 text-[8px] leading-none">
                                                {format(
                                                  status.lastReplication,
                                                  "HH:mm 'em' dd/MM",
                                                  { locale: ptBR },
                                                )}
                                              </span>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center">
                        <Monitor
                          size={24}
                          className="text-muted-foreground/20 mx-auto mb-2"
                        />
                        <p className="text-muted-foreground text-[10px] italic opacity-60">
                          {isInitialized
                            ? 'Somente dados locais ativados'
                            : 'Inicializando motor...'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/20 flex items-center justify-between border-t px-4 py-2">
                    <span className="text-muted-foreground font-mono text-[8px] tracking-widest uppercase opacity-50">
                      Sync Engine v4.2
                    </span>
                    <span className="flex items-center gap-1.5 text-[9px] font-bold text-green-500">
                      <Activity size={10} className="animate-pulse" />
                      Motor Ativo
                    </span>
                  </div>
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-sm"
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
