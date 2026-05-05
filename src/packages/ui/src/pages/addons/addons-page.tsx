'use client'

import {
  AddonManifest,
  WorkspaceConnectionDTO,
  WorkspaceDTO,
} from '@metric-org/application'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search, UploadIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'

import jiraLogo from '@/assets/temp-plugins-icons/jira.png'
import youtrackLogo from '@/assets/temp-plugins-icons/youtrack.png'
import { FileUploadButton } from '@/components'
import {
  DataSourceInstanceFormData,
  NewDataSourceInstanceForm,
} from '@/components/new-datasource-instance-form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDataSourceConnections } from '@/hooks'
import { useClient } from '@/hooks/use-client'
import { queryClient } from '@/lib'

import {
  type AddonCategory,
  AddonCategorySidebar,
} from './addon-category-sidebar'
import { AddonDetailsDialog, InstallPluginDialog } from './addon-dialogs'
import { AddonList } from './addon-list'
import type { AddonConnection, AddonItem } from './addon-types'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_ADDONS: AddonItem[] = [
  {
    id: 'jira-mock',
    name: 'Jira Software',
    description:
      'Importe suas issues e gerencie o tempo diretamente no Metric.',
    author: 'Metric Foundation',
    version: '1.0.0',
    logo: jiraLogo,
    installed: true,
    category: 'data-sources',
    connections: [
      {
        id: 'c1',
        name: 'Jira Produção',
        url: 'empresa.atlassian.net',
        status: 'connected',
      },
    ],
  },
  {
    id: 'youtrack-mock',
    name: 'YouTrack',
    description:
      'Sincronização ágil com JetBrains YouTrack para rastreamento de tarefas.',
    author: 'Metric Foundation',
    version: '1.2.4',
    logo: youtrackLogo,
    installed: true,
    category: 'data-sources',
    connections: [
      {
        id: 'c2',
        name: 'YouTrack Local',
        url: 'youtrack.internal.com',
        status: 'disconnected',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getConnections(
  workspace: WorkspaceDTO | null,
): WorkspaceConnectionDTO[] {
  if (!workspace) return []
  return workspace.dataSourceConnections ?? []
}

function connectionMatchesAddon(
  c: WorkspaceConnectionDTO,
  addonId: string,
): boolean {
  return c.dataSourceId === addonId
}

function manifestToAddonItem(
  m: AddonManifest,
  connections: AddonConnection[],
  category: AddonCategory,
): AddonItem {
  return {
    id: m.id,
    name: m.name,
    description: m.description ?? '',
    author: m.creator ?? '',
    version: m.version,
    logo: m.logo ?? '',
    installed: m.installed,
    category,
    connections,
    documentationUrl: m.sourceUrl,
    installerManifestUrl: m.installerManifestUrl,
  }
}

function addonCategory(m: AddonManifest): AddonCategory {
  const tags = (m.tags ?? []).map((t) => t.toLowerCase())
  if (tags.some((t) => t.includes('theme') || t === 'tema')) return 'themes'
  if (tags.some((t) => t.includes('util') || t === 'utility'))
    return 'utilities'
  return 'data-sources'
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function AddonsPage() {
  const client = useClient()
  const {
    connect,
    disconnect,
    connections: connectionState,
  } = useDataSourceConnections()
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [activeCategory, setActiveCategory] = useState<AddonCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Dialogs
  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)

  const [selectedAddon, setSelectedAddon] = useState<AddonItem | null>(null)
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(
    null,
  )
  const [installVersions, setInstallVersions] = useState<
    { value: string; label: string }[]
  >([])
  const [isInstalling, setIsInstalling] = useState(false)

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const workspaceQueryKey = ['workspace', workspaceId]

  const { data: workspace } = useQuery({
    queryKey: workspaceQueryKey,
    queryFn: async () => {
      if (!workspaceId) return null
      const res = await client.services.workspaces.getById({
        body: { workspaceId },
      })
      return res.data ?? null
    },
    enabled: !!workspaceId,
  })

  const { data: installedList = [] } = useQuery({
    queryKey: ['plugins', 'installed'],
    queryFn: async () => {
      const res = await client.integrations.addons.listInstalled()
      if (!res.isSuccess)
        throw new Error(res.error ?? 'Falha ao listar plugins instalados')
      return res.data ?? []
    },
  })

  const { data: availableList = [] } = useQuery({
    queryKey: ['plugins', 'available'],
    queryFn: async () => {
      const res = await client.integrations.addons.listAvailable()
      if (!res.isSuccess)
        throw new Error(res.error ?? 'Falha ao listar plugins disponíveis')
      return res.data ?? []
    },
  })

  const connections = useMemo(
    () => getConnections(workspace ?? null),
    [workspace],
  )

  // ---------------------------------------------------------------------------
  // Derived addon list
  // ---------------------------------------------------------------------------

  const addons: AddonItem[] = useMemo(() => {
    const byId = new Map<string, AddonManifest>()
    installedList.forEach((m) => byId.set(m.id, m))
    availableList.forEach((m) => {
      if (!byId.has(m.id)) byId.set(m.id, m)
    })

    const realAddons = Array.from(byId.values()).map((m) => {
      const addonConnections: AddonConnection[] = connections
        .filter((c) => connectionMatchesAddon(c, m.id))
        .map((c) => {
          const state = connectionState.find((s) => s.connectionId === c.id)
          return {
            id: c.id,
            name: (c.config?.name as string) || c.id,
            url:
              (c.config?.url as string) ||
              (c.config?.baseUrl as string) ||
              undefined,
            status:
              state?.status === 'connected' ? 'connected' : 'disconnected',
            lastSync: undefined,
          } satisfies AddonConnection
        })
      return manifestToAddonItem(m, addonConnections, addonCategory(m))
    })

    return [...realAddons, ...MOCK_ADDONS]
  }, [installedList, availableList, connections, connectionState])

  const categoryCounts = useMemo(
    () => ({
      all: addons.length,
      'data-sources': addons.filter((a) => a.category === 'data-sources')
        .length,
      utilities: addons.filter((a) => a.category === 'utilities').length,
      themes: addons.filter((a) => a.category === 'themes').length,
      installed: addons.filter((a) => a.installed).length,
      marketplace: addons.filter((a) => !a.installed).length,
    }),
    [addons],
  )

  const filteredAddons = useMemo(() => {
    let result = addons
    if (activeCategory === 'installed')
      result = result.filter((a) => a.installed)
    else if (activeCategory === 'marketplace')
      result = result.filter((a) => !a.installed)
    else if (activeCategory !== 'all')
      result = result.filter((a) => a.category === activeCategory)

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q),
      )
    }
    return result
  }, [addons, activeCategory, searchQuery])

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const linkMutation = useMutation({
    mutationFn: (input: {
      dataSourceId: string
      connectionInstanceId: string
    }) =>
      client.services.workspaces.linkDataSource({
        body: { workspaceId: workspaceId!, ...input },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey }),
    onError: (e: Error) => toast.error(e.message),
  })

  const connectMutation = useMutation({
    mutationFn: (payload: DataSourceInstanceFormData) =>
      connect({
        connectionInstanceId: payload.connectionInstanceId,
        pluginId: payload.pluginId,
        credentials: payload.credentials,
        configuration: payload.configuration,
      }),
    onSuccess: (res) => {
      if (!res?.isSuccess || !res.data) {
        toast.error(res?.error ?? 'Falha ao conectar com DataSource')
        return
      }
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.success(`${res.data.member.login} conectado com sucesso`)
      setConnectionDialogOpen(false)
      setSelectedAddon(null)
      setConnectionTargetId(null)
    },
    onError: (e: Error) => {
      console.error('Unexpected error:', e)
      toast.error('Erro inesperado')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (connectionInstanceId: string) =>
      client.services.workspaces.disconnectDataSource({
        body: { workspaceId: workspaceId!, connectionInstanceId },
      }),
    onSuccess: async (_res, connectionInstanceId) => {
      await disconnect(connectionInstanceId)
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.info('Desconectado.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const unlinkMutation = useMutation({
    mutationFn: (connectionInstanceId: string) =>
      client.services.workspaces.unlinkDataSource({
        body: { workspaceId: workspaceId!, connectionInstanceId },
      }),
    onSuccess: async (_res, connectionInstanceId) => {
      await disconnect(connectionInstanceId)
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.info('Fonte removida.')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleInstall = (addon: AddonItem, version: string) => {
    if (!addon.installerManifestUrl) return
    setIsInstalling(true)
    client.integrations.addons
      .getInstaller({ body: { installerUrl: addon.installerManifestUrl } })
      .then((installer) => {
        const pkg = installer.data?.packages.find((p) => p.version === version)
        if (!pkg) throw new Error('Versão não encontrada.')
        return client.integrations.addons.install({
          body: { downloadUrl: pkg.downloadUrl },
        })
      })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['plugins'] })
        toast.success('Plugin instalado.')
        setInstallDialogOpen(false)
      })
      .catch((e: Error) => toast.error(e?.message ?? 'Erro na instalação'))
      .finally(() => setIsInstalling(false))
  }

  const handleOpenInstallDialog = (addon: AddonItem) => {
    if (!addon.installerManifestUrl) {
      setSelectedAddon(addon)
      setDetailsDialogOpen(true)
      return
    }
    setSelectedAddon(addon)
    client.integrations.addons
      .getInstaller({ body: { installerUrl: addon.installerManifestUrl } })
      .then(
        (installer) => {
          setInstallVersions(
            installer.data?.packages.map((p) => ({
              value: p.version,
              label: `v${p.version}`,
            })) ?? [],
          )
          setInstallDialogOpen(true)
        },
        (error: Error) => toast.error(error.message),
      )
  }

  const handleAddConnection = async (addon: AddonItem) => {
    setSelectedAddon(addon)
    const unique = crypto.randomUUID().slice(0, 8)
    const newId = `${addon.id}-${unique}`
    try {
      await linkMutation.mutateAsync({
        dataSourceId: addon.id,
        connectionInstanceId: newId,
      })
      setConnectionTargetId(newId)
      setConnectionDialogOpen(true)
    } catch {
      // erro via toast
    }
  }

  const handleOpenSettings = (
    addon: AddonItem,
    connection: AddonConnection,
  ) => {
    const state = connectionState.find((s) => s.connectionId === connection.id)
    if (state?.status === 'connected') {
      toast.error('Desconecte antes de reconfigurar esta instância.')
      return
    }
    setSelectedAddon(addon)
    setConnectionTargetId(connection.id)
    setConnectionDialogOpen(true)
  }

  const handleConnectDataSource = (data: DataSourceInstanceFormData) => {
    connectMutation.mutate(data)
  }

  const handleDisconnect = (_addon: AddonItem, connection: AddonConnection) => {
    disconnectMutation.mutate(connection.id)
  }

  const handleUninstall = (_addon: AddonItem, connection: AddonConnection) => {
    unlinkMutation.mutate(connection.id)
  }

  async function handleImport(files: FileList) {
    const file = files[0]
    if (!file) return
    const buf = await file.arrayBuffer()
    const res = await client.integrations.addons.import({
      body: { addon: new Uint8Array(buf) },
    })
    if (!res.isSuccess) {
      toast.error('Falha ao importar.')
      return
    }
    toast.success('Importado.')
    queryClient.invalidateQueries({ queryKey: ['plugins'] })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border border-b">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-foreground text-2xl font-semibold">
                Plugins
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Gerencie múltiplas conexões e extensões para este workspace
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder="Buscar plugins..."
                  className="bg-secondary border-border w-[280px] pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <FileUploadButton
                size="sm"
                accept=".tladdon"
                onFileSelect={handleImport}
              >
                <span className="flex items-center">
                  <UploadIcon className="mr-2 h-4 w-4" />
                  Importar
                </span>
              </FileUploadButton>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6">
          <AddonCategorySidebar
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            counts={categoryCounts}
          />
          <ScrollArea className="h-[calc(100vh-200px)] flex-1">
            <div className="pr-4">
              <AddonList
                addons={filteredAddons}
                onInstall={handleOpenInstallDialog}
                onDetails={(a) => {
                  setSelectedAddon(a)
                  setDetailsDialogOpen(true)
                }}
                onAddConnection={handleAddConnection}
                onOpenSettings={handleOpenSettings}
                onDisconnect={handleDisconnect}
                onUpdate={() => toast.info('Atualização em breve.')}
                onUninstall={handleUninstall}
              />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Install dialog */}
      <InstallPluginDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        addon={selectedAddon}
        versions={installVersions}
        onInstall={handleInstall}
        isInstalling={isInstalling}
      />

      {/* Connection dialog — uses NewDataSourceInstanceForm directly */}
      <Dialog
        open={connectionDialogOpen}
        onOpenChange={(open) => {
          setConnectionDialogOpen(open)
          if (!open) {
            setConnectionTargetId(null)
            setSelectedAddon(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedAddon?.logo && (
                <span className="bg-secondary flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border">
                  <img
                    src={selectedAddon.logo}
                    alt={selectedAddon.name}
                    className="h-6 w-6 object-contain"
                  />
                </span>
              )}
              Conectar {selectedAddon?.name}
            </DialogTitle>
            <DialogDescription>
              Preencha as credenciais para autenticar esta instância.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {selectedAddon && connectionTargetId && (
              <NewDataSourceInstanceForm
                pluginId={selectedAddon.id}
                connectionInstanceId={connectionTargetId}
                isSubmitting={connectMutation.isPending}
                onSubmit={handleConnectDataSource}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Details dialog */}
      <AddonDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        addon={selectedAddon}
        onInstall={(a) => {
          setDetailsDialogOpen(false)
          handleOpenInstallDialog(a)
        }}
      />
    </div>
  )
}
