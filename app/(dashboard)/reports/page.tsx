import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../components/dashboard-shell";
import ReportsClient from "./reports-client";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, is_active, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.is_active || !profile.organization_id) redirect("/login");

  const [clientsResult, paymentsResult, servicesResult] = await Promise.all([
    supabase.from("clients").select("id, first_name, last_name, business_name").eq("organization_id", profile.organization_id).order("business_name", { ascending: true, nullsFirst: false }),
    supabase.from("payments").select("id, client_id, payment_date, payment_method, total_amount, status, payment_lines(check_number, check_date, check_status)").eq("organization_id", profile.organization_id).order("payment_date", { ascending: false }),
    supabase.from("services").select("id, client_id, service_date, service_type, price, status").eq("organization_id", profile.organization_id).order("service_date", { ascending: false }),
  ]);

  if (clientsResult.error) console.error("REPORT CLIENTS ERROR:", clientsResult.error);
  if (paymentsResult.error) console.error("REPORT PAYMENTS ERROR:", paymentsResult.error);
  if (servicesResult.error) console.error("REPORT SERVICES ERROR:", servicesResult.error);

  return (
    <DashboardShell userName={profile.full_name || user.email || "משתמש"}>
      <ReportsClient
        clients={clientsResult.data ?? []}
        payments={paymentsResult.data ?? []}
        services={servicesResult.data ?? []}
        userName={profile.full_name || "משתמש"}
      />
    </DashboardShell>
  );
}
