"use client";

import { AdminOnly } from "@/components/auth-provider";
import { fetchProjects } from "@/lib/data";
import { useData } from "@/lib/use-data";
import { PageHeader } from "@/components/page-header";
import { LoadError, PageSkeleton } from "@/components/page-states";
import { ProjectManager } from "@/components/projects/project-manager";

function ProjectsContent() {
  const { data, loading, error, refresh } = useData(() => fetchProjects(true));

  if (error) return <LoadError message={error} onRetry={refresh} />;
  if (loading || !data) return <PageSkeleton title="Proyectos y clientes" />;

  return (
    <>
      <PageHeader
        title="Proyectos y clientes"
        subtitle="Sirven para agrupar y filtrar las tareas."
      />
      <ProjectManager projects={data} onChanged={refresh} />
    </>
  );
}

export default function ProjectsPage() {
  return (
    <AdminOnly>
      <ProjectsContent />
    </AdminOnly>
  );
}
