import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["picsum.photos"],
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**", // Autorise les images dans le dossier /media/
      },
        hostname: "tile.openstreetmap.org", // Pour les cartes OpenStreetMap utilisées dans le projet
        port: "",
        pathname: "/**",
      },
        protocol: "https",
        pathname: "/**",
  },
};

export default nextConfig;
