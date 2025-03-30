"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  History,
  BarChart,
  Users,
  Check,
  X,
  Clock,
  User,
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

interface DashboardStats {
  total_presences: number
  approved_presences: number
  rejected_presences: number
  pending_presences: number
  agent_stats: AgentStat[]
}

interface AgentStat {
  agent__username: string
  total: number
  approved: number
  rejected: number
  pending: number
}

// Fonction pour vérifier si une valeur est un nombre valide
const isValidNumber = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === "number") return !isNaN(value)
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    return !isNaN(parsed)
  }
  return false
}

// Fonction pour formater un nombre avec un nombre spécifique de décimales
const formatNumber = (value: any, decimals = 6): string => {
  if (!isValidNumber(value)) return "N/A"

  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return num.toFixed(decimals)
}

// Fonction pour obtenir l'URL complète d'une photo
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

export default function AdminPresencePage() {
  const router = useRouter()
  const [presences, setPresences] = useState<Presence[]>([])
  const [filteredPresences, setFilteredPresences] = useState<Presence[]>([])
  const [selectedPresence, setSelectedPresence] = useState<Presence | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [activeTab, setActiveTab] = useState("list")

  useEffect(() => {
    fetchPresences()
    fetchDashboardStats()
  }, [])

  // Effect to filter presences when search term or status filter changes
  useEffect(() => {
    if (presences.length > 0) {
      let filtered = [...presences]

      if (searchTerm) {
        filtered = filtered.filter(
          (presence) =>
            presence.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (presence.location_name && presence.location_name.toLowerCase().includes(searchTerm.toLowerCase())),
        )
      }

      if (statusFilter) {
        filtered = filtered.filter((presence) => presence.status === statusFilter)
      }

      setFilteredPresences(filtered)
    }
  }, [presences, searchTerm, statusFilter])

  // Effect to clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  const fetchPresences = async () => {
    setLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/presence/`, {
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
      setPresences(data)
      setFilteredPresences(data)
    } catch (error) {
      console.error("Erreur lors du chargement des présences:", error)
      setError("Impossible de charger les données de présence")
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    setDashboardLoading(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/presence/dashboard/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors du chargement des statistiques: ${response.status}`)
      }

      const data = await response.json()
      setDashboardStats(data)
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
      // Ne pas afficher d'erreur pour ne pas perturber l'interface principale
    } finally {
      setDashboardLoading(false)
    }
  }

  const updatePresenceStatus = async (presenceId: number, status: string) => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/presence/${presenceId}/update-status/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error(`Erreur lors de la mise à jour du statut: ${response.status}`)
      }

      // Mettre à jour la présence dans la liste
      const updatedPresences = presences.map((presence) =>
        presence.id === presenceId ? { ...presence, status } : presence,
      )
      setPresences(updatedPresences)

      // Mettre à jour la présence sélectionnée si elle est ouverte
      if (selectedPresence && selectedPresence.id === presenceId) {
        setSelectedPresence({ ...selectedPresence, status })
      }

      // Rafraîchir les statistiques
      fetchDashboardStats()

      setSuccess(`Statut mis à jour avec succès`)
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error)
      setError("Impossible de mettre à jour le statut")
    }
  }

  const handleAuthError = () => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/login")
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
              Administration des Présences
            </CardTitle>
            <CardDescription className="text-green-100">Gérez et validez les présences des agents</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="list" className="w-full" onValueChange={setActiveTab} value={activeTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="list" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <History className="h-4 w-4 mr-2" />
                  Liste des présences
                </TabsTrigger>
                <TabsTrigger
                  value="dashboard"
                  className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
                >
                  <BarChart className="h-4 w-4 mr-2" />
                  Tableau de bord
                </TabsTrigger>
              </TabsList>

              <TabsContent value="list" className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Rechercher par agent ou emplacement..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(null)}
                      className={statusFilter === null ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      Tous
                    </Button>
                    <Button
                      variant={statusFilter === "pending" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("pending")}
                      className={statusFilter === "pending" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
                    >
                      En attente
                    </Button>
                    <Button
                      variant={statusFilter === "approved" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("approved")}
                      className={statusFilter === "approved" ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      Approuvés
                    </Button>
                    <Button
                      variant={statusFilter === "rejected" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter("rejected")}
                      className={statusFilter === "rejected" ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      Rejetés
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      fetchPresences()
                      fetchDashboardStats()
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
                ) : filteredPresences.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune présence trouvée</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      {searchTerm || statusFilter
                        ? "Aucune présence ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                        : "Aucune présence n'a été enregistrée dans le système."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPresences.map((presence) => (
                      <Card key={presence.id} className="overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                          <div className="flex items-center">
                            <Users className="h-5 w-5 text-gray-500 mr-2" />
                            <span className="font-medium">{presence.agent}</span>
                          </div>
                          {getStatusBadge(presence.status)}
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 text-gray-500 mr-2" />
                              <span>{formatDateTime(presence.timestamp)}</span>
                            </div>

                            {presence.location_name && (
                              <div className="flex items-start">
                                <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                                <div>
                                  <p className="font-medium">Emplacement</p>
                                  <p className="text-gray-600">{presence.location_name}</p>
                                </div>
                              </div>
                            )}

                            {presence.photos && presence.photos.length > 0 && (
                              <div className="flex items-center">
                                <Camera className="h-5 w-5 text-gray-500 mr-2" />
                                <span>{presence.photos.length} photo(s) attachée(s)</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 p-3 flex justify-between">
                          <div className="flex gap-2">
                            {presence.status === "pending" && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updatePresenceStatus(presence.id, "approved")}
                                  className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approuver
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updatePresenceStatus(presence.id, "rejected")}
                                  className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Rejeter
                                </Button>
                              </>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedPresence(presence)}>
                            Voir les détails
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dashboard" className="space-y-6">
                {dashboardLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                  </div>
                ) : dashboardStats ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="bg-gray-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-gray-800">{dashboardStats.total_presences}</p>
                            <p className="text-sm text-gray-600 mt-1">Total des présences</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-green-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-700">{dashboardStats.approved_presences}</p>
                            <p className="text-sm text-green-600 mt-1">Présences approuvées</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-yellow-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-yellow-700">{dashboardStats.pending_presences}</p>
                            <p className="text-sm text-yellow-600 mt-1">Présences en attente</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-red-50">
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-red-700">{dashboardStats.rejected_presences}</p>
                            <p className="text-sm text-red-600 mt-1">Présences rejetées</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center">
                          <Users className="h-5 w-5 mr-2" />
                          Statistiques par agent
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-80">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-4">Agent</th>
                                <th className="text-center py-2 px-4">Total</th>
                                <th className="text-center py-2 px-4">Approuvées</th>
                                <th className="text-center py-2 px-4">En attente</th>
                                <th className="text-center py-2 px-4">Rejetées</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboardStats.agent_stats.map((stat, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-4">{stat.agent__username}</td>
                                  <td className="text-center py-3 px-4">{stat.total}</td>
                                  <td className="text-center py-3 px-4">
                                    <Badge className="bg-green-100 text-green-800">{stat.approved}</Badge>
                                  </td>
                                  <td className="text-center py-3 px-4">
                                    <Badge className="bg-yellow-100 text-yellow-800">{stat.pending}</Badge>
                                  </td>
                                  <td className="text-center py-3 px-4">
                                    <Badge className="bg-red-100 text-red-800">{stat.rejected}</Badge>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune donnée disponible</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                      Impossible de charger les statistiques du tableau de bord.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

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
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl">Détails de la présence</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4 overflow-y-auto pr-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gray-500 mr-2" />
                  <span className="font-medium">{selectedPresence.agent}</span>
                </div>
                {getStatusBadge(selectedPresence.status)}
              </div>

              <div className="flex items-center">
                <Clock className="h-5 w-5 text-gray-500 mr-2" />
                <span>{formatDateTime(selectedPresence.timestamp)}</span>
              </div>

              {selectedPresence.location_name && (
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    Emplacement
                  </h3>
                  <p className="text-gray-600">{selectedPresence.location_name}</p>

                  {selectedPresence.latitude !== null && selectedPresence.longitude !== null && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-2">
                        Latitude: {formatNumber(selectedPresence.latitude)}, Longitude:{" "}
                        {formatNumber(selectedPresence.longitude)}
                      </p>
                      <div className="h-60 bg-gray-200 rounded-md overflow-hidden relative">
                        <iframe
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(selectedPresence.longitude) - 0.005}%2C${Number(selectedPresence.latitude) - 0.005}%2C${Number(selectedPresence.longitude) + 0.005}%2C${Number(selectedPresence.latitude) + 0.005}&layer=mapnik&marker=${selectedPresence.latitude}%2C${selectedPresence.longitude}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: "none",
                            position: "absolute",
                            top: 0,
                            left: 0,
                          }}
                          allowFullScreen
                          loading="eager"
                          onLoad={(e) => {
                            console.log("Carte chargée dans le dialogue")
                            // Force un redimensionnement pour aider le rendu
                            const iframe = e.target as HTMLIFrameElement
                            if (iframe) {
                              setTimeout(() => {
                                const height = iframe.style.height
                                iframe.style.height = "0px"
                                setTimeout(() => {
                                  iframe.style.height = height
                                }, 10)
                              }, 100)
                            }
                          }}
                        ></iframe>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedPresence.notes && (
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
                    Notes
                  </h3>
                  <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{selectedPresence.notes}</p>
                </div>
              )}

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
                        <div className="p-2 bg-gray-50 text-xs text-gray-500">
                          Téléchargée le {formatDateTime(photo.uploaded_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-2">
              {selectedPresence.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      updatePresenceStatus(selectedPresence.id, "approved")
                      setSelectedPresence(null)
                    }}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approuver
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updatePresenceStatus(selectedPresence.id, "rejected")
                      setSelectedPresence(null)
                    }}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setSelectedPresence(null)} className="bg-green-600 hover:bg-green-700">
                  Fermer
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

