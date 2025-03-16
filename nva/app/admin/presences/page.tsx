"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Check, X, MapPin, Users, CheckCircle, XCircle, Clock } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import dynamic from "next/dynamic"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })

interface PresenceRecord {
  id: number
  agent: string
  photos: string[]
  location: {
    latitude: number
    longitude: number
    name: string
  }
  timestamp: string
  status: "pending" | "approved" | "rejected"
}

// Données factices pour la démonstration
const mockPresenceRecords: PresenceRecord[] = [
  {
    id: 1,
    agent: "Jean Dupont",
    photos: ["https://picsum.photos/200", "https://picsum.photos/201"],
    location: { latitude: 48.8566, longitude: 2.3522, name: "Paris, France" },
    timestamp: "2023-06-15T09:30:00Z",
    status: "pending",
  },
  {
    id: 2,
    agent: "Marie Martin",
    photos: ["https://picsum.photos/202", "https://picsum.photos/203"],
    location: { latitude: 45.764, longitude: 4.8357, name: "Lyon, France" },
    timestamp: "2023-06-15T10:15:00Z",
    status: "approved",
  },
  {
    id: 3,
    agent: "Pierre Durand",
    photos: ["https://picsum.photos/204"],
    location: { latitude: 43.2965, longitude: 5.3698, name: "Marseille, France" },
    timestamp: "2023-06-15T08:45:00Z",
    status: "rejected",
  },
]

export default function PresenceManagement() {
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>(mockPresenceRecords)
  const [selectedLocation, setSelectedLocation] = useState<PresenceRecord["location"] | null>(null)

  useEffect(() => {
    // Ici, vous feriez normalement un appel API pour récupérer les vraies données
    // setPresenceRecords(await fetchPresenceRecords())
  }, [])

  const updatePresenceStatus = (id: number, status: "approved" | "rejected") => {
    setPresenceRecords((prevRecords) =>
      prevRecords.map((record) => (record.id === id ? { ...record, status } : record)),
    )
    // Ici, vous feriez normalement un appel API pour mettre à jour le statut dans la base de données
  }

  const totalPresences = presenceRecords.length
  const approvedPresences = presenceRecords.filter((record) => record.status === "approved").length
  const rejectedPresences = presenceRecords.filter((record) => record.status === "rejected").length
  const pendingPresences = presenceRecords.filter((record) => record.status === "pending").length

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 min-h-screen">
      {/* Tableau de bord */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des présences</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPresences}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présences approuvées</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedPresences}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présences rejetées</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedPresences}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Présences en attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPresences}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">Gestion des Présences</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-green-100 dark:bg-green-900">
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Agent</TableHead>
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Photos</TableHead>
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Localisation</TableHead>
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Date et Heure</TableHead>
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Statut</TableHead>
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {presenceRecords.map((record) => (
                <TableRow key={record.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                  <TableCell>{record.agent}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {record.photos.map((photo, index) => (
                        <Dialog key={index}>
                          <DialogTrigger asChild>
                            <div className="relative w-16 h-16 cursor-pointer">
                              <Image
                                src={photo || "/placeholder.svg"}
                                alt={`Photo ${index + 1} de ${record.agent}`}
                                layout="fill"
                                objectFit="cover"
                                className="rounded-md"
                              />
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <Image
                              src={photo || "/placeholder.svg"}
                              alt={`Photo ${index + 1} de ${record.agent} en plein écran`}
                              width={800}
                              height={600}
                              layout="responsive"
                            />
                          </DialogContent>
                        </Dialog>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setSelectedLocation(record.location)}>
                      <MapPin className="h-4 w-4 mr-2" />
                      {record.location.name}
                    </Button>
                  </TableCell>
                  <TableCell>{format(new Date(record.timestamp), "Pp", { locale: fr })}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        record.status === "approved"
                          ? "bg-green-500"
                          : record.status === "rejected"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                      }
                    >
                      {record.status === "approved"
                        ? "Approuvé"
                        : record.status === "rejected"
                          ? "Rejeté"
                          : "En attente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updatePresenceStatus(record.id, "approved")}
                        disabled={record.status !== "pending"}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updatePresenceStatus(record.id, "rejected")}
                        disabled={record.status !== "pending"}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedLocation && (
        <Dialog open={!!selectedLocation} onOpenChange={() => setSelectedLocation(null)}>
          <DialogContent className="max-w-3xl">
            <div className="h-[400px] w-full">
              <MapContainer
                center={[selectedLocation.latitude, selectedLocation.longitude]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
              </MapContainer>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

