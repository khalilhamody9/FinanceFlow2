import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../../components/dashboard-shell";
import YearlyReportClient from "./yearly-report-client";

export default async function YearlyReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_active, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active || !profile.organization_id) redirect("/login");

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, first_name, last_name, business_name, business_number, business_type, income_tax_file, has_capital_declaration, status")
    .eq("organization_id", profile.organization_id)
    .order("business_name", { ascending: true, nullsFirst: false });

  if (error) console.error("YEARLY REPORT CLIENTS ERROR:", error);

  const { data: reports, error: reportsError } = await supabase
    .from("annual_reports")
    .select("client_id, reporting_year, exempt_declaration_status, capital_declaration_status, annual_report_status, balance_sheet_status, assigned_to, notes")
    .eq("organization_id", profile.organization_id);

  if (reportsError) console.error("ANNUAL REPORTS ERROR:", reportsError);

  return (
    <DashboardShell userName={profile.full_name || user.email || "משתמש"}>
      <YearlyReportClient initialClients={clients ?? []} initialReports={reports ?? []} organizationId={profile.organization_id} />
    </DashboardShell>
  );
}
