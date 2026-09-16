import { useState, useCallback } from "react";
import { Activity, Phase } from "../types";

const uid = () => Math.random().toString(36).slice(2, 9);

const SAMPLE: Activity[] = [
  { id: uid(), name: "Levantamiento de información",  phase: "Identificar",      startDate: "2025-01-06", endDate: "2025-01-17" },
  { id: uid(), name: "Análisis de procesos actuales", phase: "Analizar",         startDate: "2025-01-20", endDate: "2025-02-07" },
  { id: uid(), name: "Entrevistas con stakeholders",  phase: "Analizar",         startDate: "2025-01-27", endDate: "2025-02-14" },
  { id: uid(), name: "Diseño de propuesta de mejora", phase: "Diseñar",          startDate: "2025-02-10", endDate: "2025-02-28" },
  { id: uid(), name: "Validación del diseño",         phase: "Diseñar",          startDate: "2025-03-03", endDate: "2025-03-14" },
  { id: uid(), name: "Implementación piloto",         phase: "Ejecutar",         startDate: "2025-03-17", endDate: "2025-04-11" },
  { id: uid(), name: "Validación y métricas",         phase: "Medir/Evidenciar", startDate: "2025-04-14", endDate: "2025-04-30" },
];

const VALID_PHASES: Phase[] = [
  "Identificar", "Analizar", "Diseñar", "Ejecutar", "Medir/Evidenciar",
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function offsetStr(days: number) {
  return new Date(Date.now() + days * 86_400_000).toISOString().split("T")[0];
}

// Normalize multiple date formats to YYYY-MM-DD
function normalizeDate(raw: string): string {
  const s = raw.trim();
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // DD/MM/YYYY  (Chilean standard)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  // DD-MM-YYYY
  const dmyDash = s.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dmyDash) return `${dmyDash[3]}-${dmyDash[2].padStart(2, "0")}-${dmyDash[1].padStart(2, "0")}`;
  return s;
}

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>(SAMPLE);

  const addActivity = useCallback(() => {
    setActivities((prev) => [
      ...prev,
      {
        id: uid(),
        name: "Nueva actividad",
        phase: "Identificar",
        startDate: todayStr(),
        endDate: offsetStr(7),
      },
    ]);
  }, []);

  const updateActivity = useCallback(
    (id: string, patch: Partial<Omit<Activity, "id">>) => {
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...patch } : a))
      );
    },
    []
  );

  const deleteActivity = useCallback((id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const clearAll = useCallback(() => setActivities([]), []);

  // Returns number of imported rows (0 = nothing valid found)
  const importCSV = useCallback((text: string): number => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return 0;

    const firstLower = lines[0].toLowerCase();
    const dataStart =
      firstLower.includes("actividad") || firstLower.includes("fase") ? 1 : 0;

    const imported: Activity[] = [];
    for (let i = dataStart; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted fields with commas inside (basic RFC 4180)
      const cols = line
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map((c) => c.trim().replace(/^"|"$/g, ""));

      if (cols.length < 4) continue;
      const [name, rawPhase, rawStart, rawEnd] = cols;
      if (!name || !rawStart || !rawEnd) continue;

      const startDate = normalizeDate(rawStart);
      const endDate = normalizeDate(rawEnd);
      const phase = VALID_PHASES.find((p) => p === rawPhase) ?? "Identificar";

      imported.push({ id: uid(), name, phase, startDate, endDate });
    }

    if (imported.length > 0) setActivities(imported);
    return imported.length;
  }, []);

  const downloadTemplate = useCallback(() => {
    const rows = [
      "Actividad,Fase,Inicio,Fin",
      "Levantamiento de información,Identificar,2025-01-06,2025-01-17",
      "Análisis de procesos actuales,Analizar,2025-01-20,2025-02-07",
      "Diseño de propuesta de mejora,Diseñar,2025-02-10,2025-02-28",
      "Implementación piloto,Ejecutar,2025-03-17,2025-04-11",
      "Validación y métricas,Medir/Evidenciar,2025-04-14,2025-04-30",
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_gantt.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    clearAll,
    importCSV,
    downloadTemplate,
  };
}
