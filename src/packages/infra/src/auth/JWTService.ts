import { IJWTService } from '@metric-org/application'
import jwt from 'jsonwebtoken'

export class JwtService implements IJWTService {
  private readonly secret: string

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default_secret_TROCAR_FUTURAMENTE'
  }

  public generateToken<T extends Record<string, unknown>>(payload: T): string {
    return jwt.sign(payload, this.secret, { expiresIn: '1h' })
  }

  public tokenIsValid(token: string): boolean {
    try {
      jwt.verify(token, this.secret)
      return true
    } catch {
      return false
    }
  }

  public decodeToken<T extends Record<string, unknown>>(
    token: string,
  ): T | undefined {
    try {
      const decoded = jwt.decode(token)
      return decoded as T | undefined
    } catch {
      return undefined
    }
  }
}
