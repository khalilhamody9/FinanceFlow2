"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

import {
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Activity,
} from "lucide-react";

const BLUE = "#3B82F6";
const CYAN = "#22D3EE";
const VIOLET = "#8B5CF6";
const SLATE_LIGHT = "#B9C2D6";
const SLATE_MUTE = "#7C879E";

export default function LoginPage() {
  const router = useRouter();

const [identifier, setIdentifier] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
const handleSubmit = async (
  e: React.FormEvent<HTMLFormElement>
) => {
  e.preventDefault();

  setLoading(true);
  setErrorMessage("");

  const supabase = createClient();

  try {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: identifier.trim(),
        password,
      });

    console.log("LOGIN RESULT:", {
      user: data.user,
      error,
    });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    if (!data.user || !data.session) {
      setErrorMessage("המשתמש לא קיים או שהסיסמה שגויה");
      return;
    }

    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select(
          "id, organization_id, full_name, role, is_active"
        )
        .eq("id", data.user.id)
        .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setErrorMessage("לא נמצא פרופיל למשתמש");
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setErrorMessage("המשתמש אינו פעיל");
      return;
    }

if (!profile.organization_id) {
  await supabase.auth.signOut();
  setErrorMessage("המשתמש אינו משויך למשרד");
  return;
}

