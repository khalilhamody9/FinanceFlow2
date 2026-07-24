"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Camera, Loader2, Trash2, UploadCloud, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type AvatarSettingsProps = {
  organizationId: string;
  userId: string;
  userName: string;
  initialAvatarUrl: string | null;
};

export default function AvatarSettings({ organizationId, userId, userName, initialAvatarUrl }: AvatarSettingsProps) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("אפשר להעלות קובץ PNG, JPG או WEBP בלבד.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("גודל התמונה יכול להיות עד 2MB.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${organizationId}/users/${userId}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("organization-logos")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      setMessage(`העלאת התמונה נכשלה: ${uploadError.message}`);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from("organization-logos").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
    if (error) {
      setMessage(`שמירת התמונה נכשלה: ${error.message}`);
    } else {
      setAvatarUrl(publicUrl);
      window.dispatchEvent(new CustomEvent("user-avatar-change", { detail: publicUrl }));
      setMessage("תמונת הפרופיל נשמרה.");
    }
    setBusy(false);
    event.target.value = "";
  }

  async function removeAvatar() {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ data: { avatar_url: null } });
    if (error) {
      setMessage(`הסרת התמונה נכשלה: ${error.message}`);
    } else {
      setAvatarUrl(null);
      window.dispatchEvent(new CustomEvent("user-avatar-change", { detail: null }));
      setMessage("תמונת הפרופיל הוסרה.");
    }
    setBusy(false);
  }

  return (
    <section className="mt-5 rounded-3xl border border-[#E8EDF5] bg-white p-6 shadow-[0_12px_34px_rgba(10,35,74,.07)]">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="relative grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#EEF3F8] shadow-[0_8px_24px_rgba(10,35,74,.15)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={`תמונת הפרופיל של ${userName}`} className="h-full w-full object-cover" />
          ) : <UserRound size={42} className="text-[#94A0B3]" />}
          <span className="absolute bottom-1 left-1 grid h-8 w-8 place-items-center rounded-full bg-[#C99B2D] text-white"><Camera size={15} /></span>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#0B2348]">תמונת משתמש</h2>
          <p className="mt-1 text-sm leading-6 text-[#65738B]">התמונה תופיע ליד השם שלך בחלק העליון של המערכת.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="sr-only" />
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-[#0B2348] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123B74] disabled:opacity-60">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
              {avatarUrl ? "החלפת תמונה" : "העלאת תמונה"}
            </button>
            {avatarUrl && <button type="button" disabled={busy} onClick={removeAvatar} className="inline-flex items-center gap-2 rounded-xl border border-[#E8EDF5] px-4 py-2.5 text-sm font-semibold text-[#65738B] hover:text-red-600 disabled:opacity-60"><Trash2 size={16} />הסרת תמונה</button>}
          </div>
          {message && <p role="status" className="mt-3 text-sm text-[#65738B]">{message}</p>}
        </div>
      </div>
    </section>
  );
}
