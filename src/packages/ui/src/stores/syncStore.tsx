'use client'

import { IApplicationAPI } from '@metric-org/application'
import type { IHeaders } from '@metric-org/cross-cutting/transport'
import { TimeEntryViewModel } from '@metric-org/presentation/view-models'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
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

import { useEnvironment, useWorkspace } from '@/hooks'
import { useClient } from '@/hooks/use-client'
import { automationsSchema } from '@/local-db/schemas/automations-schema'
import { kanbanColumnsSchema } from '@/local-db/schemas/kanban-column-schema'
import { kanbanTaskColumnsSchema } from '@/local-db/schemas/kanban-task-columns-schema'
import {
  metadataSyncSchema,
  SyncMetadataRxDBDTO,
} from '@/local-db/schemas/metadata-sync-schema'
import {
  SyncTaskRxDBDTO,
  tasksSyncSchema,
} from '@/local-db/schemas/tasks-sync-schema'
import {
  SyncTimeEntryRxDBDTO,
  timeEntriesSyncSchema,
} from '@/local-db/schemas/time-entries-sync-schema'

// --- TYPES ---
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
export interface DataSourceRef {
  id: string
  dataSourceId: string
}

// --- HELPERS ---
const compositeId = (connId: string, extId: string) => `${connId}::${extId}`
const dateToISO = (val: any) =>
  val instanceof Date ? val.toISOString() : val ? String(val) : undefined

async function resolveBearerHeaders(
  client: IApplicationAPI,
  workspaceId: string,
  connectionInstanceId: string,
): Promise<IHeaders | undefined> {
  try {
    const res = await client.modules.tokenStorage.getToken({
      body: {
        service: 'metric',
        account: `jwt-${workspaceId}-${connectionInstanceId}`,
      },
    })
    if (res.isSuccess && res.data)
      return { authorization: `Bearer ${res.data}` }
  } catch (e) {
    console.error(`[SYNC] Falha ao resolver token:`, e)
  }
  return undefined
}

// --- STRATEGIES ---
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
    const headers = await resolveBearerHeaders(
      this.client,
      this.workspaceId,
      this.connectionInstanceId,
    )
    if (!headers) throw new Error('MISSING_TOKEN')

    const syncId = `metadata_sync_${this.connectionInstanceId}`
    if (checkpoint?.id === syncId) return { documents: [], checkpoint }

    const res = await this.client.services.metadata.pull({
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
      ...{ headers },
    })

    if (!res.data)
      return {
        documents: [],
        checkpoint: checkpoint || {
          updatedAt: new Date(0).toISOString(),
          id: '',
        },
      }
    const now = new Date().toISOString()
    const doc: SyncMetadataRxDBDTO = {
      _id: compositeId(this.connectionInstanceId, 'metadata'),
      _deleted: false,
      dataSourceId: this.pluginId,
      connectionInstanceId: this.connectionInstanceId,
      id: 'metadata',
      participantRoles: res.data.participantRoles || [],
      estimationTypes: res.data.estimationTypes || [],
      trackStatuses: res.data.trackStatuses || [],
      taskStatuses: res.data.taskStatuses || [],
      taskPriorities: res.data.taskPriorities || [],
      activities: res.data.activities || [],
      syncedAt: now,
    }
    return { documents: [doc], checkpoint: { updatedAt: now, id: syncId } }
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
    if (!headers) throw new Error('MISSING_TOKEN')
    const res = await this.client.services.tasks.pull({
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
      ...{ headers },
    })
    const data = res.data || []
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }
    const last = data[data.length - 1]
    const docs: SyncTaskRxDBDTO[] = data.map((item: any) => ({
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
      documents: docs,
      checkpoint: {
        updatedAt: dateToISO(last.updatedAt)!,
        id: String(last.id),
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
    if (!headers) throw new Error('MISSING_TOKEN')
    const mRes = await this.client.services.workspaces.getConnectionMember({
      body: {
        workspaceId: this.workspaceId,
        connectionInstanceId: this.connectionInstanceId,
      },
      ...{ headers },
    })
    const mId = mRes?.data?.id != null ? String(mRes.data.id) : ''
    if (!mId) throw new Error('MEMBER_NOT_FOUND')
    const res = await this.client.services.timeEntries.pull({
      body: {
        workspaceId: this.workspaceId,
        pluginId: this.pluginId,
        connectionInstanceId: this.connectionInstanceId,
        memberId: mId,
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
      ...{ headers },
    })
    const data: TimeEntryViewModel[] = res || [] //nao mexer ja vem no formato correto
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }
    const last = data[data.length - 1]
    const docs: SyncTimeEntryRxDBDTO[] = data.map((item: any) => ({
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
      documents: docs,
      checkpoint: {
        updatedAt: dateToISO(last.updatedAt)!,
        id: String(last.id),
      },
    }
  }
  async push() {
    return []
  }
}

// --- MODULE ---
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
      retryTime: 30000,
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
        if (!isActive)
          this.options.onStatusChange({
            isActive,
            isPulling: false,
            isPushing: false,
            lastReplication: new Date(),
          })
        else this.options.onStatusChange({ isActive })
      }),
      this.instance.error$.subscribe((error) =>
        this.options.onStatusChange({
          error,
          isPulling: false,
          isPushing: false,
        }),
      ),
    )
    if (this.options.resyncSeconds && this.options.resyncSeconds > 0) {
      this.resyncInterval = setInterval(
        () => this.instance?.reSync(),
        this.options.resyncSeconds * 1000,
      )
    }
  }
  async destroy() {
    if (this.resyncInterval) clearInterval(this.resyncInterval)
    this.subs.forEach((s) => s.unsubscribe())
    if (this.instance) await this.instance.cancel()
    this.instance = undefined
  }
}

