import {
  IConnectDataSourceUseCase,
  IDisconnectDataSourceUseCase,
} from '@timelapse/application'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  AuthenticationViewModel,
  ViewModel,
} from '@timelapse/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

export interface ConnectDataSourceRequest {
  workspaceId: string
  dataSourceId: string
  credentials: Record<string, unknown>
  configuration: Record<string, unknown>
}

export interface DisconnectDataSourceRequest {
  workspaceId: string
  dataSourceId: string
}

export class ConnectionHandler {
  constructor(
    private readonly connectDataSourceService: IConnectDataSourceUseCase,
    private readonly disconnectDataSourceService: IDisconnectDataSourceUseCase,
  ) {}

  public async connectDataSource(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<ConnectDataSourceRequest>,
  ): Promise<ViewModel<AuthenticationViewModel>> {
    const result = await this.connectDataSourceService.execute(body)
    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 401,
        error: result.failure.messageKey,
      }
    }
    return { isSuccess: true, statusCode: 200, data: result.success }
  }

  public async disconnectDataSource(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<DisconnectDataSourceRequest>,
  ): Promise<ViewModel> {
    const result = await this.disconnectDataSourceService.execute(body)
    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: 500,
        error: result.failure.messageKey,
      }
    }
    return {
      isSuccess: true,
      statusCode: 200,
    }
  }
}
