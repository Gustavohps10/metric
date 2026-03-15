'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ColumnDef,
  ExpandedState,
  Row as TanStackRow,
} from '@tanstack/react-table'
import {
  differenceInSeconds,
  eachDayOfInterval,
  endOfDay,
  format,
  isSameDay,
  isValid,
  parse,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart2,
  Briefcase,
  CalendarCheck,
  CheckCircle,
  ClipboardCheck,
  ClockArrowDownIcon,
  ClockArrowUpIcon,
  Code,
  CopyIcon,
  EditIcon,
  FileText,
  FlaskConical,
  GraduationCap,
  Handshake,
  HourglassIcon,
  LifeBuoy,
  ListPlus,
  MoreHorizontal,
  Palette,
  Pause,
  PlusIcon,
  Save,
  SearchCode,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import React, {
  ElementType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { DateRange } from 'react-day-picker'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'

import { DatePickerWithRange } from '@/components'
import { LookupInput } from '@/components/lookup-input'
import { TaskLookup } from '@/components/task-lookup'
import {
  columns as baseColumns,
  Row,
} from '@/components/time-entries-table/columns'
import { DataTable } from '@/components/time-entries-table/data-table'
import { TimeEntryInputs } from '@/components/time-entry-inputs'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SyncMetadataItem } from '@/db/schemas/metadata-sync-schema'
import { SyncTaskRxDBDTO } from '@/db/schemas/tasks-sync-schema'
import { SyncTimeEntryRxDBDTO } from '@/db/schemas/time-entries-sync-schema'
import { useWorkspace } from '@/hooks'
import { useAuth } from '@/hooks'
import { useActiveTimer } from '@/hooks/use-active-timer'
import { cn } from '@/lib'
import { useSyncStore } from '@/stores/syncStore'
import { useTimeEntryStore } from '@/stores/timeEntryStore'

interface SuggestionRow extends Row {
  isSuggestion?: boolean
}

const decimalToHMS = (decimalHours: number) => {
  const totalSeconds = Math.round(decimalHours * 3600)
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0')
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const s = (totalSeconds % 60).toString().padStart(2, '0')
  return `${h}:${m}:${s}`
}

const formatSecondsToHMDisplay = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  return `${h}h ${m.toString().padStart(2, '0')}m`
}

const iconMap: Record<string, ElementType> = {
  Palette,
  Code,
  BarChart2,
  CalendarCheck,
  CheckCircle,
  FlaskConical,
  SearchCode,
  Settings,
  Wrench,
  LifeBuoy,
  Handshake,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Users,
  Briefcase,
  ShieldCheck,
}

function groupByIssue(data: SuggestionRow[]): SuggestionRow[] {
  const counts: Record<string, number> = {}
  for (const item of data) {
    const dayKey = format(parseISO(item.startDate ?? ''), 'yyyy-MM-dd')
    const key = `${dayKey}-${item.task?.id ?? 'sem-issue'}`
    counts[key] = (counts[key] || 0) + 1
  }

  const groups: Record<string, SuggestionRow> = {}
  const result: SuggestionRow[] = []

  for (const item of data) {
    const dayKey = format(parseISO(item.startDate ?? ''), 'yyyy-MM-dd')
    const key = `${dayKey}-${item.task?.id ?? 'sem-issue'}`

    if (counts[key] > 1) {
      if (!groups[key]) {
        groups[key] = {
          ...item,
          id: key,
          timeSpent: 0,
          comments: '',
          subRows: [],
        }
        result.push(groups[key])
      }
      if (!item.isSuggestion) {
        groups[key].timeSpent += item.timeSpent
      }
      groups[key].subRows?.push(item)
    } else {
      result.push({ ...item, subRows: [] })
    }
  }
  return result
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="rounded-md border">
        <div className="bg-muted/50 border-b p-2">
          <div className="flex gap-4">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b p-3 last:border-0"
          >
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end pr-4">
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  )
}

