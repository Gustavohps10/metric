import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { ContainerBuilder, PlatformDependencies } from '@metric-org/container'
import {
  JSONWorkspacesQuery,
  JSONWorkspacesRepository,
} from '@metric-org/infra/data'
import { KeytarTokenStorage } from '@metric-org/infra/storage'
import { app, BrowserWindow, Menu, screen, shell, Tray } from 'electron'
import installExtension, {
  REACT_DEVELOPER_TOOLS,
} from 'electron-devtools-installer'
import { join } from 'path'

import {
  ConnectionHandler,
  SessionHandler,
  TasksHandler,
  TimeEntriesHandler,
  TokenHandler,
} from '@/main/handlers'
import { AddonsHandler } from '@/main/handlers/AddonsHandler'
import { MetadataHandler } from '@/main/handlers/MetadataHandler'
import { WorkspacesHandler } from '@/main/handlers/WorkspacesHandler'
import { DataSourceResolver } from '@/main/resolvers/data-source-resolver'
import { openIpcRoutes } from '@/main/routes/openIpcRoutes'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let secondaryWindow: BrowserWindow | null = null

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
    },
  })

  mainWindow.on('ready-to-show', () => mainWindow!.show())

  mainWindow.webContents.setWindowOpenHandler((d) => {
    shell.openExternal(d.url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

export type IHandlersScope = {
  connectionHandler: typeof ConnectionHandler
  sessionHandler: typeof SessionHandler
  tasksHandler: typeof TasksHandler
  timeEntriesHandler: typeof TimeEntriesHandler
  tokenHandler: typeof TokenHandler
  workspacesHandler: typeof WorkspacesHandler
  addonsHandler: typeof AddonsHandler
  metadataHandler: typeof MetadataHandler
}

const createSecondaryWindow = () => {
  secondaryWindow = new BrowserWindow({
    width: 400,
    height: 420,
    show: false,
    frame: true,
    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      sandbox: false,
    },
  })

  secondaryWindow.once('ready-to-show', () => {
    const { width } = screen.getPrimaryDisplay().workAreaSize
    const x = width - 280
    const y = 160
    secondaryWindow!.setBounds({ x, y, width: 220, height: 420 })
    secondaryWindow!.show()
  })

  secondaryWindow.on('closed', () => {
    secondaryWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    secondaryWindow.loadURL(
      `${process.env['ELECTRON_RENDERER_URL']}/widgets/timer`,
    )
    // Opcional: abrir o DevTools para a janela secundária
    // secondaryWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    secondaryWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const createTray = () => {
  tray = new Tray(join(__dirname, './assets/timer-icon.png'))

  const buildContextMenu = () =>
    Menu.buildFromTemplate([
      {
        label: secondaryWindow?.isVisible()
          ? 'Ocultar Janela Flutuante'
          : 'Habilitar Janela Flutuante',
        click: () => {
          if (!secondaryWindow || secondaryWindow.isDestroyed()) {
            createSecondaryWindow()
          } else {
            secondaryWindow.isVisible()
              ? secondaryWindow.hide()
              : secondaryWindow.show()
          }
        },
      },
      { type: 'separator' },
      { label: 'Sair', role: 'quit' },
    ])

  tray.setToolTip('Metric')

  tray.on('click', () => {
    const menu = buildContextMenu()
    tray?.popUpContextMenu(menu)
  })

  tray.on('right-click', () => {
    const menu = buildContextMenu()
    tray?.popUpContextMenu(menu)
  })
}

app.whenReady().then(async () => {
  const userDataPath = app.getPath('userData')
  const credentialsStorage = new KeytarTokenStorage()
  const workspacesRepository = new JSONWorkspacesRepository(userDataPath)
  const workspacesQuery = new JSONWorkspacesQuery(userDataPath)

  const platformDeps: PlatformDependencies = {
    credentialsStorage,
    workspacesRepository,
    workspacesQuery,
    dataSourceResolver: new DataSourceResolver(
      workspacesRepository,
      credentialsStorage,
      {
        addonsBasePath: join(__dirname, '../addons/datasource'),
        isDevelopment: !app.isPackaged,
      },
    ),
  }

  const serviceProvider = new ContainerBuilder()
    .addPlatformDependencies(platformDeps)
    .addInfrastructure()
    .addApplicationServices()
    .addScoped<IHandlersScope>({
      connectionHandler: ConnectionHandler,
      sessionHandler: SessionHandler,
      tasksHandler: TasksHandler,
      timeEntriesHandler: TimeEntriesHandler,
      tokenHandler: TokenHandler,
      workspacesHandler: WorkspacesHandler,
      addonsHandler: AddonsHandler,
      metadataHandler: MetadataHandler,
    })
    .build()

  openIpcRoutes(serviceProvider)

  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, w) => optimizer.watchWindowShortcuts(w))

  if (is.dev) {
    try {
      await installExtension(REACT_DEVELOPER_TOOLS, {
        loadExtensionOptions: { allowFileAccess: true },
        // forceDownload: true,
      })
      console.log(`✅ Extensão REACT DEV TOOLS instalada com sucesso`)
    } catch (err) {
      console.error('❌ Erro ao instalar a extensão React DevTools:', err)
    }
  }

  createWindow()

  //ANALISAR FUTURAMENTE o uso no main process
  // exposeIpcMainRxStorage({
  //   key: 'main-storage',
  //   storage: getRxStorageDexie({
  //     indexedDB, // SALVA TUDO IN MEMORY com INDEXED FAKE
  //     IDBKeyRange,
  //   }),
  //   ipcMain: ipcMain,
  // })
  // createTray()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
