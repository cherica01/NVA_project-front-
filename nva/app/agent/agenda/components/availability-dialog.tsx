"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, CheckCircle, XCircle } from "lucide-react"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"

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

interface AvailabilityDialogProps {
  day: Day | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAvailabilityUpdated: () => void
}

export default function AvailabilityDialog({
  day,
  open,
  onOpenChange,
  onAvailabilityUpdated,
}: AvailabilityDialogProps) {
  const [isAvailable, setIsAvailable] = useState(day?.is_available ?? true)
  const [note, setNote] = useState(day?.note ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  if (!day) return null

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE d MMMM yyyy", { locale: fr })
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        setError("Votre session a expiré. Veuillez vous reconnecter.")
        return
      }

      const response = await fetch(`${apiUrl}/agenda/agent/availability/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          date: day.date,
          is_available: isAvailable,
          note: note || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la disponibilité")
      }

      setSuccess("Disponibilité mise à jour avec succès")
      onAvailabilityUpdated()

      // Fermer la boîte de dialogue après un court délai
      setTimeout(() => {
        onOpenChange(false)
      }, 1500)
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la disponibilité:", error)
      setError("Impossible de mettre à jour la disponibilité")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            {formatDate(day.date)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {day.events.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Événements ({day.events.length})</h3>
              <div className="space-y-2">
                {day.events.map((event) => (
                  <div key={event.id} className="bg-green-50 p-3 rounded-md">
                    <p className="font-medium text-green-800">{event.title}</p>
                    <p className="text-sm text-gray-600">{event.location}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="availability">Disponibilité</Label>
                <p className="text-sm text-gray-500">Indiquez si vous êtes disponible à cette date</p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="availability" checked={isAvailable} onCheckedChange={setIsAvailable} />
                {isAvailable ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note (optionnelle)</Label>
              <Textarea
                id="note"
                placeholder="Ajoutez une note concernant votre disponibilité..."
                value={note || ""}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
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
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

