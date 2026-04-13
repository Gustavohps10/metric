import type {
  DataSourceContext,
  PagedResultDTO,
  PaginationOptionsDTO,
  TimeEntryDTO,
} from '@metric-org/sdk'

import { FAKE_TIME_ENTRIES } from './fakeData'

export class FakeTimeEntryQuery {
  constructor(private readonly _context: DataSourceContext) {}

  async findByMemberId(
    _memberId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<PagedResultDTO<TimeEntryDTO>> {
    const items = FAKE_TIME_ENTRIES.filter((e) => {
      const d = e.startDate ?? e.createdAt
      return d >= startDate && d <= endDate
    })
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
    }
  }

  async pull(
    _memberId: string,
    checkpoint: { updatedAt: Date; id: string },
    batch: number,
  ): Promise<TimeEntryDTO[]> {
    const sorted = [...FAKE_TIME_ENTRIES].sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    )
    const idx = checkpoint.id
      ? sorted.findIndex((e) => e.id === checkpoint.id) + 1
      : 0
    return sorted.slice(idx, idx + batch)
  }

  async findAll(
    _pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<TimeEntryDTO>> {
    return {
      items: FAKE_TIME_ENTRIES,
      total: FAKE_TIME_ENTRIES.length,
      page: 1,
      pageSize: FAKE_TIME_ENTRIES.length,
    }
  }

  async findById(id: string): Promise<TimeEntryDTO | undefined> {
    return FAKE_TIME_ENTRIES.find((e) => e.id === id)
  }

  async findByIds(ids: string[]): Promise<TimeEntryDTO[]> {
    const set = new Set(ids)
    return FAKE_TIME_ENTRIES.filter((e) => e.id && set.has(e.id))
  }

  async findByCondition(
    _condition: Partial<TimeEntryDTO>,
    pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<TimeEntryDTO>> {
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 50
    const start = (page - 1) * pageSize
    return {
      items: FAKE_TIME_ENTRIES.slice(start, start + pageSize),
      total: FAKE_TIME_ENTRIES.length,
      page,
      pageSize,
    }
  }

  async count(): Promise<number> {
    return FAKE_TIME_ENTRIES.length
  }

  async exists(): Promise<boolean> {
    return FAKE_TIME_ENTRIES.length > 0
  }
}
