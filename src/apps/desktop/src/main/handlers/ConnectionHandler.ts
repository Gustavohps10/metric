import {
  getMemberStorageKey,
  IConnectDataSourceUseCase,
  ICredentialsStorage,
  IDisconnectDataSourceUseCase,
} from '@timelapse/application'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  AuthenticationViewModel,
  MemberViewModel,
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

export interface GetConnectionMemberRequest {
  workspaceId: string
  dataSourceId: string
}

export class ConnectionHandler {
  constructor(
    private readonly connectDataSourceService: IConnectDataSourceUseCase,
    private readonly disconnectDataSourceService: IDisconnectDataSourceUseCase,
    private readonly credentialsStorage: ICredentialsStorage,
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

  public async getConnectionMember(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<GetConnectionMemberRequest>,
  ): Promise<ViewModel<MemberViewModel | null>> {
    const key = getMemberStorageKey(body.workspaceId, body.dataSourceId)
    console.log('[ConnectionHandler] getConnectionMember key:', key)
    let raw = await this.credentialsStorage.getToken('timelapse', key)
    if (!raw) {
      const legacyKey = `workspace-session-${body.workspaceId}-${body.dataSourceId}-member`
      console.log('[ConnectionHandler] key vazia, tentando legada:', legacyKey)
      raw = await this.credentialsStorage.getToken('timelapse', legacyKey)
    }
    if (!raw) {
      console.log('[ConnectionHandler] nenhum member encontrado')
      return { isSuccess: true, statusCode: 200, data: null }
    }
    try {
      const member = JSON.parse(raw) as MemberViewModel
      console.log('[ConnectionHandler] member lido:', member?.id)
      return { isSuccess: true, statusCode: 200, data: member }
    } catch (e) {
      console.error('[ConnectionHandler] JSON.parse member falhou:', e)
      return { isSuccess: true, statusCode: 200, data: null }
    }
  }
}
