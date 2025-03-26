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
import Link from "next/link"

export default function Login() {
  const [mounted, setMounted] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

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
        });

        const data = await response.json();
        console.log("Données reçues:", data);

        if (response.ok) {
            setSuccess("Connexion réussie !");
            setCookies(data);

            // Vérifie que `user` existe avant d'accéder à `is_superuser`
            if (data.user && typeof data.user.is_superuser !== "undefined") {
              const isSuperuser = data.user.is_superuser ? 1 : 0; 

                if (isSuperuser === 1) {
                    router.push("/admin/dashboard");
                } else if (isSuperuser === 0) {
                    router.push("/agent/agenda");
                } else {
                    console.error("Rôle inconnu:", isSuperuser);
                    setError("Rôle inconnu. Contactez l'administrateur.");
                }
            } else {
                console.error("Données utilisateur incorrectes:", data);
                setError("Impossible de récupérer le rôle utilisateur.");
            }
        } else {
            setError(data.detail || "Erreur lors de la connexion.");
        }
    } catch (err) {
        setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
        setLoading(false);
    }
};



  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-green-900 to-black">
      <Card className="w-full max-w-md bg-gray-800 text-white shadow-2xl">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <h1 className="text-4xl font-bold text-green-400">NVA</h1>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Connexion</CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Entrez vos identifiants pour accéder à votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-200">
                Nom d'utilisateur
              </Label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  placeholder="Entrez votre nom d'utilisateur"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">
                Mot de passe
              </Label>
              <div className="relative">
                <LockClosedIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  placeholder="Entrez votre mot de passe"
                  required
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            {success && <p className="text-sm text-green-400">{success}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white transition-colors duration-300"
            >
              {loading ? (
                "Connexion..."
              ) : (
                <span className="flex items-center justify-center">
                  Se connecter
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-400 text-center w-full">© 2025 NVA. Tous droits réservés.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
