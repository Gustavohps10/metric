import { RxJsonSchema } from 'rxdb'

import { SyncTaskRxDBDTO } from '@/db/schemas/tasks-sync-schema'

export interface SyncTimeEntryRxDBDTO {
  _id: string
  _deleted: boolean
  dataSourceId: string
  id: string
  task: { id: string }
  taskData?: SyncTaskRxDBDTO
  activity: { id: string; name?: string }
  user: { id: string; name?: string }
  startDate?: string
  endDate?: string
  timeSpent: number
  comments?: string
  createdAt: string
  updatedAt: string
  conflicted?: boolean
  timeStatus?: 'running' | 'paused' | 'finished'
  type?: 'increasing' | 'decreasing' | 'manual'
  conflictData?: { server?: any; local?: any }
  validationError?: any
  syncedAt?: string
  assumedMasterState?: any
}

export const timeEntriesSyncSchema: RxJsonSchema<SyncTimeEntryRxDBDTO> = {
  title: 'timeEntries schema',
  version: 0,
  description: 'Time entries with sync metadata and task relation',
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', maxLength: 200 },
    dataSourceId: { type: 'string', maxLength: 100 },
    id: { type: 'string', maxLength: 100 },
    task: {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    },
    taskData: {
      type: 'object',
    },
    activity: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id'],
    },
    user: {
      type: 'object',
      properties: { id: { type: 'string' }, name: { type: 'string' } },
      required: ['id'],
    },
    startDate: { type: 'string', format: 'date-time' },
    endDate: { type: 'string', format: 'date-time' },
    timeSpent: { type: 'number' },
    comments: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    _deleted: { type: 'boolean' },
    conflicted: { type: 'boolean' },
    conflictData: {
      type: 'object',
      properties: {
        server: { type: 'object' },
        local: { type: 'object' },
      },
    },
    validationError: { type: 'object' },
    syncedAt: { type: 'string', format: 'date-time' },
    assumedMasterState: { type: 'object' },
    timeStatus: {
      type: 'string',
      enum: ['running', 'paused', 'finished'],
    },
    type: {
      type: 'string',
      enum: ['increasing', 'decreasing', 'manual'],
    },
  },
  required: [
    '_id',
    'dataSourceId',
    'id',
    'task',
    'activity',
    'user',
    'timeSpent',
    'createdAt',
    'updatedAt',
  ],
}
