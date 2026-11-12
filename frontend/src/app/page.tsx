import type { Metadata } from "next";

import { HomeWorkspace } from "@/components/home/HomeWorkspace";

import styles from "./page.module.css";

const SITE_URL = "https://receitando.miguelpita.com.br";
const PAGE_TITLE = "Receitando | Receitas fáceis com o que você tem em casa";
const PAGE_DESCRIPTION = "Descubra receitas fáceis e deliciosas para o dia a dia. Encontre o que cozinhar com os ingredientes que você já tem, aproveite melhor os alimentos e experimente novas ideias.";

export const metadata: Metadata = {
  title: { absolute: PAGE_TITLE },
  description: PAGE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: SITE_URL,
    type: "website",
    locale: "pt_BR",
    siteName: "Receitando",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: "Receitando",
  url: SITE_URL,
  description: PAGE_DESCRIPTION,
  inLanguage: "pt-BR",
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <HomeWorkspace />
    </div>
  );
}
