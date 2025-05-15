"use client"
import AgentNavbar from "@/app/components/AgentNavbar";
import { useState } from "react"
import Chatbot from "@/components/Chatbot"

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <Chatbot userRole="agent" title="Assistant Agent" />
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900">
}
        </main>
        <Chatbot userRole="admin" title="Assistant AGENT" />
      </div>
  )
}





