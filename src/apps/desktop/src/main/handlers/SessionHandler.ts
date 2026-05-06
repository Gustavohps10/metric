import { IGetCurrentUserUseCase } from '@metric-org/application'
import { MemberDTO } from '@metric-org/application'
import {
  AppError,
  createResponseViewModel,
  Either,
} from '@metric-org/shared/helpers'
import { IRequest } from '@metric-org/shared/transport'
import { MemberViewModel, ViewModel } from '@metric-org/shared/view-models'
import { IpcMainInvokeEvent } from 'electron'

import { HandlerBase } from '@/main/handlers/HandlerBase'

export interface GetCurrentUserRequest {
  workspaceId: string
  connectionInstanceId: string
}

export class SessionHandler implements HandlerBase<SessionHandler> {
  constructor(private readonly getCurrentUserService: IGetCurrentUserUseCase) {}

  public async getCurrentUser(
    _event: IpcMainInvokeEvent,
    { body }: IRequest<GetCurrentUserRequest>,
  ): Promise<ViewModel<MemberViewModel>> {
    const result: Either<AppError, MemberDTO> =
      await this.getCurrentUserService.execute({
        workspaceId: body.workspaceId,
        connectionInstanceId: body.connectionInstanceId,
      })

    return createResponseViewModel(result)
  }
}
