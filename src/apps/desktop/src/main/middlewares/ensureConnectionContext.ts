import {
  IConnectionContextManager,
  ICredentialsStorage,
  IServiceProvider,
} from '@metric-org/application'
import { Either } from '@metric-org/cross-cutting/helpers'
import { IRequest } from '@metric-org/cross-cutting/transport'
import { ViewModel } from '@metric-org/presentation/view-models'
import { IpcMainInvokeEvent } from 'electron'

type NextFunction<TRes> = () => Promise<Either<any, TRes>>

export function createConnectionContextMiddleware(
  serviceProvider: IServiceProvider,
) {
  const contextManager = serviceProvider.resolve<IConnectionContextManager>(
    'connectionContextManager',
  )

  const credentialsStorage =
    serviceProvider.resolve<ICredentialsStorage>('credentialsStorage')

  return async function ensureConnectionContext<TReq, TRes>(
    _event: IpcMainInvokeEvent,
    request: IRequest<TReq>,
    next: NextFunction<TRes>,
  ): Promise<Either<ViewModel, TRes> | ViewModel> {
    const { workspaceId, connectionInstanceId } = request.body as any

    if (!workspaceId || !connectionInstanceId) {
      return {
        isSuccess: false,
        statusCode: 400,
        error: 'AUTH_MISSING_CONTEXT_IDS',
      }
    }

    let context = contextManager.get(workspaceId, connectionInstanceId)

    if (!context) {
      const storageKey = `workspace-connection-${workspaceId}-${connectionInstanceId}`
      const memberRaw = await credentialsStorage.getToken('metric', storageKey)
      const member = memberRaw ? JSON.parse(memberRaw) : undefined
      context = {
        workspaceId,
        connectionInstanceId,
        member,
      }

      contextManager.set(context)
    }

    return next()
  }
}
