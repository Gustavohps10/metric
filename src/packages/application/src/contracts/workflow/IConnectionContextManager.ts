import { IConnectionContext } from '@/contracts/workflow/IConnectionContext'

export interface IConnectionContextManager {
  get(
    workspaceId: string,
    connectionInstanceId: string,
  ): IConnectionContext | undefined

  set(context: IConnectionContext): void

  clear(workspaceId: string, connectionInstanceId: string): void

  clearAll(): void
}
