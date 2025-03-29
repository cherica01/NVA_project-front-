"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  MapPin,
  Camera,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Map,
  History,
  PlusCircle,
  Trash2,
  X,
} from "lucide-react"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { motion, AnimatePresence } from "framer-motion"

interface Presence {
  id: number
  agent: string
  timestamp: string
  status: string
  latitude: number | null
  longitude: number | null
  location_name: string | null
  notes: string | null
  photos: PresencePhoto[]
}

interface PresencePhoto {
  id: number
  photo: string
  uploaded_at: string
}

interface PhotoUpload {
  file: File
  preview: string
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

// Fonction pour vérifier si une valeur est un nombre valide
const isValidNumber = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return !isNaN(parsed)
  }

// Remplacer la fonction getPhotoUrl par celle-ci:
const getPhotoUrl = (photoPath: string | null): string => {
  if (!photoPath) return "/placeholder.svg"

  // Si l'URL est déjà complète (commence par http ou https), la retourner telle quelle
  if (photoPath.startsWith("http")) return photoPath

  // Si l'URL commence par /media, il s'agit d'un chemin relatif à la racine du serveur Django
  if (photoPath.startsWith("/media")) {
    // Extraire le domaine de l'API URL
    const apiDomain = (apiUrl ?? "").split("/").slice(0, 3).join("/")
    return `${apiDomain}${photoPath}`
  }

  // Sinon, préfixer avec l'URL de l'API complète
  return `${apiUrl}${photoPath}`
}

// Ajouter cette fonction pour le débogage des URLs
const logPhotoUrls = (presence: Presence) => {
  if (presence.photos && presence.photos.length > 0) {
    console.log("URLs des photos pour la présence", presence.id)
    presence.photos.forEach((photo, index) => {
      console.log(`Photo ${index + 1}:`, photo.photo)
      console.log(`URL transformée:`, getPhotoUrl(photo.photo))
    })
  }
}

