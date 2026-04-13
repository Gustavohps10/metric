import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { FileData } from '@/contracts/infra'

export interface IImportAddonUseCase {
  execute(fileData: FileData): Promise<Either<AppError, void>>
}
