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
};

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

const INK = "#1B1E2E";
const SLATE = "#6B7280";
const MUTE = "#9CA1B0";
const INDIGO = "#5B4FE8";
const TEAL = "#17A398";
const BORDER = "#ECEDF5";

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
  monthlyClients = DEFAULT_MONTHLY_CLIENTS,
  monthlyFees = DEFAULT_MONTHLY_FEES,
}: DashboardClientProps) {
  const supabase = createClient();

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [taskError, setTaskError] = useState("");

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
        assigned_to: userId,
        title: cleanTask,
        status: "open",
        priority: "medium",
      })
      .select(`
        id,
        title,
        status
      `)
      .single();

    if (error) {
      console.error("ADD TASK ERROR:", error);
      setTaskError(`לא ניתן היה לשמור את המשימה: ${error.message}`);
      setIsAddingTask(false);
      return;
    }

    const createdTask: Task = {
      id: data.id,
      label: data.title,
      done: data.status === "done",
    };

    setTasks((currentTasks) => [createdTask, ...currentTasks]);
    setNewTask("");
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
      console.error("UPDATE TASK ERROR:", error);
      setTaskError(`לא ניתן היה לעדכן את המשימה: ${error.message}`);
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

    setActiveTaskId(null);
  }

  async function removeTask(taskId: string) {
    if (activeTaskId) {
      return;
    }

    setActiveTaskId(taskId);
    setTaskError("");

    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("DELETE TASK ERROR:", error);
      setTaskError(`לא ניתן היה למחוק את המשימה: ${error.message}`);
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
            + משימה חדשה
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

              <span className="text-xs font-medium" style={{ color: MUTE }}>
                {tasks.filter((task) => !task.done).length} פתוחות
              </span>
            </div>

            <div
              className="bg-white p-2"
              style={{
                borderRadius: "16px",
                border: `1px solid ${BORDER}`,
              }}
            >
              {tasks.length === 0 ? (
                <div
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: MUTE }}
                >
                  עדיין אין משימות.
                </div>
              ) : (
                tasks.map((task) => {
                  const isLoading = activeTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      className="dash-task flex items-center gap-2 rounded-xl px-3 py-2"
                    >
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
                          className="text-sm"
                          style={{
                            color: task.done ? MUTE : INK,
                            textDecoration: task.done
                              ? "line-through"
                              : "none",
                          }}
                        >
                          {task.label}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() => removeTask(task.id)}
                        className="dash-focusable flex h-8 w-8 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ color: MUTE }}
                        aria-label="מחיקת משימה"
                      >
                        <X size={15} />
                      </button>
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
