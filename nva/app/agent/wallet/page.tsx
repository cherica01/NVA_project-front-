"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowUpCircle, ArrowDownCircle, Euro, Calendar } from "lucide-react"

// Données fictives
const fakeBalance = 1250.75
const fakeTransactions = [
  { id: 1, type: "credit", amount: 500, description: "Paiement pour l'événement A", date: "2023-08-15" },
  { id: 2, type: "debit", amount: 50, description: "Frais de transport", date: "2023-08-14" },
  { id: 3, type: "credit", amount: 750, description: "Bonus performance", date: "2023-08-10" },
  { id: 4, type: "debit", amount: 100, description: "Achat équipement", date: "2023-08-05" },
  { id: 5, type: "credit", amount: 600, description: "Paiement pour l'événement B", date: "2023-08-01" },
]

export default function AgentWallet() {
  const [balance] = useState(fakeBalance)
  const [transactions] = useState(fakeTransactions)

  const totalEarnings = transactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)

  const getNextPaymentDate = () => {
    const today = new Date()
    const nextPayment = new Date(today.getFullYear(), today.getMonth(), 9)
    if (today.getDate() > 9) {
      nextPayment.setMonth(nextPayment.getMonth() + 1)
    }
    return nextPayment
  }

  const nextPaymentDate = getNextPaymentDate()

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solde actuel</CardTitle>
            <Euro className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">€{balance.toFixed(2)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Mis à jour aujourd'hui</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gains totaux</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">€{totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ce mois-ci</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dépenses totales</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">€{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Ce mois-ci</p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prochain paiement</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {nextPaymentDate.toLocaleDateString("fr-FR")}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Chaque 9 du mois</p>
          </CardContent>
        </Card>
      </div>

      <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">
        <CardHeader className="bg-green-700 text-white dark:bg-green-900">
          <CardTitle className="text-2xl font-bold">Historique des Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{new Date(transaction.date).toLocaleDateString("fr-FR")}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === "credit" ? "default" : "destructive"} className="capitalize">
                      {transaction.type === "credit" ? (
                        <ArrowUpCircle className="mr-1 h-3 w-3 inline" />
                      ) : (
                        <ArrowDownCircle className="mr-1 h-3 w-3 inline" />
                      )}
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={transaction.type === "credit" ? "text-green-600" : "text-red-600"}>
                      {transaction.type === "credit" ? "+" : "-"}€{transaction.amount.toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

