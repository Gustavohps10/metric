'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { AddonManifest } from '@metric-org/application'
import {
  WorkspaceConnectionViewModel,
  WorkspaceViewModel,
} from '@metric-org/sdk'
import { defineStepper } from '@stepperize/react'
import { useStepItemContext } from '@stepperize/react/primitives'
import { useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Check,
  CheckCircle2,
  CheckIcon,
  Code2,
  Download,
  FileBox,
  ImageIcon,
  Info,
  LayoutTemplate,
  Loader2,
  Monitor,
  PlugZap,
  Plus,
  Settings2,
  ShieldCheck,
  TerminalIcon,
  UserCog,
  X,
} from 'lucide-react'
import React from 'react'
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
} from 'react-hook-form'
import { toast } from 'sonner'
import z from 'zod'

import { DataSourceList } from '@/components/datasource-list'
import {
  DataSourceInstanceFormData,
  NewDataSourceInstanceForm,
} from '@/components/new-datasource-instance-form'
import { Button, Input, Label, Progress, Textarea } from '@/components/ui'
import { DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useWorkspace, workspaceKeys } from '@/contexts/WorkspaceContext'
import { useClient, useDataSourceConnections } from '@/hooks'
import { cn } from '@/lib'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const identitySchema = z.object({
  name: z.string().min(3, 'O nome precisa ter no mínimo 3 caracteres.'),
  description: z.string().optional(),
  avatarUrl: z.string().optional(),
})

const sourceTypeSchema = z.object({
  sourceType: z.enum(['DATASOURCE', 'PRESET', 'SCRATCH']),
})

const workspaceConnectionSchema: z.ZodType<WorkspaceConnectionViewModel> =
  z.object({
    id: z.string(),
    dataSourceId: z.string(),
    config: z.record(z.unknown()).optional(),
  })

const configSchema = z.object({
  presetCode: z
    .enum(['DEV', 'QA', 'STUDY', 'ANALYST', 'TECHLEAD', 'NONE'])
    .default('DEV'),
  currentConnectionInstanceId: z.string().optional(),
  dataSourcePlugin: z.any().optional(),
  dataSourceInstances: z.array(workspaceConnectionSchema).default([]),
})

const refinementSchema = z.object({
  defaultHourlyRate: z.coerce.number().optional(),
  currency: z.enum(['BRL', 'USD', 'EUR']).default('BRL'),
  weeklyHourGoal: z.coerce.number().optional(),
})

const workspaceFormSchema = identitySchema
  .merge(sourceTypeSchema)
  .merge(configSchema)
  .merge(refinementSchema)

type WorkspaceFormData = z.infer<typeof workspaceFormSchema>

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LogEntry = {
  id: string
  type: 'info' | 'success' | 'error' | 'warn'
  message: string
}

type InstallState = 'idle' | 'installing' | 'success' | 'error'

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

const { Stepper, useStepper } = defineStepper(
  { id: 'identity', title: 'Identidade' },
  { id: 'source-selection', title: 'Início' },
  { id: 'configuration', title: 'Configuração' },
  { id: 'confirmation', title: 'Confirmação' },
)

// ---------------------------------------------------------------------------
// WorkspaceAvatar
// ---------------------------------------------------------------------------

