import { EventEmitter } from 'node:events'

import { IEventEmitter, IJobEvents } from '@metric-org/shared/transport'
import { BrowserWindow } from 'electron'

export class ElectronJobEventEmitter implements IEventEmitter<IJobEvents> {
  private emitter = new EventEmitter()

  constructor(private getWindow: () => BrowserWindow | null) {}

  emit<K extends keyof IJobEvents>(event: K, payload: IJobEvents[K]): void {
    const eventName = event as string
    this.emitter.emit(eventName, payload)
    const window = this.getWindow()
    if (window && !window.isDestroyed()) {
      window.webContents.send(eventName, payload)
    }
  }

  on<K extends keyof IJobEvents>(
    event: K,
    handler: (payload: IJobEvents[K]) => void,
  ): () => void {
    const eventName = event as string
    this.emitter.on(eventName, handler)
    return () => this.emitter.off(eventName, handler)
  }

  once<K extends keyof IJobEvents>(
    event: K,
    handler: (payload: IJobEvents[K]) => void,
  ): void {
    this.emitter.once(event as string, handler)
  }

  off<K extends keyof IJobEvents>(
    event: K,
    handler: (payload: IJobEvents[K]) => void,
  ): void {
    this.emitter.off(event as string, handler)
  }
}
