"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ImportRow = {
  rowNumber: number;
  first_name: string; last_name: string; id_number: string | null; birth_date: string | null;
  phone: string | null; second_phone: string | null; email: string | null; city: string | null;
  street: string | null; house_number: string | null; zip_code: string | null;
  business_name: string | null; business_type: string | null; business_number: string | null;
  business_open_date: string | null; vat_report_type: string | null; income_tax_file: string | null;
  deductions_file: string | null; vat_file: string | null; po_box: string | null; occupation: string | null;
  marital_status: string | null; children_count: number | null; has_academic_degree: boolean;
  score: number; status: string; notes: string | null; has_inventory: boolean; is_detailed: boolean;
  has_audit: boolean; has_fuel: boolean; has_856: boolean; has_capital_declaration: boolean;
  has_pension: boolean; has_benefit: boolean; fee_amount: number; payment_method: string | null;
  payment_frequency: string | null; errors: string[];
};

type Props = { organizationId: string; existingBusinessNumbers: string[]; onImported: () => void | Promise<void> };
type ColumnMap = Map<string, number>;

const REQUIRED_HEADERS = [["שם פרטי", "first_name"], ["שם משפחה", "last_name"]];
const valueText = (value: unknown) => String(value ?? "").trim();
const nullable = (value: unknown) => valueText(value) || null;

function cell(row: unknown[], columns: ColumnMap, ...names: string[]) {
  const name = names.find((candidate) => columns.has(candidate.toLowerCase()));
  return name ? row[columns.get(name.toLowerCase())!] : "";
}
function normalizePhone(value: unknown) {
  const result = valueText(value).replace(/[^\d+]/g, "");
  return /^5\d{8}$/.test(result) ? `0${result}` : result;
}
function normalizeDate(value: unknown) {
  const result = valueText(value);
  if (!result) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(result)) return result;
  const match = result.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  return match ? `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}` : result;
}
function normalizeBoolean(value: unknown) {
  return ["1", "true", "yes", "כן", "✓", "x"].includes(valueText(value).toLowerCase());
}
function normalizeNumber(value: unknown) {
  const number = Number(valueText(value).replace(/[₪,\s]/g, ""));
  return Number.isFinite(number) ? number : 0;
}
function normalizeReportType(value: unknown) {
  const result = valueText(value).replace(/[־–—-]/g, " ").replace(/\s+/g, " ");
  return result || null;
}
function normalizeStatus(value: unknown) {
  const result = valueText(value).toLowerCase();
  if (["לא פעיל", "inactive"].includes(result)) return "inactive";
  if (["פעיל ללא פעילות", "active-no-activity"].includes(result)) return "active-no-activity";
  return "active";
}
function normalizeMaritalStatus(value: unknown) {
  const result = valueText(value).toLowerCase();
  const map: Record<string, string> = { "רווק": "single", "רווקה": "single", "נשוי": "married", "נשואה": "married", "גרוש": "divorced", "גרושה": "divorced", "אלמן": "widowed", "אלמנה": "widowed" };
  return map[result] || result || null;
}
function normalizePaymentMethod(value: unknown) {
  const result = valueText(value).toLowerCase();
  const map: Record<string, string> = { "העברה בנקאית": "bank_transfer", "הוראת קבע": "direct_debit", "כרטיס אשראי": "credit_card", "מזומן": "cash", "צ׳ק": "check", "צ'ק": "check" };
  return map[result] || result || null;
}
function normalizePaymentFrequency(value: unknown) {
  const result = valueText(value).toLowerCase().replace(/[־–—-]/g, " ").replace(/\s+/g, " ");
  const map: Record<string, string> = { "חודשי": "monthly", "דו חודשי": "bimonthly", "רבעוני": "quarterly", "שנתי": "annual", "חד פעמי": "one_time" };
  return map[result] || result || null;
}

