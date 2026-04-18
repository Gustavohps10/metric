import {
  Either,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from '@metric-org/cross-cutting/helpers'
import type { Mocked } from 'vitest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { FileData, IFileManager } from '@/contracts'
import type { IAddonsFacade } from '@/contracts/facades'

import { ImportAddonService } from './ImportAddonService'

describe('ImportAddonService', () => {
  let sut: ImportAddonService

  let fileManagerMock: Mocked<IFileManager>
  let addonsFacadeMock: Mocked<IAddonsFacade>

  const fakeCurrentTime = 1680000000000 // Valor fixo para o Date.now()
  const expectedTempPath = `./temp/${fakeCurrentTime}-addon/addon.zip`

  const makeFakeFileData = (): FileData =>
    Buffer.from('fake-zip-content') as any

  const makeExtractedFiles = () => [
    { name: 'manifest.yaml', content: Buffer.from('id: my-addon-123') },
    { name: 'index.js', content: Buffer.from('console.log("hello")') },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(fakeCurrentTime)

    fileManagerMock = {
      writeFile: vi.fn(),
      readFile: vi.fn(),
      unzipInMemory: vi.fn(),
      delete: vi.fn(),
    } as Partial<IFileManager> as Mocked<IFileManager>

    addonsFacadeMock = {
      parseManifest: vi.fn(),
    } as Partial<IAddonsFacade> as Mocked<IAddonsFacade>

    sut = new ImportAddonService(fileManagerMock, addonsFacadeMock)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should successfully import, extract, save addon files and delete temp file', async () => {
    // Arrange
    const inputData = makeFakeFileData()
    const extractedFiles = makeExtractedFiles()
    const fakeZipData = Buffer.from('zipped-data')
    const fakeAddonId = 'my-addon-123'

    fileManagerMock.writeFile.mockResolvedValue(undefined)
    fileManagerMock.readFile.mockResolvedValue(fakeZipData)
    fileManagerMock.unzipInMemory.mockResolvedValue(extractedFiles as any)
    addonsFacadeMock.parseManifest.mockResolvedValue(
      Either.success({ id: fakeAddonId } as any),
    )
    fileManagerMock.delete.mockResolvedValue(undefined)

    // Act
    const result = await sut.execute(inputData)

    // Assert
    expect(result.isSuccess()).toBe(true)

    // Verifica escrita e leitura do temp
    expect(fileManagerMock.writeFile).toHaveBeenNthCalledWith(
      1,
      expectedTempPath,
      inputData,
    )
    expect(fileManagerMock.readFile).toHaveBeenCalledWith(expectedTempPath)
    expect(fileManagerMock.unzipInMemory).toHaveBeenCalledWith(fakeZipData)

    expect(addonsFacadeMock.parseManifest).toHaveBeenCalledWith(
      extractedFiles[0].content,
    )

    expect(fileManagerMock.writeFile).toHaveBeenNthCalledWith(
      2,
      `./addons/datasource/${fakeAddonId}/manifest.yaml`,
      extractedFiles[0].content,
    )
    expect(fileManagerMock.writeFile).toHaveBeenNthCalledWith(
      3,
      `./addons/datasource/${fakeAddonId}/index.js`,
      extractedFiles[1].content,
    )

    expect(fileManagerMock.delete).toHaveBeenCalledWith(expectedTempPath)
  })

  it('should return InternalServerError when temp file cannot be saved', async () => {
    // Arrange
    fileManagerMock.writeFile.mockRejectedValue(new Error('Disk full'))

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'NAO_FOI_POSSIVEL_SALVAR_TEMP',
    )

    expect(fileManagerMock.readFile).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when temp file cannot be read', async () => {
    // Arrange
    fileManagerMock.writeFile.mockResolvedValue(undefined)
    fileManagerMock.readFile.mockRejectedValue(new Error('Permission denied'))

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'NAO_FOI_POSSIVEL_LER_TEMP',
    )

    expect(fileManagerMock.unzipInMemory).not.toHaveBeenCalled()
  })

  it('should return InternalServerError when unzip fails', async () => {
    // Arrange
    fileManagerMock.writeFile.mockResolvedValue(undefined)
    fileManagerMock.readFile.mockResolvedValue(Buffer.from('zip'))
    fileManagerMock.unzipInMemory.mockRejectedValue(new Error('Corrupted zip'))

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'NAO_FOI_POSSIVEL_DESCOMPACTAR',
    )
  })

  it('should return NotFoundError when manifest.yaml is not present in extracted files', async () => {
    // Arrange
    const filesWithoutManifest = [
      { name: 'index.js', content: Buffer.from('...') },
    ]

    fileManagerMock.writeFile.mockResolvedValue(undefined)
    fileManagerMock.readFile.mockResolvedValue(Buffer.from('zip'))
    fileManagerMock.unzipInMemory.mockResolvedValue(filesWithoutManifest as any)

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(NotFoundError)
    expect((result.failure as NotFoundError).messageKey).toBe(
      'MANIFEST_NAO_ENCONTRADO',
    )
  })

  it('should forward failure when parsing manifest fails', async () => {
    // Arrange
    const facadeError = ValidationError.danger('SCHEMA_INVALIDO')

    fileManagerMock.writeFile.mockResolvedValue(undefined)
    fileManagerMock.readFile.mockResolvedValue(Buffer.from('zip'))
    fileManagerMock.unzipInMemory.mockResolvedValue(makeExtractedFiles() as any)

    addonsFacadeMock.parseManifest.mockResolvedValue(
      Either.failure(facadeError),
    )

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBe(facadeError)
  })

  it('should return NotFoundError when parsed manifest does not contain an addonId', async () => {
    // Arrange
    fileManagerMock.writeFile.mockResolvedValue(undefined)
    fileManagerMock.readFile.mockResolvedValue(Buffer.from('zip'))
    fileManagerMock.unzipInMemory.mockResolvedValue(makeExtractedFiles() as any)

    addonsFacadeMock.parseManifest.mockResolvedValue(Either.success({} as any))

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(NotFoundError)
    expect((result.failure as NotFoundError).messageKey).toBe(
      'ADDONID_NAO_ENCONTRADO',
    )
  })

  it('should return InternalServerError when failing to save an extracted file to its final destination', async () => {
    // Arrange
    fileManagerMock.writeFile.mockResolvedValueOnce(undefined)
    fileManagerMock.readFile.mockResolvedValue(Buffer.from('zip'))
    fileManagerMock.unzipInMemory.mockResolvedValue(makeExtractedFiles() as any)
    addonsFacadeMock.parseManifest.mockResolvedValue(
      Either.success({ id: 'addon-123' } as any),
    )

    fileManagerMock.writeFile.mockRejectedValueOnce(new Error('I/O Error'))

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isFailure()).toBe(true)
    expect(result.failure).toBeInstanceOf(InternalServerError)
    expect((result.failure as InternalServerError).messageKey).toBe(
      'NAO_FOI_POSSIVEL_SALVAR_ARQUIVO',
    )
  })

  it('should still return success even if deleting the temporary file fails (silent catch)', async () => {
    // Arrange
    fileManagerMock.writeFile.mockResolvedValue(undefined)
    fileManagerMock.readFile.mockResolvedValue(Buffer.from('zip'))
    fileManagerMock.unzipInMemory.mockResolvedValue(makeExtractedFiles() as any)
    addonsFacadeMock.parseManifest.mockResolvedValue(
      Either.success({ id: 'addon-123' } as any),
    )

    fileManagerMock.delete.mockRejectedValue(new Error('EBUSY'))

    // Act
    const result = await sut.execute(makeFakeFileData())

    // Assert
    expect(result.isSuccess()).toBe(true)
    expect(fileManagerMock.delete).toHaveBeenCalledWith(expectedTempPath)
  })
})
