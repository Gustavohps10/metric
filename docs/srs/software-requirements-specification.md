# TIMELAPSE

## Sistema de Rastreamento e Visualização de Produtividade

**Versão:** 1.0  
**Desenvolvedor:** Gustavo Henrique Pereira dos Santos  
**Data:** 7 de Março de 2026

---

# Tabela de Revisão

| Versão | Autores          | Descrição                                        | Data       |
| ------ | ---------------- | ------------------------------------------------ | ---------- |
| 1.0    | Gustavo Henrique | Versão Inicial consolidada (ADR-001 + Core Sync) | 07/03/2026 |

---

# 1. Introdução

## 1.1 Finalidade

O **TIMELAPSE** tem como finalidade o rastreamento e a visualização de produtividade no desenvolvimento de software.

O sistema atua como um **hub agnóstico** que consome tarefas de **Data Sources externos** (Jira, Redmine, ERPs) e gerencia o tempo investido através de uma arquitetura de sincronização robusta e operação **offline-first**.

---

## 1.2 Escopo

O produto utiliza o modelo **Open-Core**.

O núcleo principal (Desktop/Local) foca em:

- integração técnica com fontes externas
- operação offline
- conversão de padrões de dados externos
- sincronização de tarefas e apontamentos

Funcionalidades de **gestão organizacional** são proprietárias, incluindo:

- gestão de times
- controle de domínios
- sistema de licenciamento
- painel administrativo
- analytics avançado

Essas funcionalidades são geridas por um **painel administrativo centralizado**.

---

# 2. Visão Geral

## 2.1 Público-Alvo

O sistema é destinado a:

- Desenvolvedores individuais
- Times de desenvolvimento
- Empresas de pequeno, médio e grande porte

O objetivo é **centralizar o controle de orçamento de tempo** baseado em tarefas provenientes de sistemas externos.

---

## 2.2 Ambiente Operacional — Requisitos Mínimos

### Sistema Operacional

- Windows 10 ou superior
- macOS
- Linux

### Hardware

- 4GB de memória RAM

### Armazenamento

Persistência de banco de dados **local** utilizando **RxDB**.

### Conectividade

- Internet obrigatória para licenciamento
- Internet obrigatória para autenticação com datasource
- Internet obrigatória para sincronização com datasource

O sistema continua funcional **offline para operações locais**.

---

# 3. Modelo de Produto

O Timelapse segue o modelo **Open-Core**.

### Open Source

- Cliente Desktop
- Visualização de tarefas
- Rastreamento de tempo
- Integração básica com Data Sources
- Sincronização local

### Pro / Enterprise

- Gestão de organizações
- Controle de membros
- Painel administrativo
- Analytics avançado
- Integrações corporativas

---

# 4. Modelo de Execução

O Timelapse possui **dois modos principais de execução**.

---

## 4.1 Desktop Client (Modo Padrão)

Aplicativo executado localmente na máquina do usuário.

Disponível para:

- Windows
- Linux
- macOS

Características:

- arquitetura **offline-first**
- persistência local utilizando **RxDB**
- sincronização direta com **Data Sources externos**
- não depende de backend para funcionamento básico

Usuários do plano **Free** podem utilizar o sistema sem autenticação.

---

## 4.2 Self-Hosted

Empresas podem executar o Timelapse em sua própria infraestrutura.

Exemplo:

https://timelapse.internal.company.com

Motivações comuns:

- compliance
- políticas internas de segurança
- isolamento de dados
- controle completo da infraestrutura

Nesse modo geralmente existe **uma única organização interna**.

---

# 4.3 Infraestrutura de Controle (Timelapse Cloud)

Além dos modos de execução, o Timelapse utiliza um **serviço centralizado de controle**.

Esse serviço é responsável apenas por **gestão de contas, organizações e licenças**.

Exemplo:

https://app.timelapse.dev

---

## Responsabilidades do serviço central

- autenticação via **Magic Link**
- gestão de **organizações**
- controle de **membros**
- gestão de **planos e licenciamento**
- painel administrativo

---

## Dados que o serviço central NÃO armazena

O **serviço central de controle do Timelapse não armazena dados operacionais da aplicação**, como:

- tarefas
- registros de tempo
- histórico de produtividade
- dados sincronizados das ferramentas externas

Esses dados permanecem:

- no **banco local do cliente (RxDB)**  
  ou
