"use client"

import { useState, useEffect } from "react"
import { Calendar, CreditCard, Users, TrendingUp, Activity, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"

// Types pour les données du backend
interface DashboardStats {
  total_agents: number
  active_agents: number
  total_events: number
  ongoing_events: number
  upcoming_events: number
  total_payments: number
  presence_rate: number
  unread_notifications: number
  unread_messages: number
}

interface RecentEvent {
  id: number
  location: string
  company_name: string
  event_code: string
  start_date: string
  end_date: string
  status: "upcoming" | "ongoing" | "completed"
  agents_count: number
}

interface RecentPayment {
  id: number
  agent: string
  amount: number
  work_days?: number
  type: "credit" | "debit"
  created_at: string
}

interface PaymentChartData {
  month: string
  amount: number
}

export default function Dashboard() {
  // États pour stocker les données
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([])
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [paymentChartData, setPaymentChartData] = useState<PaymentChartData[]>([])
  
  // États pour gérer le chargement et les erreurs
  const [loading, setLoading] = useState({
    stats: true,
    events: true,
    payments: true,
    chart: true
  })
  const [error, setError] = useState<string | null>(null)

  // Fonction pour récupérer les statistiques générales
  const fetchStats = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré")

      const response = await fetch(`${apiUrl}/dashboard/admin/stats/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des statistiques: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err)
      setError("Impossible de charger les statistiques du tableau de bord")
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }

  // Fonction pour récupérer les événements récents
  const fetchRecentEvents = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré")

      const response = await fetch(`${apiUrl}/dashboard/admin/recent-events/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des événements: ${response.status}`)
      }

      const data = await response.json()
      setRecentEvents(data)
    } catch (err) {
      console.error("Erreur lors du chargement des événements récents:", err)
      setError("Impossible de charger les événements récents")
    } finally {
      setLoading(prev => ({ ...prev, events: false }))
    }
  }

  // Fonction pour récupérer les paiements récents
  const fetchRecentPayments = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré")

      const response = await fetch(`${apiUrl}/dashboard/admin/recent-payments/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des paiements: ${response.status}`)
      }

      const data = await response.json()
      setRecentPayments(data)
    } catch (err) {
      console.error("Erreur lors du chargement des paiements récents:", err)
      setError("Impossible de charger les paiements récents")
    } finally {
      setLoading(prev => ({ ...prev, payments: false }))
    }
  }

  // Fonction pour récupérer les données du graphique
  const fetchPaymentChartData = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) throw new Error("Token invalide ou expiré")

      const response = await fetch(`${apiUrl}/dashboard/admin/payment-chart/`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des données du graphique: ${response.status}`)
      }

      const data = await response.json()
      setPaymentChartData(data)
    } catch (err) {
      console.error("Erreur lors du chargement des données du graphique:", err)
      setError("Impossible de charger les données du graphique")
    } finally {
      setLoading(prev => ({ ...prev, chart: false }))
    }
  }

  // Charger toutes les données au chargement du composant
  useEffect(() => {
    fetchStats()
    fetchRecentEvents()
    fetchRecentPayments()
    fetchPaymentChartData()
  }, [])

  // Fonction pour afficher un statut d'événement en français
  const getEventStatusLabel = (status: string) => {
    switch (status) {
      case "ongoing": return "En cours"
      case "upcoming": return "À venir"
      case "completed": return "Terminé"
      default: return status
    }
  }

  // Fonction pour obtenir la classe CSS du statut
  const getEventStatusClass = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-green-100 text-green-800"
      case "upcoming": return "bg-blue-100 text-blue-800"
      case "completed": return "bg-gray-100 text-gray-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-gray-800 dark:text-white">Tableau de Bord NVA</h2>

          {/* Afficher les erreurs s'il y en a */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Agents Actifs</CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                {loading.stats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.active_agents || 0}</div>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      sur {stats?.total_agents || 0} agents
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Événements en Cours
                </CardTitle>
                <Calendar className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                {loading.stats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.ongoing_events || 0}</div>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      {stats?.upcoming_events || 0} à venir
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Prochain Paiement
                </CardTitle>
                <CreditCard className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                {loading.stats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">
                      {new Date().getDate() > 19 
                        ? format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 9), "d MMM", { locale: fr })
                        : format(new Date(new Date().getFullYear(), new Date().getMonth(), 9), "d MMM", { locale: fr })}
                    </div>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">Chaque 9 du mois</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Taux de Présence</CardTitle>
                <Activity className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                {loading.stats ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <div className="text-3xl font-bold text-gray-800 dark:text-white">{stats?.presence_rate || 0}%</div>
                    <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      Ce mois-ci
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts and Tables Grid */}
          <div className="mt-4 sm:mt-6 grid gap-4 sm:gap-6 lg:grid-cols-2">
            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                  Historique Global des Paiements des Agents
                </CardTitle>
                <CardDescription className="text-sm">Montants versés sur les 8 derniers mois</CardDescription>
              </CardHeader>
              <CardContent>
                {loading.chart ? (
                  <div className="h-[300px] w-full flex items-center justify-center">
                    <Skeleton className="h-[250px] w-full" />
                  </div>
                ) : (
                  <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={paymentChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: "#22c55e", strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Événements en Cours */}
            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                  Événements en Cours
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                {loading.events ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Nom de l'Événement</TableHead>
                          <TableHead className="w-[20%]">Date</TableHead>
                          <TableHead className="w-[20%] hidden sm:table-cell">Agents</TableHead>
                          <TableHead className="w-[20%]">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentEvents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              Aucun événement à afficher
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentEvents.map((event) => (
                            <TableRow key={event.id}>
                              <TableCell className="font-medium">{event.company_name}</TableCell>
                              <TableCell>
                                {format(new Date(event.start_date), "dd/MM")} - {format(new Date(event.end_date), "dd/MM")}
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">{event.agents_count}</TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getEventStatusClass(event.status)}`}
                                >
                                  {getEventStatusLabel(event.status)}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique des Paiements */}
            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
                  Historique des Paiements
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 sm:p-4">
                {loading.payments ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[25%]">Date</TableHead>
                          <TableHead className="w-[20%]">Type</TableHead>
                          <TableHead className="w-[20%]">Montant</TableHead>
                          <TableHead className="w-[35%] hidden sm:table-cell">Agent</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentPayments.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4">
                              Aucun paiement à afficher
                            </TableCell>
                          </TableRow>
                        ) : (
                          recentPayments.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell>{format(new Date(payment.created_at), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <span
                                  className={`flex items-center ${payment.type === "credit" ? "text-green-600" : "text-red-600"}`}
                                >
                                  {payment.type === "credit" ? (
                                    <ArrowUpCircle className="mr-1 h-4 w-4" />
                                  ) : (
                                    <ArrowDownCircle className="mr-1 h-4 w-4" />
                                  )}
                                  {payment.type === "credit" ? "Crédit" : "Débit"}
                                </span>
                              </TableCell>
                              <TableCell>{Math.abs(payment.amount).toFixed(2)} €</TableCell>
                              <TableCell className="hidden sm:table-cell">{payment.agent}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}