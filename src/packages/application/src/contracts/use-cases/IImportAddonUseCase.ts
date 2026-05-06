import { AppError, Either } from '@metric-org/shared/helpers'
import { IJobEvent } from '@metric-org/shared/transport'

import { FileData } from '@/contracts/infra'

export interface IImportAddonUseCase {
  execute(
    fileData: FileData,
    onProgress?: (event: IJobEvent) => void,
  ): Promise<Either<AppError, void>>
}
