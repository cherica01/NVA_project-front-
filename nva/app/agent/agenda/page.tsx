"use client"

import { useState } from "react"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Event {
  id: number
  name: string
  startTime: string
  endTime: string
  duration: number
  details: string
}

const mockEvents: Event[] = [
  {
    id: 1,
    name: "Photo Shoot",
    startTime: "09:00",
    endTime: "11:00",
    duration: 120,
    details: "Fashion magazine cover shoot",
  },
  {
    id: 2,
    name: "Runway Practice",
    startTime: "13:00",
    endTime: "15:00",
    duration: 120,
    details: "Practice for upcoming fashion show",
  },
  {
    id: 3,
    name: "Client Meeting",
    startTime: "16:00",
    endTime: "17:00",
    duration: 60,
    details: "Discuss upcoming campaign with new client",
  },
]

export default function Home() {
  const [events] = useState<Event[]>(mockEvents)

  return (
    <main className="p-6 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 text-center">Agenda de l'Agent</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="bg-white dark:bg-gray-800 border-green-500">
            <CardHeader className="bg-green-500 text-white">
              <CardTitle className="flex items-center justify-between">
                <span>{event.name}</span>
                <Badge variant="outline" className="bg-white text-green-500">
                  {event.duration} min
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-black dark:text-white">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span>
                    {event.startTime} - {event.endTime}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-black dark:text-white">
                  <Calendar className="w-4 h-4 text-green-500" />
                  <span>{event.details}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  )
}

