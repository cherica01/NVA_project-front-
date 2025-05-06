"use client"

import { useState, useEffect, useCallback } from "react"
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

  const handleAuthError = useCallback(() => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/")
  }, [router])

  const fetchMonthData = useCallback(async (year: number, month: number) => {
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

      // Marquer automatiquement les jours avec des événements comme indisponibles
      if (data && data.days) {
        data.days = data.days.map((day: Day) => ({
          ...day,
          is_available: day.events.length === 0, // Disponible seulement s'il n'y a pas d'événements
        }))
      }

      setMonthData(data)
    } catch (error) {
      console.error("Erreur lors du chargement des données du mois:", error)
      setError("Impossible de charger les données de l'agenda")
    } finally {
      setLoading(false)
    }
  }, [handleAuthError])

  useEffect(() => {
    fetchMonthData(currentDate.getFullYear(), currentDate.getMonth() + 1)
  }, [currentDate, fetchMonthData])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleDayClick = (day: Day) => {
    setSelectedDay(day)
  }

  const formatMonthYear = (date: Date) => {
    return format(date, "MMMM yyyy", { locale: fr })
  }

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString)
    return format(date, "d MMMM yyyy", { locale: fr })
  }

  const formatDateTime = (dateString: string) => {
    const date = parseISO(dateString)
    return format(date, "d MMM yyyy HH:mm", { locale: fr })
  }

  const getMonthSummary = () => {
    if (!monthData || !monthData.days) return null;
  
    // Dédupliquer les événements en fonction de leur id
    const uniqueEvents = new Set<number>();
    monthData.days.forEach((day) => {
      day.events.forEach((event) => {
        uniqueEvents.add(event.id);
      });
    });
    const totalEvents = uniqueEvents.size; // Nombre d'événements uniques
  
    // Compter les jours avec des événements (jours occupés)
    const daysWithEvents = monthData.days.filter((day) => day.events.length > 0).length;
  
    // Collecter les lieux uniques
    const eventLocations = new Set<string>();
    monthData.days.forEach((day) => {
      day.events.forEach((event) => {
        eventLocations.add(event.location);
      });
    });
  
    return {
      totalEvents, // Maintenant basé sur les événements uniques
      daysWithEvents,
      eventLocations: Array.from(eventLocations),
    };
  };

  const monthSummary = getMonthSummary()

  return (
    <div className="p-6 min-h-screen bg-gray-200">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="backdrop-blur-lg bg-white/90 border-none shadow-lg">
          <CardHeader className="bg-green-800 text-white px-6 py-4">
            <CardTitle className="text-2xl font-bold flex items-center">
              <Calendar className="mr-3 h-7 w-7" />
              Agenda
            </CardTitle>
            <CardDescription className="text-green-100">Consultez vos événements programmés</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Button variant="outline" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Mois précédent
              </Button>
              <h2 className="text-xl font-semibold capitalize">{formatMonthYear(currentDate)}</h2>
              <Button variant="outline" onClick={handleNextMonth}>
                Mois suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
              </div>
            ) : monthData ? (
              <div className="grid grid-cols-7 gap-2">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                  <div key={day} className="text-center font-semibold p-2">
                    {day}
                  </div>
                ))}

                {Array.from({ length: new Date(monthData.year, monthData.month - 1, 1).getDay() - 1 }, (_, i) => (
                  <div key={`empty-${i}`} className="p-2"></div>
                ))}

                {monthData.days.map((day) => (
                  <motion.div
                    key={day.date}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      p-2 rounded-md cursor-pointer border
                      ${day.is_today ? "border-green-500" : "border-gray-200"}
                      ${day.is_weekend ? "bg-gray-50" : "bg-white"}
                      ${!day.is_available ? "bg-red-50" : ""}
                      ${day.events.length > 0 ? "bg-red-50" : ""}
                    `}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="flex justify-between items-center">
                      <span className={`font-medium ${day.is_today ? "text-green-600" : ""}`}>{day.day}</span>
                      {day.events.length > 0 && <Badge className="bg-red-600">{day.events.length}</Badge>}
                    </div>
                    {day.events.length > 0 && (
                      <Badge variant="outline" className="mt-1 text-red-500 border-red-200 text-xs">
                        Indisponible
                      </Badge>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            )}

            {monthSummary && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart className="h-5 w-5 mr-2 text-green-600" />
                  Récapitulatif du mois
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  <Card className="bg-green-50">
    <CardContent className="pt-6">
      <div className="text-center">
        <p className="text-3xl font-bold text-green-700">{monthSummary.totalEvents}</p>
        <p className="text-sm text-green-600 mt-1">Événements distincts</p>
      </div>
    </CardContent>
  </Card>

  <Card className="bg-green-50">
    <CardContent className="pt-6">
      <div className="text-center">
        <p className="text-3xl font-bold text-green-700">{monthSummary.daysWithEvents}</p>
        <p className="text-sm text-green-600 mt-1">Jours occupés par des événements</p>
      </div>
    </CardContent>
  </Card>

  <Card className="bg-green-50">
    <CardContent className="pt-6">
      <div className="text-center">
        <p className="text-3xl font-bold text-green-700">{monthSummary.eventLocations.length}</p>
        <p className="text-sm text-green-600 mt-1">Lieux différents</p>
      </div>
    </CardContent>
  </Card>
</div>

                {monthSummary.eventLocations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Lieux des événements :</h4>
                    <div className="flex flex-wrap gap-2">
                      {monthSummary.eventLocations.map((location, index) => (
                        <Badge key={index} className="bg-gray-100 text-gray-800">
                          <MapPin className="h-3 w-3 mr-1" />
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4"
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
                  className="mt-4"
                >
                  <Alert className="bg-green-100 text-green-800 border-green-200">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {selectedDay && (
        <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">{formatDate(selectedDay.date)}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="flex items-center">
                {selectedDay.events.length > 0 ? (
                  <Badge className="bg-red-100 text-red-800 flex items-center px-3 py-1">
                    <X className="h-4 w-4 mr-2" />
                    Indisponible - Événement(s) programmé(s)
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 flex items-center px-3 py-1">
                    <Check className="h-4 w-4 mr-2" />
                    Disponible
                  </Badge>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Événements
                </h3>
                {selectedDay.events.length > 0 ? (
                  <ScrollArea className="h-60">
                    <div className="space-y-3">
                      {selectedDay.events.map((event) => (
                        <Card key={event.id} className="p-3">
                          <div className="space-y-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.location}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDateTime(event.start_date)} - {formatDateTime(event.end_date)}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-gray-500 text-sm">Aucun événement prévu pour cette journée</p>
                )}
              </div>

              {selectedDay.note && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center">
                    <Info className="h-4 w-4 mr-2" />
                    Note
                  </h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-md">{selectedDay.note}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setSelectedDay(null)} className="bg-green-600 hover:bg-green-700">
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}