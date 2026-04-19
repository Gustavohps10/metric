import { Either, ValidationError } from '@metric-org/cross-cutting/helpers'
import z from 'zod'

import { Entity } from '@/entities/Entity'

const CommentSchema = z
  .string()
  .max(255, 'O comentário não pode ter mais que 255 caracteres')
  .optional()

const UserSchema = z.object({
  id: z.string().min(1, 'user.id é obrigatório'),
  name: z.string().optional(),
})

const TimeEntrySchema = z.object({
  task: z.object({ id: z.string() }),
  activity: z.object({ id: z.string().min(1) }),
  user: UserSchema,
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  timeSpent: z.number().nonnegative().optional(),
  comments: CommentSchema,
})

type TimeEntryProps = z.infer<typeof TimeEntrySchema>

export class TimeEntry extends Entity {
  private _id: string
  private _task: { id: string }
  private _activity: { id: string }
  private _user: { id: string; name?: string }
  private _startDate?: Date
  private _endDate?: Date
  private _timeSpent: number
  private _comments?: string
  private _createdAt: Date
  private _updatedAt: Date

  private constructor(
    id: string,
    task: { id: string },
    activity: { id: string },
    user: { id: string; name?: string },
    timeSpent: number,
    createdAt: Date,
    updatedAt: Date,
    startDate?: Date,
    endDate?: Date,
    comments?: string,
  ) {
    super()
    this._id = id
    this._task = task
    this._activity = activity
    this._user = user
    this._startDate = startDate
    this._endDate = endDate
    this._timeSpent = timeSpent
    this._comments = comments
    this._createdAt = createdAt
    this._updatedAt = updatedAt
  }

  static create(props: TimeEntryProps): Either<ValidationError, TimeEntry> {
    const parsed = TimeEntrySchema.safeParse(props)
    const details: Record<string, string[]> = {}

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'root'
        if (!details[key]) details[key] = []
        details[key].push(issue.message)
      }
      return Either.failure(ValidationError.danger('CAMPOS_INVALIDOS', details))
    }

    const data = parsed.data
    const now = new Date()
    const instance = new TimeEntry(
      crypto.randomUUID(),
      data.task,
      data.activity,
      data.user,
      data.timeSpent ?? 0,
      now,
      now,
      data.startDate,
      data.endDate,
      data.comments,
    )

    const hoursResult = instance.updateHours(
      data.startDate,
      data.endDate,
      data.timeSpent,
    )

    if (hoursResult.isFailure()) {
      const domainErr = hoursResult.failure
      if (domainErr.details) {
        for (const [k, v] of Object.entries(domainErr.details)) details[k] = v
      }
      return Either.failure(ValidationError.danger('CAMPOS_INVALIDOS', details))
    }

    return Either.success(instance)
  }

  get id(): string {
    return this._id
  }
  get task(): { id: string } {
    return { ...this._task }
  }
  get activity(): { id: string } {
    return { ...this._activity }
  }
  get user(): { id: string; name?: string } {
    return { ...this._user }
  }
  get startDate(): Date | undefined {
    return this._startDate
  }
  get endDate(): Date | undefined {
    return this._endDate
  }
  get timeSpent(): number {
    return this._timeSpent
  }
  get comments(): string | undefined {
    return this._comments
  }
  get createdAt(): Date {
    return this._createdAt
  }
  get updatedAt(): Date {
    return this._updatedAt
  }

  updateComments(comments?: string): Either<ValidationError, TimeEntry> {
    const parsed = CommentSchema.safeParse(comments)
    if (!parsed.success) {
      const details: Record<string, string[]> = {}
      details.comments = parsed.error.errors.map((err) => err.message)
      return Either.failure(
        ValidationError.danger('COMENTARIO_INVALIDO', details),
      )
    }
    this._comments = comments?.trim()
    this.touch()
    return Either.success(this)
  }

  updateHours(
    startDate?: Date,
    endDate?: Date,
    timeSpent?: number,
  ): Either<ValidationError, TimeEntry> {
    const hasStart = startDate !== undefined
    const hasEnd = endDate !== undefined
    const hasTime = timeSpent !== undefined

    if ((hasStart && !hasEnd) || (!hasStart && hasEnd)) {
      const details: Record<string, string[]> = {}
      if (hasStart && !hasEnd)
        details.endDate = ['endDate é obrigatório quando startDate é fornecida']
      if (!hasStart && hasEnd)
        details.startDate = [
          'startDate é obrigatório quando endDate é fornecida',
        ]
      return Either.failure(
        ValidationError.danger('DATAS_INCOMPLETAS', details),
      )
    }

    if (hasStart && hasEnd) {
      const diff = endDate!.getTime() - startDate!.getTime()
      if (diff < 0) {
        return Either.failure(
          ValidationError.danger('DATA_INVALIDA', {
            endDate: ['Data de término não pode ser anterior à de início'],
          }),
        )
      }
      const computed = Math.floor(diff / 1000)
      if (hasTime && computed !== timeSpent) {
        return Either.failure(
          ValidationError.danger('TEMPO_INCONSISTENTE', {
            timeSpent: [
              'timeSpent não corresponde ao intervalo entre as datas',
            ],
          }),
        )
      }
      this._startDate = startDate
      this._endDate = endDate
      this._timeSpent = computed
      this.touch()
      return Either.success(this)
    }

    if (!hasTime) {
      return Either.failure(
        ValidationError.danger('TEMPO_FALTANDO', {
          timeSpent: ['timeSpent é obrigatório se não fornecer datas'],
        }),
      )
    }

    this._startDate = undefined
    this._endDate = undefined
    this._timeSpent = timeSpent
    this.touch()
    return Either.success(this)
  }

  private touch() {
    this._updatedAt = new Date()
  }
}
