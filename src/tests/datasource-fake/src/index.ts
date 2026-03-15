import type { FieldGroup, IDataSource } from '@timelapse/sdk'

import { FakeAuthenticationStrategy } from './FakeAuthenticationStrategy'
import { FakeMemberQuery } from './FakeMemberQuery'
import { FakeMetadataQuery } from './FakeMetadataQuery'
import { FakeTaskQuery } from './FakeTaskQuery'
import { FakeTaskRepository } from './FakeTaskRepository'
import { FakeTimeEntryQuery } from './FakeTimeEntryQuery'
import { FakeTimeEntryRepository } from './FakeTimeEntryRepository'

const configFields: { credentials: FieldGroup[]; configuration: FieldGroup[] } =
  {
    credentials: [],
    configuration: [],
  }

const FakeDataSource: IDataSource = {
  id: 'timelapse-datasource-fake',
  dataSourceType: 'fake',
  displayName: 'DataSource Fake (Testes)',
  configFields,

  getAuthenticationStrategy: () => new FakeAuthenticationStrategy(),
  getTaskQuery: (ctx) => new FakeTaskQuery(ctx),
  getTimeEntryQuery: (ctx) => new FakeTimeEntryQuery(ctx),
  getTimeEntryRepository: () => new FakeTimeEntryRepository(),
  getMemberQuery: (ctx) => new FakeMemberQuery(ctx),
  getTaskRepository: () => new FakeTaskRepository(),
  getMetadataQuery: (ctx) => new FakeMetadataQuery(ctx),
}

export default FakeDataSource
