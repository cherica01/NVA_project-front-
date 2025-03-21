"use client"

import { Bell, Calendar, CreditCard, Home, MessageSquare,User , Menu, X } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AgentNavbarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function AgentNavbar({ sidebarOpen, setSidebarOpen }: AgentNavbarProps) {
  return (
    <>
      <button className="fixed top-4 left-4 z-50 lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? (
          <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        ) : (
          <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        )}
      </button>
      <div
        className={`fixed inset-0 z-40 transition-opacity bg-black bg-opacity-50 lg:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-r border-gray-200 dark:border-gray-800`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">
            NVA Dashboard
          </h1>
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <nav className="space-y-2 p-4">
            {[
        
              { icon: Calendar, label: "Agenda", href: "/agent/agenda" },
              { icon: CreditCard, label: "Wallet", href: "/agent/wallet" },
              { icon: Home, label: "Présences", href: "/agent/presence" },
              { icon: MessageSquare, label: "Messages", href: "/agent/messages" },
              { icon: Bell, label: "Notifications", href: "/agent/notifications" },
              { icon: User, label: "Profil", href: "/agent/profiles" } 
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:bg-green-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </>
  )
}

