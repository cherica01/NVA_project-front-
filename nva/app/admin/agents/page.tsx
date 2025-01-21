"use client";

import { apiUrl } from "../../../util/config";
import { getAccessToken } from "../../../util/biscuit";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import React from "react";
import {
  Table,
  TableBody,
  TableHeader,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { FaEdit, FaTrashAlt } from "react-icons/fa";

// Interface pour définir un agent
interface Agent {
  id: number;
  username: string;
  password?: string;
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
      setAgents([...agents, result]);
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

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-semibold">Gestion des Agents</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(newAgent).map(([key, value]) =>
          key !== "password" ? (
            <div key={key} className="space-y-1">
              <Input
                placeholder={key}
                value={editingAgent ? editingAgent[key as keyof Agent] : value}
                onChange={(e) => {
                  const val = e.target.value;
                  if (editingAgent) {
                    setEditingAgent({ ...editingAgent, [key]: val });
                  } else {
                    setNewAgent({ ...newAgent, [key]: val });
                    setErrors((prev) => ({
                      ...prev,
                      [key]: validateField(key, val),
                    }));
                  }
                }}
                className={errors[key] ? "border-red-500" : ""}
              />
              {errors[key] && (
                <p className="text-red-500 text-sm">{errors[key]}</p>
              )}
            </div>
          ) : null
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Button
          onClick={editingAgent ? updateAgent : addAgent}
          disabled={loading}
          className="bg-blue-500 text-white"
        >
          {loading ? "En cours..." : editingAgent ? "Mettre à jour" : "Ajouter"}
        </Button>
        {editingAgent && (
          <Button
            onClick={cancelEdit}
            className="bg-gray-500 text-white"
          >
            Annuler
          </Button>
        )}
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <Table>
        {/* Table Header */}
        <TableHeader>
          <TableRow>
            {["Nom d'utilisateur", "Âge", "Genre", "Localisation", "Téléphone", "Actions"].map(
              (header) => (
                <TableHead key={header}>{header}</TableHead>
              )
            )}
          </TableRow>
        </TableHeader>

        {/* Table Body */}
        <TableBody>
          {agents.map((agent) => (
            <TableRow key={agent.id}>
              <TableCell>{agent.username}</TableCell>
              <TableCell>{agent.age}</TableCell>
              <TableCell>{agent.gender}</TableCell>
              <TableCell>{agent.location}</TableCell>
              <TableCell>{agent.phone_number}</TableCell>
              <TableCell>
              <Button
              onClick={() => editAgent(agent)}
              className="text-blue-500 flex items-center space-x-2"
              >
                <FaEdit /> {/* Icône Modifier */}
                <span>Modifier</span>
              </Button>

              <Button
                onClick={() => deleteAgent(agent.id)}
                className="text-red-500 flex items-center space-x-2"
              >
                <FaTrashAlt /> {/* Icône Supprimer */}
                <span>Supprimer</span>
              </Button>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
