"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DashboardShell } from "../components/dashboard-shell";
import {
  BarChart3,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CheckCircle2,
  BellRing,
  History,
  Circle,
  X,
  Loader2,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
// MiniCalendar kept for /tasks page only; removed from dashboard home

type RecentClient = {
  id: string;
  first_name: string;
  last_name: string;
  business_name: string | null;
  status: string | null;
  updated_at: string | null;
};

type Task = {
  id: string;
  label: string;
  done: boolean;
  dueDate: string | null;
  assignedTo: string | null;
  assignedName: string;
  creatorName: string;
};

type Employee = { id: string; full_name: string | null; role: string | null };

type TaskHistory = { id: string; task_id: string | null; task_title: string; action: string; details: string | null; created_at: string; profiles: { full_name: string | null } | { full_name: string | null }[] | null };

// נתוני התרשימים - יש לחבר בהמשך למקור נתונים אמיתי (טבלת לקוחות / תשלומים לפי חודש)
type MonthlyClientsPoint = {
  month: string;
  clients: number;
};

type MonthlyFeesPoint = {
  month: string;
  fees: number;
};

type DashboardClientProps = {
  userId: string;
  organizationId: string;
  userName: string;
  userRole: string;
  activeClientsCount: number;
  recentClients: RecentClient[];
  initialTasks: Task[];
  initialTaskHistory: TaskHistory[];
  employees: Employee[];
  monthlyClients?: MonthlyClientsPoint[];
  monthlyFees?: MonthlyFeesPoint[];

  organization: {
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    businessNumber: string | null;
    logoUrl: string | null;
  };
};

const INK = "#0B2348";
const SLATE = "#65738B";
const MUTE = "#94A0B3";
const INDIGO = "#C99B2D";
const TEAL = "#1F7893";
const BORDER = "#E8EDF5";

function safeName(value: string | null | undefined, fallback: string) {
  const name = value?.trim();
  return name && !["undefined", "null"].includes(name.toLowerCase()) ? name : fallback;
}

const actionLabels: Record<string, string> = {
  created: "נוצרה",
  completed: "הושלמה",
  reopened: "נפתחה מחדש",
  updated: "עודכנה",
  deleted: "נמחקה",
};

function getPerformedByName(entry: TaskHistory) {
  const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
  return safeName(profile?.full_name ?? null, "משתמש");
}

function getActivitySummary(entry: TaskHistory) {
  return `${actionLabels[entry.action] || entry.action} ${entry.task_title}`;
}

// נתוני ברירת מחדל להדגמה - להחליף בנתונים אמיתיים כשיהיה מקור נתונים
const DEFAULT_MONTHLY_CLIENTS: MonthlyClientsPoint[] = [
  { month: "פבר׳", clients: 18 },
  { month: "מרץ", clients: 22 },
  { month: "אפר׳", clients: 27 },
  { month: "מאי", clients: 31 },
  { month: "יוני", clients: 36 },
  { month: "יולי", clients: 42 },
];

const DEFAULT_MONTHLY_FEES: MonthlyFeesPoint[] = [
  { month: "פבר׳", fees: 14200 },
  { month: "מרץ", fees: 16800 },
  { month: "אפר׳", fees: 15600 },
  { month: "מאי", fees: 19300 },
  { month: "יוני", fees: 21100 },
  { month: "יולי", fees: 24500 },
];

export default function DashboardClient({
  userId,
  organizationId,
  userName,
  userRole,
  organization,
  recentClients,
  activeClientsCount,
  initialTasks,
  initialTaskHistory,
  employees,
  monthlyClients = DEFAULT_MONTHLY_CLIENTS,
  monthlyFees = DEFAULT_MONTHLY_FEES,
}: DashboardClientProps) {
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState(userId);
  const [taskHistory, setTaskHistory] = useState<TaskHistory[]>(initialTaskHistory);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskError, setTaskError] = useState("");
  const isManager = ["ADMIN", "MANAGER"].includes(userRole.toUpperCase());
  const [activityLog, setActivityLog] = useState<TaskHistory[]>(initialTaskHistory.slice(0, 10));
  const [showActivityLog, setShowActivityLog] = useState(true);

  // removed today tasks and activity log from dashboard home per request

  async function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTask = newTask.trim();

    if (!cleanTask || isAddingTask) {
      return;
    }

    setIsAddingTask(true);
    setTaskError("");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        organization_id: organizationId,
        assigned_to: isManager ? newTaskAssignee : userId,
        created_by: userId,
        title: cleanTask,
        status: "open",
        priority: "medium",
        due_date: newTaskDueDate || null,
      })
      .select(`
        id,
        title,
        status
        ,due_date,
        assigned_to
      `)
      .single();

    if (error) {
      const e: any = error;
      const info = {
        message: e?.message ?? e?.error ?? null,
        details: e?.details ?? null,
        hint: e?.hint ?? null,
        code: e?.code ?? null,
        status: e?.status ?? null,
      };
      console.error("ADD TASK ERROR:", info);
      setTaskError(`לא ניתן היה לשמור את המשימה: ${info.message ?? "שגיאת שרת"}`);
      setIsAddingTask(false);
      return;
    }

    const createdTask: Task = {
      id: data.id,
      label: data.title,
      done: data.status === "done",
      dueDate: data.due_date,
      assignedTo: data.assigned_to,
      assignedName: safeName(employees.find((employee) => employee.id === data.assigned_to)?.full_name, "עובד"),
      creatorName: safeName(userName, "מנהל המשרד"),
    };

    const assigneeName = safeName(employees.find((employee) => employee.id === data.assigned_to)?.full_name, "עובד");
    const historyDetails = [`הוקצתה ל: ${assigneeName}`, newTaskDueDate ? `תאריך יעד: ${newTaskDueDate}` : null].filter(Boolean).join(" · ");
    const { data: historyEntry } = await supabase.from("task_history").insert({ organization_id: organizationId, task_id: data.id, task_title: cleanTask, action: "created", details: historyDetails, performed_by: userId }).select("id, task_id, task_title, action, details, created_at, profiles!task_history_performed_by_fkey(full_name)").single();
    if (historyEntry) {
      setTaskHistory((current) => [historyEntry, ...current]);
      setActivityLog((current) => [historyEntry, ...current].slice(0, 10));
    }

    setTasks((currentTasks) => [createdTask, ...currentTasks]);
    setNewTask("");
    setNewTaskDueDate("");
    setShowTaskForm(false);
    setIsAddingTask(false);
  }

  async function toggleTask(task: Task) {
    if (activeTaskId) {
      return;
    }

    setActiveTaskId(task.id);
    setTaskError("");

    const nextDoneValue = !task.done;
    const nextStatus = nextDoneValue ? "done" : "open";

    const { error } = await supabase
      .from("tasks")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id)
      .eq("organization_id", organizationId);

    if (error) {
        const e: any = error;
        const info = {
          message: e?.message ?? e?.error ?? null,
          details: e?.details ?? null,
          hint: e?.hint ?? null,
          code: e?.code ?? null,
          status: e?.status ?? null,
        };
        console.error("UPDATE TASK ERROR:", info);
        setTaskError(`לא ניתן היה לעדכן את המשימה: ${info.message ?? "שגיאת שרת"}`);
      setActiveTaskId(null);
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.map((currentTask) =>
        currentTask.id === task.id
          ? {
              ...currentTask,
              done: nextDoneValue,
            }
          : currentTask,
      ),
    );

    const action = nextDoneValue ? "completed" : "reopened";
    const { data: historyEntry } = await supabase.from("task_history").insert({ organization_id: organizationId, task_id: task.id, task_title: task.label, action, performed_by: userId }).select("id, task_id, task_title, action, details, created_at, profiles!task_history_performed_by_fkey(full_name)").single();
    if (historyEntry) {
      setTaskHistory((current) => [historyEntry, ...current]);
      setActivityLog((current) => [historyEntry, ...current].slice(0, 10));
    }

    setActiveTaskId(null);
  }

  async function removeTask(taskId: string) {
    if (activeTaskId) {
      return;
    }

    setActiveTaskId(taskId);
    setTaskError("");

    const task = tasks.find((item) => item.id === taskId);
    if (task) {
      const { data: historyEntry } = await supabase.from("task_history").insert({ organization_id: organizationId, task_id: task.id, task_title: task.label, action: "deleted", performed_by: userId }).select("id, task_id, task_title, action, details, created_at, profiles!task_history_performed_by_fkey(full_name)").single();
      if (historyEntry) {
        setTaskHistory((current) => [{ ...historyEntry, task_id: null }, ...current]);
        setActivityLog((current) => [{ ...historyEntry, task_id: null }, ...current].slice(0, 10));
      }
    }

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("organization_id", organizationId);

    if (error) {
        const e: any = error;
        const info = {
          message: e?.message ?? e?.error ?? null,
          details: e?.details ?? null,
          hint: e?.hint ?? null,
          code: e?.code ?? null,
          status: e?.status ?? null,
        };
        console.error("DELETE TASK ERROR:", info);
        setTaskError(`לא ניתן היה למחוק את המשימה: ${info.message ?? "שגיאת שרת"}`);
      setActiveTaskId(null);
      return;
    }

    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );

    setActiveTaskId(null);
  }

  function isClientActive(status: string | null) {
    return status?.toLowerCase() === "active";
  }

  const KPIS = [
    {
      label: "לקוחות פעילים",
      value: activeClientsCount.toString(),
      delta: "",
      up: true,
      icon: Users,
      tint: INDIGO,
    },
    {
      label: "דוחות פתוחים",
      value: "0",
      delta: "",
      up: false,
      icon: FileText,
      tint: "#17A398",
    },
    {
      label: "תשלומים ממתינים",
      value: "₪0",
      delta: "",
      up: true,
      icon: Wallet,
      tint: "#E2A83B",
    },
    {
      label: "הכנסה חודשית",
      value: "₪0",
      delta: "",
      up: true,
      icon: BarChart3,
      tint: "#D4568C",
    },
  ];

  const clientsGrowthPercent =
    monthlyClients.length > 1 && monthlyClients[0].clients > 0
      ? Math.round(
          ((monthlyClients[monthlyClients.length - 1].clients -
            monthlyClients[0].clients) /
            monthlyClients[0].clients) *
            100,
        )
      : 0;

  const latestFees = monthlyFees[monthlyFees.length - 1]?.fees ?? 0;
  const previousFees =
    monthlyFees[monthlyFees.length - 2]?.fees ?? latestFees;
  const feesGrowthPercent =
    previousFees > 0
      ? Math.round(((latestFees - previousFees) / previousFees) * 100)
      : 0;

  return (
    <DashboardShell userName={userName}>
      <main className="mx-auto max-w-[1440px] px-8 py-9">
        {/* ברכה */}
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1
              className="ff-serif text-3xl font-semibold"
              style={{ color: INK }}
            >
              שלום, {userName}
            </h1>

            <p className="mt-2 text-sm" style={{ color: SLATE }}>
              {organization.name}
              {userRole
                ? ` · ${
                    userRole.toUpperCase() === "ADMIN"
                      ? "מנהל משרד"
                      : "עובד משרד"
                  }`
                : ""}
            </p>

            <p className="mt-2 text-sm" style={{ color: SLATE }}>
              ברוכים הבאים למרכז העסק שלך.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setTaskError("");
              setShowTaskForm(true);
            }}
            className="dash-focusable px-5 py-3 text-sm font-semibold text-white"
            style={{
              background: INDIGO,
              borderRadius: "12px",
              boxShadow: "0 10px 24px -10px rgba(91,79,232,0.55)",
            }}
          >
            {isManager ? "+ משימה חדשה לעובד" : "+ משימה חדשה לעצמי"}
          </button>
        </div>

        {/* טופס משימה חדשה */}
        {showTaskForm && (
          <form
            onSubmit={addTask}
            className="mb-8 flex flex-wrap items-center gap-3 bg-white p-5"
            style={{
              borderRadius: "16px",
              border: `1px solid ${BORDER}`,
            }}
          >
            <input
              autoFocus
              type="text"
              value={newTask}
              disabled={isAddingTask}
              onChange={(event) => setNewTask(event.target.value)}
              placeholder="כתוב את המשימה החדשה..."
              className="min-w-[250px] flex-1 rounded-xl px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                border: `1px solid ${BORDER}`,
                color: INK,
              }}
            />

            <label className="flex min-w-[210px] items-center gap-2 rounded-xl px-3 py-2" style={{ border: `1px solid ${BORDER}`, color: SLATE }}>
              <BellRing size={16} />
              <span className="sr-only">תאריך תזכורת</span>
              <input type="date" value={newTaskDueDate} disabled={isAddingTask} onChange={(event) => setNewTaskDueDate(event.target.value)} className="w-full bg-transparent text-sm outline-none" aria-label="תאריך תזכורת" />
            </label>

            {isManager && <label className="flex min-w-[220px] items-center gap-2 rounded-xl px-3 py-2" style={{ border: `1px solid ${BORDER}`, color: SLATE }}>
              <Users size={16} />
              <span className="sr-only">הקצאה לעובד</span>
              <select value={newTaskAssignee} disabled={isAddingTask} onChange={(event) => setNewTaskAssignee(event.target.value)} className="w-full bg-transparent text-sm outline-none" aria-label="הקצאה לעובד" required>
                {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.full_name || "עובד ללא שם"}{employee.id === userId ? " (אני)" : ""}</option>)}
              </select>
            </label>}

            <button
              type="submit"
              disabled={isAddingTask || !newTask.trim()}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: INDIGO }}
            >
              {isAddingTask && (
                <Loader2 size={16} className="animate-spin" />
              )}

              {isAddingTask ? "שומר..." : "הוספה"}
            </button>

            <button
              type="button"
              disabled={isAddingTask}
              onClick={() => {
                setShowTaskForm(false);
                setNewTask("");
                setNewTaskDueDate("");
                setTaskError("");
              }}
              className="rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                color: SLATE,
                border: `1px solid ${BORDER}`,
              }}
            >
              ביטול
            </button>
          </form>
        )}

        {taskError && (
          <div
            className="mb-8 rounded-xl px-4 py-3 text-sm"
            style={{
              background: "#FEF2F2",
              border: "1px solid #FECACA",
              color: "#B91C1C",
            }}
          >
            {taskError}
          </div>
        )}

        {/* פרטי משרד */}
        <div
          className="mb-8 grid gap-4 bg-white p-5 md:grid-cols-2 lg:grid-cols-4"
          style={{
            borderRadius: "16px",
            border: `1px solid ${BORDER}`,
          }}
        >
          <div>
            <p className="text-xs" style={{ color: MUTE }}>
              שם המשרד
            </p>

            <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>
              {organization.name}
            </p>
          </div>

          <div>
            <p className="text-xs" style={{ color: MUTE }}>
              אימייל המשרד
            </p>

            <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>
              {organization.email || "לא הוגדר"}
            </p>
          </div>

          <div>
            <p className="text-xs" style={{ color: MUTE }}>
              טלפון
            </p>

            <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>
              {organization.phone || "לא הוגדר"}
            </p>
          </div>

          <div>
            <p className="text-xs" style={{ color: MUTE }}>
              כתובת
            </p>

            <p className="mt-1 text-sm font-semibold" style={{ color: INK }}>
              {organization.address || "לא הוגדרה"}
            </p>
          </div>
        </div>

        {/* today tasks and small mini-calendar removed from dashboard home per request */}

        {/* יומן פעילות */}
        <section
          className="mb-6 rounded-[18px] bg-white p-5 shadow-[0_14px_40px_rgba(9,30,66,.06)]"
          style={{ border: `1px solid ${BORDER}` }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold" style={{ color: INK }}>
                יומן פעילות
              </h2>
              <p className="mt-1 text-sm" style={{ color: SLATE }}>
                המעדכן האחרון של הפעולות של העובדים בדשבורד.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowActivityLog((value) => !value)}
              className="dash-focusable rounded-xl px-4 py-2 text-sm font-semibold"
              style={{
                color: INDIGO,
                background: "#F1F3FF",
              }}
            >
              {showActivityLog ? "הסתר יומן" : "הצג יומן"}
            </button>
          </div>

          {showActivityLog ? (
            <div className="space-y-3">
              {activityLog.length === 0 ? (
                <div className="rounded-2xl bg-[#F4F4FF] p-4 text-sm" style={{ color: MUTE }}>
                  עדיין לא בוצעו פעולות יומן.
                </div>
              ) : (
                activityLog.map((entry) => {
                  const entryAction = getActivitySummary(entry);
                  return (
                    <div key={entry.id} className="rounded-2xl border p-4" style={{ borderColor: BORDER }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: INK }}>
                            {entryAction}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: SLATE }}>
                            על ידי {getPerformedByName(entry)}
                          </p>
                        </div>
                        <time className="shrink-0 text-[11px]" style={{ color: MUTE }}>
                          {new Intl.DateTimeFormat("he-IL", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(entry.created_at))}
                        </time>
                      </div>
                      {entry.details ? (
                        <p className="mt-3 text-sm" style={{ color: SLATE }}>
                          {entry.details}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </section>

        {/* מדדים */}
        <div className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map(({ label, value, delta, up, icon: Icon, tint }) => (
            <div
              key={label}
              className="dash-kpi bg-white p-5"
              style={{
                borderRadius: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center"
                  style={{
                    background: `${tint}1A`,
                    color: tint,
                    borderRadius: "10px",
                  }}
                >
                  <Icon size={18} />
                </div>

                {delta && (
                  <span
                    className="flex items-center gap-0.5 text-xs font-semibold"
                    style={{
                      color: up ? "#1E7B3B" : "#B8720B",
                    }}
                  >
                    {up ? (
                      <ArrowUpRight size={13} />
                    ) : (
                      <ArrowDownRight size={13} />
                    )}

                    {delta}
                  </span>
                )}
              </div>

              <p className="mt-4 text-2xl font-bold" style={{ color: INK }}>
                {value}
              </p>

              <p className="mt-1 text-xs" style={{ color: SLATE }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* תרשימים - עליית מספר הלקוחות ושכר טרחה */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* עליית מספר הלקוחות */}
          <div
            className="bg-white p-6"
            style={{
              borderRadius: "18px",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold" style={{ color: INK }}>
                  עליית מספר הלקוחות
                </h3>

                <p className="mt-1 text-xs" style={{ color: SLATE }}>
                  מספר לקוחות לפי חודש
                </p>
              </div>

              <div
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderRadius: "999px",
                  background: "#E6F4EA",
                  color: "#1E7B3B",
                }}
              >
                <TrendingUp size={13} />
                {clientsGrowthPercent >= 0 ? "+" : ""}
                {clientsGrowthPercent}%
              </div>
            </div>

            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={monthlyClients}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={BORDER}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: MUTE }}
                    axisLine={{ stroke: BORDER }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: MUTE }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: `1px solid ${BORDER}`,
                      fontSize: "12px",
                    }}
formatter={(value) => [
  value == null ? "0" : String(value),
  "לקוחות",
]}                  />
                  <Line
                    type="monotone"
                    dataKey="clients"
                    stroke={INDIGO}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: INDIGO }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* שכר טרחה */}
          <div
            className="bg-white p-6"
            style={{
              borderRadius: "18px",
              border: `1px solid ${BORDER}`,
            }}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold" style={{ color: INK }}>
                  שכר טרחה
                </h3>

                <p className="mt-1 text-xs" style={{ color: SLATE }}>
                  הכנסה משכר טרחה לפי חודש
                </p>
              </div>

              <div
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold"
                style={{
                  borderRadius: "999px",
                  background: feesGrowthPercent >= 0 ? "#E6F4EA" : "#FEF3E2",
                  color: feesGrowthPercent >= 0 ? "#1E7B3B" : "#B8720B",
                }}
              >
                {feesGrowthPercent >= 0 ? (
                  <ArrowUpRight size={13} />
                ) : (
                  <ArrowDownRight size={13} />
                )}
                {feesGrowthPercent >= 0 ? "+" : ""}
                {feesGrowthPercent}%
              </div>
            </div>

            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <BarChart data={monthlyFees}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={BORDER}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: MUTE }}
                    axisLine={{ stroke: BORDER }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: MUTE }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                    tickFormatter={(value: number) =>
                      `₪${Math.round(value / 1000)}K`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "10px",
                      border: `1px solid ${BORDER}`,
                      fontSize: "12px",
                    }}
formatter={(value) => {
  const numericValue =
    typeof value === "number"
      ? value
      : Number(value ?? 0);

  return [
    `₪${numericValue.toLocaleString("he-IL")}`,
    "שכר טרחה",
  ];
}}
                  />
                  <Bar dataKey="fees" fill={TEAL} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* לקוחות ומשימות */}
        <div className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* לקוחות */}
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: INK }}>
                לקוחות אחרונים
              </h2>

              <Link
                href="/clients"
                className="dash-link dash-focusable flex items-center gap-1 text-sm font-medium"
                style={{ color: INDIGO }}
              >
                לצפייה בכל הלקוחות
                <ChevronLeft size={15} />
              </Link>
            </div>

            <div
              className="bg-white"
              style={{
                borderRadius: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              {recentClients.length === 0 ? (
                <div
                  className="px-6 py-10 text-center text-sm"
                  style={{ color: MUTE }}
                >
                  עדיין אין לקוחות במשרד הזה.
                </div>
              ) : (
                recentClients.map((client, index) => {
                  const fullName =
                    `${client.first_name || ""} ${
                      client.last_name || ""
                    }`.trim() || "לקוח";

                  const displayName = client.business_name || fullName;
                  const active = isClientActive(client.status);

                  return (
                    <div
                      key={client.id}
                      className="dash-row flex items-center justify-between px-6 py-4"
                      style={{
                        borderTop:
                          index !== 0 ? `1px solid ${BORDER}` : "none",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                          style={{ background: INDIGO }}
                        >
                          {displayName.slice(0, 1)}
                        </div>

                        <div>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: INK }}
                          >
                            {displayName}
                          </p>

                          <p className="text-xs" style={{ color: MUTE }}>
                            {client.business_name ? fullName : "לקוח פרטי"}
                          </p>
                        </div>
                      </div>

                      <span
                        className="px-3 py-1 text-xs font-medium"
                        style={{
                          borderRadius: "999px",
                          background: active ? "#E6F4EA" : "#FEF3E2",
                          color: active ? "#1E7B3B" : "#B8720B",
                        }}
                      >
                        {active ? "פעיל" : "לא פעיל"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* משימות */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: INK }}>
                משימות קרובות
              </h2>

              <button type="button" onClick={() => setShowTaskHistory((value) => !value)} className="dash-focusable flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium" style={{ color: INDIGO, background: "#EFEEFF" }}><History size={13} />{showTaskHistory ? "משימות" : "היסטוריה"}</button>
            </div>

            <div
              className="bg-white p-2"
              style={{
                borderRadius: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              {showTaskHistory ? (
                taskHistory.length === 0 ? <div className="px-4 py-10 text-center text-sm" style={{ color: MUTE }}>עדיין אין היסטוריית משימות.</div> : taskHistory.slice(0, 12).map((entry) => {
                  const actionLabels: Record<string, string> = { created: "נוצרה", completed: "הושלמה", reopened: "נפתחה מחדש", updated: "עודכנה", deleted: "נמחקה" };
                  const profile = Array.isArray(entry.profiles) ? entry.profiles[0] : entry.profiles;
                  return <div key={entry.id} className="border-b px-3 py-3 last:border-0" style={{ borderColor: BORDER }}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium" style={{ color: INK }}>{entry.task_title}</p><p className="mt-1 text-xs" style={{ color: SLATE }}>{actionLabels[entry.action] || entry.action}{profile?.full_name ? ` · ${profile.full_name}` : ""}</p></div><time className="shrink-0 text-[10px]" style={{ color: MUTE }}>{new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" }).format(new Date(entry.created_at))}</time></div>{entry.details && <p className="mt-1 text-[11px]" style={{ color: MUTE }}>{entry.details}</p>}</div>;
                })
              ) : tasks.length === 0 ? (
                <div
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: MUTE }}
                >
                  עדיין אין משימות.
                </div>
              ) : (
                tasks.map((task) => {
                  const isLoading = activeTaskId === task.id;
                  const isOverdue = Boolean(
                    task.dueDate &&
                    !task.done &&
                    task.dueDate < new Date().toISOString().slice(0, 10),
                  );

                  return (
                    <div
                      key={task.id}
                      className="dash-task flex items-center gap-2 rounded-xl px-3 py-2 transition-all"
                      style={isOverdue ? {
                        color: "#B42335",
                        background: "linear-gradient(90deg, #FFF1F3, #FFF7F8)",
                        border: "1px solid #F3AAB5",
                        boxShadow: "0 0 0 3px rgba(220, 70, 91, .08), 0 6px 16px rgba(180, 35, 53, .08)",
                      } : { border: "1px solid transparent" }}
                    >
                      {isOverdue && <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#D92D48] shadow-[0_0_0_4px_rgba(217,45,72,.14)]" aria-label="משימה באיחור" />}
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => toggleTask(task)}
                        className="dash-focusable flex flex-1 items-center gap-3 rounded-xl py-1 text-right disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? (
                          <Loader2
                            size={18}
                            className="animate-spin"
                            style={{ color: INDIGO }}
                          />
                        ) : task.done ? (
                          <CheckCircle2
                            size={18}
                            style={{ color: INDIGO }}
                          />
                        ) : (
                          <Circle size={18} style={{ color: MUTE }} />
                        )}

                        <span
                          className="min-w-0 flex-1 text-sm"
                          style={{
                            color: task.done ? MUTE : isOverdue ? "#A9283C" : INK,
                            textDecoration: task.done
                              ? "line-through"
                              : "none",
                          }}
                        >
                          <span className="block truncate">{task.label}</span>
                          <span className="mt-1 block text-[10px] font-medium" style={{ color: MUTE }}>{isManager ? `עבור: ${safeName(task.assignedName, "עובד")}` : `מאת: ${safeName(task.creatorName, "מנהל המשרד")}`}</span>
                          {task.dueDate && <span className="mt-1 flex items-center gap-1 text-[10px] font-medium" style={{ color: !task.done && task.dueDate <= new Date().toISOString().slice(0, 10) ? "#C0263D" : MUTE }}><BellRing size={11} className={isOverdue ? "animate-pulse" : ""} />{new Intl.DateTimeFormat("he-IL").format(new Date(`${task.dueDate}T00:00:00`))}{isOverdue ? " · באיחור" : !task.done && task.dueDate === new Date().toISOString().slice(0, 10) ? " · תזכורת להיום" : ""}</span>}
                        </span>
                      </button>

                      {isManager && <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => removeTask(task.id)}
                        className="dash-focusable flex h-8 w-8 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ color: MUTE }}
                        aria-label="מחיקת משימה"
                      >
                        <X size={15} />
                      </button>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <footer
        className="mx-auto max-w-[1440px] px-8 py-8 text-xs"
        style={{ color: MUTE }}
      >
        © כל הזכויות שמורות ל־{organization.name} 2026
      </footer>
    </DashboardShell>
  );
}
