export type FileData =
  | Uint8Array
  | Buffer
  | NodeJS.ReadableStream
  | ReadableStream<Uint8Array>

export interface IFileStorage {
  write(filePath: string, data: FileData): Promise<void>
  read(filePath: string): Promise<FileData>
  exists(filePath: string): Promise<boolean>
  delete(filePath: string, ignoreExtension: boolean): Promise<void>
  getPublicUrl(filePath: string): string
}
