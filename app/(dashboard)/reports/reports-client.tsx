"use client";

import { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarDays, ChevronDown, DatabaseBackup, Download, PackageOpen, ReceiptText, WalletCards, X } from "lucide-react";
import styles from "./reports.module.css";
import { createClient } from "@/lib/supabase/client";

type Client = { id: string; first_name: string | null; last_name: string | null; business_name: string | null };
type PaymentLine = { check_number: string | null; check_date: string | null; check_status: string | null };
type Payment = { id: string; client_id: string; payment_date: string; payment_method: string; total_amount: number; status: string; payment_lines: PaymentLine[] };
type Service = { id: string; client_id: string; service_date: string; service_type: string; price: number; status: string };
type Props = { clients: Client[]; payments: Payment[]; services: Service[]; userName: string };

const serviceLabels: Record<string, string> = {
  monthly_bookkeeping: "הנהלת חשבונות חודשית", vat_report: "דיווח מע״מ", income_tax_report: "דיווח מס הכנסה",
  deductions_report: "דיווח ניכויים", payroll: "משכורות", annual_report: "דוח שנתי", capital_declaration: "הצהרת הון",
  open_file: "פתיחת תיק", close_file: "סגירת תיק", tax_consulting: "ייעוץ מס", tax_refund: "החזר מס", audit: "ביקורת דוחות", other: "שירות אחר",
};

function name(client: Client) { return client.business_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "לקוח ללא שם"; }
function money(value: number) { return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2 }).format(value); }
function date(value: string) { return new Intl.DateTimeFormat("he-IL").format(new Date(`${value}T00:00:00`)); }
const hebrewMonthShort = ["ינו","פבר","מרץ","אפר","מאי","יונ","יול","אוג","ספט","אוק","נוב","דצמ"];
function monthName(monthIndex: number) { return hebrewMonthShort[monthIndex] || ""; }

type MonthlyServiceRow = {
  month: string;
  client: string;
  services: string;
  charged: number;
  paid: number;
  balance: number;
};

function xmlEscape(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&apos;",
  })[character] || character);
}