const yesNo = (value: boolean) => value ? "כן" : "לא";
const PREVIEW_COLUMNS: { label: string; value: (row: ImportRow) => string | number }[] = [
  { label: "שורה", value: (row) => row.rowNumber },
  { label: "שם פרטי", value: (row) => row.first_name },
  { label: "שם משפחה", value: (row) => row.last_name },
  { label: "תעודת זהות", value: (row) => row.id_number || "—" },
  { label: "תאריך לידה", value: (row) => row.birth_date || "—" },
  { label: "טלפון", value: (row) => row.phone || "—" },
  { label: "טלפון נוסף", value: (row) => row.second_phone || "—" },
  { label: "אימייל", value: (row) => row.email || "—" },
  { label: "עיר", value: (row) => row.city || "—" },
  { label: "רחוב", value: (row) => row.street || "—" },
  { label: "מספר בית", value: (row) => row.house_number || "—" },
  { label: "מיקוד", value: (row) => row.zip_code || "—" },
  { label: "שם העסק", value: (row) => row.business_name || "—" },
  { label: "סוג עסק", value: (row) => row.business_type || "—" },
  { label: "מספר עוסק", value: (row) => row.business_number || "—" },
  { label: "תאריך פתיחת עסק", value: (row) => row.business_open_date || "—" },
  { label: "סוג דיווח מע״מ", value: (row) => row.vat_report_type || "—" },
  { label: "תיק מס הכנסה", value: (row) => row.income_tax_file || "—" },
  { label: "תיק ניכויים", value: (row) => row.deductions_file || "—" },
  { label: "תיק מע״מ", value: (row) => row.vat_file || "—" },
  { label: "ת.ד.", value: (row) => row.po_box || "—" },
  { label: "עיסוק", value: (row) => row.occupation || "—" },
  { label: "מצב משפחתי", value: (row) => row.marital_status || "—" },
  { label: "מספר ילדים", value: (row) => row.children_count ?? "—" },
  { label: "תואר אקדמי", value: (row) => yesNo(row.has_academic_degree) },
  { label: "ניקוד", value: (row) => row.score },
  { label: "סטטוס", value: (row) => row.status },
  { label: "הערות", value: (row) => row.notes || "—" },
  { label: "שכר טרחה", value: (row) => row.fee_amount },
  { label: "אמצעי תשלום", value: (row) => row.payment_method || "—" },
  { label: "תדירות תשלום", value: (row) => row.payment_frequency || "—" },
  { label: "מלאי", value: (row) => yesNo(row.has_inventory) },
  { label: "מפורט", value: (row) => yesNo(row.is_detailed) },
  { label: "ביקורת", value: (row) => yesNo(row.has_audit) },
  { label: "סולר", value: (row) => yesNo(row.has_fuel) },
  { label: "856", value: (row) => yesNo(row.has_856) },
  { label: "הצהרת הון", value: (row) => yesNo(row.has_capital_declaration) },
  { label: "פנסיה", value: (row) => yesNo(row.has_pension) },
  { label: "הטבה", value: (row) => yesNo(row.has_benefit) },
];

