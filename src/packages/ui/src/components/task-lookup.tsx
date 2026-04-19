'use client'

import { WorkspaceConnectionDTO } from '@metric-org/application'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  AlertCircle,
  Circle,
  Clock,
  FilterX,
  Hash,
  Loader2,
  Search,
  User,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import React, {
  ElementType,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useDebounce } from 'use-debounce'

import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkspace } from '@/hooks'
import { cn } from '@/lib/utils'
import { SyncMetadataRxDBDTO } from '@/local-db/schemas/metadata-sync-schema'
import { SyncTaskRxDBDTO } from '@/local-db/schemas/tasks-sync-schema'
import { useSyncStore } from '@/stores/syncStore'

interface TaskLookupModalProps {
  trigger?: React.ReactNode
  onSelect: (task: SyncTaskRxDBDTO) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  currentUserId?: string | null
  /**
   * memberId por `connectionInstanceId` (ex: 'redmine-empresa-a'),
   * para filtrar "minhas tarefas" corretamente em múltiplas contas.
   */
  memberIdsByConnection?: Record<string, string | null | undefined>
}

const PAGE_SIZE = 50
const ROW_HEIGHT = 54

const DynamicIcon = ({
  name,
  color,
  className,
}: {
  name?: string
  color?: string
  className?: string
}) => {
  if (!name) return null
  const Icon = (LucideIcons as any)[name] as ElementType
  if (!Icon) return null
  return <Icon className={className} style={{ color }} />
}

