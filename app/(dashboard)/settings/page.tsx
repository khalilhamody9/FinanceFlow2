import { DashboardShell } from "../components/dashboard-shell";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="rounded-[18px] border border-[#E7E8F0] bg-white p-8">
          <h1 className="text-2xl font-bold text-[#1B1E2E]">הגדרות</h1>
          <p className="mt-3 text-sm text-[#6B7280]">עמוד ההגדרות מוכן להמשך עבודה עם הגדרות משתמש, ארגון ופרטי חשבון.</p>
        </div>
      </main>
    </DashboardShell>
  );
}
