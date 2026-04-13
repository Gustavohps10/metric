import {
  getMemberStorageKey,
  IConnectDataSourceUseCase,
  ICredentialsStorage,
  IDisconnectDataSourceUseCase,
} from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  AuthenticationViewModel,
  MemberViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

export interface ConnectDataSourceRequest {
  workspaceId: string
  pluginId: string
  connectionInstanceId: string
  credentials: Record<string, unknown>
  configuration: Record<string, unknown>
}

export interface DisconnectDataSourceRequest {
  workspaceId: string
  connectionInstanceId: string
}

export interface GetConnectionMemberRequest {
  workspaceId: string
  connectionInstanceId: string
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
    const result = await this.connectDataSourceService.execute({
      workspaceId: body.workspaceId,
      pluginId: body.pluginId,
      connectionInstanceId: body.connectionInstanceId,
      credentials: body.credentials,
      configuration: body.configuration,
    })

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 401,
        error: result.failure.messageKey,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
      data: result.success,
    }
  }

  public async disconnectDataSource(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<DisconnectDataSourceRequest>,
  ): Promise<ViewModel<void>> {
    const result = await this.disconnectDataSourceService.execute({
      workspaceId: body.workspaceId,
      connectionInstanceId: body.connectionInstanceId,
    })

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
    // Usamos o connectionInstanceId para garantir a chave única por conta
    const key = getMemberStorageKey(body.workspaceId, body.connectionInstanceId)

    let raw = await this.credentialsStorage.getToken('metric', key)

    if (!raw) {
      // Fallback para chaves antigas se necessário, mas mantendo o foco na instância
      const legacyKey = `workspace-session-${body.workspaceId}-${body.connectionInstanceId}-member`
      raw = await this.credentialsStorage.getToken('metric', legacyKey)
    }

    if (!raw) {
      return { isSuccess: true, statusCode: 200, data: null }
    }

    try {
      const member = JSON.parse(raw) as MemberViewModel
      return { isSuccess: true, statusCode: 200, data: member }
    } catch (e) {
      return { isSuccess: true, statusCode: 200, data: null }
    }
  }
}
