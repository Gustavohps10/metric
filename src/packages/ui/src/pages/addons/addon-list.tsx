'use client'

import {
  ArrowUpCircle,
  Download,
  Info,
  MoreHorizontal,
  Plus,
  Power,
  RefreshCw,
  Settings,
  Trash2,
  Unlink,
} from 'lucide-react'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import type { AddonConnection, AddonItem } from './addon-types'

function ConnectionStatusIndicator({
  status,
}: {
  status: AddonConnection['status']
}) {
  const config = {
    connected: { className: 'bg-green-500', label: 'Conectado' },
    disconnected: { className: 'bg-muted-foreground', label: 'Desconectado' },
    warning: { className: 'bg-yellow-500', label: 'Aviso' },
    error: { className: 'bg-destructive', label: 'Erro' },
  }
  const { className, label } = config[status]
  return (
    <span className="flex items-center gap-2 text-sm">
      <span className={cn('h-2 w-2 rounded-full', className)} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

function StatusBadge({
  installed,
  updateAvailable,
}: {
  installed: boolean
  updateAvailable?: boolean
}) {
  if (updateAvailable) {
    return (
      <Badge
        variant="outline"
        className="border-amber-500/30 bg-amber-500/20 text-amber-600 dark:text-amber-400"
      >
        Atualização disponível
      </Badge>
    )
  }
  if (installed) {
    return (
      <Badge
        variant="outline"
        className="border-green-500/30 bg-green-500/20 text-green-600 dark:text-green-400"
      >
        Instalado
      </Badge>
    )
  }
  return (
    <Badge
      variant="outline"
      className="bg-muted text-muted-foreground border-border"
    >
      Não instalado
    </Badge>
  )
}

interface ConnectionRowProps {
  connection: AddonConnection
  onOpenSettings: (connection: AddonConnection) => void
  onSyncNow: (connection: AddonConnection) => void
  onDisconnect: (connection: AddonConnection) => void
}

function ConnectionRow({
  connection,
  onOpenSettings,
  onSyncNow,
  onDisconnect,
}: ConnectionRowProps) {
  return (
    <div className="bg-secondary/30 flex items-center justify-between rounded-md px-4 py-3">
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">
          {connection.name || connection.id}
        </p>
        {connection.url && (
          <p className="text-muted-foreground font-mono text-xs">
            {connection.url}
          </p>
        )}
        <div className="flex items-center gap-4 pt-1">
          <ConnectionStatusIndicator status={connection.status} />
          {connection.lastSync && (
            <span className="text-muted-foreground text-xs">
              Última sincronização: {connection.lastSync}
            </span>
          )}
        </div>
        {connection.userName && (
          <p className="text-muted-foreground text-xs">
            Conectado como: {connection.userName}
            {connection.userId != null && ` (ID: ${connection.userId})`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenSettings(connection)}
          className="text-muted-foreground hover:text-foreground"
        >
          <Settings className="mr-1 h-4 w-4" />
          Configurações
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSyncNow(connection)}
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="mr-1 h-4 w-4" />
          Sincronizar
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDisconnect(connection)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Unlink className="mr-1 h-4 w-4" />
          Desconectar
        </Button>
      </div>
    </div>
  )
}

interface AddonRowProps {
  addon: AddonItem
  onInstall: (addon: AddonItem) => void
  onDetails: (addon: AddonItem) => void
  onAddConnection: (addon: AddonItem) => void
  onOpenSettings: (addon: AddonItem, connection: AddonConnection) => void
  onSyncNow: (addon: AddonItem, connection: AddonConnection) => void
  onDisconnect: (addon: AddonItem, connection: AddonConnection) => void
  onUpdate: (addon: AddonItem) => void
  onDisable: (addon: AddonItem) => void
  onUninstall: (addon: AddonItem) => void
}

function AddonRow({
  addon,
  onInstall,
  onDetails,
  onAddConnection,
  onOpenSettings,
  onSyncNow,
  onDisconnect,
  onUpdate,
  onDisable,
  onUninstall,
}: AddonRowProps) {
  const isInstalled = addon.installed
  const hasConnections = addon.connections.length > 0

  return (
    <AccordionItem value={addon.id} className="border-border border-b">
      <AccordionTrigger className="px-0 py-4 hover:no-underline">
        <div className="flex w-full items-center justify-between pr-4">
          <div className="flex items-center gap-4">
            <div className="bg-secondary flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
              {addon.logo ? (
                <img
                  src={addon.logo}
                  alt={addon.name}
                  className="h-10 w-10 object-contain p-1"
                />
              ) : (
                <span className="text-lg">📦</span>
              )}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-foreground font-medium">
                  {addon.name}
                </span>
                <Badge variant="outline" className="font-mono text-xs">
                  v{addon.version}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {addon.description}
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                por {addon.author}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {hasConnections && (
              <span className="text-muted-foreground text-xs">
                {addon.connections.length}{' '}
                {addon.connections.length === 1 ? 'conexão' : 'conexões'}
              </span>
            )}
            <StatusBadge
              installed={addon.installed}
              updateAvailable={addon.updateAvailable}
            />

            {!isInstalled ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onDetails(addon)}
                >
                  <Info className="mr-1 h-4 w-4" />
                  Detalhes
                </Button>
                <Button size="sm" onClick={() => onInstall(addon)}>
                  <Download className="mr-1 h-4 w-4" />
                  Instalar
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onAddConnection(addon)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar conexão
                  </DropdownMenuItem>
                  {addon.updateAvailable && (
                    <DropdownMenuItem onClick={() => onUpdate(addon)}>
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Atualizar plugin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onDisable(addon)}>
                    <Power className="mr-2 h-4 w-4" />
                    Desativar plugin
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onUninstall(addon)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Desinstalar plugin
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </AccordionTrigger>

      {isInstalled && (
        <AccordionContent className="pb-4">
          <div className="space-y-3 pt-2">
            {hasConnections && (
              <>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span className="font-medium">Conexões</span>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-2">
                  {addon.connections.map((connection) => (
                    <ConnectionRow
                      key={connection.id}
                      connection={connection}
                      onOpenSettings={(conn) => onOpenSettings(addon, conn)}
                      onSyncNow={(conn) => onSyncNow(addon, conn)}
                      onDisconnect={(conn) => onDisconnect(addon, conn)}
                    />
                  ))}
                </div>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddConnection(addon)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Plus className="mr-1 h-4 w-4" />
              Adicionar nova conexão
            </Button>
          </div>
        </AccordionContent>
      )}
    </AccordionItem>
  )
}

export interface AddonListProps {
  addons: AddonItem[]
  onInstall: (addon: AddonItem) => void
  onDetails: (addon: AddonItem) => void
  onAddConnection: (addon: AddonItem) => void
  onOpenSettings: (addon: AddonItem, connection: AddonConnection) => void
  onSyncNow: (addon: AddonItem, connection: AddonConnection) => void
  onDisconnect: (addon: AddonItem, connection: AddonConnection) => void
  onUpdate: (addon: AddonItem) => void
  onDisable: (addon: AddonItem) => void
  onUninstall: (addon: AddonItem) => void
}

export function AddonList({
  addons,
  onInstall,
  onDetails,
  onAddConnection,
  onOpenSettings,
  onSyncNow,
  onDisconnect,
  onUpdate,
  onDisable,
  onUninstall,
}: AddonListProps) {
  if (addons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-secondary mb-4 flex h-12 w-12 items-center justify-center rounded-full">
          <Info className="text-muted-foreground h-6 w-6" />
        </div>
        <p className="text-muted-foreground">Nenhum plugin encontrado</p>
      </div>
    )
  }

  return (
    <Accordion type="multiple" className="w-full">
      {addons.map((addon) => (
        <AddonRow
          key={addon.id}
          addon={addon}
          onInstall={onInstall}
          onDetails={onDetails}
          onAddConnection={onAddConnection}
          onOpenSettings={onOpenSettings}
          onSyncNow={onSyncNow}
          onDisconnect={onDisconnect}
          onUpdate={onUpdate}
          onDisable={onDisable}
          onUninstall={onUninstall}
        />
      ))}
    </Accordion>
  )
}
