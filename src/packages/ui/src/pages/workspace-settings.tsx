import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { z } from 'zod'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useClient } from '@/hooks/use-client'

const baseWorkspaceSettingsSchema = z.object({
  name: z.string().min(1, 'O nome é obrigatório.'),
  description: z.string().optional(),
  defaultHourlyRate: z.coerce.number().optional(),
  currency: z.string().optional(),
  weeklyHourGoal: z.coerce.number().optional(),
})

export interface WorkspaceConnectionRef {
  id: string
  config?: Record<string, unknown>
}

export function WorkspaceSettings() {
  const client = useClient()
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const workspaceQueryKey = ['workspace', workspaceId]

  const { data: workspace, isLoading } = useQuery({
    queryKey: workspaceQueryKey,
    queryFn: async () => {
      if (!workspaceId) return null
      const response = await client.services.workspaces.getById({
        body: { workspaceId },
      })
      return response.data ?? null
    },
    enabled: !!workspaceId,
  })

  if (isLoading) {
    return <div className="p-4">Carregando workspace...</div>
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Configurações</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <hr className="mt-2" />

      <div className="mt-6 space-y-6 pb-12">
        <Card>
          <CardHeader>
            <CardTitle>Informações Gerais</CardTitle>
            <CardDescription>
              Detalhes básicos do seu espaço de trabalho.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Workspace</Label>
              <Input
                id="name"
                placeholder="Ex: Minha Empresa"
                defaultValue={workspace?.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o propósito deste workspace."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="defaultHourlyRate">Valor Hora Padrão</Label>
                <Input id="defaultHourlyRate" type="number" step="0.01" />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="weeklyHourGoal">Meta de Horas Semanal</Label>
              <Input id="weeklyHourGoal" type="number" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="button">Salvar Alterações</Button>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
