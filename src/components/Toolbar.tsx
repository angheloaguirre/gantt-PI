import { useRef, useState, useEffect } from "react";
import { PHASE_META, PHASES } from "../types";

interface Props {
  activityCount: number;
  onAdd: () => void;
  onImportCSV: (text: string) => number;
  onDownloadTemplate: () => void;
  onExportPDF: () => void;
  onClearAll: () => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
}

type ImportStatus = { ok: true; count: number } | { ok: false };

export default function Toolbar({
  activityCount,
  onAdd,
  onImportCSV,
  onDownloadTemplate,
  onExportPDF,
  onClearAll,
  projectName,
  onProjectNameChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  // Auto-clear import feedback after 4 s
  useEffect(() => {
    if (!importStatus) return;
    const t = setTimeout(() => setImportStatus(null), 4000);
    return () => clearTimeout(t);
  }, [importStatus]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const count = onImportCSV(text);
      setImportStatus(count > 0 ? { ok: true, count } : { ok: false });
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  function handleClearAll() {
    if (activityCount === 0) return;
    if (window.confirm(`¿Eliminar las ${activityCount} actividades? Esta acción no se puede deshacer.`)) {
      onClearAll();
    }
  }

  return (
    <header
      className="no-print flex items-center gap-3 px-5 border-b-2 border-black shrink-0"
      style={{ height: 56, backgroundColor: "#fff" }}
    >
      {/* Logo mark */}
      <div
        className="shrink-0 w-7 h-7 flex items-center justify-center rounded-sm"
        style={{ backgroundColor: "#E84C10" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1" y="3"   width="5" height="2" rx="0.5" fill="white" />
          <rect x="1" y="6.5" width="9" height="2" rx="0.5" fill="white" />
          <rect x="1" y="10"  width="7" height="2" rx="0.5" fill="white" />
        </svg>
      </div>

      {/* Project name */}
      <input
        className="font-mono text-sm font-bold uppercase tracking-wider text-black bg-transparent outline-none border-b border-transparent hover:border-gray-300 focus:border-black transition-colors min-w-0"
        style={{ maxWidth: 240 }}
        value={projectName}
        onChange={(e) => onProjectNameChange(e.target.value)}
        placeholder="Nombre del proyecto"
      />

      <div className="text-gray-200 font-mono text-xs hidden md:block">|</div>

      {/* Phase legend */}
      <div className="hidden xl:flex items-center gap-1.5">
        {PHASES.map((p) => {
          const m = PHASE_META[p];
          return (
            <span
              key={p}
              className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded-sm whitespace-nowrap"
              style={{ backgroundColor: m.bg, color: m.text }}
            >
              {p}
            </span>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Import feedback */}
      {importStatus && (
        <span
          className={`font-mono text-xs whitespace-nowrap ${
            importStatus.ok ? "text-green-600" : "text-red-500"
          }`}
        >
          {importStatus.ok
            ? `✓ ${importStatus.count} actividad${importStatus.count !== 1 ? "es" : ""} importada${importStatus.count !== 1 ? "s" : ""}`
            : "× Sin datos válidos en el archivo"}
        </span>
      )}

      {/* Activity count + clear */}
      {!importStatus && (
        <span className="font-mono text-xs text-gray-400 hidden sm:flex items-center gap-2">
          {activityCount} actividad{activityCount !== 1 ? "es" : ""}
          {activityCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-gray-300 hover:text-red-400 transition-colors font-mono text-[10px] underline underline-offset-2"
              title="Eliminar todas las actividades"
            >
              Limpiar
            </button>
          )}
        </span>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#0A0A0A" }}
        >
          <span className="text-base leading-none">+</span>
          Agregar
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-gray-600 border border-gray-200 rounded-sm hover:border-gray-400 transition-colors"
        >
          Importar desde .csv
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={onDownloadTemplate}
          className="px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-gray-600 border border-gray-200 rounded-sm hover:border-gray-400 transition-colors hidden md:block"
          title="Descargar plantilla CSV"
        >
          Descargar Plantilla en .csv
        </button>

        <button
          onClick={onExportPDF}
          className="px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#E84C10", color: "#fff" }}
          title="Exportar a PDF / Imprimir"
        >
          Convertir a PDF
        </button>
      </div>
    </header>
  );
}