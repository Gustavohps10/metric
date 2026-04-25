import { Outlet, useParams } from 'react-router'

import {
  AppSidebar,
  AppSidebarContent,
  AppSidebarFooter,
  AppSidebarHeader,
  AppSidebarWorkspacesContent,
  AppSidebarWorkspacesFooter,
  Header,
} from '@/components'
import { AppSidebarDefaultHeader } from '@/components/app-sidebar/app-sidebar-default-header'
import { Footer } from '@/components/footer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DataSourceConnectionsProvider } from '@/contexts/DataSourceConnectionsContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { SyncProvider } from '@/stores/syncStore'
import { TimeEntryProvider } from '@/stores/timeEntryStore'

export function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <SyncProvider>
        <TimeEntryProvider>
          <DataSourceConnectionsProvider>
            <>
              <AppSidebar>
                <AppSidebarHeader>
                  <AppSidebarDefaultHeader />
                </AppSidebarHeader>

                <AppSidebarContent>
                  <AppSidebarWorkspacesContent />
                </AppSidebarContent>

                <AppSidebarFooter>
                  <AppSidebarWorkspacesFooter />
                </AppSidebarFooter>
              </AppSidebar>

              <Header />
              <main className="relative h-full flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  <section className="px-4 pt-12">
                    <Outlet />
                  </section>
                  <Footer />
                </ScrollArea>
              </main>
            </>
          </DataSourceConnectionsProvider>
        </TimeEntryProvider>
      </SyncProvider>
    </WorkspaceProvider>
  )
}
