import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface ThankYouProps {
  shareUrl?: string;
}

export function ThankYou({ shareUrl }: ThankYouProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareUrl) return;
    QRCode.toDataURL(shareUrl, {
      width: 320,
      margin: 2,
      color: { dark: "#0a2540", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [shareUrl]);

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const shareNative = async () => {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Meu Cartão Colo de Mãe",
          text: "Acesse meu Cartão Colo de Mãe",
          url: shareUrl,
        });
      } catch {}
    } else {
      copyLink();
    }
  };

  const downloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = "cartao-colo-de-mae-qrcode.png";
    a.click();
  };

  return (
    <main className="min-h-dvh bg-gradient-warm flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full rounded-3xl bg-card border-2 border-border shadow-soft p-8 sm:p-12 text-center animate-slide-up">
        <div className="text-6xl mb-4" aria-hidden="true">🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Parabéns! Seu Cartão está pronto 💙</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Obrigado por compartilhar sua história. Agora você faz parte da nossa rede de acolhimento.
          Use o QR Code abaixo para acessar e compartilhar seu Cartão Colo de Mãe.
        </p>

        {shareUrl && (
          <section
            className="mb-8 rounded-2xl bg-accent/40 border-2 border-accent p-6"
            aria-labelledby="qr-title"
          >
            <h2 id="qr-title" className="text-xl font-bold mb-2">📱 Seu QR Code exclusivo</h2>
            <p id="qr-instr" className="text-sm text-muted-foreground mb-4">
              Aponte a câmera do celular para o QR Code abaixo para abrir o resumo público do seu
              Cartão Colo de Mãe. Nenhuma palavra, frase ou código secreto é compartilhada.
            </p>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code que abre o link ${shareUrl} — resumo público do Cartão Colo de Mãe, sem dados secretos.`}
                aria-describedby="qr-instr"
                className="mx-auto rounded-xl bg-white p-3 shadow-soft"
                width={260}
                height={260}
              />
            ) : (
              <div
                role="status"
                aria-live="polite"
                aria-label="Gerando QR Code"
                className="mx-auto h-[260px] w-[260px] animate-pulse rounded-xl bg-muted"
              />
            )}

            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-card border-2 border-border px-3 py-2">
                <label htmlFor="share-link-input" className="sr-only">Link exclusivo do cartão</label>
                <input
                  id="share-link-input"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label={copied ? "Link copiado" : "Copiar link exclusivo do cartão"}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40 min-h-11"
                >
                  {copied ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  aria-label="Reenviar e copiar novamente o link do Cartão Colo de Mãe"
                  className="rounded-2xl border-2 border-primary/40 bg-card px-4 py-3 font-semibold hover:bg-primary/10 transition-colors min-h-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                >
                  🔁 Reenviar link
                </button>
                <button
                  type="button"
                  onClick={downloadQr}
                  aria-label="Baixar imagem do QR Code do cartão"
                  className="rounded-2xl border-2 border-border bg-card px-4 py-3 font-semibold hover:bg-muted transition-colors min-h-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                >
                  ⬇️ Baixar QR Code
                </button>
                <button
                  type="button"
                  onClick={shareNative}
                  aria-label="Compartilhar link do cartão por outros aplicativos"
                  className="rounded-2xl bg-gradient-primary px-4 py-3 font-bold text-primary-foreground shadow-soft hover:opacity-95 transition-all min-h-12 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
                >
                  📤 Compartilhar
                </button>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-3 text-left mb-8">
          {[
            { e: "🎁", t: "Solicitação do Cartão Colo de Mãe enviada" },
            { e: "📞", t: "Em breve entraremos em contato" },
            { e: "💬", t: "Você agora faz parte da nossa rede de acolhimento" },
          ].map((i) => (
            <div key={i.t} className="flex items-center gap-3 rounded-2xl bg-accent/50 border-2 border-accent px-5 py-4">
              <span className="text-2xl">{i.e}</span>
              <span className="font-medium">{i.t}</span>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-soft hover:opacity-95 transition-all min-h-14 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
        >
          Voltar ao início
        </button>
      </div>
    </main>
  );
}