import {
  AppError,
  Either,
  InternalServerError,
  UnauthorizedError,
  ValidationError,
} from '@timelapse/cross-cutting/helpers'
import { TimeEntry } from '@timelapse/domain'

import {
  IDataSourceResolver,
  ITimeEntryRepository,
  IWorkspacesRepository,
} from '@/contracts'
import {
  ITimeEntriesPushUseCase,
  PushTimeEntriesInput,
  SyncTimeEntryDTO,
} from '@/contracts/use-cases'
import { SessionManager } from '@/workflow'

export class TimeEntriesPushService implements ITimeEntriesPushUseCase {
  constructor(
    private readonly sessionManager: SessionManager,
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly dataSourceResolver: IDataSourceResolver,
  ) {}

  public async execute(
    input: PushTimeEntriesInput,
  ): Promise<Either<AppError, SyncTimeEntryDTO[]>> {
    try {
      const user = this.sessionManager.getCurrentUser()
      if (!user)
        return Either.failure(
          UnauthorizedError.danger('USUARIO_NAO_ENCONTRADO'),
        )

      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )
      if (!workspace || workspace.dataSource === 'local') {
        return Either.failure(
          UnauthorizedError.danger('Workspace não configurado'),
        )
      }

      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.dataSourceId,
      )
      const timeEntryRepository = adapter.timeEntryRepository

      const results: SyncTimeEntryDTO[] = []

      for (const entry of input.entries) {
        results.push(await this.processEntry(entry, timeEntryRepository))
      }

      return Either.success(results)
    } catch {
      return Either.failure(InternalServerError.danger('ERRO_INESPERADO'))
    }
  }

  private async processEntry(
    entry: SyncTimeEntryDTO,
    timeEntryRepository: ITimeEntryRepository,
  ): Promise<SyncTimeEntryDTO> {
    const { id, _deleted } = entry

    const validationError = this.validateDocument(entry)
    if (validationError) return { ...entry, validationError: validationError }

    try {
      if (_deleted) return this.handleDeleted(entry, timeEntryRepository)

      const existing = await timeEntryRepository.findById(id!)

      if (existing)
        return this.handleExisting(entry, existing, timeEntryRepository)

      return this.handleNew(entry, timeEntryRepository)
    } catch {
      return {
        ...entry,
        validationError: ValidationError.danger('ERRO_PROCESSAMENTO_DOCUMENTO'),
      }
    }
  }

  private validateDocument(entry: SyncTimeEntryDTO): ValidationError | null {
    const { id, updatedAt, _deleted } = entry
    if (!id) return ValidationError.danger('DOCUMENT_ID_MISSING')
    if (!_deleted && !updatedAt)
      return ValidationError.danger('DOCUMENT_UPDATED_AT_MISSING')
    return null
  }

  private async handleDeleted(
    entry: SyncTimeEntryDTO,
    timeEntryRepository: ITimeEntryRepository,
  ): Promise<SyncTimeEntryDTO> {
    await timeEntryRepository.delete(entry.id!)
    return { ...entry, syncedAt: new Date() }
  }

  private async handleExisting(
    entry: SyncTimeEntryDTO,
    existing: TimeEntry,
    timeEntryRepository: ITimeEntryRepository,
  ): Promise<SyncTimeEntryDTO> {
    const { assumedMasterState } = entry

    const isConflict =
      assumedMasterState &&
      existing.updatedAt.getTime() !== assumedMasterState.updatedAt?.getTime()

    if (isConflict)
      return {
        ...entry,
        conflicted: true,
        conflictData: { server: existing, local: entry },
      }

    const resultUpdateHours = existing.updateHours(
      entry.startDate,
      entry.endDate,
      entry.timeSpent,
    )

    if (resultUpdateHours.isFailure()) {
      return { ...entry, validationError: resultUpdateHours.failure }
    }

    existing.updateComments(entry.comments)
    await timeEntryRepository.update(existing)

    return { ...entry, syncedAt: new Date() }
  }

  private async handleNew(
    entry: SyncTimeEntryDTO,
    timeEntryRepository: ITimeEntryRepository,
  ): Promise<SyncTimeEntryDTO> {
    const result = TimeEntry.create({
      task: { id: entry.task.id },
      activity: { id: entry.activity.id },
      user: { id: entry.user.id, name: entry.user.name },
      startDate: entry.startDate,
      endDate: entry.endDate,
      timeSpent: entry.timeSpent,
      comments: entry.comments,
    })

    if (result.isFailure())
      return {
        ...entry,
        validationError: ValidationError.danger('TIME_ENTRY_INVALID'),
      }

    await timeEntryRepository.create(result.success)
    return { ...entry, syncedAt: new Date() }
  }
}
