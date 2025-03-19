"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Bell, AlertCircle, Trash2, Send, Users, User, Calendar, Info, Check } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Agent {
  id: number
  username: string
}

interface Notification {
  id: number
  title: string
  message: string
  recipients?: number[]
  recipient?: number | null
  is_global: boolean
  is_read: boolean
  date: string
  created_at: string
  recipient_username?: string
}

export default function NotificationManagementPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [isGlobal, setIsGlobal] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [deleteNotificationId, setDeleteNotificationId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Charger les agents d'abord, puis les notifications
  useEffect(() => {
    async function loadData() {
      await fetchAgents()
      await fetchNotifications()
    }
    loadData()
  }, [])

  // Effet pour effacer les messages de succès après 5 secondes
  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => {
        setFormSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [formSuccess])

  const fetchAgents = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/accounts/agents/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement des agents")
      }

      const data = await response.json()

      if (debugMode) {
        console.log("Agents récupérés:", data)
        setDebugInfo((prev: any) => ({ ...prev, agents: data }))
      }

      // Vérifier le format des données et les transformer si nécessaire
      const formattedAgents = Array.isArray(data)
        ? data.map((agent) => ({
            id: agent.id,
            username: agent.username || agent.email || `Agent ${agent.id}`,
          }))
        : []

      setAgents(formattedAgents)
    } catch (error) {
      console.error("Erreur lors du chargement des agents:", error)
      setFormError("Impossible de charger la liste des agents")
    }
  }

  const fetchNotifications = async () => {
    setFetchingData(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/notification/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors du chargement des notifications: ${response.status} ${response.statusText}`)
      }

      let data = await response.json()

      if (debugMode) {
        console.log("Notifications brutes:", data)
        setDebugInfo((prev: any) => ({ ...prev, notifications: data }))
      }

      // Vérifier si data est un tableau
      if (!Array.isArray(data)) {
        console.error("La réponse n'est pas un tableau:", data)
        // Si c'est un objet avec une propriété contenant les données
        if (data && typeof data === "object") {
          // Chercher une propriété qui pourrait contenir les notifications
          const possibleArrayProps = Object.keys(data).filter((key) => Array.isArray(data[key]))
          if (possibleArrayProps.length > 0) {
            data = data[possibleArrayProps[0]]
          } else {
            // Si aucun tableau n'est trouvé, convertir en tableau si c'est un objet
            data = [data]
          }
        } else {
          data = []
        }
      }

      if (debugMode) {
        console.log(
          "IDs des agents chargés:",
          agents.map((a) => a.id),
        )
        console.log(
          "IDs des destinataires dans les notifications:",
          data.map((n: Notification) => n.recipient),
        )
      }

      // Enrichir les données avec les noms d'utilisateurs
      const enrichedData = data.map((notification: any) => {
        // S'assurer que tous les champs nécessaires sont présents
        const enriched = {
          id: notification.id,
          title: notification.title || "Sans titre", // Fallback si le titre est absent
          message: notification.message || "",
          is_global: notification.is_global || false,
          is_read: notification.is_read || false,
          date: notification.date || notification.created_at,
          created_at: notification.created_at || new Date().toISOString(),
          recipient: notification.recipient_id || notification.recipient || null,
          recipients: notification.recipients || [],
        }

        // Ajouter le nom d'utilisateur du destinataire si applicable
        if (enriched.recipient && !enriched.is_global) {
          // Convertir en nombre pour s'assurer que la comparaison fonctionne
          const recipientId = Number(enriched.recipient)
          const agent = agents.find((a) => a.id === recipientId)

          if (debugMode) {
            console.log(`Recherche agent ID ${recipientId}:`, agent ? "trouvé" : "non trouvé")
          }

          return {
            ...enriched,
            recipient_username: agent ? agent.username : `Agent ID ${recipientId}`,
          }
        }

        return enriched
      })

      setNotifications(enrichedData)
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
      setFormError(`Impossible de charger les notifications: ${error instanceof Error ? error.message : String(error)}`)
      setNotifications([]) // Initialiser avec un tableau vide en cas d'erreur
    } finally {
      setFetchingData(false)
    }
  }

  const handleSendNotification = async () => {
    // Validation des champs
    if (!title.trim()) {
      setFormError("Le titre est requis")
      return
    }

    if (!message.trim()) {
      setFormError("Le message est requis")
      return
    }

    // Validation des destinataires
    if (!isGlobal && selectedAgents.length === 0) {
      setFormError("Veuillez sélectionner au moins un agent ou cocher 'Envoyer à tous les agents'")
      return
    }

    setLoading(true)
    setFormError(null)
    setFormSuccess(null)
    setDebugInfo(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      // Préparer les données pour l'API avec les champs obligatoires
      const notificationData = {
        title: title.trim(),
        message: message.trim(),
        date: new Date().toISOString().split("T")[0],
        is_global: isGlobal,
      }

      // Si ce n'est pas une notification globale, ajouter les destinataires
      if (!isGlobal) {
        // Si un seul agent est sélectionné, utiliser recipient_id
        if (selectedAgents.length === 1) {
          Object.assign(notificationData, { recipient_id: selectedAgents[0] })
        }
        // Si plusieurs agents sont sélectionnés, utiliser recipients
        else if (selectedAgents.length > 1) {
          Object.assign(notificationData, { recipients: selectedAgents })
        }
      }

      if (debugMode) {
        console.log("Données de notification envoyées:", notificationData)
        setDebugInfo((prev: any) => ({ ...prev, sentData: notificationData }))
      }

      const response = await fetch(`${apiUrl}/notification/send/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(notificationData),
      })

      // Récupérer le texte brut de la réponse pour le débogage
      const responseText = await response.text()

      if (debugMode) {
        console.log("Réponse brute:", responseText)
        try {
          const responseJson = JSON.parse(responseText)
            setDebugInfo((prev: any) => ({ ...prev, response: responseJson }))
        } catch (e) {
            setDebugInfo((prev: any) => ({ ...prev, responseText }))
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }

        // Essayer de parser le JSON si possible
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")
        } catch (e) {
          // Si on ne peut pas parser le JSON, utiliser le texte brut
          errorMessage = responseText || errorMessage
        }

        throw new Error(errorMessage)
      }

      // Message de succès
      let successMessage = ""
      if (isGlobal) {
        successMessage = "Notification globale envoyée avec succès à tous les agents"
      } else if (selectedAgents.length === 1) {
        const agentName = agents.find((a) => a.id === selectedAgents[0])?.username || "l'agent"
        successMessage = `Notification envoyée avec succès à ${agentName}`
      } else {
        successMessage = `Notification envoyée avec succès à ${selectedAgents.length} agents`
      }

      setFormSuccess(successMessage)

      // Réinitialiser le formulaire
      setTitle("")
      setMessage("")
      setIsGlobal(false)
      setSelectedAgents([])

      // Rafraîchir la liste des notifications
      await fetchNotifications()
    } catch (error) {
      console.error("Erreur lors de l'envoi de la notification:", error)
      setFormError(
        error instanceof Error ? error.message : "Une erreur est survenue lors de l'envoi de la notification",
      )
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteNotification = (id: number) => {
    setDeleteNotificationId(id)
    setShowDeleteDialog(true)
  }

  const handleDeleteNotification = async () => {
    if (!deleteNotificationId) return

    setLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/api/notification/delete/${deleteNotificationId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }

        // Récupérer le texte de l'erreur
        let errorMessage = `Erreur ${response.status}: ${response.statusText}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch (e) {
          // Si on ne peut pas parser le JSON, utiliser le texte brut
          const errorText = await response.text()
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      // Mettre à jour la liste des notifications
      setNotifications(notifications.filter((n) => n.id !== deleteNotificationId))
      setFormSuccess("Notification supprimée avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression de la notification:", error)
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression")
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
      setDeleteNotificationId(null)
    }
  }

  const handleAuthError = () => {
    setFormError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/login")
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "Pp", { locale: fr })
    } catch (error) {
      return "Date invalide"
    }
  }

  const toggleDebugMode = () => {
    setDebugMode(!debugMode)
    if (!debugMode) {
      setDebugInfo({
        message: "Mode débogage activé. Les informations de débogage seront affichées ici.",
      })
    } else {
      setDebugInfo(null)
    }
  }

  // Fonction pour gérer la sélection/désélection de tous les agents
  const toggleSelectAllAgents = () => {
    if (selectedAgents.length === agents.length) {
      // Si tous les agents sont déjà sélectionnés, désélectionner tous
      setSelectedAgents([])
    } else {
      // Sinon, sélectionner tous les agents
      setSelectedAgents(agents.map((agent) => agent.id))
    }
  }

  // Fonction pour gérer la sélection/désélection d'un agent
  const toggleAgentSelection = (agentId: number) => {
    if (selectedAgents.includes(agentId)) {
      // Si l'agent est déjà sélectionné, le désélectionner
      setSelectedAgents(selectedAgents.filter((id) => id !== agentId))
    } else {
      // Sinon, l'ajouter à la sélection
      setSelectedAgents([...selectedAgents, agentId])
    }
  }

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <div className="flex justify-between items-center">
            <CardTitle className="text-3xl font-bold flex items-center">
              <Bell className="mr-2" /> Gestion des Notifications
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleDebugMode} className="text-white hover:text-green-200">
              <Info className="h-4 w-4 mr-1" />
              {debugMode ? "Désactiver débogage" : "Activer débogage"}
            </Button>
          </div>
          <CardDescription className="text-gray-200">
            Envoyez des notifications aux agents ou à tous les utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {formSuccess && (
            <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
              <AlertDescription>{formSuccess}</AlertDescription>
            </Alert>
          )}

          {debugMode && debugInfo && (
            <Alert className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
              <AlertDescription>
                <details open>
                  <summary className="font-medium cursor-pointer">Informations de débogage</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-40 bg-blue-50 p-2 rounded">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-6">
            {/* Section des destinataires */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="text-green-500" />
                <h3 className="text-lg font-medium">Destinataires</h3>
              </div>

              {/* Option "Envoyer à tous les agents" */}
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-md">
                <Checkbox
                  id="send-to-all"
                  checked={isGlobal}
                  onCheckedChange={(checked) => {
                    setIsGlobal(checked === true)
                    if (checked) {
                      setSelectedAgents([])
                    }
                  }}
                />
                <label htmlFor="send-to-all" className="text-sm font-medium cursor-pointer flex items-center">
                  <Users className="h-4 w-4 mr-1 text-green-600" />
                  Envoyer à tous les agents (notification globale)
                </label>
              </div>

              {/* Liste des agents avec multi-sélection */}
              {!isGlobal && (
                <div className="border rounded-md p-2 max-h-60 overflow-y-auto bg-white">
                  <div className="flex justify-between items-center p-2 border-b sticky top-0 bg-white z-10">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="select-all-agents"
                        checked={selectedAgents.length > 0 && selectedAgents.length === agents.length}
                        onCheckedChange={toggleSelectAllAgents}
                      />
                      <label htmlFor="select-all-agents" className="text-sm font-medium cursor-pointer">
                        Sélectionner tous les agents
                      </label>
                    </div>
                    <Badge className="bg-green-100 text-green-800">{selectedAgents.length} sélectionné(s)</Badge>
                  </div>

                  {agents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Aucun agent disponible</div>
                  ) : (
                    <div className="space-y-1 mt-2">
                      {agents.map((agent) => (
                        <div key={agent.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
                          <Checkbox
                            id={`agent-${agent.id}`}
                            checked={selectedAgents.includes(agent.id)}
                            onCheckedChange={() => toggleAgentSelection(agent.id)}
                          />
                          <label htmlFor={`agent-${agent.id}`} className="text-sm cursor-pointer flex-1">
                            {agent.username}
                          </label>
                          {selectedAgents.includes(agent.id) && <Check className="h-4 w-4 text-green-600" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Calendar className="text-green-500" />
                <div className="text-sm text-gray-500">Date d'envoi: {format(new Date(), "Pp", { locale: fr })}</div>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Titre de la notification"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-green-300 focus:ring-green-500"
              />
            </div>

            <div className="space-y-4">
              <Textarea
                placeholder="Message de la notification"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="border-green-300 focus:ring-green-500 min-h-[100px]"
              />
            </div>
          </div>

          <Button
            onClick={handleSendNotification}
            disabled={loading}
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? (
              "Envoi en cours..."
            ) : (
              <div className="flex items-center justify-center">
                <Send className="mr-2 h-4 w-4" />
                {isGlobal
                  ? "Envoyer à tous les agents"
                  : selectedAgents.length > 0
                    ? `Envoyer à ${selectedAgents.length} agent(s)`
                    : "Envoyer la notification"}
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-green-600 text-white dark:bg-green-800">
          <CardTitle className="text-2xl font-bold">Historique des Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucune notification trouvée. Envoyez votre première notification !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-100 dark:bg-green-900">
                    {["Titre", "Message", "Destinataire", "Statut", "Date", "Actions"].map((header) => (
                      <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                      <TableCell className="font-medium">{notification.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                      <TableCell>
                        {notification.is_global ? (
                          <Badge className="bg-blue-300 text-blue-900 dark:bg-blue-700 dark:text-white">
                            <Users className="h-3 w-3 mr-1" /> Tous les agents
                          </Badge>
                        ) : notification.recipients && notification.recipients.length > 1 ? (
                          <Badge className="bg-purple-300 text-purple-900 dark:bg-purple-700 dark:text-white">
                            <Users className="h-3 w-3 mr-1" /> {notification.recipients.length} agents
                          </Badge>
                        ) : (
                          <Badge className="bg-purple-300 text-purple-900 dark:bg-purple-700 dark:text-white">
                            <User className="h-3 w-3 mr-1" /> {notification.recipient_username || "Agent"}
                          </Badge>
                        )}
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
                      <TableCell>{formatDate(notification.date || notification.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          onClick={() => confirmDeleteNotification(notification.id)}
                          variant="destructive"
                          size="sm"
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette notification ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La notification sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotification} className="bg-red-500 hover:bg-red-600 text-white">
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

