import { useQuery } from '@tanstack/react-query'
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isValid,
  parseISO,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { enUS, ptBR } from 'date-fns/locale'
import {
  AlarmClockOff,
  BarChartHorizontal,
  Briefcase,
  Calendar,
  CalendarClock,
  CheckSquare,
  Clock,
  Clock4,
  Flame,
  Grid,
  MessageSquareWarning,
  Timer,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { DateRange } from 'react-day-picker'
import { useNavigate } from 'react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PieChart as RechartsPieChart,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import { RxDatabase } from 'rxdb'

import { DatePickerWithRange } from '@/components'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { SyncTimeEntryRxDBDTO } from '@/db/schemas/time-entries-sync-schema'
import { useWorkspace } from '@/hooks'
import { useSyncStore } from '@/stores/syncStore'

// #region Helper Functions and Constants
// (Toda a sua lógica de helpers, constantes, formatadores, etc., permanece inalterada)
const chartSettings = {
  hoursGoal: 8.5,
  acceptablePercentage: 0.85,
  minHours: 7.2, // Meta mínima de 7.2h, como visto no JSX
}

const WEEK_DAYS_CONFIG = [
  { id: 'Seg', label: 'Seg' },
  { id: 'Ter', label: 'Ter' },
  { id: 'Qua', label: 'Qua' },
  { id: 'Qui', label: 'Qui' },
  { id: 'Sex', label: 'Sex' },
  { id: 'Sáb', label: 'Sáb' },
  { id: 'Dom', label: 'Dom' },
]

const formatHours = (hours: number): string => {
  if (isNaN(hours) || hours < 0.01) return '00:00'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Formata 7.5 para "07h 30m"
const formatHoursMinutes = (hours: number): string => {
  if (isNaN(hours) || hours < 0.01) return '00h 00m'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`
}

const parseUTCDate = (dateString: string | undefined): Date => {
  if (!dateString) return new Date(NaN)
  const date = new Date(dateString)
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  )
}

const getEntriesForRange = async (
  db: RxDatabase,
  from: Date,
  to: Date,
): Promise<SyncTimeEntryRxDBDTO[]> => {
  if (!db?.timeEntries) return []
  return db.timeEntries
    .find({
      selector: {
        startDate: {
          $gte: from.toISOString(),
          $lte: to.toISOString(),
        },
      },
    })
    .exec()
}
// #endregion

// #region Skeletons
// (Skeletons agora com h-full para manter a altura)
function SummaryCardSkeleton() {
  return (
    <Card className="h-full p-5">
      <CardContent className="flex items-center justify-between p-0">
        <div className="flex flex-col justify-between gap-2">
          <Skeleton className="h-5 w-24" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-16 w-16 rounded-full" />
      </CardContent>
    </Card>
  )
}

function PeriodCardSkeleton() {
  return (
    <Card className="h-full p-5">
      <CardContent className="flex w-full items-center justify-between p-0">
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <div className="mt-3 space-y-2">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ChartCardSkeleton({
  className = 'h-[400px]',
}: {
  className?: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className={`w-full ${className}`} />
      </CardContent>
    </Card>
  )
}

function PieChartSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="flex justify-center">
        <Skeleton className="h-[300px] w-[300px] rounded-full" />
      </CardContent>
    </Card>
  )
}

function QualityCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent className="grid gap-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-1/4" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-24 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

function HeatmapSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-[60px]" />
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-10 flex-1" />
            ))}
          </div>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex gap-2">
              <Skeleton className="h-8 w-[60px]" />
              {Array.from({ length: 12 }).map((_, j) => (
                <Skeleton key={j} className="h-8 w-10 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
// #endregion

// #region Data Fetching (Dividido por Query)
// (Todas as suas funções de data fetching permanecem inalteradas)
// Query 1: Status Atual (Hoje, Semana, Mês)
async function fetchSummaryData(db: any) {
  if (!db?.timeEntries) return { today: 0, week: 0, month: 0 }

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const monthStart = startOfMonth(today)
  const todayStr = format(today, 'yyyy-MM-dd')

  // Otimizado: Busca apenas o mês atual, que é o escopo máximo necessário
  const entries = await db.timeEntries
    .find({ selector: { startDate: { $gte: monthStart.toISOString() } } })
    .exec()

  return entries.reduce(
    (acc: { today: number; week: number; month: number }, entry: any) => {
      if (!entry.startDate) return acc
      const entryDate = parseUTCDate(entry.startDate)
      const hours = Number(entry.timeSpent ?? 0)

      if (format(entryDate, 'yyyy-MM-dd') === todayStr) acc.today += hours
      // Semana: só entradas dentro da semana (evita somar tudo como “esta semana”)
      if (entryDate >= weekStart && entryDate <= weekEnd) acc.week += hours
      acc.month += hours // Todos já são do mês
      return acc
    },
    { today: 0, week: 0, month: 0 },
  )
}

// Query 2: Cards de Análise de Período
async function fetchPeriodSummaryData(db: any, dateRange: DateRange) {
  if (!db?.timeEntries || !dateRange.from)
    return { totalHours: 0, overtimeHours: 0, workedDays: 0, totalEntries: 0 }

  const from = dateRange.from
  const to = endOfDay(dateRange.to ?? dateRange.from)
  const entries = await getEntriesForRange(db, from, to)

  const dailyHours: Record<string, number> = {}
  let totalOvertime = 0

  for (const entry of entries) {
    if (!entry.startDate) continue
    const startDate = parseUTCDate(entry.startDate)
    const totalHours = Number(entry.timeSpent ?? 0)
    if (isNaN(startDate.getTime()) || totalHours <= 0) continue

    const dateKey = format(startDate, 'yyyy-MM-dd')
    dailyHours[dateKey] = (dailyHours[dateKey] || 0) + totalHours
  }

  const allDaysInRange = eachDayOfInterval({ start: from, end: to })
  const workedDays = new Set<string>()
  let totalHours = 0

  allDaysInRange.forEach((day) => {
    const dateKey = format(day, 'yyyy-MM-dd')
    const hours = dailyHours[dateKey] || 0
    totalHours += hours

    if (hours > 0) {
      workedDays.add(dateKey)
    }

    if (hours > chartSettings.hoursGoal) {
      totalOvertime += hours - chartSettings.hoursGoal
    }
  })

  const weekdaysInRange = allDaysInRange.filter(
    (d) => d.getDay() > 0 && d.getDay() < 6,
  ).length

  return {
    totalHours,
    overtimeHours: totalOvertime,
    workedDays: workedDays.size,
    possibleWorkDays: weekdaysInRange,
    totalEntries: entries.length,
  }
}

// Query 3: Timeline e Gráfico de Horas Extras
async function fetchTimelineData(db: any, dateRange: DateRange) {
  if (!db?.timeEntries || !dateRange.from)
    return {
      timelineData: [],
      overtimeData: { daysWithOvertime: 0, chartData: [] },
    }

  const from = dateRange.from
  const to = endOfDay(dateRange.to ?? dateRange.from)
  const entries = await getEntriesForRange(db, from, to)
  const dailyHours: Record<string, number> = {}

  for (const entry of entries) {
    if (!entry.startDate) continue
    const startDate = parseUTCDate(entry.startDate)
    const totalHours = Number(entry.timeSpent ?? 0)
    if (isNaN(startDate.getTime()) || totalHours <= 0) continue

    const dateKey = format(startDate, 'yyyy-MM-dd')
    dailyHours[dateKey] = (dailyHours[dateKey] || 0) + totalHours
  }

  const timelineData = eachDayOfInterval({ start: from, end: to }).map(
    (day) => ({
      date: format(day, 'yyyy-MM-dd'),
      day: format(day, 'EEE', { locale: ptBR }),
      dailyHours: dailyHours[format(day, 'yyyy-MM-dd')] || 0,
    }),
  )

  const overtime = timelineData.reduce(
    (acc, data) => {
      const overtimeHours =
        data.dailyHours > chartSettings.hoursGoal
          ? data.dailyHours - chartSettings.hoursGoal
          : 0
      if (overtimeHours > 0) {
        acc.daysWithOvertime++
      }
      acc.chartData.push({ ...data, overtimeHours })
      return acc
    },
    { daysWithOvertime: 0, chartData: [] as any[] },
  )

  return { timelineData, overtimeData: overtime }
}

// Query 4: Média de Horas por Dia
async function fetchAvgHoursData(db: any, dateRange: DateRange) {
  if (!db?.timeEntries || !dateRange.from) return []

  const from = dateRange.from
  const to = endOfDay(dateRange.to ?? dateRange.from)
  const entries = await getEntriesForRange(db, from, to)

  const dailyHours: Record<string, number> = {}
  const hoursByDayOfWeek: Record<number, number[]> = {
    0: [],
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  }

  for (const entry of entries) {
    if (!entry.startDate) continue
    const startDate = parseUTCDate(entry.startDate)
    const totalHours = Number(entry.timeSpent ?? 0)
    if (isNaN(startDate.getTime()) || totalHours <= 0) continue
    const dateKey = format(startDate, 'yyyy-MM-dd')
    dailyHours[dateKey] = (dailyHours[dateKey] || 0) + totalHours
  }

  eachDayOfInterval({ start: from, end: to }).forEach((day) => {
    const dayOfWeek = day.getDay()
    const dateKey = format(day, 'yyyy-MM-dd')
    hoursByDayOfWeek[dayOfWeek].push(dailyHours[dateKey] || 0)
  })

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const avgData = weekDays.map((day, index) => {
    const hoursArray = hoursByDayOfWeek[index]
    const totalHours = hoursArray.reduce((sum, h) => sum + h, 0)
    return {
      day,
      averageHours: hoursArray.length > 0 ? totalHours / hoursArray.length : 0,
    }
  })

  return [...avgData.slice(1), avgData[0]] // Reordena para começar com Seg
}

// Query 5: Heatmap
async function fetchHeatmapData(db: any, dateRange: DateRange) {
  if (!db?.timeEntries || !dateRange.from) return {}

  const from = dateRange.from
  const to = endOfDay(dateRange.to ?? dateRange.from)
  const entries = await getEntriesForRange(db, from, to)
  const heatmapData: Record<string, Record<string, number>> = {}

  for (const entry of entries) {
    if (!entry.startDate || !entry.endDate) continue
    const startDate = parseUTCDate(entry.startDate)
    const totalHours = Number(entry.timeSpent ?? 0)
    if (isNaN(startDate.getTime()) || totalHours <= 0) continue

    const dayOfWeekKey = format(startDate, 'EEEE', {
      locale: enUS,
    }).toLowerCase()
    if (!heatmapData[dayOfWeekKey]) heatmapData[dayOfWeekKey] = {}

    let remainingMinutes = totalHours * 60
    let cursorDate = new Date(startDate)
    while (remainingMinutes > 0.1) {
      const cursorHour = cursorDate.getHours()
      const hourKey = String(cursorHour).padStart(2, '0')
      const nextHourDate = new Date(cursorDate)
      nextHourDate.setHours(cursorHour + 1, 0, 0, 0)
      const minutesToEndOfHour =
        (nextHourDate.getTime() - cursorDate.getTime()) / (1000 * 60)
      const minutesInSlot = Math.min(remainingMinutes, minutesToEndOfHour)
      if (minutesInSlot > 0) {
        heatmapData[dayOfWeekKey][hourKey] =
          (heatmapData[dayOfWeekKey][hourKey] || 0) + minutesInSlot / 60
      }
      remainingMinutes -= minutesInSlot
      cursorDate = nextHourDate
    }
  }
  return heatmapData
}

// Query 6: Atividades (Pie)
async function fetchActivityData(db: any, dateRange: DateRange) {
  if (!db?.timeEntries || !dateRange.from) return []

  const from = dateRange.from
  const to = endOfDay(dateRange.to ?? dateRange.from)
  const entries = await getEntriesForRange(db, from, to)
  const activityHours: Record<string, number> = {}

  for (const entry of entries) {
    if (!entry.startDate) continue
    const totalHours = Number(entry.timeSpent ?? 0)
    if (totalHours <= 0) continue

    const activityName = entry.activity?.name || 'Não categorizado'
    activityHours[activityName] =
      (activityHours[activityName] || 0) + totalHours
  }

  const activityColors = [
    'var(--chart-1)',
    'var(--chart-2)',
    'var(--chart-3)',
    'var(--chart-4)',
    'var(--chart-5)',
  ]
  return Object.entries(activityHours)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, hours], i) => ({
      activity: name,
      hours,
      fill: activityColors[i % activityColors.length],
    }))
}

// Query 7: Qualidade e Hábitos
async function fetchQualityData(db: any, dateRange: DateRange) {
  if (!db?.timeEntries || !dateRange.from)
    return {
      punctualityData: [],
      quality: { forgottenDays: 0, noCommentPercent: 0 },
    }

  const from = dateRange.from
  const to = endOfDay(dateRange.to ?? dateRange.from)
  const entries = await getEntriesForRange(db, from, to)

  let noCommentCount = 0,
    punctualCount = 0,
    delayedCount = 0
  const dailyHours: Record<string, number> = {}

  for (const entry of entries) {
    if (!entry.startDate) continue
    const startDate = parseUTCDate(entry.startDate)
    const totalHours = Number(entry.timeSpent ?? 0)
    const dateKey = format(startDate, 'yyyy-MM-dd')

    if (totalHours > 0) {
      dailyHours[dateKey] = (dailyHours[dateKey] || 0) + totalHours
    }

    if (!entry.comments?.trim()) noCommentCount++
    const createdAtDate = parseUTCDate(entry.createdAt)
    if (!isNaN(createdAtDate.getTime())) {
      format(createdAtDate, 'yyyy-MM-dd') === dateKey
        ? punctualCount++
        : delayedCount++
    }
  }

  const totalPunctuality = punctualCount + delayedCount
  const punctualityData =
    totalPunctuality > 0
      ? [
          { name: 'Pontuais', value: punctualCount, fill: 'var(--chart-2)' },
          { name: 'Atrasados', value: delayedCount, fill: 'var(--chart-5)' },
        ]
      : []

  const weekdaysInRange = eachDayOfInterval({ start: from, end: to }).filter(
    (d) => d.getDay() > 0 && d.getDay() < 6,
  )
  const workedWeekdaysCount = weekdaysInRange.filter(
    (d) => (dailyHours[format(d, 'yyyy-MM-dd')] || 0) > 0,
  ).length
  const quality = {
    forgottenDays: weekdaysInRange.length - workedWeekdaysCount,
    noCommentPercent:
      entries.length > 0 ? (noCommentCount / entries.length) * 100 : 0,
  }

  return { punctualityData, quality }
}

// #endregion

export function Metrics() {
  const db = useSyncStore((state) => state?.db)
  const navigate = useNavigate()
  const { workspace } = useWorkspace()
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date()
    return { from: startOfMonth(today), to: endOfMonth(today) }
  })

  const [selectedDays, setSelectedDays] = useState<Record<string, boolean>>({
    Seg: true,
    Ter: true,
    Qua: true,
    Qui: true,
    Sex: true,
    Sáb: false,
    Dom: false,
  })

  const dateRange = useMemo(
    () => ({
      from: date?.from ?? startOfToday(),
      to: endOfDay(date?.to ?? date?.from ?? startOfToday()),
    }),
    [date],
  )
  const queryKeyBase = [workspace?.id, dateRange.from, dateRange.to]
  const queryOptions = {
    enabled: !!db && !!workspace?.id && !!date?.from,
  }

  // #region Queries (Divididas)
  // (Suas queries permanecem inalteradas)
  const summaryQuery = useQuery({
    queryKey: ['metricsSummary', workspace?.id],
    queryFn: () => fetchSummaryData(db),
    enabled: !!db && !!workspace?.id,
  })

  const periodSummaryQuery = useQuery({
    queryKey: ['metricsPeriodSummary', ...queryKeyBase],
    queryFn: () => fetchPeriodSummaryData(db, dateRange),
    ...queryOptions,
  })

  const timelineQuery = useQuery({
    queryKey: ['metricsTimeline', ...queryKeyBase],
    queryFn: () => fetchTimelineData(db, dateRange),
    ...queryOptions,
  })

  const avgHoursQuery = useQuery({
    queryKey: ['metricsAvgHours', ...queryKeyBase],
    queryFn: () => fetchAvgHoursData(db, dateRange),
    ...queryOptions,
  })

  const heatmapQuery = useQuery({
    queryKey: ['metricsHeatmap', ...queryKeyBase],
    queryFn: () => fetchHeatmapData(db, dateRange),
    ...queryOptions,
  })

  const activityQuery = useQuery({
    queryKey: ['metricsActivity', ...queryKeyBase],
    queryFn: () => fetchActivityData(db, dateRange),
    ...queryOptions,
  })

  const qualityQuery = useQuery({
    queryKey: ['metricsQuality', ...queryKeyBase],
    queryFn: () => fetchQualityData(db, dateRange),
    ...queryOptions,
  })
  // #endregion

  // #region Memos and Derived State
  // (Todos os seus memos e estados derivados permanecem inalterados)
  const acceptableHours =
    chartSettings.hoursGoal * chartSettings.acceptablePercentage

  const { yAxisMax, yAxisTicks } = useMemo(() => {
    const maxHours = Math.max(
      ...(timelineQuery.data?.timelineData.map((d) => d.dailyHours) || [0]),
      0,
    )
    const newYAxisMax = Math.max(chartSettings.hoursGoal, maxHours)
    const ticks = new Set<number>()
    for (let i = 0; i <= Math.ceil(newYAxisMax); i += 2) ticks.add(i)
    ticks.add(chartSettings.hoursGoal)
    ticks.add(acceptableHours)
    return {
      yAxisMax: newYAxisMax,
      yAxisTicks: Array.from(ticks).sort((a, b) => a - b),
    }
  }, [timelineQuery.data?.timelineData, acceptableHours])

  const activityChartConfig = useMemo(
    () =>
      (activityQuery.data || []).reduce((acc, { activity, fill }) => {
        acc[activity] = { label: activity, color: fill }
        return acc
      }, {} as ChartConfig),
    [activityQuery.data],
  )

  const avgHoursAnalysis = useMemo(() => {
    const visibleDaysData = (avgHoursQuery.data || []).filter(
      (data) => selectedDays[data.day],
    )
    if (visibleDaysData.length === 0)
      return { chartData: [], overallAverage: 0 }
    const totalAverageHours = visibleDaysData.reduce(
      (sum, day) => sum + day.averageHours,
      0,
    )
    return {
      chartData: visibleDaysData,
      overallAverage: totalAverageHours / visibleDaysData.length,
    }
  }, [avgHoursQuery.data, selectedDays])

  const maxHeatmapHours = useMemo(() => {
    if (!heatmapQuery.data) return 1
    const allHourValues = Object.values(heatmapQuery.data).flatMap((day) =>
      Object.values(day),
    )
    return allHourValues.length > 0 ? Math.max(...allHourValues) : 1
  }, [heatmapQuery.data])

  const summaryCards = useMemo(() => {
    const data = summaryQuery.data ?? { today: 0, week: 0, month: 0 }
    const metas = {
      today: { meta: chartSettings.hoursGoal, min: chartSettings.minHours },
      week: {
        meta: chartSettings.hoursGoal * 5,
        min: chartSettings.minHours * 5,
      }, // 5 dias
      month: {
        meta: chartSettings.hoursGoal * 21,
        min: chartSettings.minHours * 21,
      }, // ~21 dias úteis
    }

    return [
      {
        label: 'Hoje',
        horas: data.today,
        meta: metas.today.meta,
        min: metas.today.min,
        porcentagem:
          metas.today.meta > 0 ? (data.today / metas.today.meta) * 100 : 0,
        Icon: Clock,
        cor: 'var(--chart-1)',
      },
      {
        label: 'Semana',
        horas: data.week,
        meta: metas.week.meta,
        min: metas.week.min,
        porcentagem:
          metas.week.meta > 0 ? (data.week / metas.week.meta) * 100 : 0,
        Icon: Calendar,
        cor: 'var(--chart-2)',
      },
      {
        label: 'Mês',
        horas: data.month,
        meta: metas.month.meta,
        min: metas.month.min,
        porcentagem:
          metas.month.meta > 0 ? (data.month / metas.month.meta) * 100 : 0,
        Icon: TrendingUp,
        cor: 'var(--chart-3)',
      },
    ]
  }, [summaryQuery.data])

  const periodCards = useMemo(() => {
    const data = periodSummaryQuery.data ?? {
      totalHours: 0,
      overtimeHours: 0,
      workedDays: 0,
      possibleWorkDays: 0,
      totalEntries: 0,
    }
    return [
      {
        title: 'Total de Horas',
        value: formatHours(data.totalHours),
        delta: `${formatHoursMinutes(data.totalHours)} no período`,
        Icon: Timer,
      },
      {
        title: 'Horas Extras',
        value: `+${formatHours(data.overtimeHours)}`,
        delta: 'acima da meta',
        Icon: Flame,
      },
      {
        title: 'Dias Trabalhados',
        value: `${data.workedDays} dias`,
        delta: `de ${data.possibleWorkDays} dias úteis`,
        Icon: Briefcase,
      },
      {
        title: 'Apontamentos',
        value: data.totalEntries,
        delta: `Total de registros no período`,
        Icon: CheckSquare,
      },
    ]
  }, [periodSummaryQuery.data])
  // #endregion

  // #region Handlers and Render Functions
  // (Seus handlers e funções de render permanecem inalterados)
  const handleDayToggle = (dayLabel: string) => {
    setSelectedDays((prev) => ({ ...prev, [dayLabel]: !prev[dayLabel] }))
  }

  const getHeatmapStyle = (hours: number | undefined): React.CSSProperties => {
    if (!hours || hours <= 0.01) return { backgroundColor: 'transparent' }
    const ratio = Math.min(hours / maxHeatmapHours, 1)
    return {
      backgroundColor: 'var(--chart-2)',
      opacity: Math.min(0.15 + Math.sqrt(ratio) * 0.85, 1),
    }
  }

  const heatmapDayMapping = [
    { key: 'monday', display: 'Seg' },
    { key: 'tuesday', display: 'Ter' },
    { key: 'wednesday', display: 'Qua' },
    { key: 'thursday', display: 'Qui' },
    { key: 'friday', display: 'Sex' },
    { key: 'saturday', display: 'Sáb' },
    { key: 'sunday', display: 'Dom' },
  ]
  // #endregion

  // Chart configs (static or simple)
  // (Suas configs de gráfico permanecem inalteradas)
  const punctualityChartConfig = {
    Pontuais: { label: 'Pontuais', color: 'var(--chart-2)' },
    Atrasados: { label: 'Atrasados', color: 'var(--chart-5)' },
  } satisfies ChartConfig

  const avgHoursChartConfig: ChartConfig = {
    averageHours: { label: 'Média de Horas ', color: 'var(--primary)' },
  }
  const overtimeChartConfig: ChartConfig = {
    overtimeHours: { label: 'Horas Extras', color: 'var(--chart-5)' },
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Métricas</h1>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Métricas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <hr className="mt-2" />

      {/* // ===============================================
        // ==         INÍCIO DA REFATORAÇÃO DO LAYOUT     ==
        // ===============================================
      */}

      <div className="mt-6 flex flex-col gap-6">
        {/* --- 1. SEÇÃO "STATUS ATUAL" (INTOCÁVEL) --- */}
        <div className=" ">
          <h2 className="font-sans text-lg font-bold tracking-tight">
            Status Atual
          </h2>
          <p className="text-muted-foreground text-sm">
            Resumo do seu desempenho recente.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {summaryQuery.isLoading
              ? [1, 2, 3].map((i) => <SummaryCardSkeleton key={i} />)
              : summaryCards.map((item, i) => {
                  const abaixoDaMeta = item.horas < item.min // Variavel preservada
                  return (
                    <Card
                      key={i}
                      className="h-full p-5 transition-all hover:shadow-md" // h-full ADICIONADO
                    >
                      <CardContent className="flex items-center justify-between p-0">
                        <div className="flex flex-col justify-between">
                          <h3 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
                            <item.Icon className="text-muted-foreground h-4 w-4" />
                            Horas ({item.label})
                          </h3>
                          <div className="mt-3">
                            <span
                              className={`text-foreground text-2xl font-bold`}
                            >
                              {formatHoursMinutes(item.horas)}
                            </span>
                            <p className="text-muted-foreground text-xs">
                              Meta: {item.meta.toFixed(1)}h (mín.{' '}
                              {item.min.toFixed(1)}
                              h)
                            </p>
                          </div>
                        </div>

                        <div className="relative flex h-16 w-16 items-center justify-center">
                          <PieChart width={64} height={64}>
                            <Pie
                              data={[
                                { name: 'Progresso', value: item.porcentagem },
                                {
                                  name: 'Restante',
                                  value: 100 - item.porcentagem,
                                },
                              ]}
                              dataKey="value"
                              innerRadius={22}
                              outerRadius={28}
                              startAngle={90}
                              endAngle={-270}
                              stroke="none"
                            >
                              <Cell fill={item.cor} />
                              <Cell fill="var(--muted)" />
                            </Pie>
                          </PieChart>

                          <span
                            className="absolute text-xs font-semibold"
                            style={{ color: item.cor }}
                          >
                            {item.porcentagem.toFixed(0)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
          </div>
        </div>

        {/* --- 2. SEÇÃO "BENTO GRID" (NOVO LAYOUT) --- */}
        {/* Este grid de 6 colunas contém todo o resto */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
          {/* --- LINHA 1: CABEÇALHO E SELETOR DE DATA --- */}
          <div className="lg:col-span-6">
            <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-bold tracking-tight">
                  Análise de Período
                </h2>
                <p className="text-muted-foreground text-sm">
                  Métricas que refletem seu esforço e constância.
                </p>
              </div>
              <DatePickerWithRange
                date={date}
                setDate={setDate}
                className="ml-auto"
              />
            </div>
          </div>

          {/* --- LINHA 2: CARDS DE PERÍODO (2 + 1 + 1 + 2) --- */}
          {periodSummaryQuery.isLoading
            ? [
                { span: 'lg:col-span-2' },
                { span: 'lg:col-span-1' },
                { span: 'lg:col-span-1' },
                { span: 'lg:col-span-2' },
              ].map((item, i) => (
                <div key={i} className={item.span}>
                  <PeriodCardSkeleton />
                </div>
              ))
            : periodCards.map((card, i) => (
                <div
                  key={i}
                  className={
                    // Total Horas e Apontamentos (0 e 3) pegam 2 colunas
                    i === 0 || i === 3 ? 'lg:col-span-2' : 'lg:col-span-1'
                  }
                >
                  <Card className="flex h-full items-center justify-between p-5 transition-all hover:shadow-md">
                    <CardContent className="flex w-full items-center justify-between p-0">
                      <div>
                        <h3 className="text-foreground/90 flex items-center gap-2 text-sm font-semibold tracking-tight">
                          <card.Icon className="text-muted-foreground h-4 w-4" />
                          {card.title}
                        </h3>
                        <div className="mt-3">
                          <span className="text-2xl leading-none font-bold">
                            {card.value}
                          </span>
                          <p className="text-muted-foreground mt-1 text-xs tracking-tight">
                            {card.delta}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}

          {/* --- LINHA 3: TIMELINE (4) + DISTRIBUIÇÃO (2) --- */}
          {/* (Invertido conforme pedido) */}
          <div className="lg:col-span-4">
            {timelineQuery.isLoading ? (
              <ChartCardSkeleton className="h-[250px]" />
            ) : (
              timelineQuery.data && (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Timeline de Horas</CardTitle>
                    <CardDescription>
                      Horas apontadas no período de
                      {date?.from ? ` ${format(date.from, 'dd/MM/yy')}` : ''} a
                      {date?.to ? ` ${format(date.to, 'dd/MM/yy')}` : ''}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <ChartContainer
                      config={{
                        dailyHours: { label: 'Horas', color: 'var(--primary)' },
                      }}
                      className="h-[250px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        {(() => {
                          const today = startOfToday()
                          const adjustedData =
                            timelineQuery.data.timelineData.map((item) => {
                              const itemDate = parseISO(item.date)
                              if (isAfter(itemDate, today))
                                return { ...item, dailyHours: null }
                              return item
                            })

                          return (
                            <LineChart
                              data={adjustedData}
                              style={{ cursor: 'pointer' }}
                              onClick={(data) => {
                                if (
                                  data?.activePayload &&
                                  data.activePayload.length > 0
                                ) {
                                  const clickedDate =
                                    data.activePayload[0].payload.date
                                  navigate(
                                    `/workspaces/${workspace?.id}/time-entries?from=${clickedDate}&to=${clickedDate}`,
                                  )
                                }
                              }}
                              margin={{
                                top: 5,
                                right: 20,
                                left: 0,
                                bottom: 20,
                              }}
                              className="cursor-pointer"
                            >
                              <CartesianGrid vertical={false} />
                              <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                height={50}
                                interval="preserveStartEnd"
                                tickFormatter={(value) => {
                                  const date = parseISO(value)
                                  return isValid(date)
                                    ? format(date, 'dd/MM')
                                    : value
                                }}
                              />
                              <YAxis
                                tickFormatter={(value) =>
                                  `${value.toFixed(1)}h`
                                }
                                width={40}
                                domain={[0, yAxisMax]}
                                ticks={yAxisTicks}
                              />
                              <ChartTooltip
                                cursor={false}
                                content={
                                  <ChartTooltipContent
                                    indicator="dot"
                                    formatter={(value) => {
                                      const hours = Number(value)
                                      return `${hours.toFixed(1)}h (${formatHours(hours)})`
                                    }}
                                    labelFormatter={(label) => {
                                      const date = parseISO(label)
                                      return isValid(date)
                                        ? format(date, 'EEEE, dd/MM', {
                                            locale: ptBR,
                                          })
                                        : label
                                    }}
                                  />
                                }
                              />
                              <ReferenceLine
                                y={chartSettings.hoursGoal}
                                label={{
                                  value: `Meta ${chartSettings.hoursGoal}h`,
                                  position: 'insideTopRight',
                                  fill: 'orange',
                                  fontSize: 12,
                                }}
                                stroke="orange"
                                strokeDasharray="3 3"
                              />
                              <ReferenceLine
                                y={acceptableHours}
                                label={{
                                  value: `Aceitável ${acceptableHours.toFixed(1)}h`,
                                  position: 'insideTopRight',
                                  fill: 'var(--muted-foreground)',
                                  fontSize: 12,
                                  dy: 20,
                                }}
                                stroke="var(--muted-foreground)"
                                strokeDasharray="4 4"
                              />
                              <Line
                                type="monotone"
                                dataKey="dailyHours"
                                stroke="var(--color-dailyHours)"
                                strokeWidth={2}
                                dot={{
                                  r: 4,
                                  strokeWidth: 2,
                                  fill: 'var(--primary)',
                                  stroke: 'var(--background)',
                                }}
                                connectNulls={false}
                              />
                            </LineChart>
                          )
                        })()}
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <div className="lg:col-span-2">
            {activityQuery.isLoading ? (
              <PieChartSkeleton />
            ) : (
              activityQuery.data && (
                <Card className="flex h-full flex-col">
                  <CardHeader className="items-center pb-0">
                    <CardTitle>Distribuição por Atividade</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-2 leading-none font-medium">
                        Top 5 atividades com mais horas no período
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex flex-1 items-center justify-center overflow-visible p-6">
                    <div className="flex h-[300px] w-full items-center justify-center overflow-visible">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart
                          margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
                        >
                          <ChartTooltip
                            cursor={false}
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null

                              const item = payload[0]?.payload as {
                                activity: string
                                hours: number
                                fill: string
                              }

                              const value = Number(payload[0]?.value ?? 0)
                              const total = activityQuery.data.reduce(
                                (sum, p) => sum + (p.hours ?? 0),
                                0,
                              )
                              const percent = total
                                ? ((value / total) * 100).toFixed(1)
                                : '0.0'

                              return (
                                <div className="bg-popover rounded-md p-2 text-sm shadow-md">
                                  <div className="flex items-center gap-2 font-medium">
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: item.fill }}
                                    />
                                    {item.activity}
                                  </div>
                                  <div className="text-muted-foreground">
                                    {value.toFixed(1)}h ({percent}%)
                                  </div>
                                </div>
                              )
                            }}
                          />

                          <Pie
                            data={activityQuery.data}
                            dataKey="hours"
                            nameKey="activity"
                            innerRadius="40%"
                            outerRadius="80%"
                            stroke="none"
                            labelLine={false}
                            label={({
                              cx,
                              cy,
                              midAngle,
                              outerRadius,
                              index,
                            }) => {
                              const entry = activityQuery.data[index]
                              const RADIAN = Math.PI / 180
                              const radius = outerRadius + 10
                              const x =
                                cx + radius * Math.cos(-midAngle * RADIAN)
                              const y =
                                cy + radius * Math.sin(-midAngle * RADIAN)

                              const value = entry.hours
                              const total = activityQuery.data.reduce(
                                (sum, p) => sum + (p.hours ?? 0),
                                0,
                              )
                              const percent = total
                                ? ((value / total) * 100).toFixed(1)
                                : '0.0'

                              return (
                                <text
                                  x={x}
                                  y={y}
                                  textAnchor={x > cx ? 'start' : 'end'}
                                  dominantBaseline="central"
                                  fontSize={12}
                                  fill="var(--foreground)"
                                >
                                  <tspan style={{ fill: entry.fill }}>● </tspan>
                                  {entry.activity} {value.toFixed(1)}h (
                                  {percent}%)
                                </text>
                              )
                            }}
                          >
                            {activityQuery.data.map((entry, index) => (
                              <Cell
                                key={index}
                                fill={entry.fill}
                                stroke={entry.fill}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <div className="lg:col-span-3">
            {avgHoursQuery.isLoading ? (
              <ChartCardSkeleton className="h-[430px]" />
            ) : (
              avgHoursQuery.data && (
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <BarChartHorizontal className="h-5 w-5" />
                      <CardTitle>Média de Horas por Dia da Semana</CardTitle>
                    </div>
                    <CardDescription>
                      Qual dia da semana você é mais produtivo?
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
                      {WEEK_DAYS_CONFIG.map(({ id, label }) => (
                        <div key={id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${id}`}
                            checked={selectedDays[label]}
                            onCheckedChange={() => handleDayToggle(label)}
                          />
                          <Label
                            htmlFor={`day-${id}`}
                            className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 text-center">
                      <p className="text-muted-foreground text-sm">
                        Média geral (dias selecionados)
                      </p>
                      <p className="text-2xl font-bold">
                        {formatHours(avgHoursAnalysis.overallAverage)}
                      </p>
                    </div>
                    <ChartContainer
                      config={avgHoursChartConfig}
                      className="h-[300px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={avgHoursAnalysis.chartData}
                          margin={{ left: -20 }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis tickFormatter={(value) => `${value}h`} />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <Bar
                            dataKey="averageHours"
                            fill="var(--color-averageHours)"
                            radius={4}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* Este é o bloco de Horas Extras (era Atividades) */}
          <div className="lg:col-span-3">
            {timelineQuery.isLoading ? (
              <ChartCardSkeleton className="h-[430px]" />
            ) : (
              timelineQuery.data && (
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlarmClockOff className="h-5 w-5" />
                      <CardTitle>Análise de Horas Extras</CardTitle>
                    </div>
                    <CardDescription>
                      Você teve
                      <span className="text-primary font-bold">
                        {' '}
                        {timelineQuery.data.overtimeData.daysWithOvertime}{' '}
                      </span>
                      dia(s) com horas extras no período.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={overtimeChartConfig}
                      className="h-[300px] w-full"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={timelineQuery.data.overtimeData.chartData}
                          margin={{ left: -20, right: 10 }}
                        >
                          <CartesianGrid vertical={false} />
                          <XAxis
                            dataKey="day"
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            tickFormatter={(value) => `${value.toFixed(1)}h`}
                          />
                          <ChartTooltip
                            cursor={false}
                            content={
                              <ChartTooltipContent
                                formatter={(value) =>
                                  formatHours(Number(value))
                                }
                              />
                            }
                          />
                          <Line
                            type="monotone"
                            dataKey="overtimeHours"
                            stroke="var(--primary)"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          {/* --- LINHA 5: HEATMAP (4) + QUALIDADE (2) --- */}
          <div className="lg:col-span-4">
            {heatmapQuery.isLoading ? (
              <HeatmapSkeleton />
            ) : (
              heatmapQuery.data && (
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Grid className="h-5 w-5" />
                      <CardTitle>Mapa de Calor de Produtividade</CardTitle>
                    </div>
                    <CardDescription>
                      Seus horários de pico de trabalho no período selecionado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Dia</TableHead>
                          {Array.from({ length: 24 }, (_, i) => i).map(
                            (hour) => (
                              <TableHead
                                key={hour}
                                className="p-1 text-center text-xs"
                              >{`${String(hour).padStart(2, '0')}h`}</TableHead>
                            ),
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {heatmapDayMapping.map(({ key, display }) => (
                          <TableRow key={key}>
                            <TableCell className="font-medium">
                              {display}
                            </TableCell>
                            {Array.from({ length: 24 }, (_, i) => {
                              const hourStr = String(i).padStart(2, '0')
                              const hoursValue =
                                heatmapQuery.data[key]?.[hourStr]
                              return (
                                <TableCell
                                  key={`${key}-${i}`}
                                  className="p-0 text-center"
                                >
                                  <div
                                    className="m-0.5 h-8 rounded-md"
                                    style={getHeatmapStyle(hoursValue)}
                                    title={
                                      hoursValue
                                        ? `${formatHours(
                                            hoursValue,
                                          )} em ${display} às ${hourStr}h`
                                        : 'Nenhuma atividade'
                                    }
                                  />
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            )}
          </div>

          <div className="lg:col-span-2">
            {qualityQuery.isLoading ? (
              <QualityCardSkeleton />
            ) : (
              qualityQuery.data && (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Qualidade e Hábitos de Apontamento</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CalendarClock className="h-5 w-5 text-amber-500" />
                        <span className="ml-3 font-medium">
                          Dias Úteis Esquecidos
                        </span>
                      </div>
                      <Badge
                        variant={
                          qualityQuery.data.quality.forgottenDays > 0
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {qualityQuery.data.quality.forgottenDays} dia(s)
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <MessageSquareWarning className="h-5 w-5 text-amber-500" />
                        <span className="ml-3 font-medium">
                          Apontamentos sem Comentários
                        </span>
                      </div>
                      <div className="w-32 text-right">
                        <span className="font-bold">
                          {qualityQuery.data.quality.noCommentPercent.toFixed(
                            0,
                          )}
                          %
                        </span>
                        <Progress
                          value={qualityQuery.data.quality.noCommentPercent}
                          className="mt-1 h-2"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock4 className="h-5 w-5 text-amber-500" />
                        <span className="ml-3 font-medium">
                          Pontualidade dos Apontamentos
                        </span>
                      </div>
                      <div className="w-40">
                        <ChartContainer
                          config={punctualityChartConfig}
                          className="h-[100px] w-full"
                        >
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart accessibilityLayer>
                              <ChartTooltip
                                cursor={false}
                                content={({ active, payload }) => {
                                  if (active && payload && payload.length) {
                                    const total =
                                      qualityQuery.data.punctualityData.reduce(
                                        (acc, curr) => acc + curr.value,
                                        0,
                                      )
                                    const data = payload[0]
                                    const percentage =
                                      total > 0
                                        ? (data.payload.value / total) * 100
                                        : 0
                                    return (
                                      <div className="bg-background min-w-[12rem] rounded-lg border p-2 text-sm shadow-sm">
                                        <div className="flex items-center gap-2 font-medium">
                                          <div
                                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                            style={{
                                              backgroundColor:
                                                data.payload.fill,
                                            }}
                                          />
                                          {data.name}
                                        </div>
                                        <div className="text-muted-foreground flex justify-between">
                                          <span>
                                            Contagem: {data.payload.value}
                                          </span>
                                          <span>{percentage.toFixed(0)}%</span>
                                        </div>
                                      </div>
                                    )
                                  }
                                  return null
                                }}
                              />
                              <Pie
                                data={qualityQuery.data.punctualityData}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={30}
                                outerRadius={40}
                                strokeWidth={2}
                              >
                                {qualityQuery.data.punctualityData.map(
                                  (entry) => (
                                    <Cell
                                      key={`cell-${entry.name}`}
                                      fill={entry.fill}
                                    />
                                  ),
                                )}
                              </Pie>
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}
