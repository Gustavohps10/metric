import { DataSourceContext, IDataSource } from '@metric-org/sdk'

import { configurationFieldGroups, credentialFieldGroups } from '@/configFields'
import { RedmineAuthenticationStrategy } from '@/RedmineAuthenticationStrategy'
import { RedmineMemberQuery } from '@/RedmineMemberQuery'
import { RedmineMetadataQuery } from '@/RedmineMetadataQuery'
import { RedmineTaskQuery } from '@/RedmineTaskQuery'
import { RedmineTaskRepository } from '@/RedmineTaskRepository'
import { RedmineTimeEntryQuery } from '@/RedmineTimeEntryQuery'
import { RedmineTimeEntryRepository } from '@/RedmineTimeEntryRepository'

const RedmineDataSource: IDataSource = {
  id: '@timelapse/redmine-plugin',
  dataSourceType: 'redmine',
  displayName: 'Redmine (Oficial)',
  configFields: {
    configuration: configurationFieldGroups,
    credentials: credentialFieldGroups,
  },

  /* eslint-disable */
  getAuthenticationStrategy: (context: DataSourceContext) =>
    new RedmineAuthenticationStrategy(),
  getTaskQuery: (context: DataSourceContext) => new RedmineTaskQuery(context),
  getTimeEntryQuery: (context: DataSourceContext) =>
    new RedmineTimeEntryQuery(context),
  getTimeEntryRepository: (context: DataSourceContext) =>
    new RedmineTimeEntryRepository(context),
  getMemberQuery: (context: DataSourceContext) =>
    new RedmineMemberQuery(context),
  getTaskRepository: (context: DataSourceContext) =>
    new RedmineTaskRepository(),
  getMetadataQuery: (context: DataSourceContext) =>
    new RedmineMetadataQuery(context),
  /* eslint-enable */
}

export default RedmineDataSource
