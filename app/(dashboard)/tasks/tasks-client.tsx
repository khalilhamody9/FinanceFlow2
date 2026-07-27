"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Edit3, Loader2, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const BORDER = "#E8EDF5";
const INK = "#0B2348";
const SLATE = "#65738B";
const MUTE = "#94A0B3";

const DAY_NAMES = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
const INDIGO = "#C99B2D";
const RED = "#B42318";
const GREEN = "#1E7B3B";

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  created_by: string | null;
  assignee?: { full_name: string | null }[] | null;
  creator?: { full_name: string | null }[] | null;
  created_at: string;
};

type Employee = { id: string; full_name: string | null; role: string | null };

type TaskItem = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  dueDateTime: string;
  dueDateLabel: string;
  assignedTo: string | null;
  assignedName: string;
  creatorName: string;
  created_at: string;
};

type TasksClientProps = {
  userId: string;
  userName: string;
  userRole: string;
  organizationId: string;
  initialTasks: TaskRow[];
  employees: Employee[];
};

function safeName(value: string | null | undefined, fallback: string) {
  const name = value?.trim();
  return name && !["undefined", "null"].includes(name.toLowerCase()) ? name : fallback;
}

function toLocalDatetime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
}

function formatDueDate(value: string | null | undefined) {
  if (!value) return "ללא תאריך";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ללא תאריך";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = firstDay.getDay();
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(firstWeekday).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    currentWeek.push(new Date(year, month, day));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

function getDueStatus(task: TaskItem) {
  if (!task.dueDateTime || task.status === "done") return null;
  const dueDate = new Date(task.dueDateTime);
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();

  if (diff < 0) {
    return "באיחור";
  }

  if (diff <= 1000 * 60 * 60) {
    return "מתחיל בשעה הקרובה";
  }

  if (diff <= 1000 * 60 * 60 * 24) {
    return "מתקרב בתוך 24 שעות";
  }

  return null;
}

function getDayKey(value: string) {
  return value.slice(0, 10);
}

function normalizeTask(task: TaskRow, userId: string, userName: string) {
  const dueDateTime = toLocalDatetime(task.due_date) || "";
  const assigneeName = safeName(task.assignee?.[0]?.full_name ?? null, "עובד");
  const creatorName = safeName(task.creator?.[0]?.full_name ?? null, userName);

  return {
    id: task.id,
    title: task.title,
    status: task.status || "open",
    priority: task.priority || "medium",
    dueDateTime,
    dueDateLabel: formatDueDate(dueDateTime),
    assignedTo: task.assigned_to,
    assignedName: assigneeName,
    creatorName,
    created_at: task.created_at,
  } as TaskItem;
}

export default function TasksClient({
  userId,
  userName,
  userRole,
  organizationId,
  initialTasks,
  employees,
}: TasksClientProps) {
  const supabase = createClient();
  const isManager = ["ADMIN", "MANAGER"].includes(userRole.toUpperCase());

  const initialTaskItems = useMemo(
    () => initialTasks.map((task) => normalizeTask(task, userId, userName)),
    [initialTasks, userId, userName],
  );

  const [tasks, setTasks] = useState<TaskItem[]>(initialTaskItems);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [formTitle, setFormTitle] = useState("");
  const [formDueDateTime, setFormDueDateTime] = useState("");
  const [formAssignedTo, setFormAssignedTo] = useState(userId);
  const [formPriority, setFormPriority] = useState("medium");
  const [formStatus, setFormStatus] = useState("open");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [taskError, setTaskError] = useState("");

  const weeks = useMemo(() => buildCalendar(currentYear, currentMonth), [currentMonth, currentYear]);

  const tasksByDay = useMemo(() => {
    return tasks.reduce<Record<string, number>>((acc, task) => {
      if (!task.dueDateTime) return acc;
      const day = getDayKey(task.dueDateTime);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {});
  }, [tasks]);

  const selectedDayTasks = useMemo(
    () => tasks.filter((task) => task.dueDateTime.startsWith(selectedDate)),
    [selectedDate, tasks],
  );

  const upcomingTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done" && task.dueDateTime),
    [tasks],
  );

  const urgentTasks = useMemo(
    () => upcomingTasks.filter((task) => {
      const due = new Date(task.dueDateTime);
      const diff = due.getTime() - new Date().getTime();
      return diff > 0 && diff <= 1000 * 60 * 60;
    }),
    [upcomingTasks],
  );

  const dailyAlertTasks = useMemo(
    () => upcomingTasks.filter((task) => {
      const due = new Date(task.dueDateTime);
      const diff = due.getTime() - new Date().getTime();
      return diff > 1000 * 60 * 60 && diff <= 1000 * 60 * 60 * 24;
    }),
    [upcomingTasks],
  );

  function resetForm() {
    setFormTitle("");
    setFormDueDateTime("");
    setFormAssignedTo(userId);
    setFormPriority("medium");
    setFormStatus("open");
    setEditingTaskId(null);
    setTaskError("");
  }

  async function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaskError("");
    if (!formTitle.trim()) {
      setTaskError("אנא מלא שם משימה.");
      return;
    }

    setIsSaving(true);
    const payload = {
      title: formTitle.trim(),
      due_date: formDueDateTime || null,
      assigned_to: isManager ? formAssignedTo : userId,
      priority: formPriority,
      status: formStatus,
      organization_id: organizationId,
    };

    if (editingTaskId) {
      const { error } = await supabase
        .from("tasks")
        .update(payload)
        .eq("id", editingTaskId)
        .eq("organization_id", organizationId);

      if (error) {
        console.error("UPDATE TASK ERROR:", error);
        setTaskError(`לא ניתן היה לעדכן את המשימה: ${error.message}`);
        setIsSaving(false);
        return;
      }

      setTasks((current) =>
        current.map((task) =>
          task.id === editingTaskId
            ? {
                ...task,
                title: payload.title,
                dueDateTime: payload.due_date || "",
                dueDateLabel: formatDueDate(payload.due_date),
                assignedTo: payload.assigned_to,
                assignedName:
                  employees.find((employee) => employee.id === payload.assigned_to)?.full_name || "עובד",
                priority: payload.priority,
                status: payload.status,
              }
            : task,
        ),
      );
      resetForm();
      setIsSaving(false);
      return;
    }

    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select(`
        id,
        title,
        status,
        priority,
        due_date,
        assigned_to,
        created_by,
        assignee:profiles!tasks_assigned_to_fkey(full_name),
        creator:profiles!tasks_created_by_fkey(full_name),
        created_at
      `)
      .single();

    if (error || !data) {
      console.error("ADD TASK ERROR:", error);
      setTaskError(`לא ניתן היה לשמור את המשימה: ${error?.message || "שגיאה"}`);
      setIsSaving(false);
      return;
    }

    setTasks((current) => [normalizeTask(data, userId, userName), ...current]);
    resetForm();
    setIsSaving(false);
  }

  async function removeTask(taskId: string) {
    if (!confirm("אתה בטוח שתרצה למחוק את המשימה?")) {
      return;
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("DELETE TASK ERROR:", error);
      setTaskError(`לא ניתן למחוק את המשימה: ${error.message}`);
      return;
    }

    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (editingTaskId === taskId) {
      resetForm();
    }
  }

  function startEdit(task: TaskItem) {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormDueDateTime(task.dueDateTime || "");
    setFormAssignedTo(task.assignedTo || userId);
    setFormPriority(task.priority || "medium");
    setFormStatus(task.status || "open");
    setTaskError("");
  }

  function getStatusBadge(task: TaskItem) {
    const dueStatus = getDueStatus(task);
    return dueStatus ? (
      <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: "#FEF3F2", color: RED }}>
        {dueStatus}
      </span>
    ) : (
      <span className="rounded-full px-2 py-1 text-[11px] font-semibold" style={{ background: "#E6F4EA", color: GREEN }}>
        {task.status === "done" ? "הושלמה" : "פעילה"}
      </span>
    );
  }

  const monthLabel = new Intl.DateTimeFormat("he-IL", {
    month: "long",
    year: "numeric",
  }).format(new Date(currentYear, currentMonth, 1));

  return (
    <main className="mx-auto max-w-[1440px] px-8 py-9">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="ff-serif text-3xl font-semibold" style={{ color: INK }}>
            ניהול משימות
          </h1>
          <p className="mt-2 text-sm" style={{ color: SLATE }}>
            כאן תוכל לראות משימות לפי חודש, לבחור יום ספציפי ולערוך את המשימות בהתאם.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCurrentMonth((value) => (value + 11) % 12);
              if (currentMonth === 0) {
                setCurrentYear((value) => value - 1);
              }
            }}
            className="dash-focusable rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: BORDER, color: INK, background: "#FFFFFF" }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentMonth((value) => (value + 1) % 12);
              if (currentMonth === 11) {
                setCurrentYear((value) => value + 1);
              }
            }}
            className="dash-focusable rounded-2xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: BORDER, color: INK, background: "#FFFFFF" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-[18px] bg-white p-6 shadow-[0_14px_40px_rgba(9,30,66,.06)]" style={{ border: `1px solid ${BORDER}` }}>
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold" style={{ color: INK }}>
                לוח חודשי
              </h2>
              <p className="mt-1 text-sm" style={{ color: SLATE }}>
                בחר יום כדי לראות את המשימות המתוזמנות עבורו.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold" style={{ color: INK }}>
              <span>{monthLabel}</span>
              <span className="rounded-full bg-[#F4F5FF] px-3 py-2">{tasks.length} משימות בחודש</span>
              <span className="rounded-full bg-[#F4F7EE] px-3 py-2">{dailyAlertTasks.length} קרובות ליום</span>
              <span className="rounded-full bg-[#FEF3F2] px-3 py-2">{urgentTasks.length} מתחילות בשעה הקרובה</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-1 text-right" style={{ borderCollapse: "separate" }}>
              <thead>
                <tr>
                  {DAY_NAMES.map((day) => (
                    <th key={day} className="py-2 text-xs font-semibold uppercase" style={{ color: SLATE }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, weekIndex) => (
                  <tr key={weekIndex}>
                    {week.map((date, dateIndex) => {
                      const dateKey = date ? date.toISOString().slice(0, 10) : null;
                      const hasTasks = dateKey ? tasksByDay[dateKey] : 0;
                      const isSelected = dateKey === selectedDate;
                      return (
                        <td key={dateIndex} className="align-top px-1 py-2">
                          {date ? (
                            <button
                              type="button"
                              onClick={() => setSelectedDate(dateKey!)}
                              className="dash-focusable w-full rounded-3xl border p-3 text-left"
                              style={{
                                borderColor: isSelected ? INDIGO : BORDER,
                                background: isSelected ? "#EEF3FF" : "#FFFFFF",
                                color: INK,
                                minHeight: "88px",
                              }}
                            >
                              <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                                <span>{date.getDate()}</span>
                                {hasTasks ? (
                                  <span className="rounded-full bg-[#EEF6FF] px-2 py-0.5 text-[11px] font-semibold" style={{ color: INDIGO }}>
                                    {hasTasks}
                                  </span>
                                ) : null}
                              </div>
                              <div className="mt-3 text-[11px] text-[#7A8292]">
                                {date.toLocaleDateString("he-IL", {
                                  weekday: "short",
                                })}
                              </div>
                            </button>
                          ) : (
                            <div style={{ minHeight: "88px" }} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-[18px] bg-[#F8FAFD] p-4">
            <h3 className="text-sm font-semibold" style={{ color: INK }}>
              משימות ביום {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("he-IL", { dateStyle: "medium" })}
            </h3>
            {selectedDayTasks.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: SLATE }}>
                עדיין אין משימות ביום זה.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {selectedDayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-[18px] border bg-white p-4"
                    style={{ borderColor: BORDER }}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: INK }}>
                          {task.title}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: SLATE }}>
                          {task.assignedName} · {task.priority}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {getStatusBadge(task)}
                        <span className="rounded-full bg-[#F5F7FF] px-3 py-1 text-[11px] font-semibold" style={{ color: INDIGO }}>
                          {task.dueDateLabel}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="dash-focusable inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-2 text-xs font-semibold"
                        style={{ color: INDIGO }}
                        onClick={() => startEdit(task)}
                      >
                        <Edit3 size={14} />
                        ערוך
                      </button>
                      <button
                        type="button"
                        className="dash-focusable inline-flex items-center gap-2 rounded-full bg-[#FEF3F2] px-3 py-2 text-xs font-semibold"
                        style={{ color: RED }}
                        onClick={() => removeTask(task.id)}
                      >
                        <Trash2 size={14} />
                        מחק
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[18px] bg-white p-6 shadow-[0_14px_40px_rgba(9,30,66,.06)]" style={{ border: `1px solid ${BORDER}` }}>
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold" style={{ color: INK }}>
                {editingTaskId ? "עריכת משימה" : "משימה חדשה"}
              </h2>
              <p className="mt-1 text-sm" style={{ color: SLATE }}>
                מלא נתונים, בחר את ההקצאה ולחץ שמור.
              </p>
            </div>
          </div>

          <form onSubmit={saveTask} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: INK }}>
                שם המשימה
              </label>
              <input
                type="text"
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: BORDER, color: INK }}
                placeholder="לדוגמה: לפנות ללקוח א׳"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium" style={{ color: INK }}>
                מועד התחלה
              </label>
              <input
                type="datetime-local"
                value={formDueDateTime}
                onChange={(event) => setFormDueDateTime(event.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                style={{ borderColor: BORDER, color: INK }}
              />
            </div>

            {isManager ? (
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: INK }}>
                  הקצה לעובד
                </label>
                <select
                  value={formAssignedTo}
                  onChange={(event) => setFormAssignedTo(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: BORDER, color: INK }}
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.full_name || "עובד"}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: INK }}>
                  עדיפות
                </label>
                <select
                  value={formPriority}
                  onChange={(event) => setFormPriority(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: BORDER, color: INK }}
                >
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium" style={{ color: INK }}>
                  סטטוס
                </label>
                <select
                  value={formStatus}
                  onChange={(event) => setFormStatus(event.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none"
                  style={{ borderColor: BORDER, color: INK }}
                >
                  <option value="open">פעילה</option>
                  <option value="done">הושלמה</option>
                </select>
              </div>
            </div>

            {taskError ? (
              <div className="rounded-2xl bg-[#FEF2F2] p-3 text-sm" style={{ color: RED }}>
                {taskError}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSaving}
                className="dash-focusable inline-flex items-center justify-center gap-2 rounded-2xl bg-[#EEF3FF] px-5 py-3 text-sm font-semibold"
                style={{ color: INDIGO }}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : null}
                {editingTaskId ? "שמור שינויים" : "צור משימה"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="dash-focusable inline-flex items-center justify-center rounded-2xl border border-[#E8EDF5] bg-white px-5 py-3 text-sm font-semibold"
                style={{ color: INK }}
              >
                נקה טופס
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="mt-8 rounded-[18px] bg-white p-6 shadow-[0_14px_40px_rgba(9,30,66,.06)]" style={{ border: `1px solid ${BORDER}` }}>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: INK }}>
              תזכורות חמות
            </h2>
            <p className="mt-1 text-sm" style={{ color: SLATE }}>
              משימות שמתחילות בשעה הקרובה או בתוך היום הקרוב.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[18px] bg-[#FEF3F2] p-5">
            <p className="text-sm font-semibold" style={{ color: RED }}>
              מתחיל בשעה הקרובה
            </p>
            {urgentTasks.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: SLATE }}>
                אין משימות דחופות לשעה הקרובה.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-[#3D172F]">
                {urgentTasks.map((task) => (
                  <li key={task.id} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{task.title}</span>
                      <span className="text-[11px] text-[#9C1C1C]">{task.dueDateLabel}</span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: SLATE }}>
                      {task.assignedName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-[18px] bg-[#EFF8EF] p-5">
            <p className="text-sm font-semibold" style={{ color: GREEN }}>
              מתקרב בתוך 24 שעות
            </p>
            {dailyAlertTasks.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: SLATE }}>
                אין משימות מתקרבות ליום הבא.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm text-[#153E1E]">
                {dailyAlertTasks.map((task) => (
                  <li key={task.id} className="rounded-2xl bg-white p-4" style={{ border: `1px solid ${BORDER}` }}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{task.title}</span>
                      <span className="text-[11px] text-[#196B2D]">{task.dueDateLabel}</span>
                    </div>
                    <p className="mt-1 text-xs" style={{ color: SLATE }}>
                      {task.assignedName}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
