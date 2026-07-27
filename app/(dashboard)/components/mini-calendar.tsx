"use client";

import React, { useMemo, useState } from "react";

type TaskHistory = {
  id: string;
  task_id: string | null;
  task_title: string;
  action: string;
  details: string | null;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

type MiniCalendarProps = {
  events: TaskHistory[];
  compact?: boolean;
};

function formatDay(dt: Date) {
  return dt.toLocaleDateString("he-IL", { day: "numeric" });
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export default function MiniCalendar({ events, compact = false }: MiniCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthEvents = useMemo(() => {
    const map = new Map<string, TaskHistory[]>();
    events.forEach((ev) => {
      const d = new Date(ev.created_at).toISOString().slice(0, 10);
      const arr = map.get(d) || [];
      arr.push(ev);
      map.set(d, arr);
    });
    return map;
  }, [events]);

  const monthLabel = useMemo(() => {
    return viewDate.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
  }, [viewDate]);

  const weeks: Date[][] = useMemo(() => {
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

    // start from Sunday in locale-independent way (Sunday = 0)
    const gridStart = new Date(start);
    gridStart.setDate(start.getDate() - start.getDay());

    const gridEnd = new Date(end);
    gridEnd.setDate(end.getDate() + (6 - end.getDay()));

    const weeksArr: Date[][] = [];
    let current = new Date(gridStart);
    while (current <= gridEnd) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      weeksArr.push(week);
    }
    return weeksArr;
  }, [viewDate]);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  return (
    <div className={compact ? "w-full" : "max-w-[1120px] mx-auto"}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold" style={{ color: "#0B2348" }}>{monthLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth} className="dash-focusable text-xs px-2 py-1 rounded" style={{ border: "1px solid #E8EDF5" }}>‹</button>
          <button type="button" onClick={nextMonth} className="dash-focusable text-xs px-2 py-1 rounded" style={{ border: "1px solid #E8EDF5" }}>›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-[11px] font-medium text-right" style={{ color: '#65738B' }}>{d}</div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((day) => {
              const dayKey = day.toISOString().slice(0, 10);
              const isThisMonth = day.getMonth() === viewDate.getMonth();
              const dayEvents = monthEvents.get(dayKey) || [];
              const isToday = dayKey === new Date().toISOString().slice(0, 10);

              return (
                <div key={dayKey} className={`rounded-lg p-2 ${isThisMonth ? 'bg-white' : 'bg-transparent'}`} style={{ border: `1px solid ${isThisMonth ? '#E8EDF5' : 'transparent'}` }}>
                  <div className="flex items-start justify-between">
                    <div className="text-[13px] font-medium" style={{ color: isThisMonth ? '#0B2348' : '#94A0B3' }}>{formatDay(day)}</div>
                    {isToday && <span className="ml-2 inline-block h-2 w-2 rounded-full" style={{ background: '#1D4ED8' }} />}
                  </div>

                  <div className="mt-2 space-y-1">
                    {dayEvents.slice(0, compact ? 1 : 2).map((ev) => (
                      <div key={ev.id} className="overflow-hidden rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                        {ev.task_title}
                      </div>
                    ))}
                    {dayEvents.length > (compact ? 1 : 2) && (
                      <div className="text-[11px] text-[#65738B]">+{dayEvents.length - (compact ? 1 : 2)} עוד</div>
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
