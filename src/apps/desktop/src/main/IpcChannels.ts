export const IpcChannels = {
  SYSTEM_VERSION: 'system:version',
  SYSTEM_GET_ENVIRONMENT: 'system:get-environment',

  METADATA_PULL: 'metadata:pull',

  TASKS_PULL: 'tasks:pull',
  TASKS_LIST: 'tasks:list',

  GET_TOKEN: 'token',
  SAVE_TOKEN: 'token:save',
  DELETE_TOKEN: 'token:delete',

  LIST_TIME_ENTRIES: 'time-entries',
  TIME_ENTRIES_PULL: 'time-entries:pull',
  TIME_ENTRIES_PUSH: 'time-entries:push',

  SET_HEADERS: 'set-headers',
  GET_HEADERS: 'get-headers',

  GET_CURRENT_USER: 'get-current-user',

  DISCORD_LOGIN: 'login:discord',

  WORKSPACES_CREATE: 'workspaces:create',
  WORKSPACES_GET_ALL: 'workspaces:get-all',
  WORKSPACES_GET_BY_ID: 'workspaces:get-by-id',
  WORKSPACES_GET_CONFIG_FIELDS: 'workspaces:fields',

  WORKSPACES_LINK_DATASOURCE: 'workspaces:link-datasource',
  WORKSPACES_UNLINK_DATASOURCE: 'workspaces:unlink-datasource',
  WORKSPACES_CONNECT_DATASOURCE: 'workspaces:connect-datasource',
  WORKSPACES_DISCONNECT_DATASOURCE: 'workspaces:disconnect-datasource',
  WORKSPACES_MARK_AS_CONFIGURED: 'workspaces:mark-as-configured',
  WORKSPACES_UPDATE_IDENTITY: 'workspaces:update-identity',
  WORKSPACES_DELETE: 'workspaces:delete',

  DATA_SOURCE_GET_FIELDS: 'datasource:get-fields',

  ADDONS_LIST_AVAILABLE: 'addons:list-available',
  ADDONS_LIST_INSTALLED: 'addons:list-installed',
  ADDONS_GETINSTALLED_BY_ID: 'addons:getinstalled-by-id',
  ADDONS_GET_INSTALLER: 'addons:get-installer',
  ADDONS_UPDATE_LOCAL: 'addons:update-local',
  ADDONS_IMPORT: 'addons:import',
  ADDONS_INSTALL: 'addons:install',
} as const

export type IpcChannelType = keyof typeof IpcChannels