router.replace("/dashboard");
router.refresh();
  } catch (error) {
    console.error(error);
    setErrorMessage("אירעה שגיאה בכניסה");
  } finally {
    setLoading(false);
  }
};
  return (
    <div
      dir="rtl"
      style={{
        background: "radial-gradient(ellipse at 20% 0%, #131C36 0%, #060B18 55%)",
        fontFamily: "'Heebo', sans-serif",
        minHeight: "100vh",
      }}
      className="relative overflow-hidden px-4 py-10"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .adv-mono { font-family: 'IBM Plex Mono', monospace; direction: ltr; unicode-bidi: isolate; }
        .adv-grid {
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 34px 34px;
        }
        @keyframes adv-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
        @keyframes adv-pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,211,238,0.5); } 50% { opacity: 0.6; box-shadow: 0 0 0 6px rgba(34,211,238,0); } }
        @keyframes adv-dash { to { stroke-dashoffset: -200; } }
        .adv-card-1 { animation: adv-float 6s ease-in-out infinite; }
        .adv-card-2 { animation: adv-float 7s ease-in-out infinite; animation-delay: .6s; }
        .adv-dot { animation: adv-pulse 2.2s ease-in-out infinite; }
        .adv-line { stroke-dasharray: 6 6; animation: adv-dash 6s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .adv-card-1, .adv-card-2, .adv-dot, .adv-line { animation: none; } }
        .adv-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; }
        .adv-input:focus { outline: none; border-color: rgba(59,130,246,0.6); background: rgba(255,255,255,0.06); box-shadow: 0 0 0 4px rgba(59,130,246,0.12); }
        .adv-btn { background: linear-gradient(135deg, ${BLUE}, ${VIOLET}); transition: box-shadow .25s ease, transform .15s ease, filter .2s ease; box-shadow: 0 8px 24px -8px rgba(59,130,246,0.55); }
        .adv-btn:hover { filter: brightness(1.08); box-shadow: 0 10px 30px -6px rgba(139,92,246,0.6); }
        .adv-btn:active { transform: scale(0.98); }
        .adv-link { color: ${CYAN}; }
        .adv-link:hover { text-decoration: underline; }
        .adv-focusable:focus-visible { outline: 2px solid ${CYAN}; outline-offset: 2px; }
      `}</style>

      <div aria-hidden="true" className="pointer-events-none absolute -top-24 right-[-10%] h-[420px] w-[420px] rounded-full" style={{ background: BLUE, opacity: 0.16, filter: "blur(110px)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[-15%] left-[-8%] h-[380px] w-[380px] rounded-full" style={{ background: VIOLET, opacity: 0.14, filter: "blur(110px)" }} />

      <div className="relative z-10 flex min-h-[calc(100vh-80px)] items-center justify-center">
        <main className="grid w-full max-w-5xl overflow-hidden lg:grid-cols-2" style={{ borderRadius: "26px", border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)", backdropFilter: "blur(20px)", boxShadow: "0 40px 80px -30px rgba(0,0,0,0.7)" }}>
          <section className="adv-grid relative hidden min-h-[700px] flex-col justify-between overflow-hidden p-10 lg:flex">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(6,11,24,0) 0%, rgba(6,11,24,0.55) 100%)" }} />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center" style={{ background: `linear-gradient(135deg, ${BLUE}, ${VIOLET})`, borderRadius: "10px" }}>
                  <Activity size={19} color="#fff" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white">FinanceFlow</h1>
                  <p className="text-[11px]" style={{ color: SLATE_MUTE }}>Accounting Platform</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", borderRadius: "999px", color: "#C4B5FD" }}>
                <Sparkles size={12} />
                <span>מונע בינה מלאכותית</span>
              </div>
            </div>

            <div className="relative z-10 mt-8">
              <h2 className="max-w-sm text-3xl font-bold leading-[1.35] text-white">כל הנתונים הפיננסיים שלך, בזמן אמת.</h2>
              <p className="mt-3 max-w-xs text-sm leading-7" style={{ color: SLATE_LIGHT }}>
                מעקב חכם אחרי תזרים, חשבוניות ומשימות פתוחות — מסונכרן ומעודכן בכל רגע.
              </p>
            </div>

            <div className="adv-card-1 relative z-10 mt-8 p-5" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "16px" }}>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: SLATE_LIGHT }}>תזרים חודשי</span>
                <span className="adv-mono flex items-center gap-1 text-xs font-medium" style={{ color: "#5EEAD4" }}>
                  <ArrowUpRight size={13} />
                  +18.2%
                </span>
              </div>
              <svg viewBox="0 0 260 70" width="100%" height="70" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="advLine" x1="0" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
                    <stop stopColor={CYAN} />
                    <stop offset="1" stopColor={VIOLET} />
                  </linearGradient>
                  <linearGradient id="advFill" x1="0" y1="0" x2="0" y2="70" gradientUnits="userSpaceOnUse">
                    <stop stopColor={BLUE} stopOpacity="0.35" />
                    <stop offset="1" stopColor={BLUE} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 50 L35 42 L70 48 L105 28 L140 34 L175 14 L210 20 L260 4 L260 70 L0 70 Z" fill="url(#advFill)" />
                <path className="adv-line" d="M0 50 L35 42 L70 48 L105 28 L140 34 L175 14 L210 20 L260 4" stroke="url(#advLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div className="relative z-10 mt-4 flex gap-3">
              <div className="adv-card-2 flex flex-1 items-center gap-2.5 px-4 py-3" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px" }}>
                <span className="adv-dot inline-block h-2 w-2 rounded-full" style={{ background: CYAN }} />
                <div>
                  <p className="adv-mono text-sm font-medium text-white">312</p>
                  <p className="text-[11px]" style={{ color: SLATE_MUTE }}>חשבוניות סונכרנו</p>
                </div>
              </div>
              <div className="flex flex-1 items-center gap-2.5 px-4 py-3" style={{ background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "14px" }}>
                <ShieldCheck size={16} style={{ color: "#5EEAD4" }} />
                <div>
                  <p className="text-sm font-medium text-white">מאובטח</p>
                  <p className="text-[11px]" style={{ color: SLATE_MUTE }}>הצפנה מקצה לקצה</p>
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-[700px] flex-col justify-center p-8 sm:p-12 lg:p-16">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-9 text-center lg:text-right">
                <h2 className="text-3xl font-bold text-white">ברוכים הבאים</h2>
                <p className="mt-2 text-sm" style={{ color: SLATE_MUTE }}>התחברו כדי להמשיך למערכת</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {errorMessage ? (
                  <div className="rounded-2xl border border-red-500 bg-red-500/10 p-4 text-sm text-red-200">
                    {errorMessage}
                  </div>
                ) : null}

                <div>
                  <label htmlFor="identifier" className="mb-2 block text-sm font-medium" style={{ color: SLATE_LIGHT }}>
                    שם משתמש או אימייל
                  </label>
                  <div className="relative flex items-center">
                    <User size={17} className="absolute right-3.5" style={{ color: SLATE_MUTE }} />
                    <input
                      id="identifier"
                      type="text"
                      autoComplete="username"
                      placeholder="הזן שם משתמש או אימייל"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="adv-input adv-focusable w-full rounded-xl py-3 pr-11 pl-4 text-sm text-white placeholder:text-[#5B6479]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-medium" style={{ color: SLATE_LIGHT }}>סיסמה</label>
                  <div className="relative flex items-center">
                    <Lock size={17} className="absolute right-3.5" style={{ color: SLATE_MUTE }} />
<input
  id="password"
  type={showPassword ? "text" : "password"}
  autoComplete="current-password"
  placeholder="הזן סיסמה"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="adv-input adv-focusable w-full rounded-xl py-3 pr-11 pl-11 text-sm text-white placeholder:text-[#5B6479]"
  required
/>
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="adv-focusable absolute left-3.5" style={{ color: SLATE_MUTE }} aria-label={showPassword ? "הסתר סיסמה" : "הצג סיסמה"}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex cursor-pointer items-center gap-2" style={{ color: SLATE_MUTE }}>
                    <input type="checkbox" className="h-4 w-4" style={{ accentColor: BLUE }} />
                    זכור אותי
                  </label>
                  <a href="#" className="adv-link text-sm font-medium">שכחתי סיסמה</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="adv-btn w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "מתחבר..." : "התחברות"}
                </button>
              </form>

              <div className="mt-8 flex items-start justify-center gap-2 text-center text-xs leading-6" style={{ color: SLATE_MUTE }}>
                <ShieldCheck size={15} className="mt-0.5 shrink-0" style={{ color: "#5EEAD4" }} />
                <span>המערכת מאובטחת בהצפנה מתקדמת ואימות דו-שלבי.</span>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