export default function ClientsImport({ organizationId, existingBusinessNumbers, onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const [importing, setImporting] = useState(false);
  const validRows = rows.filter((row) => !row.errors.length);

  function close() {
    if (importing) return;
    setOpen(false); setRows([]); setFileName(""); setMessage(""); setSuccess("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function parseFile(file: File) {
    setMessage(""); setSuccess(""); setFileName(file.name);
    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", raw: false });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, raw: false, defval: "" });
      const columns = new Map((data[0] || []).map((header, index) => [valueText(header).toLowerCase(), index]));
      const missing = REQUIRED_HEADERS.filter((aliases) => !aliases.some((header) => columns.has(header.toLowerCase()))).map((aliases) => aliases[0]);
      if (missing.length) { setRows([]); setMessage(`חסרות עמודות חובה: ${missing.join(", ")}`); return; }

      const existing = new Set(existingBusinessNumbers.filter(Boolean).map(valueText));
      const seen = new Set<string>();
      const parsed = data.slice(1).filter((row) => row.some((item) => valueText(item))).map((row, index) => {
        const get = (...names: string[]) => cell(row, columns, ...names);
        const firstName = valueText(get("שם פרטי", "first_name"));
        const lastName = valueText(get("שם משפחה", "last_name"));
        const businessNumber = valueText(get("מספר עוסק", "business_number"));
        const email = valueText(get("אימייל", "email"));
        const errors: string[] = [];
        if (!firstName) errors.push("חסר שם פרטי");
        if (!lastName) errors.push("חסר שם משפחה");
        if (businessNumber && existing.has(businessNumber)) errors.push("מספר עוסק קיים");
        if (businessNumber && seen.has(businessNumber)) errors.push("מספר עוסק כפול בקובץ");
        if (businessNumber) seen.add(businessNumber);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("אימייל לא תקין");

        return {
          rowNumber: index + 2, first_name: firstName, last_name: lastName,
          id_number: nullable(get("תעודת זהות", "מספר זהות", "id_number")), birth_date: normalizeDate(get("תאריך לידה", "birth_date")),
          phone: normalizePhone(get("טלפון", "נייד", "phone")) || null, second_phone: normalizePhone(get("טלפון נוסף", "second_phone")) || null,
          email: email || null, city: nullable(get("עיר", "city")), street: nullable(get("רחוב", "street")),
          house_number: nullable(get("מספר בית", "house_number")), zip_code: nullable(get("מיקוד", "zip_code")),
          business_name: nullable(get("שם העסק", "business_name")), business_type: nullable(get("סוג עסק", "business_type")),
          business_number: businessNumber || null, business_open_date: normalizeDate(get("תאריך פתיחת עסק", "business_open_date")),
          vat_report_type: normalizeReportType(get("סוג דיווח", "סוג דיווח מע״מ", "vat_report_type")),
          income_tax_file: nullable(get("תיק מס הכנסה", "income_tax_file")), deductions_file: nullable(get("תיק ניכויים", "deductions_file")),
          vat_file: nullable(get("תיק מע״מ", "vat_file")), po_box: nullable(get("ת.ד.", "תא דואר", "po_box")), occupation: nullable(get("עיסוק", "occupation")),
          marital_status: normalizeMaritalStatus(get("מצב משפחתי", "marital_status")),
          children_count: valueText(get("מספר ילדים", "children_count")) ? normalizeNumber(get("מספר ילדים", "children_count")) : null,
          has_academic_degree: normalizeBoolean(get("תואר אקדמי", "has_academic_degree")), score: normalizeNumber(get("ניקוד", "score")),
          status: normalizeStatus(get("סטטוס", "status")), notes: nullable(get("הערות", "notes")),
          has_inventory: normalizeBoolean(get("מלאי", "has_inventory")), is_detailed: normalizeBoolean(get("מפורט", "is_detailed")),
          has_audit: normalizeBoolean(get("ביקורת", "has_audit")), has_fuel: normalizeBoolean(get("סולר", "has_fuel")),
          has_856: normalizeBoolean(get("856", "has_856")), has_capital_declaration: normalizeBoolean(get("הצהרת הון", "has_capital_declaration")),
          has_pension: normalizeBoolean(get("פנסיה", "has_pension")), has_benefit: normalizeBoolean(get("הטבה", "has_benefit")),
          fee_amount: normalizeNumber(get("שכר טרחה", "fee_amount")), payment_method: normalizePaymentMethod(get("אמצעי תשלום", "payment_method")),
          payment_frequency: normalizePaymentFrequency(get("תדירות תשלום", "payment_frequency")), errors,
        } satisfies ImportRow;
      });
      setRows(parsed);
      if (!parsed.length) setMessage("לא נמצאו לקוחות בקובץ.");
    } catch (error) {
      console.error("EXCEL PARSE ERROR:", error); setRows([]);
      setMessage("לא ניתן לקרוא את הקובץ. יש לבחור קובץ Excel תקין.");
    }
  }

  async function importClients() {
    if (!validRows.length) return;
    setImporting(true); setMessage("");
    const payload = validRows.map(({ rowNumber: _rowNumber, errors: _errors, ...row }) => ({ ...row, organization_id: organizationId }));
    const { error } = await createClient().from("clients").insert(payload);
    if (error) { setMessage(`הייבוא נכשל: ${error.message}`); setImporting(false); return; }
    setSuccess(`${validRows.length} לקוחות יובאו בהצלחה.`); setImporting(false); await onImported();
  }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="pill-btn dash-focusable flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold" style={{ borderRadius: 999, border: "1.5px solid #0F9488", color: "#0F9488", background: "#fff" }}><Upload size={16} />ייבוא לקוחות מ־Excel</button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#07152F]/55 p-4" dir="rtl"><section className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
      <header className="flex items-center justify-between border-b border-[#E8EDF5] px-6 py-5"><div><h2 className="text-xl font-bold text-[#0B2348]">ייבוא לקוחות מ־Excel</h2><p className="mt-1 text-sm text-[#65738B]">כל העמודות אופציונליות מלבד שם פרטי ושם משפחה.</p></div><button type="button" onClick={close} aria-label="סגירה" className="rounded-xl p-2 text-[#65738B] hover:bg-[#F3F5F8]"><X /></button></header>
      <div className="max-h-[calc(92vh-150px)] overflow-auto p-6"><input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void parseFile(file); }} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#B9C6D8] bg-[#F8FAFD] px-6 py-8 text-[#0B2348] hover:border-[#C99B2D]"><FileSpreadsheet size={28} /><span className="font-semibold">{fileName || "בחירת קובץ Excel"}</span></button>
        {message && <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertCircle size={18} />{message}</p>}{success && <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700"><CheckCircle2 size={18} />{success}</p>}
        {!!rows.length && <><div className="my-5 flex flex-wrap gap-3 text-sm font-semibold"><span className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">{rows.length} שורות</span><span className="rounded-full bg-green-50 px-4 py-2 text-green-700">{validRows.length} מוכנות</span><span className="rounded-full bg-red-50 px-4 py-2 text-red-700">{rows.length - validRows.length} עם שגיאות</span></div>
          <div className="overflow-x-auto rounded-2xl border border-[#E8EDF5]"><table className="min-w-max border-collapse text-right text-sm"><thead className="sticky top-0 bg-[#F7F9FC] text-[#65738B]"><tr>{PREVIEW_COLUMNS.map((column) => <th key={column.label} className="whitespace-nowrap border-b border-[#E8EDF5] px-4 py-3">{column.label}</th>)}<th className="whitespace-nowrap border-b border-[#E8EDF5] px-4 py-3">מצב הייבוא</th></tr></thead><tbody>{rows.map((row) => <tr key={row.rowNumber} className={row.errors.length ? "bg-red-50/60" : ""}>{PREVIEW_COLUMNS.map((column) => <td key={column.label} className="max-w-[240px] whitespace-nowrap px-4 py-3">{column.value(row)}</td>)}<td className="sticky left-0 bg-inherit px-4 py-3">{row.errors.length ? <span className="whitespace-nowrap text-xs font-semibold text-red-700">{row.errors.join(" · ")}</span> : <span className="font-semibold text-green-700">תקין</span>}</td></tr>)}</tbody></table></div></>}
      </div><footer className="flex items-center justify-end gap-3 border-t border-[#E8EDF5] px-6 py-4"><button type="button" onClick={close} disabled={importing} className="rounded-xl border border-[#DCE3EC] px-5 py-2.5 font-semibold text-[#65738B]">ביטול</button><button type="button" onClick={() => void importClients()} disabled={!validRows.length || importing || !!success} className="rounded-xl bg-[#C99B2D] px-6 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{importing ? "מייבא..." : `ייבוא ${validRows.length} לקוחות`}</button></footer>
    </section></div>}
  </>;
}
