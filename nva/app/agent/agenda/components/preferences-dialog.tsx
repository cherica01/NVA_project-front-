"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Settings, Plus, X } from "lucide-react"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"

interface AgentPreference {
  id: number
  preferred_locations: string | null
  preferred_event_types: string | null
  max_events_per_week: number
  max_events_per_month: number
  preferred_locations_list: string[]
  preferred_event_types_list: string[]
}

interface PreferencesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function PreferencesDialog({ open, onOpenChange }: PreferencesDialogProps) {
  const [preferences, setPreferences] = useState<AgentPreference | null>(null)
  const [locations, setLocations] = useState<string[]>([])
  const [eventTypes, setEventTypes] = useState<string[]>([])
  const [maxEventsPerWeek, setMaxEventsPerWeek] = useState(5)
  const [maxEventsPerMonth, setMaxEventsPerMonth] = useState(20)
  const [newLocation, setNewLocation] = useState("")
  const [newEventType, setNewEventType] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchPreferences()
    }
  }, [open])

  const fetchPreferences = async () => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Votre session a expiré. Veuillez vous reconnecter.")
        return
      }

      const response = await fetch(`${apiUrl}/agenda/agent/preferences/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des préférences")
      }

      const data = await response.json()
      setPreferences(data)
      setLocations(data.preferred_locations_list || [])
      setEventTypes(data.preferred_event_types_list || [])
      setMaxEventsPerWeek(data.max_events_per_week)
      setMaxEventsPerMonth(data.max_events_per_month)
    } catch (error) {
      console.error("Erreur lors du chargement des préférences:", error)
      setError("Impossible de charger vos préférences")
    } finally {
      setLoading(false)
    }
  }

  const handleAddLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()])
      setNewLocation("")
    }
  }

  const handleRemoveLocation = (location: string) => {
    setLocations(locations.filter((loc) => loc !== location))
  }

  const handleAddEventType = () => {
    if (newEventType.trim() && !eventTypes.includes(newEventType.trim())) {
      setEventTypes([...eventTypes, newEventType.trim()])
      setNewEventType("")
    }
  }

  const handleRemoveEventType = (eventType: string) => {
    setEventTypes(eventTypes.filter((type) => type !== eventType))
  }

  const handleSubmit = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Votre session a expiré. Veuillez vous reconnecter.")
        return
      }

      const response = await fetch(`${apiUrl}/agenda/agent/preferences/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          preferred_locations: locations.join(", "),
          preferred_event_types: eventTypes.join(", "),
          max_events_per_week: maxEventsPerWeek,
          max_events_per_month: maxEventsPerMonth,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des préférences")
      }

      setSuccess("Préférences mises à jour avec succès")

      // Fermer la boîte de dialogue après un court délai
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error("Erreur lors de la mise à jour des préférences:", error)
      setError("Impossible de mettre à jour vos préférences")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            Préférences
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="max-events-week">Nombre maximum d'événements par semaine</Label>
                <Input
                  id="max-events-week"
                  type="number"
                  min="1"
                  max="20"
                  value={maxEventsPerWeek}
                  onChange={(e) => setMaxEventsPerWeek(Number.parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="max-events-month">Nombre maximum d'événements par mois</Label>
                <Input
                  id="max-events-month"
                  type="number"
                  min="1"
                  max="50"
                  value={maxEventsPerMonth}
                  onChange={(e) => setMaxEventsPerMonth(Number.parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Lieux préférés</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {locations.map((location) => (
                    <div
                      key={location}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{location}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(location)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex mt-2">
                  <Input
                    placeholder="Ajouter un lieu préféré"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddLocation} className="ml-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Types d'événements préférés</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {eventTypes.map((eventType) => (
                    <div
                      key={eventType}
                      className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center"
                    >
                      <span>{eventType}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEventType(eventType)}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex mt-2">
                  <Input
                    placeholder="Ajouter un type d'événement préféré"
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleAddEventType} className="ml-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Enregistrement...
                  </>
                ) : (
                  "Enregistrer"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

