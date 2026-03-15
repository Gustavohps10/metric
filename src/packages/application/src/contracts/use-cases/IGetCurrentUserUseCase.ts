import { AppError, Either } from '@timelapse/cross-cutting/helpers'

import { MemberDTO } from '@/dtos'

export interface GetCurrentUserInput {
  workspaceId: string
}

export interface IGetCurrentUserUseCase {
  execute(input: GetCurrentUserInput): Promise<Either<AppError, MemberDTO>>
}
