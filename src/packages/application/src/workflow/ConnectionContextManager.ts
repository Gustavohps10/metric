import { IConnectionContext } from '@/contracts/workflow/IConnectionContext'
import { IConnectionContextManager } from '@/contracts/workflow/IConnectionContextManager'

export class ConnectionContextManager implements IConnectionContextManager {
  #contexts: Map<string, IConnectionContext> = new Map()

  private getKey(workspaceId: string, connectionInstanceId: string): string {
    return `${workspaceId}:${connectionInstanceId}`
  }

  get(workspaceId: string, connectionInstanceId: string) {
    return this.#contexts.get(this.getKey(workspaceId, connectionInstanceId))
  }

  set(context: IConnectionContext) {
    const key = this.getKey(context.workspaceId, context.connectionInstanceId)

    this.#contexts.set(key, context)
  }

  clear(workspaceId: string, connectionInstanceId: string) {
    this.#contexts.delete(this.getKey(workspaceId, connectionInstanceId))
  }

  clearAll() {
    this.#contexts.clear()
  }
}
