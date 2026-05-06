import { PaginatedViewModel, ViewModel } from '@metric-org/shared/view-models'

export type HandlerBase<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any
    ? (
        ...args: Parameters<T[K]>
      ) => Promise<ViewModel<any> | PaginatedViewModel<any>>
    : T[K]
}
