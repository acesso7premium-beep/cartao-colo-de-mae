import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Document, Packer, Paragraph, HeadingLevel, TextRun, AlignmentType } from "docx";
import QRCode from "qrcode";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Administrativo — Cartão Colo de Mãe" },
      { name: "description", content: "CRM Social — cadastros, filtros avançados, status, observações internas, relatórios institucionais e exportações premium." },
    ],
  }),
  component: AdminGate,
});

// =============================================================================
// Auth gate (senha simples; pronto para migrar ao Cloud)
// =============================================================================
const AUTH_KEY = "colo-de-mae-admin-auth";
const PWD_KEY = "colo-de-mae-admin-passwords";
const DEFAULT_PWD = "colo1226";

type StoredPwd = { id: string; label: string; hash: string; createdAt: string };

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function loadPwds(): StoredPwd[] {
  try { return JSON.parse(localStorage.getItem(PWD_KEY) || "[]"); } catch { return []; }
}
function savePwds(list: StoredPwd[]) {
  localStorage.setItem(PWD_KEY, JSON.stringify(list));
}

function AdminGate() {
  const [authed, setAuthed] = useState(false);
  const [checked, setChecked] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    try { setAuthed(sessionStorage.getItem(AUTH_KEY) === "1"); } catch {}
    setChecked(true);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const tryPwd = pwd.trim();
    if (!tryPwd) { setErr("Digite a senha de acesso."); return; }
    if (tryPwd === DEFAULT_PWD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
      return;
    }
    const list = loadPwds();
    if (list.length) {
      const h = await sha256(tryPwd);
      if (list.some((p) => p.hash === h)) {
        sessionStorage.setItem(AUTH_KEY, "1");
        setAuthed(true);
        return;
      }
    }
    setErr("Senha incorreta. Tente novamente.");
  };

  if (!checked) return null;
  if (authed) return <AdminPage onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); setPwd(""); }} />;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border-2 border-border bg-card shadow-2xl p-7 sm:p-9">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground mb-3">
            🛡️ Acesso restrito
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Painel Geral de Cadastros</h1>
          <p className="text-muted-foreground text-sm mt-2">Informe a senha de acesso para continuar.</p>
        </div>
        <form onSubmit={submit} className="space-y-4" autoComplete="off">
          <div>
            <label htmlFor="admin-pwd" className="block text-sm font-semibold mb-1.5">Senha</label>
            <div className="relative">
              <input
                id="admin-pwd"
                type={showPwd ? "text" : "password"}
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoFocus
                className="w-full rounded-2xl border-2 border-border bg-background px-4 py-3 pr-24 text-base focus:outline-none focus:ring-4 focus:ring-primary/30"
                placeholder="Digite sua senha"
                aria-describedby={err ? "admin-pwd-err" : undefined}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/70">
                {showPwd ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {err && <p id="admin-pwd-err" className="mt-2 text-sm text-destructive font-medium">{err}</p>}
          </div>
          <button type="submit" className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-bold hover:opacity-90 transition">
            Entrar
          </button>
          <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground">← Voltar ao início</Link>
        </form>
        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
          Autenticação local nesta sessão. Quando o Lovable Cloud for ativado, as senhas cadastradas migram para autenticação segura no servidor.
        </p>
      </div>
    </main>
  );
}

// =============================================================================
// Types & storage
// =============================================================================
type Submission = {
  wantsCard: boolean | null;
  contact: { email: string; whatsapp: string } | null;
  credentials?: { word?: string; phrase?: string; code?: string; shareUrl?: string } | null;
  answers: Record<string, any>;
  submittedAt: string;
};

type StatusId = "novo" | "analise" | "contato" | "encaminhado" | "atendimento" | "finalizado" | "urgente" | "prioridade";

type Note = { ts: string; text: string };

type Meta = {
  status: StatusId;
  notes: Note[];
  protocol: string;
  updatedAt: string;
  history: { ts: string; action: string }[];
};

const STATUSES: { id: StatusId; label: string; cls: string; dot: string }[] = [
  { id: "novo",          label: "Novo",              cls: "bg-primary/15 text-foreground border-primary/40",       dot: "bg-primary" },
  { id: "analise",       label: "Em análise",        cls: "bg-accent/30 text-accent-foreground border-accent/60",  dot: "bg-accent" },
  { id: "contato",       label: "Em contato",        cls: "bg-secondary/25 text-foreground border-secondary/60",   dot: "bg-secondary" },
  { id: "encaminhado",   label: "Encaminhado",       cls: "bg-primary/25 text-foreground border-primary/50",       dot: "bg-primary" },
  { id: "atendimento",   label: "Em atendimento",    cls: "bg-secondary/30 text-foreground border-secondary/60",   dot: "bg-secondary" },
  { id: "finalizado",    label: "Finalizado",        cls: "bg-secondary/40 text-secondary-foreground border-secondary/70", dot: "bg-secondary" },
  { id: "urgente",       label: "Urgente",           cls: "bg-destructive/15 text-destructive border-destructive/50",      dot: "bg-destructive" },
  { id: "prioridade",    label: "Prioridade máxima", cls: "bg-destructive/25 text-destructive border-destructive/70",      dot: "bg-destructive" },
];

const STRIP_KEYS = new Set(["word", "phrase", "code", "palavra", "frase", "codigo", "código"]);

const META_KEY = "colo-de-mae-meta";
const LIST_KEY = "colo-de-mae-respostas";

function loadMetaMap(): Record<string, Meta> {
  try { return JSON.parse(localStorage.getItem(META_KEY) || "{}"); } catch { return {}; }
}
function saveMetaMap(m: Record<string, Meta>) {
  localStorage.setItem(META_KEY, JSON.stringify(m));
}
function genProtocol(ts: string) {
  const d = new Date(ts);
  const seed = Math.abs(Array.from(ts).reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7));
  const n = (seed % 9000) + 1000;
  return `CDM-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${n}`;
}
function ensureMeta(map: Record<string, Meta>, s: Submission): Meta {
  if (map[s.submittedAt]) return map[s.submittedAt];
  const m: Meta = {
    status: "novo",
    notes: [],
    protocol: genProtocol(s.submittedAt),
    updatedAt: s.submittedAt,
    history: [{ ts: s.submittedAt, action: "Cadastro criado" }],
  };
  map[s.submittedAt] = m;
  return m;
}

