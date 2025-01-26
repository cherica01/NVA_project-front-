import React from "react";

// Composant principal Card
export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg shadow-md bg-white ${className || ""}`}>{children}</div>;
}

// Header de la carte
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-b pb-4 px-4 ${className || ""}`}>{children}</div>;
}

// Titre de la carte
export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-bold ${className || ""}`}>{children}</h2>;
}

// Description de la carte
export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm text-gray-500 ${className || ""}`}>{children}</p>;
}

// Contenu principal de la carte
export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 ${className || ""}`}>{children}</div>;
}

// Footer de la carte
export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`border-t pt-4 px-4 ${className || ""}`}>{children}</div>;
}
