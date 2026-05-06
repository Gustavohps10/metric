'use client'

import { IApplicationAPI } from '@metric-org/application'
import {
  TaskViewModel,
  TimeEntryViewModel,
} from '@metric-org/shared/view-models'
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

import {
  type ConnectionInstanceId,
  useDataSourceConnections,
} from '@/contexts/DataSourceConnectionsContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useEnvironment } from '@/hooks'
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
  drop: () => Promise<void>
  connectDataSource: (params: {
    connectionInstanceId: ConnectionInstanceId
    dataSourceId: string
  }) => Promise<void>
  disconnectDataSource: (
    connectionInstanceId: ConnectionInstanceId,
  ) => Promise<void>
}
export interface DataSourceRef {
  id: string
  dataSourceId: string
}

// --- STORAGE ---
const createAppStorage = () =>
  wrappedValidateAjvStorage({ storage: getRxStorageDexie() })

const dropAppStorage = async (dbName: string) => {
  const allDbs = await indexedDB.databases()
  console.log('DELETANDO', allDbs)
  await Promise.all(
    allDbs
      .filter((d) => d.name?.includes(dbName))
      .map(
        (d) =>
          new Promise<void>((resolve) => {
            const req = indexedDB.deleteDatabase(d.name!)
            req.onsuccess = () => resolve()
            req.onerror = () => resolve()
            req.onblocked = () => resolve()
          }),
      ),
  )
}

