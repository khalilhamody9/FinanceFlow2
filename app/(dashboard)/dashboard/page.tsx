import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./dashboard-client";

function cleanDisplayName(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const name = value.trim();
  if (!name || ["undefined", "null", "לא מוגדר"].includes(name.toLowerCase())) return fallback;
  return name;
}

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
  const currentUserName = cleanDisplayName(profile.full_name, user.email || "משתמש");

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

  const isManager = ["ADMIN", "MANAGER"].includes((profile.role || "").toUpperCase());
  const employeeRpcResult = isManager
    ? await supabase.rpc("get_organization_employees")
    : { data: null, error: null };

  const employeeFallbackResult = !isManager || employeeRpcResult.error
    ? await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("full_name", { ascending: true })
    : { data: null, error: null };

  const employeesData = employeeRpcResult.data || employeeFallbackResult.data || [];
  const employeesError = employeeRpcResult.error && employeeFallbackResult.error
    ? employeeFallbackResult.error
    : null;

  if (employeesError) console.error("EMPLOYEES ERROR:", employeesError);

  // 6. טעינת המשימות של המשרד
  let tasksQuery = supabase
    .from("tasks")
    .select(`
      id,
      title,
      status,
      priority,
      due_date,
      assigned_to,
      created_by,
      assignee:profiles!tasks_assigned_to_fkey(full_name),
      creator:profiles!tasks_created_by_fkey(full_name),
      created_at
    `)
    .eq("organization_id", organizationId)
    .order("created_at", {
      ascending: false,
    });

  if (!isManager) tasksQuery = tasksQuery.eq("assigned_to", user.id);
  const { data: tasksData, error: tasksError } = await tasksQuery;

  if (tasksError) {
    console.error("TASKS ERROR:", tasksError);
  }

  // התאמת המשימות למבנה של DashboardClient
  const initialTasks = (tasksData || []).map((task) => ({
    id: task.id,
    label: task.title,
    done: task.status === "done",
    dueDate: task.due_date,
    assignedTo: task.assigned_to,
    assignedName: task.assignee?.[0]?.full_name || "עובד",
    creatorName: cleanDisplayName(
      task.creator?.[0]?.full_name,
      task.created_by === user.id ? currentUserName : "מנהל המשרד",
    ),
  }));

  const visibleTaskIds = (tasksData || []).map((task) => task.id);
  let historyQuery = supabase
    .from("task_history")
    .select("id, task_id, task_title, action, details, created_at, profiles!task_history_performed_by_fkey(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (!isManager && visibleTaskIds.length > 0) historyQuery = historyQuery.in("task_id", visibleTaskIds);
  const historyResult = !isManager && visibleTaskIds.length === 0
    ? { data: [], error: null }
    : await historyQuery;
  const taskHistoryData = historyResult.data || [];
  const taskHistoryError = historyResult.error;

  if (taskHistoryError) console.error("TASK HISTORY ERROR:", taskHistoryError);

  return (
    <DashboardClient
      userId={user.id}
      organizationId={organizationId}
      userName={currentUserName}
      userRole={profile.role || "EMPLOYEE"}
      activeClientsCount={activeClientsCount || 0}
      recentClients={recentClients || []}
      initialTasks={initialTasks}
      initialTaskHistory={taskHistoryData || []}
      employees={employeesData || []}
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
