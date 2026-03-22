import { IMetadataAPI } from '@timelapse/application'
import { PullMetadataInput } from '@timelapse/application/contracts/use-cases/IMetadataPullUseCase'
import { IRequest } from '@timelapse/cross-cutting/transport'
import {
  MetadataViewModel,
  ViewModel,
} from '@timelapse/presentation/view-models'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'

export const metadataInvoker: IMetadataAPI = {
  pull: (
    payload: IRequest<PullMetadataInput>,
  ): Promise<ViewModel<MetadataViewModel>> =>
    IpcInvoker.invoke<
      IRequest<PullMetadataInput>,
      ViewModel<MetadataViewModel>
    >('METADATA_PULL', payload),
}
