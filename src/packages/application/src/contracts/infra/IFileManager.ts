import { AppError, Either } from '@metric-org/cross-cutting/helpers'

import { FileData } from '@/contracts/infra/IFileStorage'

export interface IFileManager {
  zip(files: { name: string; content: FileData }[]): Promise<Buffer>
  unzipInMemory(
    fileData: FileData,
  ): Promise<{ name: string; content: Buffer }[]>
  getMimeType(
    file: FileData,
  ): Promise<Either<AppError, { mime: string; ext: string }>>
}
