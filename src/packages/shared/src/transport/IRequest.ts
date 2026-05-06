import { IHeaders } from '@/transport/IHeaders'

export interface IRequest<TBody = void> {
  headers?: IHeaders
  body: TBody
}
