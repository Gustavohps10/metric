import {
  CreateWorkspaceInput,
  DeleteWorkspaceInput,
  IConnectDataSourceUseCase,
  ICreateWorkspaceUseCase,
  IDeleteWorkspaceUseCase,
  IDisconnectDataSourceUseCase,
  IGetCurrentUserUseCase,
  IGetWorkspaceUseCase,
  ILinkDataSourceUseCase,
  IListWorkspacesUseCase,
  IUnlinkDataSourceUseCase,
  IUpdateWorkspaceIdentityUseCase,
  UpdateWorkspaceIdentityInput,
} from '@metric-org/application'
import {
  IMarkWorkspaceAsConfiguredUseCase,
  MarkWorkspaceAsConfiguredInput,
} from '@metric-org/application/contracts/use-cases/IMarkWorkspaceAsConfiguredUseCase'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  ConnectionResultViewModel,
  MemberViewModel,
  PaginatedViewModel,
  ViewModel,
  WorkspaceViewModel,
} from '@metric-org/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

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
    private readonly markWorkspaceAsConfiguredService: IMarkWorkspaceAsConfiguredUseCase,
    private readonly updateWorkspaceIdentityService: IUpdateWorkspaceIdentityUseCase,
    private readonly deleteWorkspaceService: IDeleteWorkspaceUseCase,
  ) {}

  public async markWorkspaceAsConfigured(
    _event: IpcMainInvokeEvent,
    { body: { workspaceId } }: IRequest<MarkWorkspaceAsConfiguredInput>,
  ): Promise<ViewModel<ViewModel>> {
    const result = await this.markWorkspaceAsConfiguredService.execute({
      workspaceId,
    })

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 500,
        error: result.failure.messageKey,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
    }
  }

  public async create(
    _event: IpcMainInvokeEvent,
    { body: { name, avatarFile, description } }: IRequest<CreateWorkspaceInput>,
  ): Promise<ViewModel<WorkspaceViewModel>> {
    const result = await this.createWorkspaceService.execute({
      name,
      avatarFile,
      description,
    })

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
      data: ws,
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
      data: pagedDto.items.map((w) => w),
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
      data: ws,
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
      data: ws,
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
      data: ws,
    }
  }

  public async connectDataSource(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<ConnectDataSourceRequest>,
  ): Promise<ViewModel<ConnectionResultViewModel>> {
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
        statusCode: result.failure.statusCode,
        error: result.failure.messageKey,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
      data: result.success,
    }
  }

  public async updateIdentity(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<UpdateWorkspaceIdentityInput>,
  ): Promise<ViewModel<WorkspaceViewModel>> {
    const result = await this.updateWorkspaceIdentityService.execute(body)

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 500,
        error: result.failure.messageKey,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
      data: result.success,
    }
  }

  public async delete(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<DeleteWorkspaceInput>,
  ): Promise<ViewModel<void>> {
    const result = await this.deleteWorkspaceService.execute(body)

    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode || 500,
        error: result.failure.messageKey,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
    }
  }
}
