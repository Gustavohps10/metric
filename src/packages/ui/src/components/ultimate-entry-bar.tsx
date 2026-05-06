import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ClockArrowDown,
  ClockArrowUp,
  Code2Icon,
  Coffee,
  Database,
  FlaskConical,
  Gamepad2,
  History,
  LayoutTemplate,
  Minus,
  MonitorPlay,
  Moon,
  Pause,
  Pencil,
  PenTool,
  Play,
  Settings2Icon,
  Sparkles,
  Square,
  Trash2,
  Users,
} from 'lucide-react'
import React, { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

type SessionStatus = 'STOP' | 'CONTINUE' | 'PAUSE' | 'START'

interface SessionEntry {
  id: string
  time: string
  status: SessionStatus
  taskId: string
  description: string
}

const mockHistory: SessionEntry[] = [
  {
    id: '1',
    time: '14:30:00',
    status: 'STOP',
    taskId: 'CH-402',
    description: 'Completed API endpoint integration',
  },
  {
    id: '2',
    time: '13:15:22',
    status: 'CONTINUE',
    taskId: 'CH-402',
    description: 'Resumed after lunch break',
  },
  {
    id: '3',
    time: '12:30:00',
    status: 'PAUSE',
    taskId: 'CH-402',
    description: 'Lunch break',
  },
  {
    id: '4',
    time: '09:05:14',
    status: 'START',
    taskId: 'CH-402',
    description: 'Initial setup and boilerplate for new feature',
  },
]

const mockActivities = [
  { id: 'dev', name: 'Desenvolvimento', icon: Code2Icon },
  { id: 'teste', name: 'Teste', icon: FlaskConical },
  { id: 'design', name: 'Design', icon: PenTool },
  { id: 'meeting', name: 'Meeting', icon: Users },
  { id: 'break', name: 'Break', icon: Coffee },
]

export const UltimateTimeTracker = () => {
  const [description, setDescription] = useState(
    'Fixing the race condition in the auth flow',
  )
  const [selectedActivity, setSelectedActivity] = useState('dev')
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused'>(
    'idle',
  )
  const [timerDirection, setTimerDirection] = useState<'up' | 'down'>('up')
  const [widgetLayout, setWidgetLayout] = useState<'horizontal' | 'vertical'>(
    'horizontal',
  )

  const selectedAct = mockActivities.find((a) => a.id === selectedActivity)!
  const ActivityIcon = selectedAct.icon

  const renderStatus = (status: SessionStatus) => {
    switch (status) {
      case 'STOP':
        return (
          <span className="text-destructive flex items-center text-[10px] font-bold tracking-wider uppercase">
            <span className="bg-destructive mr-1 h-1.5 w-1.5 rounded-full" />
            {status}
          </span>
        )
      case 'CONTINUE':
      case 'START':
        return (
          <span className="text-primary flex items-center text-[10px] font-bold tracking-wider uppercase">
            <Play className="mr-0.5 h-2.5 w-2.5 fill-current" />
            {status}
          </span>
        )
      case 'PAUSE':
        return (
          <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
            <span className="bg-muted flex items-center justify-center rounded px-1 py-0.5">
              <Pause className="h-2.5 w-2.5 fill-current" />
            </span>
            {status}
          </span>
        )
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="flex items-center gap-4 px-2 py-2">
        {/* ── ESQUERDA ── */}
        <div className="flex shrink-0 items-center gap-4">
          {/* Col 1 — ticket em cima, select embaixo */}
          <div className="flex h-9 flex-col">
            {/* Linha 1 — ticket badge, h-4 = 16px */}
            <span className="bg-muted/60 text-primary inline-flex h-[18px] items-center rounded px-1.5 font-mono text-[14px] leading-none font-semibold tracking-tight">
              #70613
            </span>

            {/* Linha 2 — Select Shadcn compacto */}
            <Select
              value={selectedActivity}
              onValueChange={setSelectedActivity}
            >
              <SelectTrigger
                className={cn(
                  '!h-[18px] !min-h-0 !w-fit !border-none !bg-transparent !shadow-none',
                  '!inline-flex !items-center !justify-start !gap-0.5',
                  '!px-1.5 !py-0',
                  'text-muted-foreground text-[11px] leading-none',
                  'focus:ring-0 focus:ring-offset-0 focus-visible:ring-0',

                  '*:data-[slot=select-value]:flex',
                  '*:data-[slot=select-value]:items-center',
                  '*:data-[slot=select-value]:gap-0',
                  '*:data-[slot=select-value]:leading-none',

                  // apenas o chevron do trigger
                  '[&>svg]:!size-2.5',
                  '[&>svg]:shrink-0',
                  '[&>svg]:opacity-50',
                )}
              >
                <SelectValue>
                  <span className="flex items-center gap-2 leading-none">
                    <ActivityIcon className="text-primary h-3 w-3 shrink-0" />
                    <span>{selectedAct.name}</span>
                  </span>
                </SelectValue>
              </SelectTrigger>

              <SelectContent align="start" className="rounded-lg">
                {mockActivities.map(({ id, name, icon: Icon }) => (
                  <SelectItem key={id} value={id} className="h-7 text-[11px]">
                    <span className="flex items-center gap-1.5">
                      <Icon
                        className={cn(
                          'h-3 w-3',
                          id === selectedActivity
                            ? 'text-primary'
                            : 'text-muted-foreground',
                        )}
                      />
                      {name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Col 2 — timer + botões */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 flex-col">
              {/* Linha 1 — timer */}
              <span
                className={cn(
                  'flex h-[18px] items-center font-mono text-[18px] leading-none font-semibold tracking-tight tabular-nums transition-colors duration-300',
                  timerStatus === 'idle'
                    ? 'text-muted-foreground/40'
                    : 'text-primary',
                )}
              >
                01:12:42
              </span>

              {/* Linha 2 — total */}
              <div className="flex h-[18px] items-center gap-1 leading-none">
                <span className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
                  Hoje:
                </span>
                <span className="text-muted-foreground font-mono text-[12px] tracking-tight tabular-nums">
                  06h 30m
                </span>
              </div>
            </div>

            {/* Botões */}
            {timerStatus === 'idle' ? (
              <Button
                variant="default"
                className="h-9 w-9 shrink-0 rounded-lg p-0"
                onClick={() => setTimerStatus('running')}
              >
                <Play className="ml-0.5 h-4 w-4 fill-current" />
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="h-9 w-9 shrink-0 rounded-lg p-0"
                  onClick={() =>
                    setTimerStatus(
                      timerStatus === 'running' ? 'paused' : 'running',
                    )
                  }
                >
                  {timerStatus === 'running' ? (
                    <Pause className="text-primary h-4 w-4 fill-current" />
                  ) : (
                    <Play className="text-primary ml-0.5 h-4 w-4 fill-current" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  className="h-9 w-9 shrink-0 rounded-lg p-0"
                  onClick={() => setTimerStatus('idle')}
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                </Button>
              </div>
            )}
          </div>

          {/* Col 3 — ícones empilhados */}
          <div className="flex h-9 flex-col items-center">
            {/* History */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-muted/50 hover:text-foreground h-[18px] w-[18px] rounded p-0"
                >
                  <History className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={10}
                className="bg-card w-[340px] overflow-hidden rounded-lg p-0 shadow-lg"
              >
                <div className="flex items-center justify-between p-3">
                  <div className="text-foreground flex items-center gap-2 text-sm font-semibold">
                    <Database className="text-primary h-3.5 w-3.5" />
                    Session History
                  </div>
                  <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    Today <Calendar className="h-3.5 w-3.5" />
                  </div>
                </div>
                <Separator />
                <div className="flex max-h-[250px] flex-col overflow-y-auto">
                  {mockHistory.map((entry, index) => (
                    <React.Fragment key={entry.id}>
                      <div className="group hover:bg-muted/30 flex flex-col gap-2 p-3 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-foreground font-mono text-xs font-medium tracking-tight">
                              {entry.time}
                            </span>
                            {renderStatus(entry.status)}
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md"
                            >
                              <Pencil className="text-muted-foreground h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded-md"
                            >
                              <Trash2 className="text-muted-foreground h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-[10px] font-medium">
                            {entry.taskId}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            {entry.description}
                          </span>
                        </div>
                      </div>
                      {index < mockHistory.length - 1 && <Separator />}
                    </React.Fragment>
                  ))}
                </div>
                <Separator />
                <div className="bg-muted/10 flex items-center justify-between p-2">
                  <span className="text-muted-foreground px-1 text-[10px] font-medium">
                    {mockHistory.length} entries
                  </span>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Settings */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-muted/50 hover:text-foreground h-[18px] w-[18px] rounded p-0"
                >
                  <Settings2Icon className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={10}
                className="bg-card w-[360px] rounded-xl p-0 shadow-xl"
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary rounded-md p-1.5">
                      <Settings2Icon className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        Tracker Preferences
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Personalize your workflow
                      </p>
                    </div>
                  </div>
                  <Sparkles className="text-muted-foreground h-4 w-4" />
                </div>
                <Separator />
                <div className="space-y-3 p-3">
                  <div className="bg-muted/30 rounded-xl border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Clock3 className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold tracking-wide uppercase">
                        Timer mode
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          timerDirection === 'up' ? 'secondary' : 'ghost'
                        }
                        className="h-8 justify-start gap-2 text-xs"
                        onClick={() => setTimerDirection('up')}
                      >
                        <ClockArrowUp className="h-3.5 w-3.5" />
                        Normal
                      </Button>
                      <Button
                        variant={
                          timerDirection === 'down' ? 'secondary' : 'ghost'
                        }
                        className="h-8 justify-start gap-2 text-xs"
                        onClick={() => setTimerDirection('down')}
                      >
                        <ClockArrowDown className="h-3.5 w-3.5" />
                        Pomodoro
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-xl border p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <LayoutTemplate className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold tracking-wide uppercase">
                        Layout
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={
                          widgetLayout === 'horizontal' ? 'secondary' : 'ghost'
                        }
                        className="h-8 justify-start gap-2 text-xs"
                        onClick={() => setWidgetLayout('horizontal')}
                      >
                        <Minus className="h-3.5 w-3.5" />
                        Barra
                      </Button>
                      <Button
                        variant={
                          widgetLayout === 'vertical' ? 'secondary' : 'ghost'
                        }
                        className="h-8 justify-start gap-2 text-xs"
                        onClick={() => setWidgetLayout('vertical')}
                      >
                        <LayoutTemplate className="h-3.5 w-3.5" />
                        Em pé
                      </Button>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-xl border p-3">
                    <div className="mb-3 flex items-center gap-2">
                      <Sparkles className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-[11px] font-semibold tracking-wide uppercase">
                        Automations
                      </span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-xs font-medium">
                          <Gamepad2 className="text-muted-foreground h-3.5 w-3.5" />
                          Discord RPC
                        </Label>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-xs font-medium">
                          <Moon className="text-muted-foreground h-3.5 w-3.5" />
                          Anti-Burnout (4h)
                        </Label>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-xs font-medium">
                          <MonitorPlay className="text-muted-foreground h-3.5 w-3.5" />
                          Active window tracking
                        </Label>
                        <Switch />
                      </div>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* ── DIREITA — descrição ── */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 px-2">
            <Minus className="text-muted-foreground/50 h-3.5 w-3.5 shrink-0" />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="text-foreground h-8 border-none bg-transparent px-1 text-[13px] shadow-none focus-visible:ring-0"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
