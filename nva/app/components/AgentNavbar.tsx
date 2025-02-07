"use client"

import Link from "next/link"
import { LogOut, X, Menu, Calendar, MessageSquare, Bell, User, Wallet } from "lucide-react"
import { useState, useEffect, type ReactNode } from "react"

interface NavItemProps {
  href: string
  icon: ReactNode
  children: ReactNode
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children }) => (
  <li>
    <Link
      href={href}
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
    >
      <span className="text-white">{icon}</span>
      <span>{children}</span>
    </Link>
  </li>
)

const AgentNavbar = () => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("agentNavbarOpen") !== "false"
    }
    return true
  })

  useEffect(() => {
    localStorage.setItem("agentNavbarOpen", isOpen.toString())
  }, [isOpen])

  return (
    <>
      {/* Floating button to reopen */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-2 top-2 p-2 bg-green-600 rounded-full shadow-lg z-50"
        >
          <Menu className="w-6 h-6 text-white" />
        </button>
      )}

      <nav
        className={`bg-green-600 text-white h-screen w-64 fixed left-0 top-0 shadow-lg transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -right-8 top-4 p-2 hover:bg-green-700 rounded-full"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <h1 className="text-2xl font-bold text-white mb-8">Agent Panel</h1>
          <ul className="space-y-4">
            <NavItem href="/agent/agenda" icon={<Calendar className="w-5 h-5" />}>
              Agenda
            </NavItem>
            <NavItem href="/agent/messages" icon={<MessageSquare className="w-5 h-5" />}>
              Message
            </NavItem>
            <NavItem href="/agent/notifications" icon={<Bell className="w-5 h-5" />}>
              Notification
            </NavItem>
            <NavItem href="/agent/profile" icon={<User className="w-5 h-5" />}>
              Profil
            </NavItem>
            <NavItem href="/agent/wallet" icon={<Wallet className="w-5 h-5" />}>
              Wallet
            </NavItem>
          </ul>
        </div>
        <div className="absolute bottom-4 left-4">
          <NavItem href="/logout" icon={<LogOut className="w-5 h-5" />}>
            Se déconnecter
          </NavItem>
        </div>
      </nav>
    </>
  )
}

export default AgentNavbar

