import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["picsum.photos"],
        hostname: "127.0.0.1",
        pathname: "/media/**", // Autorise les images dans le dossier /media/
      },
  },
};

export default nextConfig;
