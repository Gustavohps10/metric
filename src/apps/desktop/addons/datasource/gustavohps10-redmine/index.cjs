'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj }
}
function _nullishCoalesce(lhs, rhsFn) {
  if (lhs != null) {
    return lhs
  } else {
    return rhsFn()
  }
}
function _optionalChain(ops) {
  let lastAccessLHS = undefined
  let value = ops[0]
  let i = 1
  while (i < ops.length) {
    const op = ops[i]
    const fn = ops[i + 1]
    i += 2
    if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) {
      return undefined
    }
    if (op === 'access' || op === 'optionalAccess') {
      lastAccessLHS = value
      value = fn(value)
    } else if (op === 'call' || op === 'optionalCall') {
      value = fn((...args) => value.call(lastAccessLHS, ...args))
      lastAccessLHS = undefined
    }
  }
  return value
}
var _class // src/configFields.ts
var credentialFieldGroups = [
  {
    id: 'auth-api-key',
    label: 'Autentica\xE7\xE3o com Chave de API (Recomendado)',
    fields: [
      {
        id: 'apiKey',
        label: 'Sua Chave de Acesso da API',
        type: 'password',
        required: false,
      },
    ],
  },
  {
    id: 'auth-user-pass',
    label: 'Autentica\xE7\xE3o com Usu\xE1rio e Senha',
    fields: [
      {
        id: 'login',
        label: 'Usu\xE1rio',
        type: 'text',
        required: false,
      },
      {
        id: 'password',
        label: 'Senha',
        type: 'password',
        required: false,
      },
    ],
  },
]
var configurationFieldGroups = [
  {
    id: 'connection',
    label: 'Configura\xE7\xE3o da Conex\xE3o',
    fields: [
      {
        id: 'apiUrl',
        label: 'URL da sua inst\xE2ncia Redmine',
        type: 'url',
        required: true,
        placeholder: 'https://redmine.suaempresa.com',
      },
    ],
  },
]

// src/RedmineAuthenticationStrategy.ts

var _sdk = require('@metric-org/sdk')
var _axios = require('axios')
var _axios2 = _interopRequireDefault(_axios)
var RedmineAuthenticationStrategy = class {
  getApiClient(apiUrl) {
    return _axios2.default.create({ baseURL: apiUrl })
  }
  async authenticate(input) {
    try {
      const { configuration, credentials } = input
      const apiClient = this.getApiClient(configuration.apiUrl)
      const authHeaders = credentials.apiKey
        ? { 'X-Redmine-API-Key': credentials.apiKey }
        : {
            Authorization: `Basic ${Buffer.from(
              `${credentials.login}:${credentials.password}`,
            ).toString('base64')}`,
          }
      const response = await apiClient.get('/users/current.json', {
        headers: authHeaders,
      })
      const redmineUser = response.data.user
      const member = {
        id: redmineUser.id,
        login: redmineUser.login,
        firstname: redmineUser.firstname,
        lastname: redmineUser.lastname,
        admin: redmineUser.admin,
        created_on: redmineUser.created_on,
        last_login_on: redmineUser.last_login_on,
        api_key: redmineUser.api_key,
        custom_fields: redmineUser.custom_fields,
      }
      const authenticationResult = {
        member,
        credentials: {
          apiKey: member.api_key,
        },
      }
      return _sdk.Either.success(authenticationResult)
    } catch (e) {
      return _sdk.Either.failure(
        new (0, _sdk.AppError)(
          'N\xE3o foi poss\xEDvel autenticar com Redmine. Verifique suas credenciais e a URL.',
          '',
          401,
        ),
      )
    }
  }
}

// src/RedmineBase.ts

var RedmineBase =
  ((_class = class {
    constructor(context) {
      _class.prototype.__init.call(this)
      _class.prototype.__init2.call(this)
      this.context = context
    }
    __init() {
      this.apiClient = null
    }
    __init2() {
      this.cachedApiKey = null
    }
    getAuthenticatedClient() {
      console.log('CONTEXT', this.context)
      const apiUrl = _optionalChain([
        this,
        'access',
        (_) => _.context,
        'optionalAccess',
        (_2) => _2.config,
        'optionalAccess',
        (_3) => _3.apiUrl,
      ])
      const apiKey = _optionalChain([
        this,
        'access',
        (_4) => _4.context,
        'access',
        (_5) => _5.credentials,
        'optionalAccess',
        (_6) => _6.apiKey,
      ])
      if (this.apiClient && this.cachedApiKey === apiKey) {
        return this.apiClient
      }
      if (!apiUrl || !apiKey) {
        throw new Error('Nao achou API URL ou KEY PARA BUSCAR DADOS NO REDMINE')
      }
      const headers = {
        'X-Redmine-API-Key': apiKey,
      }
      this.apiClient = _axios2.default.create({
        baseURL: apiUrl,
        headers,
      })
      this.cachedApiKey = apiKey
      return this.apiClient
    }
  }),
  _class)

