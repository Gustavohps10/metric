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

O Timelapse pode operar em **dois modos principais**.

---

## 💻 Desktop / Local Mode

Aplicação executada localmente na máquina do usuário.

Características:

- operação **offline-first**
- banco de dados local
- sincronização com APIs externas
- sem necessidade de backend para funcionamento básico

Os dados ficam armazenados localmente via **RxDB**.

---

## 🏢 Self-Hosted Mode

Empresas podem executar o Timelapse em sua própria infraestrutura.

Exemplo:

https://timelapse.internal.company.com

Motivações comuns:

- compliance
- isolamento de dados
- políticas internas de segurança
- controle da infraestrutura

Nesse modo o backend é usado apenas para:

- autenticação
- gestão de organizações
- controle de licenças

---

# ☁️ Timelapse Control Plane

O Timelapse possui um serviço central opcional chamado **Control Plane**.

Ele **não armazena dados operacionais** da aplicação.

Responsabilidades:

- autenticação via Magic Link
- gestão de organizações
- controle de membros
- licenciamento
- painel administrativo

O backend **não armazena**:

- tarefas
- apontamentos de horas
- atividades
- dados de produtividade

Esses dados permanecem:

- no **banco local do cliente**
- ou nas **ferramentas externas integradas**

---

# 🧩 Ecossistema de Plugins

A extensibilidade do Timelapse é baseada em **conectores de fontes de dados**.

Cada plugin é responsável por comunicar com uma API externa.

Exemplos:

- Redmine
- Jira
- GitHub Issues
- sistemas internos de empresas

Arquitetura:

Timelapse Client
│
│
Connector SDK
│
├── redmine-plugin
├── jira-plugin
└── custom-company-plugin

---

# 🧱 Workspaces

O **Workspace** é a unidade central de trabalho.

Ele define:

- qual fonte de dados está conectada
- qual plugin será utilizado
- qual contexto de tarefas será carregado

Características:

- criação **100% local**
- conexão dinâmica com APIs
- isolamento completo entre workspaces

Cada apontamento (`TimeEntry`) mantém a referência da origem:

source_plugin_id

Isso garante integridade ao trocar conectores.

---

# 💻 Arquitetura Técnica

O projeto utiliza um **Monorepo** gerenciado pelo **Turbo Repo**.

apps/
desktop
mobile
web

packages/
ui
core
connector-sdk
plugins

---

## Clientes

O sistema possui três clientes principais:

### 🖥️ Desktop

Tecnologia:

Electron + React

Aplicação completa **Local-First + Offline-First**.

---

### 📱 Mobile

Tecnologia:

Capacitor + React

Permite apontamento de horas em qualquer lugar.

---

### 🌐 Web

Tecnologia:

React + Vite

Após o carregamento inicial utiliza:

PGlite (PostgreSQL em WebAssembly)

para executar o banco local no navegador.

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

A sincronização ocorre entre:

Local Database (RxDB)
│
│
Connector Plugin
│
│
External API

O backend do Timelapse **não participa da sincronização operacional**.

Isso reduz:

- latência
- custos de infraestrutura
- riscos de privacidade

---

# ⚙️ Ambiente de Desenvolvimento

Este projeto utiliza:

Turbo Repo + Yarn v4

---

## Pré-requisitos

- Node.js LTS
- Yarn v4

---

## Comandos Principais

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

**Motor de sincronização Local-First**

Objetivo:

- replicação incremental
- sincronização contínua
- resolução de conflitos

Tecnologia:

RxDB Replication

---

### 🔜 Futuro

- dashboards de produtividade
- colaboração P2P entre usuários
- analytics por workspace
- marketplace de plugins
- suporte oficial a Jira
