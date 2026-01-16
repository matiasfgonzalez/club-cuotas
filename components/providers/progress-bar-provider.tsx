'use client'

import NextTopLoader from 'nextjs-toploader'
import { ReactNode } from 'react'

export function ProgressBarProvider({ children }: { children: ReactNode }) {
  return (
    <>
      <NextTopLoader
        color="#10b981"
        initialPosition={0.08}
        crawlSpeed={200}
        height={3}
        crawl={true}
        showSpinner={false}
        easing="ease"
        speed={200}
        shadow="0 0 10px #10b981, 0 0 5px #10b981"
        zIndex={9999}
      />
      {children}
    </>
  )
}
