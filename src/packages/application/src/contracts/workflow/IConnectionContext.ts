import { ISessionUser } from '@/contracts/workflow/ISessionUser'

export interface IConnectionContext {
  workspaceId: string
  connectionInstanceId: string
  member?: ISessionUser
}
