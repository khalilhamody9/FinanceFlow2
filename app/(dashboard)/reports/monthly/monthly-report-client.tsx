"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown, Copy, RefreshCw, Search, UserRoundPlus,
  Check, X, FileText,
} from "lucide-react";
import styles from "./monthly-report.module.css";
import { createClient } from "@/lib/supabase/client";

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  business_number: string | null;
  phone: string | null;
  vat_file: string | null;
  income_tax_file: string | null;
  deductions_file: string | null;
  vat_report_type: string | null;
  status: string | null;
  has_fuel: boolean | null;
  has_inventory: boolean | null;
  is_detailed: boolean | null;
  notes: string | null;
};

type StoredReport = {
  client_id: string; reporting_year: number; reporting_month: number; vat_status: Readiness; income_tax_status: Readiness;
  national_insurance_status: Readiness; income_tax_deductions_status: Readiness; national_insurance_deductions_status: Readiness;
  fuel_refund_status: Readiness; overall_status: OverallStatus; assigned_to: string | null; notes: string | null;
};
type Props = { initialClients: Client[]; initialReports: StoredReport[]; organizationId: string };
type Readiness = "ready" | "not-ready";
type OverallStatus = "not-selected" | "ready" | "not-arrived" | "material" | "contacted" | "none";
type WorkField = "vat" | "incomeTax" | "nationalInsurance" | "incomeTaxDeductions" | "nationalInsuranceDeductions" | "fuelRefund";
type RowState = Record<WorkField, Readiness>;

const workFields: WorkField[] = ["vat", "incomeTax", "nationalInsurance", "incomeTaxDeductions", "nationalInsuranceDeductions", "fuelRefund"];
const defaultRowState: RowState = {
  vat: "not-ready",
  incomeTax: "not-ready",
  nationalInsurance: "not-ready",
  incomeTaxDeductions: "not-ready",
  nationalInsuranceDeductions: "not-ready",
  fuelRefund: "not-ready",
};
const overallOptions: { value: OverallStatus; label: string }[] = [
  { value: "not-selected", label: "--בחר--" },
  { value: "ready", label: "מוכן" },
  { value: "not-arrived", label: "טרם הגיע" },
  { value: "material", label: "חומר" },
  { value: "contacted", label: "התקשרתי" },
  { value: "none", label: "אין" },
];

function clientName(client: Client) {
  return client.business_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "לקוח ללא שם";
}

function ReadinessSelect({ value, onChange, label }: { value: Readiness; onChange: (value: Readiness) => void; label: string }) {
  const Icon = value === "ready" ? Check : X;
  return (
    <label className={`${styles.status} ${value === "ready" ? styles.ready : styles.notReady}`} title={label}>
      <Icon size={15} strokeWidth={2.5} />
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value as Readiness)}>
        <option value="ready">מוכן</option>
        <option value="not-ready">לא מוכן</option>
      </select>
      <ChevronDown size={13} />
    </label>
  );
}

