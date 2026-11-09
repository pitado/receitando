import type { Metadata } from "next";
import Link from "next/link";

const base = "https://receitando.miguelpita.com.br";

export const metadata: Metadata = {
  title: "Sobre o criador — Miguel Pita",
  description: "Conheça Miguel Pita, desenvolvedor de Maringá (PR) e integrante do projeto acadêmico Receitando, uma plataforma para descobrir receitas e aproveitar melhor os ingredientes.",
  alternates: { canonical: `${base}/sobre` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Miguel Pita | Sobre o Receitando",
    description: "Conheça o desenvolvedor por trás do Receitando e a proposta do projeto.",
    url: `${base}/sobre`,
    type: "profile",
  },
};

export default function SobrePage() {
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Miguel Pita",
    url: `${base}/sobre`,
    sameAs: ["https://github.com/pitado"],
    jobTitle: "Desenvolvedor de software",
    homeLocation: { "@type": "Place", name: "Maringá, Paraná, Brasil" },
    knowsAbout: ["Desenvolvimento web", "Next.js", "React", "TypeScript"],
  };
  return (
    <div className="container page-shell" style={{ maxWidth: 850, paddingBlock: "clamp(3rem, 8vw, 6rem)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\\u003c") }} />
      <p style={{ letterSpacing: ".12em", textTransform: "uppercase", fontSize: ".8rem" }}>Quem está por trás do projeto</p>
      <h1 style={{ fontSize: "clamp(2.4rem, 7vw, 4.5rem)", lineHeight: 1.1, marginBlock: "1rem 1.5rem" }}>Prazer, sou Miguel Pita.</h1>
      <p style={{ fontSize: "1.2rem", lineHeight: 1.75 }}>Sou desenvolvedor de software, moro em Maringá, no Paraná, e estudo Análise e Desenvolvimento de Sistemas. Gosto de transformar ideias em experiências digitais úteis, acessíveis e fáceis de usar.</p>
      <h2 style={{ marginTop: "2.5rem" }}>Como nasceu o Receitando</h2>
      <p style={{ lineHeight: 1.8 }}>O Receitando é um projeto acadêmico desenvolvido em equipe, com o propósito de ajudar pessoas a descobrir receitas, aproveitar ingredientes que já têm em casa e reduzir o desperdício de alimentos. Participo do desenvolvimento da plataforma, trabalhando com tecnologias como Next.js, React, TypeScript e serviços em nuvem.</p>
      <h2 style={{ marginTop: "2.5rem" }}>Mais sobre meu trabalho</h2>
      <p style={{ lineHeight: 1.8 }}>Tenho interesse em desenvolvimento web, arquitetura de sistemas e soluções que resolvem problemas reais. Você pode acompanhar meu trabalho e meus projetos no <a href="https://github.com/pitado" target="_blank" rel="noopener noreferrer">GitHub</a>.</p>
      <p style={{ marginTop: "2rem" }}><Link href="/receitas">Conhecer as receitas do Receitando →</Link></p>
    </div>
  );
}
