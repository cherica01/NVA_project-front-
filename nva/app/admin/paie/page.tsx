"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { useRouter } from "next/navigation"

interface Agent {
  id: number
  username: string
}

interface Payment {
  id: number
  agent: string
  amount: number
  created_at: string
}

export default function PaymentManagementPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [workDays, setWorkDays] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [paymentType, setPaymentType] = useState<"credit" | "debit">("credit")
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchAgents()
    fetchPayments()
  }, [])

  const fetchAgents = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }
      const response = await fetch(`${apiUrl}/management/agents/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement des agents")
      }
      const data = await response.json()
      setAgents(data)
    } catch (error) {
      console.error("Erreur lors du chargement des agents:", error)
      setFormError("Impossible de charger la liste des agents")
    }
  }

  const fetchPayments = async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }
      const response = await fetch(`${apiUrl}/management/payments/`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        throw new Error("Erreur lors du chargement des paiements")
      }
      const data = await response.json()
      setPayments(data)
    } catch (error) {
      console.error("Erreur lors du chargement des paiements:", error)
      setFormError("Impossible de charger l'historique des paiements")
    }
  }

  const handlePayment = async () => {
    if (paymentType === "credit" && (!selectedAgent || !workDays || !amount)) {
      setFormError("Veuillez remplir tous les champs pour un crédit")
      return
    }
    if (paymentType === "debit" && (!selectedAgent || !amount)) {
      setFormError("Veuillez sélectionner un agent et entrer un montant pour un débit")
      return
    }

    setLoading(true)
    setFormError(null)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }
      const response = await fetch(`${apiUrl}/management/payments/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          agent_id: selectedAgent,
          work_days: paymentType === "credit" ? Number.parseInt(workDays) : 0,
          amount: paymentType === "credit" ? Number.parseFloat(amount) : -Number.parseFloat(amount),
        }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          handleAuthError()
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.error || "Erreur lors du paiement")
      }

      const result = await response.json()
      setFormError(`Paiement ${paymentType === "credit" ? "crédité" : "débité"} avec succès pour ${result.username}`)

      setSelectedAgent("")
      setWorkDays("")
      setAmount("")
      fetchPayments()
    } catch (error) {
      console.error("Erreur lors du paiement:", error)
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue lors du paiement")
    } finally {
      setLoading(false)
    }
  }

  const handleAuthError = () => {
    setFormError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("/login")
  }

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">Gestion des Paiements</CardTitle>
        </CardHeader>
        <CardContent className="mt-6">
          {formError && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">{formError}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="text-green-500" />
                <Select onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sélectionner un agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id.toString()}>
                        {agent.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {paymentType === "credit" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Jours travaillés"
                    value={workDays}
                    onChange={(e) => setWorkDays(e.target.value)}
                    className="border-green-300 focus:ring-green-500"
                  />
                </div>
              </div>
            )}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="text-green-500" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Montant"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="border-green-300 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4 mt-6">
            <Button
              onClick={() => setPaymentType("credit")}
              className={`flex-1 ${
                paymentType === "credit" ? "bg-green-600" : "bg-gray-400"
              } hover:bg-green-700 text-white`}
            >
              Créditer
            </Button>
            <Button
              onClick={() => setPaymentType("debit")}
              className={`flex-1 ${paymentType === "debit" ? "bg-red-600" : "bg-gray-400"} hover:bg-red-700 text-white`}
            >
              Débiter
            </Button>
          </div>
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white"
          >
            {loading ? "Traitement en cours..." : "Effectuer le paiement"}
          </Button>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-green-600 text-white dark:bg-green-800">
          <CardTitle className="text-2xl font-bold">Historique des Paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-100 dark:bg-green-900">
                  {["Agent", "Montant", "Action", "Date"].map((header) => (
                    <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                    <TableCell>{payment.agent}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${
                          payment.amount >= 0 ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"
                        } dark:bg-green-700 dark:text-white`}
                      >
                        {Math.abs(payment.amount).toFixed(2)} €
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.amount >= 0 ? (
                        <Badge className="bg-green-300 text-green-900 dark:bg-green-700 dark:text-white">Crédit</Badge>
                      ) : (
                        <Badge className="bg-red-300 text-red-900 dark:bg-red-700 dark:text-white">Débit</Badge>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(payment.created_at), "Pp", { locale: fr })}</TableCell>
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

