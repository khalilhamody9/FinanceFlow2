"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  Home,
  Users,
  FileText,
  Settings,
  Search,
  Bell,
} from "lucide-react";

const INK = "#1B1E2E";
const SLATE = "#6B7280";
const MUTE = "#9CA1B0";
const NAVY_STRIP = "#232A4A";
const INDIGO = "#5B4FE8";
const INDIGO_SOFT = "#EEECFD";
const BORDER = "#ECEDF5";

const SIDE_NAV = [
  { icon: Home, label: "ראשי", href: "/dashboard" },
  { icon: Users, label: "לקוחות", href: "/clients" },
  { icon: FileText, label: "דוחות", href: "/reports" },
  { icon: Settings, label: "הגדרות", href: "/settings" },
];

const NAV_ITEMS = [
  { title: "לקוחות", href: "/clients" },
  { title: "שירות", href: "/service" },
  { title: "תשלומים", href: "/payments" },
  { title: "דיווח שוטף", href: "/reports/monthly" },
  { title: "דיווח שנתי", href: "/reports/yearly" },
  { title: "דוחות", href: "/reports" },
  { title: "הגדרות", href: "/settings" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div dir="rtl" style={{ background: "#F7F7FB", fontFamily: "'Heebo', sans-serif", minHeight: "100vh", paddingRight: "76px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;600&family=Heebo:wght@300;400;500;600;700&display=swap');
        .ff-serif { font-family: 'Frank Ruhl Libre', serif; }
        .dash-strip-btn { transition: background .2s ease, transform .15s ease; }
        .dash-strip-btn:hover { background: rgba(255,255,255,0.1); }
        .dash-side-icon { transition: background .2s ease, color .2s ease; }
        .dash-side-icon:hover { background: rgba(255,255,255,0.08); }
        .dash-nav-link { color: ${SLATE}; transition: color .2s ease; position: relative; }
        .dash-nav-link:hover { color: ${INK}; }
        .dash-focusable:focus-visible { outline: 2px solid ${INDIGO}; outline-offset: 2px; }
        .dash-search { background: #F2F2F8; border: 1px solid transparent; transition: border-color .2s ease, background .2s ease; }
        .dash-search:focus-within { border-color: ${INDIGO}; background: #FFFFFF; }
      `}</style>

      <div className="fixed inset-y-0 right-0 z-20 flex w-[76px] flex-col items-center justify-between py-6" style={{ background: NAVY_STRIP }}>
        <div className="flex flex-col items-center gap-8">
          <div className="flex h-11 w-11 items-center justify-center text-sm font-bold ff-serif" style={{ border: "1.5px solid rgba(255,255,255,0.45)", borderRadius: "50%", color: "#FFFFFF" }}>
            רס
          </div>
          <div className="flex flex-col items-center gap-2">
            {SIDE_NAV.map(({ icon: Icon, label, href }) => {
              const isActive = pathname === href;
              return (
                <Link key={label} href={href} aria-label={label} className="dash-side-icon dash-focusable flex h-11 w-11 items-center justify-center" style={{ borderRadius: "12px", background: isActive ? "rgba(255,255,255,0.14)" : "transparent" }}>
                  <Icon size={19} color={isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)"} />
                </Link>
              );
            })}
          </div>
        </div>
        <button className="dash-strip-btn dash-focusable flex h-10 w-10 items-center justify-center rounded-full" aria-label="יציאה">
          <LogOut size={18} color="rgba(255,255,255,0.75)" />
        </button>
      </div>

      <header className="sticky top-0 z-10 border-b bg-white/95" style={{ borderColor: BORDER, backdropFilter: "blur(8px)" }}>
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-3.5">
          <nav className="flex items-center gap-7">
            <Link href="/dashboard" className={['dash-nav-link dash-focusable text-sm font-medium', pathname === '/dashboard' ? 'rounded-[10px] bg-[#EEECFD] px-4 py-2 font-semibold text-[#5B4FE8]' : ''].join('')}>
              ראשי
            </Link>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.title} href={item.href} className={['dash-nav-link dash-focusable text-sm font-medium', isActive ? 'rounded-[10px] bg-[#EEECFD] px-4 py-2 font-semibold text-[#5B4FE8]' : ''].join('')}>
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4">
            <div className="dash-search flex items-center gap-2 rounded-xl px-3 py-2" style={{ width: "220px" }}>
              <Search size={15} style={{ color: MUTE }} />
              <input type="text" placeholder="חיפוש לקוח, דוח..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#9CA1B0]" style={{ color: INK }} />
            </div>
            <button className="dash-focusable relative flex h-10 w-10 items-center justify-center rounded-full" style={{ background: "#F2F2F8" }} aria-label="התראות">
              <Bell size={17} style={{ color: SLATE }} />
              <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full" style={{ background: "#D4568C" }} />
            </button>
            <div className="flex items-center gap-3 border-r pr-4" style={{ borderColor: BORDER }}>
              <div className="text-left">
                <p className="text-xs" style={{ color: MUTE }}>שלום,</p>
                <p className="text-sm font-semibold" style={{ color: INK }}>רשיד סעד</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold" style={{ background: INDIGO_SOFT, color: INDIGO }}>
                רס
              </div>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
