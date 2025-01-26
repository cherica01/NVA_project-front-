"use client";

import Link from "next/link";

const AgentNavbar = () => {
    return (
        <nav className="bg-green-600 text-white p-4">
            <ul className="flex space-x-4">
                <li><Link href="/agent/home">Accueil Agent</Link></li>
                <li><Link href="/agent/tasks">Tâches</Link></li>
                <li><Link href="/logout">Se déconnecter</Link></li>
            </ul>
        </nav>
    );
};

export default AgentNavbar;
