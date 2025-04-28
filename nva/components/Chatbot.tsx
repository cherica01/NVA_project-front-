"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Send, X, Minimize2, Maximize2, Bot, User, Calendar, MapPin, Clock } from "lucide-react"
import { getAccessToken } from "@/util/biscuit"
import { toast } from "@/hooks/use-toast"
import { apiUrl } from "@/util/config"

  status?: string
  date: string
  time: string
  description?: string
  agents?: string[]
}

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  intent?: string
  action?: string
  actionData?: EventActionData
}

interface ChatbotProps {
  title?: string
  userRole?: "admin" | "agent"
}

export default function Chatbot({ title = "Assistant IA", userRole = "agent" }: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Bonjour ! Je suis votre assistant virtuel. Comment puis-je vous aider aujourd'hui ?",
      sender: "bot",
      timestamp: new Date(),
    },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleChat = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
      setUnreadCount(0)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
    if (isMinimized) {
      setUnreadCount(0)
    }
  }

  const handleSendMessage = async () => {
    if (!message.trim()) return

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setMessage("")
    setIsLoading(true)

    try {
      // Get access token for authentication
      const accessToken = await getAccessToken()

      // Call the chatbot API endpoint
      const response = await fetch(`${apiUrl}/messaging/chatbot/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()

      // Add bot response to chat
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "bot",
        timestamp: new Date(),
        intent: data.intent,
        action: data.action,
        actionData: data.action_data,
      }

      setMessages((prev) => [...prev, botMessage])

      // If chat is minimized, increment unread count
      if (isMinimized) {
        setUnreadCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Désolé, une erreur s'est produite lors de la communication avec l'assistant. Veuillez réessayer plus tard.",
        sender: "bot",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec l'assistant",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Render event details card when action is "show_event"
  const renderEventCard = (actionData: any) => {
    if (!actionData) return null

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mt-2 border border-green-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-green-700 dark:text-green-400">{actionData.title}</h3>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {actionData.status || "Confirmé"}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{actionData.date}</span>
          </div>

          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4 mr-2" />
            <span>{actionData.time}</span>
          </div>

          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{actionData.location}</span>
          </div>

          {actionData.description && (
            <div className="mt-2 text-gray-700 dark:text-gray-200">
              <p className="text-xs">{actionData.description}</p>
            </div>
          )}

          {actionData.agents && actionData.agents.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Agents assignés:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {actionData.agents.map((agent: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {agent}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Chatbot button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Button
          onClick={toggleChat}
          className={`rounded-full w-14 h-14 p-0 shadow-lg ${
            isOpen ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <div className="relative">
              <MessageCircle className="h-6 w-6" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white border-none px-1.5 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                  {unreadCount}
                </Badge>
              )}
            </div>
          )}
        </Button>
      </motion.div>

      {/* Chatbot interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-green-200 shadow-xl overflow-hidden">
              <CardHeader className="bg-green-600 text-white p-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium flex items-center">
                  <Bot className="h-5 w-5 mr-2" />
                  {title}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={toggleMinimize} className="h-8 w-8 text-white">
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
              </CardHeader>

              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="p-0">
                      <ScrollArea className="h-80 p-4">
                        <div className="space-y-4">
                          {messages.map((msg) => (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                            >
                              <div className="flex items-end gap-2 max-w-[85%]">
                                {msg.sender === "bot" && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-green-100 text-green-800">
                                      <Bot className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={`p-3 rounded-lg ${
                                    msg.sender === "user" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      msg.sender === "user" ? "text-green-100" : "text-gray-500"
                                    }`}
                                  >
                                    {formatTime(msg.timestamp)}
                                  </p>

                                  {/* Render action content if available */}
                                  {msg.sender === "bot" &&
                                    msg.action === "show_event" &&
                                    renderEventCard(msg.actionData)}
                                </div>
                                {msg.sender === "user" && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-green-800 text-white">
                                      <User className="h-4 w-4" />
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            </motion.div>
                          ))}
                          {isLoading && (
                            <div className="flex justify-start">
                              <div className="flex items-end gap-2 max-w-[85%]">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-green-100 text-green-800">
                                    <Bot className="h-4 w-4" />
                                  </AvatarFallback>
                                </Avatar>
                                <div className="p-3 rounded-lg bg-gray-100">
                                  <div className="flex space-x-1">
                                    <div
                                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "0ms" }}
                                    ></div>
                                    <div
                                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "150ms" }}
                                    ></div>
                                    <div
                                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                      style={{ animationDelay: "300ms" }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-3 border-t">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          handleSendMessage()
                        }}
                        className="flex w-full gap-2"
                      >
                        <Input
                          ref={inputRef}
                          placeholder="Tapez votre message..."
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="flex-1 border-green-200 focus-visible:ring-green-500"
                          disabled={isLoading}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          disabled={!message.trim() || isLoading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </CardFooter>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
