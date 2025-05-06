"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CreditCard, DollarSign, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { apiUrl } from "@/util/config"
import { getAccessToken } from "@/util/biscuit"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Agent {
  id: number
  username: string
}

interface Payment {
  id: number
  agent: string
  amount: number
  work_days: number
  total_payment: number | string
  description: string
  created_at: string
}

export default function PaymentManagementPage() {
  const router = useRouter()
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [workDays, setWorkDays] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [paymentType, setPaymentType] = useState<"credit" | "debit">("credit")
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const handleAuthError = useCallback(() => {
    setFormError("Votre session a expiré. Veuillez vous reconnecter.")
    router.push("")
  }, [router])

  const fetchAgents = useCallback(async () => {
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/accounts/agents/`, {
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
      console.log("Agents récupérés:", data)

      const formattedAgents = Array.isArray(data)
        ? data.map((agent) => ({
            id: agent.id,
            username: agent.username || agent.email || `Agent ${agent.id}`,
          }))
        : []

      setAgents(formattedAgents)
    } catch (error) {
      console.error("Erreur lors du chargement des agents:", error)
      setFormError("Impossible de charger la liste des agents")
    }
  }, [handleAuthError])

  const fetchPayments = useCallback(async () => {
    setFetchingData(true)
    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      const response = await fetch(`${apiUrl}/payment/`, {
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
    } finally {
      setFetchingData(false)
    }
  }, [handleAuthError])

  useEffect(() => {
    fetchAgents()
    fetchPayments()
  }, [fetchAgents, fetchPayments])

  useEffect(() => {
    if (formSuccess) {
      const timer = setTimeout(() => {
        setFormSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [formSuccess])

  const handlePayment = async () => {
    if (!selectedAgent) {
      setFormError("Veuillez sélectionner un agent")
      return
    }

    if (!amount || Number.parseFloat(amount) <= 0) {
      setFormError("Veuillez entrer un montant valide")
      return
    }

    if (paymentType === "credit" && !workDays) {
      setFormError("Veuillez indiquer le nombre de jours travaillés")
      return
    }

    setLoading(true)
    setFormError(null)
    setFormSuccess(null)

    try {
      const accessToken = await getAccessToken()
      if (!accessToken) {
        handleAuthError()
        return
      }

      let paymentDescription = description
      if (!paymentDescription) {
        paymentDescription = paymentType === "credit" ? `Crédit pour ${workDays} jours travaillés` : `Débit de compte`
      }

      const paymentData = {
        agent_id: Number(selectedAgent),
        amount: paymentType === "credit" ? Number.parseFloat(amount) : -Number.parseFloat(amount),
        work_days: paymentType === "credit" ? Number.parseInt(workDays) : 0,
        description: paymentDescription,
      }

      console.log("Données de paiement envoyées:", paymentData)

      const response = await fetch(`${apiUrl}/payment/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(paymentData),
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
      console.log("Résultat du paiement:", result)

      const agentName = agents.find((a) => a.id === Number(selectedAgent))?.username || `Agent ${selectedAgent}`
      const successMessage = `Paiement ${paymentType === "credit" ? "crédité" : "débité"} avec succès pour ${agentName}`
      setFormSuccess(successMessage)

      setSelectedAgent("")
      setWorkDays("")
      setAmount("")
      setDescription("")

      fetchPayments()
    } catch (error) {
      console.error("Erreur lors du paiement:", error)
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue lors du paiement")
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="p-6 space-y-8 bg-gray-200 min-h-screen">
      <Card className="backdrop-blur-lg bg-white/10 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-800 text-white dark:bg-green-950">
          <CardTitle className="text-3xl font-bold">Gestion des Paiements</CardTitle>
          <CardDescription className="text-gray-200">Créditez ou débitez le compte des agents</CardDescription>
        </CardHeader>
        <CardContent className="mt-6">
          {formError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          {formSuccess && (
            <Alert className="mb-4 bg-green-100 text-green-800 border-green-200">
              <AlertDescription>{formSuccess}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="text-green-500" />
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
  <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300 dark:border-gray-600">
    <SelectValue placeholder="Sélectionner un agent" />
  </SelectTrigger>
  <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-white">
    {agents.length === 0 ? (
      <SelectItem value="no-agents" disabled className="text-black dark:text-white">
        Aucun agent disponible
      </SelectItem>
    ) : (
      agents.map((agent) => (
        <SelectItem key={agent.id} value={agent.id.toString()}>
          {agent.username}
        </SelectItem>
      ))
    )}
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

            <div className="space-y-4 lg:col-span-3">
              <Input
                placeholder="Description (optionnel)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-green-300 focus:ring-green-500"
              />
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
          {fetchingData ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700 mx-auto"></div>
              <p className="mt-2 text-gray-600">Chargement des paiements...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Aucun paiement trouvé. Effectuez votre première paiement !</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-green-100 dark:bg-green-900">
                    {["Agent", "Montant", "Type", "Jours travaillés", "Description", "Date", "Solde total"].map(
                      (header) => (
                        <TableHead key={header} className="text-green-700 dark:text-green-300 font-semibold">
                          {header}
                        </TableHead>
                      ),
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="hover:bg-green-50 dark:hover:bg-green-800/50">
                      <TableCell>{payment.agent}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${payment.amount >= 0 ? "bg-green-300 text-green-900" : "bg-red-300 text-red-900"} dark:bg-green-700 dark:text-white`}
                        >
                          {Math.abs(payment.amount).toFixed(2)} AR
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.amount >= 0 ? (
                          <Badge className="bg-green-300 text-green-900 dark:bg-green-700 dark:text-white">Crédit</Badge>
                        ) : (
                          <Badge className="bg-red-300 text-red-900 dark:bg-red-700 dark:text-white">Débit</Badge>
                        )}
                      </TableCell>
                      <TableCell>{payment.work_days || "-"}</TableCell>
                      <TableCell>{payment.description || "-"}</TableCell>
                      <TableCell>{formatDate(payment.created_at)}</TableCell>
                      <TableCell className="font-medium">{formatAmount(payment.total_payment)} AR</TableCell>
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