import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from "docx";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Cartão Colo de Mãe" },
      { name: "description", content: "Painel administrativo com todos os cadastros, respostas e exportações do Cartão Colo de Mãe." },
    ],
  }),
  component: AdminPage,
});

type Submission = {
  wantsCard: boolean | null;
  contact: { email: string; whatsapp: string } | null;
  credentials?: { word?: string; phrase?: string; code?: string; shareUrl?: string } | null;
  answers: Record<string, any>;
  submittedAt: string;
};

// Campos sensíveis que NUNCA devem aparecer nas exportações
const STRIP_KEYS = ["word", "phrase", "code"];

function sanitize(s: Submission) {
  const shareUrl = s.credentials?.shareUrl ?? "";
  return {
    submittedAt: s.submittedAt,
    wantsCard: s.wantsCard,
    contact: s.contact,
    shareUrl,
    answers: s.answers || {},
  };
}

function flatten(s: Submission) {
  const safe = sanitize(s);
  const flat: Record<string, string> = {
    submittedAt: safe.submittedAt,
    wantsCard: safe.wantsCard ? "sim" : "nao",
    contactEmail: safe.contact?.email ?? "",
    contactWhatsapp: safe.contact?.whatsapp ?? "",
    linkCartao: safe.shareUrl,
  };
  for (const k of Object.keys(safe.answers)) {
    if (STRIP_KEYS.includes(k)) continue;
    const v = safe.answers[k];
    flat[k] = Array.isArray(v) ? v.join("; ") : String(v ?? "");
  }
  return flat;
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportTXT(items: Submission[], base: string) {
  const out = items.map((s, i) => {
    const f = flatten(s);
    const head = `=== Cadastro ${i + 1} (${new Date(s.submittedAt).toLocaleString("pt-BR")}) ===`;
    return [head, ...Object.keys(f).map((k) => `${k}: ${f[k]}`)].join("\n");
  }).join("\n\n");
  download(`${base}.txt`, new Blob([out], { type: "text/plain;charset=utf-8" }));
}

function exportJSON(items: Submission[], base: string) {
  const safe = items.map(sanitize);
  download(`${base}.json`, new Blob([JSON.stringify(safe, null, 2)], { type: "application/json" }));
}

function exportCSV(items: Submission[], base: string) {
  const rows = items.map(flatten);
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h] ?? "")).join(","));
  download(`${base}.csv`, new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }));
}

function exportXLSX(items: Submission[], base: string) {
  const rows = items.map(flatten);
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cadastros");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(`${base}.xlsx`, new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}

function exportPDF(items: Submission[], base: string) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Cartão Colo de Mãe — Cadastros", margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}  •  Total: ${items.length}`, margin, y);
  y += 18;

  items.forEach((s, i) => {
    const f = flatten(s);
    if (y > pageH - margin - 40) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Cadastro ${i + 1} — ${new Date(s.submittedAt).toLocaleString("pt-BR")}`, margin, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const k of Object.keys(f)) {
      const line = `${k}: ${f[k] || "—"}`;
      const wrapped = doc.splitTextToSize(line, pageW - margin * 2);
      for (const w of wrapped) {
        if (y > pageH - margin) { doc.addPage(); y = margin; }
        doc.text(w, margin, y);
        y += 13;
      }
    }
    y += 10;
  });

  doc.save(`${base}.pdf`);
}

async function exportDOCX(items: Submission[], base: string) {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Cartão Colo de Mãe — Cadastros")] }),
    new Paragraph({ children: [new TextRun(`Gerado em: ${new Date().toLocaleString("pt-BR")} — Total: ${items.length}`)] }),
    new Paragraph({ children: [new TextRun("")] }),
  ];
  items.forEach((s, i) => {
    const f = flatten(s);
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun(`Cadastro ${i + 1} — ${new Date(s.submittedAt).toLocaleString("pt-BR")}`)],
    }));
    for (const k of Object.keys(f)) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${k}: `, bold: true }),
          new TextRun(f[k] || "—"),
        ],
      }));
    }
    children.push(new Paragraph({ children: [new TextRun("")] }));
  });
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  download(`${base}.docx`, blob);
}

const FORMATS = [
  { id: "txt",  label: "TXT",  emoji: "📃" },
  { id: "json", label: "JSON", emoji: "🧩" },
  { id: "csv",  label: "CSV",  emoji: "📊" },
  { id: "xlsx", label: "XLSX", emoji: "📈" },
  { id: "pdf",  label: "PDF",  emoji: "📄" },
  { id: "docx", label: "DOCX", emoji: "📝" },
] as const;

