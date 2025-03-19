"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertCircle, Check, Calendar, Users, User, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Pagination } from "@/app/components/pagination"

interface Notification {
  id: number
  title: string
  message: string
  is_global: boolean
  is_read: boolean
  date: string
  created_at: string
}

export default function AgentNotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [currentPage])

  // Effet pour effacer les messages de succès après 5 secondes
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/notification/agent/?page=${currentPage}&limit=${itemsPerPage}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors du chargement des notifications: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Gestion de la pagination si l'API la supporte
      if (data.results && Array.isArray(data.results)) {
        setNotifications(data.results)
        setTotalPages(Math.ceil(data.count / itemsPerPage))
      } else if (Array.isArray(data)) {
        // Si l'API ne supporte pas la pagination
        setNotifications(data)
        setTotalPages(Math.ceil(data.length / itemsPerPage))
      } else {
        setNotifications([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      setError(`Impossible de charger vos notifications: ${error instanceof Error ? error.message : String(error)}`)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        return
      }

      const response = await fetch(`${apiUrl}/notification/unread-count/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        return
      }

      const data = await response.json()
      setUnreadCount(data.count || 0)
    } catch (error) {
      console.error("Erreur lors du chargement du nombre de notifications non lues:", error)
    }
  }

  const markAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId)
    setError(null)
    setSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/notification/${notificationId}/mark-as-read/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du marquage de la notification comme lue")
      }

      // Mettre à jour l'état local
      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification,
        ),
      )

      // Mettre à jour le compteur de notifications non lues
      setUnreadCount(Math.max(0, unreadCount - 1))

      setSuccess("Notification marquée comme lue")
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setMarkingAsRead(null)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      // Marquer toutes les notifications non lues comme lues
      const unreadNotifications = notifications.filter((notification) => !notification.is_read)

      if (unreadNotifications.length === 0) {
        setSuccess("Toutes les notifications sont déjà lues")
        setLoading(false)
        return
      }

      // Utiliser Promise.all pour envoyer toutes les requêtes en parallèle
      await Promise.all(
        unreadNotifications.map((notification) =>
          fetch(`${apiUrl}/api/notification/${notification.id}/mark-as-read/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ),
      )

      // Mettre à jour l'état local
      setNotifications(notifications.map((notification) => ({ ...notification, is_read: true })))

      // Mettre à jour le compteur de notifications non lues
      setUnreadCount(0)

      setSuccess("Toutes les notifications ont été marquées comme lues")
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const handleAuthError = () => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/login")
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "Pp", { locale: fr })
    } catch (error) {
      return "Date invalide"
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold flex items-center">
              <Bell className="mr-2" /> Mes Notifications
              {unreadCount > 0 && <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNotifications}
              className="text-white border-white hover:bg-green-700"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </Button>
          </div>
          <CardDescription className="text-gray-200">Consultez et gérez vos notifications</CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-500">
              {unreadCount} notification{unreadCount !== 1 ? "s" : ""} non lue{unreadCount !== 1 ? "s" : ""}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="text-green-600 border-green-600 hover:bg-green-50"
                disabled={loading}
              >
                <Check className="h-4 w-4 mr-1" />
                Tout marquer comme lu
              </Button>
            )}
          </div>

          {loading && notifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement de vos notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">Vous n'avez aucune notification pour le moment.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-100 dark:bg-green-900">
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Titre</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Message</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Type</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Date</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Statut</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className={`hover:bg-green-50 dark:hover:bg-green-800/50 ${
                          !notification.is_read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                        }`}
                      >
                        <TableCell className="font-medium">
                          {!notification.is_read && (
                            <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-2"></span>
                          )}
                          {notification.title}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                        <TableCell>
                          {notification.is_global ? (
                            <Badge className="bg-blue-300 text-blue-900 dark:bg-blue-700 dark:text-white">
                              <Users className="h-3 w-3 mr-1" /> Globale
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-300 text-purple-900 dark:bg-purple-700 dark:text-white">
                              <User className="h-3 w-3 mr-1" /> Personnelle
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                            {formatDate(notification.date || notification.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {notification.is_read ? (
                            <Badge className="bg-green-300 text-green-900 dark:bg-green-700 dark:text-white">Lue</Badge>
                          ) : (
                            <Badge className="bg-amber-300 text-amber-900 dark:bg-amber-700 dark:text-white">
                              Non lue
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!notification.is_read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              disabled={markingAsRead === notification.id}
                            >
                              {markingAsRead === notification.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

