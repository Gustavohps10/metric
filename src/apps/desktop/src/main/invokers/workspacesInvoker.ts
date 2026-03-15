import { IWorkspacesClient } from '@timelapse/application'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  AuthenticationViewModel,
  PaginatedViewModel,
  ViewModel,
  WorkspaceViewModel,
} from '@timelapse/presentation/view-models'
import { FieldGroup } from '@timelapse/sdk'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'
import { CreateWorkspaceRequest } from '@/main/handlers/WorkspacesHandler'

export const workspacesInvoker: IWorkspacesClient = {
  create: (
    request: IRequest<CreateWorkspaceRequest>,
  ): Promise<ViewModel<WorkspaceViewModel>> =>
    IpcInvoker.invoke<
      IRequest<CreateWorkspaceRequest>,
      ViewModel<WorkspaceViewModel>
    >('WORKSPACES_CREATE', request),

  getById: (
    request: IRequest<{ workspaceId: string }>,
  ): Promise<ViewModel<WorkspaceViewModel>> =>
    IpcInvoker.invoke<
      IRequest<{ workspaceId: string }>,
      ViewModel<WorkspaceViewModel>
    >('WORKSPACES_GET_BY_ID', request),

  listAll: (): Promise<PaginatedViewModel<WorkspaceViewModel[]>> =>
    IpcInvoker.invoke<never, PaginatedViewModel<WorkspaceViewModel[]>>(
      'WORKSPACES_GET_ALL',
    ),

  getDataSourceFields: (): Promise<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }> =>
    IpcInvoker.invoke<
      never,
      { credentials: FieldGroup[]; configuration: FieldGroup[] }
    >('DATA_SOURCE_GET_FIELDS'),

  linkDataSource: (
    request: IRequest<{ workspaceId: string; dataSource: string }>,
  ): Promise<ViewModel<WorkspaceViewModel>> =>
    IpcInvoker.invoke<
      IRequest<{ workspaceId: string; dataSource: string }>,
      ViewModel<WorkspaceViewModel>
    >('WORKSPACES_LINK_DATASOURCE', request),

  unlinkDataSource: (
    request: IRequest<{ workspaceId: string; dataSourceId?: string }>,
  ): Promise<ViewModel<WorkspaceViewModel>> =>
    IpcInvoker.invoke<
      IRequest<{ workspaceId: string; dataSourceId?: string }>,
      ViewModel<WorkspaceViewModel>
    >('WORKSPACES_UNLINK_DATASOURCE', request),

  connectDataSource: (
    request: IRequest<{
      workspaceId: string
      dataSourceId: string
      credentials: Record<string, unknown>
      configuration: Record<string, unknown>
    }>,
  ): Promise<ViewModel<AuthenticationViewModel>> =>
    IpcInvoker.invoke<
      IRequest<{
        workspaceId: string
        dataSourceId: string
        credentials: Record<string, unknown>
        configuration: Record<string, unknown>
      }>,
      ViewModel<AuthenticationViewModel>
    >('WORKSPACES_CONNECT_DATASOURCE', request),

  disconnectDataSource: (
    request: IRequest<{ workspaceId: string; dataSourceId: string }>,
  ): Promise<ViewModel<WorkspaceViewModel>> =>
    IpcInvoker.invoke<
      IRequest<{ workspaceId: string; dataSourceId: string }>,
      ViewModel<WorkspaceViewModel>
    >('WORKSPACES_DISCONNECT_DATASOURCE', request),
}