// --- HELPERS ---
const compositeId = (connId: string, extId: string) => `${connId}::${extId}`
const dateToISO = (
  val: Date | string | null | undefined,
): string | undefined =>
  val instanceof Date ? val.toISOString() : val ? String(val) : undefined

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

  async pull(
    checkpoint: ReplicationCheckpoint | undefined,
    batchSize: number,
  ): Promise<{
    documents: SyncMetadataRxDBDTO[]
    checkpoint: ReplicationCheckpoint
  }> {
    const syncId = `metadata_sync_${this.connectionInstanceId}`
    if (checkpoint?.id === syncId) return { documents: [], checkpoint }

    const res = await this.client.services.metadata.pull({
      body: {
        workspaceId: this.workspaceId,
        connectionInstanceId: this.connectionInstanceId,
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
    })

    if (!res.data)
      return {
        documents: [],
        checkpoint: checkpoint ?? {
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

  async push(): Promise<unknown[]> {
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

  async pull(
    checkpoint: ReplicationCheckpoint | undefined,
    batchSize: number,
  ): Promise<{
    documents: SyncTaskRxDBDTO[]
    checkpoint: ReplicationCheckpoint
  }> {
    const res = await this.client.services.tasks.pull({
      body: {
        workspaceId: this.workspaceId,
        connectionInstanceId: this.connectionInstanceId,
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
    })

    const data = res.data || []
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }
    const last = data[data.length - 1]
    const docs: SyncTaskRxDBDTO[] = data.map((item: TaskViewModel) => ({
      ...item,
      _id: compositeId(this.connectionInstanceId, String(item.id)),
      dataSourceId: this.pluginId,
      connectionInstanceId: this.connectionInstanceId,
      _deleted: false,
      createdAt: dateToISO(item.createdAt)!,
      updatedAt: dateToISO(item.updatedAt)!,
      startDate: dateToISO(item.startDate),
      dueDate: dateToISO(item.dueDate),
      timeEntryIds: [],
      statusChanges: item.statusChanges?.map((c) => ({
        fromStatus: c.fromStatus,
        toStatus: c.toStatus,
        description: c.description,
        changedBy: c.changedBy,
        changedAt: dateToISO(c.changedAt)!,
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

  async push(): Promise<unknown[]> {
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

  async pull(
    checkpoint: ReplicationCheckpoint | undefined,
    batchSize: number,
  ): Promise<{
    documents: SyncTimeEntryRxDBDTO[]
    checkpoint: ReplicationCheckpoint
  }> {
    console.log('ATIVADO PULL', this)
    const res = await this.client.services.timeEntries.pull({
      body: {
        workspaceId: this.workspaceId,
        connectionInstanceId: this.connectionInstanceId,
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
    })

    const data: TimeEntryViewModel[] = res.data || []
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }
    const last = data[data.length - 1]

    const docs: SyncTimeEntryRxDBDTO[] = data.map(
      (item: TimeEntryViewModel): SyncTimeEntryRxDBDTO => ({
        _id: compositeId(this.connectionInstanceId, String(item.id)),
        _deleted: false,
        id: String(item.id),
        dataSourceId: this.pluginId,
        connectionInstanceId: this.connectionInstanceId,
        task: item.task,
        activity: item.activity,
        user: item.user,
        timeSpent: item.timeSpent,
        comments: item.comments,
        startDate: dateToISO(item.startDate),
        endDate: dateToISO(item.endDate),
        createdAt: dateToISO(item.createdAt)!,
        updatedAt: dateToISO(item.updatedAt)!,
        syncedAt: new Date().toISOString(),
      }),
    )

    return {
      documents: docs,
      checkpoint: {
        updatedAt: dateToISO(last.updatedAt)!,
        id: String(last.id),
      },
    }
  }

  async push(): Promise<unknown[]> {
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

// --- REPLICATION MAP ---
type ReplicationMap = Map<ConnectionInstanceId, Map<string, ReplicationModule>>

// --- COLLECTION CONFIGS ---
type CollectionConfig = {
  name: keyof Pick<AppCollections, 'metadata' | 'tasks' | 'timeEntries'>
  strategyFactory: (
    client: IApplicationAPI,
    workspaceId: string,
    connectionInstanceId: string,
    dataSourceId: string,
  ) => IReplicationStrategy<unknown, unknown>
  interval: number
  batch: number
}

const COLLECTION_CONFIGS: CollectionConfig[] = [
  {
    name: 'metadata',
    strategyFactory: (client, workspaceId, connId, dsId) =>
      new MetadataStrategy(
        client,
        workspaceId,
        connId,
        dsId,
      ) as IReplicationStrategy<unknown, unknown>,
    interval: 3600,
    batch: 1,
  },
  {
    name: 'tasks',
    strategyFactory: (client, workspaceId, connId, dsId) =>
      new TasksStrategy(
        client,
        workspaceId,
        connId,
        dsId,
      ) as IReplicationStrategy<unknown, unknown>,
    interval: 300,
    batch: 30,
  },
  {
    name: 'timeEntries',
    strategyFactory: (client, workspaceId, connId, dsId) =>
      new TimeEntriesStrategy(
        client,
        workspaceId,
        connId,
        dsId,
      ) as IReplicationStrategy<unknown, unknown>,
    interval: 60,
    batch: 30,
  },
]

// --- STORE CORE ---
export const createSyncStore = (
  workspaceId: string,
  client: IApplicationAPI,
  isDevelopment: boolean,
): StoreApi<SyncStore> => {
  const replications: ReplicationMap = new Map()

  const initialCheckpoint: ReplicationCheckpoint = {
    updatedAt: new Date(Date.now() - 5184000000).toISOString(), // 60 dias
    id: '',
  }

  const startConnectionModules = async (
    db: AppDatabase,
    connectionInstanceId: ConnectionInstanceId,
    dataSourceId: string,
    set: (fn: (state: SyncStore) => Partial<SyncStore>) => void,
  ) => {
    const connectionModules = new Map<string, ReplicationModule>()

    for (const config of COLLECTION_CONFIGS) {
      const strategy = config.strategyFactory(
        client,
        workspaceId,
        connectionInstanceId,
        dataSourceId,
      )

      const module = new ReplicationModule(
        db[config.name] as RxCollection,
        strategy,
        {
          identifier: `rep_${config.name}_${workspaceId}_${connectionInstanceId}`,
          resyncSeconds: config.interval,
          batchSize: config.batch,
          initialCheckpoint,
          onStatusChange: (status) =>
            set((state) => ({
              statuses: {
                ...state.statuses,
                [`${config.name}_${connectionInstanceId}`]: {
                  ...state.statuses[`${config.name}_${connectionInstanceId}`],
                  ...status,
                },
              },
            })),
        },
      )

      await module.start()
      connectionModules.set(config.name, module)
    }

    replications.set(connectionInstanceId, connectionModules)
  }

  const destroyConnectionModules = async (
    connectionInstanceId: ConnectionInstanceId,
    set: (fn: (state: SyncStore) => Partial<SyncStore>) => void,
  ) => {
    const connectionModules = replications.get(connectionInstanceId)
    if (!connectionModules) return

    await Promise.all(
      Array.from(connectionModules.values()).map((m) => m.destroy()),
    )
    replications.delete(connectionInstanceId)

    set((state) => {
      const nextStatuses = { ...state.statuses }
      COLLECTION_CONFIGS.forEach((config) => {
        delete nextStatuses[`${config.name}_${connectionInstanceId}`]
      })
      return { statuses: nextStatuses }
    })
  }

  const destroyAllModules = async () => {
    await Promise.all(
      Array.from(replications.values()).flatMap((connectionModules) =>
        Array.from(connectionModules.values()).map((m) => m.destroy()),
      ),
    )
    replications.clear()
  }

  return createStore<SyncStore>((set, get) => ({
    db: null,
    statuses: {},
    isInitialized: false,

    connectDataSource: async ({ connectionInstanceId, dataSourceId }) => {
      const { db } = get()
      if (!db) return
      await destroyConnectionModules(connectionInstanceId, set)
      await startConnectionModules(db, connectionInstanceId, dataSourceId, set)
    },

    disconnectDataSource: async (connectionInstanceId) => {
      await destroyConnectionModules(connectionInstanceId, set)
    },

    drop: async () => {
      const { db } = get()
      if (!db) return
      await destroyAllModules()
      await db.remove()
      await dropAppStorage(`db-${workspaceId}`)
      set({ db: null, isInitialized: false, statuses: {} })
    },

    destroy: async () => {
      const { db } = get()
      await destroyAllModules()
      if (db) await db.close()
      set({ db: null, isInitialized: false, statuses: {} })
    },

    init: async () => {
      console.log('SYCRONIZADOR INICIALIZANDO....')

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
          storage: createAppStorage(),
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
  const { connections } = useDataSourceConnections()

  const [activeStore, setActiveStore] = useState<StoreApi<SyncStore> | null>(
    null,
  )

  const currentWorkspaceId = useRef<string | null>(null)
  const activeStoreRef = useRef<StoreApi<SyncStore> | null>(null)
  activeStoreRef.current = activeStore

  const startedConnections = useRef<
    Map<ConnectionInstanceId, { dataSourceId: string }>
  >(new Map())

  // Workspace muda → recria o banco do zero
  useEffect(() => {
    const nextWorkspaceId = workspace?.id ?? null

    if (currentWorkspaceId.current === nextWorkspaceId) return

    if (activeStoreRef.current) {
      activeStoreRef.current.getState().destroy()
      setActiveStore(null)
      startedConnections.current.clear()
    }

    currentWorkspaceId.current = nextWorkspaceId

    if (!nextWorkspaceId) return

    const newStore = createSyncStore(nextWorkspaceId, client, isDevelopment)
    newStore
      .getState()
      .init()
      .then(() => setActiveStore(newStore))
      .catch((err) => console.error('[SYNC] Erro ao inicializar store:', err))
  }, [workspace?.id])

  // Connections mudam → liga/desliga motores individualmente
  useEffect(() => {
    const store = activeStoreRef.current
    if (!store) return

    const { isInitialized, connectDataSource, disconnectDataSource } =
      store.getState()
    if (!isInitialized) return

    connections.forEach((conn) => {
      const connId = conn.connectionId
      const isAlreadyStarted = startedConnections.current.has(connId)

      if (conn.status === 'connected' && !isAlreadyStarted) {
        if (!conn.dataSourceId) return

        startedConnections.current.set(connId, {
          dataSourceId: conn.dataSourceId,
        })

        console.log('[SYNC] STARTING', connId)

        connectDataSource({
          connectionInstanceId: connId,
          dataSourceId: conn.dataSourceId,
        }).catch((err) =>
          console.error(`[SYNC] Erro ao conectar ${connId}:`, err),
        )
      }
    })

    for (const [connId] of startedConnections.current.entries()) {
      const currentConn = connections.find((c) => c.connectionId === connId)

      if (!currentConn || currentConn.status !== 'connected') {
        startedConnections.current.delete(connId)

        console.log('[SYNC] STOPPING', connId)

        disconnectDataSource(connId).catch((err) =>
          console.error(`[SYNC] Erro ao desconectar ${connId}:`, err),
        )
      }
    }
  }, [connections, activeStore])

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

export function useSyncDrop() {
  const storeApi = useContext(SyncStoreContext)
  return () => storeApi?.getState().drop()
}

export async function dropWorkspaceStorage(workspaceId: string) {
  await dropAppStorage(`db-${workspaceId}`)
}

const EMPTY_STATUS: ReplicationStatus = {
  isActive: false,
  isPulling: false,
  isPushing: false,
  lastReplication: null,
  error: null,
}

export function useConnectionsWithSync() {
  const { connections } = useDataSourceConnections()
  const statuses = useSyncStore((s) => s.statuses) ?? {}

  return useMemo(() => {
    return connections.map((conn) => {
      const id = conn.connectionId

      return {
        ...conn,
        sync: {
          metadata: statuses[`metadata_${id}`] ?? EMPTY_STATUS,
          tasks: statuses[`tasks_${id}`] ?? EMPTY_STATUS,
          timeEntries: statuses[`timeEntries_${id}`] ?? EMPTY_STATUS,
        },
      }
    })
  }, [connections, statuses])
}
