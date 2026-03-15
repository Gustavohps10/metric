import {
  AppError,
  Either,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from '@timelapse/cross-cutting/helpers'

import {
  GetCurrentUserInput,
  IDataSourceResolver,
  IGetCurrentUserUseCase,
  IWorkspacesRepository,
} from '@/contracts'
import { MemberDTO } from '@/dtos'
import { SessionManager } from '@/workflow'

export class GetCurrentUserService implements IGetCurrentUserUseCase {
  constructor(
    private readonly sessionManager: SessionManager,
    private readonly workspacesRepository: IWorkspacesRepository,
    private readonly dataSourceResolver: IDataSourceResolver,
  ) {}

  public async execute(
    input: GetCurrentUserInput,
  ): Promise<Either<AppError, MemberDTO>> {
    try {
      const sessionUser = this.sessionManager.getCurrentUser()
      if (!sessionUser)
        return Either.failure(UnauthorizedError.danger('USUARIO_NAO_LOGADO'))

      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )
      if (!workspace || workspace.dataSource === 'local') {
        return Either.failure(NotFoundError.danger('Workspace não configurado'))
      }

      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        workspace.dataSource,
      )

      const user = await adapter.memberQuery.findById(sessionUser.id)
      if (!user)
        return Either.failure(NotFoundError.danger('USUARIO_NAO_ENCONTRADO'))

      return Either.success(user)
    } catch (erro: unknown) {
      return Either.failure(InternalServerError.danger('ERRO_AO_OBTER_USUARIO'))
    }
  }
}
