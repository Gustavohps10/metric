import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { AddonInstallerDTO } from '@/dtos/AddonInstallerDTO'
import { AddonManifestDTO } from '@/dtos/AddonManifestDTO'

export interface IAddonsFacade {
  listAvailable(): Promise<Either<AppError, AddonManifestDTO[]>>
  listInstalled(): Promise<Either<AppError, AddonManifestDTO[]>>

  getInstalledById(addonId: string): Promise<Either<AppError, AddonManifestDTO>>
  getInstaller(
    installerUrl: string,
  ): Promise<Either<AppError, AddonInstallerDTO>>

  parseManifest(
    fileContent: Buffer | string,
  ): Promise<Either<AppError, AddonManifestDTO>>
  parseInstaller(
    fileContent: Buffer | string,
  ): Promise<Either<AppError, AddonInstallerDTO>>

  downloadFile(
    downloadUrl: string,
    onProgress?: (percent: number) => void,
  ): Promise<Either<AppError, Uint8Array>>
}
