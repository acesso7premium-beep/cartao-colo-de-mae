import { useMemo, useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { word: string; phrase: string; code: string }) => void;
}

const WORDS = [
  "carinho", "abraço", "ninho", "afeto", "colo", "ternura", "luz",
  "estrela", "girassol", "doçura", "esperança", "sorriso", "abrigo",
  "florescer", "primavera", "céu", "lua", "amor", "raiz", "mel",
];

const PHRASES = [
  "afeto que floresce em cada sorriso",
  "colo seguro para crescer com amor",
  "luz que acolhe pequenos passos",
  "ninho quente onde o coração descansa",
  "ternura que transforma o caminho",
  "abrigo de carinho em todo dia",
  "mãos que cuidam com paciência",
  "abraço que cura silêncios",
  "estrela guia da família inteira",
  "raiz forte de amor verdadeiro",
];

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function genCode() {
  let s = "";
  for (let i = 0; i < 5; i++) s += CHARS[Math.floor(Math.random() * CHARS.length)];
  return s;
}

export function SecurityModal({ open, onClose, onSubmit }: Props) {
  const [word, setWord] = useState(() => pick(WORDS));
  const [phrase, setPhrase] = useState(() => pick(PHRASES));
  const [code, setCode] = useState(() => genCode());
  const [saved, setSaved] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const [shareToken] = useState(() => {
    const a = Math.random().toString(36).slice(2, 8);
    const b = Math.random().toString(36).slice(2, 8);
    return `${a}${b}`;
  });

  const shareUrl = useMemo(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://cartao-colo-de-mae.lovable.app";
    return `${origin}/cartao/${shareToken}`;
  }, [shareToken]);

  const fileContent = useMemo(
    () =>
      `Cartão Colo de Mãe — Credenciais de Segurança\n` +
      `Gerado em: ${new Date().toLocaleString("pt-BR")}\n\n` +
      `Palavra secreta: ${word}\n` +
      `Frase secreta: ${phrase}\n` +
      `Código único: ${code}\n\n` +
      `Link exclusivo do seu cartão:\n${shareUrl}\n\n` +
      `⚠️ Guarde estas informações em local seguro. Elas servirão para recuperar e proteger o acesso ao seu Cartão Colo de Mãe.\n`,
    [word, phrase, code, shareUrl]
  );

  if (!open) return null;

  const handleSave = () => {
    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `colo-de-mae-credenciais-${code}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaved(true);
    setErr(null);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const shareLink = async () => {
    const shareData = {
      title: "Meu Cartão Colo de Mãe",
      text: "Esse é o meu link exclusivo do Cartão Colo de Mãe 💙",
      url: shareUrl,
    };
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share(shareData);
        return;
      } catch {}
    }
    copyLink();
  };

  const submit = () => {
    if (!saved) {
      setErr("Você precisa salvar suas credenciais antes de continuar.");
      return;
    }
    if (!acknowledged) {
      setErr("Marque que você anotou seu código em um lugar seguro.");
      return;
    }
    onSubmit({ word, phrase, code });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sec-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm px-4 py-6 overflow-y-auto animate-fade-in"
    >
      <div className="w-full max-w-xl rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-8 animate-slide-up my-auto">
        <div className="text-center mb-5">
          <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-accent text-2xl" aria-hidden>
            🛡️
          </div>
          <h2 id="sec-title" className="text-2xl sm:text-3xl font-bold mb-2">
            Proteja seu cadastro 🔐
          </h2>
          <p className="text-muted-foreground">
            Crie suas chaves secretas. Elas servirão para recuperar e proteger o acesso ao seu Cartão Colo de Mãe.
          </p>
        </div>

        <p className="mb-5 rounded-2xl border-2 border-accent/50 bg-accent/10 px-4 py-3 text-center text-sm text-foreground/80">
          Geramos credenciais aleatórias para você. Você pode gerar novas quantas vezes quiser e depois{" "}
          <strong>salvar</strong> em local seguro.
        </p>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="sec-word" className="flex items-center gap-2 text-base font-semibold">
              🔑 Palavra secreta
            </label>
            <div className="flex gap-2">
              <input
                id="sec-word"
                readOnly
                value={word}
                className="flex-1 rounded-2xl border-2 border-border bg-muted/30 px-5 py-3 text-lg font-mono"
              />
              <button
                type="button"
                onClick={() => { setWord(pick(WORDS)); setSaved(false); }}
                aria-label="Gerar nova palavra"
                className="rounded-2xl border-2 border-border bg-card px-4 hover:bg-muted transition-colors"
              >
                🔄
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="sec-phrase" className="flex items-center gap-2 text-base font-semibold">
              🔒 Frase secreta
            </label>
            <div className="flex gap-2">
              <input
                id="sec-phrase"
                readOnly
                value={phrase}
                className="flex-1 rounded-2xl border-2 border-border bg-muted/30 px-5 py-3 text-base font-mono"
              />
              <button
                type="button"
                onClick={() => { setPhrase(pick(PHRASES)); setSaved(false); }}
                aria-label="Gerar nova frase"
                className="rounded-2xl border-2 border-border bg-card px-4 hover:bg-muted transition-colors"
              >
                🔄
              </button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-accent/60 bg-accent/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              🛡️ Código único de segurança
            </div>
            <p className="text-sm text-muted-foreground">
              Anote este código em local seguro. Ele tem 5 caracteres (letras maiúsculas e números) e não poderá ser recuperado depois.
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 text-center text-2xl sm:text-3xl font-bold tracking-[0.4em] text-accent font-mono">
                {code.split("").join(" ")}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyCode}
                  aria-label="Copiar código"
                  className="rounded-xl border-2 border-border bg-card px-3 py-2 hover:bg-muted transition-colors"
                >
                  📋
                </button>
                <button
                  type="button"
                  onClick={() => { setCode(genCode()); setSaved(false); }}
                  aria-label="Gerar novo código"
                  className="rounded-xl border-2 border-border bg-card px-3 py-2 hover:bg-muted transition-colors"
                >
                  🔄
                </button>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => { setAcknowledged(e.target.checked); setErr(null); }}
                className="h-5 w-5 rounded border-2 border-border accent-accent"
              />
              Já anotei meu código em um lugar seguro.
            </label>
          </div>

          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              🔗 Seu link exclusivo do Cartão
            </div>
            <p className="text-sm text-muted-foreground">
              Use este link para acessar e compartilhar seu Cartão Colo de Mãe. Ele é único e pessoal — guarde com carinho.
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={shareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 rounded-2xl border-2 border-border bg-muted/30 px-4 py-3 text-sm font-mono truncate"
                aria-label="Link exclusivo do cartão"
              />
              <button
                type="button"
                onClick={copyLink}
                aria-label="Copiar link"
                className="rounded-2xl border-2 border-border bg-card px-4 hover:bg-muted transition-colors"
              >
                {copiedLink ? "✅" : "📋"}
              </button>
            </div>
            <button
              type="button"
              onClick={shareLink}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-primary/50 bg-card px-6 py-3 text-base font-bold text-foreground hover:bg-primary/10 transition-colors min-h-12"
            >
              📤 Compartilhar meu cartão
            </button>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 px-6 py-4 text-base font-bold transition-all min-h-14 ${
              saved
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-card hover:bg-muted text-foreground"
            }`}
          >
            {saved ? "✅ Credenciais salvas" : "⬇️ Salvar credenciais (obrigatório)"}
          </button>

          {err && (
            <p role="alert" className="rounded-xl bg-destructive/10 border-2 border-destructive/30 px-4 py-3 text-destructive font-medium">
              {err}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border-2 border-border bg-card px-6 py-4 text-lg font-semibold hover:bg-muted transition-colors min-h-14"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!saved || !acknowledged}
            className="rounded-2xl bg-gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-soft hover:opacity-95 active:scale-[0.98] transition-all min-h-14 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continuar para o cadastro →
          </button>
        </div>
      </div>
    </div>
  );
}