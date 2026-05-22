export function ThankYou() {
  return (
    <main className="min-h-dvh bg-gradient-warm flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full rounded-3xl bg-card border-2 border-border shadow-soft p-8 sm:p-12 text-center animate-slide-up">
        <div className="text-6xl mb-4" aria-hidden>💙</div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">Cadastro concluído com sucesso!</h1>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
          Obrigado por compartilhar sua história conosco. Suas respostas vão ajudar sua família,
          outras famílias, melhorias futuras, novos projetos, benefícios, inclusão e políticas públicas.
        </p>

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