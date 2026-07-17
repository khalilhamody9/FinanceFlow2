import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CustomersList from "./customers-list";

export default async function ClientsPage() {
  const supabase = await createClient();

  // המשתמש המחובר
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // פרופיל המשתמש והמשרד שאליו הוא שייך
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

  return (
    <CustomersList
      userName={profile.full_name || user.email || "משתמש"}
      organizationId={profile.organization_id}
    />
  );
}