- nas **ferramentas externas integradas (Jira, Redmine, etc.)**

---

## Motivo da decisão

Essa arquitetura reduz:

- responsabilidade sobre dados do usuário
- custos de infraestrutura
- riscos de privacidade
- complexidade de sincronização

O backend central atua apenas como **Control Plane**, enquanto os dados operacionais permanecem **no cliente e nas ferramentas externas**.

---

# 5. Especificação dos Requisitos

---

# 5.1 Requisitos Funcionais (RF)

| ID    | Descrição                                         | Prioridade | Depende De |
| ----- | ------------------------------------------------- | ---------- | ---------- |
| RF001 | Gestão de Workspaces locais independentes         | Alta       | —          |
| RF002 | Loja de Addons para integração com Data Sources   | Alta       | —          |
| RF003 | Configuração de fontes externas                   | Alta       | RF002      |
| RF004 | Motor de sincronização Pull baseado em checkpoint | Alta       | RF003      |
| RF005 | Conversão de metadados para padrão interno        | Alta       | RF004      |
| RF006 | Sistema de timer para tarefas                     | Alta       | —          |
| RF007 | Lançamento manual de apontamentos                 | Alta       | —          |
| RF008 | Replicação de apontamentos para fonte externa     | Alta       | RF004      |
| RF009 | Painel administrativo para organizações           | Baixa      | —          |
| RF010 | Autenticação Magic Link                           | Baixa      | RF009      |

---

# 5.2 Requisitos Não Funcionais (RNF)

| ID     | Descrição                                                          | Categoria      | Prioridade |
| ------ | ------------------------------------------------------------------ | -------------- | ---------- |
| RNF001 | Application Layer compartilhada entre Cloud, Desktop e Self-Hosted | Arquitetura    | Alta       |
| RNF002 | Persistência local offline-first                                   | Arquitetura    | Alta       |
| RNF003 | Autenticação Passwordless                                          | Segurança      | Alta       |
| RNF004 | Sincronização resiliente a conflitos                               | Confiabilidade | Alta       |

---

# 6. Dicionário de Dados

Persistência local realizada através de **RxDB**.

Coleções principais:

- `tasks`
- `timeEntries`
- `metadata`

---

# 6.1 Coleção: tasks

Representa tarefas sincronizadas a partir de sistemas externos.

| Campo          | Tipo     | Descrição                             |
| -------------- | -------- | ------------------------------------- |
| \_id           | String   | Chave primária local                  |
| id             | String   | ID da tarefa na fonte externa         |
| title          | String   | Título da tarefa                      |
| description    | String   | Descrição da tarefa                   |
| url            | String   | URL da tarefa na ferramenta externa   |
| projectName    | String   | Nome do projeto                       |
| status         | Object   | Status atual da tarefa                |
| tracker        | Object   | Tipo de issue                         |
| priority       | Object   | Prioridade da tarefa                  |
| author         | Object   | Usuário criador                       |
| assignedTo     | Object   | Usuário responsável                   |
| createdAt      | DateTime | Data de criação                       |
| updatedAt      | DateTime | Data da última atualização            |
| startDate      | DateTime | Data de início                        |
| dueDate        | DateTime | Data limite                           |
| doneRatio      | Number   | Percentual de conclusão               |
| spentHours     | Number   | Horas gastas registradas externamente |
| estimatedTimes | Array    | Estimativas de tempo                  |
| statusChanges  | Array    | Histórico de mudança de status        |
| participants   | Array    | Participantes da tarefa               |
| timeEntryIds   | Array    | IDs dos apontamentos relacionados     |
| timeEntries    | Array    | Apontamentos vinculados               |
| conflicted     | Boolean  | Indica conflito de sincronização      |
| conflictData   | Object   | Dados de conflito                     |
| syncedAt       | DateTime | Última sincronização                  |

---

# 6.2 Coleção: timeEntries

Representa registros de tempo vinculados a tarefas.

