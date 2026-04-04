import { IApplicationAPI } from '@timelapse/application'
import React from 'react'
import { createContext } from 'react'

export const ClientContext = createContext<IApplicationAPI | null>(null)

interface ClientProviderProps {
  client: IApplicationAPI
  children: React.ReactNode
}

export function ClientProvider({ client, children }: ClientProviderProps) {
  console.log('CLIENT', client)
  return (
    <ClientContext.Provider value={client}>{children}</ClientContext.Provider>
  )
}
