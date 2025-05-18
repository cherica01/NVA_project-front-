"use client"



import { useState, useEffect,useCallback } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"

import { Skeleton } from "@/components/ui/skeleton"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import { Textarea } from "@/components/ui/textarea"

import { Progress } from "@/components/ui/progress"

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

  DialogTrigger,

} from "@/components/ui/dialog"

import {

  BarChart,

  Bar,

  XAxis,

  YAxis,

  CartesianGrid,

  Tooltip,

  Legend,

  ResponsiveContainer,

  PieChart,

  Pie,

  Cell,

} from "recharts"

import { format, subMonths } from "date-fns"

import { fr } from "date-fns/locale"

import { apiUrl } from "@/util/config"

import { getAccessToken } from "@/util/biscuit"

import { generateText } from "ai"

import { openai } from "@ai-sdk/openai"

import {

  Trophy,

  ShoppingBag,

  Calendar,

  TrendingUp,

  Award,

  Star,

  Clock,

  CheckCircle2,

  AlertCircle,

  Download,

  RefreshCw,

  FileText,

  PlusCircle,

  Info,

} from "lucide-react"



// Types pour les données
interface RawAgentPerformance {
  id: number;
  username?: string;
  clients?: number;
  products?: number;
  events?: number;
  presence_rate?: number;
  presence_count?: number;
  absence_count?: number;
  revenue?: number;
  satisfaction_score?: number | null;
  score?: number;
}

interface RawRanking {
  agent: number;
  agent_name: string;
  rank: number;
  score: number;
  highlights?: string[];
}
interface Agent {

  id: number

  username: string

  first_name: string

  last_name: string

  photo_url?: string

  location: string

  phone_number?: string

  is_staff?: boolean

  is_superuser?: boolean

}



interface AgentPerformance {

  agent_id: number

  agent_username: string

  clients_count: number

  products_sold: number

  events_count: number

  presence_rate: number

  presence_count: number

  absence_count: number

  month: string

  year: number

  revenue_generated?: number

  satisfaction_score?: number

  score?: number

}



interface MonthlyRanking {

  month: string

  year: number

  rankings: {

    agent_id: number

    agent_name: string

    rank: number

    score: number

    highlights: string[]

  }[]

}



interface AIAnalysis {

  top_agent: {

    agent_id: number

    agent_name: string

    score: number

    strengths: string[]

    improvement_areas: string[]

  }

  insights: string[]

  recommendations: string[]

}



interface EventPerformance {

  id?: number

  event_id: number

  event_name?: string

  revenue: number

  products_sold: number

  client_satisfaction: number

  notes?: string

}



interface Event {

  id: number

  location: string

  company_name: string

  event_code: string

  start_date: string

  end_date: string

  agents: number[]

}



interface PresenceStats {

  total_presences: number

  approved_presences: number

  rejected_presences: number

  pending_presences: number

  agent_stats: {

    agent__username: string

    total: number

    approved: number

    rejected: number

    pending: number

  }[]

}



const CURRENCY = "AR"

// Couleurs pour les graphiques





// Style personnalisé pour les listes déroulantes

const selectContentClass = "bg-gray-800 text-white border-gray-700"



// Fonction pour obtenir le libellé de satisfaction

const getSatisfactionLabel = (score: number): string => {

  switch (score) {

    case 0:

      return "Non évalué"

    case 1:

      return "Insatisfait"

    case 2:

      return "Peu satisfait"

    case 3:

      return "Neutre"

    case 4:

      return "Satisfait"

    case 5:

      return "Très satisfait"

    default:

      return "Non évalué"

  }

}