| Campo        | Tipo     | Descrição                      |
| ------------ | -------- | ------------------------------ |
| \_id         | String   | Chave primária local           |
| id           | String   | ID do apontamento externo      |
| task         | Object   | Referência da tarefa           |
| taskData     | Object   | Snapshot da tarefa             |
| activity     | Object   | Tipo de atividade              |
| user         | Object   | Usuário responsável            |
| startDate    | DateTime | Início do apontamento          |
| endDate      | DateTime | Fim do apontamento             |
| timeSpent    | Number   | Tempo gasto (segundos)         |
| comments     | String   | Observações                    |
| createdAt    | DateTime | Data de criação                |
| updatedAt    | DateTime | Data de atualização            |
| timeStatus   | Enum     | running, paused, finished      |
| type         | Enum     | increasing, decreasing, manual |
| conflicted   | Boolean  | Indica conflito                |
| conflictData | Object   | Dados de conflito              |
| syncedAt     | DateTime | Última sincronização           |

---

# 6.3 Coleção: metadata

Armazena metadados provenientes da fonte externa.

| Campo            | Tipo     | Descrição                   |
| ---------------- | -------- | --------------------------- |
| \_id             | String   | Chave primária              |
| taskStatuses     | Array    | Status possíveis de tarefas |
| taskPriorities   | Array    | Prioridades                 |
| activities       | Array    | Tipos de atividades         |
| trackStatuses    | Array    | Status de tracking          |
| participantRoles | Array    | Papéis de participantes     |
| estimationTypes  | Array    | Tipos de estimativa         |
| conflicted       | Boolean  | Indica conflito             |
| conflictData     | Object   | Dados de conflito           |
| syncedAt         | DateTime | Última sincronização        |

Cada item de metadata contém:

| Campo  | Tipo   |
| ------ | ------ |
| id     | String |
| name   | String |
| icon   | String |
| colors | Object |

Estrutura de cores:

| Campo      | Tipo   |
| ---------- | ------ |
| badge      | String |
| background | String |
| text       | String |
| border     | String |

---

# 7. Casos de Uso

---

# UC001 — Setup e Sincronização Inicial

### Objetivo

Configurar integração com a fonte externa e sincronizar dados.

### Fluxo

1. Usuário cria workspace local
2. Instala addon de integração
3. Configura credenciais da fonte externa
4. Sistema executa sincronização Pull
5. Dados são convertidos para o padrão interno
6. Banco local é populado

---

# UC002 — Rastreamento de Tempo

### Objetivo

Permitir que o usuário registre tempo em tarefas.

### Fluxo

1. Usuário seleciona tarefa
2. Inicia timer
3. Sistema registra estado `running`
4. Usuário pausa ou finaliza
5. Tempo é salvo localmente
6. Alterações são sincronizadas posteriormente

---

# UC003 — Ativação Pro

_(Prioridade Baixa)_

### Objetivo

Ativar licença corporativa.

### Fluxo

1. Usuário informa código da organização
2. Usuário informa e-mail
3. Sistema envia Magic Link
4. Usuário autentica
5. Licença Pro é ativada

# Mermaid Diagram
```mermaid
flowchart TB
    subgraph LeftColumn [ ]
        direction TB
        style LeftColumn fill:none,stroke:none
        
        subgraph ControlPlane [Control Plane]
            direction TB
            Auth[Authentication]
            Orgs[Organizations]
            Lic[Licensing]
        end
    end

    subgraph RightColumn [ ]
        direction TB
        style RightColumn fill:none,stroke:none

        subgraph Clients [Clients]
            direction TB
            Desktop[Desktop Client]
            Mobile[Mobile Client]
            SelfHosted[Self-Hosted Server]
        end

        subgraph AppCore [Application Core]
            direction TB
            SharedUI[Shared UI]
            RxDB[(RxDB Local Database)]
            Sync[Sync Engine]
            
            SharedUI --> RxDB --> Sync
        end

        subgraph Integrations [Integrations]
            direction TB
            subgraph DataSources [Data Sources]
                Jira[Jira]
                Redmine[Redmine]
                Other[Other Systems]
            end
            
            subgraph Plugins [Plugins]
                Clock[Time Clock Plugin]
                Git[Git Activity Plugin]
                Ext[Custom Extensions]
            end
        end
    end

    %% Connections to Control Plane
    Desktop & Mobile & SelfHosted --> Auth
    Desktop & Mobile & SelfHosted --> Orgs
    Desktop & Mobile & SelfHosted --> Lic

    %% Connections to Application Core
    Desktop & Mobile & SelfHosted --> SharedUI

    %% Connections to Integrations
    Sync --> DataSources
    Sync --> Plugins

    %% Layout constraint to keep columns side-by-side
    LeftColumn ~~~ RightColumn
