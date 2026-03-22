import {
  ChartColumnBig,
  FileEditIcon,
  ListTodoIcon,
  PuzzleIcon,
  Settings,
  Timer,
} from 'lucide-react'
import { NavLink, useParams } from 'react-router-dom'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const mainItems = [
  { title: 'Atividades', path: 'activities', icon: ListTodoIcon },
  { title: 'Apontamento', path: 'time-entries', icon: Timer },
  { title: 'Métricas', path: '', icon: ChartColumnBig },
  { title: 'Anotações', path: 'notes', icon: FileEditIcon },
  { title: 'Addons', path: 'addons', icon: PuzzleIcon },
  { title: 'Configuração', path: 'settings', icon: Settings },
]

export function AppSidebarWorkspacesContent() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Navegar</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={`/workspaces/${workspaceId}/${item.path}`}
                    end={item.path === ''}
                    className="z-40 flex items-center rounded-md transition-colors [&.active]:bg-zinc-100 dark:[&.active]:bg-zinc-800"
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={
                            isActive ? 'text-primary' : 'text-foreground'
                          }
                        />
                        <span>{item.title}</span>
                      </>
                    )}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      {/* <SidebarGroup>
              <SidebarGroupLabel>Recursos</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <Collapsible defaultOpen className="group">
                    <SidebarMenuItem>
                      <div className="flex items-center">
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="flex-1">
                            <span>Workspaces</span>
                            <div className="ml-auto flex items-center gap-1">
                              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                            </div>
                          </SidebarMenuButton>
                        </CollapsibleTrigger>

                        <Plus
                          className="text-muted-foreground hover:text-foreground ml-2 h-4 w-4 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setWorkspaceDialogIsOpen(true)
                          }}
                        />
                      </div>
                    </SidebarMenuItem>
                  </Collapsible>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup> */}
    </>
  )
}
