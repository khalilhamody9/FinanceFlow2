import { redirect } from "next/navigation";
import { Bell, Building2, ChevronLeft, LockKeyhole, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "../components/dashboard-shell";
import LogoSettings from "./logo-settings";
import AvatarSettings from "./avatar-settings";

const sections = [
  { icon: Building2, title: "פרטי המשרד", description: "שם העסק, מספר עוסק ופרטי התקשרות" },
  { icon: UserRound, title: "משתמשים והרשאות", description: "ניהול עובדים, תפקידים והרשאות גישה" },
  { icon: Bell, title: "התראות", description: "בחירת עדכונים ותזכורות שיישלחו אליך" },
  { icon: LockKeyhole, title: "אבטחה", description: "סיסמה, אימות דו־שלבי וכניסות אחרונות" },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, organization_id, is_active")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.is_active || !profile.organization_id) redirect("/login");

  const { data: organization } = await supabase
    .from("organizations")
    .select("logo_url")
    .eq("id", profile.organization_id)
    .maybeSingle();

  const logoUrl = organization?.logo_url ?? null;
  const avatarUrl = typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;

  return (
    <DashboardShell userName={profile.full_name || user.email || "משתמש"} logoUrl={logoUrl} avatarUrl={avatarUrl}>
      <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8">
        <div className="mb-7">
          <p className="mb-2 text-xs font-medium text-[#94A0B3]">מערכת / הגדרות</p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0B2348]">הגדרות</h1>
          <p className="mt-2 text-sm text-[#65738B]">ניהול המשרד, המשתמשים והעדפות המערכת במקום אחד.</p>
        </div>

        <LogoSettings organizationId={profile.organization_id} initialLogoUrl={logoUrl} />
        <AvatarSettings organizationId={profile.organization_id} userId={user.id} userName={profile.full_name || user.email || "משתמש"} initialAvatarUrl={avatarUrl} />

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          {sections.map(({ icon: Icon, title, description }) => (
            <button key={title} type="button" className="group flex items-center gap-4 rounded-2xl border border-[#E8EDF5] bg-white p-5 text-right shadow-[0_8px_24px_rgba(10,35,74,.05)] transition hover:-translate-y-0.5 hover:border-[#D9BC72] hover:shadow-[0_14px_30px_rgba(10,35,74,.09)]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#FBF6E9] text-[#C99B2D]"><Icon size={21} /></span>
              <span className="min-w-0 flex-1"><strong className="block text-base text-[#0B2348]">{title}</strong><small className="mt-1 block text-sm text-[#65738B]">{description}</small></span>
              <ChevronLeft size={18} className="text-[#94A0B3] transition group-hover:-translate-x-1 group-hover:text-[#C99B2D]" />
            </button>
          ))}
        </div>
      </main>
    </DashboardShell>
  );
}
