import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AddonManifest, FieldGroup } from '@timelapse/application'
import {
  CheckCircle2,
  DatabaseZapIcon,
  PlusIcon,
  UnlinkIcon,
  UnplugIcon,
  UploadIcon,
  UserCogIcon,
} from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { FileUploadButton } from '@/components'
import { DataSourceList } from '@/components/plugins-list'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/hooks'
import { useClient } from '@/hooks/use-client'
import { queryClient } from '@/lib'

const baseWorkspaceSettingsSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  description: z.string().optional(),
  defaultHourlyRate: z.coerce.number().optional(),
  currency: z.string().optional(),
  weeklyHourGoal: z.coerce.number().optional(),
})

function buildConnectionFormSchema(dynamicFields: {
  credentials: FieldGroup[]
  configuration: FieldGroup[]
}) {
  const createShapeFromGroups = (groups: FieldGroup[]): z.ZodObject<any> => {
    const shape: Record<string, z.ZodTypeAny> = {}
    if (!groups?.length) return z.object(shape)
    for (const group of groups) {
      for (const field of group.fields) {
        let fieldSchema: z.ZodString = z.string()
        if (field.type === 'url') {
          fieldSchema = fieldSchema.url('URL inválida')
        }
        if (field.required) {
          shape[field.id] = fieldSchema.min(1, `${field.label} é obrigatório.`)
        } else {
          shape[field.id] = fieldSchema.optional().nullable()
        }
      }
    }
    return z.object(shape)
  }
  return z.object({
    credentials: createShapeFromGroups(dynamicFields.credentials),
    configuration: createShapeFromGroups(dynamicFields.configuration),
  })
}

export interface WorkspaceConnectionRef {
  id: string
  config?: Record<string, unknown>
}

/** Form data for connecting a single data source */
type ConnectionFormSchema = {
  credentials: Record<string, unknown>
  configuration: Record<string, unknown>
}

/** Derive list of linked connections: N dataSourceConnections or legacy single dataSource */
function getConnections(
  workspace: {
    dataSource?: string
    dataSourceConnections?: WorkspaceConnectionRef[]
  } | null,
): WorkspaceConnectionRef[] {
  if (!workspace) return []
  const conns = workspace.dataSourceConnections
  if (conns && conns.length > 0) return conns
  if (workspace.dataSource && workspace.dataSource !== 'local') {
    return [{ id: workspace.dataSource }]
  }
  return []
}

