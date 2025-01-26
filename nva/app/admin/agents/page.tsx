"use client"

import { apiUrl } from "../../../util/config"
import { getAccessToken } from "../../../util/biscuit"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import React from "react"
import { User, Mail, Phone, MapPin, Briefcase, Calendar, Users, Edit, Trash2 } from "lucide-react"
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Interface pour définir un agent
interface Agent {
  id: number;
  username: string;
  password: string;
  age: string;
  gender: string;
  location: string;
  phone_number: string;
  measurements: string;
  date_joined?: string;
}

export default function AdminAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [newAgent, setNewAgent] = useState<Omit<Agent, "id">>({
    username: "",
    password: "defaultpassword",
    age: "",
    gender: "",
    location: "",
    phone_number: "",
    measurements: "",
  });
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les agents existants
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) throw new Error("Token invalide ou expiré.");

        const response = await fetch(`${apiUrl}/accounts/agents/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error("Erreur lors du chargement des agents.");
        const data: Agent[] = await response.json();
        console.log(data);
        setAgents(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur inconnue.";
        setError(errorMessage);
      }
    };

    fetchAgents();
  }, []);

  // Fonction de validation
  const validateField = (key: string, value: string): string | null => {
    if (!value.trim()) return `${key} est requis.`; // Vérifie si le champ est vide
  
    if (key === "age" && (isNaN(Number(value)) || Number(value) <= 0)) {
      return "L'âge doit être un nombre valide."; // Vérifie si l'âge est valide
    }
  
    if (key === "phone_number" && !/^[0-9]{10}$/.test(value)) {
      return "Entrez numero valide "; // Validation pour 10 chiffres
    }
  
    return null; // Aucun problème détecté
  };
  

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string | null } = {};

    Object.entries(newAgent).forEach(([key, value]) => {
      if (key !== "password") {
        const error = validateField(key, value);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  // Ajouter un agent
  const addAgent = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const response = await fetch(`${apiUrl}/accounts/add-agent/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify(newAgent),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l’ajout de l’agent.");
      }
  
      const result: Agent = await response.json();
      
      // Inclure temporairement le mot de passe généré pour l'afficher
      setAgents([...agents, { ...result, password: result.password }]);
      
      setNewAgent({
        username: "",
        password: "defaultpassword",
        age: "",
        gender: "",
        location: "",
        phone_number: "",
        measurements: "",
      });
      setErrors({});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  

  // Modifier un agent
  const editAgent = (agent: Agent) => {
    setEditingAgent(agent);
  };

  // Mettre à jour un agent
  const updateAgent = async () => {
    if (!editingAgent) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/accounts/${editingAgent.id}/update/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify(editingAgent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la mise à jour.");
      }

      const updatedAgent: Agent = await response.json();
      setAgents(
        agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent))
      );
      setEditingAgent(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Annuler les modifications
  const cancelEdit = () => setEditingAgent(null);

  // Supprimer un agent
  const deleteAgent = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/accounts/${id}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${await getAccessToken()}`,
        },
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression de l'agent.");
      setAgents(agents.filter((agent) => agent.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(errorMessage);
    }
  };

  const GENDER_CHOICES = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];
  return (
    <div className="p-6  space-y-8 bg-white dark:bg-gray-900 min-h-screen">
        <h1 className="text-4xl font-bold text-green-600 dark:text-green-400 text-center">
          Gestion des Agents
        </h1>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <User className="text-green-500" />
            <Input
              placeholder="Nom d'utilisateur"
              value={editingAgent ? editingAgent.username : newAgent.username}
              onChange={(e) => {
                const val = e.target.value
                if (editingAgent) {
                  setEditingAgent({ ...editingAgent, username: val })
                } else {
                  setNewAgent({ ...newAgent, username: val })
                  setErrors((prev) => ({
                    ...prev,
                    username: validateField("username", val),
                  }))
                }
              }}
              className={`border-green-300 focus:ring-green-500 ${errors.username ? "border-red-500" : ""}`}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="text-green-500" />
            <Input
              placeholder="Âge"
              value={editingAgent ? editingAgent.age : newAgent.age}
              onChange={(e) => {
                const val = e.target.value
                if (editingAgent) {
                  setEditingAgent({ ...editingAgent, age: val })
                } else {
                  setNewAgent({ ...newAgent, age: val })
                  setErrors((prev) => ({
                    ...prev,
                    age: validateField("age", val),
                  }))
                }
              }}
              className={`border-green-300 focus:ring-green-500 ${errors.age ? "border-red-500" : ""}`}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Users className="text-green-500" />
            <Select
              value={editingAgent ? editingAgent.gender : newAgent.gender}
              onValueChange={(val) => {
                if (editingAgent) {
                  setEditingAgent({ ...editingAgent, gender: val })
                } else {
                  setNewAgent({ ...newAgent, gender: val })
                  setErrors((prev) => ({
                    ...prev,
                    gender: validateField("gender", val),
                  }))
                }
              }}
            >
              <SelectTrigger className="w-full border-green-300 focus:ring-green-500">
                <SelectValue placeholder="Genre" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border border-gray-600 text-white rounded-md shadow-lg">
                {GENDER_CHOICES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="text-green-500" />
            <Input
              placeholder="Localisation"
              value={editingAgent ? editingAgent.location : newAgent.location}
              onChange={(e) => {
                const val = e.target.value
                if (editingAgent) {
                  setEditingAgent({ ...editingAgent, location: val })
                } else {
                  setNewAgent({ ...newAgent, location: val })
                  setErrors((prev) => ({
                    ...prev,
                    location: validateField("location", val),
                  }))
                }
              }}
              className={`border-green-300 focus:ring-green-500 ${errors.location ? "border-red-500" : ""}`}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Phone className="text-green-500" />
            <Input
              placeholder="Téléphone"
              value={editingAgent ? editingAgent.phone_number : newAgent.phone_number}
              onChange={(e) => {
                const val = e.target.value
                if (editingAgent) {
                  setEditingAgent({ ...editingAgent, phone_number: val })
                } else {
                  setNewAgent({ ...newAgent, phone_number: val })
                  setErrors((prev) => ({
                    ...prev,
                    phone_number: validateField("phone_number", val),
                  }))
                }
              }}
              className={`border-green-300 focus:ring-green-500 ${errors.phone_number ? "border-red-500" : ""}`}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Briefcase className="text-green-500" />
            <Input
              placeholder="Mesures"
              value={editingAgent ? editingAgent.measurements : newAgent.measurements}
              onChange={(e) => {
                const val = e.target.value
                if (editingAgent) {
                  setEditingAgent({ ...editingAgent, measurements: val })
                } else {
                  setNewAgent({ ...newAgent, measurements: val })
                  setErrors((prev) => ({
                    ...prev,
                    measurements: validateField("measurements", val),
                  }))
                }
              }}
              className={`border-green-300 focus:ring-green-500 ${errors.measurements ? "border-red-500" : ""}`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          onClick={editingAgent ? updateAgent : addAgent}
          disabled={loading}
          className="bg-green-500 ml-6 hover:bg-green-600 text-white"
        >
          {loading ? "En cours..." : editingAgent ? "Mettre à jour" : "Ajouter"}
        </Button>
        {editingAgent && (
          <Button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600 text-white">
            Annuler
          </Button>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      
<Table className="w-[1400px] border border-white mx-auto lg:translate-x-0 transform translate-x-6">
  <TableHeader>
    <TableRow className="bg-green-600 dark:bg-green-800 border-b border-white justify-center">
      {[
        "Nom d'utilisateur",
        "Mot de passe", // Nouvelle colonne
        "Date inscription", // Nouvelle colonne
        "Âge",
        "Genre",
        "Localisation",
        "Téléphone",
        "Measurmeent",
        "Actions"
      ].map((header) => (
        <TableHead key={header} className="text-white font-semibold">
          {header}
        </TableHead>
      ))}
    </TableRow>
  </TableHeader>

  <TableBody>
    {agents.map((agent) => (
      <TableRow key={agent.id} className="hover:bg-green-100 dark:hover:bg-green-700 border-b border-white">
        {/* Colonne Username */}
        <TableCell className="text-black dark:text-white">{agent.username}</TableCell>
        
        {/* Nouvelle colonne Password */}
        <TableCell className="text-black dark:text-white font-mono">
  {agent.password ? (
    <span>
      {agent.password} <span className="text-xs text-gray-500">(Temporaire)</span>
    </span>
  ) : (
    <span className="text-xs text-gray-400">Non disponible</span>
  )}
</TableCell>


        {/* Nouvelle colonne Date Joined */}
        <TableCell className="text-black dark:text-white">
          {agent.date_joined
            ? new Intl.DateTimeFormat('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              }).format(new Date(agent.date_joined))
            : 'N/A'}
        </TableCell>


        {/* Colonnes existantes */}
        <TableCell className="text-black dark:text-white">{agent.age}</TableCell>
        <TableCell className="text-black dark:text-white">{agent.gender}</TableCell>
        <TableCell className="text-black dark:text-white">{agent.location}</TableCell>
        <TableCell className="text-black dark:text-white">{agent.phone_number}</TableCell>
        <TableCell className="text-black dark:text-white">{agent.measurements}</TableCell>
        {/* Colonne Actions */}
        <TableCell>
          <div className="flex space-x-2">
            <Button onClick={() => editAgent(agent)} className="bg-green-500 hover:bg-green-600 text-white">
              <Edit className="w-4 h-4 mr-1" />
              Modifier
            </Button>
            <Button onClick={() => deleteAgent(agent.id)} className="bg-red-500 hover:bg-red-600 text-white">
              <Trash2 className="w-4 h-4 mr-1" />
              Supprimer
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>

    </div>
  )
}



