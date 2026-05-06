import { AppError, Either } from '@metric-org/shared/helpers'

import { TaskDTO } from '@/dtos'

export type PullTasksInput = {
  workspaceId: string
  connectionInstanceId: string
  checkpoint: { updatedAt: Date; id: string }
  batch: number
}

export interface ITaskPullUseCase {
  execute(input: PullTasksInput): Promise<Either<AppError, TaskDTO[]>>
}
