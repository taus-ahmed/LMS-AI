import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, Download, Clock, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { useStudentStore, getEffectiveStatus } from '../store/studentStore';
import { generateICS, downloadICS } from '../utils/ics';
import type { ICSEvent } from '../utils/ics';
import clsx from 'clsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CalendarEntry {
  projectId: string;
  projectTitle: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDescription: string;
  milestoneDeliverables: string[];
  dueDate: string; // YYYY-MM-DD
  milestoneStatus: 'completed' | 'in-progress' | 'todo';
  estimatedHours: number;
  isOverdue: boolean;
  courses: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const TODAY = toLocalDateString(new Date());

function buildCalendarDays(year: number, month: number): (string | null)[] {
  // month is 0-indexed
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ds =
      `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(ds);
  }
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function statusIcon(status: CalendarEntry['milestoneStatus'], isOverdue: boolean) {
  if (isOverdue) return <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />;
  if (status === 'completed') return <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0 mt-0.5" />;
  if (status === 'in-progress') return <Clock className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />;
  return <Circle className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeliverableCalendar() {
  const projects = useStudentStore((s) => s.projects);
  const student = useStudentStore((s) => s.student);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
  const [pinnedDay, setPinnedDay] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close pinned when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setPinnedDay(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ---- Aggregate calendar entries ----
  const entries = useMemo<CalendarEntry[]>(() => {
    const result: CalendarEntry[] = [];
    for (const project of projects) {
      const effectiveStatus = getEffectiveStatus(project);
      if (effectiveStatus === 'Finished' || effectiveStatus === 'Dropped') continue;

      // Resolve course chips: prefer project-level fields, fall back to student profile
      const projAny = project as Record<string, unknown>;
      const briefAny = (project.brief ?? {}) as Record<string, unknown>;
      let courses: string[] = [];
      if (Array.isArray(briefAny['courses']) && (briefAny['courses'] as unknown[]).length > 0) {
        courses = (briefAny['courses'] as unknown[]).map(String);
      } else if (Array.isArray(projAny['courses']) && (projAny['courses'] as unknown[]).length > 0) {
        courses = (projAny['courses'] as unknown[]).map(String);
      } else if (student?.courseCode) {
        courses = [student.courseCode];
      } else if (student?.course) {
        courses = [student.course];
      }

      const milestones = project.brief?.milestones ?? [];
      for (const ms of milestones) {
        if (!ms.dueDate) continue;
        const isOverdue = ms.dueDate < TODAY && ms.status !== 'completed';
        result.push({
          projectId: project.id,
          projectTitle: project.brief?.title ?? project.title,
          milestoneId: ms.id,
          milestoneTitle: ms.title,
          milestoneDescription: ms.description ?? '',
          milestoneDeliverables: ms.deliverables ?? [],
          dueDate: ms.dueDate,
          milestoneStatus: ms.status,
          estimatedHours: ms.estimatedHours,
          isOverdue,
          courses,
        });
      }
    }
    return result;
  }, [projects]);

  // ---- Build lookup: date -> entries ----
  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of entries) {
      const arr = map.get(entry.dueDate) ?? [];
      arr.push(entry);
      map.set(entry.dueDate, arr);
    }
    return map;
  }, [entries]);

  const calendarCells = useMemo(
    () => buildCalendarDays(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  // ---- Navigation ----
  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    setPinnedDay(null);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    setPinnedDay(null);
  }

  // ---- Active day for detail panel: pinned takes priority over hover ----
  const activeDay = pinnedDay ?? hoveredDay;
  const activeDayEntries = activeDay ? (entriesByDate.get(activeDay) ?? []) : [];

  // ---- ICS export ----
  function handleExport() {
    const icsEvents: ICSEvent[] = entries.map((e) => {
      const descParts: string[] = [];
      if (e.milestoneDescription) descParts.push(e.milestoneDescription);
      if (e.milestoneDeliverables.length > 0) {
        descParts.push('Deliverables: ' + e.milestoneDeliverables.join('; '));
      }
      descParts.push(`Estimated: ${e.estimatedHours}h`);
      return {
        uid: `${e.projectId}-${e.milestoneId}`,
        summary: `${e.milestoneTitle} — ${e.projectTitle}`,
        description: descParts.join('\n'),
        dtstart: e.dueDate,
      };
    });
    const icsString = generateICS(icsEvents, 'AdaptLearn Deliverables');
    const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
    downloadICS(icsString, `deliverables-${monthStr}.ics`);
  }

  // ---- Stats ----
  const totalEntries = entries.length;
  const overdueCount = entries.filter((e) => e.isOverdue).length;
  const thisMonthEntries = entries.filter((e) => {
    const [y, m] = e.dueDate.split('-').map(Number);
    return y === viewYear && m === viewMonth + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Milestone Calendar
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            All active project milestones &amp; deadlines
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          Export calendar (.ics)
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
          <CalendarDays className="w-3.5 h-3.5" />
          {totalEntries} milestone{totalEntries !== 1 ? 's' : ''} tracked
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          {thisMonthEntries.length} due this month
        </div>
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {overdueCount} overdue
          </div>
        )}
      </div>

      {/* Calendar card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-slate-800" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DAY_NAMES.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarCells.map((dateStr, idx) => {
            if (!dateStr) {
              return <div key={`empty-${idx}`} className="min-h-[72px] bg-slate-50/40 border-b border-r border-slate-100/60" />;
            }

            const dayEntries = entriesByDate.get(dateStr) ?? [];
            const count = dayEntries.length;
            const hasOverdue = dayEntries.some((e) => e.isOverdue);
            const isToday = dateStr === TODAY;
            const isPinned = pinnedDay === dateStr;
            const isHovered = hoveredDay === dateStr;
            const isActive = isPinned || isHovered;

            return (
              <div
                key={dateStr}
                onMouseEnter={() => setHoveredDay(dateStr)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={() => setPinnedDay(isPinned ? null : dateStr)}
                className={clsx(
                  'min-h-[72px] border-b border-r border-slate-100 p-1.5 relative cursor-default transition-colors',
                  count > 0 && 'cursor-pointer',
                  isActive && count > 0 ? 'bg-indigo-50/60' : 'hover:bg-slate-50/70'
                )}
              >
                {/* Day number */}
                <div className={clsx(
                  'w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1',
                  isToday
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600'
                )}>
                  {Number(dateStr.split('-')[2])}
                </div>

                {/* Overdue indicator dot */}
                {hasOverdue && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-300" />
                )}

                {/* Count badge */}
                {count > 0 && (
                  <div className={clsx(
                    'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    hasOverdue
                      ? 'bg-red-100 text-red-700'
                      : 'bg-indigo-100 text-indigo-700'
                  )}>
                    {count}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail panel — pinned keeps selection; hover previews when nothing is pinned */}
      <AnimatePresence mode="wait">
        {activeDay && activeDayEntries.length > 0 && (
          <motion.div
            key={activeDay}
            ref={tooltipRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.14 }}
            className={clsx(
              'bg-white rounded-2xl border shadow-md p-4',
              pinnedDay ? 'border-indigo-200 shadow-indigo-100/60' : 'border-slate-200'
            )}
          >
            <DayDetailContent
              dateStr={activeDay}
              entries={activeDayEntries}
              isPinned={!!pinnedDay}
              onClose={pinnedDay ? () => setPinnedDay(null) : null}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          Overdue milestone on that day
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-indigo-600 inline-flex items-center justify-center text-white font-medium text-[10px]">7</span>
          Today
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5 bg-indigo-100 text-indigo-700 font-semibold text-[10px]">3</span>
          Milestone count badge
        </div>
        <div className="text-slate-400 italic">Hover to preview · click to pin a day's details</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Day detail sub-component
// ---------------------------------------------------------------------------

interface DayDetailProps {
  dateStr: string;
  entries: CalendarEntry[];
  isPinned: boolean;
  onClose: (() => void) | null;
}

function DayDetailContent({ dateStr, entries, isPinned, onClose }: DayDetailProps) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
          <span className={clsx(
            'inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            isPinned
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-500'
          )}>
            {isPinned ? '📌 Pinned' : 'Hover to preview · click to pin'}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-xs"
            aria-label="Unpin"
          >
            ✕
          </button>
        )}
      </div>
      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={`${e.projectId}-${e.milestoneId}`} className={clsx(
            'flex items-start gap-2 p-2 rounded-lg',
            e.isOverdue ? 'bg-red-50' : e.milestoneStatus === 'completed' ? 'bg-emerald-50' : 'bg-slate-50'
          )}>
            {statusIcon(e.milestoneStatus, e.isOverdue)}
            <div className="flex-1 min-w-0">
              <p className={clsx(
                'text-xs font-semibold leading-tight truncate',
                e.isOverdue ? 'text-red-700' : 'text-slate-800'
              )}>
                {e.milestoneTitle}
                {e.isOverdue && <span className="ml-1.5 text-red-500 font-medium">(Overdue)</span>}
              </p>
              <p className="text-[11px] text-slate-500 truncate">{e.projectTitle}</p>
              {e.courses.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {e.courses.map((c) => (
                    <span
                      key={c}
                      className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-violet-100 text-violet-700"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">{e.estimatedHours}h estimated</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
