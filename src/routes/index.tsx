import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Hero } from "@/components/quiz/Hero";
import { Quiz } from "@/components/quiz/Quiz";
import { ThankYou } from "@/components/quiz/ThankYou";
import { FloatingHelp } from "@/components/quiz/FloatingHelp";
import { ContactModal } from "@/components/quiz/ContactModal";
import { SecurityModal } from "@/components/quiz/SecurityModal";

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
  const [showContact, setShowContact] = useState(false);
  const [contact, setContact] = useState<{ email: string; whatsapp: string } | null>(null);
  const [showSecurity, setShowSecurity] = useState(false);
  const [credentials, setCredentials] = useState<{ word: string; phrase: string; code: string; shareUrl: string } | null>(null);

  return (
    <>
      {phase === "hero" && (
        <Hero
          onAcceptCard={() => setShowContact(true)}
          onChoose={(v) => {
            setWantsCard(v);
            setPhase("quiz");
          }}
        />
      )}
      {phase === "quiz" && (
        <Quiz wantsCard={wantsCard} contact={contact} credentials={credentials} onFinish={() => setPhase("done")} />
      )}
      {phase === "done" && <ThankYou />}
      <FloatingHelp />
      <ContactModal
        open={showContact}
        onClose={() => setShowContact(false)}
        onSubmit={(data) => {
          setContact(data);
          setWantsCard(true);
          setShowContact(false);
          setShowSecurity(true);
        }}
      />
      <SecurityModal
        open={showSecurity}
        onClose={() => setShowSecurity(false)}
        onSubmit={(data) => {
          setCredentials(data);
          setShowSecurity(false);
          setPhase("quiz");
        }}
      />
    </>
  );
}
