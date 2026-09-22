export type Phase = "Identificar" | "Analizar" | "Diseñar" | "Ejecutar" | "Medir/Evidenciar"

export const PHASES: Phase[] = [
  "Identificar",
  "Analizar",
  "Diseñar",
  "Ejecutar",
  "Medir/Evidenciar",
]

export const RESPONSIBLES = [
  "Marilyn",
  "Gian",
  "Andres",
  "Ari",
  "Anghelo",
  "Kike",
  "Sofia",
] as const

export type Responsable = typeof RESPONSIBLES[number]

export const PHASE_META: Record<Phase, {
  bg: string
  text: string
  bar: string
  border: string
}> = {
  Identificar: {
    bg: "#DBEAFE",
    text: "#1D4ED8",
    bar: "#2563EB",
    border: "#93C5FD",
  },
  Analizar: {
    bg: "#EDE9FE",
    text: "#6D28D9",
    bar: "#7C3AED",
    border: "#C4B5FD",
  },
  Diseñar: {
    bg: "#D1FAE5",
    text: "#065F46",
    bar: "#059669",
    border: "#6EE7B7",
  },
  Ejecutar: {
    bg: "#FEF3C7",
    text: "#92400E",
    bar: "#D97706",
    border: "#FCD34D",
  },
  "Medir/Evidenciar": {
    bg: "#FEE2E2",
    text: "#991B1B",
    bar: "#DC2626",
    border: "#FCA5A5",
  },
}

export interface Activity {
  id: string
  name: string
  phase: Phase
  responsable: Responsable
  startDate: string
  endDate: string
}
