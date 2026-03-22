'use client'

import { IApplicationAPI } from '@timelapse/application'
import type { IHeaders } from '@timelapse/cross-cutting/transport'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  addRxPlugin,
  createRxDatabase,
  RxCollection,
  RxDatabase,
  RxError,
} from 'rxdb'
import {
  replicateRxCollection,
  RxReplicationState,
} from 'rxdb/plugins/replication'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv'
import { Subscription } from 'rxjs'
import { createStore, type StoreApi, useStore } from 'zustand'

import { automationsSchema } from '@/db/schemas/automations-schema'
import { kanbanColumnsSchema } from '@/db/schemas/kanban-column-schema'
import { kanbanTaskColumnsSchema } from '@/db/schemas/kanban-task-columns-schema'
import {
  metadataSyncSchema,
  SyncMetadataRxDBDTO,
} from '@/db/schemas/metadata-sync-schema'
import {
  SyncTaskRxDBDTO,
  tasksSyncSchema,
} from '@/db/schemas/tasks-sync-schema'
import {
  SyncTimeEntryRxDBDTO,
  timeEntriesSyncSchema,
} from '@/db/schemas/time-entries-sync-schema'
import { useWorkspace } from '@/hooks'
import { useClient } from '@/hooks/use-client'

export type ReplicationCheckpoint = { updatedAt: string; id: string }

export type AppCollections = {
  timeEntries: RxCollection<SyncTimeEntryRxDBDTO>
  tasks: RxCollection<SyncTaskRxDBDTO>
  metadata: RxCollection<SyncMetadataRxDBDTO>
  kanbanColumns: RxCollection<any>
  kanbanTaskColumns: RxCollection<any>
  automations: RxCollection<any>
}

export type AppDatabase = RxDatabase<AppCollections>

export interface ReplicationStatus {
  isActive: boolean
  isPulling: boolean
  isPushing: boolean
  lastReplication: Date | null
  error: Error | RxError | null
}

export interface IReplicationStrategy<T, C> {
  pull: (
    checkpoint: C | undefined,
    batchSize: number,
  ) => Promise<{ documents: T[]; checkpoint: C }>
  push: (rows: unknown[]) => Promise<unknown[]>
}

export interface SyncState {
  db: AppDatabase | null
  statuses: Record<string, ReplicationStatus>
  isInitialized: boolean
}

export type SyncStore = SyncState & {
  init: () => Promise<void>
  destroy: () => Promise<void>
}

/** Chave composta para isolar dados de instâncias diferentes no IndexedDB */
function compositeId(connectionInstanceId: string, externalId: string): string {
  return `${connectionInstanceId}::${externalId}`
}

/** JWT por instância, garantindo credenciais corretas para cada conta */
async function resolveBearerHeaders(
  client: IApplicationAPI,
  workspaceId: string,
  connectionInstanceId: string,
): Promise<IHeaders | undefined> {
  let token: string | null = null
  try {
    const res = await client.modules.tokenStorage.getToken({
      body: {
        service: 'timelapse',
        account: `jwt-${workspaceId}-${connectionInstanceId}`,
      },
    })
    token = res.isSuccess ? (res.data ?? null) : null
  } catch {
    token = null
  }

  if (!token) return undefined
  return { authorization: `Bearer ${token}` }
}

function normalizeTimeEntriesPullPayload(response: any): any[] {
  if (Array.isArray(response)) return response
  if (response?.data && Array.isArray(response.data)) return response.data
  return []
}

function dateToISO(val: any): string | undefined {
  if (!val) return undefined
  return val instanceof Date ? val.toISOString() : String(val)
}

class MetadataStrategy implements IReplicationStrategy<
  SyncMetadataRxDBDTO,
  ReplicationCheckpoint
