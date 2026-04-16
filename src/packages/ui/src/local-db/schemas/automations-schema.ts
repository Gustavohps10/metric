import { RxJsonSchema } from 'rxdb'

export interface AutomationCondition {
  field: string // Ex: "status.id" ou "priority.id"
  operator: 'equals' | 'notEquals' | 'contains'
  value: string
}

export interface AutomationAction {
  type: 'createCard' | 'moveToColumn' | 'startTimer' | 'stopTimer'
  params: Record<string, string>
}

export interface AutomationRxDBDTO {
  _id: string
  _deleted: boolean
  id: string
  workspaceId: string
  columnId: string
  name: string
  trigger:
    | 'onTaskSynced' // Chegada de dados em lote do servidor
    | 'onTaskCreated' // Nova tarefa manual ou nova no banco
    | 'onTaskUpdated' // Mudança de status/campo em tarefa que já existia
    | 'onRuleEnabled' // Execução retroativa ao ativar a regra
    | 'onEnterColumn' // Automações de movimento (ex: start timer)
    | 'onLeaveColumn' // Automações de movimento (ex: stop timer)
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  enabled: boolean
  createdAt: string
  updatedAt: string
}

export const automationsSchema: RxJsonSchema<AutomationRxDBDTO> = {
  title: 'automations schema',
  version: 0,
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', maxLength: 100 },
    _deleted: { type: 'boolean' },
    id: { type: 'string', maxLength: 100 },
    workspaceId: { type: 'string', maxLength: 100 },
    columnId: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 250 },
    trigger: {
      type: 'string',
      enum: [
        'onTaskSynced',
        'onEnterColumn',
        'onLeaveColumn',
        'onTaskCreated',
        'onRuleEnabled',
        'onTaskUpdated',
      ],
      maxLength: 50,
    },
    conditions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          operator: {
            type: 'string',
            enum: ['equals', 'notEquals', 'contains'],
          },
          value: { type: 'string' },
        },
        required: ['field', 'operator', 'value'],
      },
    },
    actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['createCard', 'moveToColumn', 'startTimer', 'stopTimer'],
          },
          params: { type: 'object', additionalProperties: { type: 'string' } },
        },
        required: ['type', 'params'],
      },
    },
    enabled: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
  required: [
    '_id',
    'id',
    'workspaceId',
    'columnId',
    'name',
    'trigger',
    'enabled',
    'createdAt',
    'updatedAt',
  ],
  indexes: [['columnId'], ['workspaceId'], ['trigger']],
}
