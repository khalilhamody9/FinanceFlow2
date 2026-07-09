import { DashboardShell } from "../../components/dashboard-shell";

export default function MonthlyReportPage() {
  return (
    <DashboardShell>
      <main className="mx-auto max-w-[1440px] px-8 py-8">
        <div className="rounded-[18px] border border-[#E7E8F0] bg-white p-8">
          <h1 className="text-2xl font-bold text-[#1B1E2E]">דיווח שוטף</h1>
          <p className="mt-3 text-sm text-[#6B7280]">עמוד הדיווח השוטף מוכן להמשך עבודה עם סיכומי חודש ונתונים שוטפים.</p>
        </div>
      </main>
    </DashboardShell>
  );
}
