import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../components/dashboard-shell";
import ActivityLogClient from "./activity-log-client";
import MiniCalendar from "../components/mini-calendar";

type TaskHistory = {
  id: string;
  task_id: string | null;
  task_title: string;
  action: string;
  details: string | null;
  created_at: string;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
};

function cleanDisplayName(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const name = value.trim();
  if (!name || ["undefined", "null", "לא מוגדר"].includes(name.toLowerCase())) return fallback;
  return name;
}

export default async function TasksPage() {
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

  if (profileError || !profile || !profile.is_active || !profile.organization_id) {
    redirect("/login");
  }

  const organizationId = profile.organization_id;
  const currentUserName = cleanDisplayName(profile.full_name, user.email || "משתמש");

  const { data: historyData, error: historyError } = await supabase
    .from("task_history")
    .select("id, task_id, task_title, action, details, created_at, profiles!task_history_performed_by_fkey(full_name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (historyError) {
    console.error("TASK HISTORY ERROR:", historyError);
  }

  return (
    <DashboardShell userName={currentUserName}>
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ActivityLogClient initialTaskHistory={historyData || []} />
          </div>
          <div>
            <MiniCalendar events={historyData || []} compact />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
