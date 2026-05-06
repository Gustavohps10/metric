import { MetadataDTO } from '@metric-org/application'
import {
  IMetadataPullUseCase,
  PullMetadataInput,
} from '@metric-org/application/contracts/use-cases/IMetadataPullUseCase'
import {
  AppError,
  createResponseViewModel,
  Either,
} from '@metric-org/shared/helpers'
import { IRequest } from '@metric-org/shared/transport'
import { MetadataViewModel, ViewModel } from '@metric-org/shared/view-models'

import { HandlerBase } from '@/main/handlers/HandlerBase'

export class MetadataHandler implements HandlerBase<MetadataHandler> {
  constructor(private readonly metadataPullService: IMetadataPullUseCase) {}

  public async pull(
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<PullMetadataInput>,
  ): Promise<ViewModel<MetadataViewModel>> {
    const result: Either<AppError, MetadataDTO> =
      await this.metadataPullService.execute(body)

    return createResponseViewModel(result)
  }
}
