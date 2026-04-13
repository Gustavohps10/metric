import {
  AppError,
  Either,
  InternalServerError,
} from '@metric-org/cross-cutting/helpers'

import { IDataSourceResolver } from '@/contracts/resolvers'
import {
  IMetadataPullUseCase,
  PullMetadataInput,
} from '@/contracts/use-cases/IMetadataPullUseCase'
import { MetadataDTO } from '@/dtos'

export class MetadataPullService implements IMetadataPullUseCase {
  constructor(private readonly dataSourceResolver: IDataSourceResolver) {}

  async execute(
    input: PullMetadataInput,
  ): Promise<Either<AppError, MetadataDTO>> {
    try {
      const adapter = await this.dataSourceResolver.getDataSource(
        input.workspaceId,
        input.pluginId,
        input.connectionInstanceId,
      )

      const metadata = await adapter.metadataQuery.getMetadata(
        input.memberId,
        input.checkpoint,
        input.batch,
      )

      return Either.success(metadata)
    } catch (error) {
      return Either.failure(
        InternalServerError.danger('Failed to pull metadata'),
      )
    }
  }
}
