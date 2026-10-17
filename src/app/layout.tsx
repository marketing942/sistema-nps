import type { Metadata } from "next";
import { Inter, Oxanium, Rajdhani, Cinzel, DM_Sans } from "next/font/google";
import "./globals.css";

// CPPEM — tipografia da nova identidade (igual à Central de Ajuda)
const inter = Inter({ variable: "--font-body", subsets: ["latin"] });
const oxanium = Oxanium({ variable: "--font-display", subsets: ["latin"] });
const rajdhani = Rajdhani({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});
// Colégio CPPEM — tipografia original preservada
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "CPPEM · Central de Satisfação",
  description:
    "Sistema interno de NPS e CSAT do CPPEM Concursos e do Colégio CPPEM.",
};

const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('cppem-theme');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    if (t === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${oxanium.variable} ${rajdhani.variable} ${cinzel.variable} ${dmSans.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
