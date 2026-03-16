'use client'

import type { FieldGroup } from '@timelapse/application'
import { AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import type { AddonItem } from './addon-types'

export interface ConnectionFormData {
  name?: string
  credentials: Record<string, unknown>
  configuration: Record<string, unknown>
}

interface InstallPluginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon: AddonItem | null
  versions: { value: string; label: string }[]
  onInstall: (addon: AddonItem, version: string) => void
  isInstalling?: boolean
}

export function InstallPluginDialog({
  open,
  onOpenChange,
  addon,
  versions,
  onInstall,
  isInstalling = false,
}: InstallPluginDialogProps) {
  const [selectedVersion, setSelectedVersion] = useState(
    versions[0]?.value ?? '',
  )

  if (!addon) return null

  const handleInstall = () => {
    onInstall(addon, (selectedVersion || versions[0]?.value) ?? addon.version)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="bg-secondary flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
              {addon.logo ? (
                <img
                  src={addon.logo}
                  alt={addon.name}
                  className="h-10 w-10 object-contain p-1"
                />
              ) : (
                <span className="text-lg">📦</span>
              )}
            </span>
            <span>{addon.name}</span>
          </DialogTitle>
          <DialogDescription>{addon.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground font-medium">Autor:</span>{' '}
              {addon.author}
            </p>
            {addon.documentationUrl && (
              <a
                href={addon.documentationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
              >
                Ver documentação
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {versions.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="version">Versão</Label>
              <Select
                value={selectedVersion}
                onValueChange={setSelectedVersion}
              >
                <SelectTrigger id="version">
                  <SelectValue placeholder="Selecione a versão" />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleInstall} disabled={isInstalling}>
            {isInstalling ? 'Instalando...' : 'Instalar Plugin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddConnectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon: AddonItem | null
  dynamicFields: { credentials: FieldGroup[]; configuration: FieldGroup[] }
  onSave: (addon: AddonItem, data: ConnectionFormData) => void
  isSaving?: boolean
  isTesting?: boolean
  connectionStatus?: 'idle' | 'success' | 'error'
}

export function AddConnectionDialog({
  open,
  onOpenChange,
  addon,
  dynamicFields,
  onSave,
  isSaving = false,
  isTesting = false,
  connectionStatus = 'idle',
}: AddConnectionDialogProps) {
  const [formData, setFormData] = useState<ConnectionFormData>({
    credentials: {},
    configuration: {},
  })

  if (!addon) return null

  const handleSave = () => {
    onSave(addon, formData)
    setFormData({ credentials: {}, configuration: {} })
    onOpenChange(false)
  }

  const handleClose = () => {
    setFormData({ credentials: {}, configuration: {} })
    onOpenChange(false)
  }

  const setCredential = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      credentials: { ...prev.credentials, [key]: value },
    }))
  }
  const setConfig = (key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      configuration: { ...prev.configuration, [key]: value },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Conectar com {addon.name}</DialogTitle>
          <DialogDescription>Preencha suas credenciais.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h4 className="text-foreground text-sm font-medium">
              Configuração da Conexão
            </h4>
            {dynamicFields.configuration.map((group) => (
              <div key={group.id} className="space-y-2">
                <Label className="text-xs">{group.label}</Label>
                {group.fields.map((field) => (
                  <Input
                    key={field.id}
                    type={field.type === 'password' ? 'password' : 'text'}
                    placeholder={field.placeholder}
                    value={String(formData.configuration[field.id] ?? '')}
                    onChange={(e) => setConfig(field.id, e.target.value)}
                  />
                ))}
              </div>
            ))}
          </div>

          {dynamicFields.credentials.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-foreground text-sm font-medium">
                Autenticação
              </h4>
              {dynamicFields.credentials.map((group) => (
                <div key={group.id} className="space-y-2">
                  <Label className="text-xs">{group.label}</Label>
                  {group.fields.map((field) => (
                    <Input
                      key={field.id}
                      type={field.type === 'password' ? 'password' : 'text'}
                      placeholder={field.placeholder}
                      value={String(formData.credentials[field.id] ?? '')}
                      onChange={(e) => setCredential(field.id, e.target.value)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {connectionStatus === 'success' && (
            <div className="flex items-center gap-3 rounded-md border border-green-500/20 bg-green-500/10 p-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="text-sm">
                <p className="text-foreground font-medium">
                  Conexão estabelecida!
                </p>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="bg-destructive/10 border-destructive/20 flex items-center gap-3 rounded-md border p-3">
              <AlertCircle className="text-destructive h-5 w-5" />
              <div className="text-sm">
                <p className="text-foreground font-medium">Falha na conexão</p>
                <p className="text-muted-foreground">
                  Verifique suas credenciais e tente novamente.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <div className="flex w-full gap-2 sm:justify-end">
            <Button variant="ghost" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar Conexão'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddonDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  addon: AddonItem | null
  onInstall: (addon: AddonItem) => void
}

export function AddonDetailsDialog({
  open,
  onOpenChange,
  addon,
  onInstall,
}: AddonDetailsDialogProps) {
  if (!addon) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="bg-secondary flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg">
              {addon.logo ? (
                <img
                  src={addon.logo}
                  alt={addon.name}
                  className="h-10 w-10 object-contain p-1"
                />
              ) : (
                <span className="text-lg">📦</span>
              )}
            </span>
            <div>
              <span>{addon.name}</span>
              <p className="text-muted-foreground text-sm font-normal">
                v{addon.version}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm">{addon.description}</p>

          <div className="space-y-2 text-sm">
            <div className="border-border flex items-center justify-between border-b py-2">
              <span className="text-muted-foreground">Autor</span>
              <span className="text-foreground">{addon.author}</span>
            </div>
            <div className="border-border flex items-center justify-between border-b py-2">
              <span className="text-muted-foreground">Versão</span>
              <span className="text-foreground">v{addon.version}</span>
            </div>
            {addon.documentationUrl && (
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Documentação</span>
                <a
                  href={addon.documentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-1 hover:underline"
                >
                  Abrir
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button onClick={() => onInstall(addon)}>Instalar Plugin</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
