"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type LogoSettingsProps = {
  organizationId: string;
  initialLogoUrl: string | null;
};

export default function LogoSettings({ organizationId, initialLogoUrl }: LogoSettingsProps) {
  const supabase = createClient();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage("אפשר להעלות קובץ PNG, JPG או WEBP בלבד.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage("גודל הלוגו יכול להיות עד 2MB.");
      return;
    }

    setBusy(true);
    setMessage(null);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${organizationId}/logo.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("organization-logos")
      .upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });

    if (uploadError) {
      setMessage(`העלאת הלוגו נכשלה: ${uploadError.message}`);
      setBusy(false);
      return;
    }

    const { data } = supabase.storage.from("organization-logos").getPublicUrl(path);
    const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
    const { error: updateError } = await supabase.rpc("set_organization_logo", {
      p_logo_url: publicUrl,
    });

    if (updateError) {
      const missingFunction = updateError.message.includes("set_organization_logo");
      setMessage(missingFunction
        ? "שמירת הלוגו טרם הופעלה במסד הנתונים. יש להריץ את מיגרציית שמירת הלוגו ב-Supabase."
        : `שמירת הלוגו נכשלה: ${updateError.message}`);
    } else {
      setLogoUrl(publicUrl);
      setMessage("הלוגו נשמר ומוצג כעת בסרגל הצד.");
      window.dispatchEvent(new CustomEvent("organization-logo-change", { detail: publicUrl }));
      router.refresh();
    }
    setBusy(false);
    event.target.value = "";
  }

  async function removeLogo() {
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.rpc("set_organization_logo", { p_logo_url: null });
    if (error) {
      setMessage(`מחיקת הלוגו נכשלה: ${error.message}`);
    } else {
      setLogoUrl(null);
      setMessage("הלוגו הוסר.");
      window.dispatchEvent(new CustomEvent("organization-logo-change", { detail: null }));
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <section className="mt-7 rounded-3xl border border-[#E8EDF5] bg-white p-6 shadow-[0_12px_34px_rgba(10,35,74,.07)]">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="grid h-28 w-28 shrink-0 place-items-center overflow-hidden rounded-3xl border border-dashed border-[#C99B2D]/60 bg-[#FBF6E9] p-3">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="תצוגה מקדימה של לוגו המשרד" className="h-full w-full object-contain" />
          ) : (
            <ImagePlus size={36} className="text-[#C99B2D]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[#0B2348]">לוגו המשרד</h2>
          <p className="mt-1 text-sm leading-6 text-[#65738B]">הלוגו יוצג בתחתית סרגל הצד. מומלץ להשתמש בתמונה ריבועית עם רקע שקוף.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="sr-only" />
            <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl bg-[#C99B2D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#B8871B] disabled:opacity-60">
              {busy ? <Loader2 size={17} className="animate-spin" /> : <UploadCloud size={17} />}
              {logoUrl ? "החלפת לוגו" : "העלאת לוגו"}
            </button>
            {logoUrl && <button type="button" disabled={busy} onClick={removeLogo} className="inline-flex items-center gap-2 rounded-xl border border-[#E8EDF5] px-4 py-2.5 text-sm font-semibold text-[#65738B] transition hover:border-red-200 hover:text-red-600 disabled:opacity-60"><Trash2 size={16} />הסרת לוגו</button>}
          </div>
          {message && <p role="status" className="mt-3 text-sm text-[#65738B]">{message}</p>}
        </div>
      </div>
    </section>
  );
}
