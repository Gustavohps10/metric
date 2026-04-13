import type { EnvironmentInfo } from '@metric-org/application'
import { createContext, type ReactNode } from 'react'

export const EnvironmentContext = createContext<EnvironmentInfo | null>(null)

export interface EnvironmentProviderProps {
  environment: EnvironmentInfo
  children: ReactNode
}

export function EnvironmentProvider({
  environment,
  children,
}: EnvironmentProviderProps) {
  return (
    <EnvironmentContext.Provider value={environment}>
      {children}
    </EnvironmentContext.Provider>
  )
}
