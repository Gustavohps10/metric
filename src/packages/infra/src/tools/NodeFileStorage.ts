import { FileData, IFileStorage } from '@metric-org/application'
import fs from 'fs'
import path, { dirname, resolve } from 'path'

export class NodeFileStorage implements IFileStorage {
  private readonly rootPath: string
  private readonly urlPrefix: string

  constructor(rootPath: string = './storage', urlPrefix: string = 'file://') {
    this.rootPath = resolve(rootPath)
    this.urlPrefix = urlPrefix
  }
  private getAbsolutePath(filePath: string): string {
    return path.join(this.rootPath, filePath)
  }

  async read(filePath: string): Promise<FileData> {
    const fullPath = this.getAbsolutePath(filePath)
    return fs.createReadStream(fullPath)
  }

  async write(filePath: string, data: FileData): Promise<void> {
    const fullPath = this.getAbsolutePath(filePath)

    await fs.promises.mkdir(dirname(fullPath), { recursive: true })
    const writeStream = fs.createWriteStream(fullPath)

    const handler = [
      Buffer.isBuffer(data) && (() => writeStream.end(data)),
      data instanceof Uint8Array && (() => writeStream.end(Buffer.from(data))),
      data &&
        typeof data === 'object' &&
        'pipe' in data &&
        (() => (data as NodeJS.ReadableStream).pipe(writeStream)),
    ].find(Boolean) as (() => void) | undefined

    if (!handler) throw new Error('Tipo de FileData não suportado para escrita')
    handler()

    return new Promise<void>((resolve, reject) => {
      writeStream.on('finish', resolve)
      writeStream.on('error', reject)
      if (data && typeof data === 'object' && 'on' in data) {
        ;(data as NodeJS.ReadableStream).on('error', reject)
      }
    })
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = this.getAbsolutePath(filePath)
    return fs.promises
      .access(fullPath)
      .then(() => true)
      .catch(() => false)
  }

  async delete(filePath: string, ignoreExtension = false): Promise<void> {
    const fullPath = this.getAbsolutePath(filePath)

    const safeUnlink = async (p: string) => {
      try {
        await fs.promises.unlink(p)
      } catch (err: any) {
        if (err?.code !== 'ENOENT') throw err
      }
    }

    if (!ignoreExtension) {
      await safeUnlink(fullPath)
      return
    }

    const dir = path.dirname(fullPath)
    const baseName = path.parse(fullPath).name

    let entries: string[] = []

    try {
      entries = await fs.promises.readdir(dir)
    } catch (err: any) {
      if (err?.code === 'ENOENT') return
      throw err
    }

    const matches = entries.filter((entry) => {
      return entry.startsWith(baseName + '.')
    })

    await Promise.all(matches.map((file) => safeUnlink(path.join(dir, file))))
  }

  getPublicUrl(filePath: string): string {
    const fullPath = this.getAbsolutePath(filePath)

    const sanitizedPrefix = this.urlPrefix.endsWith('/')
      ? this.urlPrefix.slice(0, -1)
      : this.urlPrefix

    return `${sanitizedPrefix}${fullPath.startsWith('/') ? '' : '/'}${fullPath}`
  }
}
