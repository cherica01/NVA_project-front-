"use client"

import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Building, Tag } from "lucide-react"

interface Event {
  id: number
  title: string
  location: string
  start_date: string
  end_date: string
}

interface EventDetailDialogProps {
  event: Event | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EventDetailDialog({ event, open, onOpenChange }: EventDetailDialogProps) {
  if (!event) return null

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "EEEE d MMMM yyyy", { locale: fr })
  }

  const formatTime = (dateString: string) => {
    return format(parseISO(dateString), "HH:mm", { locale: fr })
  }

  // Extraire le nom de l'entreprise et le code de l'événement du titre
  const [companyName, eventCode] = event.title.split(" - ")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-green-800">{event.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="flex items-start space-x-3">
            <Calendar className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Date</p>
              <p className="text-gray-600">
                {formatDate(event.start_date)}
                {formatDate(event.start_date) !== formatDate(event.end_date) && <> au {formatDate(event.end_date)}</>}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Clock className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Horaires</p>
              <p className="text-gray-600">
                {formatTime(event.start_date)} - {formatTime(event.end_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Lieu</p>
              <p className="text-gray-600">{event.location}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Building className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Entreprise</p>
              <p className="text-gray-600">{companyName}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Tag className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="font-medium">Code événement</p>
              <p className="text-gray-600">{eventCode}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button onClick={() => onOpenChange(false)}>Fermer</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

