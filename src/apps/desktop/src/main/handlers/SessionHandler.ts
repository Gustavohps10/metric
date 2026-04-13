import { IGetCurrentUserUseCase } from '@metric-org/application'
import { MemberDTO } from '@metric-org/application'
import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  MemberViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

export interface GetCurrentUserRequest {
  workspaceId: string
  connectionInstanceId: string
}

export class SessionHandler {
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

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error:
          result.failure.messageKey || 'Falha ao encontrar usuario da sessao',
      }
    }

    const member: MemberViewModel = result.success

    return {
      statusCode: 200,
      isSuccess: true,
      data: member,
    }
  }
}
