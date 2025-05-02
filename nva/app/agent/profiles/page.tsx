"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { motion, AnimatePresence } from "framer-motion"
import { User, Camera, Upload, Trash2, Info, Save, X, Phone, MapPin, Calendar, Image as ImageIcon, Play } from "lucide-react"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"

interface Photo {
  id: number
  image: string
  image_url: string
  photo_type: "profile" | "cover" | "animation"
  uploaded_at: string
}

interface AgentProfile {
  id: number
  username: string
  first_name: string
  last_name: string
  email: string
  age: number | null
  gender: string | null
  location: string | null
  phone_number: string | null
  measurements: string | null
  total_payments: number
  date_joined: string
  photos: Photo[]
  profile_photo: Photo | null
  cover_photo: Photo | null
  animation_photo: Photo | null
}

export default function AgentProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<AgentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    age: "",
    gender: "",
    location: "",
    phone_number: "",
    measurements: "",
  })
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photoType, setPhotoType] = useState<"profile" | "cover" | "animation">("profile")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoToDelete, setPhotoToDelete] = useState<number | null>(null)
  const [enlargedPhoto, setEnlargedPhoto] = useState<Photo | null>(null)

  const handleAuthError = useCallback(() => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("")
  }, [router])

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/accounts/profile/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors du chargement du profil: ${response.status}`)
      }

      const data = await response.json()
      setProfile(data)
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        age: data.age?.toString() || "",
        gender: data.gender || "",
        location: data.location || "",
        phone_number: data.phone_number || "",
        measurements: data.measurements || "",
      })
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error)
      setError("Impossible de charger votre profil")
    } finally {
      setLoading(false)
    }
  }, [handleAuthError])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const dataToSend = {
        ...formData,
        age: formData.age ? Number.parseInt(formData.age) : null,
      }

      const response = await fetch(`${apiUrl}/accounts/profile/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors de la mise à jour du profil: ${response.status}`)
      }

      const updatedProfile = await response.json()
      setProfile(updatedProfile)
      setSuccess("Profil mis à jour avec succès")
      setEditMode(false)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error)
      setError("Impossible de mettre à jour votre profil")
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const formData = new FormData()
      formData.append("image", selectedFile)
      formData.append("photo_type", photoType)

      const response = await fetch(`${apiUrl}/accounts/profile/upload-photo/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      })

      if (!response.ok) {
        console.error(`Erreur lors du téléchargement de la photo: ${response.status}`)
        const errorText = await response.text()
        console.error(`Détails de l'erreur:`, errorText)
        throw new Error(`Erreur lors du téléchargement de la photo: ${response.status}`)
      }

      await fetchProfile()
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setPreviewUrl(null)
      setSuccess(`Photo de ${getPhotoTypeLabel(photoType)} téléchargée avec succès`)
    } catch (error) {
      console.error("Erreur lors du téléchargement de la photo:", error)
      setError("Impossible de télécharger la photo")
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async (photoId: number) => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/accounts/profile/delete-photo/${photoId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) {
        console.error(`Erreur lors de la suppression de la photo: ${response.status}`)
        const errorText = await response.text()
        console.error(`Détails de l'erreur:`, errorText)
        throw new Error(`Erreur lors de la suppression de la photo: ${response.status}`)
      }

      await fetchProfile()
      setSuccess("Photo supprimée avec succès")
    } catch (error) {
      console.error("Erreur lors de la suppression de la photo:", error)
      setError("Impossible de supprimer la photo")
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString)
      return format(date, "d MMMM yyyy", { locale: fr })
    } catch {
      return "Date inconnue"
    }
  }

  const getPhotoTypeLabel = (type: string) => {
    switch (type) {
      case "profile":
        return "profil"
      case "cover":
        return "couverture"
      case "animation":
        return "animation"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  return (
    <div className="p-6 min-h-screen bg-gray-200">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="backdrop-blur-lg bg-white/90 border-none shadow-lg">
          <CardHeader className="bg-green-800 text-white px-6 py-4">
            <CardTitle className="text-2xl font-bold flex items-center">
              <User className="mr-3 h-7 w-7" />
              Mon Profil
            </CardTitle>
            <CardDescription className="text-green-100">
              Consultez et modifiez vos informations personnelles
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="profile" className="w-full" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profil
                </TabsTrigger>
                <TabsTrigger value="photos" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <Camera className="h-4 w-4 mr-2" />
                  Photos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Informations personnelles</h2>
                  <Button
                    variant="outline"
                    onClick={() => setEditMode(!editMode)}
                    className={editMode ? "bg-red-50 text-red-600 hover:bg-red-100" : ""}
                  >
                    {editMode ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Annuler
                      </>
                    ) : (
                      "Modifier"
                    )}
                  </Button>
                </div>

                {!editMode ? (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Nom d&#39;utilisateur</p>
                            <p className="font-medium">{profile?.username}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Info className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Nom complet</p>
                            <p className="font-medium">
                              {profile?.first_name || profile?.last_name
                                ? `${profile?.first_name || ""} ${profile?.last_name || ""}`
                                : "Non renseigné"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Âge</p>
                            <p className="font-medium">{profile?.age || "Non renseigné"}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <User className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Genre</p>
                            <p className="font-medium">{profile?.gender || "Non renseigné"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 space-y-4">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Localisation</p>
                            <p className="font-medium">{profile?.location || "Non renseignée"}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Phone className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Téléphone</p>
                            <p className="font-medium">{profile?.phone_number || "Non renseigné"}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Info className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{profile?.email || "Non renseigné"}</p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-500 mr-3" />
                          <div>
                            <p className="text-sm text-gray-500">Membre depuis</p>
                            <p className="font-medium">
                              {profile?.date_joined ? formatDate(profile.date_joined) : "Date inconnue"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {profile?.measurements && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500 mb-1">Mensurations</p>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p>{profile.measurements}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">Prénom</Label>
                        <Input
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleInputChange}
                          placeholder="Votre prénom"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="last_name">Nom</Label>
                        <Input
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleInputChange}
                          placeholder="Votre nom"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Votre email"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="age">Âge</Label>
                        <Input
                          id="age"
                          name="age"
                          type="number"
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="Votre âge"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender">Genre</Label>
                        <Select
                          value={formData.gender || ""}
                          onValueChange={(value) => handleSelectChange("gender", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez votre genre" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Homme</SelectItem>
                            <SelectItem value="Female">Femme</SelectItem>
                            <SelectItem value="Other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Localisation</Label>
                        <Input
                          id="location"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="Votre localisation"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Téléphone</Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleInputChange}
                          placeholder="Votre numéro de téléphone"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="measurements">Mensurations</Label>
                      <Textarea
                        id="measurements"
                        name="measurements"
                        value={formData.measurements}
                        onChange={handleInputChange}
                        placeholder="Vos mensurations"
                        rows={4}
                      />
                    </div>

                    <div className="flex justify-end mt-4">
                      <Button onClick={handleSaveProfile} disabled={saving} className="bg-green-600 hover:bg-green-700">
                        {saving ? (
                          <div className="flex items-center">
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
                            Enregistrement...
                          </div>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Enregistrer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photos" className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Mes Photos</h2>
                  <Button onClick={() => setUploadDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Ajouter une photo
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gray-50 p-3">
                      <CardTitle className="text-md flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Photo de profil
                      </CardTitle>
                    </CardHeader>
                    <div className="relative h-48 bg-gray-100">
                      {profile?.profile_photo ? (
                        <>
                          <Image
                            src={profile.profile_photo.image_url || "/placeholder.svg"}
                            alt="Photo de profil"
                            layout="fill"
                            objectFit="cover"
                            className="cursor-pointer"
                            onClick={() => setEnlargedPhoto(profile.profile_photo)}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setPhotoToDelete(profile.profile_photo!.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <User className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">Aucune photo de profil</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setPhotoType("profile")
                              setUploadDialogOpen(true)
                            }}
                          >
                            Ajouter
                          </Button>
                        </div>
                      )}
                    </div>
                    {profile?.profile_photo && (
                      <CardFooter className="p-2 bg-gray-50 text-xs text-gray-500">
                        Ajoutée le {formatDate(profile.profile_photo.uploaded_at)}
                      </CardFooter>
                    )}
                  </Card>

                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gray-50 p-3">
                      <CardTitle className="text-md flex items-center">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Photo de couverture
                      </CardTitle>
                    </CardHeader>
                    <div className="relative h-48 bg-gray-100">
                      {profile?.cover_photo ? (
                        <>
                          <Image
                            src={profile.cover_photo.image_url || "/placeholder.svg"}
                            alt="Photo de couverture"
                            layout="fill"
                            objectFit="cover"
                            className="cursor-pointer"
                            onClick={() => setEnlargedPhoto(profile.cover_photo)}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setPhotoToDelete(profile.cover_photo!.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <ImageIcon className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">Aucune photo de couverture</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setPhotoType("cover")
                              setUploadDialogOpen(true)
                            }}
                          >
                            Ajouter
                          </Button>
                        </div>
                      )}
                    </div>
                    {profile?.cover_photo && (
                      <CardFooter className="p-2 bg-gray-50 text-xs text-gray-500">
                        Ajoutée le {formatDate(profile.cover_photo.uploaded_at)}
                      </CardFooter>
                    )}
                  </Card>

                  <Card className="overflow-hidden">
                    <CardHeader className="bg-gray-50 p-3">
                      <CardTitle className="text-md flex items-center">
                        <Play className="h-4 w-4 mr-2" />
                        Photo d&#39;animation
                      </CardTitle>
                    </CardHeader>
                    <div className="relative h-48 bg-gray-100">
                      {profile?.animation_photo ? (
                        <>
                          <Image
                            src={profile.animation_photo.image_url || "/placeholder.svg"}
                            alt="Photo d'animation"
                            layout="fill"
                            objectFit="cover"
                            className="cursor-pointer"
                            onClick={() => setEnlargedPhoto(profile.animation_photo)}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => setPhotoToDelete(profile.animation_photo!.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full">
                          <Play className="h-12 w-12 text-gray-300 mb-2" />
                          <p className="text-sm text-gray-500">Aucune photo d&#39;animation</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setPhotoType("animation")
                              setUploadDialogOpen(true)
                            }}
                          >
                            Ajouter
                          </Button>
                        </div>
                      )}
                    </div>
                    {profile?.animation_photo && (
                      <CardFooter className="p-2 bg-gray-50 text-xs text-gray-500">
                        Ajoutée le {formatDate(profile.animation_photo.uploaded_at)}
                      </CardFooter>
                    )}
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter une photo</DialogTitle>
            <DialogDescription>Téléchargez une nouvelle photo pour votre profil</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de photo</Label>
              <RadioGroup
                value={photoType}
                onValueChange={(value) => setPhotoType(value as "profile" | "cover" | "animation")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="profile" id="profile" />
                  <Label htmlFor="profile" className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Photo de profil
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cover" id="cover" />
                  <Label htmlFor="cover" className="flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Photo de couverture
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="animation" id="animation" />
                  <Label htmlFor="animation" className="flex items-center">
                    <Play className="h-4 w-4 mr-2" />
                    Photo d&#39;animation
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center justify-center">
              <Label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl || "/placeholder.svg"}
                      alt="Aperçu de la photo à télécharger"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">Cliquez pour sélectionner une image</p>
                  </div>
                )}
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                />
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleUploadPhoto}
              disabled={!selectedFile || uploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {uploading ? "Téléchargement..." : "Télécharger"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={photoToDelete !== null} onOpenChange={(open) => !open && setPhotoToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette photo ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPhotoToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (photoToDelete !== null) {
                  handleDeletePhoto(photoToDelete)
                  setPhotoToDelete(null)
                }
              }}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={enlargedPhoto !== null} onOpenChange={(open) => !open && setEnlargedPhoto(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] p-1 overflow-hidden">
          {enlargedPhoto && (
            <div className="relative w-full h-full max-h-[80vh] overflow-hidden">
              <Image
                src={enlargedPhoto.image_url || "/placeholder.svg"}
                alt="Photo agrandie"
                width={800}
                height={600}
                objectFit="contain"
                className="w-full h-full"
              />
              <Button
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 rounded-full p-2"
                size="icon"
                onClick={() => setEnlargedPhoto(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}