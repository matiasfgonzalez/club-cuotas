'use client'

import {
  SidebarProvider,
  useSidebar,
} from '@/components/providers/sidebar-provider'
import { cn } from '@/lib/utils'

function MainContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <main
      className={cn(
        'flex-1 min-h-[calc(100vh-4rem)] bg-zinc-950 p-4 md:p-6 lg:p-8 transition-all duration-300 min-w-0 overflow-x-hidden',
        isCollapsed ? 'md:ml-[70px]' : 'md:ml-64',
      )}
    >
      {children}
    </main>
  )
}

export function DashboardClientWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <SidebarProvider>{children}</SidebarProvider>
}

export function DashboardMainContent({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainContent>{children}</MainContent>
}
