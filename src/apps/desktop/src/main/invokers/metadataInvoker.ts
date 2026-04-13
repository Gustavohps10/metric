import { IMetadataAPI } from '@metric-org/application'
import { PullMetadataInput } from '@metric-org/application/contracts/use-cases/IMetadataPullUseCase'
import { IRequest } from '@metric-org/cross-cutting/transport'
import {
  MetadataViewModel,
  ViewModel,
} from '@metric-org/presentation/view-models'

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
