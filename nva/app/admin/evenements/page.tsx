"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon, MapPin, Briefcase, Hash, Users } from "lucide-react"
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isValid } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { apiUrl } from "../../../util/config"
import { getAccessToken } from "../../../util/biscuit"

interface Agent {
  id: number
  username: string
}

interface Event {
  id: number
  location: string
  company_name: string
  event_code: string
  start_date: string
  end_date: string
  agents: number[]
}

export default function EventManagement() {
  const [events, setEvents] = useState<Event[]>([])
  const [newEvent, setNewEvent] = useState<Omit<Event, "id">>({
    location: "",
    company_name: "",
    event_code: "",
    start_date: "",
    end_date: "",
    agents: [],
  })
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({})
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      const response = await fetch(`${apiUrl}/management/events/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) throw new Error("Erreur lors du chargement des événements.")
      const data: Event[] = await response.json()
      setEvents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setFormError(errorMessage)
    }
  }

  const fetchAvailableAgents = async (start: string, end: string) => {
    try {
      console.log(`📡 Requête envoyée : start_date=${start}, end_date=${end}`)

      const formattedStart = start.split("T")[0]
      const formattedEnd = end.split("T")[0]

      const accessToken = await getAccessToken()
      const response = await fetch(
        `${apiUrl}/management/event/available-agents/?start_date=${formattedStart}&end_date=${formattedEnd}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ Erreur backend :", errorData)
        throw new Error(errorData.error || "Erreur inconnue")
      }

      const data: Agent[] = await response.json()
      console.log(`✅ Agents disponibles reçus :`, data)
      setAvailableAgents(data)
    } catch (err) {
      console.error("❌ Erreur lors du chargement des agents disponibles :", err)
      setAvailableAgents([])
    }
  }

  const validateField = (key: string, value: string | number[]): string | null => {
    if (typeof value === "string" && !value.trim()) return `${key} est requis.`
    if (key === "agents" && (value as number[]).length === 0) return "Au moins un agent doit être assigné."

    if ((key === "start_date" || key === "end_date") && !isValid(new Date(value as string)))
      return "Date et heure invalides."
    if (key === "end_date" && new Date(value as string) <= new Date(newEvent.start_date))
      return "La date de fin doit être postérieure à la date de début."
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string | null } = {}
    Object.entries(newEvent).forEach(([key, value]) => {
      const error = validateField(key, value)
      if (error) newErrors[key] = error
    })
    setErrors(newErrors)
    const hasErrors = Object.values(newErrors).some((error) => error !== null)
    setFormError(hasErrors ? "Veuillez corriger les erreurs dans le formulaire." : null)
    return !hasErrors
  }

  const addEvent = async () => {
    if (!validateForm()) return
    setLoading(true)
    setFormError(null)
    try {
      const accessToken = await getAccessToken()
      console.log("📤 Données envoyées :", JSON.stringify(newEvent, null, 2))
      const response = await fetch(`${apiUrl}/management/create-event/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newEvent),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de l'ajout de l'événement.")
      }
      const result: Event = await response.json()
      setEvents([...events, result])
      setNewEvent({
        location: "",
        company_name: "",
        event_code: "",
        start_date: "",
        end_date: "",
        agents: [],
      })
      setErrors({})
      setFormError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setFormError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
<div className="p-6 space-y-8 bg-gray-200 min-h-screen">



      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">Gestion des Événements</CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          {formError && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{formError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="text-green-500" />
                <Input
                  placeholder="Localisation"
                  value={newEvent.location}
                  onChange={(e) => {
                    setNewEvent({ ...newEvent, location: e.target.value })
                    setErrors({ ...errors, location: validateField("location", e.target.value) })
                  }}
                  className={`border-green-300 focus:ring-green-500 ${errors.location ? "border-red-500" : ""}`}
                />
              </div>
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="text-green-500" />
                <Input
                  placeholder="Nom de l'entreprise"
                  value={newEvent.company_name}
                  onChange={(e) => {
                    setNewEvent({ ...newEvent, company_name: e.target.value })
                    setErrors({ ...errors, company_name: validateField("company_name", e.target.value) })
                  }}
                  className={`border-green-300 focus:ring-green-500 ${errors.company_name ? "border-red-500" : ""}`}
                />
              </div>
              {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Hash className="text-green-500" />
                <Input
                  placeholder="Code de l'événement"
                  value={newEvent.event_code}
                  onChange={(e) => {
                    setNewEvent({ ...newEvent, event_code: e.target.value })
                    setErrors({ ...errors, event_code: validateField("event_code", e.target.value) })
                  }}
                  className={`border-green-300 focus:ring-green-500 ${errors.event_code ? "border-red-500" : ""}`}
                />
              </div>
              {errors.event_code && <p className="text-red-500 text-sm mt-1">{errors.event_code}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="text-green-500" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEvent.start_date && "text-muted-foreground",
                      )}
                    >
                      {newEvent.start_date ? (
                        format(new Date(newEvent.start_date), "Pp", { locale: fr })
                      ) : (
                        <span>Date et heure de début</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div>
                      <Calendar
                        mode="single"
                        selected={newEvent.start_date ? new Date(newEvent.start_date) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const now = new Date()
                            date.setHours(now.getHours(), now.getMinutes())
                            const formattedDate = date.toISOString()
                            setNewEvent({ ...newEvent, start_date: formattedDate })
                            setErrors({ ...errors, start_date: validateField("start_date", formattedDate) })
                            if (newEvent.end_date) {
                              fetchAvailableAgents(formattedDate, newEvent.end_date)
                            }
                          }
                        }}
                        initialFocus
                      />
                      <div className="p-3 border-t border-border">
                        <Input
                          type="time"
                          value={newEvent.start_date ? format(new Date(newEvent.start_date), "HH:mm") : ""}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":")
                            const newDate = new Date(newEvent.start_date || new Date())
                            newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
                            const formattedDate = newDate.toISOString()
                            setNewEvent({ ...newEvent, start_date: formattedDate })
                            if (newEvent.end_date) {
                              fetchAvailableAgents(formattedDate, newEvent.end_date)
                            }
                          }}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="text-green-500" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEvent.end_date && "text-muted-foreground",
                      )}
                    >
                      {newEvent.end_date ? (
                        format(new Date(newEvent.end_date), "Pp", { locale: fr })
                      ) : (
                        <span>Date et heure de fin</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newEvent.end_date ? new Date(newEvent.end_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const now = new Date()
                          date.setHours(now.getHours(), now.getMinutes())
                          const formattedDate = date.toISOString()
                          setNewEvent({ ...newEvent, end_date: formattedDate })
                          setErrors({ ...errors, end_date: validateField("end_date", formattedDate) })
                          if (newEvent.start_date) {
                            fetchAvailableAgents(newEvent.start_date, formattedDate)
                          }
                        }
                      }}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Input
                        type="time"
                        value={newEvent.end_date ? format(new Date(newEvent.end_date), "HH:mm") : ""}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(":")
                          const newDate = new Date(newEvent.end_date || new Date())
                          newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes))
                          const formattedDate = newDate.toISOString()
                          setNewEvent({ ...newEvent, end_date: formattedDate })
                          if (newEvent.start_date) {
                            fetchAvailableAgents(newEvent.start_date, formattedDate)
                          }
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              {errors.end_date && <p className="text-red-500 text-sm mt-1">{errors.end_date}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="text-green-500" />
                <Select
                  onValueChange={(value) => {
                    const agentId = Number(value) // Transformation explicite en number
                    const updatedAgents = newEvent.agents.includes(agentId)
                      ? newEvent.agents
                      : [...newEvent.agents, agentId]

                    setNewEvent({ ...newEvent, agents: updatedAgents })
                    setErrors({ ...errors, agents: validateField("agents", updatedAgents) })
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionnez les agents" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.agents && <p className="text-red-500 text-sm mt-1">{errors.agents}</p>}
              {/* Affichage des agents sélectionnés */}
              <div className="mt-2">
                Agents sélectionnés :{" "}
                {newEvent.agents
                  .map((id) => {
                    const agent = availableAgents.find((agent) => agent.id === id)
                    return agent ? agent.username : ""
                  })
                  .join(", ")}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-6">
            <Button onClick={addEvent} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
              {loading ? "En cours..." : "Ajouter l'événement"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-green-600 text-white dark:bg-green-800">
          <CardTitle className="text-2xl font-bold">Liste des Événements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-100 dark:bg-green-900">
                  {["Localisation", "Entreprise", "Code", "Date de début", "Date de fin", "Agents"].map((header) => (
                    <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                    <TableCell>{event.location}</TableCell>
                    <TableCell>{event.company_name}</TableCell>
                    <TableCell>{event.event_code}</TableCell>
                    <TableCell>{format(new Date(event.start_date), "Pp", { locale: fr })}</TableCell>
                    <TableCell>{format(new Date(event.end_date), "Pp", { locale: fr })}</TableCell>
                    <TableCell>
                      {event.agents.length > 0 ? (
                        event.agents.map((agentId) => {
                          const agent = availableAgents.find((a) => a.id === agentId)
                          return (
                            <Badge
                              key={agentId} // Utilisation de l'id de l'agent comme clé unique
                              className="m-1 bg-green-300 text-green-900 dark:bg-green-700 dark:text-white"
                            >
                              {agent ? agent.username : "Agent inconnu"}
                            </Badge>
                          )
                        })
                      ) : (
                        <Badge className="m-1 bg-gray-300 text-gray-700 dark:bg-green-700 dark:text-white">
                          Aucun agent assigné
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

