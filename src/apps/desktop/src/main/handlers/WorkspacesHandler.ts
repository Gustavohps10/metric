import {
  IConnectDataSourceUseCase,
  ICreateWorkspaceUseCase,
  IDisconnectDataSourceUseCase,
  IGetCurrentUserUseCase,
  IGetWorkspaceUseCase,
  ILinkDataSourceUseCase,
  IListWorkspacesUseCase,
  IUnlinkDataSourceUseCase,
} from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  AuthenticationViewModel,
  MemberViewModel,
  PaginatedViewModel,
  ViewModel,
  WorkspaceViewModel,
} from '@metric-org/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

export interface CreateWorkspaceRequest {
  name: string
}

export interface GetWorkspaceByIdRequest {
  workspaceId: string
}

export interface LinkDataSourceRequest {
  workspaceId: string
  dataSourceId: string
  connectionInstanceId: string
}

export interface UnlinkDataSourceRequest {
  workspaceId: string
  connectionInstanceId: string
}

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

export class WorkspacesHandler {
  constructor(
    private readonly createWorkspaceService: ICreateWorkspaceUseCase,
    private readonly listWorkspacesService: IListWorkspacesUseCase,
    private readonly getWorkspaceService: IGetWorkspaceUseCase,
    private readonly linkDataSourceService: ILinkDataSourceUseCase,
    private readonly unlinkDataSourceService: IUnlinkDataSourceUseCase,
    private readonly connectDataSourceService: IConnectDataSourceUseCase,
    private readonly disconnectDataSourceService: IDisconnectDataSourceUseCase,
    private readonly getCurrentUserService: IGetCurrentUserUseCase,
  ) {}

  public async create(
    _event: IpcMainInvokeEvent,
    { body: { name } }: IRequest<CreateWorkspaceRequest>,
  ): Promise<ViewModel<WorkspaceViewModel>> {
    const result = await this.createWorkspaceService.execute({ name })

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 500,
        error: result.failure.messageKey,
      }
    }

    const ws = result.success
    return {
      isSuccess: true,
      statusCode: 201,
      data: {
        id: ws.id,
        name: ws.name,
        dataSourceConnections: ws.dataSourceConnections.map((c) => ({
          id: c.id,
          dataSourceId: c.dataSourceId,
          config: c.config,
        })),
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt,
      },
    }
  }

  public async listAll(): Promise<PaginatedViewModel<WorkspaceViewModel[]>> {
    const result = await this.listWorkspacesService.execute()

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error: 'Erro ao listar workspaces',
        data: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
      }
    }

    const pagedDto = result.success
    return {
      statusCode: 200,
      isSuccess: true,
      data: pagedDto.items.map((w) => ({
        id: w.id,
        name: w.name,
        dataSourceConnections: w.dataSourceConnections.map((c) => ({
          id: c.id,
          dataSourceId: c.dataSourceId,
          config: c.config,
        })),
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      })),
      totalItems: pagedDto.total,
      totalPages: Math.ceil(pagedDto.total / (pagedDto.pageSize || 1)),
      currentPage: pagedDto.page || 1,
    }
  }

  public async getById(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<GetWorkspaceByIdRequest>,
  ): Promise<ViewModel<WorkspaceViewModel>> {
    const result = await this.getWorkspaceService.execute(body)

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 404,
        error: result.failure.messageKey,
      }
    }

    const ws = result.success
    return {
      isSuccess: true,
      statusCode: 200,
      data: {
        id: ws.id,
        name: ws.name,
        dataSourceConnections: ws.dataSourceConnections.map((c) => ({
          id: c.id,
          dataSourceId: c.dataSourceId,
          config: c.config,
        })),
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt,
      },
    }
  }

  public async linkDataSource(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<LinkDataSourceRequest>,
  ): Promise<ViewModel<WorkspaceViewModel>> {
    const result = await this.linkDataSourceService.execute(body)

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: 500,
        error: result.failure.messageKey,
      }
    }

    const ws = result.success
    return {
      isSuccess: true,
      statusCode: 200,
      data: {
        id: ws.id,
        name: ws.name,
        dataSourceConnections: ws.dataSourceConnections.map((c) => ({
          id: c.id,
          dataSourceId: c.dataSourceId,
          config: c.config,
        })),
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt,
      },
    }
  }

  public async unlinkDataSource(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<UnlinkDataSourceRequest>,
  ): Promise<ViewModel<WorkspaceViewModel>> {
    const result = await this.unlinkDataSourceService.execute(body)

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: 500,
        error: result.failure.messageKey,
      }
    }

    const ws = result.success
    return {
      isSuccess: true,
      statusCode: 200,
      data: {
        id: ws.id,
        name: ws.name,
        dataSourceConnections: ws.dataSourceConnections.map((c) => ({
          id: c.id,
          dataSourceId: c.dataSourceId,
          config: c.config,
        })),
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt,
      },
    }
  }

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
    const result = await this.getCurrentUserService.execute(body)

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 404,
        error: result.failure.messageKey,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
      data: result.success,
    }
  }
}
