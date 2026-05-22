import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/cartao/$token")({
  head: () => ({
    meta: [
      { title: "Meu Cartão Colo de Mãe" },
      { name: "description", content: "Resumo público do Cartão Colo de Mãe — sem dados secretos." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CartaoPublico,
});

type Submission = {
  wantsCard: boolean | null;
  contact: { email: string; whatsapp: string } | null;
  credentials?: { word?: string; phrase?: string; code?: string; shareUrl?: string } | null;
  answers: Record<string, any>;
  submittedAt: string;
};

// Chaves que NUNCA devem aparecer publicamente
const FORBIDDEN = new Set(["word", "phrase", "code", "palavra", "frase", "codigo", "código"]);

// Apenas estes campos do answers são exibidos publicamente
const PUBLIC_FIELDS: { key: string; label: string }[] = [
  { key: "nomePaciente", label: "Beneficiário(a)" },
  { key: "nomeResponsavel", label: "Responsável" },
  { key: "cidade", label: "Cidade" },
  { key: "estado", label: "Estado" },
  { key: "diagnostico", label: "Diagnóstico" },
  { key: "tipoDeficiencia", label: "Tipo de apoio" },
];

function sanitizeAnswers(a: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const { key } of PUBLIC_FIELDS) {
    if (FORBIDDEN.has(key)) continue;
    if (a[key] !== undefined && a[key] !== "") out[key] = a[key];
  }
  return out;
}

function CartaoPublico() {
  const { token } = Route.useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("colo-de-mae-respostas");
      const all: Submission[] = raw ? JSON.parse(raw) : [];
      const found = all.find((s) => (s.credentials?.shareUrl || "").endsWith(`/cartao/${token}`));
      setSubmission(found ?? null);
    } catch {
      setSubmission(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const safeAnswers = useMemo(
    () => (submission ? sanitizeAnswers(submission.answers || {}) : {}),
    [submission]
  );

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/cartao/${token}` : `/cartao/${token}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <main className="min-h-dvh bg-gradient-warm px-4 py-12">
      <article className="mx-auto max-w-2xl rounded-3xl bg-card border-2 border-border shadow-soft p-8 sm:p-10 animate-slide-up">
        <header className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-foreground mb-3">
            💙 Cartão Colo de Mãe
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">Resumo público do cartão</h1>
          <p className="text-muted-foreground mt-2">
            Esta página exibe apenas informações públicas. Palavra, frase e código secretos
            <strong> nunca</strong> aparecem aqui.
          </p>
        </header>

        {loading ? (
          <p className="text-center text-muted-foreground py-10" aria-live="polite">Carregando…</p>
        ) : !submission ? (
          <div className="rounded-2xl bg-accent/30 border-2 border-accent p-6 text-center">
            <div className="text-4xl mb-2" aria-hidden>🔎</div>
            <h2 className="text-xl font-bold mb-2">Cartão não encontrado neste dispositivo</h2>
            <p className="text-muted-foreground">
              Os dados ficam salvos no navegador em que o cadastro foi feito. Abra este link no mesmo
              dispositivo para visualizar o resumo.
            </p>
            <Link
              to="/"
              className="mt-5 inline-flex rounded-2xl bg-gradient-primary px-6 py-3 font-bold text-primary-foreground shadow-soft"
            >
              Voltar ao início
            </Link>
          </div>
        ) : (
          <>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 mb-6">
              <div className="rounded-xl bg-muted/40 p-3">
                <dt className="text-xs font-semibold text-muted-foreground uppercase">Cadastrado em</dt>
                <dd className="font-medium">{new Date(submission.submittedAt).toLocaleString("pt-BR")}</dd>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <dt className="text-xs font-semibold text-muted-foreground uppercase">Cartão solicitado</dt>
                <dd className="font-medium">{submission.wantsCard ? "Sim 💙" : "Não"}</dd>
              </div>
              {PUBLIC_FIELDS.map(({ key, label }) =>
                safeAnswers[key] ? (
                  <div key={key} className="rounded-xl bg-muted/40 p-3 sm:col-span-2">
                    <dt className="text-xs font-semibold text-muted-foreground uppercase">{label}</dt>
                    <dd className="font-medium break-words">
                      {Array.isArray(safeAnswers[key]) ? safeAnswers[key].join(", ") : String(safeAnswers[key])}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>

            <div className="rounded-2xl bg-primary/5 border-2 border-primary/30 p-4">
              <div className="text-sm font-semibold mb-2">🔗 Link exclusivo</div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  aria-label="Link exclusivo do cartão"
                  className="flex-1 rounded-xl border-2 border-border bg-card px-3 py-2 text-sm font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {copied ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>
            </div>

            <p className="mt-6 text-xs text-center text-muted-foreground">
              🛡️ Por segurança, nenhuma palavra, frase ou código secreto é exibida nesta página pública.
            </p>
          </>
        )}
      </article>
    </main>
  );
}