// =============================================================================
// Field labels & helpers
// =============================================================================
const FIELD_LABELS: Record<string, string> = {
  necessidades: "Necessidades", descricaoAjuda: "Descrição da ajuda",
  nomePaciente: "Nome do PcD/TEA", cpfPaciente: "CPF do PcD/TEA",
  nomeResponsavel: "Nome do responsável", cpfResponsavel: "CPF do responsável",
  nascimento: "Data de nascimento", idade: "Idade",
  telefone1: "Telefone principal", telefone2: "Telefone secundário",
  email: "E-mail", endereco: "Endereço", bairro: "Bairro", cidade: "Cidade",
  temDiagnostico: "Possui diagnóstico", diagnosticos: "Diagnóstico", diagnosticoOutro: "Outro diagnóstico",
  nivelSuporte: "Nível de suporte", laudo: "Possui laudo", ciptea: "CIPTEA", carteirinha: "Carteira PcD",
  motora: "Coord. motora", autonomia: "Autonomia", sensorial: "Sensorial", social: "Social/comportamental",
  estuda: "Estuda", tipoEscola: "Tipo de escola", at: "Acompanhante terapêutico",
  dificuldadeEscolar: "Dificuldade escolar", semEscola: "Sem escola", frequencia: "Frequência reduzida",
  terapias: "Terapias", filaSus: "Fila SUS", tempoEspera: "Tempo de espera",
  moradores: "Moradores na casa", renda: "Renda familiar", trabalha: "Responsável trabalha",
  bpc: "BPC/LOAS", gastosTerapia: "Gastos com terapia",
  porqueImportante: "Importância da vaga", urgenciaSituacao: "Urgência",
  saude: "Saúde", educacaoDir: "Educação", trabalho: "Trabalho", transporteDir: "Transporte",
  assistencia: "Assistência social", previdencia: "Previdência", habitacao: "Habitação",
  cultura: "Cultura/lazer", tributacao: "Tributação", acessibilidade: "Acessibilidade",
  aceiteLgpd: "Aceite LGPD", aceiteTermo: "Aceite termo",
};

function label(k: string) { return FIELD_LABELS[k] || k; }
function asArr(v: any): string[] { return Array.isArray(v) ? v : v ? [String(v)] : []; }
function val(v: any): string {
  if (v === true || v === "true") return "Sim";
  if (v === false || v === "false") return "Não";
  if (Array.isArray(v)) return v.join(", ");
  return String(v ?? "");
}
function hasUrgency(s: Submission): boolean {
  const u = asArr(s.answers?.urgenciaSituacao);
  if (u.length > 0) return true;
  const txt = String(s.answers?.descricaoAjuda || "") + " " + String(s.answers?.porqueImportante || "");
  return /regress[ãa]o|agress|abandono|viol[êe]ncia|risco|sem suporte|crise/i.test(txt);
}
function ageGroup(age: any): string {
  const n = Number(age);
  if (!n || isNaN(n)) return "—";
  if (n <= 5) return "0–5";
  if (n <= 12) return "6–12";
  if (n <= 17) return "13–17";
  if (n <= 29) return "18–29";
  if (n <= 59) return "30–59";
  return "60+";
}

// =============================================================================
// Sanitization
// =============================================================================
function sanitizedAnswers(a: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of Object.keys(a || {})) if (!STRIP_KEYS.has(k)) out[k] = a[k];
  return out;
}
function flatten(s: Submission, meta?: Meta) {
  const a = sanitizedAnswers(s.answers || {});
  const flat: Record<string, string> = {
    protocolo: meta?.protocol || genProtocol(s.submittedAt),
    status: STATUSES.find((x) => x.id === (meta?.status || "novo"))!.label,
    dataCadastro: new Date(s.submittedAt).toLocaleString("pt-BR"),
    desejaCartao: s.wantsCard ? "Sim" : "Não",
    emailContato: s.contact?.email ?? "",
    whatsappContato: s.contact?.whatsapp ?? "",
    linkCartao: s.credentials?.shareUrl ?? "",
  };
  for (const k of Object.keys(a)) flat[label(k)] = val(a[k]);
  return flat;
}

