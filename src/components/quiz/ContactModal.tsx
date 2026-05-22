import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { email: string; whatsapp: string }) => void;
}

export function ContactModal({ open, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [err, setErr] = useState<string | null>(null);

  if (!open) return null;

  const submit = () => {
    if (!email.trim() || !whatsapp.trim()) {
      setErr("Por favor, preencha os dois campos para continuar.");
      return;
    }
    onSubmit({ email: email.trim(), whatsapp: whatsapp.trim() });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm px-4 animate-fade-in"
    >
      <div className="w-full max-w-lg rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-8 animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3" aria-hidden>💌</div>
          <h2 id="contact-title" className="text-2xl sm:text-3xl font-bold mb-2">
            Que bom ter você com a gente!
          </h2>
          <p className="text-muted-foreground">
            Para enviar seu Cartão Colo de Mãe, precisamos do seu melhor contato.
          </p>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="best-email" className="block text-lg font-semibold">
              📧 Melhor e-mail
            </label>
            <input
              id="best-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErr(null); }}
              className="w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="best-wpp" className="block text-lg font-semibold">
              📱 Melhor WhatsApp
            </label>
            <input
              id="best-wpp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(11) 9 9999-9999"
              value={whatsapp}
              onChange={(e) => { setWhatsapp(e.target.value); setErr(null); }}
              className="w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          {err && (
            <p role="alert" className="rounded-xl bg-destructive/10 border-2 border-destructive/30 px-4 py-3 text-destructive font-medium">
              {err}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
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
            className="rounded-2xl bg-gradient-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-soft hover:opacity-95 active:scale-[0.98] transition-all min-h-14"
          >
            Continuar 💙
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          🔒 Seus dados são tratados com carinho e segurança.
        </p>
      </div>
    </div>
  );
}