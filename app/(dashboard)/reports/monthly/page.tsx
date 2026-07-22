import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../../components/dashboard-shell";
import MonthlyReportClient from "./monthly-report-client";

export default async function MonthlyReportPage() {
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
    .select(`
      id, first_name, last_name, business_name, business_number, phone,
      vat_file, income_tax_file, deductions_file, vat_report_type,
      status, has_fuel, has_inventory, is_detailed, notes
    `)
    .eq("organization_id", profile.organization_id)
    .order("business_name", { ascending: true });

  if (error) console.error("MONTHLY REPORT CLIENTS ERROR:", error);

  const { data: reports, error: reportsError } = await supabase
    .from("monthly_reports")
    .select("client_id, reporting_year, reporting_month, vat_status, income_tax_status, national_insurance_status, income_tax_deductions_status, national_insurance_deductions_status, fuel_refund_status, overall_status, assigned_to, notes")
    .eq("organization_id", profile.organization_id);

  if (reportsError) console.error("MONTHLY REPORTS ERROR:", reportsError);

  return (
    <DashboardShell userName={profile.full_name || user.email || "משתמש"}>
      <MonthlyReportClient initialClients={clients ?? []} initialReports={reports ?? []} organizationId={profile.organization_id} />
    </DashboardShell>
  );
}
