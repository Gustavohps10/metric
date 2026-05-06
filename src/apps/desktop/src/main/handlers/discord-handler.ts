import { ViewModel } from '@metric-org/shared/view-models'
import axios from 'axios'
import { BrowserWindow } from 'electron'
import http from 'http'
import url from 'url'

export interface DiscordUserResponse {
  id: string
  username: string
  avatar: string
  global_name: string | null
  avatarUrl: string
}

let authWindow: BrowserWindow | null = null

async function exchangeCodeAndGetUser(code: string) {
  const CLIENT_ID = '1372352088457220126'
  const CLIENT_SECRET = '8t0EQSv04PG-odB3IZkuk2JOjcon0qsu'
  const REDIRECT_URI = 'http://localhost:5353/callback'

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  })

  const tokenResponse = await axios.post(
    'https://discord.com/api/oauth2/token',
    params,
  )
  const accessToken = tokenResponse.data.access_token

  const userResponse = await axios.get('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return userResponse.data
}

export async function handleDiscordLogin(): Promise<
  ViewModel<DiscordUserResponse>
> {
  const authUrl = `https://discord.com/api/oauth2/authorize?client_id=1372352088457220126&redirect_uri=http%3A%2F%2Flocalhost%3A5353%2Fcallback&response_type=code&scope=identify`

  authWindow = new BrowserWindow({
    width: 500,
    height: 650,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  })

  authWindow.loadURL(authUrl)

  return new Promise((resolve) => {
    let isResolving = false

    const server = http
      .createServer(async (req, res) => {
        if (req.url && req.url.includes('/callback')) {
          isResolving = true

          const { code } = url.parse(req.url, true).query

          res.end(
            '<h1>Autenticação concluída! Você pode fechar esta janela.</h1>',
          )
          server.close()
          authWindow?.close()

          if (code) {
            try {
              const discordUser = await exchangeCodeAndGetUser(String(code))
              const { id, avatar } = discordUser

              if (!id || !avatar) {
                resolve({
                  isSuccess: false,
                  statusCode: 404,
                  error: 'Usuário não possui um avatar.',
                })
                return
              }

              const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png?size=128`

              resolve({ ...discordUser, avatarUrl })
            } catch (error) {
              resolve({
                isSuccess: false,
                statusCode: 500,
                error: (error as Error).message,
              })
            }
          } else {
            resolve({
              isSuccess: false,
              statusCode: 400,
              error: 'Código de autorização não recebido.',
            })
          }
        }
      })
      .listen(5353)

    authWindow?.on('closed', () => {
      server.close()
      authWindow = null
      if (!isResolving) {
        resolve({
          isSuccess: false,
          statusCode: 400,
          error: 'Janela de autenticação fechada pelo usuário.',
        })
      }
    })
  })
}
