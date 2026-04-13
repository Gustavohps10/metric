import type { EnvironmentInfo } from '@metric-org/application'
import { useContext } from 'react'

import { EnvironmentContext } from '@/contexts/EnvironmentContext'

export function useEnvironment(): EnvironmentInfo {
  const context = useContext(EnvironmentContext)
  if (!context) {
    throw new Error(
      'useEnvironment() deve ser usado dentro de um <EnvironmentProvider>.',
    )
  }
  return context
}
