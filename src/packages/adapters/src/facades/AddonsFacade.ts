import {
  AddonInstallerDTO,
  AddonManifestDTO,
  IAddonsFacade,
} from '@metric-org/application'
import { AppError, Either } from '@metric-org/shared/helpers'
import { IJobEvent } from '@metric-org/shared/transport'
import axios from 'axios'
import { promises as fs } from 'fs'
import yaml from 'js-yaml'
import { join } from 'path'

const LOCAL_ADDONS_PATH = './addons/datasource'

type RawManifest = {
  AddonId?: string
  Version?: string
  Name?: string
  Author?: string
  ShortDescription?: string
  Description?: string
  IconUrl?: string
  SourceUrl?: string
  InstallerUrl?: string
  Tags?: string[]
}

type RawPackage = {
  Version?: string
  RequiredApiVersion?: string
  ReleaseDate?: string
  DownloadUrl?: string
  Changelog?: string[]
}

type RawInstaller = {
  AddonId?: string
  Packages?: RawPackage[]
}

export class AddonsFacade implements IAddonsFacade {
  public async listAvailable(): Promise<Either<AppError, AddonManifestDTO[]>> {
    try {
      const indexUrl =
        'https://metric-org.github.io/addons-manifest/addonDatabase/dataSource/index.json'
      const { data: yamlFiles } = await axios.get<string[]>(indexUrl)

      const addons: AddonManifestDTO[] = await Promise.all(
        yamlFiles.map(async (filename) => {
          const yamlUrl = `https://metric-org.github.io/addons-manifest/addonDatabase/dataSource/${filename}`
          const { data: rawYaml } = await axios.get(yamlUrl)
          const parsed = await this.parseManifest(rawYaml)
          if (parsed.isFailure()) throw parsed.failure
          return parsed.success
        }),
      )

      return Either.success(addons)
    } catch {
      return Either.failure(AppError.NotFound('FAILED_TO_FETCH_ADDONS'))
    }
  }

  public async listInstalled(): Promise<Either<AppError, AddonManifestDTO[]>> {
    try {
      const files = await fs.readdir(LOCAL_ADDONS_PATH)
      const installedAddons: AddonManifestDTO[] = []

      for (const folder of files) {
        const manifestPath = join(LOCAL_ADDONS_PATH, folder, 'manifest.yaml')
        try {
          const content = await fs.readFile(manifestPath)
          const manifestResult = await this.parseManifest(content)
          if (manifestResult.isSuccess()) {
            const addon = { ...manifestResult.success, installed: true }
            const base64Logo = await this.getLocalIconBase64(addon.id)
            if (base64Logo) addon.logo = base64Logo
            installedAddons.push(addon)
          }
        } catch {
          continue
        }
      }

      return Either.success(installedAddons)
    } catch {
      return Either.failure(
        AppError.NotFound('FAILED_TO_LIST_INSTALLED_ADDONS'),
      )
    }
  }

  public async getInstalledById(
    addonId: string,
  ): Promise<Either<AppError, AddonManifestDTO>> {
    const result = await this.listInstalled()
    if (result.isFailure()) return result.forwardFailure()

    const addon = result.success.find((a) => a.id === addonId)
    if (!addon)
      return Either.failure(AppError.NotFound('LOCAL_ADDON_NOT_FOUND'))

    const base64Logo = await this.getLocalIconBase64(addonId)
    if (base64Logo) addon.logo = base64Logo

    return Either.success(addon)
  }

  public async getInstaller(
    installerUrl: string,
  ): Promise<Either<AppError, AddonInstallerDTO>> {
    try {
      const { data: rawYaml } = await axios.get(installerUrl)
      return this.parseInstaller(rawYaml)
    } catch {
      return Either.failure(AppError.NotFound('FAILED_TO_FETCH_INSTALLER'))
    }
  }

  public async parseManifest(
    fileContent: Buffer | string,
  ): Promise<Either<AppError, AddonManifestDTO>> {
    try {
      const doc = yaml.load(fileContent.toString()) as RawManifest

      if (!doc.AddonId)
        return Either.failure(AppError.NotFound('ADDONID_NOT_FOUND'))

      const addon: AddonManifestDTO = {
        id: doc.AddonId,
        version: doc.Version ?? '',
        name: doc.Name ?? '',
        creator: doc.Author ?? '',
        description: doc.ShortDescription ?? doc.Description ?? '',
        logo: doc.IconUrl ?? '',
        sourceUrl: doc.SourceUrl ?? '',
        tags: doc.Tags ?? [],
        installed: false,
        installerManifestUrl: doc.InstallerUrl,
        path: '',
        downloads: 0,
        stars: 1,
      }

      return Either.success(addon)
    } catch {
      return Either.failure(AppError.NotFound('FAILED_TO_PARSE_MANIFEST'))
    }
  }

  public async parseInstaller(
    fileContent: Buffer | string,
  ): Promise<Either<AppError, AddonInstallerDTO>> {
    try {
      const doc = yaml.load(fileContent.toString()) as RawInstaller

      if (!doc.AddonId)
        return Either.failure(AppError.ValidationError('INSTALLER_INVALID'))

      const installer: AddonInstallerDTO = {
        id: doc.AddonId,
        packages: (doc.Packages ?? []).map((pkg) => ({
          version: pkg.Version ?? '',
          requiredApiVersion: pkg.RequiredApiVersion ?? '',
          releaseDate: pkg.ReleaseDate ?? '',
          downloadUrl: pkg.DownloadUrl ?? '',
          changelog: pkg.Changelog ?? [],
        })),
      }

      return Either.success(installer)
    } catch {
      return Either.failure(AppError.NotFound('FAILED_TO_PARSE_INSTALLER'))
    }
  }

  public async downloadFile(
    downloadUrl: string,
    onProgress?: (event: IJobEvent) => void,
  ): Promise<Either<AppError, Uint8Array>> {
    try {
      // Envia mensagem inicial
      onProgress?.({
        status: 'data',
        data: 'Conectando ao servidor de download...',
      })

      let lastLoggedPercent = -1

      const response = await axios.get<ArrayBuffer>(downloadUrl, {
        responseType: 'arraybuffer',
        onDownloadProgress: (progressEvent) => {
          if (!onProgress || !progressEvent.total) return

          const { loaded, total } = progressEvent

          const percent = Math.floor((loaded / total) * 100)
          onProgress({ status: 'progress', value: percent })
          const loadedMB = (loaded / 1024 / 1024).toFixed(2)
          const totalMB = (total / 1024 / 1024).toFixed(2)
          if (percent % 10 === 0 && percent !== lastLoggedPercent) {
            lastLoggedPercent = percent

            onProgress({
              status: 'data',
              data: `Baixando: ${loadedMB} MB / ${totalMB} MB (${percent}%)`,
            })
          }
        },
      })

      onProgress?.({ status: 'data', data: 'Download concluído com sucesso!' })
      return Either.success(new Uint8Array(response.data))
    } catch (error) {
      return Either.failure(AppError.NotFound('DOWNLOAD_FAILED'))
    }
  }

  private async getLocalIconBase64(addonId: string): Promise<string | null> {
    const possibleIcons = ['icon.png', 'icon.jpg', 'icon.jpeg']
    for (const iconName of possibleIcons) {
      const iconPath = join(LOCAL_ADDONS_PATH, addonId, iconName)
      try {
        const file = await fs.readFile(iconPath)
        const ext = iconName.split('.').pop()
        return `data:image/${ext};base64,${file.toString('base64')}`
      } catch {
        continue
      }
    }
    return null
  }
}
