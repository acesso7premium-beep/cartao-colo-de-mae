interface Props {
  onChoose: (wantsCard: boolean) => void;
  onAcceptCard?: () => void;
}

const beneficios = [
  { emoji: "🎁", label: "Brindes" },
  { emoji: "💳", label: "Cartão gratuito" },
  { emoji: "🛍️", label: "Descontos especiais" },
  { emoji: "🩺", label: "Benefícios futuros" },
  { emoji: "🤝", label: "Apoio à família" },
  { emoji: "🎉", label: "Surpresas exclusivas" },
  { emoji: "📢", label: "Informações importantes" },
  { emoji: "🧩", label: "Rede de acolhimento" },
];

export function Hero({ onChoose, onAcceptCard }: Props) {
  return (
    <main className="relative min-h-dvh bg-gradient-warm overflow-hidden">
      {/* Floating bubbles — TEA Festival vibe */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        <span className="tea-bubble animate-float" style={{ width: 220, height: 220, top: "8%", left: "12%", background: "rgba(56,189,248,0.18)" }} />
        <span className="tea-bubble animate-float" style={{ width: 340, height: 340, top: "30%", right: "-60px", background: "rgba(29,78,216,0.30)", animationDelay: "1.5s" }} />
        <span className="tea-bubble animate-float" style={{ width: 180, height: 180, bottom: "10%", left: "20%", background: "rgba(42,157,143,0.22)", animationDelay: "3s" }} />
        <span className="tea-bubble animate-float" style={{ width: 120, height: 120, top: "55%", left: "48%", background: "rgba(255,210,63,0.18)", animationDelay: "2s" }} />
        <span className="tea-bubble animate-float" style={{ width: 260, height: 260, bottom: "-40px", right: "18%", background: "rgba(244,162,97,0.18)", animationDelay: "4s" }} />
      </div>

      <section className="relative mx-auto max-w-5xl px-4 py-14 sm:py-24">
        <div className="text-center animate-fade-in">
          <div
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8 text-sm font-bold shadow-soft"
            style={{ background: "rgba(42,157,143,0.18)", color: "#FFD23F", border: "1px solid rgba(255,210,63,0.35)" }}
          >
            🧩 Abril Azul — Conscientização do Autismo
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold mb-6 leading-[1.05] tracking-tight">
            <span className="block text-white mb-2">Cartão</span>
            <span className="inline-flex flex-wrap justify-center gap-x-4">
              <span style={{ color: "var(--tea-red)" }}>Colo</span>
              <span style={{ color: "var(--tea-orange)" }}>de</span>
              <span style={{ color: "var(--tea-green)" }}>Mãe</span>
            </span>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground/90 max-w-2xl mx-auto mb-2">
            Acolhimento, inclusão e protagonismo para famílias atípicas.
          </p>
          <p className="text-lg sm:text-xl text-foreground/95 max-w-2xl mx-auto leading-relaxed mt-6">
            <strong className="text-foreground">Você não está sozinho(a).</strong>
            <br />
            Este cadastro vai nos ajudar a buscar benefícios, descontos, apoio, terapias,
            inclusão e acolhimento para sua família.
          </p>

          {/* Festival-style pill buttons row */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <span className="rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-soft" style={{ background: "var(--tea-green)" }}>
              Associação Colo de Mãe
            </span>
            <span className="rounded-full px-5 py-2.5 text-sm font-bold shadow-soft" style={{ background: "var(--tea-yellow)", color: "#1a2a4a" }}>
              Cadastro Oficial
            </span>
            <span className="rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-soft" style={{ background: "var(--tea-blue)" }}>
              Movimento PcD
            </span>
          </div>
        </div>

        {/* Benefícios */}
        <div className="mt-16">
          <h2 className="text-center text-2xl sm:text-3xl font-bold mb-8 text-white">O que o cartão oferece</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {beneficios.map((b) => (
              <div
                key={b.label}
                className="rounded-2xl bg-card/70 backdrop-blur border border-border p-5 text-center shadow-soft hover:scale-[1.03] hover:border-[color:var(--tea-yellow)] transition-all animate-slide-up"
              >
                <div className="text-4xl mb-2" aria-hidden>{b.emoji}</div>
                <div className="font-semibold text-sm sm:text-base text-foreground">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-3xl bg-card/80 backdrop-blur border border-border shadow-soft p-6 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-snug text-white">
            Você aceita receber gratuitamente
            <br />
            <span style={{ color: "var(--tea-yellow)" }}>o Cartão Colo de Mãe?</span>
          </h2>
          <p className="text-muted-foreground mb-8">
            Sua resposta não impede a continuação do cadastro. Você pode seguir mesmo se quiser pensar depois.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => (onAcceptCard ? onAcceptCard() : onChoose(true))}
              className="rounded-full px-6 py-5 text-lg font-extrabold shadow-soft hover:scale-[1.02] active:scale-[0.98] transition-all min-h-16"
              style={{ background: "var(--tea-yellow)", color: "#1a2a4a" }}
            >
              ✅ Sim, quero meu cartão
            </button>
            <button
              type="button"
              onClick={() => onChoose(false)}
              className="rounded-full border-2 border-border bg-transparent px-6 py-5 text-lg font-bold text-foreground hover:bg-muted active:scale-[0.98] transition-all min-h-16"
            >
              ❌ Agora não
            </button>
          </div>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          💙 Feito com carinho para famílias PcD e TEA
        </p>
      </section>
    </main>
  );
}