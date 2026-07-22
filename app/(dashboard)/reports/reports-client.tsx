"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, DatabaseBackup, PackageOpen, ReceiptText, WalletCards, X } from "lucide-react";
import styles from "./reports.module.css";

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

export default function ReportsClient({ clients, payments, services, userName }: Props) {
  const [from, setFrom] = useState("2026-07-01");
  const [to, setTo] = useState("2026-07-31");
  const [clientId, setClientId] = useState("");

  const report = useMemo(() => {
    const paymentRows = payments.filter((item) => (!from || item.payment_date >= from) && (!to || item.payment_date <= to) && (!clientId || item.client_id === clientId));
    const serviceRows = services.filter((item) => (!from || item.service_date >= from) && (!to || item.service_date <= to) && (!clientId || item.client_id === clientId));
    const charges = serviceRows.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + Number(item.price), 0);
    const paid = paymentRows.filter((item) => item.status !== "cancelled").reduce((sum, item) => sum + Number(item.total_amount), 0);
    const checks = paymentRows.filter((item) => item.payment_method === "check" && item.payment_lines?.some((line) => line.check_status !== "cleared"));
    const alerts = serviceRows.filter((item) => item.status !== "completed" && item.status !== "cancelled").slice(0, 5);
    return { charges, paid, balance: paid - charges, checks, alerts };
  }, [payments, services, from, to, clientId]);

  const clientMap = useMemo(() => new Map(clients.map((client) => [client.id, name(client)])), [clients]);

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
          <article className={`${styles.summary} ${styles.charges}`}><PackageOpen size={68} /><div><h2>סה״כ הזמנות</h2><strong>{money(report.charges)}</strong></div></article>
          <article className={`${styles.summary} ${styles.payments}`}><WalletCards size={68} /><div><h2>סה״כ תשלומים</h2><strong>{money(report.paid)}</strong></div></article>
          <article className={`${styles.summary} ${styles.balance}`}><ReceiptText size={68} /><div><h2>סה״כ יתרת חשבון</h2><strong className={report.balance < 0 ? styles.negative : ""}>{money(report.balance)}</strong></div></article>
        </div>

        <div className={styles.panels}>
          <article className={styles.panel}><header><h2>צ׳קים שטרם נפרעו</h2><span>{report.checks.length}</span></header>{report.checks.length ? <div className={styles.list}>{report.checks.map((payment) => { const line = payment.payment_lines?.[0]; return <div className={styles.listRow} key={payment.id}><div><strong>{clientMap.get(payment.client_id) || "לקוח"}</strong><small>צ׳ק {line?.check_number || "ללא מספר"} · {line?.check_date ? date(line.check_date) : date(payment.payment_date)}</small></div><b>{money(Number(payment.total_amount))}</b></div>; })}</div> : <Empty icon={<ReceiptText />} text="אין צ׳קים להצגה" />}</article>
          <article className={styles.panel}><header><h2>התראות ועדכונים</h2><span>{report.alerts.length}</span></header>{report.alerts.length ? <div className={styles.list}>{report.alerts.map((service) => <div className={styles.listRow} key={service.id}><div><strong>{serviceLabels[service.service_type] || service.service_type}</strong><small>{clientMap.get(service.client_id) || "לקוח"} · {date(service.service_date)}</small></div><i>בטיפול</i></div>)}</div> : <Empty icon={<PackageOpen />} text="אין התראות חדשות" />}</article>
          <article className={styles.panel}><header><h2>גיבויי מערכת</h2><button type="button"><DatabaseBackup size={15} /> גבה נתונים</button></header><div className={styles.backups}><div><span>תאריך</span><span>שעה</span><span>בוצע ע״י</span></div><div><b>{date("2026-07-05")}</b><b>16:50</b><b>{userName}</b></div><div><b>{date("2026-06-27")}</b><b>18:15</b><b>מערכת</b></div></div></article>
        </div>
      </section>
    </main>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className={styles.empty}>{icon}<strong>{text}</strong><span>הנתונים יופיעו כאן באופן אוטומטי</span></div>;
}
