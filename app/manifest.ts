import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rocket Ribs Workforce",
    short_name: "Rocket Workforce",
    description: "PWA-first worker and admin portal",
    start_url: "/worker",
    display: "standalone",
    background_color: "#f4efe4",
    theme_color: "#b4411f",
    icons: []
  };
}
