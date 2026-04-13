import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { TaskDTO } from '@/dtos'

export type PullTasksInput = {
  workspaceId: string
  pluginId: string
  connectionInstanceId: string
  memberId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export interface ITaskPullUseCase {
  execute(input: PullTasksInput): Promise<Either<AppError, TaskDTO[]>>
}
