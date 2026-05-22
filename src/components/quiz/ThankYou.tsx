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
        <div className="text-6xl mb-4" aria-hidden>🎉</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Parabéns! Seu Cartão está pronto 💙</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Obrigado por compartilhar sua história. Agora você faz parte da nossa rede de acolhimento.
          Use o QR Code abaixo para acessar e compartilhar seu Cartão Colo de Mãe.
        </p>

        {shareUrl && (
          <div className="mb-8 rounded-2xl bg-accent/40 border-2 border-accent p-6">
            <h2 className="text-xl font-bold mb-2">📱 Seu QR Code exclusivo</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Aponte a câmera para acessar seu cadastro (sem palavra, frase ou código secreto).
            </p>
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code do Cartão Colo de Mãe"
                className="mx-auto rounded-xl bg-white p-3 shadow-soft"
                width={260}
                height={260}
              />
            ) : (
              <div className="mx-auto h-[260px] w-[260px] animate-pulse rounded-xl bg-muted" />
            )}

            <div className="mt-5 flex flex-col gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-card border-2 border-border px-3 py-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent text-sm text-foreground outline-none"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  {copied ? "✓ Copiado" : "📋 Copiar"}
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={downloadQr}
                  className="rounded-2xl border-2 border-border bg-card px-4 py-3 font-semibold hover:bg-muted transition-colors"
                >
                  ⬇️ Baixar QR Code
                </button>
                <button
                  type="button"
                  onClick={shareNative}
                  className="rounded-2xl bg-gradient-primary px-4 py-3 font-bold text-primary-foreground shadow-soft hover:opacity-95 transition-all"
                >
                  📤 Compartilhar cartão
                </button>
              </div>
            </div>
          </div>
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
          className="inline-flex items-center justify-center rounded-2xl bg-gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-soft hover:opacity-95 transition-all min-h-14"
        >
          Voltar ao início
        </button>
      </div>
    </main>
  );
}