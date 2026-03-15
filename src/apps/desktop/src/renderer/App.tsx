// src/renderer/main.tsx (ou onde você monta o App)
import '@/renderer/index.css'

import { QueryClientProvider } from '@tanstack/react-query'
import {
  ClientProvider,
  EnvironmentProvider,
  queryClient,
  SidebarProvider,
  ThemeProvider,
  TooltipProvider,
} from '@timelapse/ui'
import { NuqsAdapter } from 'nuqs/adapters/react-router/v6'
import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'

import { ipcClient } from '@/renderer/client'
import { router } from '@/renderer/routes'

const defaultEnvironment = { isDevelopment: false }

export function AppDesktop() {
  const [environment, setEnvironment] = useState(defaultEnvironment)

  useEffect(() => {
    ipcClient.modules.system
      .getEnvironment()
      .then(setEnvironment)
      .catch(() => setEnvironment(defaultEnvironment))
  }, [])

  return (
    <ClientProvider client={ipcClient}>
      <EnvironmentProvider environment={environment}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <TooltipProvider>
            <SidebarProvider>
              <QueryClientProvider client={queryClient}>
                <NuqsAdapter>
                  <RouterProvider router={router} />
                </NuqsAdapter>
              </QueryClientProvider>
            </SidebarProvider>
          </TooltipProvider>
        </ThemeProvider>
      </EnvironmentProvider>
    </ClientProvider>
  )
}
