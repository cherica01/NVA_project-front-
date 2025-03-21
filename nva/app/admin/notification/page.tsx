"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Bell,
  AlertCircle,
  Send,
  Users,
  User,
  Calendar,
  Info,
  Check,
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
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { motion } from "framer-motion"

interface Agent {
  id: number
  username: string
}

interface Notification {
  id: number
  title: string
  message: string
  recipient: string | null
  is_global: boolean
  is_read: boolean
  date: string
  created_at: string
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
  const [debugMode, setDebugMode] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [popoverOpen, setPopoverOpen] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage =  5
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[]>([])

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

  // Effet pour mettre à jour les notifications affichées lors du changement de page
  useEffect(() => {
    updateDisplayedNotifications()
  }, [currentPage, notifications])

  const updateDisplayedNotifications = () => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    setDisplayedNotifications(notifications.slice(startIndex, endIndex))
    setTotalPages(Math.ceil(notifications.length / itemsPerPage))
  }

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

      setNotifications(data)
      // Réinitialiser à la première page lors du chargement de nouvelles données
      setCurrentPage(1)
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
        date: new Date().toISOString().split("T")[0], // Format YYYY-MM-DD pour le backend Django
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

  const handleAuthError = () => {
    setFormError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/")
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

  // Fonction pour gérer le changement de page
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
                  Gestion des Notifications
                </motion.span>
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
                onClick={toggleDebugMode}
                className="text-white/80 hover:text-white hover:bg-white/10"
              >
                <Info className="h-4 w-4 mr-1" />
                {debugMode ? "Désactiver débogage" : "Activer débogage"}
              </Button>
            </div>
            <CardDescription className="text-gray-200">
              Envoyez des notifications aux agents ou à tous les utilisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-6 p-6">
            {formError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {formSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
                  <Check className="h-4 w-4 mr-2" />
                  <AlertDescription>{formSuccess}</AlertDescription>
                </Alert>
              </motion.div>
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
                  <h3 className="text-lg font-medium text-green-800">Destinataires</h3>
                </div>

                {/* Liste des agents avec multi-sélection dans un popover */}
                {!isGlobal && (
                  <div className="flex items-center space-x-2">
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full">
                          <Button
                            variant="outline"
                            className="flex items-center justify-between w-full bg-white border-green-300 hover:border-green-500 text-green-800 hover:bg-green-50 glow-button"
                          >
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-green-600" />
                              <span>
                                {selectedAgents.length === 0
                                  ? "Sélectionner des agents"
                                  : `${selectedAgents.length} agent(s) sélectionné(s)`}
                              </span>
                            </div>
                          </Button>
                        </motion.div>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0 bg-white border border-green-200 shadow-lg shadow-green-100/20">
                        <div className="border-none rounded-md max-h-60 overflow-y-auto">
                          <div className="flex justify-between items-center p-2 border-b border-green-100 sticky top-0 bg-white z-10">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="select-all-agents-popup"
                                checked={selectedAgents.length > 0 && selectedAgents.length === agents.length}
                                onCheckedChange={toggleSelectAllAgents}
                                className="border-green-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                              />
                              <label
                                htmlFor="select-all-agents-popup"
                                className="text-sm font-medium cursor-pointer text-green-800"
                              >
                                Sélectionner tous les agents
                              </label>
                            </div>
                            <Badge className="bg-green-100 text-green-800 border border-green-300">
                              {selectedAgents.length}
                            </Badge>
                          </div>

                          {agents.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">Aucun agent disponible</div>
                          ) : (
                            <div className="space-y-1">
                              {agents.map((agent) => (
                                <motion.div
                                  key={agent.id}
                                  whileHover={{ backgroundColor: "rgba(240, 253, 244, 1)" }}
                                  className="flex items-center space-x-2 p-2 hover:bg-green-50 rounded-md transition-colors"
                                >
                                  <Checkbox
                                    id={`agent-popup-${agent.id}`}
                                    checked={selectedAgents.includes(agent.id)}
                                    onCheckedChange={() => toggleAgentSelection(agent.id)}
                                    className="border-green-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                  />
                                  <label
                                    htmlFor={`agent-popup-${agent.id}`}
                                    className="text-sm cursor-pointer flex-1 text-green-800"
                                  >
                                    {agent.username}
                                  </label>
                                  {selectedAgents.includes(agent.id) && <Check className="h-4 w-4 text-green-600" />}
                                </motion.div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-2 border-t border-green-100">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full bg-white text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => setPopoverOpen(false)}
                          >
                            Fermer
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Affichage des agents sélectionnés */}
                {!isGlobal && selectedAgents.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedAgents.map((agentId) => {
                      const agent = agents.find((a) => a.id === agentId)
                      return (
                        <motion.div
                          key={agentId}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge className="bg-green-100 text-green-800 border border-green-300 flex items-center gap-1 px-2 py-1">
                            <User className="h-3 w-3" />
                            <span>{agent?.username || `Agent ${agentId}`}</span>
                            <button
                              className="ml-1 text-green-600 hover:text-green-800 transition-colors"
                              onClick={() => toggleAgentSelection(agentId)}
                            >
                              ×
                            </button>
                          </Badge>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="text-green-500" />
                  <div className="text-sm text-gray-600">Date d'envoi: {format(new Date(), "Pp", { locale: fr })}</div>
                </div>
              </div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="space-y-4">
                <Input
                  placeholder="Titre de la notification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-green-300 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-colors"
                />
              </motion.div>

              <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }} className="space-y-4">
                <Textarea
                  placeholder="Message de la notification"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-green-300 focus:ring-green-500 focus:border-green-500 hover:border-green-400 transition-colors min-h-[100px]"
                />
              </motion.div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full mt-6">
              <Button
                onClick={handleSendNotification}
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-none shadow-lg shadow-green-700/20"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Envoi en cours...
                  </div>
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
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="backdrop-blur-lg bg-white/90 border-none shadow-lg animated-border">
          <CardHeader className="bg-green-600 text-white">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-white flex items-center">
                <motion.div
                  animate={{
                    rotate: [0, 10, 0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: "loop",
                    ease: "easeInOut",
                    times: [0, 0.2, 0.5, 0.8, 1],
                  }}
                >
                  <Bell className="mr-2 h-6 w-6" />
                </motion.div>
                Historique des Notifications
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchNotifications}
                className="text-white/80 hover:text-white hover:bg-white/10"
                disabled={fetchingData}
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${fetchingData ? "animate-spin" : ""}`} />
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetchingData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-500 border-t-transparent mx-auto"></div>
                <p className="mt-4 text-green-700">Chargement des notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-green-500/30 mx-auto mb-4" />
                <p className="text-green-700">Aucune notification trouvée. Envoyez votre première notification !</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-100 dark:bg-green-900">
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Titre</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Message</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Destinataire</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Statut</TableHead>
                      <TableHead className="text-green-700 dark:text-green-300 font-semibold">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedNotifications.map((notification) => (
                      <motion.tr
                        key={notification.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="hover:bg-green-50 dark:hover:bg-green-800/50 border-b border-green-200"
                      >
                        <TableCell className="font-medium text-green-800">{notification.title}</TableCell>
                        <TableCell className="max-w-xs truncate text-gray-700">{notification.message}</TableCell>
                        <TableCell>
                          {notification.is_global ? (
                            <Badge className="bg-blue-100 text-blue-800 border border-blue-300">
                              <Users className="h-3 w-3 mr-1" /> Tous les agents
                            </Badge>
                          ) : (
                            <Badge className="bg-purple-100 text-purple-800 border border-purple-300">
                              <User className="h-3 w-3 mr-1" /> {notification.recipient || "Agent inconnu"}
                            </Badge>
                          )}
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
                        <TableCell className="text-gray-700">
                          {formatDate(notification.date || notification.created_at)}
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination intégrée directement avec style futuriste */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex items-center justify-center space-x-4 mt-8 mb-4"
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
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

