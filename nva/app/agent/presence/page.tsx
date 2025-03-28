"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  RefreshCw,
import { motion, AnimatePresence } from "framer-motion"
import { Alert } from "@/app/components/alert"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false })

const customIcon = new L.Icon({
  iconUrl: "/custom-marker.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
})

interface Position {
  lat: number
  lng: number
}

const fetchLocationName = async (pos: Position) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`,
    )
    const data = await response.json()
    return data.display_name
  } catch {
    return "Emplacement inconnu"
  }
}

export default function AgentPresence() {
  const [position, setPosition] = useState<Position | null>(null)
  const [locationName, setLocationName] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCloseAlert = useCallback(() => {
    setAlert(null)
  }, [])

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setPosition(newPosition)
        const name = await fetchLocationName(newPosition)
        setLocationName(name)
        setIsLoading(false)
      },
      () => {
        setPosition({ lat: -18.9149, lng: 47.5316 })
        setLocationName("Antananarivo, Madagascar")
        setIsLoading(false)
        setAlert({
          message: "Impossible de récupérer votre position. Utilisation de la position par défaut.",
          type: "error",
        })
      },
    )
  }, [])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newPhotos = Array.from(e.target.files).map((file) => URL.createObjectURL(file))
      setPhotos((prev) => [...prev, ...newPhotos])
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // Simuler un appel API
      await new Promise((resolve) => setTimeout(resolve, 2000))
      console.log({ position, locationName, photos })
      setAlert({
        message: "Votre présence a été enregistrée avec succès !",
        type: "success",
      })
    } catch (error) {
      setAlert({
        message: "Une erreur est survenue lors de l'enregistrement de votre présence.",
        type: "error",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
      {alert && <Alert message={alert.message} type={alert.type} onClose={handleCloseAlert} />}
      <Card className="bg-white/50 dark:bg-green-950/30 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950 rounded-t-lg">
          <CardTitle className="text-3xl font-bold flex items-center">
            <MapPin className="mr-2" /> Enregistrer ma présence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="location" className="text-green-700 dark:text-green-300 text-lg font-semibold">
                Ma position
              </Label>
              <div className="h-[400px] rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full bg-green-100 dark:bg-green-900">
                    <Loader className="animate-spin text-green-600 h-12 w-12" />
                  </div>
                ) : position ? (
                  <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors"
                    />
                    <Marker position={position} icon={customIcon} />
                    <Button
                      className="absolute top-2 right-2 z-[1000] bg-white text-green-600 hover:bg-green-100"
                      onClick={() => setPosition(position)}
                      aria-label="Recentrer la carte"
                    >
                      <Crosshair className="mr-2" /> Recentrer
                    </Button>
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-green-100 dark:bg-green-900">
                    <p className="text-green-700 dark:text-green-300">Impossible de charger la carte</p>
                  </div>
                )}
              </div>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">Emplacement : {locationName}</p>
            </div>
            <div>
              <Label htmlFor="photo" className="text-green-700 dark:text-green-300 text-lg font-semibold">
                Photos
              </Label>
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-green-600 hover:bg-green-700 transition-colors duration-300"
              >
                <Camera className="mr-2" /> Ajouter des photos
              </Button>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                multiple
                className="hidden"
                ref={fileInputRef}
                aria-label="Sélectionner des photos"
              />
              <AnimatePresence>
                {photos.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4"
                  >
                    {photos.map((photo, i) => (
                      <motion.div
                        key={i}
                        className="relative group"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                      >
                        <img
                          src={photo || "/placeholder.svg"}
                          alt={`Photo ${i + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type="button"
                              className="absolute bottom-1 left-1 bg-white/70 hover:bg-white text-green-600 rounded-full p-1"
                              aria-label="Agrandir la photo"
                            >
                              <ZoomIn className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <img
                              src={photo || "/placeholder.svg"}
                              alt={`Photo ${i + 1} en plein écran`}
                              className="w-full h-auto"
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          type="button"
                          onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                          aria-label="Supprimer la photo"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 transition-colors duration-300"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="mr-2" /> Envoyer ma présence
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

