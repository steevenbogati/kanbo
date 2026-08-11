/**
 * Email notifications through Resend's HTTP API (no extra dependency).
 * If RESEND_API_KEY is empty the app keeps working and simply sends nothing,
 * so notifications can be switched on later without touching the code.
 */

type SendArgs = { to: string; subject: string; heading: string; lines: string[]; linkPath?: string };

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function layout({ heading, lines, linkPath }: Omit<SendArgs, "to" | "subject">) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const url = linkPath ? `${appUrl}${linkPath}` : appUrl;

  const body = lines
    .map((line) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${line}</p>`)
    .join("");

  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:520px">
      <h1 style="font-size:18px;margin:0 0 16px">${heading}</h1>
      ${body}
      <p style="margin:24px 0 0">
        <a href="${url}" style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;display:inline-block">
          Abrir en Kanbo
        </a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#666">
        Este correo lo envía Kanbo automáticamente. No hace falta responder.
      </p>
    </div>
  `;
}

/** Never throws: a failed email must not break saving a task. */
export async function sendEmail({ to, subject, heading, lines, linkPath }: SendArgs): Promise<boolean> {
  if (!emailEnabled()) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject,
        html: layout({ heading, lines, linkPath }),
      }),
    });

    if (!response.ok) {
      console.error("No se pudo enviar el correo:", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("No se pudo enviar el correo:", error);
    return false;
  }
}
