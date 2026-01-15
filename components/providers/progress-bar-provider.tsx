'use client'

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar'
import { ReactNode } from 'react'

export function ProgressBarProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ProgressBar
        height="4px"
        color="#10b981" // emerald-500
        options={{ showSpinner: false }}
        shallowRouting
      />
    </>
  )
}
