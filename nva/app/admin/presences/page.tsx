"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Check, X, MapPin, Camera } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface PresenceRecord {
  id: number
  agent: string
  photo_url: string
  location: {
    latitude: number
    longitude: number
  }
  timestamp: string
  status: "pending" | "approved" | "rejected"
}

// Données factices pour la démonstration
const mockPresenceRecords: PresenceRecord[] = [
  {
    id: 1,
    agent: "Jean Dupont",
    photo_url: "https://picsum.photos/200",
    location: { latitude: 48.8566, longitude: 2.3522 },
    timestamp: "2023-06-15T09:30:00Z",
    status: "pending",
  },
  {
    id: 2,
    agent: "Marie Martin",
    photo_url: "https://picsum.photos/201",
    location: { latitude: 45.764, longitude: 4.8357 },
    timestamp: "2023-06-15T10:15:00Z",
    status: "approved",
  },
  {
    id: 3,
    agent: "Pierre Durand",
    photo_url: "https://picsum.photos/202",
    location: { latitude: 43.2965, longitude: 5.3698 },
    timestamp: "2023-06-15T08:45:00Z",
    status: "rejected",
  },
]

export default function PresenceManagement() {
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>(mockPresenceRecords)

  const updatePresenceStatus = (id: number, status: "approved" | "rejected") => {
    setPresenceRecords((prevRecords) =>
      prevRecords.map((record) => (record.id === id ? { ...record, status } : record)),
    )
  }

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">Gestion des Présences</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-green-100 dark:bg-green-900">
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Agent</TableHead>
                <TableHead className="text-green-700 dark:text-green-300 font-semibold">Photo</TableHead>
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
                    <div className="relative w-16 h-16">
                      <Image
                        src={record.photo_url || "/placeholder.svg"}
                        alt={`Photo de présence de ${record.agent}`}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-md"
                      />
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 bg-white/50"
                        onClick={() => window.open(record.photo_url, "_blank")}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps?q=${record.location.latitude},${record.location.longitude}`,
                          "_blank",
                        )
                      }
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Voir sur la carte
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
    </div>
  )
}

