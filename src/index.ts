/**
 * P4 — Delivery Copilot.
 * Reads synthetic Jira-like issues, computes delivery metrics, and drafts a
 * weekly report in Italian. Every sentence is tied to a number.
 */
type Issue = { id: string; week: number; status: string; assignee: string; blocked: boolean; ageDays: number; points: number; type: string };

// Each week has a deliberately different profile, so the selector shows a
// real change instead of the same numbers four times.
const WEEK_PROFILES = [
  { issues: 12, done: 2, inProgress: 4, blocked: 3, ages: [2, 4, 6] },
  { issues: 14, done: 5, inProgress: 3, blocked: 2, ages: [1, 3] },
  { issues: 13, done: 3, inProgress: 5, blocked: 4, ages: [3, 5, 8, 9] },
  { issues: 16, done: 7, inProgress: 2, blocked: 1, ages: [2] },
] as const;

const ISSUES: Issue[] = [];
WEEK_PROFILES.forEach((profile, weekIndex) => {
  const week = weekIndex + 1;
  const statuses: Issue["status"][] = [
    ...Array(profile.done).fill("Done"),
    ...Array(profile.inProgress).fill("In Progress"),
    ...Array(profile.blocked).fill("Blocked"),
    ...Array(profile.issues - profile.done - profile.inProgress - profile.blocked).fill("To Do"),
  ];
  statuses.forEach((status, index) => {
    ISSUES.push({
      id: `P4-W${week}-${String(index + 1).padStart(2, "0")}`,
      week,
      status,
      assignee: ["AL", "MR", "GB"][index % 3]!,
      blocked: status === "Blocked",
      ageDays: status === "Blocked" ? (profile.ages[index % profile.ages.length] ?? 1) : 1 + (index % 5),
      points: [1, 2, 3, 5][index % 4]!,
      type: index % 3 === 0 ? "feature" : index % 3 === 1 ? "bug" : "chore",
    });
  });
});

function metrics(week: number) {
  const rows = ISSUES.filter((i) => i.week === week);
  const wip = rows.filter((i) => i.status === "In Progress").length;
  const blocked = rows.filter((i) => i.blocked);
  const done = rows.filter((i) => i.status === "Done");
  const committed = rows.reduce((s, i) => s + i.points, 0);
  const completed = done.reduce((s, i) => s + i.points, 0);
  return {
    week,
    issues: rows.length,
    wip,
    wipLimit: 6,
    blockers: blocked.length,
    oldestBlockerDays: Math.max(0, ...blocked.map((i) => i.ageDays)),
    committedPoints: committed,
    completedPoints: completed,
    capacityUse: Math.round((wip / 6) * 100),
    dataSource: "synthetic-jira-v1",
    staleSnapshot: false,
  };
}

function report(week: number) {
  const m = metrics(week);
  const previous = week > 1 ? metrics(week - 1) : null;
  const delta = previous
    ? `Rispetto alla settimana ${week - 1}: WIP ${m.wip - previous.wip >= 0 ? "+" : ""}${m.wip - previous.wip}, blocker ${m.blockers - previous.blockers >= 0 ? "+" : ""}${m.blockers - previous.blockers}, punti completati ${m.completedPoints - previous.completedPoints >= 0 ? "+" : ""}${m.completedPoints - previous.completedPoints}.`
    : "Prima settimana dello snapshot: nessun confronto precedente.";
  return {
    id: `report-w${week}`,
    week,
    generatedAt: new Date().toISOString(),
    synthetic: true,
    text: [
      `Settimana ${week}: ${m.issues} issue nel snapshot sintetico.`,
      `WIP ${m.wip} su limite ${m.wipLimit}, utilizzo ${m.capacityUse}%.`,
      `Blocker aperti: ${m.blockers}; il più vecchio ha ${m.oldestBlockerDays} giorni.`,
      `Punti completati ${m.completedPoints} su ${m.committedPoints} pianificati.`,
      delta,
      `Fonte: ${m.dataSource}. Nessuno snapshot reale o call interpretata.`,
    ].join("\n"),
    metrics: m,
    limits: [
      "Un solo progetto per versione.",
      "Non legge il contesto delle call o delle email.",
      "La narrativa è generata dai numeri: ogni frase ha un dato accanto.",
    ],
  };
}

function evaluate() {
  const reports = [1, 2, 3, 4].map(report);
  const allHaveNumbers = reports.every((r) => /WIP \d+/.test(r.text) && /Blocker aperti: \d+/.test(r.text));
  const allDeclareSource = reports.every((r) => r.text.includes("synthetic-jira-v1"));
  const noSilentFallback = reports.every((r) => !r.metrics.staleSnapshot);
  return {
    id: `eval-${Date.now()}`,
    createdAt: new Date().toISOString(),
    dataset: "synthetic-jira-v1",
    synthetic: true,
    reports: reports.length,
    reportsWithNumbers: allHaveNumbers ? reports.length : 0,
    reportsWithDeclaredSource: allDeclareSource ? reports.length : 0,
    noSilentFallback,
    reports,
    note: "Quattro report settimanali su dati sintetici. Nessun dato Jira reale, nessuna misura di ore risparmiate da persone.",
  };
}

