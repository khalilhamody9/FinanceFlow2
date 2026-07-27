"use client";

import { useMemo, useState } from "react";

type TaskHistory = {
  id: string;
  task_id: string | null;
  task_title: string;
  action: string;
  details: string | null;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

type ActivityLogClientProps = {
  initialTaskHistory: TaskHistory[];
};

const actionLabels: Record<string, string> = {
  created: "נוצרה",
  completed: "הושלמה",
  reopened: "נפתחה מחדש",
  updated: "עודכנה",
  deleted: "נמחקה",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getPerformedByName(entry: TaskHistory) {
  const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
  return profile?.full_name?.trim() || "משתמש";
}

function getActionText(entry: TaskHistory) {
  return `${actionLabels[entry.action] || entry.action} ${entry.task_title}`;
}

export default function ActivityLogClient({ initialTaskHistory }: ActivityLogClientProps) {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const filteredHistory = useMemo(() => {
    return initialTaskHistory.filter((entry) => {
      const createdDate = new Date(entry.created_at).toISOString().slice(0, 10);
      return createdDate === selectedDate;
    });
  }, [initialTaskHistory, selectedDate]);

  return (
    <main className="mx-auto max-w-[1120px] px-6 py-9">
      <div className="mb-6 flex flex-col gap-4 rounded-[18px] bg-white p-6 shadow-[0_14px_40px_rgba(9,30,66,.06)]" style={{ border: "1px solid #E8EDF5" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: "#0B2348" }}>
              יומן משימות
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#65738B" }}>
              כאן מוצגות כל פעולות המשימות לפי תאריך.
            </p>
          </div>
          <label className="flex items-center gap-3 rounded-2xl border border-[#E8EDF5] bg-[#F8FAFD] px-4 py-3 text-sm font-medium" style={{ color: "#0B2348" }}>
            תאריך:
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="bg-transparent text-sm outline-none"
              aria-label="בחר תאריך ליומן" 
            />
          </label>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="rounded-[18px] bg-[#F4F4FF] p-6 text-sm" style={{ color: "#94A0B3" }}>
            לא נמצאו אירועים ביום זה.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((entry) => (
              <div key={entry.id} className="rounded-[18px] border p-5" style={{ borderColor: "#E8EDF5" }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#0B2348" }}>
                      {getActionText(entry)}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "#65738B" }}>
                      על ידי {getPerformedByName(entry)}
                    </p>
                  </div>
                  <time className="shrink-0 text-[11px]" style={{ color: "#94A0B3" }}>
                    {formatDate(entry.created_at)}
                  </time>
                </div>
                {entry.details ? (
                  <p className="mt-3 text-sm" style={{ color: "#65738B" }}>
                    {entry.details}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