function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [query, setQuery] = useState("");
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("colo-de-mae-respostas");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => {
      const blob = JSON.stringify({ a: s.answers, c: s.contact, l: s.credentials?.shareUrl }).toLowerCase();
      return blob.includes(q);
    });
  }, [items, query]);

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `cadastros-colo-de-mae-${stamp}`;

  const doExport = async (fmt: string) => {
    const data = filtered;
    if (fmt === "txt") return exportTXT(data, base);
    if (fmt === "json") return exportJSON(data, base);
    if (fmt === "csv") return exportCSV(data, base);
    if (fmt === "xlsx") return exportXLSX(data, base);
    if (fmt === "pdf") return exportPDF(data, base);
    if (fmt === "docx") return exportDOCX(data, base);
  };

  const clearAll = () => {
    if (!confirm("Tem certeza que deseja apagar TODOS os cadastros? Esta ação não pode ser desfeita.")) return;
    localStorage.removeItem("colo-de-mae-respostas");
    setItems([]);
  };

  return (
    <main className="min-h-dvh bg-gradient-warm">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground mb-3">
              🛡️ Painel administrativo
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Cadastros Colo de Mãe</h1>
            <p className="text-muted-foreground mt-2">
              Todos os membros interessados, com link exclusivo do cartão. Credenciais secretas não são exibidas nem exportadas.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/respostas" className="rounded-2xl border-2 border-border bg-card px-5 py-3 font-semibold hover:bg-muted transition-colors">
              📊 Relatórios
            </Link>
            <Link to="/" className="rounded-2xl border-2 border-border bg-card px-5 py-3 font-semibold hover:bg-muted transition-colors">
              ← Voltar ao cadastro
            </Link>
          </div>
        </header>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { e: "👨‍👩‍👧", l: "Cadastros totais", v: String(items.length) },
            { e: "🔍", l: "Resultados filtrados", v: String(filtered.length) },
            { e: "🕒", l: "Último cadastro", v: items.length ? new Date(items[items.length - 1].submittedAt).toLocaleString("pt-BR") : "—" },
          ].map((s) => (
            <div key={s.l} className="rounded-3xl bg-card border-2 border-border shadow-soft p-5">
              <div className="text-3xl mb-2" aria-hidden>{s.e}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="text-xl font-bold mt-1">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Exports */}
        <section className="rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-8 mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
            <div>
              <h2 className="text-2xl font-bold mb-1">Exportar cadastros</h2>
              <p className="text-muted-foreground">
                Exporta os <strong>{filtered.length}</strong> cadastros visíveis. Palavra, frase e código secretos são removidos automaticamente.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={filtered.length === 0}
                onClick={() => doExport(f.id)}
                className="flex flex-col items-center gap-1 rounded-2xl border-2 border-border bg-background px-4 py-5 hover:border-primary hover:bg-accent/40 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                <span className="text-3xl" aria-hidden>{f.emoji}</span>
                <span className="font-semibold">.{f.id}</span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Search + clear */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Buscar por nome, CPF, cidade, telefone, e-mail…"
            className="flex-1 rounded-2xl border-2 border-border bg-card px-5 py-3 text-base focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={clearAll}
            disabled={items.length === 0}
            className="rounded-2xl border-2 border-destructive/40 bg-card px-5 py-3 font-semibold text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40"
          >
            🗑️ Apagar todos
          </button>
        </div>

        {/* Members list */}
        <section className="rounded-3xl bg-card border-2 border-border shadow-soft p-4 sm:p-6">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              Nenhum cadastro encontrado. 💙
            </p>
          ) : (
            <ul className="divide-y-2 divide-border">
              {filtered.slice().reverse().map((s, idx) => {
                const a = s.answers || {};
                const realIdx = filtered.length - 1 - idx;
                const isOpen = openIdx === realIdx;
                const shareUrl = s.credentials?.shareUrl || "";
                return (
                  <li key={realIdx} className="py-4">
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? null : realIdx)}
                      className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-muted/30 rounded-2xl p-3 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-lg truncate">
                          {a.nomePaciente || "Sem nome"} <span className="text-muted-foreground font-normal">— resp. {a.nomeResponsavel || "—"}</span>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          📅 {new Date(s.submittedAt).toLocaleString("pt-BR")} • 📞 {s.contact?.whatsapp || a.telefone1 || "—"} • 📧 {s.contact?.email || a.email || "—"}
                        </div>
                      </div>
                      <span className="text-2xl shrink-0">{isOpen ? "▾" : "▸"}</span>
                    </button>

                    {isOpen && (
                      <div className="mt-3 rounded-2xl bg-background border-2 border-border p-4 sm:p-5 space-y-4">
                        {shareUrl && (
                          <div className="rounded-xl bg-primary/5 border-2 border-primary/30 p-3">
                            <div className="text-sm font-semibold mb-1">🔗 Link exclusivo do cartão</div>
                            <div className="flex gap-2 items-center">
                              <a
                                href={shareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 break-all text-sm text-primary underline font-mono"
                              >
                                {shareUrl}
                              </a>
                              <button
                                type="button"
                                onClick={() => navigator.clipboard?.writeText(shareUrl)}
                                className="rounded-xl border-2 border-border bg-card px-3 py-2 text-sm hover:bg-muted transition-colors shrink-0"
                              >
                                📋 Copiar
                              </button>
                            </div>
                          </div>
                        )}
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                          {Object.entries(flatten(s)).map(([k, v]) => (
                            <div key={k} className="border-b border-border/50 py-1.5">
                              <span className="font-semibold text-foreground/80">{k}: </span>
                              <span className="text-foreground break-words">{v || "—"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </section>
    </main>
  );
}