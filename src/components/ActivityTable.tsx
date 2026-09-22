import { useEffect, useRef } from "react"
import {
  Activity,
  Phase,
  PHASES,
  PHASE_META,
  Responsable,
  RESPONSIBLES,
} from "../types"

const ROW_H = 40

interface Props {
  activities: Activity[]
  onUpdate: (id: string, patch: Partial<Omit<Activity, "id">>) => void
  onDelete: (id: string) => void
}

export default function ActivityTable({
  activities,
  onUpdate,
  onDelete,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevLen = useRef(activities.length)

  // Scroll to bottom whenever a new row is added
  useEffect(() => {
    if (activities.length > prevLen.current) {
      requestAnimationFrame(() => {
        const el = scrollRef.current
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
      })
    }
    prevLen.current = activities.length
  }, [activities.length])

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto overflow-x-hidden gantt-scroll"
    >
      <table className="w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10">
          <tr style={{ height: ROW_H + 8, backgroundColor: "#0A0A0A" }}>
            <th className="text-left px-3 font-mono text-[10px] tracking-widest uppercase text-white border-r border-white/10 w-[25%]">
              Actividad
            </th>
            <th className="text-left px-3 font-mono text-[10px] tracking-widest uppercase text-white border-r border-white/10 w-[19%]">
              Fase
            </th>
            <th className="text-left px-3 font-mono text-[10px] tracking-widest uppercase text-white border-r border-white/10 w-[17%]">
              Responsable
            </th>
            <th className="text-left px-3 font-mono text-[10px] tracking-widest uppercase text-white border-r border-white/10 w-[17.5%]">
              Inicio
            </th>
            <th className="text-left px-3 font-mono text-[10px] tracking-widest uppercase text-white border-r border-white/10 w-[17.5%]">
              Fin
            </th>
            <th className="w-[4%]" />
          </tr>
        </thead>
        <tbody>
          {activities.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="text-center text-gray-400 font-mono text-xs py-16"
              >
                Sin actividades — agrega una para comenzar.
              </td>
            </tr>
          )}
          {activities.map((a, i) => {
            const meta = PHASE_META[a.phase]
            const dateError =
              a.startDate && a.endDate && a.endDate < a.startDate

            return (
              <tr
                key={a.id}
                className="border-b border-gray-100 group transition-colors"
                style={{
                  height: ROW_H,
                  backgroundColor: i % 2 === 0 ? "#ffffff" : "#FAFAFA",
                }}
              >
                {/* Actividad */}
                <td className="px-3 border-r border-gray-100">
                  <input
                    className="w-full bg-transparent outline-none text-gray-900 placeholder:text-gray-300 truncate"
                    style={{ fontFamily: "inherit", fontSize: 13 }}
                    value={a.name}
                    onChange={(e) => onUpdate(a.id, { name: e.target.value })}
                    placeholder="Nombre de actividad"
                  />
                </td>

                {/* Fase */}
                <td className="px-2 border-r border-gray-100">
                  <span
                    className="inline-flex items-center rounded-sm px-1.5 py-0.5 w-full"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <select
                      className="w-full bg-transparent outline-none font-mono text-[11px] font-semibold cursor-pointer"
                      style={{ color: meta.text }}
                      value={a.phase}
                      onChange={(e) =>
                        onUpdate(a.id, { phase: e.target.value as Phase })
                      }
                    >
                      {PHASES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </span>
                </td>

                {/* Responsable */}
                <td className="px-2 border-r border-gray-100">
                  <select
                    className="w-full bg-transparent outline-none font-mono text-[11px] text-gray-700 cursor-pointer"
                    value={a.responsable}
                    onChange={(e) =>
                      onUpdate(a.id, {
                        responsable: e.target.value as Responsable,
                      })
                    }
                    aria-label={`Responsable de ${a.name}`}
                  >
                    {RESPONSIBLES.map((responsable) => (
                      <option key={responsable} value={responsable}>
                        {responsable}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Inicio */}
                <td className="px-2 border-r border-gray-100">
                  <input
                    type="date"
                    className={`w-full bg-transparent outline-none font-mono text-[11px] text-gray-700 rounded-sm ${
                      dateError ? "ring-1 ring-red-400 text-red-500" : ""
                    }`}
                    value={a.startDate}
                    onChange={(e) =>
                      onUpdate(a.id, { startDate: e.target.value })
                    }
                  />
                </td>

                {/* Fin */}
                <td className="px-2 border-r border-gray-100">
                  <input
                    type="date"
                    className={`w-full bg-transparent outline-none font-mono text-[11px] text-gray-700 rounded-sm ${
                      dateError ? "ring-1 ring-red-400 text-red-500" : ""
                    }`}
                    value={a.endDate}
                    onChange={(e) =>
                      onUpdate(a.id, { endDate: e.target.value })
                    }
                  />
                </td>

                {/* Borrar — always visible at low opacity, full on hover */}
                <td className="text-center">
                  <button
                    onClick={() => onDelete(a.id)}
                    className="opacity-20 group-hover:opacity-100 text-gray-500 hover:text-red-500 transition-all font-mono text-base leading-none"
                    title="Eliminar actividad"
                  >
                    ×
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
