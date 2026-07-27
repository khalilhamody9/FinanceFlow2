"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, FileText, Search, X } from "lucide-react";
import styles from "./yearly-report.module.css";
import { createClient } from "@/lib/supabase/client";

type Client = {
  id: string; first_name: string | null; last_name: string | null; business_name: string | null;
  business_number: string | null; business_type: string | null; income_tax_file: string | null;
  has_capital_declaration: boolean | null; status: string | null;
};
type Readiness = "ready" | "not-ready";
type WorkField = "exemptDeclaration" | "annualReport" | "capitalDeclaration" | "balanceSheet";
type ClientKind = "exempt" | "licensed" | "company";
type StoredReport = { client_id: string; reporting_year: number; exempt_declaration_status: Readiness; capital_declaration_status: Readiness; annual_report_status: Readiness; balance_sheet_status: Readiness; assigned_to: string | null; notes: string | null };
type Props = { initialClients: Client[]; initialReports: StoredReport[]; organizationId: string };

const fields: WorkField[] = ["exemptDeclaration", "annualReport", "capitalDeclaration", "balanceSheet"];
const emptyState: Record<WorkField, Readiness> = { exemptDeclaration: "not-ready", annualReport: "not-ready", capitalDeclaration: "not-ready", balanceSheet: "not-ready" };

function getName(client: Client) { return client.business_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "לקוח ללא שם"; }
function getKind(type: string | null): ClientKind {
  const value = (type || "").toLowerCase();
  if (value.includes("חברה") || value.includes("company") || value.includes("ltd")) return "company";
  if (value.includes("פטור") || value.includes("exempt")) return "exempt";
  return "licensed";
}
function kindLabel(kind: ClientKind) { return kind === "exempt" ? "עוסק פטור" : kind === "company" ? "חברה" : "עוסק מורשה"; }
function relevantFields(client: Client): WorkField[] {
  const kind = getKind(client.business_type);
  const result: WorkField[] = kind === "exempt" ? ["exemptDeclaration", "annualReport"] : kind === "company" ? ["annualReport", "balanceSheet"] : ["annualReport"];
  if (client.has_capital_declaration) result.splice(result.length === 1 ? 0 : 1, 0, "capitalDeclaration");
  return result;
}

function StatusSelect({ value, onChange, label }: { value: Readiness; onChange: (value: Readiness) => void; label: string }) {
  return <label className={`${styles.status} ${value === "ready" ? styles.ready : styles.notReady}`}><span>{value === "ready" ? <Check size={15} /> : <X size={15} />}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as Readiness)}><option value="not-ready">לא מוכן</option><option value="ready">מוכן</option></select><ChevronDown size={13} /></label>;
}

