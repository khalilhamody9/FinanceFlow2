import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. המשתמש המחובר
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // 2. פרופיל המשתמש
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

  if (profileError) {
    console.error("PROFILE ERROR:", profileError);
    redirect("/login");
  }

  if (!profile || !profile.is_active || !profile.organization_id) {
    redirect("/login");
  }

  const organizationId = profile.organization_id;

  // 3. פרטי המשרד
  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select(`
      id,
      name,
      email,
      phone,
      address,
      tax_id,
      logo_url
    `)
    .eq("id", organizationId)
    .maybeSingle();

  if (organizationError) {
    console.error("ORGANIZATION ERROR:", organizationError);
    redirect("/login");
  }

  if (!organization) {
    redirect("/login");
  }

  // 4. ארבעת הלקוחות האחרונים של המשרד בלבד
  const { data: recentClients, error: clientsError } = await supabase
    .from("clients")
    .select(`
      id,
      first_name,
      last_name,
      business_name,
      status,
      updated_at
    `)
    .eq("organization_id", organizationId)
    .order("updated_at", {
      ascending: false,
    })
    .limit(4);

  if (clientsError) {
    console.error("CLIENTS ERROR:", clientsError);
  }

  // 5. מספר הלקוחות הפעילים במשרד
  const { count: activeClientsCount, error: countError } = await supabase
    .from("clients")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("organization_id", organizationId)
    .ilike("status", "active");

  if (countError) {
    console.error("CLIENT COUNT ERROR:", countError);
  }

  // 6. טעינת המשימות של המשרד
  const { data: tasksData, error: tasksError } = await supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      created_at
    `)
    .eq("organization_id", organizationId)
    .order("created_at", {
      ascending: false,
    });

  if (tasksError) {
    console.error("TASKS ERROR:", tasksError);
  }

  // התאמת המשימות למבנה של DashboardClient
  const initialTasks = (tasksData || []).map((task) => ({
    id: task.id,
    label: task.title,
    done: task.status === "done",
  }));

  return (
    <DashboardClient
      userId={user.id}
      organizationId={organizationId}
      userName={profile.full_name || user.email || "משתמש"}
      userRole={profile.role || "EMPLOYEE"}
      activeClientsCount={activeClientsCount || 0}
      recentClients={recentClients || []}
      initialTasks={initialTasks}
      organization={{
        name: organization.name || "המשרד שלי",
        email: organization.email,
        phone: organization.phone,
        address: organization.address,
        businessNumber: organization.tax_id,
        logoUrl: organization.logo_url,
      }}
    />
  );
}