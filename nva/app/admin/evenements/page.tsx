"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CalendarIcon, MapPin, Briefcase, Hash, Users, Pencil, Trash2, AlertCircle } from "lucide-react"
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isValid, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
  const [allAgents, setAllAgents] = useState<Agent[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({})
  const [loading, setLoading] = useState(false)
  const [fetchingEvents, setFetchingEvents] = useState(true)
  const [fetchingAgents, setFetchingAgents] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteEventId, setDeleteEventId] = useState<number | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    fetchEvents()
    fetchAllAgents()
  }, [])

  // 1. Récupération des événements - Utilise l'endpoint EventListView
  const fetchEvents = async () => {
    setFetchingEvents(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      // Endpoint exact: EventListView - GET /api/event/
      const response = await fetch(`${apiUrl}/event/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors du chargement des événements.")
      }

      const data: Event[] = await response.json()
      setEvents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setFormError(errorMessage)
      console.error("Erreur lors du chargement des événements:", errorMessage)
    } finally {
      setFetchingEvents(false)
    }
  }

  // 2. Récupération de tous les agents
  const fetchAllAgents = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      // Endpoint pour récupérer tous les agents
      const response = await fetch(`${apiUrl}/accounts/agents/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors du chargement des agents.")
      }

      const data: Agent[] = await response.json()
      setAllAgents(data)
    } catch (err) {
      console.error("Erreur lors du chargement de tous les agents:", err)
    }
  }

  // 3. Récupération des agents disponibles - Utilise l'endpoint AvailableAgentsView
  const fetchAvailableAgents = async (start: string, end: string) => {
    if (!start || !end) return

    setFetchingAgents(true)
    try {
      console.log(`📡 Requête envoyée : start_date=${start}, end_date=${end}`)

      const formattedStart = start.split("T")[0]
      const formattedEnd = end.split("T")[0]

      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      // Endpoint exact: AvailableAgentsView - GET /api/event/available-agents/
      const response = await fetch(
        `${apiUrl}/event/available-agents/?start_date=${formattedStart}&end_date=${formattedEnd}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("❌ Erreur backend :", errorData)
        throw new Error(errorData.error || "Erreur lors du chargement des agents disponibles")
      }

      const data: Agent[] = await response.json()
      console.log(`✅ Agents disponibles reçus :`, data)
      setAvailableAgents(data)
    } catch (err) {
      console.error("❌ Erreur lors du chargement des agents disponibles :", err)
      setAvailableAgents([])
    } finally {
      setFetchingAgents(false)
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

  // 4. Ajout ou mise à jour d'un événement - Utilise CreateEventView ou UpdateEventView
  const addOrUpdateEvent = async () => {
    if (!validateForm()) return
    setLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      console.log("📤 Données envoyées :", JSON.stringify(newEvent, null, 2))

      // Endpoints exacts:
      // - CreateEventView - POST /api/event/create/
      // - UpdateEventView - PUT /api/event/update/<int:pk>/
      const url = editingEventId ? `${apiUrl}/event/update/${editingEventId}/` : `${apiUrl}/event/create/`
      const method = editingEventId ? "PUT" : "POST"

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newEvent),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || `Erreur lors de ${editingEventId ? "la modification" : "l'ajout"} de l'événement.`,
        )
      }

      const result: Event = await response.json()

      if (editingEventId) {
        setEvents(events.map((event) => (event.id === editingEventId ? result : event)))
        setFormSuccess("Événement modifié avec succès !")
      } else {
        setEvents([...events, result])
        setFormSuccess("Événement ajouté avec succès !")
      }

      resetForm()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setFormError(errorMessage)
      console.error("Erreur lors de l'ajout/modification de l'événement:", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteEvent = (id: number) => {
    setDeleteEventId(id)
    setShowDeleteDialog(true)
  }

  // 5. Suppression d'un événement - Utilise DeleteEventView
  const deleteEvent = async () => {
    if (!deleteEventId) return

    setLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      // Endpoint exact: DeleteEventView - DELETE /api/event/delete/<int:pk>/
      const response = await fetch(`${apiUrl}/event/delete/${deleteEventId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Erreur lors de la suppression de l'événement.")
      }

      setEvents(events.filter((event) => event.id !== deleteEventId))
      setFormSuccess("Événement supprimé avec succès !")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setFormError(errorMessage)
      console.error("Erreur lors de la suppression de l'événement:", errorMessage)
    } finally {
      setLoading(false)
      setShowDeleteDialog(false)
      setDeleteEventId(null)
    }
  }

  // 6. Récupération des détails d'un événement pour l'édition
  const startEditing = (event: Event) => {
    setEditingEventId(event.id)
    setNewEvent({
      location: event.location,
      company_name: event.company_name,
      event_code: event.event_code,
      start_date: event.start_date,
      end_date: event.end_date,
      agents: event.agents,
    })
    fetchAvailableAgents(event.start_date, event.end_date)
    setIsEditing(true)
  }

  const resetForm = () => {
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
    setEditingEventId(null)
    setIsEditing(false)
  }

  // Fonction pour obtenir le nom d'un agent à partir de son ID
  const getAgentName = (agentId: number): string => {
    const agent = allAgents.find((a) => a.id === agentId)
    return agent ? agent.username : "Agent inconnu"
  }

  // Fonction pour formater une date ISO en format lisible
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString)
      if (!isValid(date)) return "Date invalide"
      return format(date, "Pp", { locale: fr })
    } catch (error) {
      console.error("Erreur de formatage de date:", error)
      return "Date invalide"
    }
  }

  // Fonction pour supprimer un agent de la liste des agents sélectionnés
  const removeAgent = (agentId: number) => {
    setNewEvent({
      ...newEvent,
      agents: newEvent.agents.filter((id) => id !== agentId),
    })
  }

  // Effet pour effacer les messages de succès après 5 secondes
  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => {
        setFormSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [formSuccess])

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">
            {isEditing ? "Modifier l'Événement" : "Gestion des Événements"}
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {formSuccess && (
            <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
              <AlertDescription>{formSuccess}</AlertDescription>
            </Alert>
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
                      {newEvent.start_date ? formatDate(newEvent.start_date) : <span>Date et heure de début</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                  <div className="bg-white dark:bg-gray-800 rounded-md shadow-md">
  <Calendar
    mode="single"
    selected={newEvent.start_date ? new Date(newEvent.start_date) : undefined}
    onSelect={(date) => {
      if (date) {
        const now = new Date();
        date.setHours(now.getHours(), now.getMinutes());
        const formattedDate = date.toISOString();
        setNewEvent({ ...newEvent, start_date: formattedDate });
        setErrors({ ...errors, start_date: validateField("start_date", formattedDate) });
        if (newEvent.end_date) {
          fetchAvailableAgents(formattedDate, newEvent.end_date);
        }
      }
    }}
    initialFocus
    className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-md"
  />
  <div className="p-3 border-t border-gray-200 dark:border-gray-600">
    <Input
      type="time"
      value={newEvent.start_date ? format(new Date(newEvent.start_date), "HH:mm") : ""}
      onChange={(e) => {
        const [hours, minutes] = e.target.value.split(":");
        const newDate = new Date(newEvent.start_date || new Date());
        newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes));
        const formattedDate = newDate.toISOString();
        setNewEvent({ ...newEvent, start_date: formattedDate });
        if (newEvent.end_date) {
          fetchAvailableAgents(formattedDate, newEvent.end_date);
        }
      }}
      className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-green-500"
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
            "w-full justify-start text-left font-normal bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600",
            !newEvent.end_date && "text-muted-foreground"
          )}
        >
          {newEvent.end_date ? formatDate(newEvent.end_date) : <span>Date et heure de fin</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md shadow-md"
        align="start"
      >
        <Calendar
          mode="single"
          selected={newEvent.end_date ? new Date(newEvent.end_date) : undefined}
          onSelect={(date) => {
            if (date) {
              const now = new Date();
              date.setHours(now.getHours(), now.getMinutes());
              const formattedDate = date.toISOString();
              setNewEvent({ ...newEvent, end_date: formattedDate });
              setErrors({ ...errors, end_date: validateField("end_date", formattedDate) });
              if (newEvent.start_date) {
                fetchAvailableAgents(newEvent.start_date, formattedDate);
              }
            }
          }}
          initialFocus
          className="bg-white dark:bg-gray-800 text-black dark:text-white rounded-t-md"
        />
        <div className="p-3 border-t border-gray-200 dark:border-gray-600">
          <Input
            type="time"
            value={newEvent.end_date ? format(new Date(newEvent.end_date), "HH:mm") : ""}
            onChange={(e) => {
              const [hours, minutes] = e.target.value.split(":");
              const newDate = new Date(newEvent.end_date || new Date());
              newDate.setHours(Number.parseInt(hours), Number.parseInt(minutes));
              const formattedDate = newDate.toISOString();
              setNewEvent({ ...newEvent, end_date: formattedDate });
              if (newEvent.start_date) {
                fetchAvailableAgents(newEvent.start_date, formattedDate);
              }
            }}
            className="bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600 focus:ring-green-500"
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
    const agentId = Number(value);
    // Éviter les doublons
    if (!newEvent.agents.includes(agentId)) {
      const updatedAgents = [...newEvent.agents, agentId];
      setNewEvent({ ...newEvent, agents: updatedAgents });
      setErrors({ ...errors, agents: validateField("agents", updatedAgents) });
    }
  }}
  disabled={fetchingAgents || !newEvent.start_date || !newEvent.end_date}
>
  <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600">
    <SelectValue
      placeholder={
        fetchingAgents
          ? "Chargement des agents..."
          : !newEvent.start_date || !newEvent.end_date
            ? "Sélectionnez d'abord les dates"
            : "Sélectionnez les agents"
      }
    />
  </SelectTrigger>
  <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-white">
    {availableAgents.length === 0 ? (
      <SelectItem value="no-agents" disabled className="text-black dark:text-white">
        Aucun agent disponible pour ces dates
      </SelectItem>
    ) : (
      availableAgents.map((agent) => (
        <SelectItem key={agent.id} value={agent.id.toString()}>
          {agent.username}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>
              </div>
              {errors.agents && <p className="text-red-500 text-sm mt-1">{errors.agents}</p>}

              {/* Affichage des agents sélectionnés avec possibilité de les supprimer */}
              <div className="mt-2">
                <p className="text-sm font-medium mb-2">Agents sélectionnés :</p>
                <div className="flex flex-wrap gap-2">
                  {newEvent.agents.length === 0 ? (
                    <p className="text-sm text-gray-500">Aucun agent sélectionné</p>
                  ) : (
                    newEvent.agents.map((agentId) => (
                      <Badge
                        key={agentId}
                        className="bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer flex items-center gap-1"
                        onClick={() => removeAgent(agentId)}
                      >
                        {getAgentName(agentId)}
                        <span className="ml-1">×</span>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-6">
            <Button
              onClick={addOrUpdateEvent}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? "En cours..." : isEditing ? "Modifier l'événement" : "Ajouter l'événement"}
            </Button>
            {isEditing && (
              <Button onClick={resetForm} className="bg-gray-500 hover:bg-gray-600 text-white">
                Annuler la modification
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-green-600 text-white dark:bg-green-800">
          <CardTitle className="text-2xl font-bold">Liste des Événements</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingEvents ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des événements...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucun événement trouvé. Créez votre premier événement !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-100 dark:bg-green-900">
                    {["Localisation", "Entreprise", "Code", "Date de début", "Date de fin", "Agents", "Actions"].map(
                      (header) => (
                        <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                          {header}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => (
                    <TableRow key={event.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                      <TableCell>{event.location}</TableCell>
                      <TableCell>{event.company_name}</TableCell>
                      <TableCell>{event.event_code}</TableCell>
                      <TableCell>{formatDate(event.start_date)}</TableCell>
                      <TableCell>{formatDate(event.end_date)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {event.agents.length > 0 ? (
                            event.agents.map((agentId) => (
                              <Badge
                                key={agentId}
                                className="bg-green-300 text-green-900 dark:bg-green-700 dark:text-white"
                              >
                                {getAgentName(agentId)}
                              </Badge>
                            ))
                          ) : (
                            <Badge className="bg-gray-300 text-gray-700 dark:bg-green-700 dark:text-white">
                              Aucun agent assigné
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => startEditing(event)}
                            className="bg-blue-500 hover:bg-blue-600 text-white"
                            size="sm"
                          >
                            <Pencil className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            onClick={() => confirmDeleteEvent(event.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogue de confirmation de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet événement ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;événement sera définitivement supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteEvent} className="bg-red-500 hover:bg-red-600 text-white">
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

