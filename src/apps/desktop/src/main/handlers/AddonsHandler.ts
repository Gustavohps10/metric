import {
  AddonManifest,
  FileData,
  IAddonsFacade,
  IImportAddonUseCase,
} from '@metric-org/application'
import {
  IEventEmitter,
  IJobEvents,
  IJobResult,
  IRequest,
} from '@metric-org/cross-cutting/transport'
import {
  AddonInstallerViewModel,
  AddonManifestViewModel,
  PaginatedViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'
import { app, type IpcMainInvokeEvent } from 'electron'

import { HandlerContract } from '@/main/handlers/HandlerBase'
import {
  FAKE_DATASOURCE_ADDON_ID,
  REDMINE4TEST_ADDON_ID,
} from '@/main/resolvers/data-source-resolver'

const DEV_FAKE_MANIFEST: AddonManifest = {
  id: FAKE_DATASOURCE_ADDON_ID,
  name: 'DataSource Fake (Testes)',
  creator: 'Metric',
  description:
    'Datasource mock com 1000 tarefas e 1000 apontamentos locais para testes e validação de envio de dados.',
  path: '',
  logo: '',
  downloads: 0,
  version: '1.0.0',
  stars: 0,
  installed: true,
  tags: ['teste', 'mock', 'desenvolvimento'],
}

const DEV_REDMINE_MANIFEST: AddonManifest = {
  id: REDMINE4TEST_ADDON_ID,
  name: 'Redmine (Oficial)',
  creator: 'Metric',
  description: 'Conector Redmine para testes.',
  path: '',
  logo: 'https://raw.githubusercontent.com/Gustavohps10/redmine-plugin/main/src/icon.png',
  downloads: 0,
  version: '1.0.3',
  stars: 0,
  installed: true,
  tags: ['redmine', 'teste'],
}

const DEV_ADDONS: AddonManifest[] = [DEV_FAKE_MANIFEST, DEV_REDMINE_MANIFEST]

function isDevelopment(): boolean {
  return !app.isPackaged
}

export class AddonsHandler implements HandlerContract<AddonsHandler> {
  constructor(
    private readonly importAddonService: IImportAddonUseCase,
    private readonly addonsFacade: IAddonsFacade,
    private readonly jobEmitter: IEventEmitter<IJobEvents>,
  ) {}

  public async listAvailable(
    _event?: IpcMainInvokeEvent,
    _req?: IRequest,
  ): Promise<PaginatedViewModel<AddonManifestViewModel[]>> {
    const result = await this.addonsFacade.listAvailable()
    if (result.isFailure())
      return {
        isSuccess: false,
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        statusCode: result.failure.statusCode,
        error: result.failure.messageKey,
      }
    return {
      isSuccess: true,
      statusCode: 200,
      data: result.success,
      totalItems: result.success.length,
      totalPages: 1,
      currentPage: 1,
    }
  }

  public async listInstalled(
    _event?: IpcMainInvokeEvent,
    _req?: IRequest,
  ): Promise<PaginatedViewModel<AddonManifestViewModel[]>> {
    if (isDevelopment()) {
      return {
        isSuccess: true,
        statusCode: 200,
        data: [...DEV_ADDONS],
        totalItems: DEV_ADDONS.length,
        totalPages: 1,
        currentPage: 1,
      }
    }

    const result = await this.addonsFacade.listInstalled()

    if (result.isFailure()) {
      return {
        isSuccess: false,
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
        statusCode: result.failure.statusCode,
        error: result.failure.messageKey,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
      data: result.success,
      totalItems: result.success.length,
      totalPages: 1,
      currentPage: 1,
    }
  }

  public async getInstalledById(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<{ addonId: string }>,
  ): Promise<ViewModel<AddonManifest>> {
    if (isDevelopment()) {
      const dev = DEV_ADDONS.find((a) => a.id === body.addonId)
      if (dev) {
        return { isSuccess: true, statusCode: 200, data: dev }
      }
    }
    const result = await this.addonsFacade.getInstalledById(body.addonId)
    if (result.isFailure()) {
      return {
        isSuccess: false,
        statusCode: result.failure.statusCode,
        error: result.failure.messageKey,
      }
    }

    const a = result.success
    return {
      isSuccess: true,
      statusCode: 200,
      data: {
        id: a.id,
        version: a.version,
        name: a.name,
        creator: a.creator,
        description: a.description,
        path: a.path || '',
        logo: a.logo,
        downloads: a.downloads ?? 0,
        stars: a.stars ?? 0,
        installed: true,
        sourceUrl: a.sourceUrl,
        tags: a.tags,
      },
    }
  }

  public async getInstaller(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<{ installerUrl: string }>,
  ): Promise<ViewModel<AddonInstallerViewModel>> {
    const result = await this.addonsFacade.getInstaller(body.installerUrl)

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

  public async updateLocal(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<AddonManifest>,
  ): Promise<ViewModel<void>> {
    if (!body?.id) {
      return {
        isSuccess: false,
        statusCode: 400,
        error: 'INVALID_ADDON_MANIFEST',
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
    }
  }

  public async import(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<{ addon: FileData }>,
  ): Promise<ViewModel> {
    const result = await this.importAddonService.execute(body.addon)

    if (result.isFailure()) {
      return {
        isSuccess: false,
        error: result.failure.messageKey,
        statusCode: result.failure.statusCode,
      }
    }

    return {
      isSuccess: true,
      statusCode: 200,
    }
  }

  public async install(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<{ downloadUrl: string }>,
  ): Promise<ViewModel<IJobResult>> {
    const jobId = crypto.randomUUID()

    this.runInstallationJob(jobId, body.downloadUrl).catch((err) => {
      console.error(`[Fatal Job Error ${jobId}]:`, err)
    })

    return {
      isSuccess: true,
      statusCode: 200,
      data: { jobId },
    }
  }

  private async runInstallationJob(
    jobId: string,
    downloadUrl: string,
  ): Promise<void> {
    try {
      this.jobEmitter.emit(jobId, { status: 'progress', value: 0 })

      const downloadResult = await this.addonsFacade.downloadFile(
        downloadUrl,
        (event) => {
          if (event.status !== 'progress') {
            this.jobEmitter.emit(jobId, event)
            return
          }
          const scaledValue = Math.floor(event.value * 0.7)

          this.jobEmitter.emit(jobId, {
            status: 'progress',
            value: scaledValue,
          })
        },
      )

      if (downloadResult.isFailure()) {
        this.jobEmitter.emit(jobId, {
          status: 'error',
          error: downloadResult.failure.messageKey,
        })
        return
      }

      this.jobEmitter.emit(jobId, { status: 'progress', value: 70 })

      const result = await this.importAddonService.execute(
        downloadResult.success,
        (event) => {
          if (event.status !== 'progress') {
            this.jobEmitter.emit(jobId, event)
            return
          }

          const scaledValue = 70 + Math.floor(event.value * 0.3)
          this.jobEmitter.emit(jobId, {
            status: 'progress',
            value: scaledValue,
          })
        },
      )

      if (result.isFailure()) {
        this.jobEmitter.emit(jobId, {
          status: 'error',
          error: result.failure.messageKey,
        })
        return
      }

      this.jobEmitter.emit(jobId, { status: 'progress', value: 100 })
      this.jobEmitter.emit(jobId, { status: 'done' })
    } catch (err) {
      this.jobEmitter.emit(jobId, {
        status: 'error',
        error: 'INSTALL_FAILED',
      })
    }
  }
}
