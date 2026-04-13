import { ICredentialsStorage } from '@metric-org/application'
import { IRequest } from '@metric-org/cross-cutting/transport'
import { ViewModel } from '@metric-org/presentation/view-models'

export interface TokenRequest {
  service: string
  account: string
  token?: string
}

export class TokenHandler {
  constructor(private readonly credentialsStorage: ICredentialsStorage) {}

  public async saveToken(
    _event: Electron.IpcMainInvokeEvent,
    { body: { service, account, token } }: IRequest<TokenRequest>,
  ): Promise<ViewModel<void>> {
    try {
      if (!token) {
        return {
          statusCode: 500,
          isSuccess: false,
          error: 'Token is required',
          data: undefined,
        }
      }

      await this.credentialsStorage.saveToken(service, account, token)

      return {
        statusCode: 200,
        isSuccess: true,
        data: undefined,
      }
    } catch {
      return {
        statusCode: 500,
        isSuccess: false,
        error: 'Failed to save the token',
        data: undefined,
      }
    }
  }

  public async getToken(
    _event: Electron.IpcMainInvokeEvent,
    { body: { service, account } }: IRequest<TokenRequest>,
  ): Promise<ViewModel<string | null>> {
    try {
      const token = await this.credentialsStorage.getToken(service, account)
      return {
        statusCode: 200,
        isSuccess: true,
        data: token,
      }
    } catch {
      return {
        statusCode: 500,
        isSuccess: false,
        error: 'Failed to get the token',
        data: null,
      }
    }
  }

  public async deleteToken(
    _event: Electron.IpcMainInvokeEvent,
    { body: { service, account } }: IRequest<TokenRequest>,
  ): Promise<ViewModel<void>> {
    try {
      await this.credentialsStorage.deleteToken(service, account)

      return {
        statusCode: 200,
        isSuccess: true,
        data: undefined,
      }
    } catch {
      return {
        statusCode: 500,
        isSuccess: false,
        error: 'Failed to delete the token',
        data: undefined,
      }
    }
  }
}
