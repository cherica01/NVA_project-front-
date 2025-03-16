"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bell, Trash2, RefreshCw, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination } from "@/app/components/pagination"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface Notification {
  id: number
  message: string
  date: string
  is_read: boolean
}

// Notifications fictives pour l'exemple
const fakeNotifications: Notification[] = [
  {
    id: 1,
    message: "Nouvel événement ajouté : Lancement de produit chez TechCorp",
    date: "2023-08-15T10:30:00Z",
    is_read: false,
  },
  {
    id: 2,
    message: "Rappel : Formation obligatoire sur la sécurité demain à 14h",
    date: "2023-08-14T15:45:00Z",
    is_read: true,
  },
  {
    id: 3,
    message: "Votre paiement pour l'événement 'Gala annuel' a été traité",
    date: "2023-08-13T09:00:00Z",
    is_read: false,
  },
  {
    id: 4,
    message: "Mise à jour de votre planning : Nouvel horaire pour l'événement du 20 août",
    date: "2023-08-12T11:20:00Z",
    is_read: false,
  },
  {
    id: 5,
    message: "Félicitations ! Vous avez reçu une prime pour votre excellent travail",
    date: "2023-08-11T16:00:00Z",
    is_read: true,
  },
  {
    id: 6,
    message: "Nouvelle politique de l'entreprise : Veuillez consulter le document joint",
    date: "2023-08-10T14:30:00Z",
    is_read: false,
  },
  {
    id: 7,
    message: "Invitation : Réunion d'équipe mensuelle ce vendredi à 10h",
    date: "2023-08-09T08:45:00Z",
    is_read: true,
  },
]

export default function AgentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "unread" | "read">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    setError(null)
    try {
      // Simuler un délai de chargement
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setNotifications(fakeNotifications)
      setSuccess("Notifications rafraîchies avec succès")
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      setError("Impossible de charger les notifications. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      // Simuler un délai de traitement
      await new Promise((resolve) => setTimeout(resolve, 500))
      setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, is_read: true } : notif)))
      setSuccess("Notification marquée comme lue")
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error)
      setError("Impossible de marquer la notification comme lue. Veuillez réessayer.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      // Simuler un délai de traitement
      await new Promise((resolve) => setTimeout(resolve, 500))
      setNotifications(notifications.filter((notif) => notif.id !== id))
      setSuccess("Notification supprimée avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error)
      setError("Impossible de supprimer la notification. Veuillez réessayer.")
    }
  }

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const filteredNotifications = notifications
    .filter(
      (notif) =>
        notif.message.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterType === "all" ||
          (filterType === "unread" && !notif.is_read) ||
          (filterType === "read" && notif.is_read)),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 min-h-screen">
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert>
          <AlertTitle>Succès</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Bell className="mr-2" /> Mes Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Select value={filterType} onValueChange={(value: "all" | "unread" | "read") => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrer par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  <SelectItem value="unread">Non lues</SelectItem>
                  <SelectItem value="read">Lues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchNotifications} variant="outline" size="icon" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-4">Chargement des notifications...</div>
          ) : paginatedNotifications.length === 0 ? (
            <div className="text-center py-4">Aucune notification trouvée.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-100 dark:bg-green-900">
                    {["Message", "Date", "Statut", "Actions"].map((header) => (
                      <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedNotifications.map((notification) => (
                    <TableRow key={notification.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                      <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                      <TableCell>{format(new Date(notification.date), "Pp", { locale: fr })}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            notification.is_read
                              ? "bg-green-300 text-green-900 dark:bg-green-700 dark:text-white"
                              : "bg-yellow-300 text-yellow-900 dark:bg-yellow-700 dark:text-white"
                          }
                        >
                          {notification.is_read ? "Lu" : "Non lu"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {!notification.is_read && (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                              size="sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete(notification.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalItems={filteredNotifications.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}

