import {
  ActivitiesLayout,
  AppLayout,
  HomeLayout,
  WorkspaceLayout,
} from '@metric-org/ui/layouts'
import {
  Activities,
  AddonsPage,
  Backlog,
  Error,
  Metrics,
  Notes,
  NotFound,
  TimeEntries,
  TimerWidget,
  WorkspaceSettings,
} from '@metric-org/ui/pages'
import { createHashRouter, Navigate } from 'react-router-dom'

export const router = createHashRouter([
  {
    path: '/',
    element: <AppLayout />, // layout global
    errorElement: <Error />,
    children: [
      {
        path: '/',
        element: <HomeLayout />, // sidebar + conteúdo do Home
        children: [
          { index: true, element: <div>Home</div> },
          { path: 'about', element: <div>About</div> },
          { path: 'contact', element: <div>Contact</div> },
        ],
      },
      {
        path: 'workspaces/:workspaceId',
        element: <WorkspaceLayout />, // sidebar + conteúdo do workspace
        children: [
          { index: true, element: <Navigate to="time-entries" replace /> },
          { path: 'notes', element: <Notes /> },
          { path: 'time-entries', element: <TimeEntries /> },
          { path: 'my-metrics', element: <Metrics /> },
          {
            path: 'activities',
            element: <ActivitiesLayout />,
            children: [
              { index: true, element: <Activities /> },
              { path: 'backlog', element: <Backlog /> },
            ],
          },
          { path: 'settings', element: <WorkspaceSettings /> },
          { path: 'addons', element: <AddonsPage /> },
          {
            path: 'widgets',
            children: [{ path: 'timer', element: <TimerWidget /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFound /> },
])
