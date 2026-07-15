import {
  fmtDate,
  fmtMoney,
  invoiceBalance,
  relTime,
  type Company,
  type CrmState,
} from "@/lib/crm/types";
import {
  contractsFor,
  invoicesFor,
  projectsFor,
  siteHealthFor,
  ticketsFor,
} from "@/lib/portal/portal";

/**
 * AI Assistant — scripted demo engine. No model calls: it matches intents
 * with keywords and computes every answer from the live store, so replies
 * stay truthful to the data on screen. A real LLM backend replaces
 * `answer()` without touching the chat UIs.
 */

export type AssistantScope =
  | { kind: "client"; company: Company }
  | { kind: "agency" };

export function suggestionsFor(scope: AssistantScope): string[] {
  return scope.kind === "client"
    ? [
        "What do I owe right now?",
        "How are my projects going?",
        "Is my website healthy?",
        "Anything waiting on me?",
      ]
    : [
        "Which deals went cold?",
        "What's the pipeline worth?",
        "What's outstanding in billing?",
        "Summarize this week",
      ];
}

const matches = (input: string, ...words: string[]) =>
  words.some((w) => input.includes(w));

function clientAnswer(state: CrmState, company: Company, input: string): string {
  const q = input.toLowerCase();

  if (matches(q, "owe", "balance", "invoice", "bill", "pay")) {
    const due = invoicesFor(state, company.id).filter((i) => i.status !== "paid");
    if (due.length === 0)
      return "You're all settled — no open invoices. Paid history is in Billing if you need receipts.";
    const total = due.reduce((s, i) => s + invoiceBalance(i, state.payments), 0);
    const lines = due.map(
      (i) =>
        `• ${i.number} — ${i.label}: ${fmtMoney(invoiceBalance(i, state.payments))}, due ${fmtDate(i.dueAt)}`,
    );
    return `You have ${due.length === 1 ? "one open invoice" : `${due.length} open invoices`} totaling ${fmtMoney(total)}:\n${lines.join("\n")}\n\nPayment details are on the invoice — history lives in the Billing tool.`;
  }

  if (matches(q, "project", "progress", "going", "status of", "work")) {
    const projects = projectsFor(state, company.id);
    const open = projects.filter((p) => p.stageKind === "open");
    if (open.length === 0)
      return projects.length > 0
        ? "Nothing in flight right now — your delivered work lives in Projects. Need something new? Send it through Support."
        : "No projects on the board yet.";
    const lines = open.map(
      (p) => `• ${p.name} — ${p.stageName.toLowerCase()}, about ${p.progress}% along`,
    );
    return `${open.length === 1 ? "One project in flight" : `${open.length} projects in flight`}:\n${lines.join("\n")}\n\nThe team posts updates to your feed as things move.`;
  }

  if (matches(q, "website", "site", "uptime", "online", "down", "ssl", "domain")) {
    const site = siteHealthFor(state, company);
    return `${company.domain} is ${site.status === "online" ? "online" : "in a maintenance window"} — ${site.uptime90d} uptime over the last 90 days, ${site.visits30d.toLocaleString("en-US")} visits in the last 30. SSL renews itself in ${site.sslDaysLeft} days. Details live in the Website and Hosting tools.`;
  }

  if (matches(q, "contract", "sign", "agreement", "proposal")) {
    const contracts = contractsFor(state, company.id);
    const pending = contracts.filter((c) => c.status !== "signed");
    if (pending.length > 0)
      return `${pending.length === 1 ? "One agreement is" : `${pending.length} agreements are`} waiting on your signature: ${pending
        .map((c) => `"${c.title}" (${fmtMoney(c.amount)})`)
        .join(", ")}. You can review and sign it in Contracts — takes about a minute.`;
    return contracts.length > 0
      ? `Nothing waiting on you — ${contracts.length === 1 ? "your agreement is" : `all ${contracts.length} agreements are`} signed and on file in Contracts.`
      : "No contracts on file yet.";
  }

  if (matches(q, "support", "ticket", "request", "reply", "replied")) {
    const tickets = ticketsFor(state, company.id);
    const active = tickets.filter((t) => t.status !== "resolved");
    if (active.length === 0)
      return "No open requests — everything you've sent has been resolved. New request? The Support tool is one click away.";
    const lines = active.map(
      (t) => `• "${t.subject}" — ${t.status === "in_progress" ? "in progress" : "open"}, last activity ${relTime(t.updatedAt)}`,
    );
    return `${active.length === 1 ? "One active request" : `${active.length} active requests`}:\n${lines.join("\n")}`;
  }

  if (matches(q, "waiting on me", "attention", "todo", "to do", "need to do", "anything")) {
    const due = invoicesFor(state, company.id).filter((i) => i.status !== "paid");
    const unsigned = contractsFor(state, company.id).filter((c) => c.status !== "signed");
    const items: string[] = [];
    if (unsigned.length > 0)
      items.push(`• Sign "${unsigned[0].title}" in Contracts`);
    if (due.length > 0)
      items.push(`• ${due.length === 1 ? `Invoice ${due[0].number}` : `${due.length} invoices`} open in Billing (${fmtMoney(due.reduce((s, i) => s + invoiceBalance(i, state.payments), 0))})`);
    return items.length > 0
      ? `Two minutes of homework:\n${items.join("\n")}`
      : "Nothing is waiting on you. The team has the ball on everything in flight.";
  }

  return `I can answer from your live workspace data — try asking about your invoices, project progress, website health, contracts or support requests. (I'm running in scripted demo mode; the full assistant reads everything in your portal.)`;
}

