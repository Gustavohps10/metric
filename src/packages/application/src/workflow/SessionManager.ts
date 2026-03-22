import { ISessionManager } from '@/contracts/workflow/ISessionManager'
import { ISessionUser } from '@/contracts/workflow/ISessionUser'

export class SessionManager implements ISessionManager {
  #sessions: Map<string, ISessionUser> = new Map()

  private getSessionKey(
    workspaceId: string,
    connectionInstanceId: string,
  ): string {
    return `${workspaceId}:${connectionInstanceId}`
  }

  public getCurrentUser(
    workspaceId: string,
    connectionInstanceId: string,
  ): ISessionUser | undefined {
    const key = this.getSessionKey(workspaceId, connectionInstanceId)
    return this.#sessions.get(key)
  }

  public setCurrentUser(
    workspaceId: string,
    connectionInstanceId: string,
    user: ISessionUser,
  ): void {
    const key = this.getSessionKey(workspaceId, connectionInstanceId)
    this.#sessions.set(key, user)
  }

  public clearSession(workspaceId: string, connectionInstanceId: string): void {
    const key = this.getSessionKey(workspaceId, connectionInstanceId)
    this.#sessions.delete(key)
  }

  public clearAllSessions(): void {
    this.#sessions.clear()
  }
}
