import {
  AppError,
  AuthenticationResult,
  Either,
  IAuthenticationStrategy,
} from '@timelapse/sdk'

import { FAKE_MEMBER } from './fakeData'

export class FakeAuthenticationStrategy implements IAuthenticationStrategy {
  async authenticate(): Promise<Either<AppError, AuthenticationResult>> {
    return Either.success({
      member: FAKE_MEMBER,
      credentials: { apiKey: FAKE_MEMBER.api_key },
    })
  }
}