export function WorkspaceSettings() {
  const { login, user } = useAuth()
  const client = useClient()
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const workspaceQueryKey = ['workspace', workspaceId]

  const { data: workspace, isLoading } = useQuery({
    queryKey: workspaceQueryKey,
    queryFn: async () => {
      if (!workspaceId) return null
      const response = await client.services.workspaces.getById({
        body: { workspaceId },
      })
      return response.data ?? null
    },
    enabled: !!workspaceId,
  })

  const connections = useMemo(
    () => getConnections(workspace ?? null),
    [workspace],
  )

  const [dataSourceToLink, setDataSourceToLink] =
    useState<AddonManifest | null>(null)
  const [connectingDataSourceId, setConnectingDataSourceId] = useState<
    string | null
  >(null)
  const [dynamicFields, setDynamicFields] = useState<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }>({ credentials: [], configuration: [] })

  const connectionFormSchema = useMemo(
    () => buildConnectionFormSchema(dynamicFields),
    [dynamicFields],
  )

  const connectionForm = useForm<ConnectionFormSchema>({
    resolver: zodResolver(connectionFormSchema) as any,
    defaultValues: { credentials: {}, configuration: {} },
  })

  React.useEffect(() => {
    const load = async () => {
      const response = await client.services.workspaces.getDataSourceFields()
      setDynamicFields(response)
    }
    load()
  }, [client])

  const linkMutation = useMutation({
    mutationFn: (dataSource: AddonManifest) =>
      client.services.workspaces.linkDataSource({
        body: { workspaceId: workspaceId!, dataSource: dataSource.id },
      }),
    onSuccess: (_, dataSource) => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.success(`Fonte "${dataSource.name}" vinculada.`)
      setDataSourceToLink(null)
    },
    onError: (error) => {
      toast.error(error.message)
      setDataSourceToLink(null)
    },
  })

  const unlinkMutation = useMutation({
    mutationFn: (dataSourceId: string) =>
      client.services.workspaces.unlinkDataSource({
        body: { workspaceId: workspaceId!, dataSourceId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.info('Fonte desvinculada.')
      setConnectingDataSourceId(null)
    },
    onError: (error) => toast.error(error.message),
  })

  const connectMutation = useMutation({
    mutationFn: (payload: {
      dataSourceId: string
      credentials: Record<string, unknown>
      configuration: Record<string, unknown>
    }) =>
      client.services.workspaces.connectDataSource({
        body: {
          workspaceId: workspaceId!,
          dataSourceId: payload.dataSourceId,
          credentials: payload.credentials,
          configuration: payload.configuration,
        },
      }),
    onSuccess: (response, variables) => {
      if (!response.isSuccess) {
        toast.error(response.error ?? 'Falha ao conectar.')
        return
      }
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.success(`Conectado com sucesso.`)
      if (response.data?.member && response.data?.token) {
        login(response.data.member, response.data.token)
      }
      setConnectingDataSourceId(null)
      connectionForm.reset({ credentials: {}, configuration: {} })
    },
    onError: (error) => toast.error(error.message),
  })

  const disconnectMutation = useMutation({
    mutationFn: (dataSourceId: string) =>
      client.services.workspaces.disconnectDataSource({
        body: { workspaceId: workspaceId!, dataSourceId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.info('Desconectado.')
    },
    onError: (error) => toast.error(error.message),
  })

  async function handleDataSourceImport(files: FileList) {
    const file = files[0]
    const arrayBuffer = await file.arrayBuffer()
    const response = await client.integrations.addons.import({
      body: { addon: new Uint8Array(arrayBuffer) },
    })
    if (!response.isSuccess) {
      toast.error('Falha ao importar: ' + response.error)
      return
    }
    toast.success('Importado com sucesso.')
  }

  function handleConnectSubmit(data: ConnectionFormSchema) {
    if (!connectingDataSourceId) return
    connectMutation.mutate({
      dataSourceId: connectingDataSourceId,
      credentials: data.credentials as Record<string, unknown>,
      configuration: data.configuration as Record<string, unknown>,
    })
  }

  if (isLoading) {
    return <div className="p-4">Carregando workspace...</div>
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Configurações</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <hr className="mt-2" />

      <div className="mt-6 space-y-6 pb-12">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>
              Detalhes básicos do seu espaço de trabalho.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Workspace</Label>
              <Input
                id="name"
                placeholder="Ex: Minha Empresa"
                defaultValue={workspace?.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito deste workspace."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultHourlyRate">Valor Hora Padrão</Label>
                <Input id="defaultHourlyRate" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weeklyHourGoal">Meta de Horas Semanal</Label>
              <Input id="weeklyHourGoal" type="number" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="button">Salvar Alterações</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1">
              <DatabaseZapIcon size={20} /> Provedores de dados
            </CardTitle>
            <CardDescription>
              Vincule uma ou mais fontes externas para sincronizar dados. Você
              pode conectar e desconectar cada uma independentemente.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Adicionar nova fonte */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Adicionar fonte</h4>
              <div className="flex flex-wrap items-center gap-2">
                <FileUploadButton
                  size="sm"
                  accept=".tladdon"
                  onFileSelect={(files) => handleDataSourceImport(files)}
                >
                  <UploadIcon />
                  Importar
                </FileUploadButton>
                <DataSourceList
                  onSelectDataSource={(ds) => setDataSourceToLink(ds)}
                />
              </div>
              <AlertDialog
                open={!!dataSourceToLink}
                onOpenChange={(open) => !open && setDataSourceToLink(null)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar vinculação</AlertDialogTitle>
                    <AlertDialogDescription>
                      {dataSourceToLink && (
                        <div className="flex items-center gap-3">
                          <img
                            src={dataSourceToLink.logo}
                            alt={dataSourceToLink.name}
                            className="h-10 w-10 rounded-lg border bg-white object-contain p-1"
                          />
                          <div>
                            <p className="font-semibold">
                              {dataSourceToLink.name}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              by {dataSourceToLink.creator}
                            </p>
                          </div>
                        </div>
                      )}
                      <br />
                      Esta fonte será adicionada ao workspace. Depois você pode
                      conectar com suas credenciais.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={linkMutation.isPending}
                      onClick={() =>
                        dataSourceToLink &&
                        linkMutation.mutate(dataSourceToLink)
                      }
                    >
                      {linkMutation.isPending
                        ? 'Vinculando...'
                        : 'Sim, vincular'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {/* Lista de conexões vinculadas */}
            {connections.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Fontes vinculadas</h4>
                <ul className="space-y-3">
                  {connections.map((conn) => (
                    <ConnectionRow
                      key={conn.id}
                      connectionId={conn.id}
                      workspaceId={workspaceId!}
                      config={conn.config}
                      isConnecting={connectingDataSourceId === conn.id}
                      onStartConnect={() => {
                        setConnectingDataSourceId(conn.id)
                        connectionForm.reset({
                          credentials: {},
                          configuration:
                            (conn.config as Record<string, unknown>) ?? {},
                        })
                      }}
                      onCancelConnect={() => setConnectingDataSourceId(null)}
                      connectionForm={connectionForm}
                      dynamicFields={dynamicFields}
                      onSubmitConnect={handleConnectSubmit}
                      connectMutation={connectMutation}
                      onDisconnect={() => disconnectMutation.mutate(conn.id)}
                      onUnlink={() => unlinkMutation.mutate(conn.id)}
                      disconnectMutation={disconnectMutation}
                      unlinkMutation={unlinkMutation}
                      user={
                        user
                          ? {
                              id: String(user.id),
                              firstname: user.firstname,
                              lastname: user.lastname,
                              login: user.login,
                            }
                          : null
                      }
                    />
                  ))}
                </ul>
              </div>
            )}

            {connections.length === 0 && (
              <p className="text-muted-foreground text-sm">
                Nenhuma fonte vinculada. Use Importar ou a lista acima para
                adicionar uma.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

interface ConnectionRowProps {
  connectionId: string
  workspaceId: string
  config?: Record<string, unknown>
  isConnecting: boolean
  onStartConnect: () => void
  onCancelConnect: () => void
  connectionForm: ReturnType<typeof useForm<ConnectionFormSchema>>
  dynamicFields: { credentials: FieldGroup[]; configuration: FieldGroup[] }
  onSubmitConnect: (data: ConnectionFormSchema) => void
  connectMutation: {
    mutate: (v: {
      dataSourceId: string
      credentials: Record<string, unknown>
      configuration: Record<string, unknown>
    }) => void
    isPending: boolean
  }
  onDisconnect: () => void
  onUnlink: () => void
  disconnectMutation: { isPending: boolean }
  unlinkMutation: { isPending: boolean }
  user: {
    id?: string
    firstname?: string
    lastname?: string
    login?: string
  } | null
}

function ConnectionRow({
  connectionId,
  workspaceId,
  config,
  isConnecting,
  onStartConnect,
  onCancelConnect,
  connectionForm,
  dynamicFields,
  onSubmitConnect,
  connectMutation,
  onDisconnect,
  onUnlink,
  disconnectMutation,
  unlinkMutation,
  user,
}: ConnectionRowProps) {
  const client = useClient()
  const { data: addon } = useQuery({
    queryKey: ['local-addon', workspaceId, connectionId],
    queryFn: async () => {
      const res = await client.integrations.addons.getInstalledById({
        body: { addonId: connectionId },
      })
      return res.data ?? null
    },
    enabled: !!connectionId && !!workspaceId,
  })

  const displayName = addon?.name ?? connectionId

  return (
    <li className="rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {addon?.logo && (
            <img
              src={addon.logo}
              alt={addon.name}
              className="h-10 w-10 rounded-lg border bg-white object-contain p-1"
            />
          )}
          <div>
            <p className="font-medium">{displayName}</p>
            {addon && (
              <p className="text-muted-foreground text-xs">
                by {addon.creator} · v{addon.version}
              </p>
            )}
          </div>
          <Badge
            variant="secondary"
            className="flex w-fit items-center gap-1 rounded-md border-green-600 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          >
            <CheckCircle2 size={14} />
            Vinculado
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isConnecting ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onStartConnect}
              >
                <PlusIcon size={14} />
                Conectar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onDisconnect}
                disabled={disconnectMutation.isPending}
              >
                <UnplugIcon size={14} />
                Desconectar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" size="sm" variant="destructive">
                    <UnlinkIcon size={14} />
                    Desvincular
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Desvincular fonte?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta fonte será removida do workspace. As credenciais
                      salvas serão apagadas.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={unlinkMutation.isPending}
                      onClick={onUnlink}
                    >
                      Sim, desvincular
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onCancelConnect}
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {user && (
        <div className="mt-3 flex items-center gap-1 border-t pt-3 text-sm">
          <UserCogIcon size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground">Sessão:</span>
          <span className="font-mono">{user.login ?? user.id}</span>
          <span className="text-muted-foreground">
            ({user.firstname} {user.lastname})
          </span>
        </div>
      )}

      {isConnecting && (
        <form
          className="mt-4 space-y-4 border-t pt-4"
          onSubmit={connectionForm.handleSubmit(
            onSubmitConnect as (d: unknown) => void,
          )}
        >
          <p className="text-sm font-medium">Conectar com {displayName}</p>
          {dynamicFields.configuration.map((group) => (
            <div key={group.id} className="space-y-2">
              <Label className="text-xs">{group.label}</Label>
              {group.fields.map((field) => (
                <div key={field.id}>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    {...connectionForm.register(
                      `configuration.${field.id}` as const,
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
          {dynamicFields.credentials.map((group) => (
            <div key={group.id} className="space-y-2">
              <Label className="text-xs">{group.label}</Label>
              {group.fields.map((field) => (
                <div key={field.id}>
                  <Input
                    type={field.type}
                    placeholder={field.placeholder}
                    {...connectionForm.register(
                      `credentials.${field.id}` as const,
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
          <div className="flex gap-2">
            <Button type="submit" disabled={connectMutation.isPending}>
              {connectMutation.isPending ? 'Conectando...' : 'Conectar'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancelConnect}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </li>
  )
}
