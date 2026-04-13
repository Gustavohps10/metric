import {
  AppError,
  Either,
  InternalServerError,
  NotFoundError,
} from '@metric-org/cross-cutting/helpers'

import { FileData, IFileManager } from '@/contracts'
import { IAddonsFacade } from '@/contracts/facades'
import { IImportAddonUseCase } from '@/contracts/use-cases'

export class ImportAddonService implements IImportAddonUseCase {
  constructor(
    private fileManager: IFileManager,
    private addonsFacade: IAddonsFacade,
  ) {}

  async execute(fileData: FileData): Promise<Either<AppError, void>> {
    const tempDir = `./temp/${Date.now()}-addon`
    const tempPath = `${tempDir}/addon.zip`

    const writeResult = await this.fileManager
      .writeFile(tempPath, fileData)
      .then(() => Either.success(undefined))
      .catch(() =>
        Either.failure(
          InternalServerError.danger('NAO_FOI_POSSIVEL_SALVAR_TEMP'),
        ),
      )
    if (writeResult.isFailure()) return writeResult

    const readResult = await this.fileManager
      .readFile(tempPath)
      .then((data) => Either.success(data))
      .catch(() =>
        Either.failure(InternalServerError.danger('NAO_FOI_POSSIVEL_LER_TEMP')),
      )
    if (readResult.isFailure()) return readResult.forwardFailure()
    const zipData = readResult.success

    const unzipResult = await this.fileManager
      .unzipInMemory(zipData)
      .then((files) => Either.success(files))
      .catch(() =>
        Either.failure(
          InternalServerError.danger('NAO_FOI_POSSIVEL_DESCOMPACTAR'),
        ),
      )
    if (unzipResult.isFailure()) return unzipResult.forwardFailure()
    const extractedFiles = unzipResult.success

    const manifestFile = extractedFiles.find((e) => e.name === 'manifest.yaml')
    if (!manifestFile)
      return Either.failure(NotFoundError.danger('MANIFEST_NAO_ENCONTRADO'))

    const manifestContentResult = await this.addonsFacade.parseManifest(
      manifestFile.content,
    )
    if (manifestContentResult.isFailure())
      return manifestContentResult.forwardFailure()
    const addonId = manifestContentResult.success.id
    if (!addonId)
      return Either.failure(NotFoundError.danger('ADDONID_NAO_ENCONTRADO'))

    for (const file of extractedFiles) {
      const finalPath = `./addons/datasource/${addonId}/${file.name}`
      const saveResult = await this.fileManager
        .writeFile(finalPath, file.content)
        .then(() => Either.success(undefined))
        .catch(() =>
          Either.failure(
            InternalServerError.danger('NAO_FOI_POSSIVEL_SALVAR_ARQUIVO'),
          ),
        )
      if (saveResult.isFailure()) return saveResult
    }

    await this.fileManager.delete(tempPath).catch(() => {})

    return Either.success(undefined)
  }
}
