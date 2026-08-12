import type { NextConfig } from "next";

/**
 * The app is published as static files on GitHub Pages, so there is no server:
 * the browser talks straight to Supabase and the database (RLS) decides what
 * each person can see. See README → "Cómo se publica".
 */
const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages serves the project at /kanbo/
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  trailingSlash: true,
  images: { unoptimized: true },
  // Do not auto-generate AGENTS.md / CLAUDE.md on every dev start.
  agentRules: false,
};

export default nextConfig;
