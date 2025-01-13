import React from "react";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-lg shadow-md ${className}`}>{children}</div>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b pb-4">{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-xl font-bold ${className}`}>{children}</h2>;
}