export function TaskLookup({
  trigger,
  onSelect,
  open,
  onOpenChange,
  currentUserId = 'me',
  memberIdsByConnection,
}: TaskLookupModalProps) {
  const db = useSyncStore((s) => s.db)
  const { workspace } = useWorkspace()
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch] = useDebounce(searchTerm, 300)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [onlyMyTasks, setOnlyMyTasks] = useState(true)
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  // Lista de IDs de instâncias (connections) selecionadas
  const [selectedConnectionIds, setSelectedConnectionIds] = useState<string[]>(
    [],
  )

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [internalOpen, setInternalOpen] = useState(false)
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  )

  const isModalOpen = open ?? internalOpen
  const setIsModalOpen = onOpenChange ?? setInternalOpen

  const { data: metadata } = useQuery({
    queryKey: ['sync-metadata'],
    queryFn: async () => {
      if (!db) return null
      const doc = await db.metadata.findOne().exec()
      return doc?.toMutableJSON() as SyncMetadataRxDBDTO
    },
    enabled: isModalOpen && !!db,
  })

  const metaLookup = useMemo(() => {
    const statuses = new Map<string, any>()
    const priorities = new Map<string, any>()
    metadata?.taskStatuses?.forEach((s) => statuses.set(s.id, s))
    metadata?.taskPriorities?.forEach((p) => priorities.set(p.id, p))
    return { statuses, priorities }
  }, [metadata])

  const availableConnections = useMemo(() => {
    const connections = workspace?.dataSourceConnections ?? []
    return connections.map((c: WorkspaceConnectionDTO) => ({
      id: c.id,
      label: String(c.config?.name || c.dataSourceId),
    }))
  }, [workspace])

  const effectiveConnectionIds = useMemo(() => {
    if (selectedConnectionIds.length === 0)
      return availableConnections.map((s) => s.id)
    return selectedConnectionIds
  }, [selectedConnectionIds, availableConnections])

  const connectionLabelById = useMemo(() => {
    return new Map(availableConnections.map((s) => [s.id, s.label]))
  }, [availableConnections])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: [
        'task-lookup',
        debouncedSearch,
        statusFilter,
        priorityFilter,
        onlyMyTasks,
        sortOrder,
        selectedConnectionIds.join(','),
      ],
      initialPageParam: 0,
      queryFn: async ({ pageParam = 0 }) => {
        if (!db) return []

        const andConditions: any[] = []

        if (debouncedSearch) {
          andConditions.push({
            $or: [
              { title: { $regex: `.*${debouncedSearch}.*`, $options: 'i' } },
              { id: { $regex: `.*${debouncedSearch}.*`, $options: 'i' } },
            ],
          })
        }

        if (statusFilter !== 'all')
          andConditions.push({ 'status.id': statusFilter })
        if (priorityFilter !== 'all')
          andConditions.push({ 'priority.id': priorityFilter })

        if (effectiveConnectionIds.length > 0) {
          if (onlyMyTasks) {
            // Filtra "Minhas Tarefas" respeitando o ID de usuário de cada conexão ativa
            const myTasksOr = effectiveConnectionIds
              .map((connId) => {
                const memberId =
                  memberIdsByConnection?.[connId] ?? currentUserId
                if (!memberId) return null
                return {
                  connectionInstanceId: connId,
                  participants: { $elemMatch: { id: String(memberId) } },
                }
              })
              .filter(Boolean)

            if (myTasksOr.length > 0) {
              andConditions.push({ $or: myTasksOr })
            } else {
              andConditions.push({
                connectionInstanceId: { $in: effectiveConnectionIds },
              })
            }
          } else {
            andConditions.push({
              connectionInstanceId: { $in: effectiveConnectionIds },
            })
          }
        }

        const selector: any =
          andConditions.length > 0 ? { $and: andConditions } : {}

        const docs = await db.tasks
          .find({
            selector,
            limit: PAGE_SIZE,
            skip: pageParam * PAGE_SIZE,
            sort: [{ updatedAt: sortOrder }],
          })
          .exec()

        return docs.map((d) => d.toMutableJSON())
      },
      getNextPageParam: (lastPage, allPages) => {
        return lastPage.length === PAGE_SIZE ? allPages.length : undefined
      },
      enabled: isModalOpen && !!db,
    })

  const allTasks = useMemo(() => data?.pages.flat() ?? [], [data])

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allTasks.length + 1 : allTasks.length,
    getScrollElement: () => scrollElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()

  useEffect(() => {
    if (isModalOpen && scrollElement) rowVirtualizer.measure()
  }, [isModalOpen, scrollElement, rowVirtualizer])

  useEffect(() => {
    if (scrollElement) {
      rowVirtualizer.scrollToOffset(0)
      setSelectedIndex(0)
    }
  }, [
    debouncedSearch,
    statusFilter,
    priorityFilter,
    onlyMyTasks,
    sortOrder,
    scrollElement,
    rowVirtualizer,
  ])

  useEffect(() => {
    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem || !hasNextPage || isFetchingNextPage) return
    if (lastItem.index >= allTasks.length - 1) fetchNextPage()
  }, [
    virtualItems,
    hasNextPage,
    isFetchingNextPage,
    allTasks.length,
    fetchNextPage,
  ])

  const handleSelect = useCallback(
    (task: SyncTaskRxDBDTO) => {
      if (!task) return
      onSelect(task)
      setIsModalOpen(false)
    },
    [onSelect, setIsModalOpen],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!allTasks.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(selectedIndex + 1, allTasks.length - 1)
      setSelectedIndex(next)
      rowVirtualizer.scrollToIndex(next, { align: 'center' })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const prev = Math.max(selectedIndex - 1, 0)
      setSelectedIndex(prev)
      rowVirtualizer.scrollToIndex(prev, { align: 'center' })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selectedTask = allTasks[selectedIndex]
      if (selectedTask) handleSelect(selectedTask)
    }
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogPortal>
        <DialogOverlay className="bg-black/40 backdrop-blur-sm" />
        <DialogContent
          onKeyDown={handleKeyDown}
          className="bg-background border-border/50 flex max-h-[90vh] w-[95vw] max-w-3xl flex-col overflow-hidden border p-0 shadow-2xl"
        >
          <DialogHeader className="bg-muted/20 border-border/50 border-b p-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-muted-foreground flex items-center gap-2 text-sm font-bold tracking-tight uppercase">
                <Hash className="h-4 w-4" /> Selecionar Tarefa
              </DialogTitle>
              {(statusFilter !== 'all' ||
                priorityFilter !== 'all' ||
                !onlyMyTasks ||
                selectedConnectionIds.length > 0) && (
                <button
                  onClick={() => {
                    setStatusFilter('all')
                    setPriorityFilter('all')
                    setOnlyMyTasks(true)
                    setSelectedConnectionIds([])
                  }}
                  className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[10px] font-bold uppercase transition-colors"
                >
                  <FilterX className="h-3 w-3" /> Limpar Filtros
                </button>
              )}
            </div>

            <div className="relative mt-2">
              {isLoading ? (
                <Loader2 className="text-primary absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 animate-spin" />
              ) : (
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 opacity-30" />
              )}
              <Input
                autoFocus
                placeholder="ID ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 border-none bg-transparent pl-10 text-lg shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="border-border/10 mt-1 flex flex-wrap items-center gap-3 border-t py-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-muted/50 h-7 w-fit min-w-[130px] border-none text-[9px] font-bold uppercase focus:ring-0">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="text-[10px] font-bold uppercase"
                  >
                    Todos Status
                  </SelectItem>
                  {metadata?.taskStatuses?.map((s) => (
                    <SelectItem
                      key={s.id}
                      value={s.id}
                      className="text-[10px] font-bold uppercase"
                    >
                      <div className="flex items-center gap-2">
                        <DynamicIcon
                          name={s.icon}
                          className="h-3.5 w-3.5 opacity-70"
                        />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-muted/50 h-7 w-fit min-w-[110px] border-none text-[9px] font-bold uppercase focus:ring-0">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="all"
                    className="text-[10px] font-bold uppercase"
                  >
                    Todas Prioridades
                  </SelectItem>
                  {metadata?.taskPriorities?.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="text-[10px] font-bold uppercase"
                    >
                      <div className="flex items-center gap-2">
                        <DynamicIcon
                          name={p.icon}
                          color={p.colors.badge}
                          className="h-3.5 w-3.5"
                        />
                        {p.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {availableConnections.length > 0 && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[9px] font-bold uppercase opacity-70">
                    Fontes
                  </span>
                  {availableConnections.map((s) => {
                    const checked =
                      selectedConnectionIds.length === 0 ||
                      selectedConnectionIds.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => {
                            if (v) {
                              setSelectedConnectionIds((prev) => [
                                ...prev,
                                s.id,
                              ])
                            } else {
                              setSelectedConnectionIds((prev) =>
                                prev.filter((id) => id !== s.id),
                              )
                            }
                          }}
                        />
                        <span className="text-[9px] font-bold uppercase opacity-80">
                          {s.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              <Select
                value={sortOrder}
                onValueChange={(v: any) => setSortOrder(v)}
              >
                <SelectTrigger className="bg-muted/50 h-7 w-fit border-none text-[9px] font-bold uppercase focus:ring-0">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 opacity-50" />
                    <SelectValue placeholder="Ordem" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="desc"
                    className="text-[10px] font-bold uppercase"
                  >
                    Mais Recentes
                  </SelectItem>
                  <SelectItem
                    value="asc"
                    className="text-[10px] font-bold uppercase"
                  >
                    Mais Antigas
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="border-border/20 ml-1 flex items-center gap-2 border-l px-2">
                <Checkbox
                  id="my-tasks"
                  checked={onlyMyTasks}
                  onCheckedChange={(v) => setOnlyMyTasks(!!v)}
                />
                <label
                  htmlFor="my-tasks"
                  className="cursor-pointer text-[9px] font-bold uppercase opacity-70 select-none"
                >
                  Tarefas que participo
                </label>
              </div>
            </div>
          </DialogHeader>

          <div
            ref={setScrollElement}
            className="scrollbar-thin scrollbar-thumb-muted flex-1 overflow-y-auto"
            style={{ height: '500px' }}
          >
            {allTasks.length > 0 ? (
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {virtualItems.map((virtualRow) => {
                  const isLoaderRow = virtualRow.index > allTasks.length - 1
                  const task = allTasks[virtualRow.index]
                  const isSelected = selectedIndex === virtualRow.index

                  if (!isLoaderRow && !task) return null

                  const pMeta = isLoaderRow
                    ? null
                    : metaLookup.priorities.get(task.priority?.id ?? '')
                  const statusColor = isLoaderRow
                    ? 'transparent'
                    : metaLookup.statuses.get(task.status?.id)?.colors.badge ||
                      '#888888'

                  return (
                    <div
                      key={virtualRow.key}
                      onClick={() => !isLoaderRow && task && handleSelect(task)}
                      onMouseEnter={() =>
                        !isLoaderRow && setSelectedIndex(virtualRow.index)
                      }
                      className={cn(
                        'border-border/10 absolute top-0 left-0 flex w-full cursor-pointer items-center gap-4 border-b px-4 py-2 transition-colors',
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'hover:bg-muted/50',
                        isLoaderRow && 'pointer-events-none',
                      )}
                      style={{
                        height: `${ROW_HEIGHT}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                        willChange: 'transform',
                      }}
                    >
                      {isLoaderRow ? (
                        <div className="flex w-full items-center justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin opacity-20" />
                        </div>
                      ) : (
                        <>
                          <div className="flex shrink-0 items-center justify-center">
                            <DynamicIcon
                              name={pMeta?.icon}
                              color={pMeta?.colors.badge}
                              className="h-4 w-4"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center gap-2">
                              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px] font-bold">
                                {task.id}
                              </span>
                              <h4 className="text-foreground truncate text-[12px] font-bold tracking-tight">
                                {task.title}
                              </h4>
                            </div>
                            <div className="text-muted-foreground flex items-center gap-3 text-[9px] font-medium tracking-tight opacity-80">
                              <span className="flex max-w-[150px] items-center gap-1 truncate font-semibold opacity-60">
                                {task.projectName || 'Sem Projeto'}
                              </span>
                              <span className="opacity-40">•</span>
                              <span className="flex shrink-0 items-center gap-1 font-semibold">
                                <Circle
                                  className="h-2 w-2 fill-current"
                                  style={{ color: statusColor }}
                                />
                                {task.status?.name}
                              </span>
                              {task.connectionInstanceId ? (
                                <>
                                  <span className="opacity-40">•</span>
                                  <Badge
                                    variant="outline"
                                    className="h-4 px-1 text-[10px] font-bold"
                                  >
                                    {connectionLabelById.get(
                                      task.connectionInstanceId,
                                    ) ?? task.connectionInstanceId}
                                  </Badge>
                                </>
                              ) : null}
                              {task.participants?.some((p) => {
                                const myId =
                                  memberIdsByConnection?.[
                                    task.connectionInstanceId
                                  ] ?? currentUserId
                                return p.id === String(myId ?? '')
                              }) && (
                                <>
                                  <span className="opacity-40">•</span>
                                  <Badge
                                    variant="outline"
                                    className="h-4 gap-1 px-1 text-[10px] font-bold"
                                  >
                                    <User className="h-2.5 w-2.5" /> Eu
                                  </Badge>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1">
                            {isSelected && (
                              <Badge className="h-4 px-1.5 text-[8px] font-bold uppercase">
                                Selecionar
                              </Badge>
                            )}
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase opacity-40">
                              {new Date(task.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : !isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 opacity-20">
                <AlertCircle className="mb-4 h-12 w-12" />
                <p className="text-xs font-bold uppercase">Nenhum resultado</p>
              </div>
            ) : null}
          </div>

          <div className="bg-muted/30 text-muted-foreground border-border/50 flex items-center justify-between border-t px-4 py-2.5 text-[10px] font-bold uppercase">
            <span>{allTasks.length} Resultados</span>
            <div className="flex gap-4 opacity-60">
              <span className="flex items-center gap-1">
                <kbd className="bg-muted min-w-[16px] rounded border px-1 text-center">
                  ↑↓
                </kbd>{' '}
                Navegar
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-muted min-w-[16px] rounded border px-1 text-center">
                  ⏎
                </kbd>{' '}
                Escolher
              </span>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
