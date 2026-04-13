import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { AxiosRequestConfig } from 'axios'

export interface IHttpClient {
  configure(config: { baseURL: string; params?: Record<string, string> }): void
  get<T>(url: string, config?: AxiosRequestConfig): Promise<Either<AppError, T>>
  post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>>
  put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>>
  patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>>
  delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>>
}
