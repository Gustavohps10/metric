import { TimeEntry } from '@metric-org/domain'
import { AppError, Either } from '@metric-org/shared/helpers'

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
      const sessionUser = this.sessionManager.getCurrentUser(
        input.workspaceId,
        input.connectionInstanceId,
      )
      if (!sessionUser) {
        return Either.failure(AppError.Unauthorized('USUARIO_NAO_ENCONTRADO'))
      }

      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )
      if (!workspace) {
        return Either.failure(AppError.Unauthorized('WORKSPACE_NAO_ENCONTRADO'))
      }

      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,

        input.connectionInstanceId,
      )

      const timeEntryRepository = adapter.timeEntryRepository
      const results: SyncTimeEntryDTO[] = []

      for (const entry of input.entries) {
        results.push(await this.processEntry(entry, timeEntryRepository))
      }

      return Either.success(results)
    } catch {
      return Either.failure(AppError.Internal('ERRO_INESPERADO'))
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
        validationError: AppError.ValidationError(
          'ERRO_PROCESSAMENTO_DOCUMENTO',
        ),
      }
    }
  }

  private validateDocument(entry: SyncTimeEntryDTO): AppError | null {
    const { id, updatedAt, _deleted } = entry
    if (!id) return AppError.ValidationError('DOCUMENT_ID_MISSING')
    if (!_deleted && !updatedAt)
      return AppError.ValidationError('DOCUMENT_UPDATED_AT_MISSING')
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
      existing.updatedAt.valueOf() !== assumedMasterState.updatedAt?.valueOf()

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
      return {
        ...entry,
        validationError: resultUpdateHours.forwardFailure().failure,
      }
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
        validationError: AppError.ValidationError('TIME_ENTRY_INVALID'),
      }

    await timeEntryRepository.create(result.success)
    return { ...entry, syncedAt: new Date() }
  }
}
