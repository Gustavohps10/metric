import { RxJsonSchema } from 'rxdb'

export interface TaskKanbanColumnRxDBDTO {
  _id: string
  _deleted: boolean
  taskId: string
  columnId: string
  inWorkspace: boolean
  position: number
  createdAt: string
  updatedAt: string
}

export const kanbanTaskColumnsSchema: RxJsonSchema<TaskKanbanColumnRxDBDTO> = {
  title: 'task-kanban relation schema',
  version: 0,
  description: 'Vincula uma tarefa a uma coluna Kanban (1:1)',
  type: 'object',
  primaryKey: '_id',
  properties: {
    _id: { type: 'string', maxLength: 100 },
    _deleted: { type: 'boolean' },
    taskId: { type: 'string', maxLength: 100 },
    columnId: { type: 'string', maxLength: 100 },
    inWorkspace: { type: 'boolean' },
    position: { type: 'number', multipleOf: 1, minimum: 0, maximum: 999999 },
    createdAt: { type: 'string', format: 'date-time', maxLength: 30 },
    updatedAt: { type: 'string', format: 'date-time', maxLength: 30 },
  },
  required: [
    '_id',
    'taskId',
    'columnId',
    'inWorkspace',
    'position',
    'createdAt',
    'updatedAt',
  ],
  indexes: [['taskId'], ['columnId'], ['inWorkspace'], ['position']],
}