// --- STORE CORE ---
export const createSyncStore = (
  workspaceId: string,
  dataSources: DataSourceRef[],
  client: IApplicationAPI,
  isDevelopment: boolean,
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
        if (isDevelopment) {
          const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode')
          addRxPlugin(RxDBDevModePlugin)
        }

        const { RxDBQueryBuilderPlugin } =
          await import('rxdb/plugins/query-builder')
        addRxPlugin(RxDBQueryBuilderPlugin)

        const db = await createRxDatabase<AppCollections>({
          name: `db-${workspaceId}`,
          storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
          ignoreDuplicate: true,
          multiInstance: false,
          eventReduce: true,
          allowSlowCount: true,
        })
        await db.addCollections({
          metadata: { schema: metadataSyncSchema },
          tasks: { schema: tasksSyncSchema },
          timeEntries: { schema: timeEntriesSyncSchema },
          kanbanColumns: { schema: kanbanColumnsSchema },
          kanbanTaskColumns: { schema: kanbanTaskColumnsSchema },
          automations: { schema: automationsSchema },
        })

        const initialCheckpoint = {
          updatedAt: new Date(Date.now() - 5184000000).toISOString(),
          id: '',
        } // 60 dias

        for (const ds of dataSources) {
          const hasToken = await resolveBearerHeaders(
            client,
            workspaceId,
            ds.id,
          )
          if (!hasToken) {
            ;['metadata', 'tasks', 'timeEntries'].forEach((col) => {
              set((state) => ({
                statuses: {
                  ...state.statuses,
                  [`${col}_${ds.id}`]: {
                    isActive: false,
                    isPulling: false,
                    isPushing: false,
                    lastReplication: null,
                    error: new Error('MISSING_TOKEN'),
                  },
                },
              }))
            })
            continue
          }

          const configs = [
            {
              name: 'metadata',
              strategy: new MetadataStrategy(
                client,
                workspaceId,
                ds.id,
                ds.dataSourceId,
              ),
              interval: 3600,
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
                      [`${config.name}_${ds.id}`]: {
                        ...state.statuses[`${config.name}_${ds.id}`],
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
        set({ db, isInitialized: true })
      } catch (err) {
        console.error('[SYNC] Erro:', err)
        throw err
      }
    },
  }))
}

// --- PROVIDER ---
export const SyncProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isDevelopment } = useEnvironment()
  const { workspace } = useWorkspace()
  const client = useClient()
  const [activeStore, setActiveStore] = useState<StoreApi<SyncStore> | null>(
    null,
  )

  // Refs para controle de instância única de BANCO
  const currentWorkspaceId = useRef<string | null>(null)

  // Memoizamos os dataSources para evitar loops
  const dataSources = useMemo(
    () =>
      workspace?.dataSourceConnections?.map((c) => ({
        id: c.id,
        dataSourceId: c.dataSourceId,
      })) ?? [],
    [workspace?.dataSourceConnections],
  )

  useEffect(() => {
    const nextWorkspaceId = workspace?.id ?? null

    // 1. Se mudou o WORKSPACE, precisamos destruir e criar um banco novo
    if (currentWorkspaceId.current !== nextWorkspaceId) {
      if (activeStore) {
        activeStore.getState().destroy()
        setActiveStore(null)
      }

      if (nextWorkspaceId) {
        const newStore = createSyncStore(
          nextWorkspaceId,
          dataSources,
          client,
          isDevelopment,
        )
        currentWorkspaceId.current = nextWorkspaceId
        newStore
          .getState()
          .init()
          .then(() => setActiveStore(newStore))
      } else {
        currentWorkspaceId.current = null
      }
      return
    }

    // 2. Se o workspace é o MESMO, mas as conexões mudaram (login/vínculo)
    // precisamos REINICIALIZAR o store atual para que ele verifique tokens novos
    if (activeStore && nextWorkspaceId) {
      // Pequeno truque: chamamos o init novamente.
      // Como o init tem o check 'if (get().isInitialized) return', precisamos ajustar o store
      // Mas a forma mais limpa aqui é recriar o store se houver mudança de conexão
      // para garantir que os ReplicationModules sejam criados para os novos tokens.

      activeStore
        .getState()
        .destroy()
        .then(() => {
          const refreshedStore = createSyncStore(
            nextWorkspaceId,
            dataSources,
            client,
            isDevelopment,
          )
          refreshedStore
            .getState()
            .init()
            .then(() => setActiveStore(refreshedStore))
        })
    }
  }, [workspace?.id, dataSources, client]) // Reage a qualquer mudança nas conexões (login inclusive)

  if (!activeStore) return <>{children}</>
  return (
    <SyncStoreContext.Provider value={activeStore}>
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