export default function ReportsClient({
  clients,
  payments,
  services,
  userName,
}: Props) {
  const [from, setFrom] = useState("2026-07-01");
  const [to, setTo] = useState("2026-07-31");
  const [clientId, setClientId] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, name(client)])), [clients]);

  const monthlyServiceRows = useMemo<MonthlyServiceRow[]>(() => {
    const rows = new Map<string, { month: string; clientId: string; services: string[]; charged: number; paid: number }>();
    const getRow = (month: string, rowClientId: string) => {
      const key = `${month}:${rowClientId}`;
      const existing = rows.get(key);
      if (existing) return existing;
      const created = { month, clientId: rowClientId, services: [] as string[], charged: 0, paid: 0 };
      rows.set(key, created);
      return created;
    };

    services
      .filter((item) => item.status !== "cancelled" && (!from || item.service_date >= from) && (!to || item.service_date <= to) && (!clientId || item.client_id === clientId))
      .forEach((service) => {
        const row = getRow(service.service_date.slice(0, 7), service.client_id);
        row.services.push(serviceLabels[service.service_type] || service.service_type);
        row.charged += Number(service.price);
      });

    payments
      .filter((item) => item.status !== "cancelled" && (!from || item.payment_date >= from) && (!to || item.payment_date <= to) && (!clientId || item.client_id === clientId))
      .forEach((payment) => {
        getRow(payment.payment_date.slice(0, 7), payment.client_id).paid += Number(payment.total_amount);
      });

    return Array.from(rows.values())
      .map((row) => ({
        month: row.month,
        client: clientMap.get(row.clientId) || "לקוח ללא שם",
        services: Array.from(new Set(row.services)).join(", ") || "ללא שירות שנרשם",
        charged: row.charged,
        paid: row.paid,
        balance: row.charged - row.paid,
      }))
      .sort((a, b) => b.month.localeCompare(a.month) || a.client.localeCompare(b.client, "he"));
  }, [services, payments, from, to, clientId, clientMap]);

  function downloadMonthlyServicesExcel() {
    const headers = ["חודש", "לקוח", "שירותים", "חיוב", "שולם", "יתרה לתשלום"];
    const bodyRows = monthlyServiceRows.map((row) => [
      `<Cell><Data ss:Type="String">${xmlEscape(row.month)}</Data></Cell>`,
      `<Cell><Data ss:Type="String">${xmlEscape(row.client)}</Data></Cell>`,
      `<Cell><Data ss:Type="String">${xmlEscape(row.services)}</Data></Cell>`,
      `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${row.charged}</Data></Cell>`,
      `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${row.paid}</Data></Cell>`,
      `<Cell ss:StyleID="Currency"><Data ss:Type="Number">${row.balance}</Data></Cell>`,
    ].join(""));
    const totals = monthlyServiceRows.reduce((sum, row) => ({
      charged: sum.charged + row.charged,
      paid: sum.paid + row.paid,
      balance: sum.balance + row.balance,
    }), { charged: 0, paid: 0, balance: 0 });
    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="Default"><Alignment ss:Horizontal="Right" ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="11"/></Style><Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#4D55E9" ss:Pattern="Solid"/></Style><Style ss:ID="Currency"><NumberFormat ss:Format="₪#,##0.00"/></Style><Style ss:ID="Total"><Font ss:Bold="1"/><Interior ss:Color="#EAF0FF" ss:Pattern="Solid"/><NumberFormat ss:Format="₪#,##0.00"/></Style></Styles>
<Worksheet ss:Name="שירותים ותשלומים"><Table><Column ss:Width="85"/><Column ss:Width="170"/><Column ss:Width="300"/><Column ss:Width="95" ss:Span="2"/>
<Row>${headers.map((header) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${header}</Data></Cell>`).join("")}</Row>
${bodyRows.map((row) => `<Row>${row}</Row>`).join("")}
<Row><Cell ss:MergeAcross="2" ss:StyleID="Header"><Data ss:Type="String">סה״כ</Data></Cell><Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.charged}</Data></Cell><Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.paid}</Data></Cell><Cell ss:StyleID="Total"><Data ss:Type="Number">${totals.balance}</Data></Cell></Row>
</Table></Worksheet></Workbook>`;
    const url = URL.createObjectURL(new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `services-payments-${from || "all"}-${to || "all"}.xls`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const report = useMemo(() => {
    const paymentRows = payments.filter((item) => (!from || item.payment_date >= from) && (!to || item.payment_date <= to) && (!clientId || item.client_id === clientId));
    const serviceRows = services.filter((item) => (!from || item.service_date >= from) && (!to || item.service_date <= to) && (!clientId || item.client_id === clientId));
    const charges = serviceRows.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + Number(item.price), 0);
    const paid = paymentRows.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + Number(item.total_amount), 0);
    const checks = paymentRows.filter((item) => item.payment_method === "check" && item.payment_lines?.some((line) => line.check_status !== "cleared"));
    const alerts = serviceRows.filter((item) => item.status !== "completed" && item.status !== "cancelled").slice(0, 5);

    return { charges, paid, balance: paid - charges, checks, alerts };
  }, [payments, services, from, to, clientId]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [String(currentYear), String(currentYear - 1)];
  }, []);

  const yearlyFees = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => ({ month: monthName(index), fees: 0 }));
    services
      .filter((service) => service.service_date.startsWith(`${selectedYear}-`) && (!clientId || service.client_id === clientId))
      .forEach((service) => {
        const month = Number(service.service_date.slice(5, 7));
        if (!Number.isNaN(month) && month >= 1 && month <= 12) {
          months[month - 1].fees += Number(service.price);
        }
      });
    return months;
  }, [services, selectedYear, clientId]);

  const totalFeesThisYear = yearlyFees.reduce((sum, month) => sum + month.fees, 0);
  type MonthlyReportRow = {
    client_id: string;
    reporting_year: number;
    reporting_month: number;
    vat_status: string | null;
    income_tax_deductions_status: string | null;
    national_insurance_deductions_status: string | null;
  };
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReportRow[] | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const supabase = createClient();
        // determine year range from from/to
        const fromDate = from ? new Date(from) : new Date(2000, 0, 1);
        const toDate = to ? new Date(to) : new Date();
        const years: number[] = [];
        for (let y = fromDate.getFullYear(); y <= toDate.getFullYear(); y++) years.push(y);

        const { data, error } = await supabase
          .from("monthly_reports")
          .select("client_id,reporting_year,reporting_month,vat_status,income_tax_deductions_status,national_insurance_deductions_status")
          .in("reporting_year", years);
        if (error) {
          console.warn("Failed to load monthly_reports:", error.message);
          if (mounted) setMonthlyReports([]);
          return;
        }
        // filter by exact month range
        const filtered = (data || []).filter((r: any) => {
          const d = new Date(r.reporting_year, r.reporting_month - 1, 1);
          return d >= fromDate && d <= toDate;
        }) as MonthlyReportRow[];
        if (mounted) setMonthlyReports(filtered);
      } catch (err) {
        console.warn(err);
        if (mounted) setMonthlyReports([]);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [from, to]);

  const vatSubmissionSummary = useMemo(() => {
    // Prefer monthly_reports because it reflects the shared monthly reporting status.
    if (monthlyReports && monthlyReports.length > 0) {
      const totalClients = new Set<string>();
      const submittedClients = new Set<string>();

      monthlyReports.forEach((row) => {
        if (clientId && row.client_id !== clientId) return;
        totalClients.add(row.client_id);
        if (row.vat_status === "ready") submittedClients.add(row.client_id);
      });

      const total = totalClients.size;
      const completed = submittedClients.size;
      const percent = total ? Math.round((completed / total) * 100) : 0;
      return { total, completed, percent };
    }

    // Fallback to vat_report services when monthly_reports is unavailable.
    const vatRows = services.filter(
      (item) =>
        (!from || item.service_date >= from) &&
        (!to || item.service_date <= to) &&
        item.service_type === "vat_report" &&
        (!clientId || item.client_id === clientId),
    );

    const totalClients = new Set<string>();
    const submittedClients = new Set<string>();
    vatRows.forEach((row) => {
      totalClients.add(row.client_id);
      if (row.status === "completed" || row.status === "ready") submittedClients.add(row.client_id);
    });

    const total = totalClients.size;
    const completed = submittedClients.size;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [services, from, to, clientId, monthlyReports]);

  const deductionsSubmissionSummary = useMemo(() => {
    // Prefer monthly_reports because it reflects the shared monthly reporting status.
    if (monthlyReports && monthlyReports.length > 0) {
      const totalClients = new Set<string>();
      const submittedClients = new Set<string>();

      monthlyReports.forEach((row) => {
        if (clientId && row.client_id !== clientId) return;
        totalClients.add(row.client_id);
        const isSubmitted = row.income_tax_deductions_status === "ready" || row.national_insurance_deductions_status === "ready";
        if (isSubmitted) submittedClients.add(row.client_id);
      });

      const total = totalClients.size;
      const completed = submittedClients.size;
      const percent = total ? Math.round((completed / total) * 100) : 0;
      return { total, completed, percent };
    }

    // Fallback to deductions_report services when monthly_reports is unavailable.
    const deductionRows = services.filter(
      (item) =>
        (!from || item.service_date >= from) &&
        (!to || item.service_date <= to) &&
        item.service_type === "deductions_report" &&
        (!clientId || item.client_id === clientId),
    );

    const totalClients = new Set<string>();
    const submittedClients = new Set<string>();
    deductionRows.forEach((row) => {
      totalClients.add(row.client_id);
      if (row.status === "completed" || row.status === "ready") submittedClients.add(row.client_id);
    });

    const total = totalClients.size;
    const completed = submittedClients.size;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [services, from, to, clientId, monthlyReports]);

  return (
    <main className={styles.page} dir="rtl">
      <section className={styles.container}>
        <div className={styles.titleRow}><div><p>דוחות / דוחות ראשיים</p><h1>דוחות</h1></div><span>תמונת מצב כספית ותפעולית</span></div>

        <div className={styles.filters}>
          <label className={styles.dateField}><span>מתאריך</span><div><CalendarDays size={18} /><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /><button type="button" onClick={() => setFrom("")} aria-label="ניקוי תאריך"><X size={16} /></button></div></label>
          <label className={styles.dateField}><span>עד תאריך</span><div><CalendarDays size={18} /><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /><button type="button" onClick={() => setTo("")} aria-label="ניקוי תאריך"><X size={16} /></button></div></label>
          <label className={styles.clientField}><span>שם לקוח / עוסק מורשה</span><div><select value={clientId} onChange={(event) => setClientId(event.target.value)}><option value="">כל הלקוחות</option>{clients.map((client) => <option key={client.id} value={client.id}>{name(client)}</option>)}</select><ChevronDown size={18} /></div></label>
        </div>

        <div className={styles.summaryGrid}>
          <article className={`${styles.summary} ${styles.charges}`}><PackageOpen size={68} /><div><h2>סה״כ שירותים</h2><strong>{money(report.charges)}</strong></div></article>
          <article className={`${styles.summary} ${styles.payments}`}><WalletCards size={68} /><div><h2>סה״כ תשלומים</h2><strong>{money(report.paid)}</strong></div></article>
          <article className={`${styles.summary} ${styles.balance}`}><ReceiptText size={68} /><div><h2>סה״כ יתרת חשבון</h2><strong className={report.balance < 0 ? styles.negative : ""}>{money(report.balance)}</strong></div></article>
        </div>

        <section className={styles.excelSection}>
          <header>
            <div><p>דוח חודשי</p><h2>שירותים, חיובים ותשלומים</h2></div>
            <button type="button" onClick={downloadMonthlyServicesExcel} disabled={!monthlyServiceRows.length}><Download size={17} /> הורדת Excel</button>
          </header>
          <div className={styles.excelTableWrap}>
            <table className={styles.excelTable}>
              <thead><tr><th>חודש</th><th>לקוח</th><th>שירותים</th><th>חיוב</th><th>שולם</th><th>יתרה</th></tr></thead>
              <tbody>{monthlyServiceRows.length ? monthlyServiceRows.map((row) => (
                <tr key={`${row.month}-${row.client}`}><td>{row.month}</td><td>{row.client}</td><td>{row.services}</td><td>{money(row.charged)}</td><td>{money(row.paid)}</td><td className={row.balance > 0 ? styles.amountDue : ""}>{money(row.balance)}</td></tr>
              )) : <tr><td colSpan={6}>אין נתונים בטווח שנבחר</td></tr>}</tbody>
            </table>
          </div>
        </section>

        <div className={styles.panels}>
          <article className={styles.panel}><header><h2>צ׳קים שטרם נפרעו</h2><span>{report.checks.length}</span></header>{report.checks.length ? <div className={styles.list}>{report.checks.map((payment) => { const line = payment.payment_lines?.[0]; return <div className={styles.listRow} key={payment.id}><div><strong>{clientMap.get(payment.client_id) || "לקוח"}</strong><small>צ׳ק {line?.check_number || "ללא מספר"} · {line?.check_date ? date(line.check_date) : date(payment.payment_date)}</small></div><b>{money(Number(payment.total_amount))}</b></div>; })}</div> : <Empty icon={<ReceiptText />} text="אין צ׳קים להצגה" />}</article>
          <article className={styles.panel}><header><h2>התראות ועדכונים</h2><span>{report.alerts.length}</span></header>{report.alerts.length ? <div className={styles.list}>{report.alerts.map((service) => <div className={styles.listRow} key={service.id}><div><strong>{serviceLabels[service.service_type] || service.service_type}</strong><small>{clientMap.get(service.client_id) || "לקוח"} · {date(service.service_date)}</small></div><i>בטיפול</i></div>)}</div> : <Empty icon={<PackageOpen />} text="אין התראות חדשות" />}</article>
          <article className={styles.panel}><header><h2>גיבויי מערכת</h2><button type="button"><DatabaseBackup size={15} /> גבה נתונים</button></header><div className={styles.backups}><div><span>תאריך</span><span>שעה</span><span>בוצע ע״י</span></div><div><b>{date("2026-07-05")}</b><b>16:50</b><b>{userName}</b></div><div><b>{date("2026-06-27")}</b><b>18:15</b><b>מערכת</b></div></div></article>
        </div>

        <section className={styles.clientVatSection}>
          <header>
            <h2>הגשת מע״מ וניכויים לחודש הנבחר</h2>
            <p style={{ color: "#7f85a0", margin: 0 }}>הוגש / נדרש (ללא פירוט לפי לקוח)</p>
          </header>
          <div className={styles.clientVatList}>
            {vatSubmissionSummary.total || deductionsSubmissionSummary.total ? (
              <>
                <div className={styles.clientVatRow}>
                  <div className={styles.clientVatLeft}>
                    <strong>מע״מ</strong>
                    <small>{vatSubmissionSummary.completed}/{vatSubmissionSummary.total} לקוחות</small>
                  </div>
                  <div className={styles.clientVatBar}><span style={{ width: `${vatSubmissionSummary.percent}%` }} /></div>
                  <div className={styles.clientVatPercent}>{vatSubmissionSummary.percent}%</div>
                </div>
                <div className={styles.clientVatRow}>
                  <div className={styles.clientVatLeft}>
                    <strong>ניכויים</strong>
                    <small>{deductionsSubmissionSummary.completed}/{deductionsSubmissionSummary.total} לקוחות</small>
                  </div>
                  <div className={styles.clientVatBar}><span style={{ width: `${deductionsSubmissionSummary.percent}%` }} /></div>
                  <div className={styles.clientVatPercent}>{deductionsSubmissionSummary.percent}%</div>
                </div>
              </>
            ) : <Empty icon={<PackageOpen />} text="אין נתוני מע״מ להצגה" />}
          </div>
        </section>

        <section className={styles.feeSection}>
          <div className={styles.feeHeader}>
            <div>
              <p>שכר טרחה שנתי</p>
              <h2>בחירת שנה וגרף חודשי</h2>
            </div>
            <div className={styles.yearButtons}>
              {yearOptions.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={year === selectedYear ? styles.active : ""}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.feeSummary}>
            <div className={styles.feeMetric}>
              <strong>{money(totalFeesThisYear)}</strong>
              <span>סה״כ שכר טרחה בשנה זו</span>
            </div>
            <div className={styles.feeMetric}>
              <strong>{yearlyFees.filter((item) => item.fees > 0).length}</strong>
              <span>חודשים עם הכנסה</span>
            </div>
          </div>

          <div className={styles.feeChart}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyFees} margin={{ top: 10, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#5c5f70" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#5c5f70" }} axisLine={false} tickLine={false} width={40} tickFormatter={(value) => `₪${Math.round(value / 1000)}K`} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #dfe1eb", fontSize: "12px" }} formatter={(value) => [`₪${Number(value).toLocaleString("he-IL")}`, "שכר טרחה"]} />
                <Bar dataKey="fees" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

      </section>
    </main>
  );
}

function Empty({ icon, text }: { icon: ReactNode; text: string }) {
  return <div className={styles.empty}>{icon}<strong>{text}</strong><span>הנתונים יופיעו כאן באופן אוטומטי</span></div>;
}
