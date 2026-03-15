import type {
  DataSourceContext,
  PagedResultDTO,
  PaginationOptionsDTO,
  TaskDTO,
} from '@timelapse/sdk'

import { FAKE_TASKS } from './fakeData'

export class FakeTaskQuery {
  constructor(private readonly _context: DataSourceContext) {}

  async pull(
    _memberId: string,
    checkpoint: { updatedAt: Date; id: string },
    batch: number,
  ): Promise<TaskDTO[]> {
    const sorted = [...FAKE_TASKS].sort(
      (a, b) =>
        new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
    )
    const idx = checkpoint.id
      ? sorted.findIndex((t) => t.id === checkpoint.id) + 1
      : 0
    return sorted.slice(idx, idx + batch)
  }

  async findAll(
    _pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<TaskDTO>> {
    return {
      items: FAKE_TASKS,
      total: FAKE_TASKS.length,
      page: 1,
      pageSize: FAKE_TASKS.length,
    }
  }

  async findById(id: string): Promise<TaskDTO | undefined> {
    return FAKE_TASKS.find((t) => t.id === id)
  }

  async findByIds(ids: string[]): Promise<TaskDTO[]> {
    const set = new Set(ids)
    return FAKE_TASKS.filter((t) => set.has(t.id))
  }

  async findByCondition(
    _condition: Partial<TaskDTO>,
    pagination?: PaginationOptionsDTO,
  ): Promise<PagedResultDTO<TaskDTO>> {
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 50
    const start = (page - 1) * pageSize
    return {
      items: FAKE_TASKS.slice(start, start + pageSize),
      total: FAKE_TASKS.length,
      page,
      pageSize,
    }
  }

  async count(): Promise<number> {
    return FAKE_TASKS.length
  }

  async exists(): Promise<boolean> {
    return FAKE_TASKS.length > 0
  }
}
