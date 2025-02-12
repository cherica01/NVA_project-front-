"use client"
import { Calendar, CreditCard, Users, TrendingUp, Activity, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const paymentData = [
  { month: "Jan", amount: 45000 },
  { month: "Fév", amount: 52000 },
  { month: "Mar", amount: 48000 },
  { month: "Avr", amount: 61000 },
  { month: "Mai", amount: 55000 },
  { month: "Juin", amount: 67000 },
  { month: "Juil", amount: 72000 },
  { month: "Aoû", amount: 58000 },
]

const paymentHistory = [
  { date: "2023-08-15", type: "Crédit", amount: 5000, agent: "Alice Dubois" },
  { date: "2023-08-14", type: "Débit", amount: 2000, agent: "Bob Martin" },
  { date: "2023-08-13", type: "Crédit", amount: 7500, agent: "Claire Leroy" },
  { date: "2023-08-12", type: "Débit", amount: 1000, agent: "David Moreau" },
  { date: "2023-08-11", type: "Crédit", amount: 6000, agent: "Emma Petit" },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <h2 className="text-2xl lg:text-3xl font-bold mb-6 text-gray-800 dark:text-white">Tableau de Bord NVA</h2>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Agents Actifs</CardTitle>
                <Users className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">186</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +12 ce mois
                </p>
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
                <div className="text-3xl font-bold text-gray-800 dark:text-white">8</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">3 débutent aujourd'hui</p>
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
                <div className="text-3xl font-bold text-gray-800 dark:text-white">19 Aoû</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">Dans 4 jours</p>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">Taux de Présence</CardTitle>
                <Activity className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 dark:text-white">95%</div>
                <p className="text-xs text-green-500 flex items-center gap-1 mt-1">+3% ce mois</p>
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
                <div className="h-[200px] sm:h-[250px] md:h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={paymentData}>
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
                      {[
                        {
                          name: "Lancement Produit X",
                          date: "15-17 Aoû",
                          agents: 25,
                          status: "En cours",
                        },
                        {
                          name: "Roadshow Tech Y",
                          date: "18-22 Aoû",
                          agents: 15,
                          status: "Préparation",
                        },
                        {
                          name: "Conférence Marketing",
                          date: "20 Aoû",
                          agents: 10,
                          status: "Bientôt",
                        },
                      ].map((event) => (
                        <TableRow key={event.name}>
                          <TableCell className="font-medium">{event.name}</TableCell>
                          <TableCell>{event.date}</TableCell>
                          <TableCell className="hidden sm:table-cell">{event.agents}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                event.status === "En cours"
                                  ? "bg-green-100 text-green-800"
                                  : event.status === "Préparation"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {event.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
                      {paymentHistory.map((payment, index) => (
                        <TableRow key={index}>
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>
                            <span
                              className={`flex items-center ${payment.type === "Crédit" ? "text-green-600" : "text-red-600"}`}
                            >
                              {payment.type === "Crédit" ? (
                                <ArrowUpCircle className="mr-1 h-4 w-4" />
                              ) : (
                                <ArrowDownCircle className="mr-1 h-4 w-4" />
                              )}
                              {payment.type}
                            </span>
                          </TableCell>
                          <TableCell>{payment.amount} €</TableCell>
                          <TableCell className="hidden sm:table-cell">{payment.agent}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

