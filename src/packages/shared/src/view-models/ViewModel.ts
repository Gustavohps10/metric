export interface ViewModel<Data = void> {
  isSuccess: boolean
  statusCode: number
  data?: Data
  error?: string
}
