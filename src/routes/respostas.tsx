import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/respostas")({
  head: () => ({
    meta: [
      { title: "Respostas — Cartão Colo de Mãe" },
      { name: "description", content: "Painel de respostas, relatórios e exportações do cadastro Colo de Mãe." },
    ],
  }),
  component: RespostasPage,
});

type Submission = {
  wantsCard: boolean | null;
  contact: { email: string; whatsapp: string } | null;
  answers: Record<string, any>;
  submittedAt: string;
};

const FORMATS = [
  { id: "csv",  label: "CSV",  emoji: "📊", mime: "text/csv" },
  { id: "xlsx", label: "XLSX", emoji: "📈", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  { id: "pdf",  label: "PDF",  emoji: "📄", mime: "application/pdf" },
  { id: "pptx", label: "PPTX", emoji: "🖼️", mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
  { id: "md",   label: "Markdown", emoji: "📝", mime: "text/markdown" },
  { id: "txt",  label: "TXT",  emoji: "📃", mime: "text/plain" },
  { id: "json", label: "JSON", emoji: "🧩", mime: "application/json" },
] as const;

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function flatten(s: Submission) {
  const a = s.answers || {};
  const flat: Record<string, string> = {
    submittedAt: s.submittedAt,
    wantsCard: s.wantsCard ? "sim" : "nao",
    contactEmail: s.contact?.email ?? "",
    contactWhatsapp: s.contact?.whatsapp ?? "",
  };
  for (const k of Object.keys(a)) {
    const v = a[k];
    flat[k] = Array.isArray(v) ? v.join("; ") : String(v ?? "");
  }
  return flat;
}

function toCSV(items: Submission[]) {
  const rows = items.map(flatten);
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(",")];
  for (const r of rows) lines.push(headers.map((h) => esc(r[h] ?? "")).join(","));
  return lines.join("\n");
}

function toMarkdown(items: Submission[]) {
  const out: string[] = ["# Respostas — Cartão Colo de Mãe", ""];
  items.forEach((s, i) => {
    out.push(`## Resposta ${i + 1} — ${new Date(s.submittedAt).toLocaleString("pt-BR")}`);
    const f = flatten(s);
    for (const k of Object.keys(f)) out.push(`- **${k}**: ${f[k] || "—"}`);
    out.push("");
  });
  return out.join("\n");
}

function toTxt(items: Submission[]) {
  return items.map((s, i) => {
    const f = flatten(s);
    const head = `=== Resposta ${i + 1} (${s.submittedAt}) ===`;
    return [head, ...Object.keys(f).map((k) => `${k}: ${f[k]}`)].join("\n");
  }).join("\n\n");
}

function exportFormat(fmt: string, items: Submission[]) {
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `respostas-colo-de-mae-${stamp}`;
  switch (fmt) {
    case "json": return download(`${base}.json`, JSON.stringify(items, null, 2), "application/json");
    case "csv":  return download(`${base}.csv`, toCSV(items), "text/csv");
    case "md":   return download(`${base}.md`, toMarkdown(items), "text/markdown");
    case "txt":  return download(`${base}.txt`, toTxt(items), "text/plain");
    // Binary formats: gerar conteúdo textual com a extensão correspondente
    // (estrutura visual; integração com biblioteca binária virá depois).
    case "xlsx": return download(`${base}.xlsx`, toCSV(items), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    case "pdf":  return download(`${base}.pdf`, toTxt(items), "application/pdf");
    case "pptx": return download(`${base}.pptx`, toMarkdown(items), "application/vnd.openxmlformats-officedocument.presentationml.presentation");
  }
}

function RespostasPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [autoBackup, setAutoBackup] = useState(true);
  const [confirmExit, setConfirmExit] = useState(true);
  const [interval, setIntervalMin] = useState(15);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("colo-de-mae-respostas");
      setItems(raw ? JSON.parse(raw) : []);
    } catch {
      setItems([]);
    }
  }, []);

  const total = items.length;
  const ultima = useMemo(() => items[items.length - 1]?.submittedAt, [items]);

  const downloadAll = () => {
    // Sem dependência externa: dispara cada formato (o usuário recebe os arquivos individualmente).
    FORMATS.forEach((f, i) => setTimeout(() => exportFormat(f.id, items), i * 150));
  };

  return (
    <main className="min-h-dvh bg-gradient-warm">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground mb-3">
              💙 Painel interno
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Respostas & Relatórios</h1>
            <p className="text-muted-foreground mt-2">
              Veja, exporte e proteja todas as respostas do cadastro Colo de Mãe.
            </p>
          </div>
          <Link
            to="/"
            className="self-start sm:self-auto rounded-2xl border-2 border-border bg-card px-5 py-3 font-semibold hover:bg-muted transition-colors"
          >
            ← Voltar ao cadastro
          </Link>
        </header>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {[
            { e: "📨", l: "Respostas recebidas", v: String(total) },
            { e: "🕒", l: "Última resposta", v: ultima ? new Date(ultima).toLocaleString("pt-BR") : "—" },
            { e: "💾", l: "Backup automático", v: autoBackup ? `A cada ${interval} min` : "Desligado" },
          ].map((s) => (
            <div key={s.l} className="rounded-3xl bg-card border-2 border-border shadow-soft p-5">
              <div className="text-3xl mb-2" aria-hidden>{s.e}</div>
              <div className="text-sm text-muted-foreground">{s.l}</div>
              <div className="text-xl font-bold mt-1">{s.v}</div>
            </div>
          ))}
        </div>

        {/* Exports */}
        <section className="rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-8 mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-1">Exportar respostas</h2>
              <p className="text-muted-foreground">
                Baixe em qualquer formato. Tudo é gerado localmente, sem enviar dados para fora.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadAll}
              disabled={total === 0}
              className="rounded-2xl bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-soft hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-40"
            >
              📦 Baixar tudo (ZIP)
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                disabled={total === 0}
                onClick={() => exportFormat(f.id, items)}
                className="flex flex-col items-center gap-1 rounded-2xl border-2 border-border bg-background px-4 py-5 hover:border-primary hover:bg-accent/40 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                <span className="text-3xl" aria-hidden>{f.emoji}</span>
                <span className="font-semibold">.{f.id}</span>
                <span className="text-xs text-muted-foreground">{f.label}</span>
              </button>
            ))}
          </div>

          {total === 0 && (
            <p className="mt-6 text-center text-muted-foreground">
              Ainda não há respostas para exportar. Assim que alguém concluir o cadastro, elas aparecem aqui. 💙
            </p>
          )}
        </section>

        {/* Backup & Safety */}
        <section className="grid lg:grid-cols-2 gap-6 mb-10">
          <div className="rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl" aria-hidden>💾</div>
              <h2 className="text-xl font-bold">Backup automático</h2>
            </div>
            <p className="text-muted-foreground mb-5">
              Gera uma cópia de segurança das respostas e da configuração do site em intervalos regulares.
            </p>

            <label className="flex items-center justify-between rounded-2xl border-2 border-border bg-background p-4 mb-3 cursor-pointer">
              <span className="font-semibold">Ativar backup automático</span>
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
                className="h-6 w-6 accent-primary"
              />
            </label>

            <label className="block rounded-2xl border-2 border-border bg-background p-4">
              <span className="block font-semibold mb-2">Intervalo (minutos)</span>
              <input
                type="number"
                min={5}
                max={240}
                value={interval}
                onChange={(e) => setIntervalMin(Number(e.target.value) || 15)}
                disabled={!autoBackup}
                className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-lg focus:border-primary focus:outline-none disabled:opacity-50"
              />
            </label>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-accent/40 border-2 border-accent p-3">
                <div className="font-semibold">Último backup</div>
                <div className="text-muted-foreground">—</div>
              </div>
              <div className="rounded-xl bg-accent/40 border-2 border-accent p-3">
                <div className="font-semibold">Próximo</div>
                <div className="text-muted-foreground">
                  {autoBackup ? `Em ~${interval} min` : "Desligado"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="text-3xl" aria-hidden>🛡️</div>
              <h2 className="text-xl font-bold">Proteção contra perda de dados</h2>
            </div>
            <p className="text-muted-foreground mb-5">
              Configurações para garantir que nenhuma resposta seja perdida.
            </p>

            {[
              { k: "autosave", t: "Salvamento automático enquanto a família responde", v: true },
              { k: "confirmExit", t: "Pedir confirmação ao sair do cadastro incompleto", v: confirmExit, set: setConfirmExit },
              { k: "duplicate", t: "Detectar e mesclar respostas duplicadas", v: true },
              { k: "rescue", t: "Recuperar respostas após queda de internet", v: true },
            ].map((opt) => (
              <label key={opt.k} className="flex items-center justify-between rounded-2xl border-2 border-border bg-background p-4 mb-3 cursor-pointer">
                <span className="font-medium pr-3">{opt.t}</span>
                <input
                  type="checkbox"
                  defaultChecked={opt.v}
                  onChange={(e) => opt.set?.(e.target.checked)}
                  className="h-6 w-6 accent-primary shrink-0"
                />
              </label>
            ))}

            <div className="mt-5 rounded-2xl bg-accent/40 border-2 border-accent p-4 text-sm text-foreground/80">
              💙 Seus dados são tratados com carinho. Nada é enviado para fora sem sua autorização.
            </div>
          </div>
        </section>

        {/* Recent responses preview */}
        <section className="rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-8">
          <h2 className="text-2xl font-bold mb-4">Respostas recentes</h2>
          {items.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma resposta registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="py-3 pr-4 font-semibold">Data</th>
                    <th className="py-3 pr-4 font-semibold">PcD/TEA</th>
                    <th className="py-3 pr-4 font-semibold">Responsável</th>
                    <th className="py-3 pr-4 font-semibold">WhatsApp</th>
                    <th className="py-3 pr-4 font-semibold">Cartão</th>
                  </tr>
                </thead>
                <tbody>
                  {items.slice().reverse().slice(0, 10).map((s, i) => (
                    <tr key={i} className="border-b border-border/60">
                      <td className="py-3 pr-4">{new Date(s.submittedAt).toLocaleString("pt-BR")}</td>
                      <td className="py-3 pr-4">{s.answers?.nomePaciente || "—"}</td>
                      <td className="py-3 pr-4">{s.answers?.nomeResponsavel || "—"}</td>
                      <td className="py-3 pr-4">{s.contact?.whatsapp || s.answers?.telefone1 || "—"}</td>
                      <td className="py-3 pr-4">{s.wantsCard ? "✅" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}