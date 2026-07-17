"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DashboardShell } from "../components/dashboard-shell";
import {
  BarChart3,
  ClipboardList,
  PackageOpen,
  Boxes,
  CreditCard,
  ChevronLeft,
  Users,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CheckCircle2,
  Circle,
  X,
} from "lucide-react";

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

type DashboardClientProps = {
  userName: string;
  userRole: string;
  activeClientsCount: number;
  recentClients: RecentClient[];

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
const BORDER = "#ECEDF5";

const ACTION_CARDS = [
  {
    title: "דוחות",
    href: "/reports",
    desc: "מעקב דוחות, הזמנות, ייצוא ועוד",
    stat: "מעבר לדוחות",
    icon: ClipboardList,
    gradient: "linear-gradient(135deg, #4C46D6, #7A72F0)",
  },
  {
    title: "דיווח שנתי",
    href: "/reports/yearly",
    desc: "הגשת דוחות, הצהרות הון, עדכונים ועוד",
    stat: "מעבר לדיווח שנתי",
    icon: PackageOpen,
    gradient: "linear-gradient(135deg, #0E8C82, #4FCFC0)",
  },
  {
    title: "דיווח שוטף",
    href: "/reports/monthly",
    desc: "מעקב לקוחות, עדכונים, דיווחים ועוד",
    stat: "מעבר לדיווח שוטף",
    icon: Boxes,
    gradient: "linear-gradient(135deg, #2454C7, #4C82EE)",
  },
  {
    title: "תשלומים",
    href: "/payments",
    desc: "מעקב תשלומים, יצירת תשלום, צ׳קים ועוד",
    stat: "מעבר לתשלומים",
    icon: CreditCard,
    gradient: "linear-gradient(135deg, #16244D, #2F4F9E)",
  },
];

export default function DashboardClient({
  userName,
  userRole,
  organization,
  recentClients,
  activeClientsCount,
}: DashboardClientProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState("");

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanTask = newTask.trim();

    if (!cleanTask) {
      return;
    }

    setTasks((currentTasks) => [
      {
        id: crypto.randomUUID(),
        label: cleanTask,
        done: false,
      },
      ...currentTasks,
    ]);

    setNewTask("");
    setShowTaskForm(false);
  }

  function toggleTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              done: !task.done,
            }
          : task,
      ),
    );
  }

  function removeTask(taskId: string) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
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
            onClick={() => setShowTaskForm(true)}
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
              onChange={(event) => setNewTask(event.target.value)}
              placeholder="כתוב את המשימה החדשה..."
              className="min-w-[250px] flex-1 rounded-xl px-4 py-3 text-sm outline-none"
              style={{
                border: `1px solid ${BORDER}`,
                color: INK,
              }}
            />

            <button
              type="submit"
              className="rounded-xl px-5 py-3 text-sm font-semibold text-white"
              style={{ background: INDIGO }}
            >
              הוספה
            </button>

            <button
              type="button"
              onClick={() => {
                setShowTaskForm(false);
                setNewTask("");
              }}
              className="rounded-xl px-5 py-3 text-sm font-semibold"
              style={{
                color: SLATE,
                border: `1px solid ${BORDER}`,
              }}
            >
              ביטול
            </button>
          </form>
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

        {/* כרטיסי פעולה */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ACTION_CARDS.map(
            ({ title, href, desc, stat, icon: Icon, gradient }) => (
              <Link
                key={title}
                href={href}
                className="dash-card dash-focusable block overflow-hidden bg-white"
                style={{
                  borderRadius: "18px",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <div
                  className="relative flex h-36 items-center justify-center"
                  style={{ background: gradient }}
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      background: "rgba(255,255,255,0.16)",
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  >
                    <Icon size={26} color="#FFFFFF" strokeWidth={1.6} />
                  </div>

                  <span
                    className="absolute bottom-3 right-3 px-2.5 py-1 text-[11px] font-medium text-white"
                    style={{
                      background: "rgba(0,0,0,0.18)",
                      borderRadius: "999px",
                    }}
                  >
                    {stat}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold" style={{ color: INK }}>
                      {title}
                    </h3>

                    <ChevronLeft size={15} style={{ color: MUTE }} />
                  </div>

                  <p
                    className="mt-1.5 text-sm leading-6"
                    style={{ color: SLATE }}
                  >
                    {desc}
                  </p>
                </div>
              </Link>
            ),
          )}
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
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="dash-task flex items-center gap-2 rounded-xl px-3 py-2"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="dash-focusable flex flex-1 items-center gap-3 rounded-xl py-1 text-right"
                    >
                      {task.done ? (
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
                      onClick={() => removeTask(task.id)}
                      className="dash-focusable flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ color: MUTE }}
                      aria-label="מחיקת משימה"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))
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