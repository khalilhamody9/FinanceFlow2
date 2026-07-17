import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../components/dashboard-shell";
import ServicesClient from "./services-client";

export default async function ServicePage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      organization_id,
      full_name,
      role,
      is_active
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

  const organizationId =
    profile.organization_id;

  const {
    data: clientsData,
    error: clientsError,
  } = await supabase
    .from("clients")
    .select(`
      id,
      first_name,
      last_name,
      business_name
    `)
    .eq("organization_id", organizationId)
    .order("business_name", {
      ascending: true,
      nullsFirst: false,
    })
    .order("first_name", {
      ascending: true,
    });

  if (clientsError) {
    console.error(
      "CLIENTS ERROR:",
      clientsError,
    );
  }

  const {
    data: employeesData,
    error: employeesError,
  } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      role
    `)
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("full_name", {
      ascending: true,
    });
// console.log("EMPLOYEES DATA:", employeesData);
// console.log("EMPLOYEES ERROR:", employeesError);
// console.log("ORGANIZATION ID:", organizationId);
  if (employeesError) {
    console.error(
      "EMPLOYEES ERROR:",
      employeesError,
    );
  }

  const {
    data: servicesData,
    error: servicesError,
  } = await supabase
    .from("services")
    .select(`
      id,
      service_number,
      service_date,
      service_type,
      price,
      status,
      notes,
      assigned_to,
      clients (
        first_name,
        last_name,
        business_name
      ),
      profiles!services_assigned_to_fkey (
        full_name
      )
    `)
    .eq("organization_id", organizationId)
    .order("service_date", {
      ascending: false,
    })
    .order("created_at", {
      ascending: false,
    });

  if (servicesError) {
    console.error(
      "SERVICES ERROR:",
      servicesError,
    );
  }

  const clients = Array.isArray(clientsData)
    ? clientsData
    : [];

  const employees = Array.isArray(
    employeesData,
  )
    ? employeesData
    : [];

  const services = Array.isArray(
    servicesData,
  )
    ? servicesData
    : [];

return (
  <DashboardShell
    userName={
      profile.full_name?.trim() ||
      user.email ||
      "משתמש"
    }
  >
    <ServicesClient
      organizationId={organizationId}
      userId={profile.id}
      clients={clients}
      employees={employees}
      services={services}
    />
  </DashboardShell>
);
}