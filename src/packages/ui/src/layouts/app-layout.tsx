'use client'

import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { AppRail } from '@/components/app-rail'
import { DraftWorkspacesPanel } from '@/components/draft-workspace-panel'
import { NewWorkspaceDialog } from '@/components/new-workspace-dialog'
import { Toaster } from '@/components/ui/sonner'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { DataSourceConnectionsProvider } from '@/providers'
import { SyncProvider } from '@/stores/syncStore'

export function AppLayout() {
  const [workspaceDialogIsOpen, setWorkspaceDialogIsOpen] = useState(false)
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<
    string | undefined
  >()

  return (
    <>
      <main className="flex h-screen w-screen overflow-hidden pt-12">
        <WorkspaceProvider workspaceId={activeWorkspaceId}>
          <DataSourceConnectionsProvider>
            <SyncProvider>
              <NewWorkspaceDialog
                isOpen={workspaceDialogIsOpen}
                setIsOpen={setWorkspaceDialogIsOpen}
                setWorkspaceId={setActiveWorkspaceId}
              />
              {/* Sidebar */}
              <AppRail
                onNewWorkspaceClick={() => {
                  setActiveWorkspaceId(undefined)
                  setWorkspaceDialogIsOpen(true)
                }}
              />

              {/* Painel de drafts */}
              <DraftWorkspacesPanel
                onOpenWorkspace={(id) => {
                  console.log(id)
                  setActiveWorkspaceId(id)
                  setWorkspaceDialogIsOpen(true)
                }}
              />
            </SyncProvider>
          </DataSourceConnectionsProvider>
        </WorkspaceProvider>

        <section className="flex flex-1 overflow-hidden rounded-tl-md border-t border-l">
          <Outlet />
        </section>
      </main>
      <Toaster />
    </>
  )
}
