'use client'

import { cva } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { Compass, HomeIcon, LayoutGridIcon, PlusIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { cn } from '@/lib'

const sidebarButtonVariants = cva(
  'group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg shadow-sm transition-all duration-200 ease-in-out hover:rounded-xl',
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

export function AppRail({
  onNewWorkspaceClick,
}: {
  onNewWorkspaceClick: () => void
}) {
  const { workspaces, isLoading } = useWorkspace()

  return (
    <nav className="relative flex h-full w-[72px] flex-col items-center space-y-3 py-4">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          cn(sidebarButtonVariants({ isActive }), 'shrink-0')
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
        {workspaces
          .filter((w) => w.status == 'configured')
          .map((workspace) => (
            <NavLink
              key={workspace.id}
              to={`/workspaces/${workspace.id}`}
              className={({ isActive }) =>
                cn(sidebarButtonVariants({ isActive }), 'relative shrink-0')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="active-indicator"
                      className="bg-primary absolute top-0 -left-3.5 z-20 h-10 w-1 rounded-r-md"
                      transition={{
                        type: 'spring',
                        stiffness: 180,
                        damping: 20,
                      }}
                    />
                  )}

                  <div className="h-full w-full overflow-hidden rounded-lg">
                    <Avatar className="h-full w-full rounded-none border-none">
                      <AvatarImage
                        src={workspace.avatarUrl}
                        alt={workspace.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-none">
                        <LayoutGridIcon className="size-5" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </>
              )}
            </NavLink>
          ))}

        <hr className="w-8 border-t" />

        <button
          onClick={onNewWorkspaceClick}
          className={cn(sidebarButtonVariants(), 'shrink-0')}
        >
          <PlusIcon className="size-5" />
        </button>

        <button className={cn(sidebarButtonVariants(), 'shrink-0')}>
          <Compass className="size-5" />
        </button>
      </div>
    </nav>
  )
}
