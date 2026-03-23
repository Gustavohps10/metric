'use client'

import {
  Brain,
  ChartColumnBig,
  CloudCog,
  FileEditIcon,
  LayoutDashboard,
  ListTodoIcon,
  MonitorCogIcon,
  PuzzleIcon,
  ReceiptIcon,
  Scale,
  Terminal,
  Timer,
  User,
} from 'lucide-react'
import { NavLink, useParams } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

interface NavItem {
  title: string
  path: string
  icon: React.ElementType
  isPro?: boolean
}

const workItems: NavItem[] = [
  { title: 'Atividades', path: 'activities', icon: ListTodoIcon },
  { title: 'Apontamento', path: 'time-entries', icon: Timer },
  { title: 'Anotações', path: 'notes', icon: FileEditIcon },
]

const analysisItems: NavItem[] = [
  { title: 'Métricas Pessoais', path: 'my-metrics', icon: ChartColumnBig },
]

const teamItems: NavItem[] = [
  { title: 'Visão Geral', path: 'team', icon: LayoutDashboard, isPro: true },
  { title: 'Membros', path: 'members', icon: User, isPro: true },
  { title: 'Carga de Trabalho', path: 'workload', icon: Scale, isPro: true },
  { title: 'Insights IA', path: 'insights', icon: Brain, isPro: true },
]

const extensionItems: NavItem[] = [
  { title: 'Addons', path: 'addons', icon: PuzzleIcon },
]

// Reajustado: Sem repetição de ícones e com semântica de Workspace/Admin
const workspaceItems: NavItem[] = [
  { title: 'Perfil do Workspace', path: 'settings', icon: MonitorCogIcon },
  { title: 'Moeda & Valores', path: 'billing', icon: ReceiptIcon },
  { title: 'Motor de Sync', path: 'sync', icon: CloudCog },
  { title: 'Logs de Eventos', path: 'logs', icon: Terminal },
]

export function AppSidebarWorkspacesContent() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const renderNavItems = (items: NavItem[], end = false) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.path}>
          <SidebarMenuButton asChild>
            <NavLink
              to={`/workspaces/${workspaceId}/${item.path}`}
              end={end}
              className="z-40 flex items-center justify-between rounded-md transition-colors [&.active]:bg-zinc-100 dark:[&.active]:bg-zinc-800"
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-2">
                    <item.icon
                      size={18}
                      className={
                        isActive ? 'text-primary' : 'text-foreground/70'
                      }
                    />
                    <span>{item.title}</span>
                  </div>

                  {item.isPro && (
                    <Badge
                      variant="secondary"
                      className="h-4 border-amber-500/20 bg-amber-500/10 px-1 text-[9px] font-bold tracking-widest text-amber-600 uppercase"
                    >
                      Pro
                    </Badge>
                  )}
                </>
              )}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Trabalho</SidebarGroupLabel>
        <SidebarGroupContent>{renderNavItems(workItems)}</SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Análise Individual</SidebarGroupLabel>
        <SidebarGroupContent>
          {renderNavItems(analysisItems, true)}
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Gestão de Equipe</SidebarGroupLabel>
        <SidebarGroupContent>{renderNavItems(teamItems)}</SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Extensões</SidebarGroupLabel>
        <SidebarGroupContent>
          {renderNavItems(extensionItems)}
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Sessão de Configuração do Espaço (Workspace Admin) */}
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          {renderNavItems(workspaceItems)}
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
