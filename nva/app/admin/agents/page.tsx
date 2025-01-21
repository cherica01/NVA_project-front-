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
import { FaEdit, FaTrashAlt } from "react-icons/fa"; // Icônes

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

  // Ajouter un agent
  const addAgent = async () => {
    if (!newAgent.username || !newAgent.age) {
      setError("Le nom d'utilisateur et l'âge sont obligatoires.");
      return;
    }

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
    if (!editingAgent || !editingAgent.id) {
      console.error("Aucun ID valide pour la mise à jour.");
      return;
    }

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
        throw new Error(errorData.detail || "Erreur lors de la mise à jour.");
      }

      const updatedAgent: Agent = await response.json();
      setAgents(
        agents.map((agent) =>
          agent.id === updatedAgent.id ? updatedAgent : agent
        )
      );
      setEditingAgent(null);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Annuler les modifications
  const cancelEdit = () => {
    setEditingAgent(null);
  };

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
      <h1 className="text-3xl font-semibold text-gray-800">Gestion des Agents</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Formulaires */}
        {Object.entries(newAgent).map(([key, value]) => 
        key !== "password" && key !== "date_joined" ?(
          <Input
            key={key}
            placeholder={key}
            value={editingAgent ? editingAgent[key as keyof Agent] : value}
            onChange={(e) =>
              editingAgent
                ? setEditingAgent({
                    ...editingAgent,
                    [key]: e.target.value,
                  })
                : setNewAgent({ ...newAgent, [key]: e.target.value })
            }
          />
        ) : null
      )}
      </div>

      <div className="flex items-center space-x-4 mt-4">
        <Button
          onClick={editingAgent ? updateAgent : addAgent}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4"
        >
          {loading
            ? editingAgent
              ? "Mise à jour en cours..."
              : "Ajout en cours..."
            : editingAgent
            ? "Mettre à jour"
            : "Ajouter"}
        </Button>

        {editingAgent && (
          <Button onClick={cancelEdit} className="bg-gray-500 hover:bg-gray-600">
            Annuler
          </Button>
        )}
      </div>

      {error && <p className="text-red-500 text-center">{error}</p>}

      {/* Table */}
      <div className="overflow-x-auto">
  <Table className="w-full table-auto">
    <TableHeader>
      <TableRow>
        {[
          "Nom d'utilisateur",
          "Âge",
          "Genre",
          "Localisation",
          "Téléphone",
          "Date de Création",
          "Mot de Passe",
          "Actions",
        ].map((header) => (
          <TableHead key={header} className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
            {header}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
    <TableBody>
      {agents.map((agent) => (
        <TableRow key={agent.id} className="hover:bg-gray-50">
          <TableCell className="px-4 py-2 text-sm text-gray-700">{agent.username}</TableCell>
          <TableCell className="px-4 py-2 text-sm text-gray-700">{agent.age}</TableCell>
          <TableCell className="px-4 py-2 text-sm text-gray-700">{agent.gender}</TableCell>
          <TableCell className="px-4 py-2 text-sm text-gray-700">{agent.location}</TableCell>
          <TableCell className="px-4 py-2 text-sm text-gray-700">{agent.phone_number}</TableCell>
          <TableCell className="px-4 py-2 text-sm text-gray-700">
            {new Date(agent.date_joined).toLocaleString("fr-FR")}
          </TableCell>
          <TableCell>{agent.password}</TableCell>
          <TableCell className="px-4 py-2 text-sm">
            <Button
              onClick={() => editAgent(agent)}
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <FaEdit />
              <span>Modifier</span>
            </Button>
            <Button
              onClick={() => deleteAgent(agent.id)}
              className="text-red-600 hover:text-red-800 flex items-center space-x-1 mt-1"
            >
              <FaTrashAlt />
              <span>Supprimer</span>
            </Button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>


    </div>
  );
}
