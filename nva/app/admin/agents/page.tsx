"use client"

import { apiUrl } from "../../../util/config"
import { getAccessToken } from "../../../util/biscuit"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, Phone, MapPin, Briefcase, Calendar, Users, Edit, Trash2, RefreshCw } from "lucide-react"
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Agent {
  id: number
  username: string
  password: string
  age: string
  gender: string
  location: string
  phone_number: string
  measurements: string
  date_joined?: string
}

export default function AdminAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [newAgent, setNewAgent] = useState<Omit<Agent, "id">>({
    username: "",
    password: "defaultpassword",
    age: "",
    gender: "",
    location: "",
    phone_number: "",
    measurements: "",
  })
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré.")

      const response = await fetch(`${apiUrl}/accounts/agents/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!response.ok) throw new Error("Erreur lors du chargement des agents.")
      const data: Agent[] = await response.json()
      setAgents(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setError(errorMessage)
    }
  }

  const validateField = (key: string, value: string): string | null => {
    if (!value.trim()) return `${key} est requis.`
    if (key === "age" && (isNaN(Number(value)) || Number(value) <= 0)) {
      return "L'âge doit être un nombre valide."
    }
    if (key === "phone_number" && !/^[0-9]{10}$/.test(value)) {
      return "Entrez un numéro valide (10 chiffres)"
    }
    return null
  }

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string | null } = {}
    Object.entries(newAgent).forEach(([key, value]) => {
      if (key !== "password") {
        const error = validateField(key, value)
        if (error) newErrors[key] = error
      }
    })
    setErrors(newErrors)
    const hasErrors = Object.values(newErrors).some((error) => error !== null)
    setFormError(hasErrors ? "Veuillez corriger les erreurs dans le formulaire." : null)
    return !hasErrors
  }

  const addAgent = async () => {
    if (!validateForm()) return
    setLoading(true)
    setFormError(null)
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/accounts/add-agent/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newAgent),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de l'ajout de l'agent.")
      }
      const result: Agent = await response.json()
      setAgents([...agents, { ...result, password: result.password }])
      setNewAgent({
        username: "",
        password: "defaultpassword",
        age: "",
        gender: "",
        location: "",
        phone_number: "",
        measurements: "",
      })
      setErrors({})
      setFormError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setFormError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const editAgent = (agent: Agent) => {
    setEditingAgent(agent)
  }

  const updateAgent = async () => {
    if (!editingAgent) return
    setLoading(true)
    setError(null)
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/accounts/${editingAgent.id}/update/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(editingAgent),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Erreur lors de la mise à jour.")
      }
      const updatedAgent: Agent = await response.json()
      setAgents(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)))
      setEditingAgent(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const cancelEdit = () => setEditingAgent(null)

  const deleteAgent = async (id: number) => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/accounts/${id}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      if (!response.ok) throw new Error("Erreur lors de la suppression de l'agent.")
      setAgents(agents.filter((agent) => agent.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue."
      setError(errorMessage)
    }
  }

  const regeneratePassword = async (id: number) => {
    try {
      const accessToken = await getAccessToken()
      const response = await fetch(`${apiUrl}/accounts/regenerate-password/${id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la régénération du mot de passe.")
      }
      setAgents((prevAgents) =>
        prevAgents.map((agent) => (agent.id === id ? { ...agent, password: result.password } : agent)),
      )
      alert("✅ Mot de passe régénéré avec succès : " + result.password)
    } catch (error) {
      console.error("Erreur front-end :", error)
      const errorMessage = error instanceof Error ? error.message : "❌ Échec de la régénération du mot de passe."
      alert(errorMessage)
    }
  }

  const GENDER_CHOICES = [
    { value: "Male", label: "Homme" },
    { value: "Female", label: "Femme" },
    { value: "Other", label: "Autre" },
  ]

  return (
    <div className="p-6 space-y-8 bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-none shadow-lg">
        <CardHeader className="bg-orange-800 text-white dark:bg-orange-950">
          <CardTitle className="text-3xl font-bold">Gestion des Agents</CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          {formError && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{formError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <User className="text-orange-500" />
                <Input
                  placeholder="Nom d'utilisateur"
                  value={editingAgent ? editingAgent.username : newAgent.username}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, username: val })
                    } else {
                      setNewAgent({ ...newAgent, username: val })
                      setErrors((prev) => ({
                        ...prev,
                        username: validateField("username", val),
                      }))
                    }
                  }}
                  className={`border-orange-300 focus:ring-orange-500 ${errors.username ? "border-red-500" : ""}`}
                />
                {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="text-orange-500" />
                <Input
                  placeholder="Âge"
                  value={editingAgent ? editingAgent.age : newAgent.age}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, age: val })
                    } else {
                      setNewAgent({ ...newAgent, age: val })
                      setErrors((prev) => ({
                        ...prev,
                        age: validateField("age", val),
                      }))
                    }
                  }}
                  className={`border-orange-300 focus:ring-orange-500 ${errors.age ? "border-red-500" : ""}`}
                />
                {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="text-orange-500" />
                <Select
                  value={editingAgent ? editingAgent.gender : newAgent.gender}
                  onValueChange={(val) => {
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, gender: val })
                    } else {
                      setNewAgent({ ...newAgent, gender: val })
                      setErrors((prev) => ({
                        ...prev,
                        gender: validateField("gender", val),
                      }))
                    }
                  }}
                >
                  <SelectTrigger className="w-full border-orange-300 focus:ring-orange-500">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_CHOICES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="text-orange-500" />
                <Input
                  placeholder="Localisation"
                  value={editingAgent ? editingAgent.location : newAgent.location}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, location: val })
                    } else {
                      setNewAgent({ ...newAgent, location: val })
                      setErrors((prev) => ({
                        ...prev,
                        location: validateField("location", val),
                      }))
                    }
                  }}
                  className={`border-orange-300 focus:ring-orange-500 ${errors.location ? "border-red-500" : ""}`}
                />
                {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Phone className="text-orange-500" />
                <Input
                  placeholder="Téléphone"
                  value={editingAgent ? editingAgent.phone_number : newAgent.phone_number}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, phone_number: val })
                    } else {
                      setNewAgent({ ...newAgent, phone_number: val })
                      setErrors((prev) => ({
                        ...prev,
                        phone_number: validateField("phone_number", val),
                      }))
                    }
                  }}
                  className={`border-orange-300 focus:ring-orange-500 ${errors.phone_number ? "border-red-500" : ""}`}
                />
                {errors.phone_number && <p className="text-red-500 text-sm mt-1">{errors.phone_number}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <Briefcase className="text-orange-500" />
                <Input
                  placeholder="Mesures"
                  value={editingAgent ? editingAgent.measurements : newAgent.measurements}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editingAgent) {
                      setEditingAgent({ ...editingAgent, measurements: val })
                    } else {
                      setNewAgent({ ...newAgent, measurements: val })
                      setErrors((prev) => ({
                        ...prev,
                        measurements: validateField("measurements", val),
                      }))
                    }
                  }}
                  className={`border-orange-300 focus:ring-orange-500 ${errors.measurements ? "border-red-500" : ""}`}
                />
                {errors.measurements && <p className="text-red-500 text-sm mt-1">{errors.measurements}</p>}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 mt-6">
            <Button
              onClick={editingAgent ? updateAgent : addAgent}
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? "En cours..." : editingAgent ? "Mettre à jour" : "Ajouter"}
            </Button>
            {editingAgent && (
              <Button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white">
                Annuler
              </Button>
            )}
          </div>

          {error && <p className="text-red-500 mt-4">{error}</p>}
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-orange-800 text-white dark:bg-orange-950">
          <CardTitle className="text-3xl font-bold">Liste des Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-orange-100 dark:bg-orange-900">
                  {[
                    "Nom d'utilisateur",
                    "Mot de passe",
                    "Date inscription",
                    "Âge",
                    "Genre",
                    "Localisation",
                    "Téléphone",
                    "Mesures",
                    "Actions",
                  ].map((header) => (
                    <TableHead key={header} className="text-orange-700 dark:text-orange-300 font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => (
                  <TableRow key={agent.id} className="hover:bg-orange-50 dark:hover:bg-orange-900/50">
                    <TableCell className="font-medium">{agent.username}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center">
                              {agent.password ? (
                                <Badge variant="outline" className="font-mono">
                                  {agent.password.substring(0, 8)}...
                                </Badge>
                              ) : (
                                <span className="text-xs text-gray-400">Non disponible</span>
                              )}
                              <Button
                                onClick={() => regeneratePassword(agent.id)}
                                size="icon"
                                variant="ghost"
                                className="ml-2"
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Cliquez pour régénérer le mot de passe</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      {agent.date_joined
                        ? new Intl.DateTimeFormat("fr-FR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          }).format(new Date(agent.date_joined))
                        : "N/A"}
                    </TableCell>
                    <TableCell>{agent.age}</TableCell>
                    <TableCell>{agent.gender}</TableCell>
                    <TableCell>{agent.location}</TableCell>
                    <TableCell>{agent.phone_number}</TableCell>
                    <TableCell>{agent.measurements}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => editAgent(agent)}
                          size="sm"
                          variant="outline"
                          className="bg-orange-100 text-orange-600 hover:bg-orange-200 dark:bg-orange-800 dark:text-orange-200 dark:hover:bg-orange-700"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Button>
                        <Button onClick={() => deleteAgent(agent.id)} size="sm" variant="destructive">
                          <Trash2 className="w-4 h-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
