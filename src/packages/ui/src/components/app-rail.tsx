'use client'

import { useQuery } from '@tanstack/react-query'
import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { Compass, HomeIcon, LayoutGridIcon, PlusIcon } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { NewWorkspaceDialog } from '@/components/new-workspace-dialog'
import { useClient } from '@/hooks'
import { cn } from '@/lib'

const sidebarButtonVariants = cva(
  'group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-sm transition-all duration-200 ease-in-out hover:rounded-2xl',
  {
    variants: {
      isActive: {
        true: 'bg-primary text-primary-foreground',
        false:
          'bg-background text-muted-foreground hover:bg-primary hover:text-primary-foreground',
      },
    },
    defaultVariants: {
      isActive: false,
    },
  },
)
export function AppRail() {
  const [workspaceDialogIsOpen, setWorkspaceDialogIsOpen] = useState(false)
  const client = useClient()
  const { data: workspacesResponse } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => client.services.workspaces.listAll(),
  })

  const openWorkspaceDialog = () => setWorkspaceDialogIsOpen(true)
  return (
    <>
      <NewWorkspaceDialog
        isOpen={workspaceDialogIsOpen}
        setIsOpen={setWorkspaceDialogIsOpen}
      />

      <nav className="relative flex h-full w-[72px] flex-col items-center space-y-3">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            cn(sidebarButtonVariants({ isActive }), 'flex-shrink-0')
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="active-indicator"
                  className="bg-primary absolute top-0 -left-3.5 h-10 w-1 rounded-r-md"
                  transition={{
                    type: 'spring',
                    stiffness: 180,
                    damping: 20,
                  }}
                />
              )}
              <HomeIcon className="size-5" />
            </>
          )}
        </NavLink>

        <hr className="w-8 border-t" />

        <div className="flex w-full flex-1 flex-col items-center space-y-3 overflow-y-auto">
          {workspacesResponse?.data?.map((workspace) => (
            <NavLink
              key={workspace.id}
              to={`/workspaces/${workspace.id}`}
              className={({ isActive }) =>
                cn(sidebarButtonVariants({ isActive }), 'flex-shrink-0')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-indicator"
                      className="bg-primary absolute top-0 -left-3.5 h-10 w-1 rounded-r-md"
                      transition={{
                        type: 'spring',
                        stiffness: 180,
                        damping: 20,
                      }}
                    />
                  )}
                  <LayoutGridIcon className="size-5" />
                </>
              )}
            </NavLink>
          ))}

          <hr className="w-8 border-t" />

          <button
            onClick={openWorkspaceDialog}
            className={cn(sidebarButtonVariants(), 'flex-shrink-0')}
          >
            <PlusIcon className="size-5" />
          </button>

          <button className={cn(sidebarButtonVariants(), 'flex-shrink-0')}>
            <Compass className="size-5" />
          </button>
        </div>
      </nav>
    </>
  )
}
