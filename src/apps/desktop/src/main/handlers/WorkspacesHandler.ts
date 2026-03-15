import {
  ICreateWorkspaceUseCase,
  IGetWorkspaceUseCase,
  ILinkDataSourceUseCase,
  IListWorkspacesUseCase,
  IUnlinkDataSourceUseCase,
} from '@timelapse/application'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  ViewModel,
  WorkspaceViewModel,
} from '@timelapse/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

export interface CreateWorkspaceRequest {
  name: string
}

export interface GetWorkspaceByIdRequest {
  workspaceId: string
}

export interface LinkDataSourceRequest {
  workspaceId: string
  dataSource: string
}

export interface UnlinkDataSourceRequest {
  workspaceId: string
  dataSourceId?: string
}

export class WorkspacesHandler {
  constructor(
    private readonly createWorkspaceService: ICreateWorkspaceUseCase,
    private readonly listWorkspacesService: IListWorkspacesUseCase,
    private readonly getWorkspaceService: IGetWorkspaceUseCase,
    private readonly linkDataSourceService: ILinkDataSourceUseCase,
    private readonly unlinkDataSourceService: IUnlinkDataSourceUseCase,
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

    const newWorkspace = result.success
    const conns = newWorkspace.dataSourceConnections
    return {
      isSuccess: true,
      statusCode: 201,
      data: {
        id: newWorkspace.id,
        name: newWorkspace.name,
        dataSource: newWorkspace.dataSource,
        dataSourceConfiguration: newWorkspace.dataSourceConfiguration,
        dataSourceConnections:
          conns?.length > 0
            ? conns.map((c) => ({ id: c.id, config: c.config }))
            : undefined,
        createdAt: newWorkspace.createdAt,
        updatedAt: newWorkspace.updatedAt,
      },
    }
  }

  public async listAll() {
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
    const workspaces = pagedDto.items ?? []
    const viewModels: WorkspaceViewModel[] = workspaces.map((w) => {
      const conns = w.dataSourceConnections
      return {
        id: w.id,
        name: w.name,
        dataSource: w.dataSource,
        dataSourceConfiguration: w.dataSourceConfiguration,
        dataSourceConnections:
          conns?.length > 0
            ? conns.map((c) => ({ id: c.id, config: c.config }))
            : undefined,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
      }
    })

    return {
      statusCode: 200,
      isSuccess: true,
      data: viewModels,
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

    const workspace = result.success
    const conns = workspace.dataSourceConnections
    return {
      isSuccess: true,
      statusCode: 200,
      data: {
        id: workspace.id,
        name: workspace.name,
        dataSource: workspace.dataSource,
        dataSourceConfiguration: workspace.dataSourceConfiguration,
        dataSourceConnections:
          conns?.length > 0
            ? conns.map((c) => ({ id: c.id, config: c.config }))
            : undefined,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
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
    const workspace = result.success
    const conns = workspace.dataSourceConnections
    return {
      isSuccess: true,
      statusCode: 200,
      data: {
        id: workspace.id,
        name: workspace.name,
        dataSource: workspace.dataSource,
        dataSourceConfiguration: workspace.dataSourceConfiguration,
        dataSourceConnections:
          conns?.length > 0
            ? conns.map((c) => ({ id: c.id, config: c.config }))
            : undefined,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
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
    const workspace = result.success
    const conns = workspace.dataSourceConnections
    return {
      isSuccess: true,
      statusCode: 200,
      data: {
        id: workspace.id,
        name: workspace.name,
        dataSource: workspace.dataSource,
        dataSourceConfiguration: workspace.dataSourceConfiguration,
        dataSourceConnections:
          conns?.length > 0
            ? conns.map((c) => ({ id: c.id, config: c.config }))
            : undefined,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      },
    }
  }
}
