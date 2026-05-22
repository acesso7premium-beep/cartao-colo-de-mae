export function FloatingHelp() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      <a
        href="https://wa.me/5500000000000?text=Olá,%20preciso%20de%20ajuda%20com%20o%20cadastro%20Colo%20de%20Mãe"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar no WhatsApp"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-soft text-2xl hover:scale-110 transition-transform"
      >
        💬
      </a>
      <button
        type="button"
        onClick={() =>
          alert(
            "💙 Estamos aqui para ajudar!\n\nSe tiver qualquer dúvida no cadastro, fale com a gente pelo WhatsApp. Você também pode fechar a página e continuar depois — suas respostas ficam salvas."
          )
        }
        aria-label="Preciso de ajuda"
        className="flex items-center gap-2 rounded-full bg-card border-2 border-primary px-4 py-3 text-sm font-bold text-primary shadow-soft hover:bg-accent transition-colors min-h-12"
      >
        🆘 Preciso de ajuda
      </button>
    </div>
  );
}