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
    logoUrl: "/brand/logo-cppem.png",
    bg: "#0A0A0B",
    bgAlt: "#111115",
    card: "#18181E",
    border: "rgba(175,146,86,0.18)",
    text: "#E8E4D9",
    textMuted: "#87847A",
    primary: "#AF9256",
    primaryText: "#16130C",
    accent: "#C9AE7A",
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
