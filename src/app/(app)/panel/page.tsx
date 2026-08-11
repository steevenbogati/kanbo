import type { Metadata } from "next";

import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Panel · Kanbo" };

export default async function DashboardPage() {
  await requireAdmin();

  return (
    <>
      <PageHeader title="Panel" subtitle="Carga de trabajo, vencidas y tiempos de entrega." />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Esta vista se construye en la Fase 4.
        </CardContent>
      </Card>
    </>
  );
}
