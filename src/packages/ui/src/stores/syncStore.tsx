'use client'

import { IApplicationAPI } from '@timelapse/application'
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

function compositeId(dataSourceId: string, externalId: string): string {
  return `${dataSourceId}::${externalId}`
}

class MetadataStrategy implements IReplicationStrategy<
  SyncMetadataRxDBDTO,
  ReplicationCheckpoint
> {
  constructor(
    private client: IApplicationAPI,
    private workspaceId: string,
    private dataSourceId: string,
  ) {}

  async pull(checkpoint: ReplicationCheckpoint | undefined, batchSize: number) {
    if (checkpoint && checkpoint.id === `metadata_${this.dataSourceId}`) {
      return { documents: [], checkpoint }
    }

    const response = await this.client.services.metadata.pull({
      body: {
        workspaceId: this.workspaceId,
        dataSourceId: this.dataSourceId,
        memberId: '',
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
    })

    if (!response.data)
      return {
        documents: [],
        checkpoint: checkpoint || { updatedAt: '', id: '' },
      }

    const document: SyncMetadataRxDBDTO = JSON.parse(
      JSON.stringify({
        _id: compositeId(this.dataSourceId, 'metadata'),
        _deleted: false,
        dataSourceId: this.dataSourceId,
        id: 'metadata',
        participantRoles: response.data.participantRoles || [],
        estimationTypes: response.data.estimationTypes || [],
        trackStatuses: response.data.trackStatuses || [],
        taskStatuses: response.data.taskStatuses || [],
        taskPriorities: response.data.taskPriorities || [],
        activities: response.data.activities || [],
        syncedAt: '1970-01-01T00:00:00.000Z',
      }),
    )

    return {
      documents: [document],
      checkpoint: {
        updatedAt: '1970-01-01T00:00:00.000Z',
        id: `metadata_${this.dataSourceId}`,
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
    private dataSourceId: string,
  ) {}

  async pull(checkpoint: ReplicationCheckpoint | undefined, batchSize: number) {
    const response = await this.client.services.tasks.pull({
      body: {
        workspaceId: this.workspaceId,
        dataSourceId: this.dataSourceId,
        memberId: '',
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
    })

    const data = response.data || []
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }

    const lastItem = data[data.length - 1]
    const documents: SyncTaskRxDBDTO[] = JSON.parse(
      JSON.stringify(
        data.map((item) => ({
          ...item,
          _id: compositeId(this.dataSourceId, String(item.id)),
          dataSourceId: this.dataSourceId,
          _deleted: false,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : item.createdAt,
          updatedAt:
            item.updatedAt instanceof Date
              ? item.updatedAt.toISOString()
              : item.updatedAt,
          startDate: item.startDate
            ? item.startDate instanceof Date
              ? item.startDate.toISOString()
              : item.startDate
            : undefined,
          dueDate: item.dueDate
            ? item.dueDate instanceof Date
              ? item.dueDate.toISOString()
              : item.dueDate
            : undefined,
          timeEntryIds: [],
          statusChanges: item.statusChanges?.map((change: any) => ({
            ...change,
            changedAt:
              change.changedAt instanceof Date
                ? change.changedAt.toISOString()
                : change.changedAt,
          })),
        })),
      ),
    )

    return {
      documents,
      checkpoint: {
        updatedAt:
          lastItem.updatedAt instanceof Date
            ? lastItem.updatedAt.toISOString()
            : lastItem.updatedAt,
        id: lastItem.id!,
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
    private dataSourceId: string,
  ) {}

  async pull(checkpoint: ReplicationCheckpoint | undefined, batchSize: number) {
    const response = await this.client.services.timeEntries.pull({
      body: {
        workspaceId: this.workspaceId,
        dataSourceId: this.dataSourceId,
        memberId: '',
        batch: batchSize,
        checkpoint: {
          id: checkpoint?.id || '',
          updatedAt: new Date(checkpoint?.updatedAt || 0),
        },
      },
    })

    const data = response || []
    if (data.length === 0) return { documents: [], checkpoint: checkpoint! }

    const lastItem = data[data.length - 1]
    const documents: SyncTimeEntryRxDBDTO[] = JSON.parse(
      JSON.stringify(
        data.map((item) => ({
          ...item,
          _id: compositeId(this.dataSourceId, String(item.id!)),
          dataSourceId: this.dataSourceId,
          _deleted: false,
          id: item.id!,
          task: { id: item.task.id },
          activity: { id: item.activity.id, name: item.activity.name },
          user: { id: item.user.id, name: item.user.name },
          timeSpent: item.timeSpent,
          comments: item.comments,
          startDate: item.startDate
            ? item.startDate instanceof Date
              ? item.startDate.toISOString()
              : item.startDate
            : undefined,
          endDate: item.endDate
            ? item.endDate instanceof Date
              ? item.endDate.toISOString()
              : item.endDate
            : undefined,
          createdAt:
            item.createdAt instanceof Date
              ? item.createdAt.toISOString()
              : item.createdAt,
          updatedAt:
            item.updatedAt instanceof Date
              ? item.updatedAt.toISOString()
              : item.updatedAt,
          syncedAt: new Date().toISOString(),
        })),
      ),
    )

    return {
      documents,
      checkpoint: {
        updatedAt:
          lastItem.updatedAt instanceof Date
            ? lastItem.updatedAt.toISOString()
            : lastItem.updatedAt,
        id: lastItem.id!,
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
          // Ativa o estado de carregamento manualmente no início do handler
          this.options.onStatusChange({ isPulling: true, error: null })

          try {
            const result = await this.strategy.pull(cp, batch)
            return result
          } finally {
          }
        },
      },
      push: {
        batchSize: this.options.batchSize || 20,
        handler: (rows) => {
          this.options.onStatusChange({ isPushing: true, error: null })
          return this.strategy.push(rows)
        },
      },
    })

    // --- MONITORAMENTO EM TEMPO REAL ---
    this.subs.push(
      // Monitora se a replicação está ocupada (trabalhando na rede)
      this.instance.active$.subscribe((isActive) => {
        // Se não está mais ativa, garante que pulling/pushing sejam falsos
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

      // Captura erros de rede ou de permissão
      this.instance.error$.subscribe((error) => {
        console.error(`[SYNC ERROR] ${this.options.identifier}:`, error)
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
  id: string
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
      if (dataSources.length === 0) {
        set({ isInitialized: true })
        return
      }

      const { RxDBDevModePlugin } = await import('rxdb/plugins/dev-mode')
      const { RxDBQueryBuilderPlugin } =
        await import('rxdb/plugins/query-builder')
      addRxPlugin(RxDBDevModePlugin)
      addRxPlugin(RxDBQueryBuilderPlugin)

      const db = await createRxDatabase<AppCollections>({
        name: `db-${workspaceId}`,
        storage: wrappedValidateAjvStorage({
          storage: getRxStorageDexie(),
        }),
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

      const collectionConfigs = [
        {
          name: 'metadata',
          strategyFactory: (dsId: string) =>
            new MetadataStrategy(client, workspaceId, dsId),
          interval: 0,
          batch: 1,
        },
        {
          name: 'tasks',
          strategyFactory: (dsId: string) =>
            new TasksStrategy(client, workspaceId, dsId),
          interval: 300,
          batch: 30,
        },
        {
          name: 'timeEntries',
          strategyFactory: (dsId: string) =>
            new TimeEntriesStrategy(client, workspaceId, dsId),
          interval: 60,
          batch: 30,
        },
      ] as const

      for (const dataSource of dataSources) {
        const dsId = dataSource.id
        for (const config of collectionConfigs) {
          const statusKey = `${config.name}_${dsId}`
          const module = new ReplicationModule(
            db[config.name as keyof AppCollections] as RxCollection,
            config.strategyFactory(dsId) as IReplicationStrategy<
              unknown,
              unknown
            >,
            {
              identifier: `rep_${config.name}_${workspaceId}_${dsId}`,
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

      set({ db, isInitialized: true })
    },
  }))
}

const SyncStoreContext = createContext<StoreApi<SyncStore> | undefined>(
  undefined,
)

export const SyncProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { workspace } = useWorkspace()
  const client = useClient()
  const storeRef = useRef<StoreApi<SyncStore> | null>(null)
  const workspaceIdRef = useRef<string | null>(null)
  const [, setRefresh] = useState(0)

  const dataSources =
    workspace?.dataSourceConnections?.length > 0
      ? workspace.dataSourceConnections!.map((c) => ({ id: c.id }))
      : workspace?.dataSource && workspace.dataSource !== 'local'
        ? [{ id: workspace.dataSource }]
        : []

  useEffect(() => {
    const prevId = workspaceIdRef.current
    const nextId = workspace?.id ?? null
    if (prevId !== nextId) {
      if (prevId !== null && storeRef.current) {
        storeRef.current
          .getState()
          .destroy()
          .then(() => {
            storeRef.current = null
            workspaceIdRef.current = nextId
            setRefresh((n) => n + 1)
          })
      } else {
        workspaceIdRef.current = nextId
      }
    }
  }, [workspace?.id])

  if (workspace && !storeRef.current) {
    storeRef.current = createSyncStore(workspace.id, dataSources, client)
  }

  if (!storeRef.current) return <>{children}</>

  return (
    <SyncStoreContext.Provider value={storeRef.current}>
      {children}
    </SyncStoreContext.Provider>
  )
}

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