export default function AgentPresencePage() {
  const router = useRouter()
  const [presences, setPresences] = useState<Presence[]>([])
  const [selectedPresence, setSelectedPresence] = useState<Presence | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [locationName, setLocationName] = useState("")
  const [notes, setNotes] = useState("")
  const [photoUploads, setPhotoUploads] = useState<PhotoUpload[]>([])
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("submit")
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Ajouter un état pour afficher les URLs brutes pour le débogage
  const [showRawUrls, setShowRawUrls] = useState(false)

  const handleAuthError = () => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/login")
  }

  useEffect(() => {
    const fetchPresences = async () => {
      setLoading(true)
      try {
        const accessToken = await getAccessToken()
        if (!accessToken) {
          handleAuthError()
          return
        }

        const response = await fetch(`${apiUrl}/presence/agent/`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })

        if (!response.ok) {
          if (response.status === 401) {
            handleAuthError()
            return
          }
          throw new Error(`Erreur lors du chargement des présences: ${response.status}`)
        }

        const data = await response.json()
        console.log("Présences récupérées:", data)

        // Log des URLs des photos pour le débogage
        if (data && data.length > 0) {
          data.forEach((presence: Presence) => logPhotoUrls(presence))
        }

        setPresences(data)
      } catch (error) {
        console.error("Erreur lors du chargement des présences:", error)
        setError("Impossible de charger vos données de présence")
      } finally {
        setLoading(false)
      }
    }
    fetchPresences()
    getCurrentLocation()
  }, [])

  // Effect to clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La géolocalisation n'est pas prise en charge par votre navigateur")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Limiter à 6 décimales pour éviter l'erreur de validation
        const latitude = Number.parseFloat(position.coords.latitude.toFixed(6))
        const longitude = Number.parseFloat(position.coords.longitude.toFixed(6))

        setCurrentLocation({
          latitude,
          longitude,
        })
        setLocationError(null)
        // Essayer d'obtenir le nom de l'emplacement à partir des coordonnées
        fetchLocationName(latitude, longitude)
      },
      (error) => {
        console.error("Erreur de géolocalisation:", error)
        setLocationError(
          "Impossible d'obtenir votre position actuelle. Veuillez vérifier vos paramètres de localisation.",
        )
      },
    )
  }

  const fetchLocationName = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      )
      if (response.ok) {
        const data = await response.json()
        if (data.display_name) {
          setLocationName(data.display_name)
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du nom de l'emplacement:", error)
      // Ne pas définir d'erreur ici, car ce n'est pas critique
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach((file) => {
        // Créer un aperçu de l'image
        const reader = new FileReader()
        reader.onloadend = () => {
          const preview = reader.result as string
          setPhotoUploads((current) => [
            ...current,
            {
              file,
              preview,
              progress: 0,
              status: "pending",
            },
          ])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotoUploads((current) => current.filter((_, i) => i !== index))
  }

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const uploadPhoto = async (presenceId: number, photo: File, index: number): Promise<boolean> => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return false
      }

      const formData = new FormData()
      formData.append("photo", photo)

      // Créer un XMLHttpRequest pour suivre la progression
      const xhr = new XMLHttpRequest()

      // Promesse pour gérer la réponse
      const uploadPromise = new Promise<boolean>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100)
            setPhotoUploads((current) =>
              current.map((item, i) => (i === index ? { ...item, progress, status: "uploading" } : item)),
            )
          }
        })

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setPhotoUploads((current) =>
              current.map((item, i) => (i === index ? { ...item, progress: 100, status: "success" } : item)),
            )
            resolve(true)
          } else {
            setPhotoUploads((current) =>
              current.map((item, i) =>
                i === index
                  ? {
                      ...item,
                      status: "error",
                      error: `Erreur ${xhr.status}: ${xhr.statusText}`,
                    }
                  : item,
              ),
            )
            reject(new Error(`Erreur ${xhr.status}: ${xhr.statusText}`))
          }
        })

        xhr.addEventListener("error", () => {
          setPhotoUploads((current) =>
            current.map((item, i) =>
              i === index
                ? {
                    ...item,
                    status: "error",
                    error: "Erreur réseau lors de l'upload",
                  }
                : item,
            ),
          )
          reject(new Error("Erreur réseau lors de l'upload"))
        })
      })

      // Configurer et envoyer la requête
      xhr.open("POST", `${apiUrl}/presence/${presenceId}/upload-photo/`)
      xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`)
      xhr.send(formData)

      return await uploadPromise
    } catch (error) {
      console.error(`Erreur lors de l'upload de la photo ${index}:`, error)
      setPhotoUploads((current) =>
        current.map((item, i) =>
          i === index
            ? {
                ...item,
                status: "error",
                error: error instanceof Error ? error.message : "Erreur inconnue",
              }
            : item,
        ),
      )
      return false
    }
  }

  const handleSubmitPresence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!currentLocation) {
      setError("Impossible de soumettre votre présence sans localisation")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)
    setDebugInfo(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      // Étape 1: Créer la présence
      // Assurez-vous que les coordonnées sont limitées à 6 décimales
      const presenceData = {
        latitude: Number.parseFloat(currentLocation.latitude.toFixed(6)),
        longitude: Number.parseFloat(currentLocation.longitude.toFixed(6)),
        location_name: locationName.trim() || "Emplacement non spécifié",
        notes: notes.trim(),
      }

      // Débogage: Afficher les données envoyées
      console.log("Données de présence envoyées:", presenceData)

      const presenceResponse = await fetch(`${apiUrl}/presence/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(presenceData),
      })

      // Débogage: Afficher la réponse brute
      const responseText = await presenceResponse.text()
      console.log("Réponse brute du serveur:", responseText)

      // Stocker les informations de débogage
      setDebugInfo({
        request: presenceData,
        responseStatus: presenceResponse.status,
        responseText: responseText,
      })

      if (!presenceResponse.ok) {
        if (presenceResponse.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors de la création de la présence: ${responseText}`)
      }

      // Convertir la réponse en JSON
      let presenceResult
      try {
        presenceResult = JSON.parse(responseText)
      } catch (e) {
        console.error("Erreur lors du parsing de la réponse JSON:", e)
        throw new Error("Réponse du serveur invalide")
      }

      console.log("Présence créée avec succès:", presenceResult)

      // Étape 2: Si des photos sont sélectionnées, les télécharger
      if (photoUploads.length > 0) {
        console.log(`Début de l'upload de ${photoUploads.length} photos`)

        // Upload des photos en séquence
        for (let i = 0; i < photoUploads.length; i++) {
          await uploadPhoto(presenceResult.id, photoUploads[i].file, i)
        }
      }

      // Réinitialiser le formulaire
      setLocationName("")
      setNotes("")
      setPhotoUploads([])

      // Rafraîchir la liste des présences
      const fetchPresences = async () => {
        setLoading(true)
        try {
          const accessToken = await getAccessToken()
          if (!accessToken) {
            handleAuthError()
            return
          }

          const response = await fetch(`${apiUrl}/presence/agent/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          })

          if (!response.ok) {
            if (response.status === 401) {
              handleAuthError()
              return
            }
            throw new Error(`Erreur lors du chargement des présences: ${response.status}`)
          }

          const data = await response.json()
          console.log("Présences récupérées:", data)

          // Log des URLs des photos pour le débogage
          if (data && data.length > 0) {
            data.forEach((presence: Presence) => logPhotoUrls(presence))
          }

          setPresences(data)
        } catch (error) {
          console.error("Erreur lors du chargement des présences:", error)
          setError("Impossible de charger vos données de présence")
        } finally {
          setLoading(false)
        }
      }
      fetchPresences()

      setSuccess("Présence soumise avec succès")
      setActiveTab("history")
    } catch (error) {
      console.error("Erreur lors de la soumission de la présence:", error)
      setError(error instanceof Error ? error.message : "Impossible de soumettre votre présence")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "d MMMM yyyy à HH:mm", { locale: fr })
    } catch (error) {
      return "Date invalide"
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approuvé
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejeté
          </Badge>
        )
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            En attente
          </Badge>
        )
    }
  }

  return (
    <div className="p-6 min-h-screen bg-gray-200">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="backdrop-blur-lg bg-white/90 border-none shadow-lg">
          <CardHeader className="bg-green-800 text-white px-6 py-4">
            <CardTitle className="text-2xl font-bold flex items-center">
              <MapPin className="mr-3 h-7 w-7" />
              Gestion des Présences
            </CardTitle>
            <CardDescription className="text-green-100">
              Enregistrez votre présence et consultez votre historique
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="submit" className="w-full" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="submit" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Soumettre une présence
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <History className="h-4 w-4 mr-2" />
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="submit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Enregistrer votre présence</CardTitle>
                    <CardDescription>
                      Utilisez ce formulaire pour enregistrer votre présence à un emplacement
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitPresence} className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-medium">Votre position actuelle</label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={getCurrentLocation}
                            className="flex items-center gap-1"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Actualiser
                          </Button>
                        </div>

                        {locationError ? (
                          <Alert variant="destructive" className="mt-2">
                            <AlertDescription>{locationError}</AlertDescription>
                          </Alert>
                        ) : currentLocation ? (
                          <div className="bg-gray-50 p-4 rounded-md">
                            <div className="flex items-center mb-2">
                              <MapPin className="h-5 w-5 text-green-600 mr-2" />
                              <span className="font-medium">Position détectée</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">
                              Latitude: {currentLocation.latitude.toFixed(6)}, Longitude:{" "}
                              {currentLocation.longitude.toFixed(6)}
                            </p>
                            <div className="h-40 bg-gray-200 rounded-md flex items-center justify-center relative overflow-hidden">
                              <iframe
                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLocation.longitude - 0.01}%2C${currentLocation.latitude - 0.01}%2C${currentLocation.longitude + 0.01}%2C${currentLocation.latitude + 0.01}&layer=mapnik&marker=${currentLocation.latitude}%2C${currentLocation.longitude}`}
                                className="absolute inset-0 w-full h-full border-0"
                              ></iframe>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 p-4 rounded-md flex items-center justify-center h-40">
                            <div className="text-center">
                              <Map className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500">Chargement de votre position...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="location_name" className="text-sm font-medium">
                          Nom de l'emplacement
                        </label>
                        <Input
                          id="location_name"
                          value={locationName}
                          onChange={(e) => setLocationName(e.target.value)}
                          placeholder="Entrez le nom de l'emplacement"
                          className="w-full"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="notes" className="text-sm font-medium">
                          Notes (optionnel)
                        </label>
                        <Textarea
                          id="notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ajoutez des notes supplémentaires si nécessaire"
                          className="w-full resize-none"
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Photos (optionnel)</label>
                        <div className="mt-1 flex items-center">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            multiple // Permettre la sélection de plusieurs fichiers
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={handleCameraClick}
                            className="flex items-center gap-2"
                          >
                            <Camera className="h-5 w-5" />
                            Ajouter des photos
                          </Button>
                          {photoUploads.length > 0 && (
                            <span className="ml-3 text-sm text-gray-500">
                              {photoUploads.length} photo(s) sélectionnée(s)
                            </span>
                          )}
                        </div>

                        {photoUploads.length > 0 && (
                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {photoUploads.map((upload, index) => (
                              <div key={index} className="relative bg-gray-50 p-2 rounded-md">
                                <div className="relative w-full h-32 bg-gray-100 rounded-md overflow-hidden">
                                  <img
                                    src={upload.preview || "/placeholder.svg"}
                                    alt={`Aperçu ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="mt-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs text-gray-500 truncate max-w-[80%]">
                                      {upload.file.name}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                                      onClick={() => handleRemovePhoto(index)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  {upload.status === "uploading" && (
                                    <div className="w-full">
                                      <Progress value={upload.progress} className="h-1" />
                                      <span className="text-xs text-gray-500">{upload.progress}%</span>
                                    </div>
                                  )}
                                  {upload.status === "success" && (
                                    <span className="text-xs text-green-500 flex items-center">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Téléchargé
                                    </span>
                                  )}
                                  {upload.status === "error" && (
                                    <span className="text-xs text-red-500 flex items-center">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      {upload.error || "Erreur"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        type="submit"
                        disabled={submitting || !currentLocation}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {submitting ? (
                          <span className="flex items-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Soumission en cours...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <CheckCircle className="mr-2 h-5 w-5" />
                            Soumettre ma présence
                          </span>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Historique des présences</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const fetchPresences = async () => {
                        setLoading(true)
                        try {
                          const accessToken = await getAccessToken()
                          if (!accessToken) {
                            handleAuthError()
                            return
                          }

                          const response = await fetch(`${apiUrl}/presence/agent/`, {
                            headers: { Authorization: `Bearer ${accessToken}` },
                          })

                          if (!response.ok) {
                            if (response.status === 401) {
                              handleAuthError()
                              return
                            }
                            throw new Error(`Erreur lors du chargement des présences: ${response.status}`)
                          }

                          const data = await response.json()
                          console.log("Présences récupérées:", data)

                          // Log des URLs des photos pour le débogage
                          if (data && data.length > 0) {
                            data.forEach((presence: Presence) => logPhotoUrls(presence))
                          }

                          setPresences(data)
                        } catch (error) {
                          console.error("Erreur lors du chargement des présences:", error)
                          setError("Impossible de charger vos données de présence")
                        } finally {
                          setLoading(false)
                        }
                      }
                      fetchPresences()
                    }}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Actualiser
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                  </div>
                ) : presences.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune présence enregistrée</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Vous n'avez pas encore soumis de présence. Utilisez l'onglet "Soumettre une présence" pour
                      enregistrer votre première présence.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {presences.map((presence) => (
                      <Card key={presence.id} className="overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                          <div className="flex items-center">
                            <Clock className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="font-medium">{formatDateTime(presence.timestamp)}</span>
                          </div>
                          {getStatusBadge(presence.status)}
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {presence.location_name && (
                              <div className="flex items-start">
                                <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                <div>
                                  <p className="font-medium">Emplacement</p>
                                  <p className="text-gray-600">{presence.location_name}</p>
                                </div>
                              </div>
                            )}

                            {presence.notes && (
                              <div className="flex items-start">
                                <AlertCircle className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                <div>
                                  <p className="font-medium">Notes</p>
                                  <p className="text-gray-600">{presence.notes}</p>
                                </div>
                              </div>
                            )}

                            {presence.photos && presence.photos.length > 0 && (
                              <div className="mt-3">
                                <p className="font-medium mb-2 flex items-center">
                                  <Camera className="h-5 w-5 text-gray-500 mr-2" />
                                  Photos ({presence.photos.length})
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                  {presence.photos.map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="relative h-32 bg-gray-100 rounded-md overflow-hidden cursor-pointer"
                                      onClick={() => setSelectedPresence(presence)}
                                    >
                                      <img
                                        src={getPhotoUrl(photo.photo) || "/placeholder.svg"}
                                        alt="Photo de présence"
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 p-3 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              logPhotoUrls(presence)
                              setSelectedPresence(presence)
                            }}
                          >
                            Voir les détails
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Affichage des informations de débogage */}
            {debugInfo && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Informations de débogage</h3>
                  <Button variant="ghost" size="sm" onClick={() => setDebugInfo(null)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="font-medium">Requête envoyée:</p>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">
                      {JSON.stringify(debugInfo.request, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="font-medium">Code de statut:</p>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">{debugInfo.responseStatus}</pre>
                  </div>
                  <div>
                    <p className="font-medium">Réponse du serveur:</p>
                    <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs">{debugInfo.responseText}</pre>
                  </div>
                </div>
              </div>
            )}

            {/* Affichage des messages d'erreur et de succès */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
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
                  transition={{ duration: 0.3 }}
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

      {/* Dialog pour afficher les détails d'une présence */}
      {selectedPresence && (
        <Dialog open={!!selectedPresence} onOpenChange={(open) => !open && setSelectedPresence(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              {/* Emplacement */}
              {selectedPresence.location_name && (
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    Emplacement
                  </h3>
                  <p className="text-gray-600">{selectedPresence.location_name}</p>

                  {selectedPresence.latitude && selectedPresence.longitude && (
                    <div className="h-60 bg-gray-200 rounded-md overflow-hidden mt-2">
                      <iframe
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedPresence.longitude - 0.01}%2C${selectedPresence.latitude - 0.01}%2C${selectedPresence.longitude + 0.01}%2C${selectedPresence.latitude + 0.01}&layer=mapnik&marker=${selectedPresence.latitude}%2C${selectedPresence.longitude}`}
                        className="w-full h-full border-0"
                      ></iframe>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {selectedPresence.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                    Notes
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{selectedPresence.notes}</p>
                </div>
              )}

              {/* Photos */}
              {selectedPresence.photos && selectedPresence.photos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Camera className="h-5 w-5 text-gray-500 mr-2" />
                    Photos ({selectedPresence.photos.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    {selectedPresence.photos.map((photo) => (
                      <div key={photo.id} className="bg-gray-100 rounded-md overflow-hidden">
                        <img
                          src={getPhotoUrl(photo.photo) || "/placeholder.svg"}
                          alt="Photo de présence"
                          className="w-full h-auto"
                        />
                        {showRawUrls && (
                          <div className="p-2 bg-gray-100 text-xs font-mono break-all">
                            <p>URL brute: {photo.photo}</p>
                            <p>URL transformée: {getPhotoUrl(photo.photo)}</p>
                          </div>
                        )}
                        <div className="p-2 bg-gray-50 text-xs text-gray-500">
                          Téléchargée le {formatDateTime(photo.uploaded_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DialogHeader>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setShowRawUrls(!showRawUrls)} className="text-xs">
                {showRawUrls ? "Masquer URLs" : "Afficher URLs"}
              </Button>
              <Button onClick={() => setSelectedPresence(null)} className="bg-green-600 hover:bg-green-700">
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

