import { AppError, Either } from '@metric-org/shared/helpers'
import { IJobEvent } from '@metric-org/shared/transport'

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
    onProgress?: (event: IJobEvent) => void,
  ): Promise<Either<AppError, Uint8Array>>
}
