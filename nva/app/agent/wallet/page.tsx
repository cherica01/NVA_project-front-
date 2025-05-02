"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Wallet, CreditCard, ArrowDownCircle, ArrowUpCircle, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { useRouter } from "next/navigation"

interface Payment {
  id: number
  agent: string
  amount: number
  work_days: number
  total_payment: number | string
  description: string
  created_at: string
}

interface AgentTotal {
  agent_id: number
  agent_username: string
  total_payment: number | string
  total_credits: number
  total_debits: number
}

export default function AgentWalletPage() {
  const router = useRouter()
  const [agentTotal, setAgentTotal] = useState<AgentTotal | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleAuthError = useCallback(() => {
    setError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("")
  }, [router])

  const fetchAgentTotal = useCallback(async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/payment/agent/total/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement du solde")
      }

      const data = await response.json()
      setAgentTotal(data)
    } catch (error) {
      console.error("Erreur lors du chargement du solde:", error)
      setError("Impossible de charger votre solde")
    }
  }, [handleAuthError])

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/payment/agent/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement de l'historique des paiements")
      }

      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error)
      setError("Impossible de charger votre historique de paiements")
    } finally {
      setLoading(false)
    }
  }, [handleAuthError])

  useEffect(() => {
    fetchAgentTotal()
    fetchPaymentHistory()
  }, [fetchAgentTotal, fetchPaymentHistory])

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "Pp", { locale: fr })
    } catch {
      return "Date invalide"
    }
  }

  const formatAmount = (value: number | string | undefined | null) => {
    if (value === undefined || value === null) return "0.00"

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value)
      return isNaN(parsed) ? "0.00" : parsed.toFixed(2)
    }

    return value.toFixed(2)
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    )
  }

  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      {error && <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}

      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold flex items-center">
            <Wallet className="mr-2" /> Mon Portefeuille
          </CardTitle>
          <CardDescription className="text-gray-200">
            Consultez votre solde et vos dernières transactions
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-700">Solde actuel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-green-600">{formatAmount(agentTotal?.total_payment)} AR</div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-700 flex items-center">
                  <TrendingUp className="mr-2 text-green-500" size={18} /> Crédits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{agentTotal?.total_credits || 0}</div>
                <p className="text-sm text-gray-500">transactions</p>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-700 flex items-center">
                  <TrendingDown className="mr-2 text-red-500" size={18} /> Débits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{agentTotal?.total_debits || 0}</div>
                <p className="text-sm text-gray-500">transactions</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white shadow-md mt-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-700">Dernières transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentPayments.length === 0 ? (
                  <p className="text-gray-500 text-sm">Aucune transaction récente</p>
                ) : (
                  recentPayments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center p-2 border-b">
                      <div className="flex items-center">
                        {payment.amount >= 0 ? (
                          <ArrowDownCircle className="text-green-500 mr-2" size={18} />
                        ) : (
                          <ArrowUpCircle className="text-red-500 mr-2" size={18} />
                        )}
                        <span className="text-sm truncate max-w-[150px]">
                          {payment.description ||
                            (payment.amount >= 0 ? `Crédit pour ${payment.work_days} jours` : "Débit de compte")}
                        </span>
                      </div>
                      <Badge
                        className={payment.amount >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {payment.amount >= 0 ? "+" : "-"}
                        {Math.abs(payment.amount).toFixed(2)} €
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-green-600 text-white dark:bg-green-800">
          <CardTitle className="text-2xl font-bold flex items-center">
            <CreditCard className="mr-2" /> Historique des Paiements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucun paiement trouvé dans votre historique.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-100 dark:bg-green-900">
                    {["Montant", "Type", "Jours travaillés", "Description", "Date", "Solde"].map((header) => (
                      <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                      <TableCell>
                        <Badge
                          className={`${payment.amount >= 0 ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"} dark:bg-green-700 dark:text-white`}
                        >
                          {payment.amount >= 0 ? "+" : "-"}
                          {Math.abs(payment.amount).toFixed(2)} €
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.amount >= 0 ? (
                          <Badge className="bg-green-300 text-green-900 dark:bg-green-700 dark:text-white">
                            Crédit
                          </Badge>
                        ) : (
                          <Badge className="bg-red-300 text-red-900 dark:bg-red-700 dark:text-white">Débit</Badge>
                        )}
                      </TableCell>
                      <TableCell>{payment.work_days || "-"}</TableCell>
                      <TableCell>{payment.description || "-"}</TableCell>
                      <TableCell>{formatDate(payment.created_at)}</TableCell>
                      <TableCell className="font-medium">{formatAmount(payment.total_payment)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}