import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Hero } from "@/components/quiz/Hero";
import { Quiz } from "@/components/quiz/Quiz";
import { ThankYou } from "@/components/quiz/ThankYou";
import { FloatingHelp } from "@/components/quiz/FloatingHelp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cartão Colo de Mãe — Cadastro acolhedor PcD/TEA" },
      {
        name: "description",
        content:
          "Cadastro humanizado e acessível do Cartão Colo de Mãe para famílias PcD e TEA. Acolhimento, benefícios e apoio em poucos passos.",
      },
      { property: "og:title", content: "Cartão Colo de Mãe" },
      { property: "og:description", content: "Acolhimento, benefícios e apoio para famílias PcD e TEA." },
    ],
  }),
  component: Index,
});

function Index() {
  const [phase, setPhase] = useState<"hero" | "quiz" | "done">("hero");
  const [wantsCard, setWantsCard] = useState<boolean | null>(null);

  return (
    <>
      {phase === "hero" && (
        <Hero
          onChoose={(v) => {
            setWantsCard(v);
            setPhase("quiz");
          }}
        />
      )}
      {phase === "quiz" && <Quiz wantsCard={wantsCard} onFinish={() => setPhase("done")} />}
      {phase === "done" && <ThankYou />}
      <FloatingHelp />
    </>
  );
}
