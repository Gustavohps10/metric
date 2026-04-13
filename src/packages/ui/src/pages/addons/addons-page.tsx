'use client'

import {
  AddonManifest,
  FieldGroup,
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
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useDataSourceConnections } from '@/hooks'
import { useClient } from '@/hooks/use-client'
import { queryClient } from '@/lib'

import {
  type AddonCategory,
  AddonCategorySidebar,
} from './addon-category-sidebar'
import {
  AddConnectionDialog,
  AddonDetailsDialog,
  type ConnectionFormData,
  InstallPluginDialog,
} from './addon-dialogs'
import { AddonList } from './addon-list'
import type { AddonConnection, AddonItem } from './addon-types'

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

export function AddonsPage() {
  const client = useClient()
  const { connect, disconnect, membersByConnection } =
    useDataSourceConnections()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [activeCategory, setActiveCategory] = useState<AddonCategory>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const [installDialogOpen, setInstallDialogOpen] = useState(false)
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false)

  /** Agora rastreamos a instância específica que está sendo configurada */
  const [connectionTargetId, setConnectionTargetId] = useState<string | null>(
    null,
  )

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [selectedAddon, setSelectedAddon] = useState<AddonItem | null>(null)
  const [installVersions, setInstallVersions] = useState<
    { value: string; label: string }[]
  >([])
  const [isInstalling, setIsInstalling] = useState(false)

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
    queryFn: () => client.integrations.addons.listInstalled(),
  })

  const { data: availableList = [] } = useQuery({
    queryKey: ['plugins', 'available'],
    queryFn: () => client.integrations.addons.listAvailable(),
  })

  const connections = useMemo(
    () => getConnections(workspace ?? null),
    [workspace],
  )

  const { data: connectionFields } = useQuery({
    queryKey: ['datasource-fields', selectedAddon?.id],
    queryFn: () => {
      console.log('ADDON SELECTED', selectedAddon)
      return client.services.workspaces.getDataSourceFields({
        body: { pluginId: selectedAddon!.id },
      })
    },
    enabled: !!selectedAddon?.id && connectionDialogOpen,
  })

  const dynamicFields = connectionFields ?? {
    credentials: [] as FieldGroup[],
    configuration: [] as FieldGroup[],
  }

  const addons: AddonItem[] = useMemo(() => {
    const byId = new Map<string, AddonManifest>()
    installedList.forEach((m) => byId.set(m.id, m))
    availableList.forEach((m) => {
      if (!byId.has(m.id)) byId.set(m.id, m)
    })
    const list = Array.from(byId.values())

    const realAddons = list.map((m) => {
      const connsForAddon = connections.filter((c) =>
        connectionMatchesAddon(c, m.id),
      )

      const addonConnections: AddonConnection[] = connsForAddon.map((c) => {
        const session = membersByConnection[c.id]
        return {
          id: c.id,
          name: (c.config?.name as string) || c.id,
          url:
            (c.config?.url as string) ||
            (c.config?.baseUrl as string) ||
            undefined,
          status: session?.isAuthenticated ? 'connected' : 'disconnected',
          lastSync: undefined,
        }
      })

      return manifestToAddonItem(m, addonConnections, addonCategory(m))
    })

    return [...realAddons, ...MOCK_ADDONS]
  }, [installedList, availableList, connections, membersByConnection])

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

  const linkMutation = useMutation({
    mutationFn: (input: {
      dataSourceId: string
      connectionInstanceId: string
    }) =>
      client.services.workspaces.linkDataSource({
        body: { workspaceId: workspaceId!, ...input },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
    },
    onError: (e) => toast.error(e.message),
  })

  const connectMutation = useMutation({
    mutationFn: (payload: {
      pluginId: string
      connectionInstanceId: string
      credentials: Record<string, unknown>
      configuration: Record<string, unknown>
    }) =>
      client.services.workspaces.connectDataSource({
        body: {
          workspaceId: workspaceId!,
          pluginId: payload.pluginId,
          connectionInstanceId: payload.connectionInstanceId,
          credentials: payload.credentials,
          configuration: payload.configuration,
        },
      }),
    onSuccess: (response, variables) => {
      if (!response.isSuccess) {
        toast.error(response.error ?? 'Falha ao conectar.')
        return
      }

      if (response.data?.member && response.data?.token) {
        void connect({
          connectionInstanceId: variables.connectionInstanceId,
          member: response.data.member,
          token: response.data.token,
        })
      }

      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.success('Conectado com sucesso.')
      setConnectionDialogOpen(false)
      setSelectedAddon(null)
      setConnectionTargetId(null)
    },
    onError: (e) => toast.error(e.message),
  })

  const disconnectMutation = useMutation({
    mutationFn: (connectionInstanceId: string) =>
      client.services.workspaces.disconnectDataSource({
        body: { workspaceId: workspaceId!, connectionInstanceId },
      }),
    onSuccess: async (_response, variables) => {
      await disconnect(variables)
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.info('Desconectado.')
    },
    onError: (e) => toast.error(e.message),
  })

  const unlinkMutation = useMutation({
    mutationFn: (connectionInstanceId: string) =>
      client.services.workspaces.unlinkDataSource({
        body: { workspaceId: workspaceId!, connectionInstanceId },
      }),
    onSuccess: async (_response, variables) => {
      await disconnect(variables)
      queryClient.invalidateQueries({ queryKey: workspaceQueryKey })
      toast.info('Fonte removida.')
    },
    onError: (e) => toast.error(e.message),
  })

  const handleInstall = (addon: AddonItem, version: string) => {
    if (!addon.installerManifestUrl) return
    setIsInstalling(true)
    client.integrations.addons
      .getInstaller({ body: { installerUrl: addon.installerManifestUrl } })
      .then((installer) => {
        const pkg = installer.packages.find((p) => p.version === version)
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
      .catch((e) => toast.error(e?.message ?? 'Erro na instalação'))
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
      .then((installer) => {
        setInstallVersions(
          installer.packages.map((p) => ({
            value: p.version,
            label: `v${p.version}`,
          })),
        )
        setInstallDialogOpen(true)
      })
      .catch(() => toast.error('Falha ao carregar versões.'))
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
      /* erro via toast */
    }
  }

  const handleOpenSettings = (
    addon: AddonItem,
    connection: AddonConnection,
  ) => {
    const session = membersByConnection[connection.id]

    /** Regra: Só deixa configurar se está desconectado */
    if (session?.isAuthenticated) {
      toast.error('Desconecte antes de reconfigurar esta instância.')
      return
    }

    setSelectedAddon(addon)
    setConnectionTargetId(connection.id)
    setConnectionDialogOpen(true)
  }

  const handleSaveConnection = (addon: AddonItem, data: ConnectionFormData) => {
    if (!connectionTargetId) return
    connectMutation.mutate({
      pluginId: addon.id,
      connectionInstanceId: connectionTargetId,
      credentials: data.credentials,
      configuration: data.configuration,
    })
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

  return (
    <div className="bg-background min-h-screen">
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
                <UploadIcon className="mr-2 h-4 w-4" />
                Importar
              </FileUploadButton>
            </div>
          </div>
        </div>
      </header>

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
                onOpenSettings={(addon, conn) =>
                  handleOpenSettings(addon, conn)
                }
                onSyncNow={() => toast.info('Sincronizar em breve.')}
                onDisconnect={handleDisconnect}
                onUpdate={() => toast.info('Atualização em breve.')}
                onDisable={() => toast.info('Desativar em breve.')}
                onUninstall={handleUninstall}
              />
            </div>
          </ScrollArea>
        </div>
      </div>

      <InstallPluginDialog
        open={installDialogOpen}
        onOpenChange={setInstallDialogOpen}
        addon={selectedAddon}
        versions={installVersions}
        onInstall={handleInstall}
        isInstalling={isInstalling}
      />
      <AddConnectionDialog
        open={connectionDialogOpen}
        onOpenChange={(open) => {
          setConnectionDialogOpen(open)
          if (!open) setConnectionTargetId(null)
        }}
        addon={selectedAddon}
        dynamicFields={dynamicFields}
        onSave={handleSaveConnection}
        isSaving={connectMutation.isPending}
      />
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
