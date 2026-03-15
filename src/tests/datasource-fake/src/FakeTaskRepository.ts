import type { Task } from '@timelapse/sdk'

const store = new Map<string, Task>()

export class FakeTaskRepository {
  async create(entity: Task): Promise<void> {
    store.set(entity.id, entity)
  }

  async update(entity: Task): Promise<void> {
    store.set(entity.id, entity)
  }

  async delete(id: string): Promise<void> {
    store.delete(id)
  }

  async findById(id: string): Promise<Task | undefined> {
    return store.get(id)
  }
}