export default function YearlyReportClient({ initialClients, initialReports, organizationId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [String(currentYear), String(currentYear - 1), String(currentYear - 2)];
  }, []);
  const [year, setYear] = useState(yearOptions[0]);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | ClientKind>("all");
  const initialStateMap = useMemo(() => Object.fromEntries(initialReports.map((report) => [`${report.client_id}-${report.reporting_year}`, { exemptDeclaration: report.exempt_declaration_status, capitalDeclaration: report.capital_declaration_status, annualReport: report.annual_report_status, balanceSheet: report.balance_sheet_status }])), [initialReports]);
  const [states, setStates] = useState<Record<string, Record<WorkField, Readiness>>>(initialStateMap);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");

  const clients = useMemo(() => initialClients.filter((client) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [getName(client), client.business_number, client.income_tax_file].filter(Boolean).join(" ").toLowerCase().includes(term);
    return matchesSearch && (kindFilter === "all" || getKind(client.business_type) === kindFilter);
  }), [initialClients, search, kindFilter]);

  const allSelected = clients.length > 0 && clients.every((client) => selected.includes(client.id));

  async function setField(clientId: string, field: WorkField, value: Readiness) {
    const key = `${clientId}-${year}`;
    const next = { ...(states[key] || emptyState), [field]: value };
    setStates((current) => ({ ...current, [key]: next }));
    setSaving((current) => [...current, key]);
    setSaveError("");
    const { error } = await supabase.from("annual_reports").upsert({ organization_id: organizationId, client_id: clientId, reporting_year: Number(year), exempt_declaration_status: next.exemptDeclaration, capital_declaration_status: next.capitalDeclaration, annual_report_status: next.annualReport, balance_sheet_status: next.balanceSheet, updated_at: new Date().toISOString() }, { onConflict: "organization_id,client_id,reporting_year" });
    if (error) setSaveError(`השמירה נכשלה: ${error.message}`);
    setSaving((current) => current.filter((item) => item !== key));
  }

  return <main className={styles.page} dir="rtl"><section className={styles.card}>
    <header className={styles.header}><div><p>דוחות / דיווח שנתי</p><h1>דיווח שנתי <span>| {year}</span></h1><small>מעקב אחר השלמת הדוחות השנתיים לפי סוג הלקוח</small></div><label className={styles.year}><span>שנת דיווח</span><select value={year} onChange={(event) => setYear(event.target.value)}>{yearOptions.map((yearOption) => <option key={yearOption} value={yearOption}>{yearOption}</option>)}</select><ChevronDown size={16} /></label></header>

    <div className={styles.toolbar}><label className={styles.search}><Search size={19} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש לפי שם לקוח או מספר תיק..." /></label><div className={styles.tabs}>{([{ value: "all", label: "הכל" }, { value: "exempt", label: "עוסק פטור" }, { value: "licensed", label: "עוסק מורשה" }, { value: "company", label: "חברה" }] as const).map((tab) => <button key={tab.value} type="button" className={kindFilter === tab.value ? styles.activeTab : ""} onClick={() => setKindFilter(tab.value)}>{tab.label}</button>)}</div></div>

    <div className={styles.legend}><span><i className={styles.readyDot} /> מוכן</span><span><i className={styles.notReadyDot} /> לא מוכן</span><span><i className={styles.naDot} /> לא רלוונטי</span></div>{saveError && <p className={styles.saveError}>{saveError}</p>}
    <div className={styles.tableWrap}><table><thead><tr><th><input type="checkbox" aria-label="בחירת הכל" checked={allSelected} onChange={() => setSelected(allSelected ? selected.filter((id) => !clients.some((client) => client.id === id)) : Array.from(new Set([...selected, ...clients.map((client) => client.id)])))} /></th><th>מס׳ תיק</th><th>שם לקוח</th><th>סוג עוסק</th><th>הצהרת עוסק</th><th>הצהרת הון</th><th>דוח שנתי</th><th>מאזן</th><th>מצב כללי</th><th>הערות</th></tr></thead><tbody>
      {clients.map((client, index) => { const relevant = relevantFields(client); const key = `${client.id}-${year}`; const state = states[key] || emptyState; const allReady = relevant.every((field) => state[field] === "ready"); return <tr key={client.id}><td><input type="checkbox" aria-label={`בחירת ${getName(client)}`} checked={selected.includes(client.id)} onChange={() => setSelected((current) => current.includes(client.id) ? current.filter((id) => id !== client.id) : [...current, client.id])} /></td><td className={styles.number}>{client.business_number || 1000 + index}</td><td><div className={styles.client}><span>{getName(client).slice(0, 2)}</span><div><strong>{getName(client)}</strong><small>{client.income_tax_file ? `תיק מ״ה ${client.income_tax_file}` : "ללא מספר תיק מ״ה"}</small></div></div></td><td><b className={`${styles.kind} ${styles[getKind(client.business_type)]}`}>{kindLabel(getKind(client.business_type))}</b></td>
        {fields.map((field) => <td key={field}>{relevant.includes(field) ? <StatusSelect value={state[field]} onChange={(value) => setField(client.id, field, value)} label={`${field} עבור ${getName(client)}`} /> : <span className={styles.na}>לא רלוונטי</span>}</td>)}
        <td><span className={`${styles.overall} ${allReady ? styles.overallReady : styles.overallPending}`}>{allReady ? <Check size={14} /> : <X size={14} />}{allReady ? "מוכן" : "לא מוכן"}</span></td><td><button type="button" className={styles.notes}><FileText size={16} /> {saving.includes(key) ? "שומר..." : "הערה"}</button></td></tr>; })}
    </tbody></table>{clients.length === 0 && <div className={styles.empty}><Search size={27} /><strong>לא נמצאו לקוחות</strong><span>נסו לשנות את החיפוש או סוג העוסק</span></div>}</div>
    <footer><span>מציג {clients.length} מתוך {initialClients.length} לקוחות</span><span>{selected.length ? `${selected.length} לקוחות נבחרו` : "לא נבחרו לקוחות"}</span></footer>
  </section></main>;
}
