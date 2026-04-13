import {
  AddonInstallerDTO,
  AddonManifest,
  FileData,
  IAddonsFacade,
  IImportAddonUseCase,
} from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import { ViewModel } from '@metric-org/presentation/view-models'
import { app, type IpcMainInvokeEvent } from 'electron'

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
  logo: '',
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

export class AddonsHandler {
  constructor(
    private readonly importAddonService: IImportAddonUseCase,
    private readonly addonsFacade: IAddonsFacade,
  ) {}

  public async listAvailable(
    _event?: IpcMainInvokeEvent,
    _req?: IRequest,
  ): Promise<AddonManifest[]> {
    const result = await this.addonsFacade.listAvailable()
    if (result.isFailure()) return []

    return result.success.map((a) => ({
      id: a.id,
      version: a.version,
      name: a.name,
      creator: a.creator,
      description: a.description,
      path: a.path || '',
      logo: a.logo,
      downloads: a.downloads ?? 0,
      stars: a.stars ?? 0,
      installed: false,
      installerManifestUrl: a.installerManifestUrl,
      sourceUrl: a.sourceUrl,
      tags: a.tags,
    }))
  }

  public async listInstalled(
    _event?: IpcMainInvokeEvent,
    _req?: IRequest,
  ): Promise<AddonManifest[]> {
    if (isDevelopment()) {
      return [...DEV_ADDONS]
    }
    const result = await this.addonsFacade.listInstalled()
    if (result.isFailure()) return []

    return result.success.map((a) => ({
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
    }))
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
  ): Promise<AddonInstallerDTO | null> {
    const result = await this.addonsFacade.getInstaller(body.installerUrl)

    if (result.isFailure()) {
      return null
    }

    return result.success
  }

  public async updateLocal(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<AddonManifest>,
  ): Promise<void> {
    if (!body?.id) {
      throw new Error('INVALID_ADDON_MANIFEST')
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
    {
      body,
    }: IRequest<{
      downloadUrl: string
      onProgress?: (progress: number) => void
    }>,
  ): Promise<ViewModel> {
    try {
      // === DOWNLOAD (70%) ===
      const downloadResult = await this.addonsFacade.downloadFile(
        body.downloadUrl,
        (p) => body.onProgress?.(p * 0.7), // normaliza para 70%
      )

      if (downloadResult.isFailure()) {
        return {
          isSuccess: false,
          error: downloadResult.failure.messageKey,
          statusCode: 500,
        }
      }

      const fileData = downloadResult.success

      // === IMPORTAÇÃO / EXTRAÇÃO (30%) ===
      body.onProgress?.(70) // início da segunda fase
      const result = await this.importAddonService.execute(fileData)
      body.onProgress?.(100) // finalizado

      if (result.isFailure()) {
        return {
          isSuccess: false,
          error: result.failure.messageKey,
          statusCode: result.failure.statusCode,
        }
      }

      return { isSuccess: true, statusCode: 200 }
    } catch (err) {
      console.error('Addon install failed:', err)
      return { isSuccess: false, error: 'INSTALL_FAILED', statusCode: 500 }
    }
  }
}
