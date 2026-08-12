import type { MetadataRoute } from "next";

// Static export: the manifest is written once at build time.
export const dynamic = "force-static";

/**
 * Lets the app be added to the phone's home screen and open without the
 * browser bars, which is how the team will use it day to day.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kanbo · Tareas del equipo",
    short_name: "Kanbo",
    description: "Tablero de tareas del equipo",
    start_url: "/mi-dia",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#f8f9fb",
    lang: "es",
    icons: [{ src: "/icono.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
