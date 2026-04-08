import { IApplicationAPI } from '@timelapse/sdk'
import { useContext } from 'react'

import { ClientContext } from '@/contexts/ClientContext'

export function useClient(): IApplicationAPI {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error(
      'useClient() deve ser usado dentro de um <ClientContext.Provider>.',
    )
  }

  return context
}
