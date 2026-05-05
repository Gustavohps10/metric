import { ViewModel } from '@metric-org/presentation/view-models'

export type HandlerContract<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (...args: Parameters<T[K]>) => Promise<ViewModel<any>>
    : T[K]
}
