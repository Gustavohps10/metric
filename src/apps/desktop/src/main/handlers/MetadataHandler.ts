import { MetadataDTO } from '@metric-org/application'
import {
  IMetadataPullUseCase,
  PullMetadataInput,
} from '@metric-org/application/contracts/use-cases/IMetadataPullUseCase'
import { AppError, Either } from '@metric-org/cross-cutting/helpers'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  MetadataViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'

export class MetadataHandler {
  constructor(private readonly metadataPullService: IMetadataPullUseCase) {}

  public async pull(
    _event: Electron.IpcMainInvokeEvent,
    { body }: IRequest<PullMetadataInput>,
  ): Promise<ViewModel<MetadataViewModel>> {
    const result: Either<AppError, MetadataDTO> =
      await this.metadataPullService.execute(body)

    if (result.isFailure()) {
      return {
        statusCode: 500,
        isSuccess: false,
        error: 'Erro ao listar metadados',
      }
    }

    const metadata: MetadataDTO = result.success

    return {
      statusCode: 200,
      isSuccess: true,
      data: metadata,
    }
  }
}
