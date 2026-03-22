'use client'

import { WorkspaceConnectionDTO, WorkspaceDTO } from '@timelapse/application'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { User } from '@/@types/session/User'
import { useClient, useWorkspace } from '@/hooks'

export type ConnectionInstanceId = string

export interface DataSource {
  id: ConnectionInstanceId
  pluginId: string
  config?: Record<string, unknown>
}

export interface DataSourceConnectionState {
  member: User | null
  isAuthenticated: boolean
  token?: string | null
}

export interface DataSourceConnectionsContextType {
  isLoading: boolean
  membersByConnection: Record<ConnectionInstanceId, DataSourceConnectionState>
  connect: (params: {
    connectionInstanceId: ConnectionInstanceId
    member: User
    token: string
  }) => Promise<void>
  disconnect: (connectionInstanceId: ConnectionInstanceId) => Promise<void>
  getMemberId: (connectionInstanceId: ConnectionInstanceId) => string | null
}

export const DataSourceConnectionsContext = createContext<
  DataSourceConnectionsContextType | undefined
>(undefined)

function mapConnections(workspace: WorkspaceDTO): DataSource[] {
  const conns = workspace.dataSourceConnections
  if (!Array.isArray(conns)) return []

  return conns.map((c: WorkspaceConnectionDTO) => ({
    id: c.id,
    pluginId: c.dataSourceId,
    config: c.config,
  }))
}

export function DataSourceConnectionsProvider({
  children,
}: {
  children: ReactNode
}) {
  const { workspace, isLoading: workspaceIsLoading } = useWorkspace()
  const client = useClient()

  const [membersByConnection, setMembersByConnection] = useState<
    Record<ConnectionInstanceId, DataSourceConnectionState>
  >({})
  const [isLoading, setIsLoading] = useState(true)

  const connect = useCallback(
    async ({
      connectionInstanceId,
      member,
      token,
    }: {
      connectionInstanceId: ConnectionInstanceId
      member: User
      token: string
    }) => {
      if (!workspace?.id) return

      await client.modules.tokenStorage.saveToken({
        body: {
          service: 'timelapse',
          account: `jwt-${workspace.id}-${connectionInstanceId}`,
          token,
        },
      })

      setMembersByConnection((prev) => ({
        ...prev,
        [connectionInstanceId]: {
          member,
          isAuthenticated: true,
          token,
        },
      }))
    },
    [client, workspace?.id],
  )

  const disconnect = useCallback(
    async (connectionInstanceId: ConnectionInstanceId) => {
      if (!workspace?.id) return

      setMembersByConnection((prev) => ({
        ...prev,
        [connectionInstanceId]: {
          member: null,
          isAuthenticated: false,
          token: null,
        },
      }))

      await client.modules.tokenStorage.deleteToken({
        body: {
          service: 'timelapse',
          account: `jwt-${workspace.id}-${connectionInstanceId}`,
        },
      })
    },
    [client, workspace?.id],
  )

  const getMemberId = useCallback(
    (connectionInstanceId: ConnectionInstanceId) => {
      const state = membersByConnection[connectionInstanceId]
      return state?.member?.id != null ? String(state.member.id) : null
    },
    [membersByConnection],
  )

  useEffect(() => {
    if (!workspace?.id || workspaceIsLoading) return

    let isMounted = true

    const run = async () => {
      setIsLoading(true)
      const connections = mapConnections(workspace)
      const next: Record<ConnectionInstanceId, DataSourceConnectionState> = {}

      for (const conn of connections) {
        try {
          const res = await client.modules.tokenStorage.getToken({
            body: {
              service: 'timelapse',
              account: `jwt-${workspace.id}-${conn.id}`,
            },
          })

          const token = res.isSuccess ? (res.data ?? null) : null

          if (!token) {
            next[conn.id] = {
              member: null,
              isAuthenticated: false,
              token: null,
            }
            continue
          }

          const response = await client.services.workspaces.getConnectionMember(
            {
              body: {
                workspaceId: workspace.id,
                connectionInstanceId: conn.id,
              },
              headers: {
                authorization: `Bearer ${token}`,
              },
            },
          )

          next[conn.id] = {
            member: response.isSuccess ? (response.data as User) : null,
            isAuthenticated: response.isSuccess && response.data != null,
            token,
          }
        } catch {
          next[conn.id] = { member: null, isAuthenticated: false, token: null }
        }
      }

      if (isMounted) {
        setMembersByConnection(next)
        setIsLoading(false)
      }
    }

    void run()

    return () => {
      isMounted = false
    }
  }, [client, workspace, workspaceIsLoading])

  const value = useMemo<DataSourceConnectionsContextType>(
    () => ({
      isLoading,
      membersByConnection,
      connect,
      disconnect,
      getMemberId,
    }),
    [connect, disconnect, getMemberId, isLoading, membersByConnection],
  )

  return (
    <DataSourceConnectionsContext.Provider value={value}>
      {children}
    </DataSourceConnectionsContext.Provider>
  )
}

export function useDataSourceConnections(): DataSourceConnectionsContextType {
  const context = useContext(DataSourceConnectionsContext)
  if (context === undefined) {
    throw new Error(
      'useDataSourceConnections must be used within a DataSourceConnectionsProvider',
    )
  }
  return context
}
