import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../components/dashboard-shell";
import PaymentsClient from "./payments-client";

export default async function PaymentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role,
      is_active,
      organization_id
    `)
    .eq("id", user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    !profile.is_active ||
    !profile.organization_id
  ) {
    redirect("/login");
  }

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(`
      id,
      first_name,
      last_name,
      business_name,
      business_number,
      income_tax_file
    `)
    .eq("organization_id", profile.organization_id)
    .eq("status", "active")
    .order("first_name", { ascending: true });

  if (clientsError) {
    console.error("CLIENTS ERROR:", clientsError);
  }

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select(`
      id,
      payment_number,
      payment_date,
      payment_method,
      total_amount,
      status,
      notes,
      client_id,
      clients (
        id,
        first_name,
        last_name,
        business_name,
        business_number,
        income_tax_file
      ),
      payment_lines (
        id,
        amount,
        bank_name,
        bank_code,
        branch_number,
        account_number,
        check_number,
        check_date,
        check_status,
        transaction_number,
        credit_company,
        installments
      )
    `)
    .eq("organization_id", profile.organization_id)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (paymentsError) {
    console.error("PAYMENTS ERROR:", paymentsError);
  }

  return (
    <DashboardShell>
      <PaymentsClient
        organizationId={profile.organization_id}
        userId={profile.id}
        initialClients={clients ?? []}
        initialPayments={payments ?? []}
      />
    </DashboardShell>
  );
}