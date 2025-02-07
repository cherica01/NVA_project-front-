"use client"

import { useState } from "react"
import { Wallet, ArrowUpRight, ArrowDownLeft, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Transaction {
  id: number
  type: "credit" | "debit"
  amount: number
  description: string
  date: string
}

const mockTransactions: Transaction[] = [
  { id: 1, type: "credit", amount: 1500, description: "Paiement pour le shooting photo", date: "2023-06-01" },
  { id: 2, type: "debit", amount: 200, description: "Frais de déplacement", date: "2023-06-03" },
  { id: 3, type: "credit", amount: 2000, description: "Campagne publicitaire", date: "2023-06-10" },
  { id: 4, type: "debit", amount: 150, description: "Achat de matériel", date: "2023-06-15" },
  { id: 5, type: "credit", amount: 1800, description: "Défilé de mode", date: "2023-06-20" },
]

export default function WalletPage() {
  const [transactions] = useState<Transaction[]>(mockTransactions)
  const balance = transactions.reduce(
    (acc, transaction) => (transaction.type === "credit" ? acc + transaction.amount : acc - transaction.amount),
    0,
  )

  return (
    <main className="p-6 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 text-center">Portefeuille de l'Agent</h1>

      <Card className="bg-white dark:bg-gray-800 border-green-500">
        <CardHeader className="bg-green-500 text-white">
          <CardTitle className="flex items-center justify-between">
            <span>Solde Actuel</span>
            <Wallet className="w-6 h-6" />
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-4xl font-bold text-center text-black dark:text-white">
            {balance.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-gray-800 border-green-500">
        <CardHeader className="bg-green-500 text-white">
          <CardTitle className="flex items-center justify-between">
            <span>Historique des Transactions</span>
            <Button variant="outline" className="bg-white text-green-500 hover:bg-green-100">
              Exporter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
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
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{transaction.date}</span>
                    </div>
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    {transaction.type === "credit" ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        <ArrowDownLeft className="w-4 h-4 mr-1" />
                        Crédit
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        <ArrowUpRight className="w-4 h-4 mr-1" />
                        Débit
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={transaction.type === "credit" ? "text-green-600" : "text-red-600"}>
                      {transaction.type === "credit" ? "+" : "-"}
                      {transaction.amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}