function WorkspaceAvatar({
  value,
  onChange,
  name,
  disabled = false,
}: {
  value?: string
  onChange: (url: string) => void
  name?: string
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(value ?? null)

  const initials = name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(url)
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onChange('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4',
        disabled && 'pointer-events-none opacity-80',
      )}
    >
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 transition-all',
          preview
            ? 'border-border hover:border-primary/50'
            : 'border-muted-foreground/30 bg-muted/40 hover:border-primary/50 hover:bg-muted/60 border-dashed',
          disabled && 'bg-muted/20 border-solid',
        )}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <ImageIcon className="h-4 w-4 text-white" />
              </div>
            )}
          </>
        ) : initials ? (
          <span className="text-muted-foreground text-base font-bold">
            {initials}
          </span>
        ) : (
          <ImageIcon className="text-muted-foreground/50 h-5 w-5" />
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col gap-1">
        {!disabled ? (
          <>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-foreground text-left text-xs font-semibold underline-offset-2 hover:underline"
            >
              {preview ? 'Alterar imagem' : 'Enviar logotipo'}
            </button>
            <p className="text-muted-foreground text-[11px]">
              PNG, JPG ou SVG. Máx 2MB.
            </p>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="text-destructive/80 hover:text-destructive flex items-center gap-1 text-left text-[11px]"
              >
                <X className="h-3 w-3" />
                Remover
              </button>
            )}
          </>
        ) : (
          <p className="text-sm font-bold">{name}</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// InstallConsole
// ---------------------------------------------------------------------------

const LOG_ICONS: Record<LogEntry['type'], React.ReactNode> = {
  info: <Info className="mt-px h-3.5 w-3.5 shrink-0 text-blue-500" />,
  success: <CheckCircle2 className="text-primary mt-px h-3.5 w-3.5 shrink-0" />,
  error: (
    <AlertCircle className="text-destructive mt-px h-3.5 w-3.5 shrink-0" />
  ),
  warn: <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0 text-yellow-500" />,
}

function InstallConsole({
  logs,
  progress,
  status,
  plugin,
  onRetry,
  onContinue,
}: {
  logs: LogEntry[]
  progress: number
  status: InstallState
  plugin: any
  onRetry: () => void
  onContinue: () => void
}) {
  const logsEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="bg-background/50 flex flex-col gap-4 rounded-xl border p-4">
      <div className="bg-muted/30 flex items-center gap-3 rounded-xl border p-3">
        {plugin?.iconUrl ? (
          <img
            src={plugin.iconUrl}
            alt={plugin?.name}
            className="h-9 w-9 rounded-lg object-contain"
          />
        ) : (
          <div className="bg-muted flex h-9 w-9 items-center justify-center rounded-lg">
            <PlugZap className="text-muted-foreground h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {plugin?.name ?? 'Plugin'}
          </p>
          <p className="text-muted-foreground truncate text-[11px]">
            {plugin?.description ?? 'Integração externa'}
          </p>
        </div>
        <span className="text-muted-foreground bg-muted shrink-0 rounded-md px-2 py-1 font-mono text-[10px]">
          {plugin?.version ?? 'v1.0.0'}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-medium">
            {status === 'installing'
              ? 'Instalando...'
              : status === 'success'
                ? 'Instalado com sucesso'
                : status === 'error'
                  ? 'Falha na instalação'
                  : 'Aguardando'}
          </span>
          <span className="text-muted-foreground font-mono text-xs">
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      <div className="bg-muted/20 flex flex-col overflow-hidden rounded-xl border">
        <div className="bg-muted/30 flex items-center gap-2 border-b px-3 py-2">
          <TerminalIcon className="text-muted-foreground h-3.5 w-3.5" />
          <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
            Console
          </span>
        </div>
        <div className="h-44 space-y-1.5 overflow-y-auto p-3 font-mono">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2">
              {LOG_ICONS[log.type]}
              <span
                className={cn('text-[11px] leading-snug', {
                  'text-foreground/80': log.type === 'info',
                  'text-primary': log.type === 'success',
                  'text-destructive': log.type === 'error',
                  'text-yellow-600 dark:text-yellow-400': log.type === 'warn',
                })}
              >
                {log.message}
              </span>
            </div>
          ))}
          {status === 'installing' && (
            <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
              <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
              <span>Processando...</span>
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {status === 'success' && (
        <div className="border-primary/20 bg-primary/5 flex items-center gap-2.5 rounded-xl border px-4 py-3">
          <CheckCircle2 className="text-primary h-4 w-4 shrink-0" />
          <p className="text-primary text-sm font-medium">
            Integração concluída!
          </p>
        </div>
      )}
      {status === 'error' && (
        <div className="border-destructive/20 bg-destructive/5 flex items-center gap-2.5 rounded-xl border px-4 py-3">
          <AlertCircle className="text-destructive h-4 w-4 shrink-0" />
          <p className="text-destructive text-sm font-medium">
            Ocorreu um erro durante a instalação.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2">
        {status === 'error' && (
          <Button variant="outline" size="sm" type="button" onClick={onRetry}>
            Tentar novamente
          </Button>
        )}
        {status === 'success' && (
          <Button size="sm" type="button" onClick={onContinue}>
            Finalizar Instalação
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// StepperValidation
// ---------------------------------------------------------------------------

function StepperValidation() {
  const stepper = useStepper()
  const { trigger } = useFormContext<WorkspaceFormData>()

  React.useEffect(() => {
    const unsub = stepper.lifecycle.onBeforeTransition(async (ctx) => {
      if (ctx.direction === 'next') {
        let fieldsToValidate: (keyof WorkspaceFormData)[] = []
        if (ctx.from.id === 'identity') fieldsToValidate = ['name']
        if (ctx.from.id === 'source-selection')
          fieldsToValidate = ['sourceType']
        if (ctx.from.id === 'configuration')
          fieldsToValidate = ['dataSourceInstances']

        const isValid = await trigger(fieldsToValidate)
        if (!isValid) return false
      }
    })
    return () => unsub()
  }, [stepper, trigger])

  return null
}

function StepIndicatorIcon() {
  const item = useStepItemContext()
  return item.status === 'success' ? (
    <Check className="h-3.5 w-3.5" />
  ) : (
    <span>{item.index + 1}</span>
  )
}

// ---------------------------------------------------------------------------
// SelectionCard / PresetCard
// ---------------------------------------------------------------------------

function SelectionCard({
  icon,
  title,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all',
        isSelected
          ? 'border-primary bg-primary/[0.03] shadow-sm'
          : 'border-border bg-background hover:border-muted-foreground/25 hover:bg-muted/20',
      )}
    >
      <div
        className={cn(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border',
          isSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted text-muted-foreground border-transparent',
        )}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="text-muted-foreground mt-0.5 text-xs leading-snug">
          {description}
        </p>
      </div>
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
          isSelected
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30',
        )}
      >
        {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
      </div>
    </div>
  )
}

function PresetCard({
  icon,
  title,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative flex cursor-pointer flex-col gap-2.5 rounded-xl border-2 p-4 transition-all duration-200',
        isSelected
          ? 'border-primary bg-primary/[0.03]'
          : 'border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/20',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-lg border',
          isSelected
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-muted text-muted-foreground border-transparent',
        )}
      >
        {icon}
      </div>
      <div className="text-left leading-tight">
        <h3
          className={cn(
            'text-sm font-semibold',
            isSelected ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {title}
        </h3>
        <p className="text-muted-foreground mt-0.5 text-[11px] leading-snug">
          {description}
        </p>
      </div>
      {isSelected && (
        <div className="bg-primary absolute top-3 right-3 rounded-full p-0.5">
          <CheckIcon
            className="text-primary-foreground h-3 w-3"
            strokeWidth={4}
          />
        </div>
      )}
    </div>
  )
}

interface StepperFormProps {
  workspaceId?: string
  onWorkspaceCreated: (id: string) => void
  onClose: () => void
  onModalOpenChange: (open: boolean) => void
}

export function StepperForm({
  onWorkspaceCreated,
  onClose,
  onModalOpenChange,
}: StepperFormProps) {
  const client = useClient()
  const queryClient = useQueryClient()
  const { create, updateIdentity, isCreating, workspace } = useWorkspace()

  const methods = useForm<WorkspaceFormData>({
    resolver: zodResolver(workspaceFormSchema),
    defaultValues: {
      name: workspace?.name ?? '',
      description: workspace?.description ?? '',
      avatarUrl: workspace?.avatarUrl ?? '',
      currency: 'BRL',
      sourceType: 'DATASOURCE',
      presetCode: 'DEV',
      dataSourceInstances: workspace?.dataSourceConnections ?? [],
    },
    mode: 'onChange',
  })

  const sourceType = methods.watch('sourceType')
  const selectedPlugin = methods.watch('dataSourcePlugin')

  const instances =
    workspace?.dataSourceConnections ?? methods.watch('dataSourceInstances')

  const [installState, setInstallState] = React.useState<InstallState>('idle')
  const [installLogs, setInstallLogs] = React.useState<LogEntry[]>([])
  const [installProgress, setInstallProgress] = React.useState(0)
  const [showDataSourcePicker, setShowDataSourcePicker] = React.useState(false)
  const { connect } = useDataSourceConnections()

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function makeLogEntry(type: LogEntry['type'], message: string): LogEntry {
    return { id: `${Date.now()}-${Math.random()}`, type, message }
  }

  function addLog(type: LogEntry['type'], message: string) {
    setInstallLogs((prev) => [...prev, makeLogEntry(type, message)])
  }

  function resetInstall() {
    setInstallState('idle')
    setInstallLogs([])
    setInstallProgress(0)
    methods.setValue('dataSourcePlugin', undefined)
  }

  function resetDialog() {
    onClose()
    resetInstall()
    setShowDataSourcePicker(false)
    methods.reset()
  }

  async function handleSaveWorkspace(
    stepperNext: (e: React.MouseEvent<HTMLButtonElement>) => void,
    e: React.MouseEvent<HTMLButtonElement>,
  ) {
    const isValid = await methods.trigger(['name', 'description', 'avatarUrl'])
    if (!isValid) return

    const { name, description, avatarUrl } = methods.getValues()

    let avatarFile: Uint8Array | undefined
    let removeAvatar = false

    if (!avatarUrl) {
      removeAvatar = true
    } else if (avatarUrl.startsWith('blob:')) {
      try {
        const blob = await fetch(avatarUrl).then((r) => r.blob())
        avatarFile = new Uint8Array(await blob.arrayBuffer())
      } catch {
        toast.error('Falha ao processar a imagem do avatar.')
        return
      }
    }

    if (!workspace?.id) {
      const newWorkspace = await create({ name, description, avatarFile })
      if (newWorkspace?.id) {
        onWorkspaceCreated(newWorkspace.id)
        stepperNext(e)
      }
      return
    }

    const updated = await updateIdentity({
      name,
      description,
      avatarFile,
      removeAvatar,
    })
    if (updated) stepperNext(e)
  }
  // -------------------------------------------------------------------------
  // Step 3 – install datasource plugin
  // -------------------------------------------------------------------------

  async function runInstall() {
    setInstallState('installing')
    setInstallLogs([])
    setInstallProgress(0)

    const steps: { progress: number; msg: string }[] = [
      { progress: 15, msg: 'Verificando dependências...' },
      { progress: 35, msg: `Baixando ${selectedPlugin?.name ?? 'plugin'}...` },
      { progress: 55, msg: 'Validando credenciais...' },
      { progress: 75, msg: 'Configurando conexão...' },
      { progress: 90, msg: 'Sincronizando schema inicial...' },
    ]

    for (const step of steps) {
      await new Promise((r) => setTimeout(r, 600))
      setInstallProgress(step.progress)
      addLog('info', step.msg)
    }

    await new Promise((r) => setTimeout(r, 500))

    const ok = Math.random() > 0.15
    if (ok) {
      setInstallProgress(100)
      addLog('success', 'Integração concluída com sucesso.')
      setInstallState('success')
    } else {
      addLog('error', 'Falha ao autenticar com o servidor remoto.')
      setInstallState('error')
    }
  }

  function removeInstance(id: string) {
    methods.setValue(
      'dataSourceInstances',
      instances.filter((i) => i.id !== id),
    )
  }

  // -------------------------------------------------------------------------
  // Final submit (step 4)
  // -------------------------------------------------------------------------

  async function onSubmit(data: WorkspaceFormData) {
    if (workspace?.id) {
      await client.services.workspaces.markAsConfigured({
        body: { workspaceId: workspace.id },
      })

      queryClient.setQueryData<WorkspaceViewModel>(
        workspaceKeys.detail(workspace.id),
        (prev) => (prev ? { ...prev, status: 'configured' } : prev),
      )

      queryClient.setQueryData<WorkspaceViewModel[]>(
        workspaceKeys.all,
        (prev) =>
          prev?.map((w) =>
            w.id === workspace.id ? { ...w, status: 'configured' } : w,
          ) ?? [],
      )
    }

    toast.success('Workspace configurado com sucesso!')
    resetDialog()
  }

  async function handleSelectDataSource(plugin: AddonManifest | null) {
    if (!plugin) return

    if (!workspace?.id) {
      toast.error('Workspace ainda não foi criado.')
      return
    }

    try {
      const connectionInstanceId = crypto.randomUUID()

      const response = await client.services.workspaces.linkDataSource({
        body: {
          workspaceId: workspace?.id,
          dataSourceId: plugin.id,
          connectionInstanceId,
        },
      })

      if (!response.isSuccess) {
        toast.error('Falha ao vincular datasource.')
        return
      }

      methods.setValue('dataSourcePlugin', plugin)
      methods.setValue('currentConnectionInstanceId', connectionInstanceId)

      const currentInstances = methods.getValues('dataSourceInstances') || []

      methods.setValue('dataSourceInstances', [
        ...currentInstances,
        {
          id: connectionInstanceId,
          dataSourceId: plugin.id,
          // config: plugin.data
        },
      ])

      toast.success(`${plugin.name} conectado com sucesso.`)
    } catch (err) {
      console.error(err)
      toast.error('Erro ao conectar datasource.')
    }
  }

  async function handleConnectDataSource(
    instanceData: DataSourceInstanceFormData,
  ) {
    if (!workspace?.id) {
      toast.error('ID do Workspace não encontrado.')
      return
    }

    try {
      // Chamada ao serviço que executa o ConnectDataSourceService no Backend
      const response = await client.services.workspaces.connectDataSource({
        body: {
          workspaceId: workspace?.id,
          pluginId: instanceData.pluginId,
          connectionInstanceId: instanceData.connectionInstanceId,
          configuration: instanceData.configuration,
          credentials: instanceData.credentials,
        },
      })

      if (!response.isSuccess) {
        // Aqui aproveitamos o padrão Either/AppError que você usa no backend
        const error = response.error
        toast.error(error || 'Erro ao validar conexão com a fonte de dados.')
        return
      }

      if (response.data?.member && response.data?.token) {
        connect({
          connectionInstanceId: instanceData.connectionInstanceId,
          member: response.data.member,
          token: response.data.token,
        })
      }
      const plugin = methods.getValues('dataSourcePlugin')

      const newInstance: WorkspaceConnectionViewModel = {
        id: instanceData.connectionInstanceId,
        dataSourceId: plugin.id,
        // config: config
      }

      const currentInstances = methods.getValues('dataSourceInstances') || []

      methods.setValue('dataSourceInstances', [
        ...currentInstances,
        newInstance,
      ])

      // UI Feedback e Reset de estados do Picker
      toast.success(`${plugin?.name} conectado com sucesso!`)
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.detail(workspace?.id),
      })
      setShowDataSourcePicker(false)
      methods.setValue('dataSourcePlugin', undefined)
      resetInstall()
    } catch (error) {
      console.error('Connection Error:', error)
      toast.error('Ocorreu um erro inesperado ao tentar conectar.')
    }
  }

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex h-full flex-col"
        onKeyDown={(e) => {
          if (
            e.key === 'Enter' &&
            (e.target as HTMLElement).tagName !== 'TEXTAREA' &&
            !(e.target as HTMLElement).closest('[data-submit-btn]')
          ) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Novo Workspace</DialogTitle>
        </DialogHeader>

        <Stepper.Root
          initialStep={workspace?.id ? 'source-selection' : 'identity'}
        >
          {({ stepper }) => (
            <>
              <StepperValidation />

              {/* Step indicators */}
              <div className="px-6 pt-5 pb-2">
                <Stepper.List className="relative flex w-full items-center justify-between">
                  <div className="bg-border absolute top-4 left-0 -z-10 h-px w-full" />
                  {stepper.state.all.map((step) => (
                    <Stepper.Item
                      key={step.id}
                      step={step.id}
                      className="bg-background z-10 flex flex-col items-center px-3"
                    >
                      <Stepper.Trigger
                        type="button"
                        disabled={!workspace?.id && step.id !== 'identity'}
                        className="group flex flex-col items-center gap-2 outline-none"
                      >
                        <Stepper.Indicator className="border-muted bg-background text-muted-foreground data-[status=active]:border-primary data-[status=active]:bg-primary data-[status=active]:text-primary-foreground data-[status=success]:border-primary data-[status=success]:bg-primary/10 data-[status=success]:text-primary flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-bold transition-all">
                          <StepIndicatorIcon />
                        </Stepper.Indicator>
                        <Stepper.Title className="text-muted-foreground data-[status=active]:text-foreground data-[status=success]:text-foreground text-[11px] font-semibold tracking-wide">
                          {step.title}
                        </Stepper.Title>
                      </Stepper.Trigger>
                    </Stepper.Item>
                  ))}
                </Stepper.List>
              </div>

              {/* Persist Header after creation */}
              {workspace?.id && (
                <div className="bg-muted/10 flex items-center justify-between border-b px-6 py-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 flex h-6 w-6 items-center justify-center overflow-hidden rounded border">
                      {methods.watch('avatarUrl') ? (
                        <img
                          src={methods.watch('avatarUrl')}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Briefcase className="text-primary h-3 w-3" />
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs font-medium">
                      Workspace:{' '}
                      <span className="text-foreground">
                        {methods.watch('name')}
                      </span>
                    </span>
                  </div>
                  <div
                    className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"
                    title="Workspace ID Salvo"
                  />
                </div>
              )}

              {/* Step content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {/* STEP 1 – Identity */}
                <Stepper.Content
                  step="identity"
                  className="space-y-5 outline-none"
                >
                  <Controller
                    name="avatarUrl"
                    control={methods.control}
                    render={({ field }) => (
                      <WorkspaceAvatar
                        value={field.value}
                        onChange={field.onChange}
                        name={methods.watch('name')}
                      />
                    )}
                  />
                  <div className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <Label className="text-muted-foreground text-xs font-semibold">
                        Nome do Workspace
                      </Label>
                      <Input
                        placeholder="Ex: Redmine Atak, Freelance..."
                        {...methods.register('name')}
                      />
                      {methods.formState.errors.name && (
                        <p className="text-destructive text-xs">
                          {methods.formState.errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5 text-left">
                      <Label className="text-muted-foreground text-xs font-semibold">
                        Descrição{' '}
                        <span className="font-normal opacity-60">
                          (opcional)
                        </span>
                      </Label>
                      <Textarea
                        placeholder="Descreva o propósito deste workspace..."
                        className="resize-none"
                        rows={3}
                        {...methods.register('description')}
                      />
                    </div>
                  </div>
                </Stepper.Content>

                {/* STEP 2 – Source selection */}
                <Stepper.Content
                  step="source-selection"
                  className="space-y-5 outline-none"
                >
                  <div className="text-left">
                    <h2 className="text-base font-semibold">
                      Como deseja iniciar?
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Escolha como os dados do seu workspace serão definidos.
                    </p>
                  </div>

                  <Controller
                    name="sourceType"
                    control={methods.control}
                    render={({ field }) => (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                            Dados Online
                          </p>
                          <SelectionCard
                            icon={<PlugZap size={18} />}
                            title="Integração Externa"
                            description="Conecte Jira, Redmine, GitHub ou outras ferramentas e sincronize seus dados automaticamente."
                            isSelected={field.value === 'DATASOURCE'}
                            onClick={() => field.onChange('DATASOURCE')}
                          />
                        </div>

                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs font-semibold tracking-wide">
                            Dados Offline
                          </p>
                          <div className="grid grid-cols-1 gap-2.5">
                            <SelectionCard
                              icon={<LayoutTemplate size={18} />}
                              title="Preset Local"
                              description="Use um modelo pronto para Desenvolvedor, QA ou Estudante."
                              isSelected={field.value === 'PRESET'}
                              onClick={() => field.onChange('PRESET')}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </Stepper.Content>

                {/* STEP 3 – Configuration */}
                <Stepper.Content
                  step="configuration"
                  className="space-y-4 outline-none"
                >
                  {sourceType === 'DATASOURCE' && (
                    <div className="space-y-6">
                      {/* Lista de instâncias existentes */}
                      {!showDataSourcePicker && installState === 'idle' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold">
                              Integrações Ativas ({instances.length})
                            </h3>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5"
                              type="button"
                              onClick={() => setShowDataSourcePicker(true)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Adicionar integração
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {instances.length === 0 ? (
                              <div className="bg-muted/5 flex flex-col items-center justify-center rounded-xl border border-dashed p-8">
                                <PlugZap className="text-muted-foreground/30 mb-2 h-8 w-8" />
                                <p className="text-muted-foreground text-xs">
                                  Nenhuma integração adicionada.
                                </p>
                              </div>
                            ) : (
                              instances.map((inst) => (
                                <div
                                  key={inst.id}
                                  className="bg-background hover:border-primary/30 flex items-center gap-3 rounded-xl border p-3 transition-colors"
                                >
                                  <img src="" className="h-8 w-8 rounded-md" />
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-semibold">
                                      {inst.id}
                                    </p>
                                    <p className="text-muted-foreground text-[10px]">
                                      ID: {inst.id.split('-')[0]}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive/50 hover:text-destructive h-7 w-7"
                                    type="button"
                                    onClick={() => removeInstance(inst.id)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {/* Fluxo de Instalação e Seleção */}
                      {showDataSourcePicker && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                          {/* 1. ESTADO DE INSTALAÇÃO (Console de Log) */}
                          {installState !== 'idle' ? (
                            <InstallConsole
                              logs={installLogs}
                              progress={installProgress}
                              status={installState}
                              plugin={selectedPlugin}
                              onRetry={runInstall}
                              onContinue={() => {
                                // Após instalar com sucesso, o console fecha e mostra o Form de Instância
                                setInstallState('idle')
                              }}
                            />
                          ) : selectedPlugin ? (
                            /* 2. PLUGIN SELECIONADO -> MOSTRAR FORMULÁRIO DE INSTÂNCIA */
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-3">
                                  <div className="bg-primary/10 border-primary/20 flex h-10 w-10 items-center justify-center rounded-lg border">
                                    {selectedPlugin?.iconUrl ? (
                                      <img
                                        src={selectedPlugin.iconUrl}
                                        alt={selectedPlugin?.name}
                                        className="h-7 w-7 object-contain"
                                      />
                                    ) : (
                                      <PlugZap className="text-primary h-5 w-5" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold">
                                      {selectedPlugin?.name}
                                    </h4>
                                    <p className="text-muted-foreground text-[11px]">
                                      Nova instância de integração
                                    </p>
                                  </div>
                                </div>
                                <Button
                                  variant="link"
                                  size="sm"
                                  type="button"
                                  className="text-muted-foreground h-8"
                                  onClick={() =>
                                    methods.setValue(
                                      'dataSourcePlugin',
                                      undefined,
                                    )
                                  }
                                >
                                  Voltar
                                </Button>
                              </div>

                              {/* Verificação: Se o plugin não estiver instalado, mostra opção de instalar */}
                              {!selectedPlugin.installed ? (
                                <div className="bg-muted/30 space-y-4 rounded-xl border-2 border-dashed p-8 text-center">
                                  <div className="space-y-1">
                                    <p className="text-sm font-semibold">
                                      Este plugin ainda não está instalado
                                    </p>
                                    <p className="text-muted-foreground text-xs">
                                      Você precisa instalar o core do plugin
                                      antes de adicionar instâncias.
                                    </p>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={runInstall}
                                    className="gap-2"
                                  >
                                    <Download className="h-4 w-4" />
                                    Instalar Plugin agora
                                  </Button>
                                </div>
                              ) : (
                                /* O FORMULÁRIO DINÂMICO */
                                <NewDataSourceInstanceForm
                                  connectionInstanceId={
                                    methods.getValues(
                                      'currentConnectionInstanceId',
                                    )!
                                  }
                                  pluginId={selectedPlugin.id}
                                  isSubmitting={false} // O controle aqui é local do componente
                                  onSubmit={handleConnectDataSource}
                                />
                              )}
                            </div>
                          ) : (
                            /* 3. LISTA DE PLUGINS DISPONÍVEIS (Estado inicial do Picker) */
                            <div className="space-y-3 text-left">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-sm font-semibold">
                                    Fonte de Dados Disponíveis
                                  </h4>
                                  <p className="text-muted-foreground text-[11px]">
                                    Selecione uma fonte de dados para configurar
                                    sua instância
                                  </p>
                                </div>
                                <Button
                                  variant="link"
                                  size="sm"
                                  type="button"
                                  onClick={() => setShowDataSourcePicker(false)}
                                >
                                  Voltar
                                </Button>
                              </div>
                              <div className="bg-background/50 h-[340px] overflow-hidden rounded-xl border">
                                <DataSourceList
                                  onSelectDataSource={handleSelectDataSource}
                                  selectedPluginId={
                                    methods.watch('dataSourcePlugin')?.id
                                  }
                                  onModalOpenChange={onModalOpenChange}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {sourceType === 'PRESET' && (
                    <div className="space-y-3 text-left">
                      <div>
                        <h4 className="text-sm font-semibold">
                          Configurações Rápidas
                        </h4>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Selecione o perfil que melhor descreve seu uso
                        </p>
                      </div>
                      <div className="grid h-[300px] grid-cols-2 gap-2.5 overflow-y-auto pr-1">
                        <Controller
                          name="presetCode"
                          control={methods.control}
                          render={({ field: pField }) => (
                            <>
                              <PresetCard
                                icon={<Code2 size={20} />}
                                title="Desenvolvimento"
                                description="Sprints e Código."
                                isSelected={pField.value === 'DEV'}
                                onClick={() => pField.onChange('DEV')}
                              />
                              <PresetCard
                                icon={<ShieldCheck size={20} />}
                                title="Qualidade (QA)"
                                description="Testes e Bugs."
                                isSelected={pField.value === 'QA'}
                                onClick={() => pField.onChange('QA')}
                              />
                              <PresetCard
                                icon={<Monitor size={20} />}
                                title="Analista"
                                description="Processos."
                                isSelected={pField.value === 'ANALYST'}
                                onClick={() => pField.onChange('ANALYST')}
                              />
                              <PresetCard
                                icon={<BookOpen size={20} />}
                                title="Estudante"
                                description="TCC e Provas."
                                isSelected={pField.value === 'STUDY'}
                                onClick={() => pField.onChange('STUDY')}
                              />
                              <PresetCard
                                icon={<UserCog size={20} />}
                                title="Tech Lead"
                                description="Gestão."
                                isSelected={pField.value === 'TECHLEAD'}
                                onClick={() => pField.onChange('TECHLEAD')}
                              />
                              <PresetCard
                                icon={<Briefcase size={20} />}
                                title="Genérico"
                                description="Tarefas simples."
                                isSelected={pField.value === 'NONE'}
                                onClick={() => pField.onChange('NONE')}
                              />
                            </>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  {sourceType === 'SCRATCH' && (
                    <div className="bg-muted/20 flex flex-col items-center justify-center rounded-xl border border-dashed py-14 text-center">
                      <FileBox
                        className="text-muted-foreground/40 mb-3"
                        size={40}
                      />
                      <h4 className="text-sm font-semibold">Espaço Limpo</h4>
                      <p className="text-muted-foreground mt-1 max-w-[260px] text-xs leading-relaxed">
                        Crie seu ambiente sem pré-definições. Você terá total
                        liberdade para configurar depois.
                      </p>
                    </div>
                  )}

                  {methods.formState.errors.dataSourcePlugin && (
                    <p className="text-destructive bg-destructive/10 rounded-lg p-2.5 text-xs font-medium italic">
                      ⚠️{' '}
                      {String(
                        methods.formState.errors.dataSourcePlugin.message,
                      )}
                    </p>
                  )}
                </Stepper.Content>

                <Stepper.Content
                  step="confirmation"
                  className="space-y-6 text-left outline-none"
                >
                  <div>
                    <h2 className="text-base font-semibold">
                      Confirmar configuração
                    </h2>
                    <p className="text-muted-foreground mt-0.5 text-sm">
                      Revise os dados antes de finalizar.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Identidade */}
                    <div className="bg-muted/20 space-y-3 rounded-xl border p-4">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        Identidade
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                          {methods.watch('avatarUrl') ? (
                            <img
                              src={methods.watch('avatarUrl')}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Briefcase className="text-primary h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">
                            {methods.watch('name')}
                          </p>
                          {methods.watch('description') && (
                            <p className="text-muted-foreground text-xs">
                              {methods.watch('description')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Fonte de dados */}
                    <div className="bg-muted/20 space-y-3 rounded-xl border p-4">
                      <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                        Configuração
                      </p>
                      {sourceType === 'DATASOURCE' && (
                        <div className="flex items-center gap-2">
                          <PlugZap className="text-primary h-4 w-4 shrink-0" />
                          <p className="text-sm">
                            {instances.length > 0
                              ? `${instances.length} integração${instances.length > 1 ? 'ões' : ''} configurada${instances.length > 1 ? 's' : ''}`
                              : 'Nenhuma integração configurada'}
                          </p>
                        </div>
                      )}
                      {sourceType === 'PRESET' && (
                        <div className="flex items-center gap-2">
                          <LayoutTemplate className="text-primary h-4 w-4 shrink-0" />
                          <p className="text-sm">
                            Preset:{' '}
                            <span className="font-medium">
                              {methods.watch('presetCode')}
                            </span>
                          </p>
                        </div>
                      )}
                      {sourceType === 'SCRATCH' && (
                        <div className="flex items-center gap-2">
                          <Settings2 className="text-primary h-4 w-4 shrink-0" />
                          <p className="text-sm">Configuração manual</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Stepper.Content>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t px-6 py-4">
                <Stepper.Prev
                  render={(stepperProps) => {
                    const isFirst = stepper.state.isFirst

                    const handlePrev: React.MouseEventHandler<
                      HTMLButtonElement
                    > = (e) => {
                      if (isFirst) {
                        e.preventDefault()
                        resetDialog()
                        return
                      }
                      if (installState !== 'idle') resetInstall()
                      stepperProps.onClick?.(e)
                    }

                    return (
                      <Button
                        {...stepperProps}
                        variant="outline"
                        type="button"
                        disabled={installState === 'installing'}
                        onClick={handlePrev}
                      >
                        {isFirst ? 'Cancelar' : 'Anterior'}
                      </Button>
                    )
                  }}
                />

                <div className="flex gap-2">
                  {stepper.state.isLast ? (
                    <Button type="submit" data-submit-btn>
                      Finalizar
                    </Button>
                  ) : (
                    <Stepper.Next
                      render={(stepperProps) => {
                        const currentStepId = stepper.state.current.data.id
                        const isIdentityStep = currentStepId === 'identity'
                        const isEditingDraft = !!workspace?.id
                        const isConfigStep = currentStepId === 'configuration'
                        const canSkip = isEditingDraft || !isIdentityStep

                        const handleNext: React.MouseEventHandler<
                          HTMLButtonElement
                        > = async (e) => {
                          if (isIdentityStep) {
                            await handleSaveWorkspace(stepperProps.onClick!, e)
                            return
                          }
                          stepperProps.onClick?.(e)
                        }

                        return (
                          <>
                            {canSkip && (
                              <Button
                                variant="link"
                                type="button"
                                className="text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  stepperProps.onClick?.(e) // avança sem validar
                                }}
                              >
                                Pular
                              </Button>
                            )}
                            <Button
                              {...stepperProps}
                              type="button"
                              disabled={
                                (isConfigStep && showDataSourcePicker) ||
                                installState === 'installing' ||
                                methods.formState.isSubmitting
                              }
                              onClick={(e) => {
                                e.stopPropagation()
                                handleNext(e)
                              }}
                            >
                              {(methods.formState.isSubmitting ||
                                isCreating) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {isIdentityStep
                                ? workspace?.id
                                  ? 'Salvar e Continuar'
                                  : 'Criar e Continuar'
                                : 'Próximo'}
                            </Button>
                          </>
                        )
                      }}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </Stepper.Root>
      </form>
    </FormProvider>
  )
}
