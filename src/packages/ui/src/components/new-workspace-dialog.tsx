'use client'

import React from 'react'

import { StepperForm } from '@/components/new-workspace-stepper-form'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export function NewWorkspaceDialog({
  isOpen,
  setIsOpen,
  setWorkspaceId,
}: {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  setWorkspaceId: (id?: string) => void
}) {
  const { workspace, isLoading } = useWorkspace()
  const [hasOpenChild, setHasOpenChild] = React.useState(false)

  function resetDialog() {
    setIsOpen(false)
    setWorkspaceId(undefined)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && hasOpenChild) return
        resetDialog()
      }}
    >
      <DialogContent
        className="w-full sm:max-w-xl"
        onInteractOutside={(e) => {
          if (hasOpenChild) e.preventDefault()
        }}
        onPointerDownOutside={(e) => {
          if (hasOpenChild) e.preventDefault()
        }}
      >
        {isLoading ? (
          <WorkspaceDialogSkeleton />
        ) : (
          <StepperForm
            key={workspace?.id ?? 'new'}
            workspaceId={workspace?.id}
            onWorkspaceCreated={setWorkspaceId}
            onClose={resetDialog}
            onModalOpenChange={setHasOpenChild}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function WorkspaceDialogSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      {/* Header */}
      <div className="bg-muted h-6 w-40 animate-pulse rounded-md" />

      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="bg-muted h-8 w-8 animate-pulse rounded-full" />
            <div className="bg-muted h-3 w-14 animate-pulse rounded" />
          </div>
        ))}
      </div>

      {/* Workspace header bar */}
      <div className="bg-muted h-9 w-full animate-pulse rounded-lg" />

      {/* Avatar + fields */}
      <div className="flex items-center gap-4">
        <div className="bg-muted h-16 w-16 animate-pulse rounded-xl" />
        <div className="flex flex-col gap-2">
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
          <div className="bg-muted h-3 w-32 animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-3 w-28 animate-pulse rounded" />
        <div className="bg-muted h-10 w-full animate-pulse rounded-lg" />
      </div>
      <div className="space-y-2">
        <div className="bg-muted h-3 w-20 animate-pulse rounded" />
        <div className="bg-muted h-20 w-full animate-pulse rounded-lg" />
      </div>

      {/* Footer */}
      <div className="flex justify-between border-t pt-4">
        <div className="bg-muted h-9 w-24 animate-pulse rounded-lg" />
        <div className="bg-muted h-9 w-36 animate-pulse rounded-lg" />
      </div>
    </div>
  )
}
