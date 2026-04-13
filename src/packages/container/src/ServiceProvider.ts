import { IServiceProvider } from '@metric-org/application'
import { asValue, AwilixContainer } from 'awilix'

export class ServiceProvider implements IServiceProvider {
  private scopeCache = new Map<string, IServiceProvider>()

  constructor(private readonly container: AwilixContainer) {}

  resolve<T>(token: string): T {
    return this.container.resolve<T>(token)
  }

  createScope(scopeKey?: string): IServiceProvider {
    if (scopeKey && this.scopeCache.has(scopeKey)) {
      return this.scopeCache.get(scopeKey)!
    }

    const scoped = this.container.createScope()
    const scopedProvider = new ServiceProvider(scoped)

    if (scopeKey) {
      this.scopeCache.set(scopeKey, scopedProvider)
    }

    return scopedProvider
  }

  include<T>(deps: T): void {
    const registrations: Record<string, any> = {}
    for (const key in deps) {
      registrations[key] = asValue((deps as any)[key])
    }
    this.container.register(registrations)
  }
}
