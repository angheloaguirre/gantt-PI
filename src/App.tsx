import { useState } from "react";
import { useActivities } from "./hooks/useActivities";
import Toolbar from "./components/Toolbar";
import ActivityTable from "./components/ActivityTable";
import GanttChart from "./components/GanttChart";
import { PHASE_META, PHASES } from "./types";

export default function App() {
  const {
    activities,
    addActivity,
    updateActivity,
    deleteActivity,
    clearAll,
    importCSV,
    downloadTemplate,
  } = useActivities();

  const [projectName, setProjectName] = useState("Cronograma PI");

  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* ── Toolbar ── */}
      <Toolbar
        activityCount={activities.length}
        onAdd={addActivity}
        onImportCSV={importCSV}
        onDownloadTemplate={downloadTemplate}
        onExportPDF={() => window.print()}
        onClearAll={clearAll}
        projectName={projectName}
        onProjectNameChange={setProjectName}
      />

      {/* ── Split panels (screen only) ── */}
      <main className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left — editable table */}
        <div
          className="flex flex-col border-r-2 border-black shrink-0"
          style={{ width: "42%" }}
        >
          <ActivityTable
            activities={activities}
            onUpdate={updateActivity}
            onDelete={deleteActivity}
          />
        </div>

        {/* Right — Gantt */}
        <div className="flex-1 flex flex-col min-w-0">
          <GanttChart activities={activities} />
        </div>
      </main>

      {/* ── Print-only view ── */}
      <div className="print-only hidden">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1
                className="font-mono text-lg font-bold uppercase tracking-widest mb-1"
                style={{ color: "#0A0A0A" }}
              >
                {projectName}
              </h1>
              <p className="font-mono text-xs text-gray-500">
                Generado el{" "}
                {new Date().toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {activities.length} actividad{activities.length !== 1 ? "es" : ""}
              </p>
            </div>

            {/* Phase legend */}
            <div className="flex gap-2 flex-wrap justify-end">
              {PHASES.map((p) => {
                const m = PHASE_META[p];
                return (
                  <span
                    key={p}
                    className="font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded-sm"
                    style={{ backgroundColor: m.bg, color: m.text }}
                  >
                    {p}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Activity table */}
          <table className="w-full border-collapse text-xs mb-8">
            <thead>
              <tr style={{ backgroundColor: "#0A0A0A", color: "#fff" }}>
                {["#", "Actividad", "Fase", "Inicio", "Fin"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 font-mono uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((a, i) => {
                const m = PHASE_META[a.phase];
                return (
                  <tr
                    key={a.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? "#fff" : "#FAFAFA",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <td className="px-3 py-1.5 font-mono text-gray-400">{i + 1}</td>
                    <td className="px-3 py-1.5 font-sans">{a.name}</td>
                    <td className="px-3 py-1.5">
                      <span
                        className="font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded-sm"
                        style={{ backgroundColor: m.bg, color: m.text }}
                      >
                        {a.phase}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 font-mono">{a.startDate}</td>
                    <td className="px-3 py-1.5 font-mono">{a.endDate}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Gantt — printId="gantt-scroll" is targeted by @media print CSS */}
          <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest mb-3 text-gray-400">
            Diagrama Gantt
          </h2>
          <GanttChart activities={activities} printId="gantt-scroll" />
        </div>
      </div>
    </div>
  );
}
