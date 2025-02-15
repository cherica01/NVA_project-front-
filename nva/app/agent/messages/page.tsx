"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, MoreVertical, Search } from "lucide-react"
import { format } from "date-fns"

interface Contact {
  id: number
  name: string
  avatar: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
}

interface Message {
  id: number
  senderId: number
  content: string
  timestamp: Date
}

const contacts: Contact[] = [
  {
    id: 1,
    name: "Alice Dubois",
    avatar: "/avatars/alice.jpg",
    lastMessage: "Salut, comment ça va ?",
    lastMessageTime: new Date(2023, 5, 10, 14, 30),
    unreadCount: 2,
  },
  {
    id: 2,
    name: "Bob Martin",
    avatar: "/avatars/bob.jpg",
    lastMessage: "Tu as vu le match hier ?",
    lastMessageTime: new Date(2023, 5, 10, 10, 15),
    unreadCount: 0,
  },
  {
    id: 3,
    name: "Claire Lefebvre",
    avatar: "/avatars/claire.jpg",
    lastMessage: "N'oublie pas la réunion demain",
    lastMessageTime: new Date(2023, 5, 9, 18, 45),
    unreadCount: 1,
  },
]

export default function MessagingPage() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedContact) {
      // Simulating fetching messages for the selected contact
      const fetchedMessages: Message[] = [
        { id: 1, senderId: selectedContact.id, content: "Salut !", timestamp: new Date(2023, 5, 10, 14, 25) },
        { id: 2, senderId: 0, content: "Salut ! Comment ça va ?", timestamp: new Date(2023, 5, 10, 14, 26) },
        {
          id: 3,
          senderId: selectedContact.id,
          content: "Ça va bien, merci. Et toi ?",
          timestamp: new Date(2023, 5, 10, 14, 28),
        },
        { id: 4, senderId: 0, content: "Très bien aussi, merci !", timestamp: new Date(2023, 5, 10, 14, 30) },
      ]
      setMessages(fetchedMessages)
    }
  }, [selectedContact])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messagesEndRef]) //Corrected dependency

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedContact) {
      const newMsg: Message = {
        id: messages.length + 1,
        senderId: 0, // Assuming 0 is the current user's ID
        content: newMessage,
        timestamp: new Date(),
      }
      setMessages([...messages, newMsg])
      setNewMessage("")
    }
  }

  return (
    <div className="flex h-screen bg-gray-200">
      {/* Contacts List */}
      <div className="w-1/3 bg-white border-r border-gray-300">
        <div className="p-4 bg-green-800 text-white flex justify-between items-center">
          <Avatar>
            <AvatarImage src="/avatars/user.jpg" alt="Your avatar" />
            <AvatarFallback>You</AvatarFallback>
          </Avatar>
          <div className="flex space-x-4">
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher ou démarrer une nouvelle discussion"
              className="pl-10 bg-gray-100 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-120px)]">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                selectedContact?.id === contact.id ? "bg-gray-200" : ""
              }`}
              onClick={() => setSelectedContact(contact)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={contact.avatar} alt={contact.name} />
                <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold">{contact.name}</h3>
                  <span className="text-xs text-gray-500">{format(contact.lastMessageTime, "HH:mm")}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{contact.lastMessage}</p>
              </div>
              {contact.unreadCount > 0 && (
                <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2">
                  {contact.unreadCount}
                </span>
              )}
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedContact ? (
          <>
            <div className="p-4 bg-green-800 text-white flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
                  <AvatarFallback>{selectedContact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <h2 className="ml-3 font-semibold">{selectedContact.name}</h2>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 p-4 bg-[#e5ddd5]">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.senderId === 0 ? "justify-end" : "justify-start"}`}
                >
                  <Card className={`max-w-[70%] ${message.senderId === 0 ? "bg-green-100" : "bg-white"}`}>
                    <CardContent className="p-3">
                      <p>{message.content}</p>
                      <div className="text-right text-xs text-gray-500 mt-1">{format(message.timestamp, "HH:mm")}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
            <div className="p-4 bg-gray-100 flex items-center space-x-2">
              <Button variant="ghost" size="icon">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                type="text"
                placeholder="Tapez un message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                className="flex-1"
              />
              <Button onClick={handleSendMessage} className="bg-green-500 hover:bg-green-600">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-100">
            <p className="text-gray-500 text-lg">Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  )
}

