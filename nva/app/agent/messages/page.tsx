"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Send, MessageSquare, RefreshCw, Sparkles, Users } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Mettre à jour l'interface utilisateur pour les agents et admins
interface User {
  id: number
  username: string
  first_name?: string
  last_name?: string
  email?: string
  is_staff?: boolean
  is_agent?: boolean
}

interface Message {
  id: number
  sender: User
  sender_id?: number
  sender_name?: string
  receiver_id?: number
  receiver_name?: string
  content: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  id: number
  participants?: User[]
  participant1?: User
  participant2?: User
  created_at: string
  updated_at: string
  last_message?: {
    id: number
    content: string
    sender: string
    created_at: string
  }
  unread_count: number
}

export default function AgentMessagingPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [messageText, setMessageText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Récupérer l'utilisateur courant
  const fetchCurrentUser = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/messaging/current-user/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        console.error("Erreur lors du chargement de l'utilisateur courant:", response.status)
        return
      }

      const data = await response.json()
      console.log("Utilisateur courant:", data)
      setCurrentUser(data)
    } catch (error) {
      console.error("Erreur lors du chargement de l'utilisateur courant:", error)
    }
  }

  // Ajouter cette fonction pour récupérer tous les utilisateurs
  const fetchUsers = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      // Récupérer tous les utilisateurs (agents et admins)
      const response = await fetch(`${apiUrl}/messaging/users/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement des utilisateurs")
      }

      const data = await response.json()
      console.log("Utilisateurs récupérés:", data)

      // Format the data properly
      const formattedUsers = Array.isArray(data)
        ? data.map((user) => ({
            id: user.id,
            username: user.username || user.email || `Utilisateur ${user.id}`,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            is_staff: user.is_staff || false,
            is_agent: user.is_agent || false,
          }))
        : []

      setUsers(formattedUsers)
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
      setError("Impossible de charger la liste des utilisateurs")
    }
  }

  useEffect(() => {
    fetchCurrentUser()
    fetchConversations()
    fetchUnreadCount()
    fetchUsers()

    // Mettre à jour le compteur de messages non lus toutes les 30 secondes
    const interval = setInterval(() => {
      fetchUnreadCount()
      fetchConversations()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Effect to clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const fetchUnreadCount = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) return

      const response = await fetch(`${apiUrl}/messaging/unread-count/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) return

      const data = await response.json()
      setUnreadCount(data.unread_count || 0)
    } catch (error) {
      console.error("Erreur lors du chargement du nombre de messages non lus:", error)
    }
  }

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/messaging/conversations/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement des conversations")
      }

      const data = await response.json()
      console.log("Données de conversations reçues (agent):", data)

      // Normaliser les données
      let normalizedData = []

      if (Array.isArray(data)) {
        normalizedData = data
      } else if (data && typeof data === "object") {
        // Si c'est un objet avec une propriété contenant les données
        const possibleArrayProps = Object.keys(data).filter((key) => Array.isArray(data[key]))
        if (possibleArrayProps.length > 0) {
          normalizedData = data[possibleArrayProps[0]]
        }

        // Si l'API renvoie un format différent, adapter ici
        // Par exemple, si l'API renvoie { participant1, participant2 } au lieu de participants[]
        normalizedData = normalizedData.map((conv: { participants: any; participant1: any; participant2: any }) => {
          if (!conv.participants && (conv.participant1 || conv.participant2)) {
            return {
              ...conv,
              participants: [conv.participant1, conv.participant2].filter(Boolean), // Filtrer les valeurs null/undefined
            }
          }
          return conv
        })
      }

      setConversations(normalizedData)

      // Si une conversation est sélectionnée, mettre à jour ses données
      if (selectedConversation) {
        const updatedConversation = normalizedData.find((conv: { id: number }) => conv.id === selectedConversation.id)
        if (updatedConversation) {
          setSelectedConversation(updatedConversation)
        }
      }
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error)
      setError("Impossible de charger vos conversations")
    } finally {
      setLoading(false)
    }
  }

  const searchConversations = async (query: string) => {
    if (!query.trim()) {
      fetchConversations()
      return
    }

    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/messaging/search/?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors de la recherche")
      }

      const data = await response.json()
      setConversations(data)
    } catch (error) {
      console.error("Erreur lors de la recherche:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    setLoadingMessages(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/messaging/conversations/${conversationId}/messages/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement des messages")
      }

      const data = await response.json()
      console.log("Messages reçus (agent):", data)

      // Normaliser les données
      let normalizedData = []

      if (Array.isArray(data)) {
        normalizedData = data
      } else if (data && typeof data === "object") {
        // Si c'est un objet avec une propriété contenant les données
        const possibleArrayProps = Object.keys(data).filter((key) => Array.isArray(data[key]))
        if (possibleArrayProps.length > 0) {
          normalizedData = data[possibleArrayProps[0]]
        }
      }

      // Adapter les messages si nécessaire
      normalizedData = normalizedData.map((msg: { sender: any; sender_id: any; sender_name: any }) => {
        // Si le message n'a pas d'objet sender mais a un sender_id et sender_name
        if (!msg.sender && msg.sender_id) {
          return {
            ...msg,
            sender: {
              id: msg.sender_id,
              username: msg.sender_name || `Utilisateur ${msg.sender_id}`,
              is_staff: false, // Par défaut, on suppose que ce n'est pas un admin
            },
          }
        }
        return msg
      })

      setMessages(normalizedData)

      // Mettre à jour le compteur de messages non lus
      fetchUnreadCount()

      // Mettre à jour la conversation dans la liste
      fetchConversations()
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error)
      setError("Impossible de charger les messages")
    } finally {
      setLoadingMessages(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedConversation) return
    if (!messageText.trim()) return

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      // Envoyer le message texte
      const messageData = {
        content: messageText.trim(),
      }

      const response = await fetch(`${apiUrl}/messaging/conversations/${selectedConversation.id}/messages/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(messageData),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors de l'envoi du message")
      }

      // Ajouter le nouveau message à la liste des messages
      fetchMessages(selectedConversation.id)

      // Effacer le champ de texte
      setMessageText("")

      setSuccess("Message envoyé")
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)
      setError("Impossible d'envoyer votre message")
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    fetchMessages(conversation.id)
  }

  const handleAuthError = () => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/login")
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "Pp", { locale: fr })
    } catch (error) {
      return "Date invalide"
    }
  }

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const today = new Date()

      if (date.toDateString() === today.toDateString()) {
        return format(date, "HH:mm", { locale: fr })
      } else {
        return format(date, "dd/MM/yyyy HH:mm", { locale: fr })
      }
    } catch (error) {
      return "Heure invalide"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  // Fonction pour obtenir l'autre participant dans une conversation
  const getOtherParticipant = (conversation: Conversation) => {
    console.log("Conversation:", conversation)

    // Si l'utilisateur courant n'est pas défini, retourner un utilisateur par défaut
    if (!currentUser) {
      console.error("Utilisateur courant non défini")
      return { id: 0, username: "Utilisateur inconnu" }
    }

    // Vérifier si participants existe et est un tableau
    if (conversation.participants && Array.isArray(conversation.participants)) {
      console.log("Conversation participants (agent):", conversation.participants)
      // Trouver le participant qui n'est PAS l'utilisateur courant
      const otherParticipant = conversation.participants.find((p) => p.id !== currentUser.id)
      if (otherParticipant) {
        console.log("Autre participant trouvé:", otherParticipant)
        return otherParticipant
      }
      // Si aucun autre participant n'est trouvé, retourner le premier participant
      return conversation.participants[0]
    }
    // Si participants n'existe pas, vérifier participant1 et participant2
    else if (conversation.participant1 && conversation.participant2) {
      // Déterminer lequel des deux n'est pas l'utilisateur courant
      if (conversation.participant1.id === currentUser.id) {
        return conversation.participant2
      } else {
        return conversation.participant1
      }
    }

    console.error("Aucun participant trouvé dans la conversation")
    return { id: 0, username: "Utilisateur inconnu" }
  }

  // Filter conversations based on search term
  const filteredConversations = conversations.filter((conversation) => {
    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant.username.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Ajouter une fonction pour créer une nouvelle conversation
  const createNewConversation = async (userId: number) => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/messaging/conversations/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ participants: [userId] }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors de la création de la conversation")
      }

      const data = await response.json()

      // Rafraîchir la liste des conversations
      await fetchConversations()

      // Sélectionner la nouvelle conversation
      setSelectedConversation(data)
      fetchMessages(data.id)

      return data
    } catch (error) {
      console.error("Erreur lors de la création de la conversation:", error)
      setError("Impossible de créer une nouvelle conversation")
      return null
    }
  }

  // Ajouter une fonction pour démarrer une nouvelle conversation
  const startNewConversation = async (user: User) => {
    // Vérifier si une conversation existe déjà avec cet utilisateur
    const existingConversation = conversations.find((conv) => {
      if (conv.participants) {
        return conv.participants.some((p) => p.id === user.id)
      } else if (conv.participant1 && conv.participant2) {
        return conv.participant1.id === user.id || conv.participant2.id === user.id
      }
      return false
    })

    if (existingConversation) {
      setSelectedConversation(existingConversation)
      fetchMessages(existingConversation.id)
    } else {
      // Créer une nouvelle conversation
      const newConversation = await createNewConversation(user.id)
      if (newConversation) {
        setSuccess(`Nouvelle conversation créée avec ${user.username}`)
      }
    }
  }

  // Fonction pour déterminer si un message est de l'utilisateur courant
  const isMessageFromCurrentUser = (message: Message) => {
    if (!currentUser) return false
    return message.sender.id === currentUser.id
  }

  return (
    <div className="p-6 min-h-screen bg-gray-200">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-[calc(100vh-8rem)]"
      >
        <Card className="backdrop-blur-lg bg-white/90 border-none shadow-lg animated-border h-full">
          <CardHeader className="bg-green-800 text-white px-6 py-4">
            {/* Modifier le titre de la page pour refléter le système unifié */}
            <CardTitle className="text-2xl font-bold flex items-center">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
              >
                <MessageSquare className="mr-3 h-7 w-7" />
              </motion.div>
              <motion.span
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Messagerie
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
          </CardHeader>
          <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 h-[calc(100%-4rem)]">
            {/* Left sidebar - Conversation list */}
            <div className="border-r border-green-100 h-full flex flex-col">
              <div className="p-4 border-b border-green-100">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      if (e.target.value.trim()) {
                        searchConversations(e.target.value)
                      } else {
                        fetchConversations()
                      }
                    }}
                    className="pl-10 border-green-300 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Chargement des conversations...</p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-green-500/30 mx-auto mb-2" />
                      <p className="text-gray-600">Aucune conversation trouvée</p>
                      <p className="text-sm text-gray-500">Les administrateurs pourront vous contacter ici.</p>
                    </div>
                  ) : (
                    // Afficher les conversations avec le nom de l'administrateur
                    filteredConversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation)

                      return (
                        <motion.div
                          key={conversation.id}
                          whileHover={{ scale: 1.01, backgroundColor: "rgba(240, 253, 244, 1)" }}
                          whileTap={{ scale: 0.99 }}
                          className={`p-3 rounded-md cursor-pointer transition-all ${
                            selectedConversation?.id === conversation.id
                              ? "bg-green-100"
                              : conversation.unread_count > 0
                                ? "bg-green-50"
                                : ""
                          }`}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar>
                              <AvatarFallback className="bg-green-200 text-green-700">
                                {getInitials(otherParticipant.username)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-center">
                                <p className="font-medium truncate">{otherParticipant.username}</p>
                                {conversation.last_message && (
                                  <p className="text-xs text-gray-500">
                                    {formatMessageTime(conversation.last_message.created_at)}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.last_message?.content || "Nouvelle conversation"}
                              </p>
                            </div>
                            {conversation.unread_count > 0 && (
                              <Badge className="bg-green-500 text-white ml-2">{conversation.unread_count}</Badge>
                            )}
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </ScrollArea>

              {/* Ajouter un bouton pour créer une nouvelle conversation dans la barre latérale */}
              <div className="p-4 border-t border-green-100 mt-auto">
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchConversations}
                    className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualiser
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="default" size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                        <Users className="h-4 w-4 mr-2" />
                        Nouvelle conversation
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-medium">Sélectionner un utilisateur</h4>
                        <p className="text-sm text-gray-500">Démarrez une nouvelle conversation</p>
                      </div>
                      <ScrollArea className="h-60">
                        <div className="p-2">
                          {users.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">Aucun utilisateur disponible</p>
                          ) : (
                            users.map((user) => (
                              <motion.div
                                key={user.id}
                                whileHover={{ backgroundColor: "rgba(240, 253, 244, 1)" }}
                                className="p-2 rounded-md cursor-pointer transition-all flex items-center space-x-2"
                                onClick={() => {
                                  startNewConversation(user)
                                }}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback
                                    className={`text-xs ${user.is_staff ? "bg-green-700 text-white" : "bg-green-200 text-green-700"}`}
                                  >
                                    {getInitials(user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <p className="font-medium text-sm truncate">{user.username}</p>
                                    {user.is_staff && (
                                      <Badge className="ml-2 bg-green-700 text-white text-xs">Administrateur</Badge>
                                    )}
                                    {user.is_agent && (
                                      <Badge className="ml-2 bg-green-500 text-white text-xs">Agent</Badge>
                                    )}
                                  </div>
                                  {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* Right side - Chat area */}
            <div className="col-span-2 flex flex-col h-full">
              {selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-green-100 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-green-200 text-green-700">
                          {getInitials(getOtherParticipant(selectedConversation).username)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{getOtherParticipant(selectedConversation).username}</p>
                        <p className="text-xs text-gray-500">
                          {getOtherParticipant(selectedConversation).email || "Aucun email"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchMessages(selectedConversation.id)}
                      className="text-green-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Actualiser
                    </Button>
                  </div>

                  {/* Chat messages */}
                  <ScrollArea className="flex-1 p-4">
                    {loadingMessages ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Chargement des messages...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-green-500/30 mx-auto mb-2" />
                        <p className="text-gray-600">Aucun message. Démarrez la conversation !</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          // Utiliser la fonction pour déterminer si le message est de l'utilisateur courant
                          const isFromCurrentUser = isMessageFromCurrentUser(message)

                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isFromCurrentUser ? "justify-end" : "justify-start"}`}
                            >
                              <div className="flex items-end gap-2 max-w-[80%]">
                                {!isFromCurrentUser && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-green-200 text-green-700 text-xs">
                                      {getInitials(message.sender.username)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={`p-3 rounded-lg ${
                                    isFromCurrentUser ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${isFromCurrentUser ? "text-green-100" : "text-gray-500"}`}
                                  >
                                    {formatMessageTime(message.created_at)}
                                    {!isFromCurrentUser && !message.is_read && (
                                      <span className="ml-2 italic">Non lu</span>
                                    )}
                                  </p>
                                </div>
                                {isFromCurrentUser && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-green-200 text-green-700 text-xs">
                                      {getInitials("Moi")}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </motion.div>
                          )
                        })}
                        <div ref={messagesEndRef}></div>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Message input */}
                  <div className="p-4 border-t border-green-100">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleSendMessage()
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Input
                        placeholder="Tapez votre message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1 border-green-300 focus:ring-green-500 focus:border-green-500"
                      />
                      <Button
                        type="submit"
                        disabled={!messageText.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Envoyer
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                // Modifier le texte de la page d'accueil pour refléter le système unifié
                <div className="flex flex-col items-center justify-center h-full">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <MessageSquare className="h-20 w-20 text-green-500/30 mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">Messagerie</h3>
                  <p className="text-gray-500 max-w-md text-center mb-4">
                    Sélectionnez une conversation dans la barre latérale ou démarrez une nouvelle conversation.
                  </p>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white">
                        <Users className="h-4 w-4 mr-2" />
                        Nouvelle conversation
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0">
                      <div className="p-4 border-b border-gray-200">
                        <h4 className="font-medium">Sélectionner un utilisateur</h4>
                        <p className="text-sm text-gray-500">Démarrez une nouvelle conversation</p>
                      </div>
                      <ScrollArea className="h-60">
                        <div className="p-2">
                          {users.length === 0 ? (
                            <p className="text-center py-4 text-gray-500">Aucun utilisateur disponible</p>
                          ) : (
                            users.map((user) => (
                              <motion.div
                                key={user.id}
                                whileHover={{ backgroundColor: "rgba(240, 253, 244, 1)" }}
                                className="p-2 rounded-md cursor-pointer transition-all flex items-center space-x-2"
                                onClick={() => {
                                  startNewConversation(user)
                                }}
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback
                                    className={`text-xs ${user.is_staff ? "bg-green-700 text-white" : "bg-green-200 text-green-700"}`}
                                  >
                                    {getInitials(user.username)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center">
                                    <p className="font-medium text-sm truncate">{user.username}</p>
                                    {user.is_staff && (
                                      <Badge className="ml-2 bg-green-700 text-white text-xs">Administrateur</Badge>
                                    )}
                                    {user.is_agent && (
                                      <Badge className="ml-2 bg-green-500 text-white text-xs">Agent</Badge>
                                    )}
                                  </div>
                                  {user.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              {/* Error/Success alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mx-4 mb-4"
                  >
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mx-4 mb-4"
                  >
                    <Alert className="bg-green-100 text-green-800 border-green-200">
                      <AlertDescription>{success}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

