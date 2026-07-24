"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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

const INK = "#0B2348";
const SLATE = "#65738B";
const MUTE = "#94A0B3";
const NAVY_STRIP = "#061B3C";
const INDIGO = "#C99B2D";
const INDIGO_SOFT = "#FBF6E9";
const BORDER = "#E8EDF5";

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
  logoUrl?: string | null;
  avatarUrl?: string | null;
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
  logoUrl: initialLogoUrl = null,
  avatarUrl: initialAvatarUrl = null,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl);

  const initials = getInitials(userName);

  useEffect(() => {
    let active = true;

    async function loadOrganizationLogo() {
      if (initialLogoUrl) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const savedAvatar = user.user_metadata?.avatar_url as string | undefined;
      if (active) {
        setAvatarUrl(savedAvatar || null);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.organization_id) return;

      const { data: organization } = await supabase
        .from("organizations")
        .select("logo_url")
        .eq("id", profile.organization_id)
        .maybeSingle();

      if (active) {
        const savedLogo = organization?.logo_url ?? null;
        setLogoUrl(savedLogo);
        if (savedLogo) window.localStorage.setItem("financeflow-organization-logo", savedLogo);
        else window.localStorage.removeItem("financeflow-organization-logo");
      }
    }

    void loadOrganizationLogo();

    const handleLogoChange = (event: Event) => {
      const nextLogo = (event as CustomEvent<string | null>).detail;
      setLogoUrl(nextLogo);
      if (nextLogo) window.localStorage.setItem("financeflow-organization-logo", nextLogo);
      else window.localStorage.removeItem("financeflow-organization-logo");
    };
    window.addEventListener("organization-logo-change", handleLogoChange);
    const handleAvatarChange = (event: Event) => {
      const nextAvatar = (event as CustomEvent<string | null>).detail;
      setAvatarUrl(nextAvatar);
    };
    window.addEventListener("user-avatar-change", handleAvatarChange);

    return () => {
      active = false;
      window.removeEventListener("organization-logo-change", handleLogoChange);
      window.removeEventListener("user-avatar-change", handleAvatarChange);
    };
  }, [initialLogoUrl, supabase]);

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

    window.localStorage.removeItem("financeflow-organization-logo");
    window.localStorage.removeItem("financeflow-user-avatar");

    router.replace("/login");
    router.refresh();
  }

  return (
    <div
      dir="rtl"
      className="dash-shell-root"
      style={{
        background: "linear-gradient(180deg, #F8FAFD 0%, #F4F7FB 100%)",
        minHeight: "100vh",
        paddingRight: "88px",
      }}
    >
      <style>{`
        .ff-serif {
          font-family: Georgia, serif;
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
          color: #C5CFDE;
          position: relative;
          transition: color 0.2s ease, background 0.2s ease, transform .2s ease;
        }

        .dash-nav-link:hover {
          color: #A97812;
          background: #FBF6E9;
          transform: translateY(-1px);
        }

        .dash-focusable:focus-visible {
          outline: 2px solid ${INDIGO};
          outline-offset: 2px;
        }

        .dash-search {
          background: #F6F7FB;
          border: 1px solid transparent;
          transition: border-color 0.2s ease, background 0.2s ease;
        }

        .dash-search:focus-within {
          border-color: ${INDIGO};
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(201,155,45,.12);
        }

        .dash-shell-main { min-width: 0; }

        @media (max-width: 1100px) {
          .dash-top-nav {
            overflow-x: auto;
            white-space: nowrap;
          }

          .dash-search-box {
            display: none;
          }
        }

        @media (max-width: 760px) {
          .dash-shell-root { padding-right: 0 !important; padding-bottom: 70px; }
          .dash-side-bar { inset: auto 0 0 0 !important; width: 100% !important; height: 64px; flex-direction: row !important; padding: 8px 14px !important; border-radius: 18px 18px 0 0; }
          .dash-side-bar > div { flex-direction: row !important; gap: 12px !important; }
          .dash-side-bar > div > div:first-child { display: none; }
          .dash-side-bar > div > div:last-child { flex-direction: row !important; }
          .dash-header-inner { padding-inline: 14px !important; }
          .dash-user-meta, .dash-notifications { display: none !important; }
        }
      `}</style>

      {/* תפריט צדדי */}
      <aside
        className="dash-side-bar fixed inset-y-0 right-0 z-20 flex w-[88px] flex-col items-center justify-between py-6"
        style={{ background: `linear-gradient(180deg, ${NAVY_STRIP}, #0B2B59 68%, #123B74)`, boxShadow: "-8px 0 34px rgba(6,27,60,.16)" }}
      >
        <div className="flex flex-col items-center gap-8">
          <div
            className="ff-serif flex h-12 w-12 items-center justify-center overflow-hidden text-base font-bold"
            style={{
              border: "1.5px solid rgba(201,155,45,.75)",
              borderRadius: "999px",
              color: "#D9AD45",
              background: avatarUrl ? "#FFFFFF" : "rgba(3,18,42,.42)",
              padding: avatarUrl ? "2px" : "0",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.16)",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={`תמונת הפרופיל של ${userName}`} className="h-full w-full rounded-full object-cover" />
            ) : initials}
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
                    borderRadius: "13px",
                    background: isActive
                      ? "linear-gradient(135deg, #D8AF4C, #B8871B)"
                      : "transparent",
                    boxShadow: isActive ? "0 8px 20px rgba(201,155,45,.28)" : "none",
                  }}
                >
                  <Icon
                    size={19}
                    color={
                      isActive
                        ? "#FFFFFF"
                        : "#D0A43C"
                    }
                  />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {logoUrl && (
            <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-2xl border border-[#C99B2D]/60 bg-white p-1 shadow-[0_8px_22px_rgba(0,0,0,.22)]" title="לוגו המשרד">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="לוגו המשרד" className="h-full w-full object-contain" />
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="dash-strip-btn dash-focusable flex h-10 w-10 items-center justify-center rounded-full"
            aria-label="יציאה מהמערכת"
            title="יציאה"
          >
            <LogOut size={18} color="#D0A43C" />
          </button>
        </div>
      </aside>

      {/* תפריט עליון */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          borderColor: "rgba(201,155,45,.2)",
          background: "rgba(6,27,60,.97)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 4px 20px rgba(42,47,81,.035)",
        }}
      >
        <div className="dash-header-inner mx-auto flex max-w-[1540px] items-center justify-between gap-6 px-8 py-3.5">
          <nav className="dash-top-nav flex items-center gap-2">
            <Link
              href="/dashboard"
              className={[
                "dash-nav-link dash-focusable rounded-xl px-4 py-2 text-sm font-medium",
                pathname === "/dashboard"
                  ? "bg-[#C99B2D] font-semibold !text-white shadow-[0_6px_18px_rgba(201,155,45,.24)]"
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
                    "dash-nav-link dash-focusable rounded-xl px-4 py-2 text-sm font-medium",
                    isActive
                      ? "bg-[#C99B2D] font-semibold !text-white shadow-[0_6px_18px_rgba(201,155,45,.24)]"
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
              style={{ width: "220px", background: "rgba(255,255,255,.06)", borderColor: "rgba(255,255,255,.15)" }}
            >
              <Search size={15} style={{ color: MUTE }} />

              <input
                type="search"
                placeholder="חיפוש לקוח, דוח..."
                aria-label="חיפוש"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9EABC0]"
                style={{ color: "#FFFFFF" }}
              />
            </div>

            <button
              type="button"
              className="dash-notifications dash-focusable relative flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "rgba(255,255,255,.08)" }}
              aria-label="התראות"
            >
              <Bell size={17} style={{ color: "#D6AC45" }} />

              <span
                className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full"
                style={{ background: "#D4568C" }}
              />
            </button>

            <div
              className="dash-user-meta flex items-center gap-3 border-r pr-4"
              style={{ borderColor: "rgba(255,255,255,.14)" }}
            >
              <div className="text-right">
                <p className="text-xs" style={{ color: MUTE }}>
                  שלום,
                </p>

                <p
                  className="max-w-[150px] truncate text-sm font-semibold"
                  style={{ color: "#FFFFFF" }}
                >
                  {userName}
                </p>
              </div>

              <div
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold"
                style={{
                  background: INDIGO_SOFT,
                  color: INDIGO,
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={`תמונת הפרופיל של ${userName}`} className="h-full w-full object-cover" />
                ) : initials}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="dash-shell-main">{children}</div>
    </div>
  );
}
