import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'

import { IHttpClient } from '@/contracts/IHttpClient'

export class HttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance
  private defaultParams: Record<string, string> = {}

  constructor() {
    this.axiosInstance = axios.create()
  }

  public configure(config: {
    baseURL: string
    params?: Record<string, string>
  }): void {
    this.defaultParams = config.params ?? {}
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: 10000,
    })
  }

  private mergeConfig(config?: AxiosRequestConfig): AxiosRequestConfig {
    return {
      ...config,
      params: {
        ...this.defaultParams,
        ...(config?.params ?? {}),
      },
    }
  }

  async get<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>> {
    try {
      const { data } = await this.axiosInstance.get<T>(
        url,
        this.mergeConfig(config),
      )
      return Either.success(data)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>> {
    try {
      const response = await this.axiosInstance.post<T>(
        url,
        data,
        this.mergeConfig(config),
      )
      return Either.success(response.data)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>> {
    try {
      const response = await this.axiosInstance.put<T>(
        url,
        data,
        this.mergeConfig(config),
      )
      return Either.success(response.data)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async patch<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>> {
    try {
      const response = await this.axiosInstance.patch<T>(
        url,
        data,
        this.mergeConfig(config),
      )
      return Either.success(response.data)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async delete<T>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<Either<AppError, T>> {
    try {
      const response = await this.axiosInstance.delete<T>(
        url,
        this.mergeConfig(config),
      )
      return Either.success(response.data)
    } catch (error) {
      return this.handleError(error)
    }
  }

  private handleError(error: unknown): Either<AppError, never> {
    if (error instanceof AxiosError) {
      const appError = AppError.NotFound(error.message)
      return Either.failure(appError)
    }

    const appError = AppError.NotFound('An unknown error occurred')
    return Either.failure(appError)
  }
}
