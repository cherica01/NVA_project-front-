"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, addMonths, subMonths, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, ChevronLeft, ChevronRight, MapPin, Clock, Info, Check, X, BarChart } from "lucide-react"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { motion, AnimatePresence } from "framer-motion"

interface Event {
  id: number
  title: string
  location: string
  start_date: string
  end_date: string
}

interface Day {
  date: string
  day: number
  events: Event[]
  is_available: boolean
  note: string | null
  is_weekend: boolean
  is_today: boolean
}

interface MonthData {
  year: number
  month: number
  days: Day[]
}

export default function AgentAgendaPage() {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [monthData, setMonthData] = useState<MonthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)

  useEffect(() => {
    fetchMonthData(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }, [currentDate])

  // Effect to clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const fetchMonthData = async (year: number, month: number) => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/agenda/agent/events/${year}/${month}/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors du chargement des données: ${response.status}`)
      }

      const data = await response.json()
      }
      setMonthData(data)
    } catch (error) {
      console.error("Erreur lors du chargement des données du mois:", error)
      setError("Impossible de charger les données de l'agenda")
    } finally {
      setLoading(false)
    }
  }

  const handleAuthError = () => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/login")
  }

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setShowEventDetail(true)
  }

  const handleDayClick = (day: Day) => {
    setSelectedDay(day)
    setShowAvailabilityDialog(true)
  }

  const handleAvailabilityUpdated = () => {
    // Rafraîchir les données du mois après la mise à jour de la disponibilité
    fetchMonthData(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }

  const renderCalendar = () => {
    if (!monthData) return null

    // Créer un tableau pour les jours de la semaine
    const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

    // Déterminer le premier jour du mois (0 = Dimanche, 1 = Lundi, etc.)
    const firstDayOfMonth = new Date(monthData.year, monthData.month - 1, 1).getDay()
    // Ajuster pour que la semaine commence le lundi (0 = Lundi, 6 = Dimanche)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1

    // Créer un tableau pour tous les jours du mois avec des espaces vides pour l'alignement
    const calendarDays: (Day | null)[] = []

    // Ajouter des espaces vides pour les jours avant le début du mois
    for (let i = 0; i < adjustedFirstDay; i++) {
      calendarDays.push(null)
    }

    // Ajouter les jours du mois
    monthData.days.forEach((day) => {
      calendarDays.push(day)
    })

    // Diviser les jours en semaines
    const weeks = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7))
    }

    return (
      <div className="mt-4">
        {/* En-tête des jours de la semaine */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {weekDays.map((day, index) => (
            <div
              key={index}
              className={`text-center py-2 font-medium text-sm ${index >= 5 ? "text-red-500" : "text-gray-700"}`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-1">
          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (!day) {
                return <div key={`empty-${weekIndex}-${dayIndex}`} className="h-24 bg-gray-100 rounded-md"></div>
              }

              const date = parseISO(day.date)
              const isCurrentMonth = isSameMonth(date, currentDate)

              return (
                <motion.div
                  key={day.date}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    h-24 p-1 rounded-md overflow-hidden cursor-pointer relative
                    ${day.is_weekend ? "bg-gray-100" : "bg-white"}
                    ${day.is_today ? "ring-2 ring-green-500" : ""}
                    ${!day.is_available ? "border-l-4 border-red-500" : ""}
                    shadow-sm hover:shadow-md transition-shadow
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className={`
                        font-medium text-sm rounded-full w-6 h-6 flex items-center justify-center
                        ${day.is_today ? "bg-green-500 text-white" : ""}
                      `}
                    >
                      {day.day}
                    </span>
                    {!day.is_available && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <XCircle className="h-4 w-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Non disponible</p>
                            {day.note && <p className="text-xs">{day.note}</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <div className="mt-1 space-y-1 overflow-hidden max-h-[calc(100%-24px)]">
                    {day.events.slice(0, 2).map((event, index) => (
                      <div
                        key={`${event.id}-${index}`}
                        className="bg-green-100 text-green-800 text-xs p-1 rounded truncate"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEventClick(event)
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {day.events.length > 2 && (
                      <div className="text-xs text-gray-500 pl-1">+{day.events.length - 2} autres</div>
                    )}
                  </div>
                </motion.div>
              )
            }),
          )}
        </div>
      </div>
    )
  }

  const renderListView = () => {
    if (!monthData) return null

    // Filtrer les jours avec des événements
    const daysWithEvents = monthData.days.filter((day) => day.events.length > 0)

    if (daysWithEvents.length === 0) {
      return (
        <div className="text-center py-8">
          <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Aucun événement ce mois-ci</p>
        </div>
      )
    }

    return (
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="space-y-4 p-2">
          {daysWithEvents.map((day) => (
            <Card key={day.date} className={`${day.is_today ? "border-green-500" : ""}`}>
              <CardHeader className="py-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(parseISO(day.date), "EEEE d MMMM", { locale: fr })}
                  </CardTitle>
                  {day.is_today && <Badge className="bg-green-500">Aujourd'hui</Badge>}
                  {!day.is_available && <Badge variant="destructive">Non disponible</Badge>}
                </div>
              </CardHeader>
              <CardContent className="py-0">
                <div className="space-y-3">
                  {day.events.map((event) => (
                    <motion.div
                      key={event.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-3 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100"
                      onClick={() => handleEventClick(event)}
                    >
                      <h4 className="font-medium text-green-800">{event.title}</h4>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {format(parseISO(event.start_date), "HH:mm")} - {format(parseISO(event.end_date), "HH:mm")}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-gray-200">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="backdrop-blur-lg bg-white/90 border-none shadow-lg">
          <CardHeader className="bg-green-800 text-white px-6 py-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold flex items-center">
                <Calendar className="mr-3 h-7 w-7" />
                <span>Agenda</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-white border-white hover:bg-green-700"
                  onClick={() => setShowPreferencesDialog(true)}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Préférences
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center mb-6">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
                <span className="ml-1 hidden sm:inline">Mois précédent</span>
              </Button>
              <h2 className="text-xl font-bold text-center">{format(currentDate, "MMMM yyyy", { locale: fr })}</h2>
              <Button variant="outline" size="sm" onClick={handleNextMonth}>
                <span className="mr-1 hidden sm:inline">Mois suivant</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Tabs defaultValue="month" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="month">Vue Calendrier</TabsTrigger>
                <TabsTrigger value="list">Vue Liste</TabsTrigger>
              </TabsList>
              <TabsContent value="month" className="mt-0">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                  </div>
                ) : (
                  renderCalendar()
                )}
              </TabsContent>
              <TabsContent value="list" className="mt-0">
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                  </div>
                ) : (
                  renderListView()
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-100 rounded mr-2"></div>
                <span className="text-sm">Événement</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 border-l-4 border-red-500 rounded mr-2"></div>
                <span className="text-sm">Non disponible</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 ring-2 ring-green-500 rounded mr-2"></div>
                <span className="text-sm">Aujourd'hui</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 rounded mr-2"></div>
                <span className="text-sm">Weekend</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <EventDetailDialog event={selectedEvent} open={showEventDetail} onOpenChange={setShowEventDetail} />

      <AvailabilityDialog
        day={selectedDay}
        open={showAvailabilityDialog}
        onOpenChange={setShowAvailabilityDialog}
        onAvailabilityUpdated={handleAvailabilityUpdated}
      />

      <PreferencesDialog open={showPreferencesDialog} onOpenChange={setShowPreferencesDialog} />
    </div>
  )
}

