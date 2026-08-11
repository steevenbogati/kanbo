import type { Metadata } from "next";

import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Lista · Kanbo" };

export default async function ListPage() {
  await requireSession();

  return (
    <>
      <PageHeader title="Lista" subtitle="Todas las tareas con filtros." />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Esta vista se construye en la Fase 2.
        </CardContent>
      </Card>
    </>
  );
}
