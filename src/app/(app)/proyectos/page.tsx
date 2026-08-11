import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { getProjects } from "@/lib/queries";
import { PageHeader } from "@/components/page-header";
import { ProjectManager } from "@/components/projects/project-manager";

export const metadata: Metadata = { title: "Proyectos" };

export default async function ProjectsPage() {
  await requireAdmin();
  const projects = await getProjects(true);

  return (
    <>
      <PageHeader
        title="Proyectos y clientes"
        subtitle="Sirven para agrupar y filtrar las tareas."
      />
      <ProjectManager projects={projects} />
    </>
  );
}
