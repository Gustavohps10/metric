import { FileData, IFileManager } from '@metric-org/application'
import { AppError, Either } from '@metric-org/shared/helpers'
import archiver from 'archiver'
import { fileTypeFromBuffer } from 'file-type'
import unzipper from 'unzipper'

export class FileManager implements IFileManager {
  private async toBuffer(content: FileData): Promise<Buffer> {
    if (Buffer.isBuffer(content)) return content
    if (content instanceof Uint8Array) return Buffer.from(content)

    if (content && typeof content === 'object' && 'pipe' in content) {
      const chunks: Buffer[] = []
      return new Promise((resolve, reject) => {
        ;(content as NodeJS.ReadableStream)
          .on('data', (chunk) => chunks.push(chunk))
          .on('end', () => resolve(Buffer.concat(chunks)))
          .on('error', reject)
      })
    }

    const reader = (content as ReadableStream<Uint8Array>).getReader()
    const chunks: Uint8Array[] = []
    let done = false
    while (!done) {
      const result = await reader.read()
      done = result.done ?? false
      if (result.value) chunks.push(result.value)
    }
    return Buffer.concat(chunks.map((c) => Buffer.from(c)))
  }

  async unzipInMemory(
    fileData: FileData,
  ): Promise<{ name: string; content: Buffer }[]> {
    const buffer = await this.toBuffer(fileData)
    const directory = await unzipper.Open.buffer(buffer)
    const files: { name: string; content: Buffer }[] = []

    for (const file of directory.files) {
      if (!file.path.endsWith('/')) {
        files.push({ name: file.path, content: await file.buffer() })
      }
    }

    return files
  }

  async zip(files: { name: string; content: FileData }[]): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } })
    const chunks: Buffer[] = []

    archive.on('data', (chunk) => chunks.push(chunk))
    const finalizePromise = new Promise<void>((resolve, reject) => {
      archive.on('end', resolve)
      archive.on('error', reject)
    })

    for (const { name, content } of files) {
      const bufferContent = await this.toBuffer(content)
      archive.append(bufferContent, { name })
    }

    archive.finalize()
    await finalizePromise

    return Buffer.concat(chunks)
  }

  async getMimeType(
    file: FileData,
  ): Promise<Either<AppError, { mime: string; ext: string }>> {
    const buffer = await this.toBuffer(file)
    const result = await fileTypeFromBuffer(buffer)

    if (!result)
      return Either.failure(
        AppError.ValidationError(
          'Não foi possível detectar o tipo do arquivo.',
        ),
      )

    return Either.success({ mime: result.mime, ext: result.ext })
  }
}