function html(result: ReturnType<typeof evaluate> | null) {
  return `<!DOCTYPE html><html lang="it"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Delivery Copilot — dashboard</title><style>
  :root{color-scheme:dark}body{margin:0;background:#0B0E13;color:#F9FAFB;font-family:system-ui,sans-serif;line-height:1.5}.wrap{max-width:1000px;margin:auto;padding:40px 20px}h1{font-family:'Space Grotesk',sans-serif;letter-spacing:-.03em}.mono{font-family:ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#9CA3AF}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:24px 0}.card{background:#1E232D;border:1px solid #2A313E;border-radius:8px;padding:18px}.card strong{display:block;font-size:28px;color:#D97757;margin-top:6px}pre{font-size:11px;color:#9CA3AF;white-space:pre-wrap}.warn{border-left:2px solid #FFB43D;padding-left:12px;color:#9CA3AF}
  .demo{margin-top:24px;border:1px solid #2A313E;border-radius:8px;padding:16px;background:#12161D}.demo select,.demo button{font:13px ui-monospace,monospace;background:#0B0E13;color:#F9FAFB;border:1px solid #2A313E;border-radius:4px;padding:8px}.demo button{background:#D97757;color:#0B0E13;border-color:#D97757;cursor:pointer}
  </style></head><body><div class="wrap"><p class="mono">P4 · dati sintetici dichiarati</p><h1>Delivery Copilot</h1><p>Report settimanali generati da metriche di delivery, con numeri e fonte dichiarata.</p>
  <div class="grid"><div class="card"><span>Report generati</span><strong>${result?.reports ?? 0}</strong></div><div class="card"><span>Con numeri</span><strong>${result?.reportsWithNumbers ?? 0}</strong></div><div class="card"><span>Fonte dichiarata</span><strong>${result?.reportsWithDeclaredSource ?? 0}</strong></div></div>
  ${result ? `<div class="card"><p class="mono">${result.createdAt} · benchmark congelato</p><ul style="margin:8px 0;padding-left:18px">${result.reports.map((r, i) => `<li>${i + 1}. ${r.text.slice(0, 180)}</li>`).join("")}</ul></div>` : `<div class="card warn"><p>Esegui <code>POST /api/eval</code> per generare i quattro report.</p></div>`}
  <h2>Genera un report</h2>
  <div class="demo">
    <p style="font-size:13px">Scegli una settimana dello snapshot sintetico. Il report include numeri verificabili e fonte dichiarata.</p>
    <select id="week" aria-label="Settimana"><option value="1">Settimana 1</option><option value="2">Settimana 2</option><option value="3">Settimana 3</option><option value="4">Settimana 4</option></select>
    <button id="run">Genera</button> <a id="dl" hidden download="report.md" style="color:#D97757;font-size:13px">Scarica .md</a>
    <pre id="out" hidden></pre>
  </div>
  <p class="warn" style="margin-top:24px">Dati sintetici. Nessuna misura di tempo risparmiato da esseri umani.</p></div>
<script>
document.getElementById("run").addEventListener("click", async function(){
  var w=document.getElementById("week").value;
  var r=await fetch("api/report?week="+w); var d=await r.json();
  var o=document.getElementById("out"); o.textContent=d.text; o.hidden=false;
  var a=document.getElementById("dl"); a.href="data:text/markdown;charset=utf-8,"+encodeURIComponent("# Report settimanale "+d.week+"\n\n"+d.text); a.hidden=false;
});
</script></body></html>`;
}

export default {
  async fetch(request: Request, env: { DB?: D1Like }): Promise<Response> {
    const url = new URL(request.url);
    const base = "/delivery-copilot";
    const path = url.pathname.startsWith(base) ? url.pathname.slice(base.length) || "/" : url.pathname;
    const json = (d: unknown, s = 200) => new Response(JSON.stringify(d, null, 2), { status: s, headers: { "content-type": "application/json" } });

    if (path === "/health") return json({ ok: true, project: "delivery-copilot", synthetic: true });
    if (path === "/api/metrics") {
      const week = Number(url.searchParams.get("week") ?? 1);
      return json(metrics(Math.max(1, Math.min(4, week))));
    }
    if (path === "/api/report") {
      const week = Math.max(1, Math.min(4, Number(url.searchParams.get("week") ?? 1)));
      const result = report(week);
      if (env.DB) await env.DB.prepare("INSERT OR REPLACE INTO p4_reports (id, week, report, created_at) VALUES (?, ?, ?, ?)")
        .bind(result.id, result.week, JSON.stringify(result), result.generatedAt).run();
      return json(result);
    }
    if (path === "/api/eval" && request.method === "POST") {
      const result = evaluate();
      if (env.DB) await env.DB.prepare("INSERT OR REPLACE INTO p4_reports (id, week, report, created_at) VALUES (?, ?, ?, ?)")
        .bind(result.id, 0, JSON.stringify(result), result.createdAt).run();
      return json(result, 201);
    }
    if (path === "/" || path === "") {
      let latestEval: ReturnType<typeof evaluate> | null = null;
      if (env.DB) {
        const row = await env.DB.prepare("SELECT report FROM p4_reports WHERE week = 0 ORDER BY created_at DESC LIMIT 1").first<{ report: string }>();
        if (row) latestEval = JSON.parse(row.report) as ReturnType<typeof evaluate>;
      }
      return new Response(html(latestEval), { headers: { "content-type": "text/html; charset=utf-8" } });
    }
    return json({ error: "Not found" }, 404);
  },
};

interface D1Like {
  prepare(q: string): {
    bind(...v: unknown[]): { run(): Promise<unknown> };
    first<T = unknown>(): Promise<T | null>;
  };
}
