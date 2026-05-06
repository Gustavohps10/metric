import { IDiscordAPI } from '@metric-org/application'

import { IpcInvoker } from '@/main/adapters/IpcInvoker'
import { DiscordUserResponse } from '@/main/handlers/discord-handler'

export const discordInvoker: IDiscordAPI = {
  login: (): Promise<DiscordUserResponse> => IpcInvoker.invoke('DISCORD_LOGIN'),
}
