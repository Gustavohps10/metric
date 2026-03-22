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
      const sessionUser = this.sessionManager.getCurrentUser(
        input.workspaceId,
        input.connectionInstanceId,
      )

      if (!sessionUser) {
        return Either.failure(UnauthorizedError.danger('USUARIO_NAO_LOGADO'))
      }

      const workspace = await this.workspacesRepository.findById(
        input.workspaceId,
      )

      if (!workspace) {
        return Either.failure(NotFoundError.danger('WORKSPACE_NAO_ENCONTRADO'))
      }

      const connection = workspace.dataSourceConnections.find(
        (c) => c.id === input.connectionInstanceId,
      )

      if (!connection) {
        return Either.failure(
          NotFoundError.danger('CONEXAO_NAO_ENCONTRADA_OU_INVALIDA'),
        )
      }

      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        connection.dataSourceId,
        connection.id,
      )

      const user = await adapter.memberQuery.findById(sessionUser.id)

      if (!user) {
        return Either.failure(NotFoundError.danger('USUARIO_NAO_ENCONTRADO'))
      }

      return Either.success(user)
    } catch (error: unknown) {
      return Either.failure(InternalServerError.danger('ERRO_AO_OBTER_USUARIO'))
    }
  }
}
