import React from 'react'
import { createRoot } from 'react-dom/client'

import { AppDesktop } from '@/renderer/App'

// if (import.meta.env.MODE === 'development') {
//   // @ts-ignore
//   import('@welldone-software/why-did-you-render').then(
//     ({ default: whyDidYouRender }) => {
//       whyDidYouRender(React, { trackAllPureComponents: true })
//     },
//   )
// }

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppDesktop />
  </React.StrictMode>,
)