export default function AgentEvaluation() {

  // États pour les données

  const [agents, setAgents] = useState<Agent[]>([])

  const [performances, setPerformances] = useState<AgentPerformance[]>([])

  const [monthlyRankings, setMonthlyRankings] = useState<MonthlyRanking[]>([])

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)

  

  const [agentEvents, setAgentEvents] = useState<Event[]>([])

  const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null)

  const [presenceStats, setPresenceStats] = useState<PresenceStats | null>(null)



  // États pour les filtres et la pagination

  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"))

  const [selectedAgent, setSelectedAgent] = useState<string>("all")

  



  // États pour le formulaire de rapport

  const [selectedReportAgent, setSelectedReportAgent] = useState<string>("")

  const [selectedEvent, setSelectedEvent] = useState<string>("")

  const [reportData, setReportData] = useState<EventPerformance>({

    event_id: 0,

    revenue: 0,

    products_sold: 0,

    client_satisfaction: 0,

    notes: "",

  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const [reportSuccess, setReportSuccess] = useState<string | null>(null)

  const [reportError, setReportError] = useState<string | null>(null)

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  const [existingPerformance, setExistingPerformance] = useState<EventPerformance | null>(null)



  // États pour le chargement et les erreurs

  const [loading, setLoading] = useState({

    agents: true,

    performances: true,

    rankings: true,

    analysis: false,

    events: false,

    agentEvents: false,

    eventDetails: false,

    presenceStats: false,

  })

  const [error, setError] = useState<string | null>(null)

  const [generatingAnalysis, setGeneratingAnalysis] = useState(false)


  const fetchEvents = useCallback(async () => {

    try {

      setLoading((prev) => ({ ...prev, events: true }))

      const accessToken = await getAccessToken()



      // Extraire l'année et le mois du filtre

     



      const response = await fetch(`${apiUrl}/event/`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la récupération des événements: ${response.status}`)

      }

      

    } catch (err) {

      console.error("Erreur lors du chargement des événements:", err)

      setError("Impossible de charger la liste des événements")

    } finally {

      setLoading((prev) => ({ ...prev, events: false }))

    }

  },[selectedMonth]);
  const fetchPresenceStats = useCallback(async () => {

    try {

      setLoading((prev) => ({ ...prev, presenceStats: true }))

      const accessToken = await getAccessToken()



      // Ajouter le paramètre de mois à la requête

      const url = `${apiUrl}/presence/dashboard/?month=${selectedMonth}`



      const response = await fetch(url, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la récupération des statistiques de présence: ${response.status}`)

      }



      const data = await response.json()

      console.log("Statistiques de présence reçues:", data)

      setPresenceStats(data)

    } catch (err) {

      console.error("Erreur lors du chargement des statistiques de présence:", err)

    } finally {

      setLoading((prev) => ({ ...prev, presenceStats: false }))

    }

  },[]);
  const fetchPerformances = useCallback(async () => {

    try {

      setLoading((prev) => ({ ...prev, performances: true }))

      const accessToken = await getAccessToken()



      // Extraire l'année et le mois du filtre

      const [year, month] = selectedMonth.split("-")



      const response = await fetch(`${apiUrl}/evaluation/agent-performances/?month=${selectedMonth}`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la récupération des performances: ${response.status}`)

      }



      const data = await response.json()

      console.log("Données de performance reçues :", data)



      // Adapter le format des données reçues au format attendu par l'interface

      const formattedData = data.map((agent: RawAgentPerformance) => {
        let satisfactionScore = 0;
        if (agent.satisfaction_score !== undefined && agent.satisfaction_score !== null) {
          satisfactionScore = Number.parseFloat(agent.satisfaction_score.toString());
          if (isNaN(satisfactionScore)) satisfactionScore = 0;
        }
      
        return {
          agent_id: agent.id,
          agent_username: agent.username || `Agent ${agent.id}`,
          clients_count: agent.clients || 0,
          products_sold: agent.products || 0,
          events_count: agent.events || 0,
          presence_rate: agent.presence_rate || 0,
          presence_count: agent.presence_count || 0,
          absence_count: agent.absence_count || 0,
          revenue_generated: agent.revenue || 0,
          satisfaction_score: satisfactionScore,
          score: agent.score || 0,
          month: format(new Date(Number.parseInt(year), Number.parseInt(month) - 1), "MMMM", { locale: fr }),
          year: Number.parseInt(year),
        };
      });



      console.log("Performances formatées :", formattedData)

      setPerformances(formattedData)

    } catch (err) {

      console.error("Erreur lors du chargement des performances:", err)

      setError("Impossible de charger les données de performance")



      // En cas d'erreur, utiliser des données simulées pour la démo

      if (agents.length > 0) {

        const mockData = generateMockPerformanceData(

          agents,

          Number.parseInt(selectedMonth.split("-")[0]),

          Number.parseInt(selectedMonth.split("-")[1]),

        )

        setPerformances(mockData)

      }

    } finally {

      setLoading((prev) => ({ ...prev, performances: false }))

    }

  },[agents, selectedMonth])
  // Effet pour charger les données initiales

  useEffect(() => {

    fetchAgents()

    fetchEvents()

    fetchPerformances()

    

    fetchPresenceStats()

  }, [])

  
  const fetchMonthlyRankings = useCallback(async () => {

    try {

      setLoading((prev) => ({ ...prev, rankings: true }))

      const accessToken = await getAccessToken()



      // Extraire l'année et le mois du filtre

      const [year, month] = selectedMonth.split("-")



      const response = await fetch(`${apiUrl}/evaluation/rankings/?month=${selectedMonth}`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la récupération des classements: ${response.status}`)

      }



      const data = await response.json()



      // Adapter le format des données reçues au format attendu par l'interface

      const formattedRankings = [
        {
          month: format(new Date(Number.parseInt(year), Number.parseInt(month) - 1), "MMMM", { locale: fr }),
          year: Number.parseInt(year),
          rankings: data.map((ranking: RawRanking) => ({
            agent_id: ranking.agent,
            agent_name: ranking.agent_name,
            rank: ranking.rank,
            score: ranking.score,
            highlights: ranking.highlights || ["Performance exceptionnelle", "Excellent taux de présence"],
          })),
        },
      ];



      setMonthlyRankings(formattedRankings)

    } catch (err) {

      console.error("Erreur lors du chargement des classements:", err)

      setError("Impossible de charger les données de classement")



      // En cas d'erreur, utiliser des données simulées pour la démo

      if (agents.length > 0) {

        const mockRankings = generateMockRankingData(

          agents,

          Number.parseInt(selectedMonth.split("-")[0]),

          Number.parseInt(selectedMonth.split("-")[1]),

        )

        setMonthlyRankings(mockRankings)

      }

    } finally {

      setLoading((prev) => ({ ...prev, rankings: false }))

    }

  },[agents, selectedMonth]);

  // Effet pour recharger les performances lorsque le mois change

  useEffect(() => {
    fetchPerformances()
    fetchMonthlyRankings()
    fetchEvents()
  }, [selectedMonth]);



  // Effet pour recharger les statistiques de présence lorsque le mois change

  useEffect(() => {
    fetchPresenceStats()
  }, [selectedMonth])

  const fetchAgentEvents = useCallback(async (agentId: number) => {

    try {

      setLoading((prev) => ({ ...prev, agentEvents: true }))

      const accessToken = await getAccessToken()

      console.log("Récupération des événements pour l'agent ID:", agentId)



      // Extraire l'année et le mois du filtre pour limiter aux événements du mois sélectionné

      const [year, month] = selectedMonth.split("-")



      // Utiliser l'endpoint correct et passer l'ID de l'agent comme paramètre de requête

      const response = await fetch(`${apiUrl}/event/?agents=${agentId}`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la récupération des événements de l'agent: ${response.status}`)

      }



      const data = await response.json()

      console.log("Événements récupérés pour l'agent:", data)



      // Filtrer les événements pour n'inclure que ceux du mois sélectionné

      const filteredEvents = data.filter((event: Event) => {

        const eventStartDate = new Date(event.start_date)

        return (

          eventStartDate.getFullYear() === Number.parseInt(year) &&

          eventStartDate.getMonth() === Number.parseInt(month) - 1

        )

      })



      console.log("Événements filtrés par mois:", filteredEvents)

      setAgentEvents(filteredEvents)

    } catch (err) {

      console.error("Erreur lors du chargement des événements de l'agent:", err)

      setAgentEvents([])

    } finally {

      setLoading((prev) => ({ ...prev, agentEvents: false }))

    }

  },[selectedMonth]);
  useEffect(() => {
    if (selectedReportAgent) {
      fetchAgentEvents(Number.parseInt(selectedReportAgent))
    } else {
      setAgentEvents([])
    }
  }, [selectedReportAgent, fetchAgentEvents])



  // Effet pour mettre à jour les données du rapport lorsqu'un événement est sélectionné

  useEffect(() => {

    if (selectedEvent) {

      // Mettre à jour l'ID de l'événement dans les données du rapport

      setReportData((prev) => ({

        ...prev,

        event_id: Number.parseInt(selectedEvent),

      }))



      // Récupérer les détails de l'événement sélectionné

      const eventId = Number.parseInt(selectedEvent)

      const event = agentEvents.find((e) => e.id === eventId)

      if (event) {

        setSelectedEventDetails(event)

        // Vérifier si une performance existe déjà pour cet événement

        checkExistingPerformance(eventId)

      }

    } else {

      setSelectedEventDetails(null)

      setExistingPerformance(null)

    }

  }, [selectedEvent, agentEvents])



  // Fonction pour récupérer les statistiques de présence

  



  // Fonction pour obtenir les statistiques de présence d'un agent spécifique

  const getAgentPresenceStats = (username: string) => {

    if (!presenceStats) return null

    return presenceStats.agent_stats.find((stat) => stat.agent__username === username)

  }



  // Fonction pour vérifier si une performance existe déjà pour un événement

  const checkExistingPerformance = async (eventId: number) => {

    try {

      const accessToken = await getAccessToken()

      const response = await fetch(`${apiUrl}/evaluation/performances/?event_id=${eventId}`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la vérification des performances existantes: ${response.status}`)

      }



      const data = await response.json()

      if (data && data.length > 0) {

        setExistingPerformance(data[0])

        // Pré-remplir le formulaire avec les données existantes

        setReportData({

          id: data[0].id,

          event_id: data[0].event_id,

          revenue: data[0].revenue,

          products_sold: data[0].products_sold,

          client_satisfaction: data[0].client_satisfaction,

          notes: data[0].notes || "",

        })

      } else {

        setExistingPerformance(null)

        // Réinitialiser le formulaire pour un nouveau rapport

        setReportData({

          event_id: eventId,

          revenue: 0,

          products_sold: 0,

          client_satisfaction: 0,

          notes: "",

        })

      }

    } catch (err) {

      console.error("Erreur lors de la vérification des performances existantes:", err)

      setExistingPerformance(null)

    }

  }



  // Fonction pour récupérer la liste des agents (uniquement les agents, pas les administrateurs)

  const fetchAgents = async () => {

    try {

      setLoading((prev) => ({ ...prev, agents: true }))

      const accessToken = await getAccessToken()

      console.log("Token d'accès :", accessToken)

      console.log("URL de l'API :", `${apiUrl}/accounts/agents/`)



      const response = await fetch(`${apiUrl}/accounts/agents/`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la récupération des agents: ${response.status}`)

      }



      const data = await response.json()

      console.log("Données brutes des agents reçues :", data)



      // Filtrer pour exclure les superusers

      const onlyAgents = data.filter((agent: Agent) => !agent.is_superuser)

      console.log("Agents après filtrage :", onlyAgents)



      if (onlyAgents.length === 0) {

        console.warn("Aucun agent valide après filtrage. Vérifiez les données de l'API.")

      }



      setAgents(onlyAgents)

    } catch (err) {

      console.error("Erreur lors du chargement des agents:", err)

      setError(`Impossible de charger la liste des agents: ${err instanceof Error ? err.message : "Erreur inconnue"}`)

    } finally {

      setLoading((prev) => ({ ...prev, agents: false }))

    }

  }



  // Fonction pour récupérer tous les événements

  



  // Fonction pour récupérer les événements d'un agent spécifique

  



  // Fonction pour récupérer les performances des agents

 



  // Fonction pour récupérer les classements mensuels

  



  // Fonction pour soumettre un rapport de performance pour un événement

  const submitPerformanceReport = async () => {

    try {

      setIsSubmitting(true)

      setReportError(null)

      setReportSuccess(null)



      const accessToken = await getAccessToken()



      // Créer un objet avec les données à envoyer

      // Important: Envoyer les valeurs numériques comme des chaînes pour éviter les problèmes de validation côté serveur

      const dataToSubmit = {

        event_id: reportData.event_id,

        revenue: reportData.revenue.toString(),

        products_sold: reportData.products_sold.toString(),

        client_satisfaction: reportData.client_satisfaction.toString(),

        notes: reportData.notes || "",

      }



      console.log("Données à soumettre:", dataToSubmit)



      // Déterminer si c'est une mise à jour ou une création

      const method = existingPerformance ? "PUT" : "POST"

      const url = existingPerformance

        ? `${apiUrl}/evaluation/performances/${existingPerformance.id}/`

        : `${apiUrl}/evaluation/performances/`



      const response = await fetch(url, {

        method: method,

        headers: {

          Authorization: `Bearer ${accessToken}`,

          "Content-Type": "application/json",

        },

        body: JSON.stringify(dataToSubmit),

      })



      if (!response.ok) {

        const errorData = await response.json()

        console.error("Erreur de réponse:", errorData)

        throw new Error(`Erreur lors de la soumission du rapport: ${response.status} - ${JSON.stringify(errorData)}`)

      }



      setReportSuccess("Rapport de performance enregistré avec succès!")



      // Réinitialiser le formulaire

      setReportData({

        event_id: 0,

        revenue: 0,

        products_sold: 0,

        client_satisfaction: 0,

        notes: "",

      })

      setSelectedEvent("")

      setExistingPerformance(null)



      // Rafraîchir les données

      fetchPerformances()



      // Fermer la boîte de dialogue après un court délai

      setTimeout(() => {

        setIsReportDialogOpen(false)

      }, 1500)

    } catch (err) {

      console.error("Erreur lors de la soumission du rapport:", err)

      setReportError(

        `Impossible d'enregistrer le rapport de performance: ${err instanceof Error ? err.message : "Erreur inconnue"}`,

      )

    } finally {

      setIsSubmitting(false)

    }

  }



  // Fonction pour générer une analyse IA

  const generateAIAnalysis = async () => {

    try {

      setGeneratingAnalysis(true)

      const accessToken = await getAccessToken()



      // Appeler l'API d'analyse IA avec le paramètre refresh=true pour forcer la régénération

      const response = await fetch(`${apiUrl}/evaluation/ai-analysis/?month=${selectedMonth}&refresh=true`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de la génération de l'analyse IA: ${response.status}`)

      }



      const data = await response.json()



      // Adapter le format des données reçues au format attendu par l'interface

      const formattedAnalysis = {

        top_agent: {

          agent_id: data.analysis_json.top_performer?.id || 0,

          agent_name: data.analysis_json.top_performer?.name || "Non disponible",

          score: data.analysis_json.top_performer?.score || 0,

          strengths: data.analysis_json.top_performer?.highlights || [],

          improvement_areas: data.analysis_json.top_performer?.improvement_areas || [],

        },

        insights: data.analysis_json.team_insights?.strengths || [],

        recommendations: data.analysis_json.recommendations || [],

      }



      setAiAnalysis(formattedAnalysis)

    } catch (err) {

      console.error("Erreur lors de la génération de l'analyse IA:", err)

      setError("Impossible de générer l'analyse IA")



      // En cas d'erreur, utiliser l'API OpenAI comme fallback

      try {

        await generateAIAnalysisWithOpenAI()

      } catch (fallbackErr) {

        console.error("Erreur lors de la génération de l'analyse IA avec OpenAI:", fallbackErr)

      }

    } finally {

      setGeneratingAnalysis(false)

    }

  }



  // Fonction de fallback pour l'analyse IA avec OpenAI

  const generateAIAnalysisWithOpenAI = async () => {

    try {

      // Préparer les données pour l'IA

      const [year, month] = selectedMonth.split("-")

      const monthName = format(new Date(Number.parseInt(year), Number.parseInt(month) - 1), "MMMM yyyy", { locale: fr })



      // Formater les données de performance pour l'IA

      const performanceData = performances.map((p) => ({

        agent: p.agent_username,

        products: p.products_sold,

        events: p.events_count,

        presence: `${p.presence_rate}% (${p.presence_count} présences, ${p.absence_count} absences)`,

        revenue: `${p.revenue_generated} ${CURRENCY}`,

        satisfaction: `${p.satisfaction_score}/10`,

      }))



      // Créer le prompt pour l'IA

      const prompt = `

      Analyse les performances des agents pour le mois de ${monthName} et détermine qui est l&apos;agent du mois.

      

      Données de performance:

      ${JSON.stringify(performanceData, null, 2)}

      

      Critères d'évaluation:

      - Produits vendus (importance: élevée)

      - Événements gérés (importance: moyenne)

      - Taux de présence (importance: élevée)

      - Revenus générés (importance: élevée)

      - Score de satisfaction (importance: moyenne)

      

      Fournis une analyse structurée avec&nbsp;:

      1. L'agent du mois (nom, score global, forces principales)

      2. 3-5 insights clés sur les performances globales de l'équipe

      3. 2-3 recommandations concrètes pour améliorer les performances

      

      Format de réponse souhaité (JSON):

      {

        "top_agent": {

          "agent_id": 123,

          "agent_name": "Nom de l'agent",

          "score": 8.5,

          "strengths": ["Force 1", "Force 2", "Force 3"],

          "improvement_areas": ["Domaine d'amélioration 1", "Domaine d'amélioration 2"]

        },

        "insights": [

          "Insight 1",

          "Insight 2",

          "Insight 3"

        ],

        "recommendations": [

          "Recommandation 1",

          "Recommandation 2"

        ]

      }

      

      Réponds uniquement avec le JSON, sans texte supplémentaire.

      `



      // Appeler l'API OpenAI via AI SDK

      const { text } = await generateText({

        model: openai("gpt-4o"),

        prompt: prompt,

      })



      // Parser la réponse JSON

      const analysis = JSON.parse(text)

      setAiAnalysis(analysis)

    } catch (err) {

      console.error("Erreur lors de la génération de l'analyse IA avec OpenAI:", err)

      throw err

    }

  }



  // Fonction pour exporter les données en CSV

  const exportToCSV = async () => {

    try {

      const accessToken = await getAccessToken()



      // Appeler l'API d'export CSV

      const response = await fetch(`${apiUrl}/evaluation/export-csv/?month=${selectedMonth}`, {

        headers: {

          Authorization: `Bearer ${accessToken}`,

        },

      })



      if (!response.ok) {

        throw new Error(`Erreur lors de l'export CSV: ${response.status}`)

      }



      // Récupérer le contenu CSV

      const csvContent = await response.text()



      // Créer un blob et un lien de téléchargement

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })

      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")

      link.setAttribute("href", url)

      link.setAttribute("download", `evaluation-agents-${selectedMonth}.csv`)

      link.style.visibility = "hidden"

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)

    } catch (err) {

      console.error("Erreur lors de l'exportation CSV:", err)

      setError("Impossible d'exporter les données en CSV")



      // En cas d'erreur, utiliser la méthode de fallback

      exportToCSVFallback()

    }

  }



  // Fonction pour exporter les données en CSV

  const exportToCSVFallback = () => {
    // Ajouter un titre pour le fichier
    const title = `"ÉVALUATION DES AGENTS - ${formatMonth(selectedMonth).toUpperCase()}"`;
  
    // Créer les en-têtes CSV en majuscules, entourés de guillemets
    const headers = [
      "AGENT",
      "PRODUITS VENDUS",
      "ÉVÉNEMENTS",
      "TAUX DE PRÉSENCE",
      "PRÉSENCES",
      "ABSENCES",
      "REVENUS GÉNÉRÉS",
      "SATISFACTION",
    ].map((header) => `"${header}"`).join(",");
  
    // Créer les lignes de données, entourer chaque valeur de guillemets
    const rows = performances.map((p) =>
      [
        `"${p.agent_username}"`, // Guillemets pour gérer les virgules dans les noms
        `"${p.products_sold}"`,
        `"${p.events_count}"`,
        `"${p.presence_rate}%"`,
        `"${p.presence_count}"`,
        `"${p.absence_count}"`,
        `"${p.revenue_generated} ${CURRENCY}"`,
        `"${p.satisfaction_score}/5"`, // Ajout de "/5" pour plus de clarté
      ].join(","),
    );
  
    // Calculer les totaux pour un résumé
    const totalProducts = performances.reduce((sum, p) => sum + p.products_sold, 0);
    const totalEvents = performances.reduce((sum, p) => sum + p.events_count, 0);
    const totalRevenue = performances.reduce((sum, p) => sum + (p.revenue_generated ?? 0), 0);
    const avgPresenceRate =
      performances.length > 0
        ? Math.round(performances.reduce((sum, p) => sum + p.presence_rate, 0) / performances.length)
        : 0;
    const totalPresences = performances.reduce((sum, p) => sum + p.presence_count, 0);
    const totalAbsences = performances.reduce((sum, p) => sum + p.absence_count, 0);
    const avgSatisfaction =
      performances.length > 0
        ? Math.round(
            performances.reduce(
              (sum, p) => sum + (p.satisfaction_score || 0),
              0
            ) / performances.length
          )
        : 0;
  
    // Créer une ligne de résumé
    const summary = [
      `"TOTAUX"`,
      `"${totalProducts}"`,
      `"${totalEvents}"`,
      `"${avgPresenceRate}%"`,
      `"${totalPresences}"`,
      `"${totalAbsences}"`,
      `"${totalRevenue} ${CURRENCY}"`,
      `"${avgSatisfaction}/5"`,
    ].join(",");
  
    // Assembler le CSV avec une structure claire
    const csv = [
      title, // Titre
      "",    // Ligne vide pour séparation
      headers, // En-têtes
      ...rows, // Données
      "",      // Ligne vide pour séparation
      summary, // Résumé des totaux
    ].join("\n");
  
    // Créer un blob et un lien de téléchargement
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `evaluation-agents-${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  // Fonction pour obtenir les données filtrées

  const getFilteredPerformances = () => {

    if (selectedAgent === "all") {

      return performances

    }

    return performances.filter((p) => p.agent_id === Number.parseInt(selectedAgent))

  }



  // Fonction pour obtenir le classement du mois sélectionné

  const getCurrentMonthRanking = () => {

    const [year, month] = selectedMonth.split("-")

    return monthlyRankings.find(

      (r) =>

        r.year === Number.parseInt(year) &&

        r.month === format(new Date(Number.parseInt(year), Number.parseInt(month) - 1), "MMMM", { locale: fr }),

    )

  }



  // Fonction pour obtenir l'agent du mois

  const getAgentOfTheMonth = () => {

    const ranking = getCurrentMonthRanking()

    if (!ranking) return null



    return ranking.rankings.find((r) => r.rank === 1)

  }



  const getOverallScore = (agentId: number) => {

    const agentPerf = performances.find((p) => p.agent_id === agentId);

    if (!agentPerf) return 0;

  

    // Utiliser directement le score provenant des données de performance

    return agentPerf.score || 0;

  };



  // Fonction pour formater le mois en texte

  const formatMonth = (yearMonth: string) => {

    const [year, month] = yearMonth.split("-")

    return format(new Date(Number.parseInt(year), Number.parseInt(month) - 1), "MMMM yyyy", { locale: fr })

  }



  // Fonction pour formater la date

  const formatDate = (dateString: string) => {

    const date = new Date(dateString)

    return format(date, "dd MMMM yyyy", { locale: fr })

  }



  // Fonction pour générer des données de performance simulées

  const generateMockPerformanceData = (agents: Agent[], year: number, month: number): AgentPerformance[] => {

    return agents.map((agent) => {

      // Générer des valeurs aléatoires mais réalistes

      const productsSold = Math.floor(Math.random() * 50) + 10

      const eventsCount = Math.floor(Math.random() * 15) + 2

      const presenceCount = Math.floor(Math.random() * 20) + 10

      const absenceCount = Math.floor(Math.random() * 5)

      const totalDays = presenceCount + absenceCount

      const presenceRate = totalDays > 0 ? Math.round((presenceCount / totalDays) * 100) : 0

      const revenueGenerated = Math.floor(Math.random() * 5000) + 1000

      const satisfactionScore = Math.min(5, Math.round(Math.random() * 3 + 2))



      return {

        agent_id: agent.id,

        agent_username: agent.username,

        clients_count: 0, // Supprimé comme demandé

        products_sold: productsSold,

        events_count: eventsCount,

        presence_rate: presenceRate,

        presence_count: presenceCount,

        absence_count: absenceCount,

        revenue_generated: revenueGenerated,

        satisfaction_score: satisfactionScore,

        month: format(new Date(year, month - 1), "MMMM", { locale: fr }),

        year: year,

      }

    })

  }



  // Fonction pour générer des données de classement simulées

  const generateMockRankingData = (agents: Agent[], year: number, month: number): MonthlyRanking[] => {

    // Créer un classement pour le mois sélectionné

    const rankings = agents.map((agent) => {

      const score = Math.round(Math.random() * 40) + 60

      return {

        agent_id: agent.id,

        agent_name: `${agent.first_name} ${agent.last_name}`,

        score: score,

        rank: 0, // Sera défini après le tri

        highlights: ["Excellente gestion des clients", "Bonne présence", "Ventes supérieures à la moyenne"].slice(

          0,

          Math.floor(Math.random() * 3) + 1,

        ),

      }

    })



    // Trier par score et attribuer les rangs

    rankings.sort((a, b) => b.score - a.score)

    rankings.forEach((ranking, index) => {

      ranking.rank = index + 1

    })



    return [

      {

        month: format(new Date(year, month - 1), "MMMM", { locale: fr }),

        year: year,

        rankings: rankings,

      },

    ]

  }



  // Ajouter des useEffect pour faire disparaître les messages après 3 secondes

  useEffect(() => {

    if (reportSuccess) {

      const timer = setTimeout(() => {

        setReportSuccess(null)

      }, 3000)

      return () => clearTimeout(timer)

    }

  }, [reportSuccess])



  useEffect(() => {

    if (reportError) {

      const timer = setTimeout(() => {

        setReportError(null)

      }, 3000)

      return () => clearTimeout(timer)

    }

  }, [reportError])



  useEffect(() => {

    if (error) {

      const timer = setTimeout(() => {

        setError(null)

      }, 3000)

      return () => clearTimeout(timer)

    }

  }, [error])



  // Rendu du composant

  return (

    <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 min-h-screen">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

        <div>

          <h1 className="text-3xl font-bold text-green-800 dark:text-green-100">Évaluation des Agents</h1>

          <p className="text-gray-600 dark:text-gray-300">Analysez les performances et identifiez l agent du mois</p>

        </div>



        <div className="flex flex-col sm:flex-row gap-2">

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
  <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
    <SelectValue placeholder="Sélectionner un mois" />
  </SelectTrigger>
  <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-white">
    {Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), i);
      const value = format(date, "yyyy-MM");
      const label = format(date, "MMMM yyyy", { locale: fr });
      return (
        <SelectItem key={value} value={value}>
          {label}
        </SelectItem>
      );
    })}
  </SelectContent>
</Select> */}



          <Button variant="outline" className="gap-2" onClick={exportToCSV}>

            <Download size={16} />

            Exporter CSV

          </Button>

        </div>

      </div>



      {/* Bouton pour ajouter un rapport de performance */}

      <div className="flex justify-end">

        <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>

          <DialogTrigger asChild>

            <Button className="gap-2 bg-green-600 hover:bg-green-700">

              <PlusCircle size={16} />

              Ajouter un rapport de performance

            </Button>

          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white">

            <DialogHeader>

              <DialogTitle>

                {existingPerformance ? "Modifier le rapport de performance" : "Nouveau rapport de performance"}

              </DialogTitle>

              <DialogDescription className="text-gray-400">

                Saisissez les données de performance pour un événement spécifique.

              </DialogDescription>

            </DialogHeader>

            <div className="grid gap-4 py-4">

              <div className="grid gap-2">

                <Label htmlFor="agent" className="text-white">

                  Agent

                </Label>

                <Select value={selectedReportAgent} onValueChange={setSelectedReportAgent}>

                  <SelectTrigger id="agent" className="bg-gray-800 text-white border-gray-700">

                    <SelectValue placeholder="Sélectionner un agent" />

                  </SelectTrigger>

                  <SelectContent className={selectContentClass}>

                    {agents.map((agent) => (

                      <SelectItem key={agent.id} value={agent.id.toString()} className="text-white hover:bg-gray-700">

                        {agent.username}

                      </SelectItem>

                    ))}

                  </SelectContent>

                </Select>

              </div>

              <div className="grid gap-2">

                <Label htmlFor="event" className="text-white">

                  Événement

                </Label>

                <Select

                  value={selectedEvent}

                  onValueChange={setSelectedEvent}

                  disabled={!selectedReportAgent || loading.agentEvents}

                >

                  <SelectTrigger id="event" className="bg-gray-800 text-white border-gray-700">

                    <SelectValue placeholder={loading.agentEvents ? "Chargement..." : "Sélectionner un événement"} />

                  </SelectTrigger>

                  <SelectContent className={selectContentClass}>

                    {agentEvents.length > 0 ? (

                      agentEvents.map((event) => (

                        <SelectItem key={event.id} value={event.id.toString()} className="text-white hover:bg-gray-700">

                          {event.company_name} - {event.event_code}

                        </SelectItem>

                      ))

                    ) : (

                      <SelectItem value="no-events" disabled className="text-gray-500">

                        Aucun événement disponible

                      </SelectItem>

                    )}

                  </SelectContent>

                </Select>

              </div>



              {selectedEventDetails && (

                <div className="bg-gray-800 p-3 rounded-md border border-gray-700 mt-2">

                  <h4 className="text-sm font-medium text-gray-300 mb-2">Détails de l événement</h4>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">

                    <div>

                      <span className="block font-medium">Lieu:</span>

                      <span>{selectedEventDetails.location}</span>

                    </div>

                    <div>

                      <span className="block font-medium">Entreprise:</span>

                      <span>{selectedEventDetails.company_name}</span>

                    </div>

                    <div>

                      <span className="block font-medium">Date de début:</span>

                      <span>{formatDate(selectedEventDetails.start_date)}</span>

                    </div>

                    <div>

                      <span className="block font-medium">Date de fin:</span>

                      <span>{formatDate(selectedEventDetails.end_date)}</span>

                    </div>

                  </div>

                </div>

              )}



              {existingPerformance && (

                <Alert className="bg-blue-900 border-blue-700 text-blue-100">

                  <Info className="h-4 w-4" />

                  <AlertTitle>Rapport existant</AlertTitle>

                  <AlertDescription>

                    Un rapport existe déjà pour cet événement. Vous êtes en train de le modifier.

                  </AlertDescription>

                </Alert>

              )}



              <div className="grid gap-2">

                <Label htmlFor="revenue" className="text-white">

                  Revenus générés ({CURRENCY})

                </Label>

                <Input

                  id="revenue"

                  type="number"

                  min="0"

                  step="0.01"

                  value={reportData.revenue}

                  onChange={(e) => setReportData({ ...reportData, revenue: Number.parseFloat(e.target.value) })}

                  className="bg-gray-800 text-white border-gray-700"

                />

              </div>

              <div className="grid gap-2">

                <Label htmlFor="products" className="text-white">

                  Produits vendus

                </Label>

                <Input

                  id="products"

                  type="number"

                  min="0"

                  value={reportData.products_sold}

                  onChange={(e) => setReportData({ ...reportData, products_sold: Number.parseInt(e.target.value) })}

                  className="bg-gray-800 text-white border-gray-700"

                />

              </div>

              <div className="grid gap-2">

                <Label htmlFor="satisfaction" className="text-white">

                  Satisfaction client (0-5)

                </Label>

                <Select

                  value={reportData.client_satisfaction.toString()}

                  onValueChange={(value) =>

                    setReportData({ ...reportData, client_satisfaction: Number.parseInt(value) })

                  }

                >

                  <SelectTrigger id="satisfaction" className="bg-gray-800 text-white border-gray-700">

                    <SelectValue placeholder="Sélectionner un niveau" />

                  </SelectTrigger>

                  <SelectContent className={selectContentClass}>

                    <SelectItem value="0" className="text-white hover:bg-gray-700">

                      Non évalué

                    </SelectItem>

                    <SelectItem value="1" className="text-white hover:bg-gray-700">

                      Insatisfait

                    </SelectItem>

                    <SelectItem value="2" className="text-white hover:bg-gray-700">

                      Peu satisfait

                    </SelectItem>

                    <SelectItem value="3" className="text-white hover:bg-gray-700">

                      Neutre

                    </SelectItem>

                    <SelectItem value="4" className="text-white hover:bg-gray-700">

                      Satisfait

                    </SelectItem>

                    <SelectItem value="5" className="text-white hover:bg-gray-700">

                      Très satisfait

                    </SelectItem>

                  </SelectContent>

                </Select>

              </div>

              <div className="grid gap-2">

                <Label htmlFor="notes" className="text-white">

                  Notes

                </Label>

                <Textarea

                  id="notes"

                  value={reportData.notes || ""}

                  onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}

                  className="bg-gray-800 text-white border-gray-700"

                />

              </div>

            </div>

            {reportSuccess && (

              <Alert className="bg-green-900 text-green-100 border-green-700">

                <CheckCircle2 className="h-4 w-4" />

                <AlertTitle>Succès</AlertTitle>

                <AlertDescription>{reportSuccess}</AlertDescription>

              </Alert>

            )}

            {reportError && (

              <Alert variant="destructive" className="bg-red-900 border-red-700">

                <AlertCircle className="h-4 w-4" />

                <AlertTitle>Erreur</AlertTitle>

                <AlertDescription>{reportError}</AlertDescription>

              </Alert>

            )}

            <DialogFooter>

              <Button

                type="submit"

                onClick={submitPerformanceReport}

                disabled={isSubmitting || !selectedEvent}

                className="bg-green-600 hover:bg-green-700"

              >

                {isSubmitting ? "Enregistrement..." : existingPerformance ? "Mettre à jour" : "Enregistrer le rapport"}

              </Button>

            </DialogFooter>

          </DialogContent>

        </Dialog>

      </div>



      {error && (

        <Alert variant="destructive">

          <AlertCircle className="h-4 w-4" />

          <AlertTitle>Erreur</AlertTitle>

          <AlertDescription>{error}</AlertDescription>

        </Alert>

      )}



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Agent du mois */}

        <Card className="col-span-1 backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">

          <CardHeader className="pb-2">

            <CardTitle className="flex items-center gap-2 text-xl">

              <Trophy className="h-5 w-5 text-yellow-500" />

              Agent du Mois

            </CardTitle>

            <CardDescription>{formatMonth(selectedMonth)}</CardDescription>

          </CardHeader>

          <CardContent>

            {loading.rankings ? (

              <div className="space-y-4">

                <Skeleton className="h-16 w-16 rounded-full mx-auto" />

                <Skeleton className="h-6 w-32 mx-auto" />

                <Skeleton className="h-4 w-24 mx-auto" />

                <Skeleton className="h-20 w-full" />

              </div>

            ) : (

              <>

                {getAgentOfTheMonth() ? (

                  <div className="flex flex-col items-center text-center">

                    <div className="relative">

                      <Avatar className="h-20 w-20 border-2 border-yellow-500">

                        <AvatarImage

                          src={`/placeholder.svg?height=80&width=80`}

                          alt={getAgentOfTheMonth()?.agent_name}

                        />

                        <AvatarFallback className="bg-green-100 text-green-800 text-xl">

                          {getAgentOfTheMonth()

                            ?.agent_name.split(" ")

                            .map((n) => n[0])

                            .join("")}

                        </AvatarFallback>

                      </Avatar>

                      <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center">

                        <Trophy className="h-5 w-5" />

                      </div>

                    </div>



                    <h3 className="mt-4 text-xl font-bold text-green-800 dark:text-green-100">

                      {getAgentOfTheMonth()?.agent_name}

                    </h3>



                    <div className="mt-1 flex items-center gap-1">

                      <Badge

                        variant="secondary"

                        className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"

                      >

                        Score: {getAgentOfTheMonth()?.score}/100

                      </Badge>

                    </div>



                    <div className="mt-4 space-y-2">

                      {getAgentOfTheMonth()?.highlights.map((highlight, index) => (

                        <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">

                          <CheckCircle2 className="h-4 w-4 text-green-500" />

                          <span>{highlight}</span>

                        </div>

                      ))}

                    </div>

                  </div>

                ) : (

                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">

                    <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />

                    <p>Aucune donnée disponible pour ce mois</p>

                  </div>

                )}

              </>

            )}

          </CardContent>

        </Card>



        {/* Statistiques globales */}

        <Card className="col-span-1 lg:col-span-2 backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">

          <CardHeader className="pb-2">

            <CardTitle className="flex items-center gap-2 text-xl">

              <TrendingUp className="h-5 w-5 text-green-500" />

              Statistiques Globales

            </CardTitle>

            <CardDescription>Performance de l équipe pour {formatMonth(selectedMonth)}</CardDescription>

          </CardHeader>

          <CardContent>

            {loading.performances ? (

              <div className="flex justify-center grid grid-cols-2 md:grid-cols-4 gap-4">

                {Array.from({ length: 4 }).map((_, i) => (

                  <Skeleton key={i} className="h-24 w-full" />

                ))}

              </div>

            ) : (

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">

                    <ShoppingBag className="h-4 w-4" />

                    <span>Produits Vendus</span>

                  </div>

                  <div className="text-2xl font-bold text-green-800 dark:text-green-100">

                    {performances.reduce((sum, p) => sum + p.products_sold, 0)}

                  </div>

                </div>



                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">

                    <Calendar className="h-4 w-4" />

                    <span>Événements</span>

                  </div>

                  <div className="text-2xl font-bold text-green-800 dark:text-green-100">

                    {performances.reduce((sum, p) => sum + p.events_count, 0)}

                  </div>

                </div>



               {/* <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">

                    <Clock className="h-4 w-4" />

                    <span>Taux de Présence</span>

                  </div>

                  <div className="text-2xl font-bold text-green-800 dark:text-green-100">

                    {performances.length > 0

                      ? Math.round(performances.reduce((sum, p) => sum + p.presence_rate, 0) / performances.length)

                      : 0}

                    %

                  </div>

                </div>

*/}

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">

                    <Star className="h-4 w-4" />

                    <span>Satisfaction</span>

                  </div>

                  <div className="text-2xl font-bold text-green-800 dark:text-green-100">

                    {(() => {

                      if (performances.length === 0) return "0/5"



                      let totalScore = 0

                      let validScores = 0



                      performances.forEach((p) => {

                        if (

                          typeof p.satisfaction_score === "number" &&

                          !isNaN(p.satisfaction_score) &&

                          p.satisfaction_score > 0

                        ) {

                          totalScore += p.satisfaction_score

                          validScores++

                        }

                      })



                      if (validScores === 0) return "0/5"



                      // Calculer la moyenne arrondie sur 5

                      const avgScore = Math.round(totalScore / validScores)

                      return `${avgScore}/5`

                    })()}

                  </div>

                </div>

              </div>

            )}



            {!loading.performances && performances.length > 0 && (

              <div className="mt-6">

                <ResponsiveContainer width="100%" height={250}>

                  <BarChart data={performances} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>

                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="agent_username" />

                    <YAxis />

                    <Tooltip />

                    <Legend />

                    <Bar dataKey="products_sold" name="Produits" fill="#3b82f6" />

                    <Bar dataKey="events_count" name="Événements" fill="#f97316" />

                  </BarChart>

                </ResponsiveContainer>

              </div>

            )}

          </CardContent>

        </Card>



        {/* Analyse IA */}

        <Card className="col-span-1 lg:col-span-3 backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg hover:shadow-xl transition-shadow">

          <CardHeader className="pb-2">

            <div className="flex justify-between items-center">

              <CardTitle className="flex items-center gap-2 text-xl">

                <Star className="h-5 w-5 text-purple-500" />

                Analyse IA

              </CardTitle>

              <Button

                variant="outline"

                size="sm"

                onClick={generateAIAnalysis}

                disabled={generatingAnalysis || loading.performances}

                className="gap-2"

              >

                {generatingAnalysis ? (

                  <>

                    <RefreshCw className="h-4 w-4 animate-spin" />

                    Génération...

                  </>

                ) : (

                  <>

                    <RefreshCw className="h-4 w-4" />

                    Générer une analyse

                  </>

                )}

              </Button>

            </div>

            <CardDescription>Insights et recommandations générés par l IA</CardDescription>

          </CardHeader>

          <CardContent>

            {generatingAnalysis ? (

              <div className="space-y-4">

                <Skeleton className="h-8 w-64" />

                <Skeleton className="h-4 w-full" />

                <Skeleton className="h-4 w-full" />

                <Skeleton className="h-4 w-3/4" />

                <Skeleton className="h-8 w-48 mt-6" />

                <Skeleton className="h-4 w-full" />

                <Skeleton className="h-4 w-full" />

              </div>

            ) : aiAnalysis ? (

              <div className="space-y-6">

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-100 flex items-center gap-2 mb-3">

                    <Award className="h-5 w-5 text-yellow-500" />

                    Agent du mois selon l IA

                  </h3>



                  <div className="flex flex-col sm:flex-row gap-4 items-start">

                    <Avatar className="h-16 w-16 border-2 border-yellow-500">

                      <AvatarImage src={`/placeholder.svg?height=64&width=64`} alt={aiAnalysis.top_agent.agent_name} />

                      <AvatarFallback className="bg-green-100 text-green-800 text-xl">

                        {aiAnalysis.top_agent.agent_name

                          .split(" ")

                          .map((n) => n[0])

                          .join("")}

                      </AvatarFallback>

                    </Avatar>



                    <div className="flex-1">

                      <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100">

                        {aiAnalysis.top_agent.agent_name}

                      </h4>



                      <div className="flex items-center gap-2 mt-1">


                      </div>



                      <div className="mt-3 space-y-1">

                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Forces:</h5>

                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 pl-2">

                          {aiAnalysis.top_agent.strengths.map((strength, index) => (

                            <li key={index}>{strength}</li>

                          ))}

                        </ul>

                      </div>



                      <div className="mt-3 space-y-1">

                        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Axes d amélioration:</h5>

                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 pl-2">

                          {aiAnalysis.top_agent.improvement_areas.map((area, index) => (

                            <li key={index}>{area}</li>

                          ))}

                        </ul>

                      </div>

                    </div>

                  </div>

                </div>



                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-100 flex items-center gap-2 mb-3">

                      <TrendingUp className="h-5 w-5 text-blue-500" />

                      Insights clés

                    </h3>



                    <ul className="space-y-2">

                      {aiAnalysis.insights.map((insight, index) => (

                        <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">

                          <div className="mt-1 text-blue-500">•</div>

                          <p>{insight}</p>

                        </li>

                      ))}

                    </ul>

                  </div>



                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-100 flex items-center gap-2 mb-3">

                      <CheckCircle2 className="h-5 w-5 text-green-500" />

                      Recommandations

                    </h3>



                    <ul className="space-y-2">

                      {aiAnalysis.recommendations.map((recommendation, index) => (

                        <li key={index} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">

                          <div className="mt-1 text-green-500">•</div>

                          <p>{recommendation}</p>

                        </li>

                      ))}

                    </ul>

                  </div>

                </div>

              </div>

            ) : (

              <div className="flex flex-col items-center justify-center py-12 text-center">

                <Star className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />

                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">

                  Aucune analyse IA disponible

                </h3>

                <p className="text-gray-500 dark:text-gray-400 max-w-md">

                  Cliquez sur &quot;Générer une analyse&quot; pour obtenir des insights et recommandations basés sur les

                  performances des agents.

                </p>

              </div>

            )}

          </CardContent>

        </Card>

      </div>



      {/* Tableau détaillé des performances */}

      <Tabs defaultValue="performances" className="w-full">

        <TabsList className="grid grid-cols-3 max-w-md mx-auto mb-4">

          <TabsTrigger value="performances">Performances</TabsTrigger>

          <TabsTrigger value="presence">Présence</TabsTrigger>

          <TabsTrigger value="rankings">Classement</TabsTrigger>

        </TabsList>



        <TabsContent value="performances">

          <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">

            <CardHeader className="pb-2">

              <div className="flex justify-between items-center">

                <CardTitle className="text-xl">Performances Détaillées</CardTitle>

                <div className="flex items-center gap-2">


                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                        <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
                        <SelectValue placeholder="Tous les agents" />
                       </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 text-black dark:text-white">
                                          <SelectItem value="all">Tous les agents</SelectItem>
                                          {agents.map((agent) => (
                                            <SelectItem key={agent.id} value={agent.id.toString()}>
                                              {agent.username}
                                            </SelectItem>
                                          ))}
                          </SelectContent>
                        </Select>

                </div>

              </div>

            </CardHeader>

            <CardContent>

              {loading.performances ? (

                <div className="space-y-2">

                  {Array.from({ length: 5 }).map((_, i) => (

                    <Skeleton key={i} className="h-12 w-full" />

                  ))}

                </div>

              ) : performances.length > 0 ? (

                <div className="overflow-x-auto">

                  <Table>

                    <TableHeader>

                      <TableRow>

                        <TableHead>Agent</TableHead>

                        <TableHead className="text-right">Produits</TableHead>

                        <TableHead className="text-right">Événements</TableHead>

                        <TableHead className="text-right">Revenus</TableHead>

                        <TableHead className="text-right">Satisfaction</TableHead>

                        <TableHead className="text-right">Score Global</TableHead>

                      </TableRow>

                    </TableHeader>

                    <TableBody>

                      {getFilteredPerformances().map((performance) => (

                        <TableRow key={performance.agent_id}>

                          <TableCell className="font-medium">{performance.agent_username}</TableCell>

                          <TableCell className="text-right">{performance.products_sold}</TableCell>

                          <TableCell className="text-right">{performance.events_count}</TableCell>

                          <TableCell className="text-right">

                            {performance.revenue_generated} {CURRENCY}

                          </TableCell>



                          <TableCell className="text-right">

                            <div className="flex items-center justify-end gap-1">

                              {typeof performance.satisfaction_score === "number" &&

                              !isNaN(performance.satisfaction_score) ? (

                                <>

                                  <span>{getSatisfactionLabel(performance.satisfaction_score)}</span>

                                  <div className="flex">

                                    {Array.from({ length: 5 }).map((_, i) => (

                                      <Star

                                        key={i}

                                        className={`h-3 w-3 ${

                                          i < (performance.satisfaction_score ?? 0)

                                            ? "text-yellow-500 fill-yellow-500"

                                            : "text-gray-300"

                                        }`}

                                      />

                                    ))}

                                  </div>

                                </>

                              ) : (

                                <span className="text-gray-400">Non évalué</span>

                              )}

                            </div>

                          </TableCell>

                          <TableCell className="text-right">

                            <Badge

                              className={`

                              ${

                                getOverallScore(performance.agent_id) >= 80

                                  ? "bg-green-100 text-green-800"

                                  : getOverallScore(performance.agent_id) >= 60

                                    ? "bg-blue-100 text-blue-800"

                                    : "bg-orange-100 text-orange-800"

                              }

                            `}

                            >

                              {getOverallScore(performance.agent_id)}/100

                            </Badge>

                          </TableCell>

                        </TableRow>

                      ))}

                    </TableBody>

                  </Table>

                </div>

              ) : (

                <div className="text-center py-8 text-gray-500 dark:text-gray-400">

                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />

                  <p>Aucune donnée de performance disponible pour ce mois</p>

                  <p className="text-sm mt-2">Ajoutez des rapports de performance pour voir les données ici</p>

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>



        <TabsContent value="presence">

          <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">

            <CardHeader className="pb-2">

              <CardTitle className="text-xl">Statistiques de Présence</CardTitle>

            </CardHeader>

            <CardContent>

              {loading.performances || loading.presenceStats ? (

                <div className="space-y-2">

                  {Array.from({ length: 5 }).map((_, i) => (

                    <Skeleton key={i} className="h-12 w-full" />

                  ))}

                </div>

              ) : performances.length > 0 ? (

                <>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                      <h3 className="text-lg font-medium mb-4 text-green-800 dark:text-green-100">

                        Répartition présence/absence

                      </h3>



                      {(() => {

                        if (

                          !presenceStats ||

                          (presenceStats.approved_presences === 0 && presenceStats.rejected_presences === 0)

                        ) {

                          return (

                            <div className="text-center py-8 text-gray-500">

                              <p>Aucune donnée de présence disponible pour ce mois</p>

                            </div>

                          )

                        }



                        // Utiliser uniquement les données de l'API

                        const totalPresences = presenceStats.approved_presences

                        const totalAbsences = presenceStats.rejected_presences

                        const totalPending = presenceStats.pending_presences || 0



                        const data = [

                          { name: "Présences", value: totalPresences },

                          { name: "Absences", value: totalAbsences },

                        ]



                        // Ajouter les présences en attente si elles existent

                        if (totalPending > 0) {

                          data.push({ name: "En attente", value: totalPending })

                        }



                        return (

                          <ResponsiveContainer width="100%" height={250}>

                            <PieChart>

                              <Pie

                                data={data}

                                cx="50%"

                                cy="50%"

                                labelLine={false}

                                outerRadius={80}

                                fill="#8884d8"

                                dataKey="value"

                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}

                              >

                                {[

                                  { name: "Présences", color: "#22c55e" },

                                  { name: "Absences", color: "#ef4444" },

                                  { name: "En attente", color: "#f59e0b" },

                                ].map((entry, index) => (

                                  <Cell key={`cell-${index}`} fill={entry.color} />

                                ))}

                              </Pie>

                              <Tooltip />

                            </PieChart>

                          </ResponsiveContainer>

                        )

                      })()}



                      {/* Statistiques résumées */}

                      <div className="grid grid-cols-3 gap-4 mt-4">

                        <div className="text-center">

                          <p className="text-sm text-gray-500 dark:text-gray-400">Présences</p>

                          <p className="text-xl font-bold text-green-600">

                            {presenceStats ? presenceStats.approved_presences : 0}

                          </p>

                        </div>

                        <div className="text-center">

                          <p className="text-sm text-gray-500 dark:text-gray-400">Absences</p>

                          <p className="text-xl font-bold text-red-600">

                            {presenceStats ? presenceStats.rejected_presences : 0}

                          </p>

                        </div>

                        <div className="text-center">

                          <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>

                          <p className="text-xl font-bold text-amber-600">

                            {presenceStats ? presenceStats.pending_presences || 0 : 0}

                          </p>

                        </div>

                      </div>

                    </div>



                    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">

                      <h3 className="text-lg font-medium mb-4 text-green-800 dark:text-green-100">

                        Taux de présence par agent

                      </h3>

                      <div className="space-y-4">

                        {performances.map((performance) => {

                          // Récupérer les statistiques de présence de l'API si disponibles

                          const agentStats = presenceStats ? getAgentPresenceStats(performance.agent_username) : null

                          const presenceRate = agentStats

                            ? Math.round((agentStats.approved / (agentStats.approved + agentStats.rejected)) * 100) || 0

                            : performance.presence_rate



                          return (

                            <div key={performance.agent_id} className="space-y-1">

                              <div className="flex justify-between text-sm">

                                <span>{performance.agent_username}</span>

                                <span className="font-medium">{presenceRate}%</span>

                              </div>

                              <div className="relative pt-1">

                                <Progress

                                  value={presenceRate}

                                  className={`h-2 bg-gray-200 dark:bg-gray-700 ${

                                    presenceRate >= 90

                                      ? "indicator bg-green-500"

                                      : presenceRate >= 75

                                        ? "indicator bg-blue-500"

                                        : "indicator bg-orange-500"

                                  }`}

                                />

                              </div>

                            </div>

                          )

                        })}

                      </div>

                    </div>

                  </div>



                  <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">

                    <Table>

                      <TableHeader>

                        <TableRow>

                          <TableHead>Agent</TableHead>

                          <TableHead className="text-right">Présences</TableHead>

                          <TableHead className="text-right">Absences</TableHead>

                          <TableHead className="text-right">Taux de présence</TableHead>

                        </TableRow>

                      </TableHeader>

                      <TableBody>

                        {getFilteredPerformances().map((performance) => {

                          // Récupérer les statistiques de présence de l'API si disponibles

                          const agentStats = presenceStats ? getAgentPresenceStats(performance.agent_username) : null

                          const presenceCount = agentStats ? agentStats.approved : performance.presence_count

                          const absenceCount = agentStats ? agentStats.rejected : performance.absence_count

                          const presenceRate = agentStats

                            ? Math.round((agentStats.approved / (agentStats.approved + agentStats.rejected)) * 100) || 0

                            : performance.presence_rate



                          return (

                            <TableRow key={performance.agent_id}>

                              <TableCell className="font-medium">{performance.agent_username}</TableCell>

                              <TableCell className="text-right">{presenceCount}</TableCell>

                              <TableCell className="text-right">{absenceCount}</TableCell>

                              <TableCell className="text-right">

                                <Badge

                                  className={`

                                  ${

                                    presenceRate >= 90

                                      ? "bg-green-100 text-green-800"

                                      : presenceRate >= 75

                                        ? "bg-blue-100 text-blue-800"

                                        : "bg-orange-100 text-orange-800"

                                  }

                                `}

                                >

                                  {presenceRate}%

                                </Badge>

                              </TableCell>

                            </TableRow>

                          )

                        })}

                      </TableBody>

                    </Table>

                  </div>

                </>

              ) : (

                <div className="text-center py-8 text-gray-500 dark:text-gray-400">

                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />

                  <p>Aucune donnée de présence disponible pour ce mois</p>

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>



        <TabsContent value="rankings">

          <Card className="backdrop-blur-lg bg-white/50 dark:bg-green-950/30 border-none shadow-lg">

            <CardHeader className="pb-2">

              <CardTitle className="text-xl">Classement des Agents</CardTitle>

            </CardHeader>

            <CardContent>

              {loading.rankings ? (

                <div className="space-y-2">

                  {Array.from({ length: 5 }).map((_, i) => (

                    <Skeleton key={i} className="h-12 w-full" />

                  ))}

                </div>

              ) : getCurrentMonthRanking()?.rankings.length ? (

                <div className="overflow-x-auto">

                  <Table>

                    <TableHeader>

                      <TableRow>

                        <TableHead className="w-[80px]">Rang</TableHead>

                        <TableHead>Agent</TableHead>

                        <TableHead>Points forts</TableHead>

                        <TableHead className="text-right">Score</TableHead>

                      </TableRow>

                    </TableHeader>

                    <TableBody>

                      {getCurrentMonthRanking()?.rankings.map((ranking) => (

                        <TableRow

                          key={ranking.agent_id}

                          className={ranking.rank === 1 ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}

                        >

                          <TableCell>

                            <div

                              className={`

                              w-8 h-8 rounded-full flex items-center justify-center font-bold

                              ${

                                ranking.rank === 1

                                  ? "bg-yellow-500 text-white"

                                  : ranking.rank === 2

                                    ? "bg-gray-300 text-gray-800"

                                    : ranking.rank === 3

                                      ? "bg-amber-700 text-white"

                                      : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"

                              }

                            `}

                            >

                              {ranking.rank}

                            </div>

                          </TableCell>

                          <TableCell className="font-medium">{ranking.agent_name}</TableCell>

                          <TableCell>

                            <div className="flex flex-wrap gap-1">

                              {ranking.highlights.map((highlight, index) => (

                                <Badge

                                  key={index}

                                  variant="outline"

                                  className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300"

                                >

                                  {highlight}

                                </Badge>

                              ))}

                            </div>

                          </TableCell>

                          <TableCell className="text-right font-semibold">{ranking.score}/100</TableCell>

                        </TableRow>

                      ))}

                    </TableBody>

                  </Table>

                </div>

              ) : (

                <div className="text-center py-8 text-gray-500 dark:text-gray-400">

                  <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />

                  <p>Aucun classement disponible pour ce mois</p>

                </div>

              )}

            </CardContent>

          </Card>

        </TabsContent>

      </Tabs>

    </div>

  )

}
