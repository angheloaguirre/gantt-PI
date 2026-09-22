import { useMemo, useState } from "react"
import { Activity, PHASE_META } from "../types"

// px per day only used as min-width floor for screen; bars use % positioning
const PX_PER_DAY = 22
const ROW_H = 40
const MONTH_HEADER_H = 26
const DAY_HEADER_H = 22
const BAR_H = 22

function toDate(s: string) {
  return new Date(s + "T00:00:00")
}

function floorToMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function ceilToMonth(d: Date) {
  // last day of the month containing d
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function daysDiff(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function monthsInRange(start: Date, end: Date) {
  const months: { label: string startDay: number days: number }[] = []
  let cur = new Date(start.getFullYear(), start.getMonth(), 1)
  while (cur <= end) {
    const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    const segEnd = new Date(
      Math.min(next.getTime() - 86_400_000, end.getTime()),
    )
    months.push({
      label: cur.toLocaleDateString("es-CL", {
        month: "long",
        year: "numeric",
      }),
      startDay: daysDiff(start, cur),
      days: daysDiff(cur, segEnd) + 1,
    })
    cur = next
  }
  return months
}

interface Props {
  activities: Activity[]
  // printId used only in the print-only copy so the @media print CSS can target it
  printId?: string
  onUpdate?: (id: string, patch: Partial<Omit<Activity, "id">>) => void
}

type ResizePreview = {
  activityId: string
  edge: "start" | "end"
  startDate: string
  endDate: string
}

export default function GanttChart({ activities, printId, onUpdate }: Props) {
  const [resizePreview, setResizePreview] = useState<ResizePreview | null>(null)
  const { timelineStart, totalDays, months, todayPct } = useMemo(() => {
    const valid = activities.filter((a) => a.startDate && a.endDate)

    let rangeStart: Date
    let rangeEnd: Date

    if (valid.length === 0) {
      rangeStart = new Date()
      rangeEnd = new Date(Date.now() + 60 * 86_400_000)
    } else {
      const starts = valid.map((a) => toDate(a.startDate))
      const ends = valid.map((a) => toDate(a.endDate))
      rangeStart = new Date(Math.min(...starts.map((d) => d.getTime())))
      rangeEnd = new Date(Math.max(...ends.map((d) => d.getTime())))
    }

    const tStart = floorToMonth(rangeStart)
    const tEnd = ceilToMonth(rangeEnd)
    const totalDays = Math.max(daysDiff(tStart, tEnd) + 1, 30)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDiff = daysDiff(tStart, today)
    const todayPct =
      todayDiff >= 0 && todayDiff <= totalDays
        ? (todayDiff / totalDays) * 100
        : null

    return {
      timelineStart: tStart,
      totalDays,
      months: monthsInRange(tStart, tEnd),
      todayPct,
    }
  }, [activities])

  // min-width keeps the timeline readable on screen; % positioning makes it scale in print
  const minWidth = totalDays * PX_PER_DAY
  const days = useMemo(
    () =>
      Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i)),
    [timelineStart, totalDays],
  )

  function beginResize(
    event: React.PointerEvent<HTMLButtonElement>,
    activity: Activity,
    edge: "start" | "end",
  ) {
    if (!onUpdate) return
    event.preventDefault()
    event.stopPropagation()

    const chart = event.currentTarget.closest("[data-gantt-timeline]")
    if (!(chart instanceof HTMLElement)) return

    const pointerStart = event.clientX
    const chartWidth = chart.getBoundingClientRect().width
    const originalStart = toDate(activity.startDate)
    const originalEnd = toDate(activity.endDate)
    const target = event.currentTarget
    let latestPreview: ResizePreview = {
      activityId: activity.id,
      edge,
      startDate: activity.startDate,
      endDate: activity.endDate,
    }
    target.setPointerCapture(event.pointerId)

    const updatePreview = (clientX: number) => {
      const dayDelta = Math.round(
        (clientX - pointerStart) / (chartWidth / totalDays),
      )
      let nextStart = originalStart
      let nextEnd = originalEnd
      if (edge === "start") {
        nextStart = addDays(originalStart, dayDelta)
        if (nextStart > originalEnd) nextStart = originalEnd
      } else {
        nextEnd = addDays(originalEnd, dayDelta)
        if (nextEnd < originalStart) nextEnd = originalStart
      }
      latestPreview = {
        activityId: activity.id,
        edge,
        startDate: toDateString(nextStart),
        endDate: toDateString(nextEnd),
      }
      setResizePreview(latestPreview)
    }

    const handleMove = (moveEvent: PointerEvent) =>
      updatePreview(moveEvent.clientX)
    const handleEnd = (endEvent: PointerEvent) => {
      target.removeEventListener("pointermove", handleMove)
      target.removeEventListener("pointerup", handleEnd)
      target.removeEventListener("pointercancel", handleCancel)
      if (target.hasPointerCapture(endEvent.pointerId)) {
        target.releasePointerCapture(endEvent.pointerId)
      }
      onUpdate(activity.id, {
        startDate: latestPreview.startDate,
        endDate: latestPreview.endDate,
      })
      setResizePreview(null)
    }
    const handleCancel = () => {
      target.removeEventListener("pointermove", handleMove)
      target.removeEventListener("pointerup", handleEnd)
      target.removeEventListener("pointercancel", handleCancel)
      setResizePreview(null)
    }

    target.addEventListener("pointermove", handleMove)
    target.addEventListener("pointerup", handleEnd)
    target.addEventListener("pointercancel", handleCancel)
    setResizePreview(latestPreview)
  }

  return (
    <div
      id={printId ?? "gantt-screen"}
      className="h-full overflow-auto gantt-scroll"
    >
      {/* Inner div: min-width for screen usability; overridden in print CSS */}
      <div
        data-gantt-timeline
        style={{
          minWidth,
          position: "relative",
          ["--gantt-print-width" as string]: `${Math.max(totalDays * 11, 1000)}px`,
        }}
      >
        {/* ── Month and day headers ── */}
        <div
          className="sticky top-0 z-30 border-b-2 border-black"
          style={{
            height: MONTH_HEADER_H + DAY_HEADER_H,
            backgroundColor: "#0A0A0A",
          }}
        >
          <div className="flex" style={{ height: MONTH_HEADER_H }}>
            {months.map((m, i) => (
              <div
                key={i}
                className="flex-shrink-0 border-r border-white/30 flex items-center px-2 overflow-hidden"
                style={{ width: `${(m.days / totalDays) * 100}%` }}
              >
                <span className="font-mono text-[10px] font-bold capitalize tracking-wide text-white whitespace-nowrap">
                  {m.label}
                </span>
              </div>
            ))}
          </div>
          <div
            className="flex border-t border-white/20"
            style={{ height: DAY_HEADER_H }}
          >
            {days.map((day) => (
              <div
                key={toDateString(day)}
                className="flex items-center justify-center border-r border-white/10 font-mono text-[9px] text-white/80"
                style={{ width: `${100 / totalDays}%`, flexShrink: 0 }}
              >
                {String(day.getDate()).padStart(2, "0")}
              </div>
            ))}
          </div>
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
                style={{
                  left: `${todayPct}%`,
                  width: 1,
                  backgroundColor: "#E84C10",
                }}
              >
                <span className="absolute top-0 left-0 -translate-x-1/2 bg-[#E84C10] font-mono text-[9px] text-white px-1 py-px rounded-sm whitespace-nowrap">
                  hoy
                </span>
              </div>
            )}

            {activities.map((a, i) => {
              const meta = PHASE_META[a.phase]
              const preview =
                resizePreview?.activityId === a.id ? resizePreview : null
              const visibleStart = preview?.startDate ?? a.startDate
              const visibleEnd = preview?.endDate ?? a.endDate
              const start = visibleStart ? toDate(visibleStart) : null
              const end = visibleEnd ? toDate(visibleEnd) : null
              const isValid = start && end && end >= start

              // % positions relative to totalDays — scale correctly in any container width
              const barLeftPct = isValid
                ? (daysDiff(timelineStart, start!) / totalDays) * 100
                : 0
              const barWidthPct = isValid
                ? ((daysDiff(start!, end!) + 1) / totalDays) * 100
                : 0

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
                      className="absolute top-1/2 -translate-y-1/2 flex items-center rounded-sm"
                      style={{
                        left: `${barLeftPct}%`,
                        width: `${barWidthPct}%`,
                        height: BAR_H,
                        backgroundColor: meta.bar,
                        minWidth: 4,
                      }}
                    >
                      {onUpdate && (
                        <button
                          type="button"
                          className="gantt-resize-handle no-print absolute inset-y-0 left-0 z-10 w-2 cursor-ew-resize border-r border-white/50 bg-black/15 touch-none"
                          onPointerDown={(event) =>
                            beginResize(event, a, "start")
                          }
                          aria-label={`Modificar inicio de ${a.name}`}
                          title="Arrastra para modificar la fecha de inicio"
                        />
                      )}
                      {/* Show label only when bar is wide enough */}
                      {barWidthPct * (minWidth / 100) > 48 && (
                        <span
                          className="px-2.5 text-white font-mono truncate"
                          style={{ fontSize: 10, lineHeight: 1 }}
                        >
                          {a.name}
                        </span>
                      )}
                      {onUpdate && (
                        <button
                          type="button"
                          className="gantt-resize-handle no-print absolute inset-y-0 right-0 z-10 w-2 cursor-ew-resize border-l border-white/50 bg-black/15 touch-none"
                          onPointerDown={(event) =>
                            beginResize(event, a, "end")
                          }
                          aria-label={`Modificar fin de ${a.name}`}
                          title="Arrastra para modificar la fecha de fin"
                        />
                      )}
                      {preview && (
                        <span className="no-print pointer-events-none absolute bottom-full left-1/2 z-40 mb-1 -translate-x-1/2 rounded-sm bg-black px-2 py-1 font-mono text-[9px] text-white shadow-md whitespace-nowrap">
                          {preview.startDate} — {preview.endDate} ·{" "}
                          {daysDiff(
                            toDate(preview.startDate),
                            toDate(preview.endDate),
                          ) + 1}{" "}
                          días
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
