import { ISessionUser } from '@/contracts/workflow/ISessionUser'

export interface ISessionManager {
  getCurrentUser(
    workspaceId: string,
    connectionInstanceId: string,
  ): ISessionUser | undefined
  setCurrentUser(
    workspaceId: string,
    connectionInstanceId: string,
    user: ISessionUser,
  ): void
  clearSession(workspaceId: string, connectionInstanceId: string): void
  clearAllSessions(): void
}
