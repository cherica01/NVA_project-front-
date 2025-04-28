import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["picsum.photos"],
        pathname: "/media/**", // Autorise les images dans le dossier /media/
      },
  },
};

export default nextConfig;
