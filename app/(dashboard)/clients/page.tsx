"use client";

import { useState } from "react";
import { DashboardShell } from "../components/dashboard-shell";
import {
  Search,
  Plus,
  ClipboardList,
  PenSquare,
  Columns,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";

const INK = "#1B1E2E";
const SLATE = "#6B7280";
const MUTE = "#9CA1B0";
const INDIGO = "#5B4FE8";
const INDIGO_SOFT = "#EEECFD";
const BORDER = "#E7E8F0";

const FILTERS = [
  { label: "סוג עוסק" },
  { label: "דיווח מע״מ" },
  { label: "דיווח מ״ה" },
  { label: "דיווח ניכויים" },
];

const TAGS = ["פעיל", "מלאי", "מפורט", "ביקורת", "סולר", "856", "ה.הון", "פנסיה ד.א", "בנפיט"];

const COLUMNS = ["מס׳ תיק", "שם", "עיסוק", "סוג", "נייד", "תיק מע״מ", "תיק מס הכנסה", "תיק ניכויים", "סטטוס"];

const CUSTOMERS = [
  { id: "10231", name: "רהיטי דוד בע״מ", business: "ריהוט וציוד", type: "בע״מ", phone: "050-1234567", vat: "512340981", income: "512340981", deductions: "930112", active: true },
  { id: "10244", name: "קפה נטו", business: "מזון ומשקאות", type: "עוסק מורשה", phone: "052-9871234", vat: "308219765", income: "308219765", deductions: "930118", active: true },
  { id: "10259", name: "בונה הדרום בע״מ", business: "בנייה ותשתיות", type: "בע״מ", phone: "054-4567890", vat: "419876320", income: "419876320", deductions: "930125", active: false },
  { id: "10267", name: "אופיר תחבורה", business: "הובלות", type: "עוסק פטור", phone: "053-3216549", vat: "—", income: "277654391", deductions: "930131", active: true },
  { id: "10281", name: "טכנו-פלוס בע״מ", business: "טכנולוגיה", type: "בע״מ", phone: "058-7412589", vat: "601239874", income: "601239874", deductions: "930147", active: true },
];

export default function CustomersList() {
  const [checkedAll, setCheckedAll] = useState(false);

  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="bg-white p-7" style={{ borderRadius: "18px", border: `1px solid ${BORDER}` }}>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button className="pill-btn dash-focusable flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold" style={{ borderRadius: "999px", border: "1.5px solid #2563EB", color: "#2563EB", background: "#FFFFFF" }}>
                <Plus size={16} />
                הוספת לקוח חדש
              </button>
              <button className="pill-btn dash-focusable flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold" style={{ borderRadius: "999px", border: "1.5px solid #7C3AED", color: "#7C3AED", background: "#FFFFFF" }}>
                <ClipboardList size={16} />
                הוספת שירות לגורף
              </button>
              <button className="pill-btn dash-focusable flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold" style={{ borderRadius: "999px", border: "1.5px solid #0F9488", color: "#0F9488", background: "#FFFFFF" }}>
                <PenSquare size={16} />
                עדכון גורף
              </button>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: INK }}>רשימת לקוחות</h1>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-4">
            {FILTERS.map((f) => (
              <span key={f.label} className="text-xs font-medium" style={{ width: "170px", color: MUTE }}>{f.label}:</span>
            ))}
          </div>
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {FILTERS.map((f) => (
              <div key={f.label} className="flex items-center justify-between gap-2 px-4 py-2.5" style={{ width: "170px", borderRadius: "10px", background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
                <span className="text-sm" style={{ color: INK }}>הכל</span>
                <ChevronDown size={15} style={{ color: MUTE }} />
              </div>
            ))}
            <div className="flex flex-1 items-center gap-2 px-4 py-2.5" style={{ minWidth: "220px", borderRadius: "10px", background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
              <Search size={15} style={{ color: MUTE }} />
              <input type="text" placeholder="חיפוש לקוח לפי מס׳ תיק, שם או טלפון..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#9CA1B0]" style={{ color: INK }} />
            </div>
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-3 border-b pb-5" style={{ borderColor: BORDER }}>
            <button className="flex h-9 w-9 items-center justify-center rounded-full" aria-label="תצוגת עמודות" style={{ border: `1.5px solid ${INDIGO}`, color: INDIGO, background: INDIGO_SOFT }}>
              <Columns size={16} />
            </button>
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              {TAGS.map((tag) => (
                <button key={tag} className="px-3.5 py-1.5 text-xs font-medium" style={{ borderRadius: "8px", color: SLATE, background: "#FFFFFF", border: `1px solid ${BORDER}` }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm" style={{ minWidth: "900px" }}>
              <thead>
                <tr style={{ background: "#FAFAFD" }}>
                  <th className="p-3 text-right" style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <input type="checkbox" checked={checkedAll} onChange={() => setCheckedAll((v) => !v)} style={{ accentColor: INDIGO }} />
                  </th>
                  {COLUMNS.map((col) => (
                    <th key={col} className="p-3 text-right text-xs font-semibold" style={{ color: SLATE, borderBottom: `1px solid ${BORDER}` }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CUSTOMERS.map((c) => (
                  <tr key={c.id}>
                    <td className="p-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      <input type="checkbox" style={{ accentColor: INDIGO }} />
                    </td>
                    <td className="p-3 font-medium" style={{ color: INK, borderBottom: `1px solid ${BORDER}` }}>{c.id}</td>
                    <td className="p-3 font-medium" style={{ color: INK, borderBottom: `1px solid ${BORDER}` }}>{c.name}</td>
                    <td className="p-3" style={{ color: SLATE, borderBottom: `1px solid ${BORDER}` }}>{c.business}</td>
                    <td className="p-3" style={{ color: SLATE, borderBottom: `1px solid ${BORDER}` }}>{c.type}</td>
                    <td className="p-3" style={{ color: SLATE, borderBottom: `1px solid ${BORDER}` }}>{c.phone}</td>
                    <td className="p-3" style={{ color: SLATE, borderBottom: `1px solid ${BORDER}` }}>{c.vat}</td>
                    <td className="p-3" style={{ color: SLATE, borderBottom: `1px solid ${BORDER}` }}>{c.income}</td>
                    <td className="p-3" style={{ color: SLATE, borderBottom: `1px solid ${BORDER}` }}>{c.deductions}</td>
                    <td className="p-3" style={{ borderBottom: `1px solid ${BORDER}` }}>
                      {c.active ? (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "#1E7B3B" }}>
                          <CheckCircle2 size={14} />
                          פעיל
                        </span>
                      ) : (
                        <span className="text-xs font-medium" style={{ color: MUTE }}>לא פעיל</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm" style={{ color: MUTE }}>מספר שורות: {CUSTOMERS.length}</div>
        </div>
      </main>
    </DashboardShell>
  );
}
