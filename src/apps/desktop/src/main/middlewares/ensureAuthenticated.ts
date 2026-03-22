import {
  IJWTService,
  IServiceProvider,
  ISessionManager,
} from '@timelapse/application'
import { Either } from '@timelapse/cross-cutting/helpers'
import { IRequest } from '@timelapse/cross-cutting/transport'
import { ViewModel } from '@timelapse/presentation/view-models'

type NextFunction<TRes> = () => Promise<Either<any, TRes>>

export function createAuthMiddleware(serviceProvider: IServiceProvider) {
  const jwtService = serviceProvider.resolve<IJWTService>('jwtService')
  const sessionManager =
    serviceProvider.resolve<ISessionManager>('sessionManager')

  return async function ensureAuthenticated<TReq, TRes>(
    _event: Electron.IpcMainInvokeEvent,
    request: IRequest<TReq>,
    next: NextFunction<TRes>,
  ): Promise<Either<ViewModel, TRes> | ViewModel> {
    const authHeader = request.headers?.authorization

    if (!authHeader) {
      return {
        isSuccess: false,
        statusCode: 401,
        error: 'ACESSO_NEGADO_TOKEN_NAO_FORNECIDO',
      }
    }

    const [, token] = authHeader.split(' ')

    if (!token || !jwtService.tokenIsValid(token)) {
      return {
        isSuccess: false,
        statusCode: 401,
        error: 'ACESSO_NEGADO_TOKEN_INVALIDO',
      }
    }

    const payload = jwtService.decodeToken(token)
    if (!payload) {
      return {
        isSuccess: false,
        statusCode: 401,
        error: 'ACESSO_NEGADO_PAYLOAD_INVALIDO',
      }
    }

    const { workspaceId, connectionInstanceId } = request.body as any

    if (!workspaceId || !connectionInstanceId) {
      return {
        isSuccess: false,
        statusCode: 400,
        error: 'AUTH_MISSING_CONTEXT_IDS',
      }
    }

    sessionManager.setCurrentUser(workspaceId, connectionInstanceId, {
      id: payload.id,
      name: payload.name,
      role: 'admin',
    })

    return next()
  }
}
