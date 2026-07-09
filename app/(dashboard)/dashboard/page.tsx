"use client";
import { useState } from "react";
import { DashboardShell } from "../components/dashboard-shell";

import {
  BarChart3,
  UserCog,
  ClipboardList,
  PackageOpen,
  Boxes,
  CreditCard,
  ChevronLeft,
  Home,
  Users,
  FileText,
  Settings,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CheckCircle2,
  Circle,
  MoreHorizontal,
} from "lucide-react";

const INK = "#1B1E2E";
const SLATE = "#6B7280";
const MUTE = "#9CA1B0";
const NAVY_STRIP = "#232A4A";
const INDIGO = "#5B4FE8";
const INDIGO_SOFT = "#EEECFD";
const BORDER = "#ECEDF5";

const SIDE_NAV = [
  { icon: Home, label: "ראשי", active: true },
  { icon: Users, label: "לקוחות" },
  { icon: FileText, label: "דוחות" },
  { icon: Settings, label: "הגדרות" },
];

const KPIS = [
  { label: "לקוחות פעילים", value: "312", delta: "+4.2%", up: true, icon: Users, tint: INDIGO },
  { label: "דוחות פתוחים", value: "18", delta: "-2", up: false, icon: FileText, tint: "#17A398" },
  { label: "תשלומים ממתינים", value: "₪42,180", delta: "+6", up: true, icon: Wallet, tint: "#E2A83B" },
  { label: "הכנסה חודשית", value: "₪186,400", delta: "+11.5%", up: true, icon: BarChart3, tint: "#D4568C" },
];

const ACTION_CARDS = [
  {
    title: "דוחות",
    desc: "מעקב דוחות, הזמנות, ייצוא ועוד",
    stat: "48 דוחות פעילים",
    icon: ClipboardList,
    gradient: "linear-gradient(135deg, #4C46D6, #7A72F0)",
  },
  {
    title: "דיווח שנתי",
    desc: "הגשת דוחות, הצהרות הון, עדכונים ועוד",
    stat: "3 ממתינים להגשה",
    icon: PackageOpen,
    gradient: "linear-gradient(135deg, #0E8C82, #4FCFC0)",
  },
  {
    title: "דיווח שוטף",
    desc: "מעקב לקוחות, עדכונים, דיווחים ועוד",
    stat: "112 עודכנו החודש",
    icon: Boxes,
    gradient: "linear-gradient(135deg, #2454C7, #4C82EE)",
  },
  {
    title: "תשלומים",
    desc: "מעקב תשלומים, יצירת תשלום, צ׳יקים ועוד",
    stat: "₪42,180 ממתין",
    icon: CreditCard,
    gradient: "linear-gradient(135deg, #16244D, #2F4F9E)",
  },
];

const CLIENTS = [
  { name: "רהיטי דוד בע״מ", detail: "עודכן לפני 2 שעות", status: "פעיל", color: "#5B4FE8" },
  { name: "קפה נטו", detail: "עודכן אתמול", status: "פעיל", color: "#17A398" },
  { name: "בונה הדרום", detail: "ממתין לדיווח", status: "בהמתנה", color: "#D4568C" },
  { name: "אופיר תחבורה", detail: "עודכן לפני 3 ימים", status: "פעיל", color: "#E2A83B" },
];

