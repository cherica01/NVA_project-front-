"use client"
import { apiUrl } from "../../../util/config"
import { getAccessToken} from "../../../util/biscuit"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import React from 'react';

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FaEdit, FaTrashAlt } from "react-icons/fa" // Import des icônes

export default function AdminAgents() {
  const [agents, setAgents] = useState([])
  const [newAgent, setNewAgent] = useState({
    username: '',
    password: 'defaultpassword',
    age: '',
    gender: '',
    location: '',
    phone_number: '',
    measurements: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingAgent, setEditingAgent] = useState<any | null>(null)

  // Charger les agents existants
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        // Récupérer le token d'accès
        const accessToken = await getAccessToken();

        if (!accessToken) {
          throw new Error("Token invalide ou expiré. Veuillez vous reconnecter.");
        }

        // Effectuer la requête avec le token dans les headers
        const response = await fetch(`${apiUrl}/accounts/agents/`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des agents.");
        }

        const data = await response.json();
        setAgents(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAgents();
  }, []);

  // Ajouter un agent
  const addAgent = async () => {
    if (!newAgent.username || !newAgent.age) {
      setError("Le nom d'utilisateur et l'âge sont obligatoires.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/accounts/add-agent/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAccessToken()}`,
        },
        body: JSON.stringify(newAgent),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erreur lors de l’ajout de l’agent.')
      }

      const result = await response.json()
      setAgents([...agents, result])
      setNewAgent({
        username: '',
        password: 'defaultpassword',
        age: '',
        gender: '',
        location: '',
        phone_number: '',
        measurements: '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Modifier un agent
  const editAgent = (agent: any) => {
    setEditingAgent(agent)
  }

  // Mettre à jour un agent
  const updateAgent = async () => {
    if (!editingAgent || !editingAgent.id) {
      console.error('Aucun ID valide pour la mise à jour.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiUrl}/accounts/${editingAgent.id}/update/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAccessToken()}`,
         
        },
        body: JSON.stringify(editingAgent),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Erreur lors de la mise à jour.')
      }

      const updatedAgent = await response.json()
      setAgents(agents.map((agent) => (agent.id === updatedAgent.id ? updatedAgent : agent)))
      setEditingAgent(null)
      setError(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Annuler les modifications
  const cancelEdit = () => {
    setEditingAgent(null) // Réinitialiser l'agent en cours d'édition
  }

  // Supprimer un agent
  const deleteAgent = async (id: number) => {
    try {
      const response = await fetch(`${apiUrl}/accounts/${id}/delete/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getAccessToken()}`,
         
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l’agent.')
      }

      setAgents(agents.filter((agent) => agent.id !== id))
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-semibold text-gray-800">Gestion des Agents</h1>

      {/* Formulaire pour ajouter ou modifier un agent */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Input
          placeholder="Nom d'utilisateur"
          value={editingAgent ? editingAgent.username : newAgent.username}
          onChange={(e) => editingAgent
            ? setEditingAgent({ ...editingAgent, username: e.target.value })
            : setNewAgent({ ...newAgent, username: e.target.value })}
          className="input input-bordered w-full"
        />
        <Input
          placeholder="Âge"
          type="number"
          value={editingAgent ? editingAgent.age : newAgent.age}
          onChange={(e) => editingAgent
            ? setEditingAgent({ ...editingAgent, age: e.target.value })
            : setNewAgent({ ...newAgent, age: e.target.value })}
          className="input input-bordered w-full"
        />
        <Input
          placeholder="Genre"
          value={editingAgent ? editingAgent.gender : newAgent.gender}
          onChange={(e) => editingAgent
            ? setEditingAgent({ ...editingAgent, gender: e.target.value })
            : setNewAgent({ ...newAgent, gender: e.target.value })}
          className="input input-bordered w-full"
        />
        <Input
          placeholder="Localisation"
          value={editingAgent ? editingAgent.location : newAgent.location}
          onChange={(e) => editingAgent
            ? setEditingAgent({ ...editingAgent, location: e.target.value })
            : setNewAgent({ ...newAgent, location: e.target.value })}
          className="input input-bordered w-full"
        />
        <Input
          placeholder="Téléphone"
          value={editingAgent ? editingAgent.phone_number : newAgent.phone_number}
          onChange={(e) => editingAgent
            ? setEditingAgent({ ...editingAgent, phone_number: e.target.value })
            : setNewAgent({ ...newAgent, phone_number: e.target.value })}
          className="input input-bordered w-full"
        />
        <Input
          placeholder="Mensurations"
          value={editingAgent ? editingAgent.measurements : newAgent.measurements}
          onChange={(e) => editingAgent
            ? setEditingAgent({ ...editingAgent, measurements: e.target.value })
            : setNewAgent({ ...newAgent, measurements: e.target.value })}
          className="input input-bordered w-full"
        />
      </div>

      <div className="flex items-center space-x-4 mt-4">
        <Button
          onClick={editingAgent ? updateAgent : addAgent}
          disabled={loading}
          className="w-full md:w-auto bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md"
        >
          {loading
            ? (editingAgent ? 'Mise à jour en cours...' : 'Ajout en cours...')
            : (editingAgent ? 'Mettre à jour l’agent' : 'Ajouter un agent')}
        </Button>

        {editingAgent && (
          <Button
            onClick={cancelEdit}
            className="w-full md:w-auto bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded shadow-md"
          >
            Annuler
          </Button>
        )}
      </div>

      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      <h1 className="text-3xl font-semibold text-gray-800">LISTE DES AGENTS</h1>
      <Table className="mt-6 border border-gray-300 rounded-lg shadow-md overflow-hidden">
       
        <TableHeader>
        
          <TableRow className="bg-gray-100">
            
            <TableHead className="px-4 py-3 text-left">Nom d'utilisateur</TableHead>
            <TableHead className="px-4 py-3 text-left">Âge</TableHead>
            <TableHead className="px-4 py-3 text-left">Genre</TableHead>
            <TableHead className="px-4 py-3 text-left">Localisation</TableHead>
            <TableHead className="px-4 py-3 text-left">Téléphone</TableHead>
            <TableHead className="px-4 py-3 text-left">Mensurations</TableHead>
            <TableHead className="px-4 py-3 text-left">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agents.map((agent: any) => (
            <TableRow key={agent.id} className="border-b hover:bg-gray-50">
              <TableCell className="px-4 py-2">{agent.username}</TableCell>
              <TableCell className="px-4 py-2">{agent.age}</TableCell>
              <TableCell className="px-4 py-2">{agent.gender}</TableCell>
              <TableCell className="px-4 py-2">{agent.location}</TableCell>
              <TableCell className="px-4 py-2">{agent.phone_number}</TableCell>
              <TableCell className="px-4 py-2">{agent.measurements}</TableCell>
              <TableCell className="px-4 py-2">
              <Button
                  onClick={() => editAgent(agent)}
                  className="btn btn-primary mr-2 text-blue-500 hover:text-blue-700"
                >
                  <FaEdit className="mr-1" /> Modifier
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteAgent(agent.id)}
                  className="btn btn-danger text-red-500 hover:text-red-700"
                >
                  <FaTrashAlt className="mr-1" /> Supprimer
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}