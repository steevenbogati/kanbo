/**
 * Email notifications through Resend's HTTP API (no extra dependency).
 *
 * When RESEND_API_KEY is missing the app does not break and does not go quiet
 * either: it prints the email it would have sent to the terminal ("preview"),
 * so the whole flow can be checked before paying for or configuring anything.
 * Nothing is marked as notified in that case, so the real email still goes out
 * the day the key is added.
 */

type SendArgs = { to: string; subject: string; heading: string; lines: string[]; linkPath?: string };

export type SendResult = "sent" | "preview" | "error";

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

function appLink(linkPath?: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return linkPath ? `${appUrl}${linkPath}` : appUrl;
}

function html({ heading, lines, linkPath }: Omit<SendArgs, "to" | "subject">) {
  const body = lines
    .map((line) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${line}</p>`)
    .join("");

  return `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;max-width:520px">
      <h1 style="font-size:18px;margin:0 0 16px">${heading}</h1>
      ${body}
      <p style="margin:24px 0 0">
        <a href="${appLink(linkPath)}" style="background:#111;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;display:inline-block">
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
export async function sendEmail(args: SendArgs): Promise<SendResult> {
  const { to, subject, heading, lines, linkPath } = args;

  if (!emailEnabled()) {
    console.info(
      [
        "",
        "── Correo en vista previa (falta RESEND_API_KEY, no se envió nada) ──",
        `Para:    ${to}`,
        `Asunto:  ${subject}`,
        `Título:  ${heading}`,
        ...lines.map((line) => `         ${line.replace(/<[^>]+>/g, "")}`),
        `Enlace:  ${appLink(linkPath)}`,
        "────────────────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return "preview";
  }

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
        html: html({ heading, lines, linkPath }),
      }),
    });

    if (!response.ok) {
      console.error("No se pudo enviar el correo:", await response.text());
      return "error";
    }
    return "sent";
  } catch (error) {
    console.error("No se pudo enviar el correo:", error);
    return "error";
  }
}
