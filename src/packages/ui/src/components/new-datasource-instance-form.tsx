'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  Loader2,
  PlugZap,
  Settings,
  ShieldCheck,
} from 'lucide-react'
import React from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { Button, Input, Label } from '@/components/ui'
import { useClient } from '@/hooks/use-client'

export interface DataSourceInstanceFormData {
  pluginId: string
  connectionInstanceId: string
  credentials: Record<string, any>
  configuration: Record<string, any>
}

interface NewDataSourceInstanceFormProps {
  pluginId: string
  connectionInstanceId: string
  onSubmit: (data: DataSourceInstanceFormData) => void
  isSubmitting?: boolean
  submitLabel?: string
  hideSubmitButton?: boolean
}

export function NewDataSourceInstanceForm({
  pluginId,
  connectionInstanceId,
  onSubmit,
  isSubmitting = false,
  hideSubmitButton = false,
}: NewDataSourceInstanceFormProps) {
  const client = useClient()

  // 2. Busca dinâmica de campos baseada no pluginId
  const {
    data: fields,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['datasource-fields', pluginId],
    queryFn: async () => {
      const res = await client.services.workspaces.getDataSourceFields({
        body: { pluginId },
      })
      return res // Assume que retorna { credentials: FieldGroup[], configuration: FieldGroup[] }
    },
  })

  // 3. Setup do Formulário
  const methods = useForm<DataSourceInstanceFormData>({
    defaultValues: {
      pluginId,
      connectionInstanceId,
      credentials: {},
      configuration: {},
    },
  })

  const handleFormSubmit = (values: DataSourceInstanceFormData) => {
    onSubmit(values)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3 py-12">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
        <p className="text-muted-foreground text-sm">
          Carregando campos de integração...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-destructive/20 bg-destructive/5 flex items-center gap-3 rounded-xl border p-4">
        <AlertCircle className="text-destructive h-5 w-5" />
        <p className="text-sm font-medium">
          Falha ao carregar definições do plugin.
        </p>
      </div>
    )
  }

  return (
    <FormProvider {...methods}>
      <div className="space-y-8">
        {/* Seção de Configuração */}
        {fields?.configuration?.length && fields?.configuration?.length > 0 && (
          <div className="space-y-4">
            <div className="text-foreground/80 flex items-center gap-2 text-sm font-semibold">
              <Settings className="h-4 w-4" />
              <h4>Configurações Gerais</h4>
            </div>
            <div className="ml-2 grid gap-4 border-l-2 pl-4">
              {fields.configuration.map((group) => (
                <div key={group.id} className="space-y-3">
                  <Label className="text-muted-foreground text-[11px] tracking-wider">
                    {group.label}
                  </Label>
                  {group.fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={`config-${field.id}`} className="text-xs">
                        {field.label || field.id}
                      </Label>
                      <Input
                        id={`config-${field.id}`}
                        type={field.type === 'password' ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        {...methods.register(
                          `configuration.${field.id}` as const,
                          {
                            required: field.required,
                          },
                        )}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Seção de Autenticação / Credenciais */}
        {fields?.credentials?.length && fields?.credentials?.length > 0 && (
          <div className="space-y-4">
            <div className="text-foreground/80 flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="text-primary h-4 w-4" />
              <h4>Credenciais de Acesso</h4>
            </div>
            <div className="border-primary/30 ml-2 grid gap-4 border-l-2 pl-4">
              {fields.credentials.map((group) => (
                <div key={group.id} className="space-y-3">
                  <Label className="text-muted-foreground text-[11px] tracking-wider">
                    {group.label}
                  </Label>
                  {group.fields.map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={`cred-${field.id}`} className="text-xs">
                        {field.label || field.id}
                      </Label>
                      <Input
                        id={`cred-${field.id}`}
                        type={field.type === 'password' ? 'password' : 'text'}
                        placeholder={field.placeholder}
                        {...methods.register(
                          `credentials.${field.id}` as const,
                          {
                            required: field.required,
                          },
                        )}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {!hideSubmitButton && (
          <div className="flex justify-end">
            <Button
              onClick={methods.handleSubmit(handleFormSubmit)}
              disabled={isSubmitting}
              size="sm"
              variant="secondary"
              className="w-full"
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="mr-2" />
              )}
              Conectar
            </Button>
          </div>
        )}
      </div>
    </FormProvider>
  )
}