const MemoizedCommentInput = React.memo(
  ({
    initialValue,
    onChange,
  }: {
    initialValue: string
    onChange: (val: string) => void
  }) => {
    const [localValue, setLocalValue] = useState(initialValue)
    return (
      <Input
        value={localValue}
        className="border-primary/40 h-7 text-xs focus-visible:ring-1"
        onChange={(e) => {
          setLocalValue(e.target.value)
          onChange(e.target.value)
        }}
        autoFocus
      />
    )
  },
)
MemoizedCommentInput.displayName = 'MemoizedCommentInput'

export function TimeEntries() {
  const db = useSyncStore((state) => state?.db)
  const { workspace } = useWorkspace()
  const { user } = useAuth()
  const dataSourceId =
    workspace?.dataSource && workspace.dataSource !== 'local'
      ? workspace.dataSource
      : 'local'
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [taskLookupOpen, setTaskLookupOpen] = useState(false)
  const [rowBeingEdited, setRowBeingEdited] = useState<string | null>(null)

  const [editingRows, setEditingRows] = useState<Record<string, boolean>>({})
  const [tempData, setTempData] = useState<
    Record<string, Partial<SyncTimeEntryRxDBDTO>>
  >({})
  const [duplicatingRowId, setDuplicatingRowId] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<ExpandedState>({})

  const tempDataRef = useRef(tempData)
  useEffect(() => {
    tempDataRef.current = tempData
  }, [tempData])

  const getRowData = useCallback((id: string) => tempDataRef.current[id], [])

  const range = useMemo(() => {
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const parsedFrom = from ? parseISO(from) : null
    const parsedTo = to ? parseISO(to) : null

    if (parsedFrom && isValid(parsedFrom) && parsedTo && isValid(parsedTo)) {
      return { from: parsedFrom, to: parsedTo }
    }

    return {
      from: subDays(new Date(), 6),
      to: new Date(),
    }
  }, [searchParams])

  const handleRangeChange = (newRange: DateRange | undefined) => {
    if (newRange?.from && newRange.to) {
      setSearchParams({
        from: newRange.from.toISOString(),
        to: newRange.to.toISOString(),
      })
    }
  }

  const activeTimeEntry = useTimeEntryStore((s) => s.active)
  const createNewTimeEntry = useTimeEntryStore((s) => s.createNewTimeEntry)
  const stopCurrentTimeEntry = useTimeEntryStore((s) => s.stopCurrentTimeEntry)

  const amountSecondsPassed = useActiveTimer()

  const timerDisplay = useMemo(
    () => decimalToHMS(amountSecondsPassed / 3600),
    [amountSecondsPassed],
  )

  const [selectedTask, setSelectedTask] = useState<SyncTaskRxDBDTO | null>(null)
  const [comments, setComments] = useState('')
  const [selectedActivity, setSelectedActivity] = useState('')
  const [timeEntryType, setTimeEntryType] = useState<
    'increasing' | 'decreasing' | 'manual'
  >('increasing')

  const { data: timeEntriesResponse, isLoading } = useQuery({
    queryKey: [
      'time-entries-range',
      range.from.toISOString(),
      range.to.toISOString(),
    ],
    queryFn: async () => {
      if (!db?.timeEntries) return { data: [] }
      const results = await db.timeEntries
        .find({
          selector: {
            startDate: {
              $gte: startOfDay(range.from).toISOString(),
              $lte: endOfDay(range.to).toISOString(),
            },
          },
          sort: [{ startDate: 'desc' }],
        })
        .exec()
      return { data: results.map((doc) => doc.toMutableJSON()) }
    },
    enabled: !!db?.timeEntries,
  })

  const [activities, setActivities] = useState<SyncMetadataItem[]>([])
  useEffect(() => {
    if (!db?.metadata) return
    const metaSub = db.metadata.findOne().$.subscribe((doc) => {
      if (doc) setActivities([...(doc.toMutableJSON().activities || [])])
    })
    return () => metaSub.unsubscribe()
  }, [db])

  const daysInRange = useMemo(() => {
    return eachDayOfInterval({ start: range.from, end: range.to }).reverse()
  }, [range])

  useEffect(() => {
    if (timeEntriesResponse?.data) {
      setExpandedRows((prev) => {
        const nextExpanded = { ...(typeof prev === 'object' ? prev : {}) }
        daysInRange.forEach((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const entries = timeEntriesResponse.data.filter(
            (e: any) => e.startDate && isSameDay(parseISO(e.startDate), day),
          )
          const groupKeys = new Set(
            entries.map((e: any) => `${dayKey}-${e.task?.id ?? 'sem-issue'}`),
          )
          groupKeys.forEach((key) => {
            if (!(key in nextExpanded)) {
              nextExpanded[key] = true
            }
          })
        })
        return nextExpanded
      })
    }
  }, [timeEntriesResponse?.data, daysInRange])

  const handleTimerAction = async () => {
    if (activeTimeEntry?.timeStatus === 'running') {
      await stopCurrentTimeEntry(db!)
      toast.success('Contagem finalizada')
      queryClient.invalidateQueries({ queryKey: ['time-entries-range'] })
      return
    }
    if (!selectedTask || !selectedActivity) {
      toast.error('Selecione uma tarefa e atividade')
      return
    }
    if (timeEntryType === 'manual') {
      const baseDate = new Date()
      const dStart = parse('09:00', 'HH:mm', baseDate)
      const dEnd = parse('10:00', 'HH:mm', baseDate)
      const decimalResult = Number(
        (differenceInSeconds(dEnd, dStart) / 3600).toFixed(4),
      )

      const id = crypto.randomUUID()
      await db?.timeEntries.insert({
        _id: `${dataSourceId}::local-${id}`,
        id,
        dataSourceId,
        task: { id: selectedTask.id },
        activity: { id: selectedActivity },
        user: { id: user?.id.toString() || 'local' },
        startDate: dStart.toISOString(),
        endDate: dEnd.toISOString(),
        timeSpent: decimalResult,
        timeStatus: 'finished',
        type: 'manual',
        comments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _deleted: false,
      })
      toast.success('Registro manual adicionado')
      setComments('')
    } else {
      await createNewTimeEntry(db!, {
        taskId: selectedTask.id,
        activityId: selectedActivity,
        dataSourceId: selectedTask.dataSourceId ?? dataSourceId,
        type: timeEntryType,
        comments,
        userId: user?.id.toString(),
      })
      toast.success('Timer iniciado')
    }
    queryClient.invalidateQueries({ queryKey: ['time-entries-range'] })
  }

  const handleDeleteEntry = async (id: string) => {
    if (!db) return
    const doc = await db.timeEntries.findOne(id).exec()
    if (doc) {
      await doc.remove()
      toast.success('Registro removido')
      await queryClient.invalidateQueries({ queryKey: ['time-entries-range'] })
    }
  }

  const handleSaveRow = useCallback(
    async (rowUid: string) => {
      if (!db) return
      const changes = tempDataRef.current[rowUid]
      if (changes) {
        const doc = await db.timeEntries.findOne(rowUid).exec()
        if (doc)
          await doc.patch({ ...changes, updatedAt: new Date().toISOString() })
        toast.success('Alterações salvas')
      }
      setEditingRows((prev) => ({ ...prev, [rowUid]: false }))
      setTempData((prev) => {
        const next = { ...prev }
        delete next[rowUid]
        return next
      })
      queryClient.invalidateQueries({ queryKey: ['time-entries-range'] })
    },
    [db, queryClient],
  )

  const handleConfirmDuplication = async (row: SuggestionRow) => {
    if (!db) return
    try {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const edited = tempData[row.id] || {}

      if (!row.task?.id && !edited.task?.id) {
        toast.error('Selecione um ticket')
        return
      }

      const dsId =
        (row.task as { dataSourceId?: string })?.dataSourceId ?? dataSourceId
      await db.timeEntries.insert({
        _id: `${dsId}::local-${id}`,
        id,
        dataSourceId: dsId,
        task: { id: edited.task?.id || row.task?.id },
        activity: { id: edited.activity?.id || row.activity?.id },
        user: { id: row.user?.id || user?.id.toString() || 'local' },
        startDate: edited.startDate || row.startDate,
        endDate: edited.endDate || row.endDate,
        timeSpent: edited.timeSpent ?? row.timeSpent,
        comments: edited.comments ?? row.comments,
        timeStatus: 'finished',
        type: 'manual',
        createdAt: now,
        updatedAt: now,
        _deleted: false,
      })

      setDuplicatingRowId(null)
      setTempData((p) => {
        const n = { ...p }
        delete n[row.id]
        return n
      })
      await queryClient.invalidateQueries({ queryKey: ['time-entries-range'] })
      toast.success('Registro salvo')
    } catch (e) {
      toast.error('Erro ao salvar')
    }
  }

  const tableColumns = useMemo<ColumnDef<SuggestionRow>[]>(() => {
    const order = [
      'expand',
      'issue_id',
      'syncStatus',
      'createdAt',
      'activity',
      'comments',
      'hours',
      'actions',
    ]

    const mapped = baseColumns.map((col) => {
      if (col.id === 'issue_id') {
        return {
          ...col,
          cell: ({ row }: { row: TanStackRow<SuggestionRow> }) => {
            const original = row.original
            const isEditing = editingRows[original.id] || original.isSuggestion
            const data = getRowData(original.id)
            const currentTaskId = data?.task?.id || original.task?.id

            const badgeElement = (
              <Badge
                variant="outline"
                className={cn(
                  'font-mono text-[11px] font-bold transition-colors',
                  isEditing
                    ? 'border-primary/50 hover:bg-primary/5 cursor-pointer'
                    : 'opacity-80',
                )}
              >
                {currentTaskId ? `#${currentTaskId}` : '# Ticket'}
              </Badge>
            )

            if (isEditing) {
              return (
                <div className="flex w-full justify-center">
                  <LookupInput
                    size="2xs"
                    value={currentTaskId ?? ''}
                    onChange={(id) =>
                      setTempData((p) => ({
                        ...p,
                        [original.id]: {
                          ...p[original.id],
                          task: { id },
                        },
                      }))
                    }
                    onOpenLookup={() => {
                      setRowBeingEdited(original.id)
                      setTaskLookupOpen(true)
                    }}
                    placeholder="Tarefa"
                  />
                </div>
              )
            }

            return (
              <div className="flex w-full justify-center">{badgeElement}</div>
            )
          },
        }
      }

      if (col.id === 'hours') {
        return {
          ...col,
          header: () => (
            <div className="text-right text-[10px] font-bold uppercase opacity-70">
              Tempo
            </div>
          ),
          cell: ({ row }: { row: TanStackRow<SuggestionRow> }) => {
            const original = row.original
            const isGroupMaster =
              (original.subRows?.length ?? 0) > 1 && !row.getParentRow()
            const rowData = getRowData(original.id) || {}

            return (
              <div className="flex items-center justify-end">
                <TimeEntryInputs
                  startDate={rowData.startDate ?? original.startDate}
                  endDate={rowData.endDate ?? original.endDate}
                  timeSpent={rowData.timeSpent ?? original.timeSpent}
                  disabled={isGroupMaster && !original.isSuggestion}
                  onChange={async (newData) => {
                    if (original.isSuggestion) {
                      setTempData((p) => ({
                        ...p,
                        [original.id]: { ...p[original.id], ...newData },
                      }))
                      return
                    }
                    if (!db) return
                    const doc = await db.timeEntries.findOne(original.id).exec()
                    if (doc) {
                      await doc.patch({
                        ...newData,
                        updatedAt: new Date().toISOString(),
                      })
                      queryClient.invalidateQueries({
                        queryKey: ['time-entries-range'],
                      })
                      toast.success('Tempo atualizado')
                    }
                  }}
                />
              </div>
            )
          },
        }
      }

      if (col.id === 'activity') {
        return {
          ...col,
          cell: ({ row }: { row: TanStackRow<SuggestionRow> }) => {
            const original = row.original
            const isGroupMaster =
              (original.subRows?.length ?? 0) > 1 && !row.getParentRow()
            const isEditing =
              original.isSuggestion ||
              (editingRows[original.id] && !isGroupMaster)

            if (isEditing) {
              const currentVal =
                getRowData(original.id)?.activity?.id || original.activity?.id
              return (
                <Select
                  value={currentVal}
                  onValueChange={(val) =>
                    setTempData((p) => ({
                      ...p,
                      [original.id]: {
                        ...p[original.id],
                        activity: { id: val },
                      },
                    }))
                  }
                >
                  <SelectTrigger className="border-primary/40 h-7 text-xs focus:ring-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {activities.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="text-xs">
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )
            }
            const uniqueActivityIds = Array.from(
              new Set(
                (original.subRows || []).length > 0
                  ? (original.subRows || []).map((s) => s.activity?.id)
                  : [original.activity?.id],
              ),
            ).filter(Boolean)
            const groupActivities = uniqueActivityIds
              .map((id) => activities.find((a) => a.id === id))
              .filter((a): a is SyncMetadataItem => !!a)
            return (
              <div className="relative flex h-8 w-full min-w-[180px] items-center">
                <div className="relative h-6 w-full">
                  {groupActivities.slice(0, 3).map((act, i) => (
                    <div
                      key={act.id}
                      className={cn(
                        'absolute flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium shadow-sm transition-all',
                        i === 0 && 'top-0 left-0 z-3',
                        i === 1 && 'z-2 translate-x-2 translate-y-1',
                        i === 2 && 'z-1 translate-x-4 translate-y-2',
                      )}
                      style={{
                        backgroundColor: act.colors.background,
                        color: act.colors.text,
                        borderColor: act.colors.badge,
                      }}
                    >
                      {iconMap[act.icon] &&
                        React.createElement(iconMap[act.icon], { size: 12 })}
                      <span className="max-w-[100px] truncate">{act.name}</span>
                    </div>
                  ))}
                </div>
                {groupActivities.length > 3 && (
                  <Badge variant="outline" className="ml-auto text-[10px]">
                    +{groupActivities.length - 3}
                  </Badge>
                )}
              </div>
            )
          },
        }
      }

      if (col.id === 'comments') {
        return {
          ...col,
          cell: ({ row }: { row: TanStackRow<SuggestionRow> }) => {
            const original = row.original
            const isGroupMaster =
              (original.subRows?.length ?? 0) > 1 && !row.getParentRow()
            const isEditing =
              original.isSuggestion ||
              (editingRows[original.id] && !isGroupMaster)

            if (isEditing) {
              return (
                <MemoizedCommentInput
                  initialValue={
                    getRowData(original.id)?.comments ?? original.comments ?? ''
                  }
                  onChange={(val) =>
                    setTempData((p) => ({
                      ...p,
                      [original.id]: { ...p[original.id], comments: val },
                    }))
                  }
                />
              )
            }
            return (
              <span
                className="text-foreground/80 block truncate text-sm"
                title={original.comments || ''}
              >
                {original.comments || '-'}
              </span>
            )
          },
        }
      }
      return col
    })

    const actionsCol: ColumnDef<SuggestionRow> = {
      id: 'actions',
      header: '',
      size: 50,
      minSize: 50,
      maxSize: 50,
      cell: ({ row }) => {
        const original = row.original

        const renderContainer = (content: React.ReactNode) => (
          <div className="flex justify-end gap-1">{content}</div>
        )

        if (original.isSuggestion) {
          return renderContainer(
            <>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary h-7 w-7"
                onClick={() => handleConfirmDuplication(original)}
              >
                <Save size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive h-7 w-7"
                onClick={() => {
                  setDuplicatingRowId(null)
                  setTempData((p) => {
                    const n = { ...p }
                    delete n[original.id]
                    return n
                  })
                }}
              >
                <X size={14} />
              </Button>
            </>,
          )
        }

        if ((original.subRows?.length ?? 0) > 1 && !row.getParentRow())
          return renderContainer(null)

        return renderContainer(
          editingRows[original.id] ? (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="text-primary h-7 w-7"
                onClick={() => handleSaveRow(original.id)}
              >
                <Save size={14} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-destructive h-7 w-7"
                onClick={() =>
                  setEditingRows((p) => ({ ...p, [original.id]: false }))
                }
              >
                <X size={14} />
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-60 hover:opacity-100"
                >
                  <MoreHorizontal size={14} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() =>
                    setEditingRows((p) => ({ ...p, [original.id]: true }))
                  }
                >
                  <EditIcon size={14} /> Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => {
                    const dayKey = format(
                      parseISO(original.startDate ?? ''),
                      'yyyy-MM-dd',
                    )
                    const combinedKey = `${dayKey}-${original.task?.id ?? 'sem-issue'}`
                    setDuplicatingRowId(original.id)
                    setExpandedRows((prev) => ({
                      ...(typeof prev === 'object' ? prev : {}),
                      [combinedKey]: true,
                    }))
                  }}
                >
                  <CopyIcon size={14} /> Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive gap-2"
                  onClick={() => handleDeleteEntry(original.id)}
                >
                  <Trash2 size={14} /> Deletar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        )
      },
    }
    return order
      .map((id) =>
        id === 'actions' ? actionsCol : mapped.find((c) => c.id === id),
      )
      .filter(Boolean) as ColumnDef<SuggestionRow>[]
  }, [
    activities,
    editingRows,
    db,
    getRowData,
    handleSaveRow,
    duplicatingRowId,
    tempData,
    queryClient,
    user,
    setTempData,
    setRowBeingEdited,
    setTaskLookupOpen,
  ])

  return (
    <>
      <TaskLookup
        open={taskLookupOpen}
        onOpenChange={(open) => {
          setTaskLookupOpen(open)
          if (!open) setRowBeingEdited(null)
        }}
        currentUserId={user?.id.toString()}
        onSelect={(task) => {
          if (rowBeingEdited) {
            setTempData((p) => ({
              ...p,
              [rowBeingEdited]: {
                ...p[rowBeingEdited],
                task: { id: task.id },
              },
            }))
            setRowBeingEdited(null)
          } else {
            setSelectedTask(task)
          }

          setTaskLookupOpen(false)
        }}
      />

      <h1 className="text-2xl font-semibold tracking-tight">Apontamento</h1>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Apontamento</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <hr className="mt-2" />

      <Card className="bg-card/50 sticky top-0 z-10 rounded-none border-x-0 border-t-0 border-b shadow-sm backdrop-blur-sm">
        <CardContent className="flex h-14 items-center gap-0 p-0">
          <div className="group focus-within:bg-background flex h-full flex-1 items-center border-r px-4 transition-colors">
            <div className="relative flex w-full items-center gap-2">
              <div className="w-[180px]">
                <LookupInput
                  value={selectedTask?.id ?? ''}
                  onChange={(id) => {
                    if (!id) {
                      setSelectedTask(null)
                      return
                    }

                    setSelectedTask((prev) =>
                      prev ? { ...prev, id } : ({ id } as SyncTaskRxDBDTO),
                    )
                  }}
                  onOpenLookup={() => {
                    setRowBeingEdited(null) // importante
                    setTaskLookupOpen(true)
                  }}
                  placeholder="Tarefa"
                />
              </div>
              <div className="bg-border mx-1 h-4 w-px" />
              <Input
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="O que você está fazendo?"
                className="h-10 flex-1 border-none bg-transparent px-0 text-[15px] ring-0 focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="flex h-full items-center gap-1 px-2">
            <Select
              value={selectedActivity}
              onValueChange={setSelectedActivity}
            >
              <SelectTrigger className="hover:bg-muted/50 text-primary h-full w-auto min-w-[120px] gap-2 border-none px-3 font-medium focus:ring-0">
                <SelectValue placeholder="Atividade" />
              </SelectTrigger>
              <SelectContent>
                {activities.map((act) => (
                  <SelectItem key={act.id} value={act.id}>
                    <div className="flex items-center gap-2 text-sm">
                      {iconMap[act.icon] &&
                        React.createElement(iconMap[act.icon], { size: 14 })}
                      {act.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="bg-border mx-1 h-6 w-px" />
            <div className="flex h-full items-center gap-3 pr-4">
              <div className="flex items-center gap-3">
                <div className="w-[100px] text-right font-mono text-xl font-medium">
                  {activeTimeEntry ? timerDisplay : '00:00:00'}
                </div>
                {!activeTimeEntry && (
                  <ToggleGroup
                    type="single"
                    value={timeEntryType}
                    onValueChange={(v: any) => v && setTimeEntryType(v)}
                    className="scale-90 rounded-md border p-0.5"
                  >
                    <ToggleGroupItem
                      value="increasing"
                      className={cn(
                        'h-6 w-6 p-0',
                        timeEntryType === 'increasing'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground',
                      )}
                    >
                      <ClockArrowUpIcon className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="decreasing"
                      className={cn(
                        'h-6 w-6 p-0',
                        timeEntryType === 'decreasing'
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground',
                      )}
                    >
                      <ClockArrowDownIcon className="h-3.5 w-3.5" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                )}
              </div>
              <Button
                onClick={handleTimerAction}
                className={cn(
                  'h-8 px-4 text-sm font-medium text-white',
                  activeTimeEntry?.timeStatus === 'running'
                    ? 'bg-destructive'
                    : 'bg-primary',
                )}
              >
                {activeTimeEntry?.timeStatus === 'running' ? (
                  <>
                    <Pause className="mr-2 h-4 w-4 fill-current" /> Parar
                  </>
                ) : (
                  <>{timeEntryType === 'manual' ? 'Adicionar' : 'Iniciar'}</>
                )}
              </Button>
              <div className="ml-1 border-l pl-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8 rounded-full',
                    timeEntryType === 'manual'
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground',
                  )}
                  onClick={() =>
                    setTimeEntryType(
                      timeEntryType === 'manual' ? 'increasing' : 'manual',
                    )
                  }
                >
                  {timeEntryType === 'manual' ? (
                    <HourglassIcon className="h-4 w-4" />
                  ) : (
                    <ListPlus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="container py-8">
        <DatePickerWithRange date={range} setDate={handleRangeChange} />
        <div className="mt-8 space-y-10">
          {isLoading ? (
            <>
              <TableSkeleton />
              <TableSkeleton />
            </>
          ) : (
            daysInRange.map((day) => {
              const rawEntries = (timeEntriesResponse?.data ?? []).filter(
                (e: SyncTimeEntryRxDBDTO) =>
                  e.startDate && isSameDay(parseISO(e.startDate), day),
              )
              const totalDecimal = rawEntries.reduce(
                (acc, curr) => acc + curr.timeSpent,
                0,
              )
              const entriesWithSuggestion: SuggestionRow[] = []
              rawEntries.forEach((e) => {
                entriesWithSuggestion.push({ ...e, subRows: [] })
                if (duplicatingRowId === e.id) {
                  entriesWithSuggestion.push({
                    ...e,
                    id: `suggestion-${e.id}`,
                    isSuggestion: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    subRows: [],
                  })
                }
              })

              const dayId = format(day, 'yyyy-MM-dd')
              if (duplicatingRowId === `new-${dayId}`) {
                entriesWithSuggestion.push({
                  id: `suggestion-new-${dayId}`,
                  isSuggestion: true,
                  task: { id: '' },
                  activity: { id: activities[0]?.id || '' },
                  startDate: startOfDay(day).toISOString(),
                  endDate: endOfDay(day).toISOString(),
                  timeSpent: 0,
                  comments: '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  subRows: [],
                } as any)
              }

              const grouped = groupByIssue(entriesWithSuggestion)
              return (
                <div key={day.toISOString()} className="space-y-3">
                  <div
                    className={cn(
                      'flex items-center justify-between',
                      grouped.length === 0 && 'border-b pb-2',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold capitalize">
                        {format(day, 'EEEE', { locale: ptBR })}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {format(day, 'dd MMM', { locale: ptBR })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDuplicatingRowId(`new-${dayId}`)}
                      className="text-muted-foreground m-0 h-[28px] px-[2px] text-xs"
                    >
                      <PlusIcon className="mr-1 h-3 w-3" />
                      Adicionar
                    </Button>
                  </div>
                  {grouped.length > 0 ? (
                    <>
                      <DataTable
                        columns={tableColumns}
                        data={grouped}
                        expanded={expandedRows}
                        onExpandedChange={setExpandedRows}
                        getRowClassName={(row) =>
                          row.isSuggestion
                            ? 'bg-primary/5 border-dashed opacity-80 animate-pulse'
                            : ''
                        }
                      />
                      <div className="flex justify-end pr-4">
                        <div className="flex items-center gap-2 py-2">
                          <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                            Total do Dia
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-muted/50 border-border font-mono text-sm font-bold"
                          >
                            {formatSecondsToHMDisplay(
                              Math.round(totalDecimal * 3600),
                            )}
                          </Badge>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground py-4 text-center text-xs">
                      Nenhum registro.
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