> {
  constructor(
    private client: IApplicationAPI,
    private workspaceId: string,
    private connectionInstanceId: string,
    private pluginId: string,
  ) {}

  async pull(checkpoint: ReplicationCheckpoint | undefined, batchSize: number) {
    if (
      checkpoint &&
      checkpoint.id === `metadata_${this.connectionInstanceId}`
    ) {
      return { documents: [], checkpoint }
    }

    const headers = await resolveBearerHeaders(
      this.client,
      this.workspaceId,
      this.connectionInstanceId,
    )
    const response = await this.client.services.metadata.pull({
      body: {
        workspaceId: this.workspaceId,
        pluginId: this.pluginId,
        connectionInstanceId: this.connectionInstanceId,
        memberId: '',
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
      ...(headers ? { headers } : {}),
    })

    if (!response.data) {
      return {
        documents: [],
        checkpoint: checkpoint || { updatedAt: '', id: '' },
      }
    }

    const document: SyncMetadataRxDBDTO = {
      _id: compositeId(this.connectionInstanceId, 'metadata'),
      _deleted: false,
      dataSourceId: this.pluginId,
      connectionInstanceId: this.connectionInstanceId,
      id: 'metadata',
      participantRoles: response.data.participantRoles || [],
      estimationTypes: response.data.estimationTypes || [],
      trackStatuses: response.data.trackStatuses || [],
      taskStatuses: response.data.taskStatuses || [],
      taskPriorities: response.data.taskPriorities || [],
      activities: response.data.activities || [],
      syncedAt: new Date().toISOString(),
    }

    return {
      documents: [document],
      checkpoint: {
        updatedAt: new Date().toISOString(),
        id: `metadata_${this.connectionInstanceId}`,
      },
    }
  }
  async push() {
    return []
  }
}

class TasksStrategy implements IReplicationStrategy<
  SyncTaskRxDBDTO,
  ReplicationCheckpoint
> {
  constructor(
    private client: IApplicationAPI,
    private workspaceId: string,
    private connectionInstanceId: string,
    private pluginId: string,
  ) {}

  async pull(checkpoint: ReplicationCheckpoint | undefined, batchSize: number) {
    const headers = await resolveBearerHeaders(
      this.client,
      this.workspaceId,
      this.connectionInstanceId,
    )
    const response = await this.client.services.tasks.pull({
      body: {
        workspaceId: this.workspaceId,
        pluginId: this.pluginId,
        connectionInstanceId: this.connectionInstanceId,
        memberId: '',
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
      ...(headers ? { headers } : {}),
    })

    const data = response.data || []
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }

    const lastItem = data[data.length - 1]
    const documents: SyncTaskRxDBDTO[] = data.map((item: any) => ({
      ...item,
      _id: compositeId(this.connectionInstanceId, String(item.id)),
      dataSourceId: this.pluginId,
      connectionInstanceId: this.connectionInstanceId,
      _deleted: false,
      createdAt: dateToISO(item.createdAt)!,
      updatedAt: dateToISO(item.updatedAt)!,
      startDate: dateToISO(item.startDate),
      dueDate: dateToISO(item.dueDate),
      timeEntryIds: item.timeEntryIds || [],
      statusChanges: item.statusChanges?.map((c: any) => ({
        ...c,
        changedAt: dateToISO(c.changedAt),
      })),
    }))

    return {
      documents,
      checkpoint: {
        updatedAt: dateToISO(lastItem.updatedAt)!,
        id: String(lastItem.id),
      },
    }
  }
  async push() {
    return []
  }
}

class TimeEntriesStrategy implements IReplicationStrategy<
  SyncTimeEntryRxDBDTO,
  ReplicationCheckpoint
> {
  constructor(
    private client: IApplicationAPI,
    private workspaceId: string,
    private connectionInstanceId: string,
    private pluginId: string,
  ) {}

  async pull(checkpoint: ReplicationCheckpoint | undefined, batchSize: number) {
    const headers = await resolveBearerHeaders(
      this.client,
      this.workspaceId,
      this.connectionInstanceId,
    )

    // Precisamos do memberId específico desta instância para filtrar o pull
    const memberRes = await this.client.services.workspaces.getConnectionMember(
      {
        body: {
          workspaceId: this.workspaceId,
          connectionInstanceId: this.connectionInstanceId,
        },
        ...(headers ? { headers } : {}),
      },
    )

    const memberId =
      memberRes?.data?.id != null ? String(memberRes.data.id) : ''
    if (!memberId) return { documents: [], checkpoint: checkpoint! }

    const response = await this.client.services.timeEntries.pull({
      body: {
        workspaceId: this.workspaceId,
        pluginId: this.pluginId,
        connectionInstanceId: this.connectionInstanceId,
        memberId,
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
      ...(headers ? { headers } : {}),
    })

    const data = normalizeTimeEntriesPullPayload(response)
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }

    const lastItem = data[data.length - 1]
    const documents: SyncTimeEntryRxDBDTO[] = data.map((item: any) => ({
      ...item,
      _id: compositeId(this.connectionInstanceId, String(item.id)),
      dataSourceId: this.pluginId,
      connectionInstanceId: this.connectionInstanceId,
      _deleted: false,
      startDate: dateToISO(item.startDate),
      endDate: dateToISO(item.endDate),
      createdAt: dateToISO(item.createdAt),
      updatedAt: dateToISO(item.updatedAt),
      syncedAt: new Date().toISOString(),
    }))

    return {
      documents,
      checkpoint: {
        updatedAt: dateToISO(lastItem.updatedAt)!,
        id: String(lastItem.id),
      },
    }
  }
  async push() {
    return []
  }
}

class ReplicationModule {
  private instance?: RxReplicationState<unknown, unknown>
  private subs: Subscription[] = []
  private resyncInterval?: NodeJS.Timeout

  constructor(
    private collection: RxCollection,
    private strategy: IReplicationStrategy<unknown, unknown>,
    private options: {
      identifier: string
      batchSize?: number
      resyncSeconds?: number
      initialCheckpoint?: ReplicationCheckpoint
      onStatusChange: (s: Partial<ReplicationStatus>) => void
    },
  ) {}

  async start() {
    if (this.instance) return

    this.instance = replicateRxCollection({
      collection: this.collection,
      replicationIdentifier: this.options.identifier,
      live: true,
      retryTime: 15000,
      pull: {
        batchSize: this.options.batchSize || 25,
        initialCheckpoint: this.options.initialCheckpoint,
        handler: async (cp, batch) => {
          this.options.onStatusChange({ isPulling: true, error: null })
          try {
            return await this.strategy.pull(cp, batch)
          } catch (err) {
            throw err
          }
        },
      },
      push: {
        batchSize: 20,
        handler: (rows) => {
          this.options.onStatusChange({ isPushing: true, error: null })
          return this.strategy.push(rows)
        },
      },
    })

    this.subs.push(
      this.instance.active$.subscribe((isActive) => {
        if (!isActive) {
          this.options.onStatusChange({
            isActive,
            isPulling: false,
            isPushing: false,
            lastReplication: new Date(),
          })
        } else {
          this.options.onStatusChange({ isActive })
        }
      }),
      this.instance.error$.subscribe((error) => {
        this.options.onStatusChange({
          error,
          isPulling: false,
          isPushing: false,
        })
      }),
    )

    if (this.options.resyncSeconds && this.options.resyncSeconds > 0) {
      this.resyncInterval = setInterval(() => {
        this.instance?.reSync()
      }, this.options.resyncSeconds * 1000)
    }
  }

  async destroy() {
    if (this.resyncInterval) clearInterval(this.resyncInterval)
    this.subs.forEach((s) => s.unsubscribe())
    if (this.instance) await this.instance.cancel()
    this.instance = undefined
  }
}

export interface DataSourceRef {
  id: string // connectionInstanceId
  dataSourceId: string // pluginId
}

export const createSyncStore = (
  workspaceId: string,
  dataSources: DataSourceRef[],
  client: IApplicationAPI,
): StoreApi<SyncStore> => {
  const engineModules: ReplicationModule[] = []

  return createStore<SyncStore>((set, get) => ({
    db: null,
    statuses: {},
    isInitialized: false,

    destroy: async () => {
      const { db } = get()
      await Promise.all(engineModules.map((m) => m.destroy()))
      engineModules.length = 0
      if (db) await db.close()
      set({ db: null, isInitialized: false, statuses: {} })
    },

    init: async () => {
      if (get().isInitialized) return

      try {
        const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode')
        const { RxDBQueryBuilderPlugin } =
          await import('rxdb/plugins/query-builder')
        addRxPlugin(RxDBDevModePlugin)
        addRxPlugin(RxDBQueryBuilderPlugin)

        const db = await createRxDatabase<AppCollections>({
          name: `db-${workspaceId}`,
          storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
          ignoreDuplicate: true,
          multiInstance: false,
          eventReduce: true,
        })

        await db.addCollections({
          metadata: { schema: metadataSyncSchema },
          tasks: { schema: tasksSyncSchema },
          timeEntries: { schema: timeEntriesSyncSchema },
          kanbanColumns: { schema: kanbanColumnsSchema },
          kanbanTaskColumns: { schema: kanbanTaskColumnsSchema },
          automations: { schema: automationsSchema },
        })

        const sixtyDaysAgo = new Date()
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
        const initialCheckpoint = {
          updatedAt: sixtyDaysAgo.toISOString(),
          id: '',
        }

        if (dataSources.length > 0) {
          for (const ds of dataSources) {
            const configs = [
              {
                name: 'metadata',
                strategy: new MetadataStrategy(
                  client,
                  workspaceId,
                  ds.id,
                  ds.dataSourceId,
                ),
                interval: 0,
                batch: 1,
              },
              {
                name: 'tasks',
                strategy: new TasksStrategy(
                  client,
                  workspaceId,
                  ds.id,
                  ds.dataSourceId,
                ),
                interval: 300,
                batch: 30,
              },
              {
                name: 'timeEntries',
                strategy: new TimeEntriesStrategy(
                  client,
                  workspaceId,
                  ds.id,
                  ds.dataSourceId,
                ),
                interval: 60,
                batch: 30,
              },
            ]

            for (const config of configs) {
              const statusKey = `${config.name}_${ds.id}`
              const module = new ReplicationModule(
                db[config.name as keyof AppCollections] as RxCollection,
                config.strategy as IReplicationStrategy<unknown, unknown>,
                {
                  identifier: `rep_${config.name}_${workspaceId}_${ds.id}`,
                  resyncSeconds: config.interval,
                  batchSize: config.batch,
                  initialCheckpoint,
                  onStatusChange: (status) =>
                    set((state) => ({
                      statuses: {
                        ...state.statuses,
                        [statusKey]: {
                          ...state.statuses[statusKey],
                          ...(status as ReplicationStatus),
                        },
                      },
                    })),
                },
              )
              await module.start()
              engineModules.push(module)
            }
          }
        }

        set({ db, isInitialized: true })
      } catch (err) {
        console.error('[SYNC] erro no init:', err)
        throw err
      }
    },
  }))
}

export const SyncProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { workspace } = useWorkspace()
  const client = useClient()
  const storeRef = useRef<StoreApi<SyncStore> | null>(null)
  const workspaceIdRef = useRef<string | null>(null)
  const dataSourceKeyRef = useRef<string | null>(null)
  const [, setRefresh] = useState(0)

  // Agora mapeamos a conexão real com pluginId e instanceId
  const dataSources: DataSourceRef[] =
    workspace?.dataSourceConnections?.map((c) => ({
      id: c.id,
      dataSourceId: c.dataSourceId,
    })) ?? []

  const dataSourceIdsKey = dataSources
    .map((d) => d.id)
    .sort()
    .join('|')

  useEffect(() => {
    const changed =
      workspaceIdRef.current !== workspace?.id ||
      dataSourceKeyRef.current !== dataSourceIdsKey
    if (!changed) return

    if (storeRef.current) {
      storeRef.current
        .getState()
        .destroy()
        .then(() => {
          storeRef.current = null
          workspaceIdRef.current = workspace?.id ?? null
          dataSourceKeyRef.current = dataSourceIdsKey
          setRefresh((n) => n + 1)
        })
    } else {
      workspaceIdRef.current = workspace?.id ?? null
      dataSourceKeyRef.current = dataSourceIdsKey
    }
  }, [workspace?.id, dataSourceIdsKey])

  useEffect(() => {
    if (!workspace?.id || storeRef.current) return
    storeRef.current = createSyncStore(workspace.id, dataSources, client)
    void storeRef.current.getState().init()
  }, [workspace?.id, dataSourceIdsKey, client, dataSources])

  if (!storeRef.current) return <>{children}</>

  return (
    <SyncStoreContext.Provider value={storeRef.current}>
      {children}
    </SyncStoreContext.Provider>
  )
}

const SyncStoreContext = createContext<StoreApi<SyncStore> | undefined>(
  undefined,
)

export const useSyncStore = <T,>(
  selector: (store: SyncStore) => T,
): T | undefined => {
  const storeApi = useContext(SyncStoreContext)
  return storeApi ? useStore(storeApi, selector) : undefined
}

export const useSyncActions = (): SyncStore => {
  const storeApi = useContext(SyncStoreContext)
  if (!storeApi)
    return {
      db: null,
      statuses: {},
      isInitialized: false,
      init: async () => {},
      destroy: async () => {},
    }
  return storeApi.getState()
}