// =============================================================================
// Downloads
// =============================================================================
function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function exportTXT(items: Submission[], metas: Record<string, Meta>, base: string) {
  const out = items.map((s, i) => {
    const f = flatten(s, metas[s.submittedAt]);
    return [`=== ${f.protocolo} — Cadastro ${i + 1} ===`, ...Object.keys(f).map((k) => `${k}: ${f[k]}`)].join("\n");
  }).join("\n\n");
  download(`${base}.txt`, new Blob([out], { type: "text/plain;charset=utf-8" }));
}
function exportJSON(items: Submission[], metas: Record<string, Meta>, base: string) {
  const safe = items.map((s) => ({
    protocolo: metas[s.submittedAt]?.protocol || genProtocol(s.submittedAt),
    status: metas[s.submittedAt]?.status || "novo",
    submittedAt: s.submittedAt,
    wantsCard: s.wantsCard,
    contact: s.contact,
    shareUrl: s.credentials?.shareUrl ?? "",
    answers: sanitizedAnswers(s.answers),
  }));
  download(`${base}.json`, new Blob([JSON.stringify(safe, null, 2)], { type: "application/json" }));
}
function exportCSV(items: Submission[], metas: Record<string, Meta>, base: string) {
  const rows = items.map((s) => flatten(s, metas[s.submittedAt]));
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h] ?? "")).join(","));
  download(`${base}.csv`, new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
}
function exportXLSX(items: Submission[], metas: Record<string, Meta>, base: string) {
  const rows = items.map((s) => flatten(s, metas[s.submittedAt]));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Cadastros");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  download(`${base}.xlsx`, new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
}
async function exportPDF(items: Submission[], metas: Record<string, Meta>, base: string, summary: Summary) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const now = new Date().toLocaleString("pt-BR");

  const drawFooter = (page: number, total: number) => {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120);
    doc.text("Cartão Colo de Mãe — Relatório Institucional", margin, H - 18);
    doc.text(`Gerado em ${now}`, W / 2, H - 18, { align: "center" });
    doc.text(`Página ${page} / ${total}`, W - margin, H - 18, { align: "right" });
    doc.setTextColor(0);
  };
  const drawHeader = (title: string) => {
    doc.setFillColor(20, 60, 130);
    doc.rect(0, 0, W, 56, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("Cartão Colo de Mãe", margin, 24);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(title, margin, 42);
    doc.setTextColor(0);
  };

  // --- COVER ---
  doc.setFillColor(20, 60, 130); doc.rect(0, 0, W, H, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "bold"); doc.setFontSize(28);
  doc.text("Cartão Colo de Mãe", W / 2, H / 2 - 80, { align: "center" });
  doc.setFontSize(16); doc.setFont("helvetica", "normal");
  doc.text("Relatório Institucional de Cadastros", W / 2, H / 2 - 50, { align: "center" });
  doc.setFontSize(11);
  doc.text(`Total de cadastros: ${items.length}`, W / 2, H / 2 + 10, { align: "center" });
  doc.text(`Gerado em ${now}`, W / 2, H / 2 + 28, { align: "center" });
  doc.text("Documento confidencial — uso institucional", W / 2, H - 80, { align: "center" });
  doc.setTextColor(0);

  // --- EXECUTIVE SUMMARY ---
  doc.addPage(); drawHeader("Resumo Executivo");
  let y = 80;
  doc.setFont("helvetica", "bold"); doc.setFontSize(13);
  doc.text("Indicadores", margin, y); y += 18;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10);
  const lines = [
    `Cadastros totais: ${summary.total}`,
    `Cadastros com cartão: ${summary.withCard}`,
    `Situações de urgência: ${summary.urgent}`,
    `Solicitam Professor Auxiliar: ${summary.profAux}`,
    `Sem acessibilidade declarada: ${summary.semAcess}`,
    `Sem previdência declarada: ${summary.semPrev}`,
    `Cidade com maior volume: ${summary.topCity || "—"}`,
    `Diagnóstico mais frequente: ${summary.topDiag || "—"}`,
    `Necessidade mais solicitada: ${summary.topNeed || "—"}`,
    `Cadastros nos últimos 30 dias: ${summary.last30}`,
  ];
  for (const l of lines) { doc.text(`• ${l}`, margin, y); y += 14; }

  // --- CADASTROS ---
  for (let i = 0; i < items.length; i++) {
    const s = items[i];
    const meta = metas[s.submittedAt] || ({} as Meta);
    const f = flatten(s, meta);
    doc.addPage(); drawHeader(`Cadastro ${i + 1} de ${items.length} — Protocolo ${f.protocolo}`);
    y = 80;

    // QR code (link público do cartão, sem dados secretos)
    if (s.credentials?.shareUrl) {
      try {
        const qr = await QRCode.toDataURL(s.credentials.shareUrl, { margin: 0, width: 200 });
        doc.addImage(qr, "PNG", W - margin - 90, y, 90, 90);
      } catch {}
    }

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(String(s.answers?.nomePaciente || "Sem nome"), margin, y + 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(80);
    doc.text(`Responsável: ${s.answers?.nomeResponsavel || "—"}`, margin, y + 26);
    doc.text(`Status: ${f.status} • Cadastro: ${f.dataCadastro}`, margin, y + 40);
    doc.setTextColor(0);
    y += 62;

    doc.setDrawColor(220); doc.line(margin, y, W - margin, y); y += 12;

    const entries = Object.entries(f).filter(([k]) => !["protocolo", "status", "dataCadastro"].includes(k));
    for (const [k, v] of entries) {
      if (y > H - 60) { drawFooter(doc.getNumberOfPages() - 1, 0); doc.addPage(); drawHeader(`Cadastro ${i + 1} (cont.) — ${f.protocolo}`); y = 80; }
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(`${k}:`, margin, y);
      doc.setFont("helvetica", "normal");
      const wrapped = doc.splitTextToSize(v || "—", W - margin * 2 - 130);
      doc.text(wrapped, margin + 130, y);
      y += Math.max(13, wrapped.length * 12);
    }

    if (meta.notes && meta.notes.length) {
      y += 8; doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text("Observações internas (não exportadas a terceiros):", margin, y); y += 14;
      doc.setFont("helvetica", "normal"); doc.setFontSize(9);
      for (const n of meta.notes) {
        const w = doc.splitTextToSize(`• [${new Date(n.ts).toLocaleString("pt-BR")}] ${n.text}`, W - margin * 2);
        doc.text(w, margin, y); y += w.length * 11;
      }
    }

    y = H - 110;
    doc.setDrawColor(200); doc.line(margin, y, margin + 220, y);
    doc.setFontSize(8); doc.setTextColor(120);
    doc.text("Assinatura institucional", margin, y + 12);
    doc.text(`Protocolo único: ${f.protocolo}`, margin, y + 26);
    doc.setTextColor(0);
  }

  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) { doc.setPage(p); drawFooter(p, total); }
  doc.save(`${base}.pdf`);
}
async function exportDOCX(items: Submission[], metas: Record<string, Meta>, base: string) {
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, children: [new TextRun("Cartão Colo de Mãe")] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Relatório Social / Jurídico Institucional", italics: true })] }),
    new Paragraph({ children: [new TextRun(`Gerado em ${new Date().toLocaleString("pt-BR")} — Total de cadastros: ${items.length}`)] }),
    new Paragraph({ children: [new TextRun("")] }),
  ];
  items.forEach((s, i) => {
    const meta = metas[s.submittedAt];
    const f = flatten(s, meta);
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(`Cadastro ${i + 1} — Protocolo ${f.protocolo}`)] }));
    for (const k of Object.keys(f)) {
      children.push(new Paragraph({ children: [new TextRun({ text: `${k}: `, bold: true }), new TextRun(f[k] || "—")] }));
    }
    children.push(new Paragraph({ children: [new TextRun("")] }));
    children.push(new Paragraph({ children: [new TextRun({ text: "_____________________________________", color: "888888" })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: "Assinatura institucional", italics: true })] }));
    children.push(new Paragraph({ children: [new TextRun("")] }));
  });
  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  download(`${base}.docx`, blob);
}