function agencyAnswer(state: CrmState, input: string): string {
  const q = input.toLowerCase();
  const now = Date.now();
  const DAY = 86_400_000;
  const stageById = new Map(state.stages.map((s) => [s.id, s]));
  const openDeals = state.deals.filter(
    (d) => stageById.get(d.stageId)?.kind === "open",
  );

  if (matches(q, "cold", "stale", "stuck", "slipping")) {
    const stale = openDeals
      .filter((d) => now - d.stageChangedAt > 14 * DAY)
      .sort((a, b) => a.stageChangedAt - b.stageChangedAt);
    if (stale.length === 0)
      return "No deals have sat in a stage longer than two weeks — the pipeline is moving.";
    const lines = stale.map((d) => {
      const days = Math.floor((now - d.stageChangedAt) / DAY);
      return `• ${d.name} — ${days} days in ${stageById.get(d.stageId)?.name.toLowerCase() ?? "stage"} (${fmtMoney(d.value)})`;
    });
    return `${stale.length === 1 ? "One deal is" : `${stale.length} deals are`} going cold:\n${lines.join("\n")}\n\nPulse has draft follow-ups ready for each.`;
  }

  if (matches(q, "pipeline", "worth", "forecast")) {
    const total = openDeals.reduce((s, d) => s + d.value, 0);
    const byStage = state.stages
      .filter((s) => s.kind === "open")
      .map((s) => {
        const deals = openDeals.filter((d) => d.stageId === s.id);
        return deals.length > 0
          ? `• ${s.name}: ${deals.length} ${deals.length === 1 ? "deal" : "deals"}, ${fmtMoney(deals.reduce((x, d) => x + d.value, 0))}`
          : null;
      })
      .filter(Boolean);
    return `Open pipeline: ${fmtMoney(total)} across ${openDeals.length} deals.\n${byStage.join("\n")}`;
  }

  if (matches(q, "billing", "outstanding", "unpaid", "owed", "invoice")) {
    const due = state.invoices.filter((i) => i.status !== "paid");
    if (due.length === 0) return "Nothing outstanding — every invoice on record is paid.";
    const total = due.reduce((s, i) => s + invoiceBalance(i, state.payments), 0);
    const lines = due.map((i) => {
      const co = state.companies.find((c) => c.id === i.companyId);
      return `• ${i.number} — ${co?.name ?? "Unknown"}: ${fmtMoney(invoiceBalance(i, state.payments))}, due ${fmtDate(i.dueAt)}`;
    });
    return `${fmtMoney(total)} outstanding across ${due.length} ${due.length === 1 ? "invoice" : "invoices"}:\n${lines.join("\n")}`;
  }

  if (matches(q, "contract", "signature", "unsigned", "waiting")) {
    const pending = state.contracts.filter((c) => c.status !== "signed");
    if (pending.length === 0) return "All contracts on file are signed.";
    const lines = pending.map((c) => {
      const co = state.companies.find((x) => x.id === c.companyId);
      return `• "${c.title}" — ${co?.name ?? "Unknown"}, ${c.status === "viewed" ? "viewed but unsigned" : "sent, not yet opened"} (${fmtMoney(c.amount)})`;
    });
    return `${pending.length === 1 ? "One contract is" : `${pending.length} contracts are`} out for signature:\n${lines.join("\n")}`;
  }

  if (matches(q, "ticket", "support", "queue")) {
    const active = state.tickets.filter((t) => t.status !== "resolved");
    if (active.length === 0) return "Support queue is clear — nothing active.";
    const lines = active.map((t) => {
      const co = state.companies.find((c) => c.id === t.companyId);
      return `• ${co?.name ?? "Unknown"}: "${t.subject}" — ${t.status === "in_progress" ? "in progress" : "awaiting first reply"}`;
    });
    return `${active.length} active ${active.length === 1 ? "ticket" : "tickets"}:\n${lines.join("\n")}`;
  }

  if (matches(q, "summar", "week", "recap", "digest")) {
    const weekAgo = now - 7 * DAY;
    const newDeals = state.deals.filter((d) => d.createdAt > weekAgo).length;
    const touches = state.activities.filter((a) => a.at > weekAgo).length;
    const paid = state.invoices.filter((i) => (i.paidAt ?? 0) > weekAgo);
    const openTasks = state.tasks.filter((t) => !t.done && t.dueAt < now).length;
    const activeTickets = state.tickets.filter((t) => t.status !== "resolved").length;
    return [
      "This week at a glance:",
      `• ${newDeals} new ${newDeals === 1 ? "deal" : "deals"} entered the pipeline`,
      `• ${touches} activities logged across deals and clients`,
      `• ${paid.length === 0 ? "No payments landed" : `${fmtMoney(paid.reduce((s, i) => s + i.amount, 0))} in payments landed`}`,
      `• ${openTasks} ${openTasks === 1 ? "task is" : "tasks are"} overdue, ${activeTickets} support ${activeTickets === 1 ? "ticket" : "tickets"} active`,
    ].join("\n");
  }

  return "Ask me about the business — cold deals, pipeline value, outstanding invoices, contracts out for signature, the support queue, or a weekly summary. Every answer is computed from the live workspace. (Scripted demo mode — the real assistant drafts emails and runs automations too.)";
}

export function answer(
  state: CrmState,
  scope: AssistantScope,
  input: string,
): string {
  return scope.kind === "client"
    ? clientAnswer(state, scope.company, input)
    : agencyAnswer(state, input);
}
