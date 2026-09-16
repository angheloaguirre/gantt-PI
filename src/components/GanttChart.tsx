import { useMemo } from "react";
import { Activity, PHASE_META } from "../types";

// px per day only used as min-width floor for screen; bars use % positioning
const PX_PER_DAY = 22;
const ROW_H = 40;
const HEADER_H = 48;
const BAR_H = 22;

function toDate(s: string) {
  return new Date(s + "T00:00:00");
}

function floorToMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function ceilToMonth(d: Date) {
  // last day of the month containing d
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function daysDiff(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function monthsInRange(start: Date, end: Date) {
  const months: { label: string; startDay: number; days: number }[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    const segEnd = new Date(Math.min(next.getTime() - 86_400_000, end.getTime()));
    months.push({
      label: cur.toLocaleDateString("es-CL", { month: "short", year: "2-digit" }),
      startDay: daysDiff(start, cur),
      days: daysDiff(cur, segEnd) + 1,
    });
    cur = next;
  }
  return months;
}

interface Props {
  activities: Activity[];
  // printId used only in the print-only copy so the @media print CSS can target it
  printId?: string;
}

export default function GanttChart({ activities, printId }: Props) {
  const { timelineStart, totalDays, months, todayPct } = useMemo(() => {
    const valid = activities.filter((a) => a.startDate && a.endDate);

    let rangeStart: Date;
    let rangeEnd: Date;

    if (valid.length === 0) {
      rangeStart = new Date();
      rangeEnd = new Date(Date.now() + 60 * 86_400_000);
    } else {
      const starts = valid.map((a) => toDate(a.startDate));
      const ends = valid.map((a) => toDate(a.endDate));
      rangeStart = new Date(Math.min(...starts.map((d) => d.getTime())));
      rangeEnd = new Date(Math.max(...ends.map((d) => d.getTime())));
    }

    const tStart = floorToMonth(rangeStart);
    const tEnd = ceilToMonth(rangeEnd);
    const totalDays = Math.max(daysDiff(tStart, tEnd) + 1, 30);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayDiff = daysDiff(tStart, today);
    const todayPct =
      todayDiff >= 0 && todayDiff <= totalDays
        ? (todayDiff / totalDays) * 100
        : null;

    return {
      timelineStart: tStart,
      totalDays,
      months: monthsInRange(tStart, tEnd),
      todayPct,
    };
  }, [activities]);

  // min-width keeps the timeline readable on screen; % positioning makes it scale in print
  const minWidth = totalDays * PX_PER_DAY;

  return (
    <div
      id={printId ?? "gantt-screen"}
      className="h-full overflow-auto gantt-scroll"
    >
      {/* Inner div: min-width for screen usability; overridden in print CSS */}
      <div style={{ minWidth, position: "relative" }}>
        {/* ── Month headers ── */}
        <div
          className="sticky top-0 z-10 flex border-b-2 border-black"
          style={{ height: HEADER_H, backgroundColor: "#0A0A0A" }}
        >
          {months.map((m, i) => (
            <div
              key={i}
              className="flex-shrink-0 border-r border-white/10 flex items-center px-3 overflow-hidden"
              style={{ width: `${(m.days / totalDays) * 100}%` }}
            >
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-white whitespace-nowrap">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Activity rows ── */}
        {activities.length === 0 ? (
          <div
            className="flex items-center justify-center font-mono text-xs text-gray-300"
            style={{ height: 240 }}
          >
            El diagrama aparecerá aquí
          </div>
        ) : (
          <div style={{ position: "relative" }}>
            {/* Today marker */}
            {todayPct !== null && (
              <div
                className="absolute top-0 bottom-0 z-20 pointer-events-none"
                style={{ left: `${todayPct}%`, width: 1, backgroundColor: "#E84C10" }}
              >
                <span className="absolute top-0 left-0 -translate-x-1/2 bg-[#E84C10] font-mono text-[9px] text-white px-1 py-px rounded-sm whitespace-nowrap">
                  hoy
                </span>
              </div>
            )}

            {activities.map((a, i) => {
              const meta = PHASE_META[a.phase];
              const start = a.startDate ? toDate(a.startDate) : null;
              const end = a.endDate ? toDate(a.endDate) : null;
              const isValid = start && end && end >= start;

              // % positions relative to totalDays — scale correctly in any container width
              const barLeftPct = isValid
                ? (daysDiff(timelineStart, start!) / totalDays) * 100
                : 0;
              const barWidthPct = isValid
                ? ((daysDiff(start!, end!) + 1) / totalDays) * 100
                : 0;

              return (
                <div
                  key={a.id}
                  className="relative border-b border-gray-100"
                  style={{
                    height: ROW_H,
                    backgroundColor: i % 2 === 0 ? "#ffffff" : "#FAFAFA",
                  }}
                >
                  {/* Month grid lines */}
                  {months.map((m, mi) => (
                    <div
                      key={mi}
                      className="absolute top-0 bottom-0"
                      style={{
                        left: `${((m.startDay + m.days) / totalDays) * 100}%`,
                        width: 1,
                        backgroundColor: "#E5E7EB",
                      }}
                    />
                  ))}

                  {/* Gantt bar */}
                  {isValid && barWidthPct > 0 && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 flex items-center overflow-hidden rounded-sm"
                      style={{
                        left: `${barLeftPct}%`,
                        width: `${barWidthPct}%`,
                        height: BAR_H,
                        backgroundColor: meta.bar,
                        minWidth: 4,
                      }}
                    >
                      {/* Show label only when bar is wide enough */}
                      {barWidthPct * (minWidth / 100) > 48 && (
                        <span
                          className="px-1.5 text-white font-mono truncate"
                          style={{ fontSize: 10, lineHeight: 1 }}
                        >
                          {a.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
