"use client"

import { useState, useEffect, useCallback } from "react"
import { X } from "lucide-react"
import type React from "react" // Added import for React

interface AlertProps {
  message: string
  type: "success" | "error"
  duration?: number
  onClose: () => void
}

export const Alert: React.FC<AlertProps> = ({ message, type, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, handleClose])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-md shadow-md flex items-center justify-between z-50 ${
        type === "success" ? "bg-green-500" : "bg-red-500"
      } text-white`}
      role="alert"
    >
      <span>{message}</span>
      <button onClick={handleClose} className="ml-4 focus:outline-none" aria-label="Fermer l'alerte">
        <X size={18} />
      </button>
    </div>
  )
}

