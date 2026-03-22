import { RxJsonSchema } from 'rxdb'

export interface SyncMetadataItem {
  id: string
  name: string
  icon: string
  colors: {
    badge: string
    background: string
    text: string
    border?: string
  }
}

export interface SyncMetadataRxDBDTO {
  _id: string
  _deleted: boolean
  dataSourceId: string
  connectionInstanceId: string
  id: string
  taskStatuses: SyncMetadataItem[]
  taskPriorities: SyncMetadataItem[]
  activities: SyncMetadataItem[]
  trackStatuses: SyncMetadataItem[]
  participantRoles: SyncMetadataItem[]
  estimationTypes: SyncMetadataItem[]

  conflicted?: boolean
  conflictData?: { server?: any; local?: any }
  validationError?: any
  syncedAt?: string
  assumedMasterState?: any
}

export const metadataSyncSchema: RxJsonSchema<SyncMetadataRxDBDTO> = {
  title: 'metadata schema',
  version: 0,
  description: 'Stores metadata from external sources like Redmine or Jira',
  primaryKey: '_id',
  type: 'object',
  properties: {
    _id: { type: 'string', maxLength: 200 },
    _deleted: { type: 'boolean' },
    dataSourceId: { type: 'string', maxLength: 100 },
    connectionInstanceId: { type: 'string', maxLength: 100 },
    id: { type: 'string', maxLength: 100 },
    taskStatuses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          colors: {
            type: 'object',
            properties: {
              badge: { type: 'string' },
              background: { type: 'string' },
              text: { type: 'string' },
              border: { type: 'string' },
            },
            required: ['badge', 'background', 'text'],
          },
        },
        required: ['id', 'name', 'icon', 'colors'],
      },
    },
    taskPriorities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          colors: {
            type: 'object',
            properties: {
              badge: { type: 'string' },
              background: { type: 'string' },
              text: { type: 'string' },
              border: { type: 'string' },
            },
            required: ['badge', 'background', 'text'],
          },
        },
        required: ['id', 'name', 'icon', 'colors'],
      },
    },
    activities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          colors: {
            type: 'object',
            properties: {
              badge: { type: 'string' },
              background: { type: 'string' },
              text: { type: 'string' },
              border: { type: 'string' },
            },
            required: ['badge', 'background', 'text'],
          },
        },
        required: ['id', 'name', 'icon', 'colors'],
      },
    },
    trackStatuses: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          colors: {
            type: 'object',
            properties: {
              badge: { type: 'string' },
              background: { type: 'string' },
              text: { type: 'string' },
              border: { type: 'string' },
            },
            required: ['badge', 'background', 'text'],
          },
        },
        required: ['id', 'name', 'icon', 'colors'],
      },
    },
    participantRoles: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          colors: {
            type: 'object',
            properties: {
              badge: { type: 'string' },
              background: { type: 'string' },
              text: { type: 'string' },
              border: { type: 'string' },
            },
            required: ['badge', 'background', 'text'],
          },
        },
        required: ['id', 'name', 'icon', 'colors'],
      },
    },
    estimationTypes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          icon: { type: 'string' },
          colors: {
            type: 'object',
            properties: {
              badge: { type: 'string' },
              background: { type: 'string' },
              text: { type: 'string' },
              border: { type: 'string' },
            },
            required: ['badge', 'background', 'text'],
          },
        },
        required: ['id', 'name', 'icon', 'colors'],
      },
    },
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
  },
  required: [
    '_id',
    'dataSourceId',
    'id',
    'taskStatuses',
    'taskPriorities',
    'activities',
    'trackStatuses',
    'participantRoles',
    'estimationTypes',
  ],
}
