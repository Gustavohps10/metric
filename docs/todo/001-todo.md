# 001 — Plugin DataSource Fake (dados locais para testes e validação de envio)

Guia para o desenvolvedor: como implementar o plugin fake, onde mexer e o que deixar intocado.

---

## Objetivo

Ter um DataSource **100% fake** (dados em memória, sem rede) para:

- Testar e validar o **envio de dados** (push de apontamentos) sem bater em Redmine/APIs reais.
- Ter volume previsível: **1000 tarefas**, **1000 apontamentos**, **1 usuário fake** e metadata fixa.
- Usar na aplicação como qualquer outro plugin (conectar no workspace, sync, listagens, push).

---

## O que NÃO mexer

- **ADRs** (`docs/ADR-001.md`, `docs/ADR-002.md`) — não alterar.
- **Domain** (`src/packages/domain`) — entidades Task, TimeEntry, Member, Workspace permanecem como estão.
- **Application** (`src/packages/application`) — serviços como `TimeEntriesPushService`, `TaskPullService`, `ConnectDataSourceService`, etc. **não devem ser alterados**; eles já usam o resolver e os adapters; o fake será mais um plugin resolvido igual aos outros.
- **SDK** (`src/packages/sdk`) — interfaces `IDataSource`, `DataSourceContext`, contratos de Query/Repository **não mudam**; o fake apenas implementa essas interfaces.
- **Container / IOC** (`src/packages/container`) — o resolver já carrega addons por pasta; desde que o fake esteja na pasta de addons (ou linkado para testes), **não é obrigatório** mudar o container.
- **Desktop app** (`src/apps/desktop`) — configuração de onde os addons são carregados pode já apontar para `src/tests` ou para uma pasta de build; **só garantir que o addon fake seja descoberto**; não precisa refatorar o app em si.

Resumo: o trabalho é **só dentro de um novo addon**. O resto do monorepo continua intacto.

---

## Onde criar o plugin

- **Pasta sugerida:** `src/tests/datasource-fake` (ou `src/tests/addon-datasource-fake`).
- **Referência de estrutura:** usar `src/tests/addon-for-tests` como modelo (manifest, `index.ts` exportando um `IDataSource`, arquivos de Query/Repository/Strategy).

Arquivos que você **vai criar** (todos dentro de `src/tests/datasource-fake`):

- `manifest.yaml` — Type: DataSource, id único (ex.: `timelapse-datasource-fake`), displayName ex.: "DataSource Fake (Testes)".
- `package.json` / `tsconfig` / build (ex.: tsup) — espelhando o addon-for-tests para o addon ser buildável.
- `src/index.ts` — export default de um objeto que implementa `IDataSource` (id, dataSourceType, displayName, configFields, getAuthenticationStrategy, getTaskQuery, getTimeEntryQuery, getTimeEntryRepository, getMemberQuery, getTaskRepository, getMetadataQuery).
- `src/FakeAuthenticationStrategy.ts` — implementa `IAuthenticationStrategy`; `authenticate()` sempre sucesso (ex.: credenciais fixas ou qualquer login/senha).
- `src/FakeTaskQuery.ts` — implementa `ITaskQuery`; `pull(memberId, checkpoint, batch)` retorna fatias das 1000 tarefas em memória (ordenadas por updatedAt/id).
- `src/FakeTaskRepository.ts` — implementa `ITaskRepository`; create/update/delete em memória (pode ser um Map keyed by id).
- `src/FakeTimeEntryQuery.ts` — implementa `ITimeEntryQuery`; `pull` sobre os 1000 apontamentos em memória.
- `src/FakeTimeEntryRepository.ts` — implementa `ITimeEntryRepository`; **create, update, delete, findById** em um store em memória (Map ou array). Este é o ponto crítico para validar o **push**: o serviço de push chama esse repositório; as mudanças devem aparecer só no store fake.
- `src/FakeMemberQuery.ts` — implementa `IMemberQuery`; retorna o usuário fake (getCurrentUser, findByIds, etc., conforme a interface).
- `src/FakeMetadataQuery.ts` — implementa `IMetadataQuery`; `getMetadata()` retorna um `MetadataDTO` fixo (status, prioridades, atividades com IDs estáveis).
- **Dados (seeds):** um módulo (ex.: `src/fakeData.ts` ou `src/seeds.ts`) que gera ou expõe:
  - 1000 tasks (id, title, description, workspaceId, externalId/externalType, createdAt, updatedAt).
  - 1 (ou mais) member fake.
  - 1000 time entries (task.id, user, activity.id, timeSpent, startDate/endDate, comments, createdAt, updatedAt).
  - Listas de metadata (status, prioridades, atividades) com IDs usados nos time entries.

O `configFields` do `IDataSource` pode ser vazio ou com um par de credenciais fictícias (ex.: login/password) só para a tela de conexão não reclamar; a strategy ignora e retorna sucesso.

---

## O que cada camada do app já faz (só para contexto)

- **Resolver de DataSource:** lê addons (ex.: das pastas configuradas), instancia o `IDataSource` e devolve um adapter (TaskQuery, TimeEntryQuery, TimeEntryRepository, etc.). Ao conectar um workspace ao datasource fake, o resolver passará a devolver suas implementações fake.
- **TimeEntriesPushService:** recebe workspaceId, dataSourceId e lista de entradas; obtém o adapter via resolver e chama `timeEntryRepository.create/update/delete`. Ou seja: **não mexe em serviço**; só garantir que o FakeTimeEntryRepository implemente a interface que o serviço já usa.
- **Sync (pull):** os serviços de pull usam taskQuery e timeEntryQuery do adapter; o fake retorna os 1000 itens (com paginação/checkpoint simulada).

Nenhuma alteração nesses fluxos é necessária; só a existência do novo plugin.

---

## Checklist rápido para o dev

1. Criar pasta `src/tests/datasource-fake` e estrutura igual ao addon-for-tests (manifest, package.json, tsconfig, build).
2. Implementar todas as interfaces do `IDataSource` com classes Fake* (Strategy, TaskQuery, TaskRepository, TimeEntryQuery, TimeEntryRepository, MemberQuery, MetadataQuery).
3. Criar módulo de dados: 1000 tasks, 1000 time entries, 1 member, metadata fixa; usar no Fake*Query e Fake*Repository.
4. Garantir que FakeTimeEntryRepository persista create/update/delete em memória para validar o push.
5. Registrar ou copiar o addon na pasta que o desktop usa para carregar addons (se for o caso), para aparecer na UI e poder conectar ao workspace.
6. Testar: conectar workspace ao DataSource Fake, rodar sync (pull), depois rodar fluxo de envio (push) e verificar que os dados no store fake refletem as operações.

---

## Resumo

- **Mexer:** apenas em `src/tests/datasource-fake` (novo addon completo).
- **Não mexer:** domain, application, SDK, container, ADRs; no máximo configurar onde o desktop carrega addons para incluir o fake.
- **Entregável:** um DataSource fake com 1000 tarefas, 1000 apontamentos, usuário fake e metadata fixa, implementando todo o `IDataSource`, para testes e validação de envio de dados sem dependência de APIs externas.
