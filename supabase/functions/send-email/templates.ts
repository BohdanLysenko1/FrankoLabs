// Email templates for the send-email edge function.
// Payload shapes are produced by the app.trg_email_* triggers and lib/actions/intake.ts.

type Payload = Record<string, unknown>;

export type RenderedEmail = { subject: string; html: string };

const s = (v: unknown): string =>
  typeof v === "string" ? v : v == null ? "" : String(v);

const money = (v: unknown): string => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
};

const date = (v: unknown): string => {
  const t = Date.parse(s(v));
  if (Number.isNaN(t)) return "";
  return new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const esc = (v: unknown): string =>
  s(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(title: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  const button = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 4px"><tr><td style="border-radius:8px;background:#047857"><a href="${esc(cta.url)}" style="display:inline-block;padding:10px 20px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600">${esc(cta.label)}</a></td></tr></table>`
    : "";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0a0b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%">
<tr><td style="padding:0 4px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a"><span style="color:#10b981">●</span>&nbsp; Franko OS</td></tr>
<tr><td style="background:#141416;border:1px solid #27272a;border-radius:12px;padding:28px">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:18px;font-weight:600;color:#fafafa;margin-bottom:12px">${title}</div>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.6;color:#a1a1aa">${bodyHtml}</div>
${button}
</td></tr>
<tr><td style="padding:16px 4px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;color:#52525b">Franko Labs — sent by Franko OS. Reply to this email if anything looks off.</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

const row = (label: string, value: string): string =>
  value
    ? `<div style="margin:2px 0"><span style="color:#71717a">${label}:</span> <span style="color:#e4e4e7">${value}</span></div>`
    : "";

export function renderEmail(event: string, p: Payload, appBaseUrl: string): RenderedEmail {
  const portal = { label: "Open client portal", url: appBaseUrl || "http://localhost:3000" };
  const crm = { label: "Open Franko OS", url: `${appBaseUrl || "http://localhost:3000"}/crm` };
  const company = esc(p.company);

  switch (event) {
    case "invoice-created":
      return {
        subject: `Invoice ${s(p.invoiceNumber)} from Franko Labs — ${money(p.amount)}`,
        html: layout(
          "New invoice",
          `A new invoice is ready for ${company}.` +
            row("Invoice", esc(p.invoiceNumber)) +
            row("For", esc(p.label)) +
            row("Amount", money(p.amount)) +
            row("Due", date(p.dueAt)),
          portal,
        ),
      };
    case "invoice-reminder": {
      const overdue = Date.parse(s(p.dueAt)) < Date.now();
      return {
        subject: `Reminder: invoice ${s(p.invoiceNumber)} is ${overdue ? "overdue" : "due soon"} — ${money(p.amount)}`,
        html: layout(
          overdue ? "Invoice overdue" : "Payment reminder",
          `A friendly reminder about invoice <strong style="color:#e4e4e7">${esc(p.invoiceNumber)}</strong> for ${company}.` +
            row("For", esc(p.label)) +
            row("Amount", money(p.amount)) +
            row(overdue ? "Was due" : "Due", date(p.dueAt)),
          portal,
        ),
      };
    }
    case "invoice-paid":
      return {
        subject: `Invoice ${s(p.invoiceNumber)} paid — ${money(p.amount)}`,
        html: layout(
          "Invoice paid",
          `Invoice ${esc(p.invoiceNumber)} for ${company} has been marked paid. Thank you!` +
            row("For", esc(p.label)) +
            row("Amount", money(p.amount)),
        ),
      };
    case "contract-sent":
      return {
        subject: `Contract ready to review: ${s(p.title)}`,
        html: layout(
          "Contract ready for review",
          `A contract is waiting for ${company} to review and sign.` +
            row("Contract", esc(p.title)) +
            row("Value", money(p.amount)),
          portal,
        ),
      };
    case "contract-signed":
      return {
        subject: `Contract signed: ${s(p.title)}`,
        html: layout(
          "Contract signed",
          `${esc(p.signedBy) || "The client"} signed <strong style="color:#e4e4e7">${esc(p.title)}</strong> for ${company}.` +
            row("Value", money(p.amount)),
          crm,
        ),
      };
    case "ticket-created":
      return {
        subject: `New support ticket: ${s(p.subject)}`,
        html: layout(
          "New support ticket",
          `${company} opened a ticket.` + row("Subject", esc(p.subject)) + row("Topic", esc(p.topic)),
          crm,
        ),
      };
    case "ticket-replied": {
      const toClient = s(p.fromSide) === "agency";
      return {
        subject: `New reply on: ${s(p.subject)}`,
        html: layout(
          "New reply on your ticket",
          `${esc(p.author)} replied on <strong style="color:#e4e4e7">${esc(p.subject)}</strong>${company ? ` (${company})` : ""}.` +
            (p.excerpt
              ? `<div style="margin-top:12px;padding:12px;background:#1c1c1f;border-radius:8px;color:#d4d4d8">${esc(p.excerpt)}</div>`
              : ""),
          toClient ? portal : crm,
        ),
      };
    }
    case "deliverable-posted":
      return {
        subject: `Ready for your review: ${s(p.title)}`,
        html: layout(
          "New deliverable to review",
          `Franko Labs posted <strong style="color:#e4e4e7">${esc(p.title)}</strong> for ${company}. Take a look and approve it or request changes.` +
            row("Type", esc(p.kind)) +
            row("Note", esc(p.note)),
          portal,
        ),
      };
    case "deliverable-responded": {
      const approved = s(p.status) === "approved";
      return {
        subject: `${approved ? "Approved" : "Changes requested"}: ${s(p.title)}`,
        html: layout(
          approved ? "Deliverable approved" : "Changes requested",
          `${company} ${approved ? "approved" : "requested changes on"} <strong style="color:#e4e4e7">${esc(p.title)}</strong>.` +
            (p.comment
              ? `<div style="margin-top:12px;padding:12px;background:#1c1c1f;border-radius:8px;color:#d4d4d8">${esc(p.comment)}</div>`
              : ""),
          crm,
        ),
      };
    }
    case "lead-intake-owner":
      return {
        subject: `New website lead: ${s(p.name)}${p.company ? ` (${s(p.company)})` : ""}`,
        html: layout(
          "New lead from the website",
          `A new inquiry just landed in your pipeline.` +
            row("Name", esc(p.name)) +
            row("Email", esc(p.email)) +
            row("Company", esc(p.company)) +
            row("Request", esc(p.requestType)) +
            (p.message
              ? `<div style="margin-top:12px;padding:12px;background:#1c1c1f;border-radius:8px;color:#d4d4d8">${esc(p.message)}</div>`
              : ""),
          crm,
        ),
      };
    case "thread-email": {
      // Personal correspondence from the Mail app — plain paragraphs, light
      // branding, so it reads like a written email rather than a notification.
      const paragraphs = s(p.body)
        .split(/\n{2,}/)
        .map((para) => `<p style="margin:0 0 14px">${esc(para).replace(/\n/g, "<br>")}</p>`)
        .join("");
      return {
        subject: s(p.subject) || "(no subject)",
        html: `<!doctype html><html><body style="margin:0;padding:24px 16px;background:#ffffff">
<div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;line-height:1.65;color:#1f2937">
${paragraphs}
<p style="margin:20px 0 0;color:#6b7280">${esc(p.fromName) || "Franko Labs"}<br><span style="font-size:13px;color:#9ca3af">Franko Labs</span></p>
</div>
</body></html>`,
      };
    }
    case "lead-intake-confirm":
      return {
        subject: "We got your request — Franko Labs",
        html: layout(
          `Thanks, ${esc(p.name) || "there"}.`,
          `Your ${esc(p.requestType) || "consultation"} request is in. We review every inquiry personally and will get back to you within one business day.`,
        ),
      };
    default:
      return {
        subject: `Franko OS notification (${event})`,
        html: layout("Notification", `<pre style="white-space:pre-wrap;color:#d4d4d8">${esc(JSON.stringify(p, null, 2))}</pre>`),
      };
  }
}
