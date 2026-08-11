/**
 * Calls the reminder endpoint once. Handy to run it by hand, or from the
 * Windows Task Scheduler / cron once a day.
 *
 *   npm run recordatorios
 */
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const secret = process.env.CRON_SECRET;

if (!secret) {
  console.error("Falta CRON_SECRET en .env.local. Pon cualquier texto largo y secreto.");
  process.exit(1);
}

try {
  const response = await fetch(`${appUrl}/api/cron/recordatorios`, {
    headers: { Authorization: `Bearer ${secret}` },
  });

  const body = await response.json();

  if (!response.ok) {
    console.error(`Error ${response.status}:`, body);
    process.exit(1);
  }

  console.log("Resultado:", body);
} catch (error) {
  console.error(`No se pudo contactar la app en ${appUrl}. ¿Está encendida con npm run dev?`);
  console.error(error.message);
  process.exit(1);
}
