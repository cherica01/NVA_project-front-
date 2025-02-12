"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Check, X, MapPin, Camera } from "lucide-react"
import Image from "next/image"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"

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

export default function PresenceManagement() {
  const [presenceRecords, setPresenceRecords] = useState<PresenceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPresenceRecords()
  }, [])

  const fetchPresenceRecords = async () => {
    try {
      setLoading(true)
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      const response = await fetch(`${apiUrl}/admin/presence-records/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) throw new Error("Erreur lors du chargement des enregistrements de présence.")
      const data: PresenceRecord[] = await response.json()
      setPresenceRecords(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updatePresenceStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      const response = await fetch(`${apiUrl}/admin/presence-records/${id}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut de présence.")

      // Mise à jour locale de l'état
      setPresenceRecords((prevRecords) =>
        prevRecords.map((record) => (record.id === id ? { ...record, status } : record)),
      )
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setError(errorMessage)
    }
  }

  if (loading) return <div className="text-center p-4">Chargement des enregistrements de présence...</div>
  if (error) return <div className="text-center p-4 text-red-500">{error}</div>

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

