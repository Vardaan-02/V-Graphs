"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Bot, Home, LucideIcon, Zap } from "lucide-react"
import { useUser } from "./userprovider"
import { fetchSidebarStats } from "@/lib/sidebarStats"

type NavItem = {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  badge?: string
  items?: NavItem[]
}

type User = {
  name: string
  email: string
  avatar: string
}

type SidebarContextType = {
  user: User
  navMain: NavItem[]
  setNavMain: (items: NavItem[]) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [navMain, setNavMain] = useState<NavItem[]>([])
  const { currentUser } = useUser()

  const user: User = {
    name: currentUser?.name || "Guest",
    email: currentUser?.email || "guest@example.com",
    avatar: currentUser?.avatar || "/placeholder.svg",
  }

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await fetchSidebarStats()

        setNavMain([
          {
            title: "Dashboard",
            url: "#",
            icon: Home,
            isActive: true,
          },
          {
            title: "Workflows",
            url: "#",
            icon: Zap,
            items: [
              {
                title: "Active Workflows",
                url: "#",
                badge: stats.activeWorkflows.toString(),
              },
              {
                title: "Draft Workflows",
                url: "#",
                badge: stats.draftWorkflows.toString(),
              },
            ],
          },
          {
            title: "Executions",
            url: "#",
            icon: Bot,
            items: [
              {
                title: "Recent Runs",
                url: "#",
                badge: stats.recentRuns.toString(),
              },
              {
                title: "Failed Executions",
                url: "#",
                badge: stats.failedExecutions.toString(),
              }
            ],
          },
        ])
      } catch (err) {
        console.error("Sidebar stats fetch failed", err)
      }
    }

    loadStats()
  }, [])

  const value: SidebarContextType = {
    user,
    navMain,
    setNavMain,
  }

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
