import "server-only";

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const FROM_EMAIL = process.env.BREVO_FROM_EMAIL || "";
const FROM_NAME = process.env.BREVO_FROM_NAME || "TC Applicator";

// Used to build absolute links inside emails (e.g. "Review this request").
// Set NEXT_PUBLIC_APP_URL in production; falls back to localhost for dev.
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Sends an email via Brevo's REST API. Never throws — a broken/missing
 * email config should never block the actual approval/signup flow
 * it's attached to. Logs instead, so failures are visible in your
 * server logs without taking down the feature that triggered them.
 */
export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.warn(`[email] BREVO_API_KEY not set — skipped: "${params.subject}"`);
    return;
  }

  if (!FROM_EMAIL) {
    console.warn(`[email] BREVO_FROM_EMAIL not set — skipped: "${params.subject}"`);
    return;
  }

  const recipients = Array.isArray(params.to) ? params.to : [params.to];

  if (recipients.length === 0) {
    console.warn(`[email] No recipients — skipped: "${params.subject}"`);
    return;
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: recipients.map((email) => ({ email })),
        subject: params.subject,
        htmlContent: params.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[email] Brevo returned ${response.status}:`, body);
    }
  } catch (error) {
    console.error("[email] Failed to send via Brevo:", error);
  }
}

/** Simple consistent wrapper so every notification email looks the same. */
export function emailTemplate(params: {
  title: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}) {
  const { title, bodyHtml, ctaText, ctaUrl } = params;

  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #12161d;">
      <h2 style="margin: 0 0 16px; font-size: 20px;">${title}</h2>
      <div style="font-size: 14px; line-height: 1.6; color: #334155;">${bodyHtml}</div>
      ${
        ctaUrl
          ? `<a href="${ctaUrl}" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #12161d; color: #ffffff; text-decoration: none; border-radius: 4px; font-size: 14px; font-weight: 600;">${
              ctaText || "View"
            }</a>`
          : ""
      }
      <p style="margin-top: 32px; font-size: 11px; color: #94a3b8;">TC Applicator</p>
    </div>
  `;
}