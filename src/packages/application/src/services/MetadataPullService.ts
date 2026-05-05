import { AppError, Either } from '@metric-org/cross-cutting/helpers'

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

      const result = await adapter.getAuthenticatedMemberData()
      if (result.isFailure()) return result.forwardFailure()

      const member = result.success

      const metadata = await adapter.metadataQuery.getMetadata(
        member.id.toString(),
        input.checkpoint,
        input.batch,
      )

      return Either.success(metadata)
    } catch (error) {
      return Either.failure(AppError.NotFound('Failed to pull metadata'))
    }
  }
}
