"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, User, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"

interface Agent {
  id: number
  username: string
}

interface Notification {
  id: number
  message: string
  date: string
  recipient: string
}

export default function NotificationManagementPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [message, setMessage] = useState("")
  const [date, setDate] = useState("")
  const [recipientId, setRecipientId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
    fetchNotifications()
  }, [])

  const fetchAgents = async () => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/management/agents/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error("Erreur lors du chargement des agents")
      const data = await response.json()
      setAgents(data)
    } catch (error) {
      console.error("Erreur lors du chargement des agents:", error)
      setError("Impossible de charger la liste des agents")
    }
  }

  const fetchNotifications = async () => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/management/notifications/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) throw new Error("Erreur lors du chargement des notifications")
      const data = await response.json()
      setNotifications(data)
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      setError("Impossible de charger les notifications")
    }
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/management/send-notification/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message,
          date,
          recipient_id: Number(recipientId),
        }),
      })

      if (!response.ok) throw new Error("Erreur lors de l'envoi de la notification")

      setSuccess("Notification envoyée avec succès")
      setMessage("")
      setDate("")
      setRecipientId("")
      fetchNotifications()
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error)
      setError("Impossible d'envoyer la notification")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteNotification = async (id: number) => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/management/delete-notification/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) throw new Error("Erreur lors de la suppression de la notification")

      setSuccess("Notification supprimée avec succès")
      fetchNotifications()
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error)
      setError("Impossible de supprimer la notification")
    }
  }

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">Gestion des Notifications</CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          {error && <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
          {success && (
            <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded">{success}</div>
          )}
          <form onSubmit={handleSendNotification} className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="text-green-500" />
              <Textarea
                placeholder="Message de la notification"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border-green-300 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="text-green-500" />
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-green-300 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <User className="text-green-500" />
              <Select onValueChange={setRecipientId} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un destinataire" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {loading ? "Envoi en cours..." : "Envoyer la notification"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-green-600 text-white dark:bg-green-800">
          <CardTitle className="text-2xl font-bold">Liste des Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-100 dark:bg-green-900">
                  {["Message", "Date", "Destinataire", "Actions"].map((header) => (
                    <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                    <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                    <TableCell>{format(new Date(notification.date), "Pp", { locale: fr })}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-300 text-green-900 dark:bg-green-700 dark:text-white">
                        {notification.recipient}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="bg-red-500 hover:bg-red-600 text-white"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

