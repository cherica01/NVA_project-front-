"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CalendarIcon, Clock } from "lucide-react"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"

interface Event {
  id: number
  title: string
  start: string
  end: string
  location: string
  company_name: string
  event_code: string
}

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
]

export default function AgentAgenda() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchAgentEvents()
  }, [])

  const fetchAgentEvents = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      const response = await fetch(`${apiUrl}/agent/events/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) throw new Error("Erreur lors du chargement des événements.")
      const data: Event[] = await response.json()
      setEvents(data)
    } catch (err) {
      console.error("Erreur lors du chargement des événements:", err)
    }
  }

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => new Date(year, month, i + 1))
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      return date >= eventStart && date <= eventEnd
    })
  }

  const renderCalendar = () => {
    const days = getDaysInMonth(currentDate)
    const firstDayOfMonth = days[0].getDay()

    return (
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((day) => (
          <div key={day} className="text-center font-bold p-2 bg-green-200 dark:bg-green-800">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}
        {days.map((date) => {
          const dayEvents = getEventsForDate(date)
          const isWorkDay = dayEvents.length > 0
          return (
            <div
              key={date.toString()}
              className={`p-2 border ${
                isWorkDay
                  ? "bg-green-200 dark:bg-green-700 border-green-300 dark:border-green-600"
                  : "bg-white dark:bg-green-950 border-gray-200 dark:border-green-800"
              } cursor-pointer hover:bg-green-100 dark:hover:bg-green-800 transition-colors`}
              onClick={() => dayEvents.length > 0 && setSelectedEvent(dayEvents[0])}
            >
              <div className={`font-semibold ${isWorkDay ? "text-green-800 dark:text-green-200" : ""}`}>
                {date.getDate()}
              </div>
              {isWorkDay && (
                <div className="text-xs mt-1 text-green-600 dark:text-green-400">
                  {dayEvents.length} événement{dayEvents.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const changeMonth = (increment: number) => {
    setCurrentDate((prevDate) => {
      const newDate = new Date(prevDate)
      newDate.setMonth(newDate.getMonth() + increment)
      return newDate
    })
  }

  const getEventsThisMonth = () => {
    return events.filter((event) => {
      const eventDate = new Date(event.start)
      return eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear()
    })
  }

  const eventsThisMonth = getEventsThisMonth()

  return (
    <div className="space-y-8">
      <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">Mon Agenda</CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <Button onClick={() => changeMonth(-1)}>&lt; Précédent</Button>
            <h2 className="text-xl font-bold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button onClick={() => changeMonth(1)}>Suivant &gt;</Button>
          </div>
          {renderCalendar()}
          <div className="mt-4 flex items-center justify-end space-x-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-200 dark:bg-green-700 border border-green-300 dark:border-green-600 mr-2"></div>
              <span className="text-sm">Jour de travail</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white dark:bg-green-950 border border-gray-200 dark:border-green-800 mr-2"></div>
              <span className="text-sm">Jour libre</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-700 text-white dark:bg-green-900">
          <CardTitle className="text-2xl font-bold">Résumé du Mois</CardTitle>
        </CardHeader>
        <CardContent className="mt-4">
          <p className="text-lg mb-4">
            Vous avez <span className="font-bold text-green-600 dark:text-green-400">{eventsThisMonth.length}</span>{" "}
            événement
            {eventsThisMonth.length > 1 ? "s" : ""} à participer ce mois-ci.
          </p>
          {eventsThisMonth.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-2">Prochains événements :</h3>
              {eventsThisMonth.slice(0, 3).map((event) => (
                <div key={event.id} className="flex items-start space-x-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                  <div className="flex-shrink-0">
                    <CalendarIcon className="h-6 w-6 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{event.title}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{event.company_name}</p>
                    <div className="flex items-center mt-1">
                      <Clock className="h-4 w-4 text-green-500 mr-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(event.start).toLocaleString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                  >
                    {event.event_code}
                  </Badge>
                </div>
              ))}
              {eventsThisMonth.length > 3 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Et {eventsThisMonth.length - 3} autre(s) événement(s) ce mois-ci...
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="bg-white dark:bg-green-950 text-gray-900 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-green-800 dark:text-green-300">
                Détails de l'événement
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Titre</h3>
                <p>{selectedEvent.title}</p>
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Date et heure</h3>
                <p>
                  Du {new Date(selectedEvent.start).toLocaleString("fr-FR")} au{" "}
                  {new Date(selectedEvent.end).toLocaleString("fr-FR")}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Lieu</h3>
                <p>{selectedEvent.location}</p>
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Entreprise</h3>
                <p>{selectedEvent.company_name}</p>
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-400">Code de l'événement</h3>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {selectedEvent.event_code}
                </Badge>
              </div>
            </div>
            <Button className="mt-4 bg-green-600 hover:bg-green-700 text-white" onClick={() => setSelectedEvent(null)}>
              Fermer
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

