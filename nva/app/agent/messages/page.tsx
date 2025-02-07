"use client"

import { useState } from "react"
import { Send, Trash2, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Message {
  id: number
  sender: string
  content: string
  timestamp: string
  avatar: string
}

const mockMessages: Message[] = [
  {
    id: 1,
    sender: "John Doe",
    content: "Bonjour, pouvez-vous confirmer l'heure du shooting photo demain ?",
    timestamp: "10:30",
    avatar: "https://i.pravatar.cc/150?img=1",
  },
  {
    id: 2,
    sender: "Jane Smith",
    content: "N'oubliez pas la réunion avec le client cet après-midi à 14h.",
    timestamp: "11:45",
    avatar: "https://i.pravatar.cc/150?img=2",
  },
  {
    id: 3,
    sender: "Mike Johnson",
    content: "Les nouvelles photos de votre portfolio sont superbes !",
    timestamp: "13:15",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
]

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [newMessage, setNewMessage] = useState("")

  const handleSendMessage = () => {
    if (newMessage.trim() !== "") {
      const message: Message = {
        id: messages.length + 1,
        sender: "Vous",
        content: newMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        avatar: "https://i.pravatar.cc/150?img=4",
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  const handleDeleteMessage = (id: number) => {
    setMessages(messages.filter((message) => message.id !== id))
  }

  return (
    <main className="p-6 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 text-center">Messages</h1>

      <Card className="bg-white dark:bg-gray-800 border-green-500">
        <CardHeader className="bg-green-500 text-white">
          <CardTitle>Boîte de réception</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 max-h-[60vh] overflow-y-auto">
          {messages.map((message) => (
            <div key={message.id} className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src={message.avatar} alt={message.sender} />
                    <AvatarFallback>{message.sender[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-black dark:text-white">{message.sender}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{message.timestamp}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteMessage(message.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <p className="text-black dark:text-white">{message.content}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-green-500">
        <CardHeader className="bg-green-500 text-white">
          <CardTitle>Nouveau Message</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="space-y-4">
            <Textarea
              placeholder="Tapez votre message ici..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full border-green-300 focus:ring-green-500"
            />
            <Button onClick={handleSendMessage} className="w-full bg-green-500 hover:bg-green-600 text-white">
              <Send className="w-4 h-4 mr-2" />
              Envoyer
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}

