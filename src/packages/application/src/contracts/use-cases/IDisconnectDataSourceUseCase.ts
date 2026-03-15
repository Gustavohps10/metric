import { AppError, Either } from '@timelapse/cross-cutting/helpers'

export interface DisconnectDataSourceInput {
  workspaceId: string
  dataSourceId: string
}

export interface IDisconnectDataSourceUseCase {
  execute(input: DisconnectDataSourceInput): Promise<Either<AppError, void>>
}
