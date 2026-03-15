import type { TimeEntry } from '@timelapse/sdk'

const store = new Map<string, TimeEntry>()

export class FakeTimeEntryRepository {
  async create(entity: TimeEntry): Promise<void> {
    const id = entity.id
    if (id) store.set(id, entity)
  }

  async update(entity: TimeEntry): Promise<void> {
    const id = entity.id
    if (id) store.set(id, entity)
  }

  async delete(id: string | undefined): Promise<void> {
    if (id) store.delete(id)
  }

  async findById(id: string | undefined): Promise<TimeEntry | undefined> {
    return id ? store.get(id) : undefined
  }
}
