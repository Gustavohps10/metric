import {
  ConnectDataSourceService,
  CreateWorkspaceService,
  DeleteWorkspaceService,
  DisconnectDataSourceService,
  GetCurrentUserService,
  GetWorkspaceService,
  ICredentialsStorage,
  IDataSourceResolver,
  IFileStorage,
  ImportAddonService,
  IServiceProvider,
  IWorkspacesQuery,
  IWorkspacesRepository,
  LinkDataSourceService,
  ListTaskService,
  ListTimeEntriesService,
  ListWorkspacesService,
  MarkWorkspaceAsConfiguredService,
  MetadataPullService,
  SessionManager,
  TaskPullService,
  TimeEntriesPullService,
  TimeEntriesPushService,
  UnlinkDataSourceService,
  UpdateWorkspaceIdentityService,
} from '@metric-org/application'
import { IEventEmitter, IJobEvents } from '@metric-org/cross-cutting/transport'
import { JwtService } from '@metric-org/infra/auth'
import { AddonsFacade } from '@metric-org/infra/facades'
import { HttpClient } from '@metric-org/infra/http'
import { FileManager } from '@metric-org/infra/tools'
import {
  asClass,
  asValue,
  AwilixContainer,
  createContainer,
  Lifetime,
  Resolver,
} from 'awilix'

import { ServiceProvider } from '@/ServiceProvider'

type Class<T = unknown> = new (...args: any[]) => T

/**
 * Interface para as dependências de plataforma que são fornecidas externamente.
 * Ela define as implementações concretas que são fixas para a plataforma em execução.
 */
export interface PlatformDependencies {
  jobEmitter: IEventEmitter<IJobEvents>
  credentialsStorage: ICredentialsStorage
  workspacesRepository: IWorkspacesRepository
  workspacesQuery: IWorkspacesQuery
  dataSourceResolver: IDataSourceResolver
  fileStorage: IFileStorage
}

/**
 * Implementação do Builder Pattern para configurar o contêiner Awilix de forma organizada.
 */
export class ContainerBuilder {
  private readonly container: AwilixContainer

  constructor() {
    this.container = createContainer({
      injectionMode: 'CLASSIC',
    })
  }

  /**
   * Registra as dependências de plataforma (globais e singletons).
   * @param deps As instâncias das dependências de plataforma.
   * @returns A própria instância do builder para encadeamento.
   */
  public addPlatformDependencies(deps: PlatformDependencies): this {
    this.container.register({
      jobEmitter: asValue(deps.jobEmitter),
      credentialsStorage: asValue(deps.credentialsStorage),
      workspacesRepository: asValue(deps.workspacesRepository),
      workspacesQuery: asValue(deps.workspacesQuery),
      dataSourceResolver: asValue(deps.dataSourceResolver),
      fileStorage: asValue(deps.fileStorage),
    })
    return this
  }

  /**
   * Registra os serviços da camada de aplicação.
   */
  public addApplicationServices(): this {
    this.container.register({
      sessionManager: asClass(SessionManager).scoped(),
      listTasksService: asClass(ListTaskService).scoped(),
      taskPullService: asClass(TaskPullService).scoped(),
      listTimeEntriesService: asClass(ListTimeEntriesService).scoped(),
      getCurrentUserService: asClass(GetCurrentUserService).scoped(),
      createWorkspaceService: asClass(CreateWorkspaceService).scoped(),
      listWorkspacesService: asClass(ListWorkspacesService).scoped(),
      linkDataSourceService: asClass(LinkDataSourceService).scoped(),
      unlinkDataSourceService: asClass(UnlinkDataSourceService).scoped(),
      connectDataSourceService: asClass(ConnectDataSourceService).scoped(),
      markWorkspaceAsConfiguredService: asClass(
        MarkWorkspaceAsConfiguredService,
      ).scoped(),
      disconnectDataSourceService: asClass(
        DisconnectDataSourceService,
      ).scoped(),
      getWorkspaceService: asClass(GetWorkspaceService).scoped(),
      updateWorkspaceIdentityService: asClass(
        UpdateWorkspaceIdentityService,
      ).scoped(),
      deleteWorkspaceService: asClass(DeleteWorkspaceService).scoped(),
      importAddonService: asClass(ImportAddonService).scoped(),
      timeEntriesPullService: asClass(TimeEntriesPullService).scoped(),
      timeEntriesPushService: asClass(TimeEntriesPushService).scoped(),
      metadataPullService: asClass(MetadataPullService).scoped(),
    })
    return this
  }

  /**
   * Registra as dependências da camada de infraestrutura.
   */
  public addInfrastructure(): this {
    this.container.register({
      httpClient: asClass(HttpClient).transient(),
      jwtService: asClass(JwtService).scoped(),
      fileManager: asClass(FileManager).scoped(),
      addonsFacade: asClass(AddonsFacade).scoped(),
    })
    return this
  }

  /**
   * Registra um dicionário genérico de dependências.
   * Este método permite agrupar e registrar qualquer conjunto de resolvers, como Handlers ou outros módulos.
   * @param module Um objeto contendo os resolvers para o módulo de dependências.
   * @returns A própria instância do builder para encadeamento.
   */
  public addScoped<T extends Record<string, Class>>(module: T): this {
    const scopedModule = {} as {
      [K in keyof T]: Resolver<InstanceType<T[K]>>
    }

    for (const key in module) {
      const ClassRef = module[key]
      scopedModule[key] = asClass(ClassRef).scoped() as Resolver<
        InstanceType<T[typeof key]>
      >
    }

    this.container.register(scopedModule)
    return this
  }

  public addFromPath(pathOrFile: string): this {
    let normalizedPath =
      pathOrFile.endsWith('.ts') || pathOrFile.endsWith('.js')
        ? pathOrFile.replace(/[^/\\]+$/, '*')
        : pathOrFile.endsWith('/')
          ? `${pathOrFile}*`
          : `${pathOrFile}/*`

    normalizedPath = normalizedPath.replace('*', '{!index,*}')

    this.container.loadModules([normalizedPath], {
      formatName: 'camelCase',
      resolverOptions: {
        lifetime: Lifetime.SCOPED,
      },
    })

    return this
  }

  /**
   * Finaliza a construção e retorna o contêiner configurado.
   */
  public build(): IServiceProvider {
    const serviceProvider = new ServiceProvider(this.container)

    // registra ele mesmo dentro do container
    this.container.register({
      serviceProvider: asValue(serviceProvider),
    })

    console.log('Container principal construído e dependências registradas.')
    return serviceProvider
  }
}
