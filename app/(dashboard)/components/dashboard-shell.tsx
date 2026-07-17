"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
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

type DashboardShellProps = {
  children: React.ReactNode;
  userName?: string;
};

function getInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "מש";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2);
  }

  return `${words[0][0]}${words[1][0]}`;
}

export function DashboardShell({
  children,
  userName = "משתמש",
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const initials = getInitials(userName);

  function isRouteActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("LOGOUT ERROR:", error);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div
      dir="rtl"
      style={{
        background: "#F7F7FB",
        fontFamily: "'Heebo', sans-serif",
        minHeight: "100vh",
        paddingRight: "76px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;600&family=Heebo:wght@300;400;500;600;700&display=swap');

        .ff-serif {
          font-family: 'Frank Ruhl Libre', serif;
        }

        .dash-strip-btn {
          transition: background 0.2s ease, transform 0.15s ease;
        }

        .dash-strip-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .dash-side-icon {
          transition: background 0.2s ease, color 0.2s ease;
        }

        .dash-side-icon:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .dash-nav-link {
          color: ${SLATE};
          position: relative;
          transition: color 0.2s ease, background 0.2s ease;
        }

        .dash-nav-link:hover {
          color: ${INK};
        }

        .dash-focusable:focus-visible {
          outline: 2px solid ${INDIGO};
          outline-offset: 2px;
        }

        .dash-search {
          background: #F2F2F8;
          border: 1px solid transparent;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .dash-search:focus-within {
          border-color: ${INDIGO};
          background: #FFFFFF;
        }

        @media (max-width: 1100px) {
          .dash-top-nav {
            overflow-x: auto;
            white-space: nowrap;
          }

          .dash-search-box {
            display: none;
          }
        }
      `}</style>

      {/* תפריט צדדי */}
      <aside
        className="fixed inset-y-0 right-0 z-20 flex w-[76px] flex-col items-center justify-between py-6"
        style={{ background: NAVY_STRIP }}
      >
        <div className="flex flex-col items-center gap-8">
          <div
            className="ff-serif flex h-11 w-11 items-center justify-center text-sm font-bold"
            style={{
              border: "1.5px solid rgba(255,255,255,0.45)",
              borderRadius: "50%",
              color: "#FFFFFF",
            }}
          >
            {initials}
          </div>

          <div className="flex flex-col items-center gap-2">
            {SIDE_NAV.map(({ icon: Icon, label, href }) => {
              const isActive = isRouteActive(href);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  title={label}
                  className="dash-side-icon dash-focusable flex h-11 w-11 items-center justify-center"
                  style={{
                    borderRadius: "12px",
                    background: isActive
                      ? "rgba(255,255,255,0.14)"
                      : "transparent",
                  }}
                >
                  <Icon
                    size={19}
                    color={
                      isActive
                        ? "#FFFFFF"
                        : "rgba(255,255,255,0.55)"
                    }
                  />
                </Link>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="dash-strip-btn dash-focusable flex h-10 w-10 items-center justify-center rounded-full"
          aria-label="יציאה מהמערכת"
          title="יציאה"
        >
          <LogOut size={18} color="rgba(255,255,255,0.75)" />
        </button>
      </aside>

      {/* תפריט עליון */}
      <header
        className="sticky top-0 z-10 border-b bg-white/95"
        style={{
          borderColor: BORDER,
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-8 py-3.5">
          <nav className="dash-top-nav flex items-center gap-2">
            <Link
              href="/dashboard"
              className={[
                "dash-nav-link dash-focusable rounded-[10px] px-4 py-2 text-sm font-medium",
                pathname === "/dashboard"
                  ? "bg-[#EEECFD] font-semibold text-[#5B4FE8]"
                  : "",
              ].join(" ")}
            >
              ראשי
            </Link>

            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/reports"
                  ? pathname === "/reports"
                  : isRouteActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "dash-nav-link dash-focusable rounded-[10px] px-4 py-2 text-sm font-medium",
                    isActive
                      ? "bg-[#EEECFD] font-semibold text-[#5B4FE8]"
                      : "",
                  ].join(" ")}
                >
                  {item.title}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-4">
            <div
              className="dash-search dash-search-box flex items-center gap-2 rounded-xl px-3 py-2"
              style={{ width: "220px" }}
            >
              <Search size={15} style={{ color: MUTE }} />

              <input
                type="search"
                placeholder="חיפוש לקוח, דוח..."
                aria-label="חיפוש"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9CA1B0]"
                style={{ color: INK }}
              />
            </div>

            <button
              type="button"
              className="dash-focusable relative flex h-10 w-10 items-center justify-center rounded-full"
              style={{ background: "#F2F2F8" }}
              aria-label="התראות"
            >
              <Bell size={17} style={{ color: SLATE }} />

              <span
                className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
                style={{ background: "#D4568C" }}
              />
            </button>

            <div
              className="flex items-center gap-3 border-r pr-4"
              style={{ borderColor: BORDER }}
            >
              <div className="text-right">
                <p className="text-xs" style={{ color: MUTE }}>
                  שלום,
                </p>

                <p
                  className="max-w-[150px] truncate text-sm font-semibold"
                  style={{ color: INK }}
                >
                  {userName}
                </p>
              </div>

              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold"
                style={{
                  background: INDIGO_SOFT,
                  color: INDIGO,
                }}
              >
                {initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}