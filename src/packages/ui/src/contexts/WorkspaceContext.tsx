import { WorkspaceViewModel } from '@metric-org/presentation/view-models'
import { useQuery } from '@tanstack/react-query'
import { createContext, ReactNode } from 'react'
import { useParams } from 'react-router'

import { useClient } from '@/hooks'

export interface WorkspaceContextType {
  workspace?: WorkspaceViewModel | null
  isLoading: boolean
}

export const WorkspaceContext = createContext<WorkspaceContextType | undefined>(
  undefined,
)

interface WorkspaceProviderProps {
  children: ReactNode
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
}) => {
  const client = useClient()
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return null

      const response = await client.services.workspaces.getById({
        body: { workspaceId },
      })

      console.log('Resposta Context:', response)

      if (!response.isSuccess || !response.data) {
        return null
      }

      return response.data
    },
    enabled: !!workspaceId,
    retry: false,
  })

  console.log('WORKSPACEDATA', workspaceId, isLoading)

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}
