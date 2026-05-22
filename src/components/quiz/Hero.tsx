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
    <main className="min-h-dvh bg-gradient-warm">
      <section className="mx-auto max-w-4xl px-4 py-12 sm:py-20">
        <div className="text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 mb-6 text-sm font-bold text-primary-foreground shadow-soft">
            💙 Cartão Colo de Mãe
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Bem-vindo(a) ao <span className="bg-gradient-primary bg-clip-text text-transparent">Cartão Colo de Mãe</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            <strong className="text-foreground">Você não está sozinho(a).</strong>
            <br />
            Este cadastro vai nos ajudar a entender melhor suas necessidades para buscarmos benefícios,
            descontos, apoio, terapias, inclusão e acolhimento para sua família.
          </p>
          <p className="mt-6 text-base text-muted-foreground max-w-2xl mx-auto">
            Cada resposta é muito importante — mesmo que o questionário tenha várias perguntas,
            elas podem fazer toda a diferença no futuro da sua família e de milhares de outras.
          </p>
        </div>

        {/* Benefícios */}
        <div className="mt-14">
          <h2 className="text-center text-2xl font-bold mb-6">O que o cartão oferece</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {beneficios.map((b) => (
              <div
                key={b.label}
                className="rounded-2xl bg-card border-2 border-border p-5 text-center shadow-soft hover:scale-[1.02] transition-transform animate-slide-up"
              >
                <div className="text-4xl mb-2" aria-hidden>{b.emoji}</div>
                <div className="font-semibold text-sm sm:text-base">{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-3xl bg-card border-2 border-border shadow-soft p-6 sm:p-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-snug">
            Você aceita receber gratuitamente
            <br />
            o Cartão Colo de Mãe?
          </h2>
          <p className="text-muted-foreground mb-8">
            Sua resposta não impede a continuação do cadastro. Você pode seguir mesmo se quiser pensar depois.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto">
            <button
              type="button"
              onClick={() => (onAcceptCard ? onAcceptCard() : onChoose(true))}
              className="rounded-2xl bg-gradient-primary px-6 py-5 text-lg font-bold text-primary-foreground shadow-soft hover:opacity-95 active:scale-[0.98] transition-all min-h-16"
            >
              ✅ Sim, quero meu cartão
            </button>
            <button
              type="button"
              onClick={() => onChoose(false)}
              className="rounded-2xl border-2 border-border bg-card px-6 py-5 text-lg font-bold text-foreground hover:bg-muted active:scale-[0.98] transition-all min-h-16"
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