function OverallStatusSelect({ value, allReady, onChange, label }: { value: OverallStatus; allReady: boolean; onChange: (value: OverallStatus) => void; label: string }) {
  const displayedValue = allReady ? "ready" : value === "ready" ? "not-selected" : value;
  return (
    <label className={`${styles.overallStatus} ${allReady ? styles.ready : ""}`}>
      <select aria-label={label} value={displayedValue} onChange={(event) => onChange(event.target.value as OverallStatus)}>
        {overallOptions.map((option) => <option key={option.value} value={option.value} disabled={option.value === "ready" && !allReady}>{option.label}</option>)}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}

export default function MonthlyReportClient({ initialClients, initialReports, organizationId }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState("06/2026");
  const [reportType, setReportType] = useState("הכל");
  const [clientStatus, setClientStatus] = useState("פעילים");
  const [selected, setSelected] = useState<string[]>([]);
  const initialStateMap = useMemo(() => Object.fromEntries(initialReports.map((report) => [`${report.client_id}-${report.reporting_year}-${report.reporting_month}`, { vat: report.vat_status, incomeTax: report.income_tax_status, nationalInsurance: report.national_insurance_status, incomeTaxDeductions: report.income_tax_deductions_status, nationalInsuranceDeductions: report.national_insurance_deductions_status, fuelRefund: report.fuel_refund_status }])), [initialReports]);
  const initialOverallMap = useMemo(() => Object.fromEntries(initialReports.map((report) => [`${report.client_id}-${report.reporting_year}-${report.reporting_month}`, report.overall_status])), [initialReports]);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>(initialStateMap);
  const [overallStates, setOverallStates] = useState<Record<string, OverallStatus>>(initialOverallMap);
  const [saving, setSaving] = useState<string[]>([]);
  const [saveError, setSaveError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return initialClients.filter((client) => {
      const matchesSearch = !term || [clientName(client), client.business_number, client.phone, client.vat_file, client.income_tax_file]
        .filter(Boolean).join(" ").toLowerCase().includes(term);
      const matchesStatus = clientStatus === "הכל" || client.status === "active" || !client.status;
      const matchesType = reportType === "הכל" || client.vat_report_type === reportType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [initialClients, search, reportType, clientStatus]);

  const allSelected = filtered.length > 0 && filtered.every((client) => selected.includes(client.id));
  const [month, reportYear] = period.split("/").map(Number);
  const stateKey = (id: string) => `${id}-${reportYear}-${month}`;

  async function persistReport(clientId: string, row: RowState, overall: OverallStatus) {
    const key = stateKey(clientId);
    setSaving((current) => [...current, key]);
    setSaveError("");
    const { error } = await supabase.from("monthly_reports").upsert({ organization_id: organizationId, client_id: clientId, reporting_year: reportYear, reporting_month: month, vat_status: row.vat, income_tax_status: row.incomeTax, national_insurance_status: row.nationalInsurance, income_tax_deductions_status: row.incomeTaxDeductions, national_insurance_deductions_status: row.nationalInsuranceDeductions, fuel_refund_status: row.fuelRefund, overall_status: overall, updated_at: new Date().toISOString() }, { onConflict: "organization_id,client_id,reporting_year,reporting_month" });
    if (error) setSaveError(`השמירה נכשלה: ${error.message}`);
    setSaving((current) => current.filter((item) => item !== key));
  }

  const updateReadiness = (id: string, field: WorkField, value: Readiness) => {
    const key = stateKey(id);
    const nextRow = { ...(rowStates[key] || defaultRowState), [field]: value };
    const nextOverall = workFields.every((item) => nextRow[item] === "ready") ? "ready" : overallStates[key] === "ready" ? "not-selected" : overallStates[key] || "not-selected";
    setRowStates((current) => ({
      ...current,
      [key]: nextRow,
    }));
    setOverallStates((current) => ({ ...current, [key]: nextOverall }));
    void persistReport(id, nextRow, nextOverall);
  };

  function toggleAll() {
    if (allSelected) setSelected((current) => current.filter((id) => !filtered.some((client) => client.id === id)));
    else setSelected((current) => Array.from(new Set([...current, ...filtered.map((client) => client.id)])));
  }

  function refresh() {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 650);
  }

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.card}>
        <div className={styles.headingRow}>
          <div>
            <p className={styles.eyebrow}>דוחות / דיווח שוטף</p>
            <h1>דיווח שוטף <span>| {period}</span></h1>
            <p className={styles.subtitle}>מעקב מרוכז אחר סטטוס הדיווחים החודשיים של כל לקוחות המשרד</p>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.outlineButton}><UserRoundPlus size={18} /> שיוך עובד מטפל</button>
            <button type="button" className={styles.outlineButton} onClick={refresh}><RefreshCw size={18} className={refreshing ? styles.spin : ""} /> רענון רשימה</button>
          </div>
        </div>

        <div className={styles.filters}>
          <label className={styles.search}><Search size={20} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="חיפוש לפי שם לקוח, מספר תיק או טלפון..." /></label>
          <label className={styles.select}><span>סטטוס לקוח</span><select value={clientStatus} onChange={(event) => setClientStatus(event.target.value)}><option>פעילים</option><option>הכל</option></select><ChevronDown size={17} /></label>
          <label className={styles.select}><span>סוג דיווח</span><select value={reportType} onChange={(event) => setReportType(event.target.value)}><option>הכל</option><option>חודשי</option><option>דו חודשי</option></select><ChevronDown size={17} /></label>
          <label className={styles.select}><span>תקופת דיווח</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>06/2026</option><option>05/2026</option><option>04/2026</option></select><ChevronDown size={17} /></label>
          <button type="button" className={styles.primaryButton}>הצג</button>
        </div>

        <div className={styles.chips}><span>חודשי <button aria-label="הסר מסנן">×</button></span><span>פעילים <button aria-label="הסר מסנן">×</button></span><span>{period} <button aria-label="הסר מסנן">×</button></span></div>
        {saveError && <p className={styles.saveError}>{saveError}</p>}

        <div className={styles.tableWrap}>
          <table>
            <thead><tr>
              <th><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="בחירת הכל" /></th>
              <th>מס׳ תיק</th><th>שם לקוח</th><th>נייד</th><th>תיק מע״מ</th><th>תיק מס הכנסה</th><th>תיק ניכויים</th><th>מצב</th><th>מע״מ</th><th>מס הכנסה</th><th>ביטוח לאומי</th><th>מ״ה ניכויים</th><th>ב.ל ניכויים</th><th>החזר סולר</th><th>מטפל</th><th>הערות</th>
            </tr></thead>
            <tbody>
              {filtered.map((client, index) => {
                const key = stateKey(client.id);
                const rowState = rowStates[key] || defaultRowState;
                const allReady = workFields.every((field) => rowState[field] === "ready");
                const overallState = overallStates[key] || "not-selected";
                return <tr key={client.id}>
                  <td><input type="checkbox" checked={selected.includes(client.id)} onChange={() => setSelected((value) => value.includes(client.id) ? value.filter((id) => id !== client.id) : [...value, client.id])} aria-label={`בחירת ${clientName(client)}`} /></td>
                  <td className={styles.number}>{client.business_number || String(802 + index)}</td>
                  <td><div className={styles.clientCell}><span className={styles.avatar}>{clientName(client).slice(0, 2)}</span><div><strong>{clientName(client)}</strong><small>{client.vat_report_type || "דיווח חודשי"}</small></div></div></td>
                  <td>{client.phone || "—"}</td>
                  {[client.vat_file, client.income_tax_file, client.deductions_file].map((file, fileIndex) => <td key={fileIndex}><span className={styles.copyValue}>{file || "—"}{file && <button onClick={() => navigator.clipboard?.writeText(file)} aria-label="העתקה"><Copy size={14} /></button>}</span></td>)}
                  <td><OverallStatusSelect value={overallState} allReady={allReady} onChange={(value) => { const next = value === "ready" && !allReady ? "not-selected" : value; setOverallStates((current) => ({ ...current, [key]: next })); void persistReport(client.id, rowState, next); }} label={`מצב כללי עבור ${clientName(client)}`} /></td>
                  <td><ReadinessSelect value={rowState.vat} onChange={(value) => updateReadiness(client.id, "vat", value)} label={`מע״מ עבור ${clientName(client)}`} /></td>
                  <td><ReadinessSelect value={rowState.incomeTax} onChange={(value) => updateReadiness(client.id, "incomeTax", value)} label={`מס הכנסה עבור ${clientName(client)}`} /></td>
                  <td><ReadinessSelect value={rowState.nationalInsurance} onChange={(value) => updateReadiness(client.id, "nationalInsurance", value)} label={`ביטוח לאומי עבור ${clientName(client)}`} /></td>
                  <td><ReadinessSelect value={rowState.incomeTaxDeductions} onChange={(value) => updateReadiness(client.id, "incomeTaxDeductions", value)} label={`מ״ה ניכויים עבור ${clientName(client)}`} /></td>
                  <td><ReadinessSelect value={rowState.nationalInsuranceDeductions} onChange={(value) => updateReadiness(client.id, "nationalInsuranceDeductions", value)} label={`ב.ל ניכויים עבור ${clientName(client)}`} /></td>
                  <td><ReadinessSelect value={rowState.fuelRefund} onChange={(value) => updateReadiness(client.id, "fuelRefund", value)} label={`החזר סולר עבור ${clientName(client)}`} /></td>
                  <td><button type="button" className={styles.handler}>לא משויך <ChevronDown size={13} /></button></td>
                  <td><button type="button" className={styles.notes} title={client.notes || "הוספת הערה"}><FileText size={17} />{saving.includes(key) ? "שומר..." : client.notes ? "צפייה" : "הערה"}</button></td>
                </tr>;
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div className={styles.empty}><Search size={26} /><strong>לא נמצאו לקוחות</strong><span>נסו לשנות את מילות החיפוש או את המסננים</span></div>}
        </div>

        <footer className={styles.footer}><span>מציג {filtered.length} מתוך {initialClients.length} לקוחות</span><span>{selected.length ? `${selected.length} לקוחות נבחרו` : "לא נבחרו לקוחות"}</span></footer>
      </section>
    </main>
  );
}
