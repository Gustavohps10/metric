import { RxJsonSchema } from 'rxdb'

export interface KanbanColumnRxDBDTO {
  _id: string
  _deleted: boolean
  id: string
  name: string
  order: number
  workspaceId: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const kanbanColumnsSchema: RxJsonSchema<KanbanColumnRxDBDTO> = {
  title: 'kanban columns schema',
  version: 0,
  description: 'Colunas do Kanban (ex: A Fazer, Em Progresso, Concluído)',
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', maxLength: 100 },
    _deleted: { type: 'boolean' },
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 250 },
    order: { type: 'number', multipleOf: 1, minimum: 0, maximum: 9999 },
    workspaceId: { type: 'string', maxLength: 100 },
    isActive: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time', maxLength: 30 },
    updatedAt: { type: 'string', format: 'date-time', maxLength: 30 },
  },
  required: [
    '_id',
    'id',
    'name',
    'order',
    'workspaceId',
    'createdAt',
    'updatedAt',
  ],
  indexes: [['workspaceId'], ['order'], ['name']],
}