// src/RedmineMemberQuery.ts
var RedmineMemberQuery = class extends RedmineBase {
  constructor(context) {
    super(context)
  }
  findByCredentials(login, password) {
    throw new Error('Method not implemented.')
  }
  findAll(pagination) {
    throw new Error(
      'M\xE9todo "findAll" n\xE3o implementado para o conector Redmine.',
    )
  }
  findByIds(ids) {
    throw new Error(
      'M\xE9todo "findByIds" n\xE3o implementado para o conector Redmine.',
    )
  }
  findByCondition(condition, pagination) {
    throw new Error(
      'M\xE9todo "findByCondition" n\xE3o implementado para o conector Redmine.',
    )
  }
  count(criteria) {
    throw new Error(
      'M\xE9todo "count" n\xE3o implementado para o conector Redmine.',
    )
  }
  exists(criteria) {
    throw new Error(
      'M\xE9todo "exists" n\xE3o implementado para o conector Redmine.',
    )
  }
  async findById(id) {
    const client = await this.getAuthenticatedClient()
    const response = await client.get(`/users/${id}.json`)
    const redmineUser = response.data.user
    const member = {
      id: redmineUser.id,
      login: redmineUser.login,
      firstname: redmineUser.firstname,
      lastname: redmineUser.lastname,
      admin: redmineUser.admin,
      created_on: redmineUser.created_on,
      last_login_on: redmineUser.last_login_on,
      api_key: redmineUser.api_key,
      custom_fields: redmineUser.custom_fields,
    }
    return member
  }
}

// src/RedmineTaskQuery.ts
var RedmineTaskQuery = class {
  findAll(pagination) {
    throw new Error('Method findAll RedmineTaskQuery not implemented.')
  }
  findById(id) {
    throw new Error('Method findById RedmineTaskQuery not implemented.')
  }
  findByIds(ids) {
    throw new Error('Method findByIds RedmineTaskQuery not implemented.')
  }
  findByCondition(condition, pagination) {
    throw new Error('Method findByCondition RedmineTaskQuery not implemented.')
  }
  count(criteria) {
    throw new Error('Method count RedmineTaskQuery not implemented.')
  }
  exists(criteria) {
    throw new Error('Method exists RedmineTaskQuery not implemented.')
  }
}

// src/RedmineTaskRepository.ts
var RedmineTaskRepository = class {
  create(entity) {
    throw new Error('Method create RedmineTaskRepository not implemented.')
  }
  update(entity) {
    throw new Error('Method update RedmineTaskRepository not implemented.')
  }
  delete(id) {
    throw new Error('Method delete RedmineTaskRepository not implemented.')
  }
  findById(id) {
    throw new Error('Method findById RedmineTaskRepository not implemented.')
  }
}

// src/RedmineTimeEntryQuery.ts
var RedmineTimeEntryQuery = class extends RedmineBase {
  async findByMemberId(memberId, startDate, endDate) {
    const client = await this.getAuthenticatedClient()
    const response = await client.get('/time_entries.json', {
      params: {
        user_id: memberId,
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        limit: 100,
      },
    })
    const entries = response.data.time_entries.map((entry) => ({
      id: entry.id,
      project: { id: entry.project.id, name: entry.project.name },
      issue: {
        id: _optionalChain([
          entry,
          'access',
          (_7) => _7.issue,
          'optionalAccess',
          (_8) => _8.id,
        ]),
      },
      user: { id: entry.user.id, name: entry.user.name },
      activity: { id: entry.activity.id, name: entry.activity.name },
      hours: entry.hours,
      comments: entry.comments,
      spentOn: new Date(entry.spent_on),
      createdAt: new Date(entry.created_on),
      updatedAt: new Date(entry.updated_on),
    }))
    return {
      items: entries,
      total: _nullishCoalesce(response.data.total_count, () => entries.length),
      page: 1,
      pageSize: entries.length,
    }
  }
  findAll(pagination) {
    throw new Error(
      'M\xE9todo "findAll" n\xE3o implementado para o conector Redmine.',
    )
  }
  findById(id) {
    throw new Error(
      'M\xE9todo "findById" n\xE3o implementado para o conector Redmine.',
    )
  }
  findByIds(ids) {
    throw new Error(
      'M\xE9todo "findByIds" n\xE3o implementado para o conector Redmine.',
    )
  }
  findByCondition(condition, pagination) {
    throw new Error(
      'M\xE9todo "findByCondition" n\xE3o implementado para o conector Redmine.',
    )
  }
  count(criteria) {
    throw new Error(
      'M\xE9todo "count" n\xE3o implementado para o conector Redmine.',
    )
  }
  exists(criteria) {
    throw new Error(
      'M\xE9todo "exists" n\xE3o implementado para o conector Redmine.',
    )
  }
}

// src/index.ts
var RedmineConnector = {
  id: '@timelapse/redmine-plugin',
  dataSourceType: 'redmine',
  displayName: 'Redmine (Oficial)',
  configFields: {
    configuration: configurationFieldGroups,
    credentials: credentialFieldGroups,
  },
  // eslint-disable-next-line prettier/prettier
  getAuthenticationStrategy: (context) => new RedmineAuthenticationStrategy(),
  getTaskQuery: (context) => new RedmineTaskQuery(),
  getTimeEntryQuery: (context) => new RedmineTimeEntryQuery(context),
  getMemberQuery: (context) => new RedmineMemberQuery(context),
  getTaskRepository: (context) => new RedmineTaskRepository(),
}
var index_default = RedmineConnector

exports.default = index_default
//# sourceMappingURL=index.cjs.map
