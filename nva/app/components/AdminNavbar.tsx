"use client";

import Link from "next/link";
import { Users, Calendar, CreditCard, ClipboardCheck, LogOut, X, Menu } from "lucide-react";
import { useState, useEffect, ReactNode } from "react";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}

const NavItem: React.FC<NavItemProps> = ({ href, icon, children }) => (
  <li>
    <Link
      href={href}
      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-100 transition-colors duration-200"
    >
      <span className="text-green-600">{icon}</span>
      <span>{children}</span>
    </Link>
  </li>
);

const AdminNavbar = () => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("navbarOpen") !== "false";
    }
    return true;
  });

  useEffect(() => {
    localStorage.setItem("navbarOpen", isOpen.toString());
  }, [isOpen]);

  return (
    <>
      {/* Bouton flottant pour réouvrir */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-2 top-2 p-2 bg-white rounded-full shadow-lg z-50"
        >
          <Menu className="w-6 h-6 text-green-600" />
        </button>
      )}

      <nav
        className={`bg-white text-black h-screen w-64 fixed left-0 top-0 shadow-lg transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 relative">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute -right-8 top-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          <h1 className="text-2xl font-bold text-green-600 mb-8">Admin Panel</h1>
          <ul className="space-y-4">
            <NavItem href="/admin/agents" icon={<Users className="w-5 h-5" />}>
              Gestion Agents
            </NavItem>
            <NavItem href="/admin/evenements" icon={<Calendar className="w-5 h-5" />}>
              Gestions événements
            </NavItem>
            <NavItem href="/admin/paie" icon={<CreditCard className="w-5 h-5" />}>
              Gestions de paiement
            </NavItem>
            <NavItem href="/admin/presences" icon={<ClipboardCheck className="w-5 h-5" />}>
              Gestions de Présence
            </NavItem>
          </ul>
        </div>
       
      </nav>
    </>
  );
};

export default AdminNavbar;
