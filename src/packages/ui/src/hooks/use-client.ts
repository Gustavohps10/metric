import { IApplicationAPI } from '@metric-org/sdk'
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