// =============================================================================
// Summary
// =============================================================================
type Summary = {
  total: number; withCard: number; urgent: number; profAux: number; semAcess: number; semPrev: number;
  topCity: string; topDiag: string; topNeed: string; last30: number;
  byCity: [string, number][]; byDiag: [string, number][]; byStatus: [string, number][]; byMonth: [string, number][];
};
function computeSummary(items: Submission[], metas: Record<string, Meta>): Summary {
  const tally = (arr: string[]) => {
    const m = new Map<string, number>();
    for (const v of arr) if (v) m.set(v, (m.get(v) || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const cities = items.map((s) => String(s.answers?.cidade || "").trim()).filter(Boolean);
  const diags = items.flatMap((s) => asArr(s.answers?.diagnosticos));
  const needs = items.flatMap((s) => asArr(s.answers?.necessidades));
  const byCity = tally(cities);
  const byDiag = tally(diags);
  const byNeed = tally(needs);
  const byStatus = tally(items.map((s) => STATUSES.find((x) => x.id === (metas[s.submittedAt]?.status || "novo"))!.label));
  const byMonth = (() => {
    const m = new Map<string, number>();
    for (const s of items) {
      const d = new Date(s.submittedAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(k, (m.get(k) || 0) + 1);
    }
    return [...m.entries()].sort();
  })();
  const since = Date.now() - 30 * 86400000;
  return {
    total: items.length,
    withCard: items.filter((s) => s.wantsCard).length,
    urgent: items.filter(hasUrgency).length,
    profAux: items.filter((s) => asArr(s.answers?.necessidades).includes("professor")).length,
    semAcess: items.filter((s) => asArr(s.answers?.acessibilidade).length === 0).length,
    semPrev: items.filter((s) => asArr(s.answers?.previdencia).length === 0).length,
    topCity: byCity[0]?.[0] || "",
    topDiag: byDiag[0]?.[0] || "",
    topNeed: byNeed[0]?.[0] || "",
    last30: items.filter((s) => new Date(s.submittedAt).getTime() >= since).length,
    byCity: byCity.slice(0, 8),
    byDiag: byDiag.slice(0, 8),
    byStatus,
    byMonth: byMonth.slice(-12),
  };
}

// =============================================================================
// UI components
// =============================================================================
function StatCard({ emoji, label, value, hint }: { emoji: string; label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-card border-2 border-border shadow-soft p-4">
      <div className="text-2xl" aria-hidden>{emoji}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{label}</div>
      <div className="text-2xl font-bold mt-0.5">{value}</div>
      {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
    </div>
  );
}
function BarList({ title, rows }: { title: string; rows: [string, number][] }) {
  const max = rows.reduce((m, [, v]) => Math.max(m, v), 0) || 1;
  return (
    <div className="rounded-2xl bg-card border-2 border-border shadow-soft p-5">
      <div className="font-semibold mb-3">{title}</div>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">Sem dados.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map(([k, v]) => (
            <li key={k}>
              <div className="flex justify-between text-sm mb-1"><span className="truncate">{k}</span><span className="font-mono text-muted-foreground">{v}</span></div>
              <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
function Pie({ rows }: { rows: [string, number][] }) {
  const total = rows.reduce((s, [, v]) => s + v, 0) || 1;
  const colors = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)", "var(--secondary)", "var(--accent)"];
  let acc = 0;
  const segs = rows.map(([k, v], i) => {
    const start = (acc / total) * 360; acc += v;
    const end = (acc / total) * 360;
    return { k, v, start, end, color: colors[i % colors.length] };
  });
  const grad = segs.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(", ");
  return (
    <div className="rounded-2xl bg-card border-2 border-border shadow-soft p-5">
      <div className="font-semibold mb-3">Status dos cadastros</div>
      {rows.length === 0 ? (<div className="text-sm text-muted-foreground">Sem dados.</div>) : (
        <div className="flex items-center gap-5">
          <div className="size-32 rounded-full shrink-0" style={{ background: `conic-gradient(${grad})` }} aria-hidden />
          <ul className="text-sm space-y-1 flex-1 min-w-0">
            {segs.map((s) => (
              <li key={s.k} className="flex items-center gap-2">
                <span className="size-3 rounded-sm shrink-0" style={{ background: s.color }} />
                <span className="truncate">{s.k}</span>
                <span className="ml-auto font-mono text-muted-foreground">{s.v}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
function StatusBadge({ status }: { status: StatusId }) {
  const s = STATUSES.find((x) => x.id === status)!;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      <span className={`size-2 rounded-full ${s.dot}`} aria-hidden /> {s.label}
    </span>
  );
}

// =============================================================================
// Page
// =============================================================================
const FORMATS = [
  { id: "pdf",  label: "PDF Institucional", emoji: "📄" },
  { id: "xlsx", label: "XLSX formatado",    emoji: "📈" },
  { id: "csv",  label: "CSV limpo",         emoji: "📊" },
  { id: "json", label: "JSON estruturado",  emoji: "🧩" },
  { id: "docx", label: "DOCX social/jurídico", emoji: "📝" },
  { id: "txt",  label: "TXT",               emoji: "📃" },
] as const;

type Scope = "todos" | "filtrados" | "urgentes" | "cidade" | "periodo";

function AdminPage({ onLogout }: { onLogout: () => void }) {
  const [items, setItems] = useState<Submission[]>([]);
  const [metas, setMetas] = useState<Record<string, Meta>>({});
  const [openIdx, setOpenIdx] = useState<string | null>(null);

  // Passwords (futuras, prontas para sincronizar ao Cloud)
  const [pwds, setPwds] = useState<StoredPwd[]>([]);
  const [newPwdLabel, setNewPwdLabel] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdMsg, setPwdMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [showPwdMgr, setShowPwdMgr] = useState(false);

  useEffect(() => { setPwds(loadPwds()); }, []);

  const addPwd = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    const label = newPwdLabel.trim();
    const pwd = newPwd.trim();
    if (!label) { setPwdMsg({ kind: "err", text: "Informe um nome/identificação para a senha." }); return; }
    if (pwd.length < 6) { setPwdMsg({ kind: "err", text: "A senha deve ter pelo menos 6 caracteres." }); return; }
    const hash = await sha256(pwd);
    if (pwds.some((p) => p.hash === hash)) { setPwdMsg({ kind: "err", text: "Essa senha já está cadastrada." }); return; }
    const next: StoredPwd[] = [...pwds, { id: crypto.randomUUID(), label, hash, createdAt: new Date().toISOString() }];
    savePwds(next);
    setPwds(next);
    setNewPwdLabel("");
    setNewPwd("");
    setPwdMsg({ kind: "ok", text: "Senha cadastrada com sucesso." });
  };
  const removePwd = (id: string) => {
    const next = pwds.filter((p) => p.id !== id);
    savePwds(next);
    setPwds(next);
    setPwdMsg({ kind: "ok", text: "Senha removida." });
  };

  // Filters
  const [q, setQ] = useState("");
  const [fCity, setFCity] = useState("");
  const [fBairro, setFBairro] = useState("");
  const [fDiag, setFDiag] = useState("");
  const [fAge, setFAge] = useState("");
  const [fNivel, setFNivel] = useState("");
  const [fWants, setFWants] = useState("");
  const [fProfAux, setFProfAux] = useState(false);
  const [fCarteira, setFCarteira] = useState("");
  const [fEstuda, setFEstuda] = useState("");
  const [fTrabalha, setFTrabalha] = useState("");
  const [fSaude, setFSaude] = useState("");
  const [fPrev, setFPrev] = useState("");
  const [fUrgent, setFUrgent] = useState(false);
  const [fStatus, setFStatus] = useState<string>("");
  const [fFrom, setFFrom] = useState("");
  const [fTo, setFTo] = useState("");

  // Export
  const [scope, setScope] = useState<Scope>("todos");
  const [scopeCity, setScopeCity] = useState("");
  const [scopeFrom, setScopeFrom] = useState("");
  const [scopeTo, setScopeTo] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LIST_KEY);
      const list: Submission[] = raw ? JSON.parse(raw) : [];
      setItems(list);
      const m = loadMetaMap();
      let changed = false;
      for (const s of list) if (!m[s.submittedAt]) { ensureMeta(m, s); changed = true; }
      if (changed) saveMetaMap(m);
      setMetas(m);
    } catch { setItems([]); }
  }, []);

  const updateMeta = (id: string, patch: Partial<Meta>, action?: string) => {
    setMetas((prev) => {
      const cur = prev[id] || { status: "novo", notes: [], protocol: genProtocol(id), updatedAt: id, history: [] };
      const next: Meta = { ...cur, ...patch, updatedAt: new Date().toISOString() };
      if (action) next.history = [...cur.history, { ts: new Date().toISOString(), action }];
      const all = { ...prev, [id]: next };
      saveMetaMap(all);
      return all;
    });
  };

  const cities = useMemo(() => Array.from(new Set(items.map((s) => String(s.answers?.cidade || "").trim()).filter(Boolean))).sort(), [items]);
  const diagOpts = useMemo(() => Array.from(new Set(items.flatMap((s) => asArr(s.answers?.diagnosticos)))).sort(), [items]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const fromTs = fFrom ? new Date(fFrom).getTime() : 0;
    const toTs = fTo ? new Date(fTo).getTime() + 86400000 : Infinity;
    return items.filter((s) => {
      const a = s.answers || {};
      const t = new Date(s.submittedAt).getTime();
      if (t < fromTs || t > toTs) return false;
      if (qq) {
        const blob = JSON.stringify({ a, c: s.contact, l: s.credentials?.shareUrl, p: metas[s.submittedAt]?.protocol }).toLowerCase();
        if (!blob.includes(qq)) return false;
      }
      if (fCity && String(a.cidade || "").toLowerCase() !== fCity.toLowerCase()) return false;
      if (fBairro && !String(a.bairro || "").toLowerCase().includes(fBairro.toLowerCase())) return false;
      if (fDiag && !asArr(a.diagnosticos).includes(fDiag)) return false;
      if (fAge && ageGroup(a.idade) !== fAge) return false;
      if (fNivel && String(a.nivelSuporte || "") !== fNivel) return false;
      if (fWants && (fWants === "sim" ? !s.wantsCard : s.wantsCard)) return false;
      if (fProfAux && !asArr(a.necessidades).includes("professor")) return false;
      if (fCarteira && String(a.carteirinha || "") !== fCarteira) return false;
      if (fEstuda && String(a.estuda || "") !== fEstuda) return false;
      if (fTrabalha && String(a.trabalha || "") !== fTrabalha) return false;
      if (fSaude === "sus" && !asArr(a.saude).includes("sus")) return false;
      if (fSaude === "outros" && asArr(a.saude).includes("sus")) return false;
      if (fPrev === "sim" && asArr(a.previdencia).length === 0) return false;
      if (fPrev === "nao" && asArr(a.previdencia).length > 0) return false;
      if (fUrgent && !hasUrgency(s)) return false;
      if (fStatus && (metas[s.submittedAt]?.status || "novo") !== fStatus) return false;
      return true;
    });
  }, [items, metas, q, fCity, fBairro, fDiag, fAge, fNivel, fWants, fProfAux, fCarteira, fEstuda, fTrabalha, fSaude, fPrev, fUrgent, fStatus, fFrom, fTo]);

  const summaryAll = useMemo(() => computeSummary(items, metas), [items, metas]);
  const summaryFiltered = useMemo(() => computeSummary(filtered, metas), [filtered, metas]);

  const scoped = useMemo(() => {
    if (scope === "todos") return items;
    if (scope === "filtrados") return filtered;
    if (scope === "urgentes") return items.filter(hasUrgency);
    if (scope === "cidade") return items.filter((s) => String(s.answers?.cidade || "").toLowerCase() === scopeCity.toLowerCase());
    if (scope === "periodo") {
      const from = scopeFrom ? new Date(scopeFrom).getTime() : 0;
      const to = scopeTo ? new Date(scopeTo).getTime() + 86400000 : Infinity;
      return items.filter((s) => { const t = new Date(s.submittedAt).getTime(); return t >= from && t <= to; });
    }
    return items;
  }, [scope, scopeCity, scopeFrom, scopeTo, items, filtered]);

  const stamp = new Date().toISOString().slice(0, 10);
  const base = `cadastros-colo-de-mae-${stamp}-${scope}`;

  const doExport = async (fmt: string) => {
    const data = scoped;
    if (!data.length) return;
    if (fmt === "txt") return exportTXT(data, metas, base);
    if (fmt === "json") return exportJSON(data, metas, base);
    if (fmt === "csv") return exportCSV(data, metas, base);
    if (fmt === "xlsx") return exportXLSX(data, metas, base);
    if (fmt === "pdf") return exportPDF(data, metas, base, computeSummary(data, metas));
    if (fmt === "docx") return exportDOCX(data, metas, base);
  };

  const clearAll = () => {
    if (!confirm("Apagar TODOS os cadastros e metadados? Esta ação não pode ser desfeita.")) return;
    localStorage.removeItem(LIST_KEY); localStorage.removeItem(META_KEY);
    setItems([]); setMetas({});
  };

  const resetFilters = () => {
    setQ(""); setFCity(""); setFBairro(""); setFDiag(""); setFAge(""); setFNivel(""); setFWants("");
    setFProfAux(false); setFCarteira(""); setFEstuda(""); setFTrabalha(""); setFSaude(""); setFPrev("");
    setFUrgent(false); setFStatus(""); setFFrom(""); setFTo("");
  };

  return (
    <main className="min-h-dvh bg-gradient-warm print:bg-white">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          main { background: white !important; }
          .print-card { break-inside: avoid; box-shadow: none !important; border: 1px solid #ccc !important; }
        }
      `}</style>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8 no-print">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground mb-3">
              🛡️ CRM Social — Painel Institucional
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Painel Geral de Cadastros</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Gestão de famílias, encaminhamentos e atendimentos. Palavra, frase e código secretos nunca são exibidos nem exportados.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => window.print()} className="rounded-2xl border-2 border-border bg-card px-5 py-3 font-semibold hover:bg-muted transition-colors">🖨️ Imprimir</button>
            <Link to="/respostas" className="rounded-2xl border-2 border-border bg-card px-5 py-3 font-semibold hover:bg-muted transition-colors">📊 Respostas</Link>
            <Link to="/" className="rounded-2xl border-2 border-border bg-card px-5 py-3 font-semibold hover:bg-muted transition-colors">← Cadastro</Link>
          </div>
        </header>

        {/* PRINT HEADER */}
        <div className="hidden print:block mb-6 border-b-2 border-foreground pb-4">
          <div className="text-2xl font-bold">Cartão Colo de Mãe</div>
          <div className="text-sm">Relatório Institucional — gerado em {new Date().toLocaleString("pt-BR")}</div>
        </div>

        {/* === BLOCO 1: RESUMO EXECUTIVO === */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3 no-print">
            <h2 className="text-xl font-bold">📌 Resumo Executivo</h2>
            <span className="text-xs text-muted-foreground">Dados consolidados de todos os cadastros</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard emoji="👨‍👩‍👧" label="Total cadastrados" value={summaryAll.total} hint={`+${summaryAll.last30} nos últimos 30 dias`} />
            <StatCard emoji="💳" label="Com cartão" value={summaryAll.withCard} />
            <StatCard emoji="🚨" label="Em urgência" value={summaryAll.urgent} />
            <StatCard emoji="👩‍🏫" label="Prof. auxiliar" value={summaryAll.profAux} />
            <StatCard emoji="♿" label="Sem acessibilidade" value={summaryAll.semAcess} />
            <StatCard emoji="🏛️" label="Sem previdência" value={summaryAll.semPrev} />
            <StatCard emoji="📍" label="Cidade nº1" value={summaryAll.topCity || "—"} />
            <StatCard emoji="🧩" label="Diagnóstico nº1" value={summaryAll.topDiag || "—"} />
            <StatCard emoji="🎯" label="Necessidade nº1" value={summaryAll.topNeed || "—"} />
            <StatCard emoji="🔍" label="Filtrados agora" value={summaryFiltered.total} hint={`${summaryFiltered.urgent} urgentes`} />
          </div>
        </section>

        {/* === BLOCO 2: GRÁFICOS === */}
        <section className="grid lg:grid-cols-3 gap-4 mb-8">
          <BarList title="🧩 Diagnósticos mais comuns" rows={summaryAll.byDiag} />
          <BarList title="📍 Cidades com maior demanda" rows={summaryAll.byCity} />
          <Pie rows={summaryAll.byStatus} />
          <div className="lg:col-span-3">
            <BarList title="📈 Cadastros por mês" rows={summaryAll.byMonth} />
          </div>
        </section>

        {/* === BLOCO 3: FILTROS AVANÇADOS === */}
        <section className="rounded-3xl bg-card border-2 border-border shadow-soft p-5 sm:p-6 mb-8 no-print">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold">🔎 Filtros avançados</h2>
            <button onClick={resetFilters} className="text-sm font-semibold text-primary hover:underline">Limpar filtros</button>
          </div>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="🔍 Busca livre: nome, CPF, protocolo, telefone, e-mail, cidade…"
            className="w-full rounded-2xl border-2 border-border bg-background px-5 py-3 text-base focus:border-primary focus:outline-none mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
            <Select label="Cidade" value={fCity} onChange={setFCity} options={[["", "Todas"], ...cities.map((c) => [c, c] as [string, string])]} />
            <input className={inp} placeholder="Bairro contém…" value={fBairro} onChange={(e) => setFBairro(e.target.value)} />
            <Select label="Diagnóstico" value={fDiag} onChange={setFDiag} options={[["", "Todos"], ...diagOpts.map((c) => [c, c] as [string, string])]} />
            <Select label="Faixa etária" value={fAge} onChange={setFAge} options={[["",""],["0–5","0–5"],["6–12","6–12"],["13–17","13–17"],["18–29","18–29"],["30–59","30–59"],["60+","60+"]]} />
            <Select label="Nível suporte" value={fNivel} onChange={setFNivel} options={[["",""],["1","1"],["2","2"],["3","3"],["naosei","Não sabe"]]} />
            <Select label="Deseja cartão" value={fWants} onChange={setFWants} options={[["",""],["sim","Sim"],["nao","Não"]]} />
            <Select label="Carteira PcD" value={fCarteira} onChange={setFCarteira} options={[["",""],["sim","Sim"],["nao","Não"]]} />
            <Select label="Estuda" value={fEstuda} onChange={setFEstuda} options={[["",""],["sim","Sim"],["nao","Não"]]} />
            <Select label="Trabalha" value={fTrabalha} onChange={setFTrabalha} options={[["",""],["sim","Sim"],["parcial","Parcial"],["nao","Não"]]} />
            <Select label="Saúde" value={fSaude} onChange={setFSaude} options={[["",""],["sus","SUS"],["outros","Outros/convênio"]]} />
            <Select label="Previdência" value={fPrev} onChange={setFPrev} options={[["",""],["sim","Possui"],["nao","Não possui"]]} />
            <Select label="Status" value={fStatus} onChange={setFStatus} options={[["",""], ...STATUSES.map((s) => [s.id, s.label] as [string, string])]} />
            <label className={lbl}>De<input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className={inp} /></label>
            <label className={lbl}>Até<input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className={inp} /></label>
            <label className="flex items-center gap-2 rounded-xl border-2 border-border bg-background px-3 py-2.5"><input type="checkbox" checked={fProfAux} onChange={(e) => setFProfAux(e.target.checked)} /> Solicita prof. auxiliar</label>
            <label className="flex items-center gap-2 rounded-xl border-2 border-border bg-background px-3 py-2.5"><input type="checkbox" checked={fUrgent} onChange={(e) => setFUrgent(e.target.checked)} /> Apenas urgentes</label>
          </div>
          <div className="mt-4 text-sm text-muted-foreground"><strong>{filtered.length}</strong> de <strong>{items.length}</strong> cadastros correspondem aos filtros.</div>
        </section>

        {/* === BLOCO 4: EXPORTAÇÃO PREMIUM === */}
        <section className="rounded-3xl bg-card border-2 border-border shadow-soft p-5 sm:p-6 mb-8 no-print">
          <h2 className="text-xl font-bold mb-3">📤 Exportação Premium</h2>
          <p className="text-sm text-muted-foreground mb-4">Sempre sem palavra/frase/código secretos. PDF e DOCX em formato social/jurídico institucional com cabeçalho, rodapé, paginação, protocolo único e QR code.</p>
          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div>
              <div className="font-semibold mb-2 text-sm">Escopo</div>
              <div className="grid grid-cols-2 gap-2">
                {([["todos","Todos"],["filtrados","Filtrados"],["urgentes","Apenas urgentes"],["cidade","Por cidade"],["periodo","Por período"]] as [Scope,string][]).map(([id, lbl2]) => (
                  <button key={id} onClick={() => setScope(id)} className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${scope===id ? "border-primary bg-primary/10" : "border-border bg-background hover:bg-muted"}`}>{lbl2}</button>
                ))}
              </div>
              {scope === "cidade" && (
                <Select label="Cidade do escopo" value={scopeCity} onChange={setScopeCity} options={[["", "Selecione…"], ...cities.map((c) => [c, c] as [string, string])]} />
              )}
              {scope === "periodo" && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <label className={lbl}>De<input type="date" value={scopeFrom} onChange={(e) => setScopeFrom(e.target.value)} className={inp} /></label>
                  <label className={lbl}>Até<input type="date" value={scopeTo} onChange={(e) => setScopeTo(e.target.value)} className={inp} /></label>
                </div>
              )}
              <div className="mt-3 text-sm text-muted-foreground">Vai exportar <strong>{scoped.length}</strong> cadastro(s).</div>
            </div>
            <div>
              <div className="font-semibold mb-2 text-sm">Formato</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FORMATS.map((f) => (
                  <button key={f.id} disabled={scoped.length === 0} onClick={() => doExport(f.id)}
                    className="flex flex-col items-center gap-1 rounded-xl border-2 border-border bg-background px-3 py-3 hover:border-primary hover:bg-accent/30 active:scale-[0.98] transition-all disabled:opacity-40 text-center">
                    <span className="text-2xl" aria-hidden>{f.emoji}</span>
                    <span className="text-xs font-semibold leading-tight">{f.label}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => window.print()} className="mt-3 w-full rounded-xl bg-primary text-primary-foreground font-bold px-4 py-3 hover:opacity-95 transition-opacity">🖨️ Modo impressão profissional</button>
            </div>
          </div>
        </section>

        {/* === BLOCO 5: LISTA === */}
        <section className="rounded-3xl bg-card border-2 border-border shadow-soft p-4 sm:p-6 print-card">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold">👥 Cadastros</h2>
            <button onClick={clearAll} disabled={items.length === 0} className="no-print text-sm font-semibold text-destructive hover:underline disabled:opacity-40">🗑️ Apagar todos</button>
          </div>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">Nenhum cadastro encontrado com os filtros atuais. 💙</p>
          ) : (
            <ul className="divide-y-2 divide-border">
              {filtered.slice().reverse().map((s) => {
                const id = s.submittedAt;
                const meta = metas[id] || ensureMeta({ ...metas }, s);
                const a = s.answers || {};
                const isOpen = openIdx === id;
                const urgent = hasUrgency(s);
                return (
                  <li key={id} className="py-3 print-card">
                    <button onClick={() => setOpenIdx(isOpen ? null : id)} className="w-full text-left rounded-2xl p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted">{meta.protocol}</span>
                            <StatusBadge status={meta.status} />
                            {urgent && <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive border-2 border-destructive/40 px-2 py-0.5 text-xs font-semibold">🚨 Urgência</span>}
                            {s.wantsCard && <span className="rounded-full bg-secondary/30 border-2 border-secondary/50 px-2 py-0.5 text-xs font-semibold">💳 Cartão</span>}
                          </div>
                          <div className="font-bold text-lg truncate">{a.nomePaciente || "Sem nome"}{a.idade ? <span className="text-muted-foreground font-normal"> · {a.idade} anos</span> : null}</div>
                          <div className="text-sm text-muted-foreground truncate">resp. {a.nomeResponsavel || "—"} · 📍 {a.cidade || "—"}{a.bairro ? ` / ${a.bairro}` : ""} · 🧩 {asArr(a.diagnosticos).join(", ") || "—"}</div>
                          <div className="text-xs text-muted-foreground mt-1">📅 {new Date(s.submittedAt).toLocaleString("pt-BR")} · 📞 {s.contact?.whatsapp || a.telefone1 || "—"} · 📧 {s.contact?.email || a.email || "—"}</div>
                        </div>
                        <span className="text-2xl shrink-0 no-print" aria-hidden>{isOpen ? "▾" : "▸"}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="mt-3 rounded-2xl bg-background border-2 border-border p-4 sm:p-5 space-y-5">
                        {/* Status + obs internas */}
                        <div className="grid md:grid-cols-2 gap-4 no-print">
                          <div>
                            <div className="text-sm font-semibold mb-2">Status operacional</div>
                            <div className="flex flex-wrap gap-2">
                              {STATUSES.map((st) => (
                                <button key={st.id} onClick={() => updateMeta(id, { status: st.id }, `Status → ${st.label}`)}
                                  className={`rounded-full border-2 px-3 py-1 text-xs font-semibold transition-all ${meta.status === st.id ? st.cls : "border-border bg-card hover:bg-muted"}`}>
                                  {st.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold mb-2">📝 Observações internas <span className="font-normal text-muted-foreground">(não exportadas — só admin)</span></div>
                            <NoteForm onAdd={(text) => updateMeta(id, { notes: [...meta.notes, { ts: new Date().toISOString(), text }] }, "Observação adicionada")} />
                            {meta.notes.length > 0 && (
                              <ul className="mt-2 space-y-1 text-sm max-h-40 overflow-auto">
                                {meta.notes.slice().reverse().map((n, i) => (
                                  <li key={i} className="rounded-lg bg-muted/40 px-3 py-2"><span className="text-xs text-muted-foreground">{new Date(n.ts).toLocaleString("pt-BR")}</span><div>{n.text}</div></li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Link cartão */}
                        {s.credentials?.shareUrl && (
                          <div className="rounded-xl bg-primary/5 border-2 border-primary/30 p-3">
                            <div className="text-sm font-semibold mb-1">🔗 Link exclusivo do cartão</div>
                            <div className="flex gap-2 items-center">
                              <a href={s.credentials.shareUrl} target="_blank" rel="noopener noreferrer" className="flex-1 break-all text-sm text-primary underline font-mono">{s.credentials.shareUrl}</a>
                              <button onClick={() => navigator.clipboard?.writeText(s.credentials!.shareUrl!)} className="rounded-xl border-2 border-border bg-card px-3 py-2 text-sm hover:bg-muted transition-colors shrink-0 no-print">📋 Copiar</button>
                            </div>
                          </div>
                        )}

                        {/* Dados do cadastro */}
                        <div>
                          <div className="text-sm font-semibold mb-2">📋 Dados do cadastro</div>
                          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                            {Object.entries(flatten(s, meta)).map(([k, v]) => (
                              <div key={k} className="border-b border-border/40 py-1"><span className="font-semibold text-foreground/80">{k}: </span><span className="break-words">{v || "—"}</span></div>
                            ))}
                          </div>
                        </div>

                        {/* Timeline */}
                        <div>
                          <div className="text-sm font-semibold mb-2">🕒 Timeline de atendimento</div>
                          <ol className="space-y-1 text-sm">
                            {meta.history.slice().reverse().map((h, i) => (
                              <li key={i} className="flex gap-3"><span className="text-xs text-muted-foreground font-mono shrink-0 w-40">{new Date(h.ts).toLocaleString("pt-BR")}</span><span>{h.action}</span></li>
                            ))}
                          </ol>
                          <div className="text-xs text-muted-foreground mt-2">Última atualização: {new Date(meta.updatedAt).toLocaleString("pt-BR")}</div>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="text-center text-xs text-muted-foreground mt-6 no-print">
          🔒 Observações internas, palavra/frase/código secretos nunca são exportados nem expostos por link público.
        </p>
      </section>
    </main>
  );
}

// =============================================================================
// Small helpers (inline form controls)
// =============================================================================
const inp = "rounded-xl border-2 border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none";
const lbl = "flex flex-col gap-1 text-xs font-semibold text-muted-foreground";

function Select({ label: l, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <label className={lbl}>
      {l}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inp}>
        {options.map(([v, t]) => <option key={v} value={v}>{t || "—"}</option>)}
      </select>
    </label>
  );
}

function NoteForm({ onAdd }: { onAdd: (t: string) => void }) {
  const [t, setT] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (t.trim()) { onAdd(t.trim()); setT(""); } }} className="flex gap-2">
      <input value={t} onChange={(e) => setT(e.target.value)} placeholder="Família aguarda retorno, solicitar laudo…"
        className="flex-1 rounded-xl border-2 border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none" />
      <button type="submit" className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:opacity-95">Adicionar</button>
    </form>
  );
}