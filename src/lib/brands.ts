export type BrandType = "cppem" | "colegio";

export interface BrandTokens {
  type: BrandType;
  name: string;
  logoUrl: string;
  bg: string;
  bgAlt: string;
  card: string;
  border: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  fontDisplayClass: string;
  fontBodyClass: string;
  tag: string;
}

export const BRANDS: Record<BrandType, BrandTokens> = {
  cppem: {
    type: "cppem",
    name: "CPPEM Concursos",
    logoUrl:
      "https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/LOGO%20CPPEM.png",
    bg: "#0A0A0A",
    bgAlt: "#111111",
    card: "#111111",
    border: "#1E1E1E",
    text: "#F5F5F5",
    textMuted: "#888888",
    primary: "#00E63C",
    primaryText: "#0A0A0A",
    accent: "#C9A84C",
    fontDisplayClass: "font-display",
    fontBodyClass: "font-sans",
    tag: "Preparatório Policial",
  },
  colegio: {
    type: "colegio",
    name: "Colégio CPPEM",
    logoUrl:
      "https://raw.githubusercontent.com/marketing942/fotos-dos-bots/main/LOGO%20COLE%CC%81GIO.png",
    bg: "#0D1B3E",
    bgAlt: "#162247",
    card: "#162247",
    border: "rgba(201,162,39,0.25)",
    text: "#FFFFFF",
    textMuted: "#8A9BB8",
    primary: "#C9A227",
    primaryText: "#0D1B3E",
    accent: "#E8C350",
    fontDisplayClass: "font-display",
    fontBodyClass: "font-sans",
    tag: "Fé. Disciplina. Estabilidade.",
  },
};

export function getBrand(type: BrandType | string | null | undefined): BrandTokens {
  if (type === "colegio") return BRANDS.colegio;
  return BRANDS.cppem;
}
