'use client'

import { use, useMemo, useState } from 'react'

import type { DataTableRowAction, QueryKeys } from '@/@types/data-table'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableSortList } from '@/components/data-table/data-table-sort-list'
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar'
import { SyncTaskRxDBDTO } from '@/db/schemas/tasks-sync-schema'
import { useDataTable } from '@/hooks/use-data-table'

import type {
  getAllPriorities,
  getAllstatus,
  getEstimatedHoursRange,
  getTaskPriorityCounts,
  getTasks,
  getTaskStatusCounts,
} from '../lib/queries'
import { getTasksTableColumns } from './tasks-table-columns'

interface TasksTableProps {
  promises: Promise<
    [
      Awaited<ReturnType<typeof getTasks>>,
      Awaited<ReturnType<typeof getTaskStatusCounts>>,
      Awaited<ReturnType<typeof getTaskPriorityCounts>>,
      Awaited<ReturnType<typeof getEstimatedHoursRange>>,
      Awaited<ReturnType<typeof getAllstatus>>,
      Awaited<ReturnType<typeof getAllPriorities>>,
    ]
  >
  queryKeys?: Partial<QueryKeys>
}

export function TasksTable({ promises, queryKeys }: TasksTableProps) {
  // const { enableAdvancedFilter, filterFlag } = useFeatureFlags()

  const [
    { data, pageCount },
    statusCounts,
    priorityCounts,
    estimatedHoursRange,
    allstatus,
    allPriorities,
  ] = use(promises)

  const [rowAction, setRowAction] =
    useState<DataTableRowAction<SyncTaskRxDBDTO> | null>(null)

  const columns = useMemo(
    () =>
      getTasksTableColumns({
        statusCounts,
        priorityCounts,
        estimatedHoursRange,
        allstatus,
        allPriorities,
        setRowAction,
      }),
    [
      statusCounts,
      priorityCounts,
      estimatedHoursRange,
      allstatus,
      allPriorities,
    ],
  )

  const { table, shallow, debounceMs, throttleMs } = useDataTable({
    data,
    columns,
    pageCount,
    // enableAdvancedFilter,
    initialState: {
      sorting: [{ id: 'updatedAt', desc: true }],
      columnPinning: { right: ['actions'] },
    },
    queryKeys,
    getRowId: (originalRow) => originalRow._id,
    shallow: false,
    clearOnDefault: true,
  })

  return (
    <>
      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <DataTableSortList table={table} align="end" />
        </DataTableToolbar>
      </DataTable>

      {/* <UpdateTaskSheet
        open={rowAction?.variant === 'update'}
        onOpenChange={() => setRowAction(null)}
        task={rowAction?.row.original ?? null}
      /> */}
      {/* <DeleteTasksDialog
        open={rowAction?.variant === 'delete'}
        onOpenChange={() => setRowAction(null)}
        tasks={rowAction?.row.original ? [rowAction?.row.original] : []}
        showTrigger={false}
        onSuccess={() => rowAction?.row.toggleSelected(false)}
      /> */}
    </>
  )
}
