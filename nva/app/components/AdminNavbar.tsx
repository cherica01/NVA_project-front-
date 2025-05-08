"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  Calendar,
  CreditCard,
  Home,
  MessageSquare,
  Users,
  Menu,
  X,
  Award,
  LayoutDashboard,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import Image from "next/image"
import { getAccessToken } from "@/util/biscuit"
import { apiUrl } from "@/util/config"
import { useRouter } from "next/navigation"


export default function AdminNavbar() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    role: "Administrateur",
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Récupérer les informations de l'utilisateur connecté
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        // Récupérer le token d'accès
        const accessToken = await getAccessToken()

        if (!accessToken) {
          console.error("Aucun token d'accès disponible")
          setLoading(false)
          return
        }

        // Toujours faire un appel à l'API pour obtenir les données les plus récentes
        const response = await fetch(`${apiUrl}/accounts/profile/`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          const userData = await response.json()

          // Mettre à jour l'état avec les données de l'API
          setUserData({
            name: userData.username || "Utilisateur",
            role: userData.is_superuser ? "Administrateur" : "Agent",
          })

          // Mettre à jour le localStorage avec les données les plus récentes
          localStorage.setItem("nva_user_data", JSON.stringify(userData))
        } else {
          // En cas d'erreur, essayer d'utiliser les données en cache
          const userDataStr = localStorage.getItem("nva_user_data")
          if (userDataStr) {
            try {
              const cachedUserData = JSON.parse(userDataStr)
              setUserData({
                name: cachedUserData.username || "Utilisateur",
                role: cachedUserData.is_superuser ? "Administrateur" : "Agent",
              })
              console.log("Utilisation des données en cache car l'API a échoué")
            } catch (e) {
              console.error("Erreur lors du parsing des données en cache:", e)
            }
          } else {
            console.error("Échec de la récupération des données utilisateur:", response.status)
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données utilisateur:", error)

        // En cas d'erreur, essayer d'utiliser les données en cache
        const userDataStr = localStorage.getItem("nva_user_data")
        if (userDataStr) {
          try {
            const cachedUserData = JSON.parse(userDataStr)
            setUserData({
              name: cachedUserData.username || "Utilisateur",
              role: cachedUserData.is_superuser ? "Administrateur" : "Agent",
            })
            console.log("Utilisation des données en cache car une erreur s'est produite")
          } catch (e) {
            console.error("Erreur lors du parsing des données en cache:", e)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()

    // Configurer un intervalle pour rafraîchir les données toutes les 5 minutes
    const intervalId = setInterval(fetchUserData, 5 * 60 * 1000)

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId)
  }, [])

 

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
        className={`fixed inset-0 z-40 transition-opacity bg-black bg-opacity-50 lg:hidden ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-r border-gray-200 dark:border-gray-800 flex flex-col`}
      >
        <div className="p-6 flex justify-center">
          <Image src="/images/nva-logo.png" alt="NVA Logo" width={150} height={60} className="object-contain" />
        </div>
        <ScrollArea className="flex-1 h-[calc(100vh-12rem)]">
          <nav className="space-y-2 p-4">
            {[
              { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
              { icon: Users, label: "Gestion RH", href: "/admin/agents" },
              { icon: Calendar, label: "Événements", href: "/admin/evenements" },
              { icon: CreditCard, label: "Paiements", href: "/admin/paie" },
              { icon: Home, label: "Présences", href: "/admin/presences" },
              { icon: MessageSquare, label: "Messages", href: "/admin/message" },
              { icon: Bell, label: "Notifications", href: "/admin/notification" },
              { icon: Award, label: "Évaluations", href: "/admin/evaluation" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all hover:bg-orange-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </ScrollArea>

        {/* Informations de l'agent connecté */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : userData.name ? (
                userData.name.charAt(0).toUpperCase()
              ) : (
                "A"
              )}
            </div>
            <div className="flex-1">
              {loading ? (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 animate-pulse">Chargement...</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userData.name || "Utilisateur"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userData.role}</p>
                </>
              )}
            </div>
            
          </div>
        </div>
      </div>
    </>
  )
}