const TASKS = [
  { label: "לאשר דוח מע״מ - רהיתי דוד", done: true },
  { label: "לשלוח תזכורת תשלום - בונה הדרום", done: false },
  { label: "לעדכן פרטי חשבון - קפה נטו", done: false },
  { label: "לסקור דוח רבעוני חדש", done: false },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState(TASKS);

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-8 py-9">
        {/* ברכה */}
        <div className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="mb-1.5 text-xs font-medium" style={{ color: MUTE }}>יום שלישי, 8 ביולי 2026</p>
            <h1 className="ff-serif text-3xl font-semibold" style={{ color: INK }}>צהריים טובים, רשיד סעד</h1>
            <p className="mt-2 text-sm" style={{ color: SLATE }}>ברוכים הבאים למרכז העסק שלך. הנה מה שקורה היום.</p>
          </div>
          <button
            className="dash-focusable px-5 py-3 text-sm font-semibold text-white"
            style={{ background: INDIGO, borderRadius: "12px", boxShadow: "0 10px 24px -10px rgba(91,79,232,0.55)" }}
          >
            + פעולה חדשה
          </button>
        </div>

        {/* KPI */}
        <div className="mb-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {KPIS.map(({ label, value, delta, up, icon: Icon, tint }) => (
            <div key={label} className="dash-kpi bg-white p-5" style={{ borderRadius: "16px", border: `1px solid ${BORDER}` }}>
              <div className="flex items-center justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center"
                  style={{ background: `${tint}1A`, color: tint, borderRadius: "10px" }}
                >
                  <Icon size={18} />
                </div>
                <span
                  className="flex items-center gap-0.5 text-xs font-semibold"
                  style={{ color: up ? "#1E7B3B" : "#B8720B" }}
                >
                  {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {delta}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold" style={{ color: INK }}>{value}</p>
              <p className="mt-1 text-xs" style={{ color: SLATE }}>{label}</p>
            </div>
          ))}
        </div>

        {/* כרטיסי פעולה */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ACTION_CARDS.map(({ title, desc, stat, icon: Icon, gradient }) => (
            <a
              key={title}
              href="#"
              className="dash-card dash-focusable block overflow-hidden bg-white"
              style={{ borderRadius: "18px", border: `1px solid ${BORDER}` }}
            >
              <div className="relative flex h-36 items-center justify-center" style={{ background: gradient }}>
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.3)" }}
                >
                  <Icon size={26} color="#FFFFFF" strokeWidth={1.6} />
                </div>
                <span
                  className="absolute bottom-3 right-3 px-2.5 py-1 text-[11px] font-medium text-white"
                  style={{ background: "rgba(0,0,0,0.18)", borderRadius: "999px" }}
                >
                  {stat}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold" style={{ color: INK }}>{title}</h3>
                  <ChevronLeft size={15} style={{ color: MUTE }} />
                </div>
                <p className="mt-1.5 text-sm leading-6" style={{ color: SLATE }}>{desc}</p>
              </div>
            </a>
          ))}
        </div>

        {/* לקוחות + משימות */}
        <div className="mt-11 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: INK }}>לקוחות</h2>
              <a href="#" className="dash-link dash-focusable flex items-center gap-1 text-sm font-medium" style={{ color: INDIGO }}>
                לצפייה בכל הלקוחות
                <ChevronLeft size={15} />
              </a>
            </div>

            <div className="bg-white" style={{ borderRadius: "16px", border: `1px solid ${BORDER}` }}>
              {CLIENTS.map((c, i) => (
                <div
                  key={c.name}
                  className="dash-row flex items-center justify-between px-6 py-4"
                  style={{ borderTop: i !== 0 ? `1px solid ${BORDER}` : "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ background: c.color }}
                    >
                      {c.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: INK }}>{c.name}</p>
                      <p className="text-xs" style={{ color: MUTE }}>{c.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className="px-3 py-1 text-xs font-medium"
                      style={{
                        borderRadius: "999px",
                        background: c.status === "פעיל" ? "#E6F4EA" : "#FEF3E2",
                        color: c.status === "פעיל" ? "#1E7B3B" : "#B8720B",
                      }}
                    >
                      {c.status}
                    </span>
                    <button className="dash-focusable" aria-label="עוד אפשרויות" style={{ color: MUTE }}>
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* משימות */}
          <div>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold" style={{ color: INK }}>משימות קרובות</h2>
              <span className="text-xs font-medium" style={{ color: MUTE }}>
                {tasks.filter((t) => !t.done).length} פתוחות
              </span>
            </div>
            <div className="bg-white p-2" style={{ borderRadius: "16px", border: `1px solid ${BORDER}` }}>
              {tasks.map((t, i) => (
                <button
                  key={t.label}
                  onClick={() =>
                    setTasks((prev) => prev.map((task, idx) => (idx === i ? { ...task, done: !task.done } : task)))
                  }
                  className="dash-task dash-focusable flex w-full items-center gap-3 rounded-xl px-3 py-3 text-right"
                >
                  {t.done ? (
                    <CheckCircle2 size={18} style={{ color: INDIGO }} />
                  ) : (
                    <Circle size={18} style={{ color: MUTE }} />
                  )}
                  <span
                    className="text-sm"
                    style={{ color: t.done ? MUTE : INK, textDecoration: t.done ? "line-through" : "none" }}
                  >
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto max-w-[1440px] px-8 py-8 text-xs" style={{ color: MUTE }}>
        © כל הזכויות שמורות ל- רשיד סעד משרד רו״ח 2026
      </footer>
    </DashboardShell>
  );
}
