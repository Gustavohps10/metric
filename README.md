# ⏱️ Timelapse

## Plataforma Local-First para Apontamento de Horas e Produtividade

<p width="100%">
  <img src="./docs/diagram-light.png#gh-dark-mode-only" width="100%" />
  <img src="./docs/diagram-dark.png#gh-light-mode-only" width="100%" />
</p>

O **Timelapse** é uma plataforma de **apontamento de horas Local-First** projetada para oferecer:

- performance instantânea
- operação offline
- integração com ferramentas externas
- controle total dos dados pelo usuário

A arquitetura foi construída para que **os dados operacionais pertençam ao cliente**, e não a um backend central.

Isso permite que o sistema funcione **offline**, seja **self-hosted** e continue rápido mesmo com APIs externas lentas.

As decisões de produto e arquitetura estão documentadas em **[docs/ADR-001.md](docs/ADR-001.md)** e **[docs/ADR-002.md](docs/ADR-002.md)**.

---

# 🧠 Princípios Arquiteturais

O projeto é guiado pelos seguintes pilares:

| Conceito                   | Descrição                                                                                 | Tecnologia             |
| -------------------------- | ----------------------------------------------------------------------------------------- | ---------------------- |
| **Local-First**            | Toda a UI interage primeiro com um banco de dados local, garantindo resposta instantânea. | **RxDB**               |
| **Offline-First**          | O sistema continua funcional sem internet. A sincronização ocorre em background.          | **RxDB Replication**   |
| **Client-Owned Data**      | Dados de produtividade pertencem ao cliente e não são armazenados no backend.             | Arquitetura do produto |
| **Workspaces**             | Contextos isolados de trabalho que conectam o usuário a diferentes fontes de dados.       | Monorepo               |
| **Ecossistema de Plugins** | Conectores dinâmicos permitem integração com APIs externas (Redmine, Jira, etc.).         | SDK + IoC              |

---

# 🏗️ Modelo de Execução

O Timelapse opera em **três modos** (ver **ADR-001**):

- **Desktop** — cliente na máquina do usuário (Windows / Linux / macOS); modo padrão; dados locais (RxDB), sync com datasources via plugins.
- **Cloud SaaS** — backend hospedado pelo Timelapse (ex.: app.timelapse.dev); autenticação, painel admin, organizações, planos.
- **Self-Hosted** — empresas rodam em sua própria infraestrutura (ex.: timelapse.internal.company.com); compliance, dados internos, isolamento.

---

# ☁️ Timelapse Control Plane

O Timelapse possui um serviço central opcional chamado **Control Plane**.

Ele **não armazena dados operacionais** da aplicação.

## Responsabilidades:

- autenticação via Magic Link
- gestão de organizações
- controle de membros
- licenciamento
- painel administrativo

### Esse serviço de licenças **não armazena**:

- tarefas
- apontamentos de horas
- atividades
- dados de produtividade

  _Esses dados operacionais permanecem_ :
  - no **banco local do cliente**
  - ou nas **ferramentas externas integradas (Redmine, Jira, Youtrack, etc...)**

---

# 🧩 Ecossistema de Plugins

A extensibilidade é baseada em **conectores de fontes de dados** (datasources). Cada plugin comunica com uma API externa (Redmine, Jira, etc.). Um **mesmo workspace** pode ter **várias conexões** (N datasources) — ver **ADR-002**.

---

# 🧱 Workspaces

O **Workspace** é a unidade central de trabalho (ver **ADR-002**).

- Um workspace pode ter **múltiplas conexões** (N datasources): ex. Redmine + Jira no mesmo workspace.
- Cada conexão tem **credenciais e configuração próprias**; o login é **por conexão**, não por workspace.
- Conexões são gerenciadas na **página de Plugins** (conectar/desconectar/editar por datasource).
- A **sincronização** é por (workspace, conexão): cada conexão tem seu motor de sync (metadata, tarefas, apontamentos) e checkpoint próprio; falha em uma não derruba as outras.
- No **header**, o status de sync aparece **agrupado por datasource** (cada conexão com seu bloco: Metadata, Tarefas, Apontamentos).

Fluxo: criar workspace → na página de Plugins, conectar as fontes desejadas → sync roda por conexão → dados locais (RxDB) identificados por `dataSourceId`.

---

# 💻 Arquitetura Técnica

O projeto utiliza um **Monorepo** gerenciado pelo **Turbo Repo** (ver **ADR-001**).

```
apps/          → desktop (em construção), web e mobile (futuro)
packages/      → ui, domain, application, sdk, container, infra, etc.
```

---

## Clientes

### 🖥️ Desktop — **Em construção**

Electron + React. Aplicação **Local-First + Offline-First**; banco local (RxDB), sincronização com datasources via plugins.

---

### 🌐 Web — **Futuro**

React + Vite; banco local no navegador (ex.: PGlite).

---

### 📱 Mobile — **Futuro**

Capacitor + React; apontamento em qualquer lugar.

---

# 💾 Banco de Dados Local

O banco local é responsável por armazenar:

- tasks
- time entries
- activities
- workspaces

Tecnologia:

RxDB

Ele fornece:

- queries reativas
- replicação
- funcionamento offline
- sincronização incremental

---

# 🔄 Sincronização

A sincronização ocorre entre o **banco local (RxDB)** e as **APIs externas**, via **plugins** (datasources). Cada (workspace, conexão) tem seu próprio motor de sync e checkpoint — ver **ADR-002**. O backend Timelapse **não participa da sincronização operacional** (tarefas/apontamentos ficam no cliente ou nas ferramentas integradas).

---

# ⚙️ Ambiente de Desenvolvimento

Este projeto utiliza **Turbo Repo + Yarn v4**.

---

## Como rodar

Instalação do Node, Yarn (via npm), liberação de scripts no Windows, Yarn 4 e comandos `yarn install` / `yarn build` / `yarn dev` estão descritos em detalhe em:

**[docs/como-rodar.md](docs/como-rodar.md)**

---

## Comandos principais

| Comando                        | Descrição                          |
| ------------------------------ | ---------------------------------- |
| `yarn install`                 | Instala dependências               |
| `yarn dev`                     | Inicia ambiente de desenvolvimento |
| `yarn build`                   | Compila o projeto                  |
| `yarn shadcn add [componente]` | Adiciona componentes de UI         |

---

# 🧹 Qualidade de Código

### Commits

Utilizamos **Conventional Commits (Angular)**.

Exemplo:

> feat: add workspace creation

> fix: resolve sync conflict

Validação via:

commitlint

---

### Formatação

Ferramentas:

- ESLint
- Prettier
- lint-staged

Executadas automaticamente antes do commit.

---

### Versionamento

Gerenciado via:

Changesets

---

# 🛠️ IDE Recomendada

**Visual Studio Code**

Extensões recomendadas:

- Tailwind CSS Intellisense
- PostCSS Language Support
- ESLint
- Prettier

---

# 🗺️ Roadmap

### ✅ Concluído

- estrutura do monorepo
- arquitetura de plugins
- SDK de conectores
- workspace management
- integração inicial com Redmine
- armazenamento seguro de credenciais
- carregamento dinâmico de plugins

---

### 🚧 Em Progresso

- **Cliente Desktop** (Electron + React, Local-First)
- Motor de sincronização Local-First (replicação incremental, sync contínuo, resolução de conflitos — RxDB Replication)

---

### 🔜 Futuro

- **Web** e **Mobile** (clientes)
- dashboards de produtividade
- colaboração P2P entre usuários
- analytics por workspace
- marketplace de plugins
- suporte oficial a Jira
