import { DashboardShell } from "../components/dashboard-shell";
import { Bell, Building2, ChevronLeft, LockKeyhole, UserRound } from "lucide-react";

const sections = [
  { icon: Building2, title: "פרטי המשרד", description: "שם העסק, מספר עוסק ופרטי התקשרות" },
  { icon: UserRound, title: "משתמשים והרשאות", description: "ניהול עובדים, תפקידים והרשאות גישה" },
  { icon: Bell, title: "התראות", description: "בחירת עדכונים ותזכורות שיישלחו אליך" },
  { icon: LockKeyhole, title: "אבטחה", description: "סיסמה, אימות דו־שלבי וכניסות אחרונות" },
];

export default function SettingsPage() {
  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <div className="mb-7">
          <p className="mb-2 text-xs font-medium text-[#9297AA]">מערכת / הגדרות</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#2B2E49]">הגדרות</h1>
          <p className="mt-2 text-sm text-[#7B8198]">ניהול המשרד, המשתמשים והעדפות המערכת במקום אחד.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, description }) => (
            <button key={title} type="button" className="group flex items-center gap-4 rounded-2xl border border-[#E7E9F2] bg-white p-5 text-right shadow-[0_8px_24px_rgba(39,45,78,.05)] transition hover:-translate-y-0.5 hover:border-[#CBC8FA] hover:shadow-[0_14px_30px_rgba(39,45,78,.09)]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#EFEEFF] text-[#5851E8]"><Icon size={21} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-base text-[#30334F]">{title}</strong><small className="mt-1 block text-sm text-[#858A9E]">{description}</small></span>
              <ChevronLeft size={18} className="text-[#A4A8B7] transition group-hover:-translate-x-1 group-hover:text-[#5851E8]" />
            </button>
          ))}
        </div>
      </main>
    </DashboardShell>
  );
}
