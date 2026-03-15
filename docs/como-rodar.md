# Como rodar o projeto

Siga os passos **na ordem**. Cada um depende do anterior.

---

### 1. Instalar Node.js

- Acesse [nodejs.org](https://nodejs.org) e baixe a versão **LTS** (recomendada).
- Rode o instalador. Se aparecer a opção "Add to PATH", deixe marcada.
- **Conferir:** abra um terminal (PowerShell ou CMD) e digite:
  ```bash
  node -v
  npm -v
  ```
  Os dois devem mostrar números de versão (ex.: `v20.10.0` e `10.2.0`). Se der "comando não encontrado", feche e abra o terminal de novo ou reinicie o PC e tente outra vez.

---

### 2. Instalar o Yarn globalmente (via npm)

O Yarn é o gerenciador de pacotes deste projeto. Instale pelo npm:

```bash
npm install --global yarn
```

- **Conferir:** no mesmo terminal, digite:
  ```bash
  yarn --version
  ```
  Deve aparecer uma versão (ex.: `1.22.0` ou `4.x.x`). Se aparecer, o Yarn está instalado. Se der erro, verifique o passo 3 (Windows).

---

### 3. Liberar execução de scripts no Windows (PowerShell)

No Windows, o PowerShell **bloqueia a execução de scripts** por padrão. Isso faz com que comandos como `yarn` falhem ou se comportem estranho.

**3.1 — Ver como está a política hoje**

Abra o **PowerShell** (não precisa ser administrador para só ver) e rode:

```powershell
Get-ExecutionPolicy
```

Se aparecer **`Restricted`** ou **`AllSigned`**, os scripts estão bloqueados.

Para ver **todas as camadas** (usuário, máquina, etc.):

```powershell
Get-ExecutionPolicy -List
```

Olhe a coluna **Scope** e **ExecutionPolicy**. O que importa para o seu usuário é normalmente **CurrentUser**. Se em algum escopo estiver **Restricted**, o Yarn pode não funcionar direito.

**3.2 — Liberar para o seu usuário**

Abra o **PowerShell como administrador** (clique direito no ícone do PowerShell → "Executar como administrador") e rode:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Quando perguntar se deseja alterar a política, digite **`S`** e Enter.

- **RemoteSigned** = scripts que você escreve ou que estão no seu PC podem rodar; scripts baixados da internet precisam ser assinados. É o valor recomendado para desenvolvimento.

**3.3 — Conferir de novo**

Feche o PowerShell e abra outro (pode ser normal). Rode de novo:

```powershell
Get-ExecutionPolicy -List
```

Em **CurrentUser** deve aparecer **RemoteSigned**. Depois teste:

```bash
yarn --version
```

Se mostrar a versão do Yarn, está liberado. Se ainda der erro, confira se usou o PowerShell (não o CMD) e se rodou o `Set-ExecutionPolicy` no PowerShell **como administrador**.

---

### 4. Garantir Yarn 4 — **muito importante para monorepos**

Este repositório é um **monorepo** (vários pacotes no mesmo repo). O projeto **exige Yarn 4** para funcionar corretamente (workspaces, cache, scripts). Yarn 1.x não é compatível com a configuração atual.

**4.1 — Ver qual versão está em uso**

Na **raiz do projeto** (pasta onde está o `package.json` principal), rode:

```bash
yarn --version
```

- Se mostrar **4.x.x** (ex.: 4.9.4), já está no Yarn 4. Pode pular para o passo 5.
- Se mostrar **1.x.x**, use o passo 4.2 para o próprio Yarn se atualizar para a versão 4.

**4.2 — Atualizar para Yarn 4 (só com Yarn, sem Corepack)**

Na **raiz do repositório** (pasta do Timelapse), rode:

```bash
yarn set version 4
```

O Yarn baixa e passa a usar a versão 4 neste projeto. Não precisa instalar Corepack nem nada além do que você já tem (Node + Yarn instalado pelo npm).

- Opcional: se quiser fixar a 4.9.4 em vez de “4” (última 4.x), use:
  ```bash
  yarn set version 4.9.4
  ```

**4.3 — Conferir de novo**

Na raiz do projeto:

```bash
yarn --version
```

Deve mostrar **4.x.x**. Se ainda aparecer 1.x, confira se está na pasta certa (raiz do repo) e rode de novo `yarn set version 4`.

---

### 5. Instalar dependências, compilar e rodar

Tudo abaixo deve ser feito na **pasta raiz do repositório** (onde estão o `package.json` e a pasta `src/`).

**5.1 — Instalar dependências**

```bash
yarn install
```

- O Yarn lê o `package.json` e o `yarn.lock` e baixa todas as dependências dos workspaces (apps e packages). Pode demorar na primeira vez. Não pule este passo.

**5.2 — Compilar o projeto**

```bash
yarn build
```

- Isso compila todos os pacotes do monorepo (domain, application, SDK, desktop, etc.). É necessário antes de rodar o app; o `yarn dev` pode rodar o build em modo watch, mas rodar `yarn build` uma vez garante que tudo está compilado.

**5.3 — Subir o ambiente de desenvolvimento**

```bash
yarn dev
```

- Esse comando sobe o que estiver configurado em paralelo no Turbo (por exemplo, o app desktop). A aplicação abre e você pode desenvolver e testar. Para parar, use Ctrl+C no terminal.

**Resumo da ordem:** `yarn install` → `yarn build` → `yarn dev`. Se algo falhar, confira os passos 1 a 4 (Node, Yarn instalado via npm, política de execução no PowerShell, Yarn 4).
