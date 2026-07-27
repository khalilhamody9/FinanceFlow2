"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "ראשי" },
  { href: "/clients", label: "לקוחות" },
  { href: "/tasks", label: "משימות" },
  { href: "/service", label: "שירות" },
  { href: "/payments", label: "תשלומים" },
  { href: "/reports/monthly", label: "דיווח שוטף" },
  { href: "/reports/yearly", label: "דיווח שנתי" },
  { href: "/reports", label: "דוחות" },
  { href: "/settings", label: "הגדרות" },
];

export function DashboardTopNav() {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white" style={{ borderColor: "#E7E8F0" }}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-8 py-3.5">
        <nav className="flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "dash-nav-link dash-focusable text-sm font-medium",
                  isActive ? "rounded-[10px] bg-[#EEECFD] px-4 py-2 font-semibold text-[#5B4FE8]" : "",
                ].join(" ")}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-xs text-[#9CA1B0]">שלום,</p>
            <p className="text-sm font-semibold text-[#1B1E2E]">רשיד סעד</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "#EEECFD", color: "#5B4FE8" }}>
            רס
          </div>
        </div>
      </div>
    </header>
  );
}
