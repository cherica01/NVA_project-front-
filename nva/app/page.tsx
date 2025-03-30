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
    } catch (err) {
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
            background: [
              "linear-gradient(to bottom right, rgba(240, 253, 244, 1), rgba(243, 244, 246, 1))",
            ],
          }}
          transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}

        {mounted &&
          Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`circle-${i}`}
              className="absolute rounded-full bg-gradient-to-br from-green-400/40 to-green-600/30"
              style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                width: `${30 + Math.random() * 100}px`,
                height: `${30 + Math.random() * 100}px`,
                filter: "blur(3px)",
              }}
              animate={{
                y: [Math.random() * 150, Math.random() * -150, Math.random() * 150],
                x: [Math.random() * 150, Math.random() * -150, Math.random() * 150],
                scale: [1, 1.3, 0.8, 1],
                opacity: [0.4, 0.9, 0.4],
              }}
              transition={{
                duration: 20 + Math.random() * 15,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Lignes ondulantes avec plus de visibilité */}
        {mounted &&
          Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={`wave-${i}`}
              className="absolute h-[3px] w-full bg-gradient-to-r from-transparent via-green-500/50 to-transparent"
              style={{ top: `${20 + i * 15}%` }}
              animate={{
                y: [0, 30, -30, 0],
                scaleY: [1, 1.7, 0.7, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 12 + i * 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
              }}
            />
          ))}

        {/* Hexagones futuristes avec opacité renforcée */}
        {mounted &&
          Array.from({ length: 8 }).map((_, i) => {
            const size = 80 + Math.random() * 120
            return (
              <motion.div
                key={`hex-${i}`}
                className="absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 0.8, 1],
                  opacity: [0.1, 0.3, 0.1],
                }}
                transition={{
                  duration: 25 + Math.random() * 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "linear",
                }}
              >
                <svg width={size} height={size} viewBox="0 0 100 100">
                  <polygon
                    points="50 0, 93.3 25, 93.3 75, 50 100, 6.7 75, 6.7 25"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                  />
                </svg>
              </motion.div>
            )
          })}

        {/* Grille futuriste avec des couleurs légèrement plus intenses */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,128,0,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,128,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="backdrop-blur-sm bg-white/80 rounded-2xl shadow-xl border border-green-100 overflow-hidden">
          {/* En-tête avec logo */}
          <div className="pt-10 pb-6 px-8">
            <motion.div
              className="flex justify-center mb-8"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 1,
                type: "spring",
                stiffness: 200,
                delay: 0.3,
              }}
            >
              <div className="relative">
                <div className="text-6xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-700">
                    NVA
                  </span>
                </div>
                <motion.div
                  className="absolute -inset-4 rounded-full border border-green-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1 }}
                />
                <motion.div
                  className="absolute -inset-8 rounded-full border border-green-200"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.2 }}
                />

                {/* Particules autour du logo */}
                {mounted &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={`particle-${i}`}
                      className="absolute w-2 h-2 rounded-full bg-green-500"
                      style={{
                        top: `${50 + Math.cos((i * Math.PI) / 4) * 50}%`,
                        left: `${50 + Math.sin((i * Math.PI) / 4) * 50}%`,
                        opacity: 0.8,
                      }}
                      animate={{
                        scale: [0.8, 1.3, 0.8],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2 + i * 0.2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
              </div>
            </motion.div>

            <motion.h2
              className="text-2xl font-bold text-center text-gray-800 mb-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              Connexion
            </motion.h2>
            <motion.p
              className="text-gray-500 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              Entrez vos identifiants pour accéder à votre compte
            </motion.p>
          </div>

          {/* Formulaire */}
          <div className="px-8 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <Label htmlFor="username" className="text-gray-700 text-sm font-medium">
                  Nom d'utilisateur
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <Input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg"
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                    autoComplete="username"
                  />
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-600 group-focus-within:w-full transition-all duration-300"></div>
                </div>
              </motion.div>

              <motion.div
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                  Mot de passe
                </Label>
                <div className="relative group">
                  <div className="absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-400 group-focus-within:text-green-500 transition-colors">
                    <LockClosedIcon className="w-5 h-5" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-white/50 border-gray-200 text-gray-800 focus:border-green-500 focus:ring-1 focus:ring-green-500 rounded-lg"
                    placeholder="Entrez votre mot de passe"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-green-500 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                  <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-green-400 to-emerald-600 group-focus-within:w-full transition-all duration-300"></div>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
              >
                <div className="relative">
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
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                </div>
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="py-2 px-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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
                transition={{ duration: 0.5, delay: 1.1 }}
              >
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 relative overflow-hidden group bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg transition-all duration-300 shadow-lg"
                >
                  <div className="absolute inset-0 w-full h-full">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute bg-white h-0.5 w-full"
                          style={{
                            top: `${20 * i}%`,
                            left: 0,
                            transform: `translateY(${10 * i}px) rotate(${i % 2 ? -5 : 5}deg)`,
                            opacity: 0.5 - i * 0.1,
                          }}
                        />
                      ))}
                    </div>
                  </div>

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
                          transition={{ duration: 0.2 }}
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
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              {/* Lien ou autres informations complémentaires */}
            </motion.div>

            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.3 }}
            >
              <p className="text-xs text-gray-500">© 2025 NVA. Tous droits réservés.</p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
