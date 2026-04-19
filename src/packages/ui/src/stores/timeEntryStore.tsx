'use client'

import { differenceInSeconds, parseISO } from 'date-fns'
import { createContext, ReactNode, useContext, useRef } from 'react'
import { createStore, StoreApi, useStore } from 'zustand'

import { SyncTimeEntryRxDBDTO } from '@/local-db/schemas/time-entries-sync-schema'
import { AppDatabase } from '@/stores/syncStore'

/* ============================= */
/* Types */
/* ============================= */

export interface CreateTimeEntryData {
  taskId: string
  activityId: string
  dataSourceId: string
  type: 'increasing' | 'decreasing' | 'manual'
  connectionInstanceId: string
  comments?: string
  userId?: string
}

export interface TimeEntryState {
  active: SyncTimeEntryRxDBDTO | null
}

export interface TimeEntryActions {
  setActive: (entry: SyncTimeEntryRxDBDTO | null) => void
  clear: () => void

  createNewTimeEntry: (
    db: AppDatabase,
    data: CreateTimeEntryData,
  ) => Promise<void>

  pauseCurrentTimeEntry: (db: AppDatabase) => Promise<void>
  playCurrentTimeEntry: (db: AppDatabase) => Promise<void>
  stopCurrentTimeEntry: (db: AppDatabase) => Promise<void>
}

export type TimeEntryStore = TimeEntryState & TimeEntryActions

/* ============================= */
/* Store Factory */
/* ============================= */

export const createTimeEntryStore = (): StoreApi<TimeEntryStore> => {
  return createStore<TimeEntryStore>((set, get) => ({
    active: null,

    setActive: (entry) => set({ active: entry }),

    clear: () => set({ active: null }),

    async createNewTimeEntry(db, data) {
      const { active } = get()

      if (active) {
        await get().stopCurrentTimeEntry(db)
      }

      const id = crypto.randomUUID()
      const now = new Date().toISOString()

      const newEntry: SyncTimeEntryRxDBDTO = {
        _id: `${data.dataSourceId}::local-${id}`,
        id,
        _deleted: false,
        connectionInstanceId: data.connectionInstanceId,
        dataSourceId: data.dataSourceId,
        task: { id: data.taskId },
        activity: { id: data.activityId },
        user: { id: data.userId ?? 'local-user' },
        startDate: now,
        timeSpent: 0,
        timeStatus: 'running',
        type: data.type,
        comments: data.comments,
        createdAt: now,
        updatedAt: now,
      }

      await db.timeEntries.insert(newEntry)

      set({ active: newEntry })
    },

    async pauseCurrentTimeEntry(db) {
      const { active } = get()
      if (!active) return

      const doc = await db.timeEntries.findOne(active._id).exec()
      if (!doc) return

      if (!active.startDate) return

      const start = parseISO(active.startDate)
      const secondsSinceLastPlay = differenceInSeconds(new Date(), start)

      const updatedTimeSpent = (active.timeSpent ?? 0) + secondsSinceLastPlay

      await doc.patch({
        timeStatus: 'paused',
        timeSpent: updatedTimeSpent,
        updatedAt: new Date().toISOString(),
      })

      set({
        active: {
          ...active,
          timeStatus: 'paused',
          timeSpent: updatedTimeSpent,
        },
      })
    },

    async playCurrentTimeEntry(db) {
      const { active } = get()
      if (!active) return

      const doc = await db.timeEntries.findOne(active._id).exec()
      if (!doc) return

      const now = new Date().toISOString()

      await doc.patch({
        timeStatus: 'running',
        startDate: now,
        updatedAt: now,
      })

      set({
        active: {
          ...active,
          timeStatus: 'running',
          startDate: now,
        },
      })
    },

    async stopCurrentTimeEntry(db) {
      const { active } = get()
      if (!active) return

      const doc = await db.timeEntries.findOne(active._id).exec()
      if (!doc) return

      let finalSeconds = active.timeSpent ?? 0

      if (active.timeStatus === 'running' && active.startDate) {
        const start = parseISO(active.startDate)
        finalSeconds += differenceInSeconds(new Date(), start)
      }

      await doc.patch({
        timeStatus: 'finished',
        endDate: new Date().toISOString(),
        timeSpent: Number((finalSeconds / 3600).toFixed(4)),
        updatedAt: new Date().toISOString(),
      })

      set({ active: null })
    },
  }))
}

/* ============================= */
/* Context + Provider */
/* ============================= */

const TimeEntryContext = createContext<StoreApi<TimeEntryStore> | null>(null)

export function TimeEntryProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<StoreApi<TimeEntryStore> | null>(null)

  if (!storeRef.current) {
    storeRef.current = createTimeEntryStore()
  }

  return (
    <TimeEntryContext.Provider value={storeRef.current}>
      {children}
    </TimeEntryContext.Provider>
  )
}

/* ============================= */
/* Hook */
/* ============================= */

export function useTimeEntryStore<T>(
  selector: (state: TimeEntryStore) => T,
): T {
  const store = useContext(TimeEntryContext)

  if (!store) {
    throw new Error('useTimeEntryStore must be used inside TimeEntryProvider')
  }

  return useStore(store, selector)
}
