import { AppError, Either } from '@metric-org/shared/helpers'

export interface DisconnectDataSourceInput {
  workspaceId: string
  connectionInstanceId: string
}

export interface IDisconnectDataSourceUseCase {
  execute(input: DisconnectDataSourceInput): Promise<Either<AppError, void>>
}
