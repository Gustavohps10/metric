import type { DataSourceContext, MetadataDTO } from '@metric-org/sdk'

import { FAKE_METADATA } from './fakeData'

export class FakeMetadataQuery {
  constructor(private readonly _context: DataSourceContext) {}

  async getMetadata(
    _memberId: string,
    _checkpoint: { updatedAt: Date; id: string },
    _batch: number,
  ): Promise<MetadataDTO> {
    return FAKE_METADATA
  }
}
