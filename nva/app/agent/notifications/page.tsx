"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  AlertCircle,
  Check,
  Calendar,
  Users,
  User,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion } from "framer-motion"

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([])

  const handleAuthError = useCallback(() => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/")
  }, [router])

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/notification/agent/`, {
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

      if (!Array.isArray(data)) {
        console.error("La réponse n'est pas un tableau:", data)
        if (data && typeof data === "object") {
          const possibleArrayProps = Object.keys(data).filter((key) => Array.isArray(data[key]))
          if (possibleArrayProps.length > 0) {
            setNotifications(data[possibleArrayProps[0]])
          } else {
            setNotifications([data])
          }
        } else {
          setNotifications([])
        }
      } else {
        setNotifications(data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      setError(`Impossible de charger vos notifications: ${error instanceof Error ? error.message : String(error)}`)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [handleAuthError])

  const fetchUnreadCount = useCallback(async () => {
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
  }, [])

  const updateDisplayedNotifications = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedNotifications(notifications.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(notifications.length / itemsPerPage))
  }, [currentPage, notifications])

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()
  }, [fetchNotifications, fetchUnreadCount])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    updateDisplayedNotifications()
  }, [currentPage, notifications, updateDisplayedNotifications])

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

      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification,
        ),
      )

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

      const unreadNotifications = notifications.filter((notification) => !notification.is_read)

      if (unreadNotifications.length === 0) {
        setSuccess("Toutes les notifications sont déjà lues")
        setLoading(false)
        return
      }

      await Promise.all(
        unreadNotifications.map((notification) =>
          fetch(`${apiUrl}/notification/${notification.id}/mark-as-read/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }),
        ),
      )

      setNotifications(notifications.map((notification) => ({ ...notification, is_read: true })))

      setUnreadCount(0)

      setSuccess("Toutes les notifications ont été marquées comme lues")
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error)
      setError(error instanceof Error ? error.message : "Une erreur est survenue")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "Pp", { locale: fr })
    } catch {
      return "Date invalide"
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-gray-200">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="backdrop-blur-lg bg-white/90 border-none shadow-lg animated-border">
          <CardHeader className="bg-green-800 text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-3xl font-bold flex items-center">
                <motion.div
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ duration: 0.5, type: "spring" }}
                >
                  <Bell className="mr-3 h-7 w-7" />
                </motion.div>
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  Mes Notifications
                </motion.span>
                {unreadCount > 0 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 15,
                    }}
                  >
                    <Badge className="ml-3 bg-red-500 text-white border-none px-2.5 py-0.5 animate-pulse-glow">
                      {unreadCount}
                    </Badge>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="ml-3"
                >
                  <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                </motion.div>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchNotifications}
                className="text-white/80 hover:text-white hover:bg-white/10"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
            <CardDescription className="text-gray-200">Consultez et gérez vos notifications</CardDescription>
          </CardHeader>
          <CardContent className="mt-6 p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
                  <Check className="h-4 w-4 mr-2" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className="flex justify-between items-center mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-green-700 bg-green-100/70 px-3 py-1.5 rounded-full border border-green-300"
              >
                {unreadCount} notification{unreadCount !== 1 ? "s" : ""} non lue{unreadCount !== 1 ? "s" : ""}
              </motion.div>
              {unreadCount > 0 && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={markAllAsRead}
                    className="bg-green-100/70 text-green-700 border-green-300 hover:bg-green-200 hover:border-green-400"
                    disabled={loading}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Tout marquer comme lu
                  </Button>
                </motion.div>
              )}
            </div>

            {loading && displayedNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-green-700">Chargement de vos notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                  }}
                >
                  <Bell className="h-16 w-16 text-green-500/30 mx-auto mb-4" />
                </motion.div>
                <p className="text-green-700">Vous n avez aucune notification pour le moment.</p>
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
                      {displayedNotifications.map((notification) => (
                        <motion.tr
                          key={notification.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`hover:bg-green-50 dark:hover:bg-green-800/50 border-b border-green-200 ${
                            !notification.is_read ? "bg-green-50/70" : ""
                          }`}
                        >
                          <TableCell className="font-medium text-green-800">
                            {!notification.is_read && (
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                            )}
                            {notification.title}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-gray-700">{notification.message}</TableCell>
                          <TableCell>
                            {notification.is_global ? (
                              <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                                <Users className="h-3 w-3 mr-1" /> Globale
                              </Badge>
                            ) : (
                              <Badge className="bg-purple-100 text-purple-800 border border-purple-300">
                                <User className="h-3 w-3 mr-1" /> Personnelle
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-gray-700">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-green-600" />
                              {formatDate(notification.date || notification.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {notification.is_read ? (
                              <Badge className="bg-green-100 text-green-800 border border-green-300">
                                <Check className="h-3 w-3 mr-1" /> Lue
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-300">Non lue</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {!notification.is_read && (
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                              >
                                <Button
                                  onClick={() => markAsRead(notification.id)}
                                  variant="outline"
                                  size="sm"
                                  className="bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:border-green-400"
                                  disabled={markingAsRead === notification.id}
                                >
                                  {markingAsRead === notification.id ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-green-600 border-t-transparent rounded-full" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </motion.div>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex items-center justify-center space-x-4 mt-8"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="bg-white border-green-300 hover:border-green-500 text-green-700 disabled:text-gray-400 disabled:border-gray-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="ml-1">Précédent</span>
                    </Button>

                    <span className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-md border border-green-200 animated-border">
                      Page {currentPage} sur {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="bg-white border-green-300 hover:border-green-500 text-green-700 disabled:text-gray-400 disabled:border-gray-300"
                    >
                      <span className="mr-1">Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}