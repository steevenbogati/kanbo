import type { Metadata } from "next";

import { requireSession } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Mi día · Kanbo" };

export default async function MyDayPage() {
  const { profile } = await requireSession();

  return (
    <>
      <PageHeader
        title="Mi día"
        subtitle="Tus tareas, ordenadas por prioridad y fecha de entrega."
      />
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Hola {profile.full_name || profile.email}. Tu sesión funciona.
          <br />
          Esta vista se llena en la Fase 4.
        </CardContent>
      </Card>
    </>
  );
}
