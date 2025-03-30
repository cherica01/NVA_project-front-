"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Calendar, Users, MapPin, Phone, Ruler, Camera, Save } from "lucide-react"

interface AgentProfile {
  id: number
  username: string
  age: string
  gender: string
  location: string
  phone_number: string
  measurements: string
  date_joined?: string
  mainPhoto: string
  secondaryPhoto: string
}

export default function AgentProfilePage() {
  const [profile, setProfile] = useState<AgentProfile>({
    id: 1,
    username: "John Doe",
    age: "30",
    gender: "Male",
    location: "New York, USA",
    phone_number: "+1234567890",
    measurements: "180cm / 75kg",
    date_joined: "2023-01-01",
    mainPhoto: "/placeholder-user.jpg",
    secondaryPhoto: "/placeholder-user-2.jpg",
  })

  const [alert, setAlert] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const mainPhotoInputRef = useRef<HTMLInputElement>(null)
  const secondaryPhotoInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string, name: string) => {
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, photoType: "main" | "secondary") => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfile((prev) => ({
          ...prev,
          [photoType === "main" ? "mainPhoto" : "secondaryPhoto"]: reader.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Ici, vous ajouteriez la logique pour envoyer les données au backend
    console.log("Profile updated:", profile)
    setAlert({ message: "Profil mis à jour avec succès!", type: "success" })
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      {alert && <Alert message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="w-full max-w-4xl mx-auto">
          <CardHeader className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="text-3xl font-bold">Mon Profil</CardTitle>
          </CardHeader>
          <CardContent className="mt-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8 items-center justify-center">
                <div className="space-y-4">
                  <Avatar className="w-40 h-40 rounded-full overflow-hidden">
                    <AvatarImage src={profile.mainPhoto} alt="Photo de profil principale" />
                    <AvatarFallback>MP</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => mainPhotoInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Changer la photo principale
                  </Button>
                  <input
                    ref={mainPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, "main")}
                  />
                </div>
                <div className="space-y-4">
                  <Avatar className="w-40 h-40 rounded-full overflow-hidden">
                    <AvatarImage src={profile.secondaryPhoto} alt="Photo de profil secondaire" />
                    <AvatarFallback>SP</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => secondaryPhotoInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-4 w-4" /> Changer la photo secondaire
                  </Button>
                  <input
                    ref={secondaryPhotoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhotoChange(e, "secondary")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-lg font-semibold flex items-center">
                    <User className="mr-2" /> Nom d'utilisateur
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    value={profile.username}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-lg font-semibold flex items-center">
                    <Calendar className="mr-2" /> Âge
                  </Label>
                  <Input id="age" name="age" value={profile.age} onChange={handleInputChange} className="w-full" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-lg font-semibold flex items-center">
                    <Users className="mr-2" /> Genre
                  </Label>
                  <Select
                    name="gender"
                    value={profile.gender}
                    onValueChange={(value) => handleSelectChange(value, "gender")}
                  >
                    <SelectTrigger className="w-full">
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
                  <Label htmlFor="location" className="text-lg font-semibold flex items-center">
                    <MapPin className="mr-2" /> Localisation
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    value={profile.location}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-lg font-semibold flex items-center">
                    <Phone className="mr-2" /> Numéro de téléphone
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={profile.phone_number}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="measurements" className="text-lg font-semibold flex items-center">
                    <Ruler className="mr-2" /> Mensurations
                  </Label>
                  <Input
                    id="measurements"
                    name="measurements"
                    value={profile.measurements}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  Date d'inscription : {new Date(profile.date_joined || "").toLocaleDateString()}
                </p>
              </div>

              <Button type="submit" className="w-full bg-gradient-to-r from-green-400 to-blue-500 text-white">
                <Save className="mr-2 h-4 w-4" /> Enregistrer les modifications
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

