"use client"

import type React from "react"
import { apiUrl } from "@/util/config"
import { setCookies } from "@/util/biscuit"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserIcon, LockOpenIcon as LockClosedIcon, ArrowRightIcon, EyeIcon, EyeOffIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"

export default function Login() {
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()

  // S'assurer que le composant est monté pour éviter les valeurs aléatoires en SSR
  useEffect(() => {
    setMounted(true)
    const savedUsername = localStorage.getItem("nva_username")
    const savedRememberMe = localStorage.getItem("nva_remember_me") === "true"
    if (savedUsername && savedRememberMe) {
      setUsername(savedUsername)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`${apiUrl}/accounts/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      const data = await response.json()
      console.log("Données reçues:", data)

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem("nva_username", username)
          localStorage.setItem("nva_remember_me", "true")
        } else {
          localStorage.removeItem("nva_username")
          localStorage.removeItem("nva_remember_me")
        }

        setSuccess("Connexion réussie !")
        setCookies(data)

        if (data.user && typeof data.user.is_superuser !== "undefined") {
          const isSuperuser = data.user.is_superuser ? 1 : 0

          if (isSuperuser === 1) {
            router.push("/admin/dashboard")
          } else if (isSuperuser === 0) {
            router.push("/agent/agenda")
          } else {
            console.error("Rôle inconnu:", isSuperuser)
            setError("Rôle inconnu. Contactez l'administrateur.")
          }
        } else {
          console.error("Données utilisateur incorrectes:", data)
          setError("Impossible de récupérer le rôle utilisateur.")
        }
      } else {
        setError(data.detail || "Erreur lors de la connexion.")
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden relative">
      {/* Fond avec animations simples et fluides */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient de fond subtil et animé */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-green-50 to-gray-100"
          animate={{
            background: [
              "linear-gradient(to bottom right, rgba(240, 253, 244, 1), rgba(243, 244, 246, 1))",
              "linear-gradient(to bottom right, rgba(236, 253, 245, 1), rgba(249, 250, 251, 1))",
              "linear-gradient(to bottom right, rgba(240, 253, 244, 1), rgba(243, 244, 246, 1))",
            ],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        />

        {/* Cercles flottants avec animation fluide */}
        {mounted &&
          Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={`circle-${i}`}
              className="absolute rounded-full bg-green-500/10"
              style={{
                width: `${80 + Math.random() * 120}px`,
                height: `${80 + Math.random() * 120}px`,
                filter: "blur(40px)",
              }}
              initial={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                opacity: 0.3 + Math.random() * 0.4,
              }}
              animate={{
                x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`, `${Math.random() * 100}%`],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                times: [0, 0.5, 1],
              }}
            />
          ))}

        {/* Lignes horizontales subtiles */}
        {mounted &&
          Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={`line-${i}`}
              className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-green-300/30 to-transparent"
              style={{ top: `${30 + i * 20}%` }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{
                opacity: [0.2, 0.5, 0.2],
                scaleY: [1, 1.5, 1],
                y: [0, 10, 0],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}
      </div>

      {/* Contenu principal avec animation d'entrée fluide */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <motion.div
          className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-green-100/50 overflow-hidden"
          initial={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
          animate={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          {/* Logo avec animation d'entrée et pulsation subtile */}
          <div className="pt-10 pb-6 px-8">
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.7, type: "spring", stiffness: 100 }}
            >
              <motion.div
                className="relative"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <div className="text-6xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700">
                    NVA
                  </span>
                </div>

                {/* Cercles concentriques autour du logo */}
                <motion.div
                  className="absolute -inset-4 rounded-full border border-green-300/50"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
                <motion.div
                  className="absolute -inset-8 rounded-full border border-green-200/30"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </motion.div>
            </motion.div>

            <motion.h2
              className="text-2xl font-bold text-center text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Connexion
            </motion.h2>
            <motion.p
              className="text-gray-500 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              Entrez vos identifiants pour accéder à votre compte
            </motion.p>
          </div>

          {/* Formulaire avec animations d'entrée séquentielles */}
          <div className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Label htmlFor="username" className="text-gray-700 text-sm font-medium">
                  Nom d&#39;utilisateur
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-400 group-focus-within:text-green-500 transition-colors duration-300">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg transition-all duration-300"
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                    autoComplete="username"
                  />
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-600"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-400 group-focus-within:text-green-500 transition-colors duration-300">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/50 border-gray-200 text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg transition-all duration-300"
                    placeholder="Entrez votre mot de passe"
                    required
                    autoComplete="current-password"
                  />
                  <motion.button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500 focus:outline-none"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </motion.button>
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-600"
                    initial={{ width: 0 }}
                    whileInView={{ width: "100%" }}
                    transition={{ duration: 0.3, delay: 0.7 }}
                  />
                </div>
              </motion.div>

              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <motion.div className="relative" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                    className="sr-only"
                  />
                  <div
                    className={`w-4 h-4 border rounded cursor-pointer transition-all duration-200 ${
                      rememberMe ? "bg-green-500 border-green-500" : "bg-white border-gray-300"
                    }`}
                    onClick={() => setRememberMe(!rememberMe)}
                  >
                    {rememberMe && (
                      <motion.svg
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                </motion.div>
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-600 cursor-pointer"
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  Se souvenir de moi
                </label>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-2 px-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="py-2 px-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 shadow-md"
                >
                  <motion.div
                    className="absolute inset-0 w-full h-full bg-white/0 group-hover:bg-white/10"
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />

                  <span className="relative flex items-center justify-center">
                    {loading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Connexion en cours...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        Se connecter
                        <motion.div
                          className="ml-2"
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          <ArrowRightIcon className="w-5 h-5" />
                        </motion.div>
                      </div>
                    )}
                  </span>
                </Button>
              </motion.div>
            </form>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <p className="text-xs text-gray-500">© 2025 NVA. Tous droits réservés.</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

