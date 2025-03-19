"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // Fonction pour générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pageNumbers = []

    // Toujours afficher la première page
    pageNumbers.push(1)

    // Calculer la plage de pages à afficher autour de la page courante
    const startPage = Math.max(2, currentPage - 1)
    const endPage = Math.min(totalPages - 1, currentPage + 1)

    // Ajouter des ellipses si nécessaire avant la plage
    if (startPage > 2) {
      pageNumbers.push("ellipsis-start")
    }

    // Ajouter les pages dans la plage
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }

    // Ajouter des ellipses si nécessaire après la plage
    if (endPage < totalPages - 1) {
      pageNumbers.push("ellipsis-end")
    }

    // Toujours afficher la dernière page si elle existe
    if (totalPages > 1) {
      pageNumbers.push(totalPages)
    }

    return pageNumbers
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {getPageNumbers().map((page, index) => {
        if (page === "ellipsis-start" || page === "ellipsis-end") {
          return (
            <Button key={`ellipsis-${index}`} variant="outline" size="sm" disabled className="cursor-default">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )
        }

        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page as number)}
            className={currentPage === page ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {page}
          </Button>
        )
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

