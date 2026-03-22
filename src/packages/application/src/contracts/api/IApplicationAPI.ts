import { IHeaders, IRequest } from '@timelapse/cross-cutting/transport'
import {
  AuthenticationViewModel,
  MemberViewModel,
  MetadataViewModel,
  PaginatedViewModel,
  SyncDocumentViewModel,
  TaskViewModel,
  TimeEntryViewModel,
  ViewModel,
  WorkspaceViewModel,
} from '@timelapse/presentation/view-models'

import { FileData } from '@/contracts/infra'
import { PushTimeEntriesInput } from '@/contracts/use-cases'

export interface ConfigField {
  id: string
  label: string
  type: 'text' | 'password' | 'url'
  required: boolean
  placeholder?: string
}

export interface FieldGroup {
  id: string
  label: string
  description?: string
  fields: ConfigField[]
}

export interface IWorkspacesAPI {
  create(
    input: IRequest<{
      name: string
    }>,
  ): Promise<ViewModel<WorkspaceViewModel>>

  getById(
    input: IRequest<{ workspaceId: string }>,
  ): Promise<ViewModel<WorkspaceViewModel>>

  listAll(): Promise<PaginatedViewModel<WorkspaceViewModel[]>>

  getDataSourceFields(input: IRequest<{ pluginId: string }>): Promise<{
    credentials: FieldGroup[]
    configuration: FieldGroup[]
  }>

  linkDataSource(
    input: IRequest<{
      workspaceId: string
      dataSourceId: string
      connectionInstanceId: string
    }>,
  ): Promise<ViewModel<WorkspaceViewModel>>

  unlinkDataSource(
    input: IRequest<{
      workspaceId: string
      connectionInstanceId?: string
    }>,
  ): Promise<ViewModel<WorkspaceViewModel>>

  connectDataSource(
    input: IRequest<{
      workspaceId: string
      pluginId: string
      connectionInstanceId: string
      configuration: Record<string, unknown>
      credentials: Record<string, unknown>
    }>,
  ): Promise<ViewModel<AuthenticationViewModel>>

  disconnectDataSource(
    input: IRequest<{
      workspaceId: string
      connectionInstanceId: string
    }>,
  ): Promise<ViewModel<WorkspaceViewModel>>

  getConnectionMember(
    input: IRequest<{
      workspaceId: string
      connectionInstanceId: string
    }>,
  ): Promise<ViewModel<MemberViewModel | null>>
}

export interface ISessionAPI {
  getCurrentUser(
    input: IRequest<{
      workspaceId: string
      pluginId?: string
      connectionInstanceId?: string
    }>,
  ): Promise<ViewModel<MemberViewModel>>
}

export interface ITaskAPI {
  listTasks: (
    input: IRequest<{
      workspaceId: string
      pluginId: string
      connectionInstanceId: string
    }>,
  ) => Promise<PaginatedViewModel<TaskViewModel[]>>

  pull: (
    payload: IRequest<{
      workspaceId: string
      pluginId: string
      connectionInstanceId: string
      memberId: string
      checkpoint: { updatedAt: Date; id: string }
      batch: number
    }>,
  ) => Promise<ViewModel<TaskViewModel[]>>
}

export interface IMetadataAPI {
  pull: (
    payload: IRequest<{
      workspaceId: string
      pluginId: string
      connectionInstanceId: string
      memberId: string
      checkpoint: { updatedAt: Date; id: string }
      batch: number
    }>,
  ) => Promise<ViewModel<MetadataViewModel>>
}

export interface ITimeEntriesAPI {
  findByMemberId: (
    payload: IRequest<{
      workspaceId: string
      pluginId: string
      connectionInstanceId: string
      memberId: string
      startDate: Date
      endDate: Date
    }>,
  ) => Promise<PaginatedViewModel<TimeEntryViewModel[]>>

  pull: (
    payload: IRequest<{
      workspaceId: string
      pluginId: string
      connectionInstanceId: string
      memberId: string
      checkpoint: { updatedAt: Date; id: string }
      batch: number
    }>,
  ) => Promise<TimeEntryViewModel[]>

  push: (
    payload: IRequest<PushTimeEntriesInput>,
  ) => Promise<SyncDocumentViewModel<TimeEntryViewModel>[]>
}

export interface IHeadersAPI {
  setDefaultHeaders(headers: IHeaders): void
  getDefaultHeaders(): IHeaders
}

export interface ITokenStorageAPI {
  saveToken(
    request: IRequest<{
      service: string
      account: string
      token: string
    }>,
  ): Promise<ViewModel<void>>

  getToken(
    request: IRequest<{
      service: string
      account: string
    }>,
  ): Promise<ViewModel<string | null>>

  deleteToken(
    request: IRequest<{
      service: string
      account: string
    }>,
  ): Promise<ViewModel<void>>
}

export interface IDiscordAPI {
  login(): Promise<{
    id: string
    username: string
    avatar: string
    global_name: string | null
    avatarUrl: string
  }>
}

export interface AddonManifest {
  id: string
  name: string
  creator: string
  description: string
  path: string
  logo: string
  downloads: number
  version: string
  stars: number
  installed: boolean
  installerManifestUrl?: string
  sourceUrl?: string
  tags?: string[]
}

export interface AddonInstaller {
  id: string
  packages: {
    version: string
    requiredApiVersion: string
    releaseDate: string
    downloadUrl: string
    changelog: string[]
  }[]
}

export interface IAddonsAPI {
  listAvailable(): Promise<AddonManifest[]>
  listInstalled(): Promise<AddonManifest[]>
  getInstalledById(
    payload: IRequest<{ addonId: string }>,
  ): Promise<ViewModel<AddonManifest>>
  updateLocal?(addon: AddonManifest): Promise<void>
  import(payload: IRequest<{ addon: FileData }>): Promise<ViewModel>
  getInstaller(
    payload: IRequest<{ installerUrl: string }>,
  ): Promise<AddonInstaller>
  install(
    payload: IRequest<
      { downloadUrl: string } & { onProgress?: (progress: number) => void }
    >,
  ): Promise<ViewModel>
}

export interface EnvironmentInfo {
  isDevelopment: boolean
}

export interface ISystemAPI {
  getAppVersion(): Promise<string>
  getEnvironment(): Promise<EnvironmentInfo>
}

export interface IApplicationAPI {
  services: {
    workspaces: IWorkspacesAPI
    session: ISessionAPI
    tasks: ITaskAPI
    timeEntries: ITimeEntriesAPI
    metadata: IMetadataAPI
  }
  modules: {
    headers: IHeadersAPI
    tokenStorage: ITokenStorageAPI
    system: ISystemAPI
  }
  integrations: {
    discord: IDiscordAPI
    addons: IAddonsAPI
  }
}
