import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**", // Autorise les images dans le dossier /media/
      },
      {
        protocol: "https",
        hostname: "tile.openstreetmap.org", // Pour les cartes OpenStreetMap utilisées dans le projet
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos", // Gardez ceci si vous utilisez des images de picsum.photos ailleurs
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;