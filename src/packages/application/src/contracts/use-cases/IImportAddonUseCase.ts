import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { IJobEvent } from '@metric-org/cross-cutting/transport'

import { FileData } from '@/contracts/infra'

export interface IImportAddonUseCase {
  execute(
    fileData: FileData,
    onProgress?: (event: IJobEvent) => void,
  ): Promise<Either<AppError, void>>
}
