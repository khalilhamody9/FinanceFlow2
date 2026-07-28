"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardShell } from "../components/dashboard-shell";
import { createClient } from "@/lib/supabase/client";
import ClientsImport from "./clients-import";
import {
  Search,
  Plus,
  ClipboardList,
  PenSquare,
  Columns,
  ChevronDown,
  CheckCircle2,
  X,
  User,
  MapPin,
  Building2,
  FolderOpen,
  StickyNote,
  CreditCard,
} from "lucide-react";

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  id_number: string | null;
  birth_date: string | null;
  phone: string | null;
  second_phone: string | null;
  email: string | null;
  city: string | null;
  street: string | null;
  house_number: string | null;
  zip_code: string | null;
  business_name: string | null;
  business_type: string | null;
  business_number: string | null;
  business_open_date: string | null;
  vat_report_type: string | null;
  income_tax_file: string | null;
  deductions_file: string | null;
  vat_file: string | null;
  po_box: string | null;
  occupation: string | null;
  marital_status: string | null;
  children_count: number | null;
  has_academic_degree: boolean;
  score: number | null;
  has_inventory: boolean;
  is_detailed: boolean;
  has_audit: boolean;
  has_fuel: boolean;
  has_856: boolean;
  has_capital_declaration: boolean;
  has_pension: boolean;
  has_benefit: boolean;

  status: string | null;
  notes: string | null;
  fee_amount: number | null;
  payment_method: string | null;
  payment_frequency: string | null;
};

type NewCustomerForm = {
  firstName: string;
  lastName: string;
  idNumber: string;
  birthDate: string;
  phone: string;
  secondPhone: string;
  email: string;
  city: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  businessName: string;
  businessType: string;
  businessNumber: string;
  businessOpenDate: string;
  vatReportType: string;
  incomeTaxFile: string;
  deductionsFile: string;
  vatFile: string;
  poBox: string;
  occupation: string;
  maritalStatus: string;
  childrenCount: string;
  hasAcademicDegree: boolean;
  score: string;
  status: string;
  notes: string;
  feeAmount: string;
  paymentMethod: string;
  paymentFrequency: string;
  hasInventory: boolean;
  isDetailed: boolean;
  hasAudit: boolean;
  hasFuel: boolean;
  has856: boolean;
  hasCapitalDeclaration: boolean;
  hasPension: boolean;
  hasBenefit: boolean;
};

type CustomersListProps = {
  userName: string;
  organizationId: string;
};

const EMPTY_CUSTOMER_FORM: NewCustomerForm = {
  firstName: "",
  lastName: "",
  idNumber: "",
  birthDate: "",
  phone: "",
  secondPhone: "",
  email: "",
  city: "",
  street: "",
  houseNumber: "",
  zipCode: "",
  businessName: "",
  businessType: "",
  businessNumber: "",
  businessOpenDate: "",
  vatReportType: "",
  incomeTaxFile: "",
  deductionsFile: "",
  vatFile: "",
  poBox: "",
  occupation: "",
  maritalStatus: "single",
  childrenCount: "0",
  hasAcademicDegree: false,
  score: "0",
  status: "active",
  notes: "",
  feeAmount: "",
  paymentMethod: "",
  paymentFrequency: "",
  hasInventory: false,
  isDetailed: false,
  hasAudit: false,
  hasFuel: false,
  has856: false,
  hasCapitalDeclaration: false,
  hasPension: false,
  hasBenefit: false,
};

const INK = "#0B2348";
const SLATE = "#65738B";
const MUTE = "#94A0B3";
const INDIGO = "#C99B2D";
const INDIGO_SOFT = "#FBF6E9";
const BORDER = "#E8EDF5";

const FILTERS = [
  { label: "סוג עוסק" },
  { label: "דיווח מע״מ" },
  { label: "דיווח מ״ה" },
  { label: "דיווח ניכויים" },
];

const TAGS = [
  "פעיל",
  "מלאי",
  "מפורט",
  "ביקורת",
  "סולר",
  "856",
  "ה.הון",
  "פנסיה ד.א",
  "finbot",
];
const TAG_FIELD_MAP: Record<string, keyof Customer> = {
  מלאי: "has_inventory",
  מפורט: "is_detailed",
  ביקורת: "has_audit",
  סולר: "has_fuel",
  "856": "has_856",
  "ה.הון": "has_capital_declaration",
  "פנסיה ד.א": "has_pension",
  finbot: "has_benefit",
};
const COLUMNS = [
  "מס׳ תיק",
  "שם",
  "עיסוק",
  "סוג",
  "נייד",
  "תיק מע״מ",
  "תיק מס הכנסה",
  "תיק ניכויים",
  "סטטוס",
  "פעולות",
];

const VAT_REPORT_TYPES = ["חודשי", "דו חודשי", "לא רלוונטי"];

export default function CustomersList({
  userName,
  organizationId,
}: CustomersListProps) {
  const supabase = useMemo(() => createClient(), []);

  const [checkedAll, setCheckedAll] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [formError, setFormError] = useState("");
  const [newCustomer, setNewCustomer] =
    useState<NewCustomerForm>(EMPTY_CUSTOMER_FORM);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("clients")
      .select(`
        id,
        first_name,
        last_name,
        id_number,
        birth_date,
        phone,
        second_phone,
        email,
        city,
        street,
        house_number,
        zip_code,
        business_name,
        business_type,
        business_number,
        business_open_date,
        vat_report_type,
        income_tax_file,
        deductions_file,
vat_file,
po_box,
occupation,
marital_status,
children_count,
has_academic_degree,
score,        status,
fee_amount,
payment_method,
payment_frequency,
has_inventory,
is_detailed,
has_audit,
has_fuel,
has_856,
has_capital_declaration,
has_pension,
has_benefit,
        notes
      `)
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("CLIENTS ERROR:", error);
      setErrorMessage("אירעה שגיאה בטעינת הלקוחות.");
      setCustomers([]);
      setLoading(false);
      return;
    }

    setCustomers(data || []);
    setLoading(false);
  }, [organizationId, supabase]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!showCustomerForm) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeCustomerForm();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCustomerForm, savingCustomer]);

  function mapCustomerToForm(customer: Customer): NewCustomerForm {
    return {
      firstName: customer.first_name || "",
      lastName: customer.last_name || "",
      idNumber: customer.id_number || "",
      birthDate: customer.birth_date || "",
      phone: customer.phone || "",
      secondPhone: customer.second_phone || "",
      email: customer.email || "",
      city: customer.city || "",
      street: customer.street || "",
      houseNumber: customer.house_number || "",
      zipCode: customer.zip_code || "",
      businessName: customer.business_name || "",
      businessType: customer.business_type || "",
      businessNumber: customer.business_number || "",
      businessOpenDate: customer.business_open_date || "",
      vatReportType: customer.vat_report_type || "",
      incomeTaxFile: customer.income_tax_file || "",
      deductionsFile: customer.deductions_file || "",
      vatFile: customer.vat_file || "",
      poBox: customer.po_box || "",
      occupation: customer.occupation || "",
      maritalStatus: customer.marital_status || "single",
      childrenCount:
        customer.children_count === null || customer.children_count === undefined
          ? "0"
          : String(customer.children_count),
      hasAcademicDegree: customer.has_academic_degree,
      score:
        customer.score === null || customer.score === undefined
          ? "0"
          : String(customer.score),
      status: customer.status || "active",
      notes: customer.notes || "",
      feeAmount:
        customer.fee_amount === null || customer.fee_amount === undefined
          ? ""
          : String(customer.fee_amount),
      paymentMethod: customer.payment_method || "",
      paymentFrequency: customer.payment_frequency || "",
      hasInventory: customer.has_inventory,
      isDetailed: customer.is_detailed,
      hasAudit: customer.has_audit,
      hasFuel: customer.has_fuel,
      has856: customer.has_856,
      hasCapitalDeclaration: customer.has_capital_declaration,
      hasPension: customer.has_pension,
      hasBenefit: customer.has_benefit,
    };
  }

  async function handleSaveCustomer(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError("");

    const firstName = newCustomer.firstName.trim();
    const lastName = newCustomer.lastName.trim();

    if (!firstName || !lastName) {
      setFormError("יש להזין שם פרטי ושם משפחה.");
      return;
    }

    setSavingCustomer(true);

    const payload = {
      organization_id: organizationId,
      first_name: firstName,
      last_name: lastName,
      id_number: newCustomer.idNumber.trim() || null,
      birth_date: newCustomer.birthDate || null,
      phone: newCustomer.phone.trim() || null,
      second_phone: newCustomer.secondPhone.trim() || null,
      email: newCustomer.email.trim() || null,
      city: newCustomer.city.trim() || null,
      street: newCustomer.street.trim() || null,
      house_number: newCustomer.houseNumber.trim() || null,
      zip_code: newCustomer.zipCode.trim() || null,
      business_name: newCustomer.businessName.trim() || null,
      business_type: newCustomer.businessType || null,
      business_number: newCustomer.businessNumber.trim() || null,
      business_open_date: newCustomer.businessOpenDate || null,
      vat_report_type: newCustomer.vatReportType || null,
      income_tax_file: newCustomer.incomeTaxFile.trim() || null,
      deductions_file: newCustomer.deductionsFile.trim() || null,
      vat_file: newCustomer.vatFile.trim() || null,
      po_box: newCustomer.poBox.trim() || null,
      occupation: newCustomer.occupation.trim() || null,
      marital_status: newCustomer.maritalStatus || null,
      children_count:
        newCustomer.childrenCount === "" ? null : Number(newCustomer.childrenCount),
      has_academic_degree: newCustomer.hasAcademicDegree,
      score: Number(newCustomer.score) || 0,
      fee_amount: Number(newCustomer.feeAmount) || 0,
      payment_method: newCustomer.paymentMethod || null,
      payment_frequency: newCustomer.paymentFrequency || null,
      has_inventory: newCustomer.hasInventory,
      is_detailed: newCustomer.isDetailed,
      has_audit: newCustomer.hasAudit,
      has_fuel: newCustomer.hasFuel,
      has_856: newCustomer.has856,
      has_capital_declaration: newCustomer.hasCapitalDeclaration,
      has_pension: newCustomer.hasPension,
      has_benefit: newCustomer.hasBenefit,
      status: newCustomer.status,
      notes: newCustomer.notes.trim() || null,
    };

    const query = editingCustomerId
      ? supabase.from("clients").update(payload).eq("id", editingCustomerId)
      : supabase.from("clients").insert(payload);

    const { data, error } = await query
      .select(`
        id,
        first_name,
        last_name,
        id_number,
        birth_date,
        phone,
        second_phone,
        email,
        city,
        street,
        house_number,
        zip_code,
        business_name,
        business_type,
        business_number,
        business_open_date,
        vat_report_type,
        income_tax_file,
        deductions_file,
        vat_file,
        po_box,
        occupation,
        marital_status,
        children_count,
        has_academic_degree,
        score,
        fee_amount,
        payment_method,
        payment_frequency,
        has_inventory,
        is_detailed,
        has_audit,
        has_fuel,
        has_856,
        has_capital_declaration,
        has_pension,
        has_benefit,
        status,
        notes
      `)
      .single();

    if (error) {
      console.error("SAVE CUSTOMER ERROR:", error);
      setFormError(
        error.message || "שמירת הלקוח נכשלה. בדוק את הנתונים ונסה שוב.",
      );
      setSavingCustomer(false);
      return;
    }

    if (editingCustomerId) {
      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.id === editingCustomerId ? (data as Customer) : customer,
        ),
      );
    } else {
      setCustomers((currentCustomers) => [data as Customer, ...currentCustomers]);
    }

    setNewCustomer(EMPTY_CUSTOMER_FORM);
    setEditingCustomerId(null);
    setShowCustomerForm(false);
    setSavingCustomer(false);
  }

  function closeCustomerForm() {
    if (savingCustomer) {
      return;
    }

    setShowCustomerForm(false);
    setEditingCustomerId(null);
    setFormError("");
    setNewCustomer(EMPTY_CUSTOMER_FORM);
  }

  function updateNewCustomer(
    field: keyof NewCustomerForm,
    value: string | boolean,
  ) {
    setNewCustomer((currentCustomer) => ({
      ...currentCustomer,
      [field]: value,
    }));
  }

  function isActiveCustomer(status: string | null) {
    const normalized = status?.toLowerCase();

    return (
      normalized === "active" || normalized === "active-no-activity"
    );
  }

  function getCustomerStatusLabel(status: string | null) {
    const normalized = status?.toLowerCase();

    if (normalized === "active-no-activity") {
      return {
        label: "פעיל ללא פעילות",
        color: "#D97706",
      };
    }

    if (normalized === "active") {
      return {
        label: "פעיל",
        color: "#1E7B3B",
      };
    }

    return {
      label: "לא פעיל",
      color: MUTE,
    };
  }
const filteredCustomers = useMemo(() => {
  if (activeTags.length === 0) {
    return customers;
  }

  return customers.filter((customer) =>
    activeTags.every((tag) => {
      if (tag === "פעיל") {
        return isActiveCustomer(customer.status);
      }

      const field = TAG_FIELD_MAP[tag];

      if (!field) {
        return true;
      }

      return customer[field] === true;
    }),
  );
}, [customers, activeTags]);
  return (
    <DashboardShell userName={userName}>
      <main className="mx-auto max-w-[1440px] px-8 py-8">
        <div
          className="bg-white p-7"
          style={{
            borderRadius: "18px",
            border: `1px solid ${BORDER}`,
          }}
        >
          {/* כותרת וכפתורים */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormError("");
                  setEditingCustomerId(null);
                  setNewCustomer(EMPTY_CUSTOMER_FORM);
                  setShowCustomerForm(true);
                }}
                className="pill-btn dash-focusable flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold"
                style={{
                  borderRadius: "999px",
                  border: "1.5px solid #2563EB",
                  color: "#2563EB",
                  background: "#FFFFFF",
                }}
              >
                <Plus size={16} />
                הוספת לקוח חדש
              </button>

              <button
                type="button"
                className="pill-btn dash-focusable flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold"
                style={{
                  borderRadius: "999px",
                  border: "1.5px solid #7C3AED",
                  color: "#7C3AED",
                  background: "#FFFFFF",
                }}
              >
                <ClipboardList size={16} />
                הוספת שירות גורף
              </button>

              <ClientsImport
                organizationId={organizationId}
                existingBusinessNumbers={customers.map((customer) => customer.business_number || "")}
                onImported={loadCustomers}
              />

              <button
                type="button"
                className="pill-btn dash-focusable flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold"
                style={{
                  borderRadius: "999px",
                  border: "1.5px solid #0F9488",
                  color: "#0F9488",
                  background: "#FFFFFF",
                }}
              >
                <PenSquare size={16} />
                עדכון גורף
              </button>
            </div>

            <h1 className="text-2xl font-bold" style={{ color: INK }}>
              רשימת לקוחות
            </h1>
          </div>

          {/* כותרות מסננים */}
          <div className="mb-2 flex flex-wrap items-center gap-4">
            {FILTERS.map((filter) => (
              <span
                key={filter.label}
                className="text-xs font-medium"
                style={{
                  width: "170px",
                  color: MUTE,
                }}
              >
                {filter.label}:
              </span>
            ))}
          </div>

          {/* מסננים וחיפוש */}
          <div className="mb-6 flex flex-wrap items-center gap-4">
            {FILTERS.map((filter) => (
              <div
                key={filter.label}
                className="flex items-center justify-between gap-2 px-4 py-2.5"
                style={{
                  width: "170px",
                  borderRadius: "10px",
                  background: "#FFFFFF",
                  border: `1px solid ${BORDER}`,
                }}
              >
                <span className="text-sm" style={{ color: INK }}>
                  הכל
                </span>

                <ChevronDown size={15} style={{ color: MUTE }} />
              </div>
            ))}

            <div
              className="flex flex-1 items-center gap-2 px-4 py-2.5"
              style={{
                minWidth: "220px",
                borderRadius: "10px",
                background: "#FFFFFF",
                border: `1px solid ${BORDER}`,
              }}
            >
              <Search size={15} style={{ color: MUTE }} />

              <input
                type="text"
                placeholder="חיפוש לקוח לפי מס׳ תיק, שם או טלפון..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#9CA1B0]"
                style={{ color: INK }}
              />
            </div>
          </div>

          {/* תגיות */}
          <div
            className="mb-5 flex flex-wrap items-center gap-3 border-b pb-5"
            style={{ borderColor: BORDER }}
          >
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-full"
              aria-label="תצוגת עמודות"
              style={{
                border: `1.5px solid ${INDIGO}`,
                color: INDIGO,
                background: INDIGO_SOFT,
              }}
            >
              <Columns size={16} />
            </button>

            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
{TAGS.map((tag) => {
  const isSelected = activeTags.includes(tag);

  return (
    <button
      type="button"
      key={tag}
      onClick={() =>
        setActiveTags((currentTags) =>
          currentTags.includes(tag)
            ? currentTags.filter((currentTag) => currentTag !== tag)
            : [...currentTags, tag],
        )
      }
      className="px-3.5 py-1.5 text-xs font-medium transition-colors"
      style={{
        borderRadius: "8px",
        color: isSelected ? "#FFFFFF" : SLATE,
        background: isSelected ? INDIGO : "#FFFFFF",
        border: `1px solid ${isSelected ? INDIGO : BORDER}`,
      }}
    >
      {tag}
    </button>
  );
})}
            </div>
          </div>

          {/* טבלת לקוחות */}
          
          {loading ? (
            <div className="py-10 text-center text-sm" style={{ color: MUTE }}>
              טוען לקוחות...
            </div>
          ) : errorMessage ? (
            <div
              className="rounded-xl px-4 py-6 text-center text-sm"
              style={{
                color: "#B42318",
                background: "#FEF3F2",
                border: "1px solid #FECDCA",
              }}
            >
              {errorMessage}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-12 text-center text-sm" style={{ color: MUTE }}>
{activeTags.length > 0
  ? `לא נמצאו לקוחות עם המאפיינים: ${activeTags.join(", ")}.`
  : "לא נמצאו לקוחות השייכים למשרד שלך."}
  {activeTags.length > 0 && (
  <button
    type="button"
    onClick={() => setActiveTags([])}
    className="px-3.5 py-1.5 text-xs font-medium"
    style={{
      borderRadius: "8px",
      color: "#B42318",
      background: "#FEF3F2",
      border: "1px solid #FECDCA",
    }}
  >
    נקה סינון
  </button>
)}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table
                  className="w-full border-collapse text-sm"
                  style={{ minWidth: "900px" }}
                >
                  <thead>
                    <tr style={{ background: "#FAFAFD" }}>
                      <th
                        className="p-3 text-right"
                        style={{ borderBottom: `1px solid ${BORDER}` }}
                      >
                        <input
                          type="checkbox"
                          checked={checkedAll}
                          onChange={() =>
                            setCheckedAll((current) => !current)
                          }
                          style={{ accentColor: INDIGO }}
                        />
                      </th>

                      {COLUMNS.map((column) => (
                        <th
                          key={column}
                          className="p-3 text-right text-xs font-semibold"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <tr key={customer.id}>
                        <td
                          className="p-3"
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                          <input
                            type="checkbox"
                            style={{ accentColor: INDIGO }}
                          />
                        </td>

                        <td
                          className="p-3 font-medium"
                          style={{
                            color: INK,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {index + 1}
                        </td>

                        <td
                          className="p-3"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          <button
                            type="button"
                            className="text-sm font-medium transition-colors hover:text-[#4F46E5]"
                            onClick={() => {
                              setEditingCustomerId(customer.id);
                              setNewCustomer(mapCustomerToForm(customer));
                              setShowCustomerForm(true);
                            }}
                          >
                            {customer.first_name} {customer.last_name}
                          </button>
                        </td>

                        <td
                          className="p-3"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {customer.occupation || "—"}
                        </td>

                        <td
                          className="p-3"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {customer.business_type || "—"}
                        </td>

                        <td
                          className="p-3"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {customer.phone || "—"}
                        </td>

                        <td
                          className="p-3"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {customer.vat_file || "—"}
                        </td>

                        <td
                          className="p-3"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {customer.income_tax_file || "—"}
                        </td>

                        <td
                          className="p-3"
                          style={{
                            color: SLATE,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          {customer.deductions_file || "—"}
                        </td>

                        <td
                          className="p-3"
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                          <span
                            className="flex items-center gap-1 text-xs font-medium"
                            style={{ color: getCustomerStatusLabel(customer.status).color }}
                          >
                            {getCustomerStatusLabel(customer.status).label === "פעיל" && (
                              <CheckCircle2 size={14} />
                            )}
                            {getCustomerStatusLabel(customer.status).label}
                          </span>
                        </td>

                        <td
                          className="p-3"
                          style={{ borderBottom: `1px solid ${BORDER}` }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomerId(customer.id);
                              setNewCustomer(mapCustomerToForm(customer));
                              setShowCustomerForm(true);
                            }}
                            className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-indigo-300 hover:text-indigo-700"
                            style={{
                              color: INDIGO,
                              borderColor: INDIGO,
                              background: "#FFFFFF",
                            }}
                          >
                            עריכה
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-sm" style={{ color: MUTE }}>
                מספר שורות: {filteredCustomers.length}              </div>
            </>
          )}
        </div>
      </main>

      {/* מודל הוספת לקוח */}
      {showCustomerForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(27, 30, 46, 0.45)",
            backdropFilter: "blur(2px)",
            animation: "overlayIn 160ms ease-out",
          }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCustomerForm();
            }
          }}
        >
          <div
            className="flex w-full max-h-[88vh] flex-col bg-white"
            style={{
              maxWidth: "780px",
              borderRadius: "20px",
              boxShadow: "0 24px 60px -12px rgba(27, 30, 46, 0.28)",
              animation: "modalIn 180ms ease-out",
            }}
          >
            {/* כותרת המודל */}
            <div
              className="flex items-center justify-between px-7 py-5"
              style={{ borderBottom: `1px solid ${BORDER}` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: INDIGO_SOFT, color: INDIGO }}
                >
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: INK }}>
                    {editingCustomerId ? "עריכת לקוח" : "הוספת לקוח חדש"}
                  </h2>
                  <p className="text-xs" style={{ color: MUTE }}>
                    מלא/י את פרטי הלקוח ולחצ/י על שמירה בסיום
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeCustomerForm}
                disabled={savingCustomer}
                className="dash-focusable flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[#F3F3F8] disabled:opacity-50"
                style={{
                  color: MUTE,
                  border: `1px solid ${BORDER}`,
                }}
                aria-label="סגירת הטופס"
              >
                <X size={17} />
              </button>
            </div>

            {/* גוף הטופס */}
            <form
              id="customer-form"
              onSubmit={handleSaveCustomer}
              className="flex-1 overflow-y-auto px-7 py-6"
            >
              <FormSection
                icon={<User size={15} />}
                title="פרטים אישיים"
              >
                <FormField label="שם פרטי *">
                  <input
                    required
                    value={newCustomer.firstName}
                    onChange={(event) =>
                      updateNewCustomer("firstName", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="שם משפחה *">
                  <input
                    required
                    value={newCustomer.lastName}
                    onChange={(event) =>
                      updateNewCustomer("lastName", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="תעודת זהות">
                  <input
                    value={newCustomer.idNumber}
                    onChange={(event) =>
                      updateNewCustomer("idNumber", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="תאריך לידה">
                  <input
                    type="date"
                    value={newCustomer.birthDate}
                    onChange={(event) =>
                      updateNewCustomer("birthDate", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="טלפון">
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(event) =>
                      updateNewCustomer("phone", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="טלפון נוסף">
                  <input
                    type="tel"
                    value={newCustomer.secondPhone}
                    onChange={(event) =>
                      updateNewCustomer("secondPhone", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="אימייל">
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(event) =>
                      updateNewCustomer("email", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="סטטוס משפחה">
                  <select
                    value={newCustomer.maritalStatus}
                    onChange={(event) =>
                      updateNewCustomer("maritalStatus", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ ...inputStyle, background: "#FFFFFF" }}
                  >
                    <option value="single">רווק/ה</option>
                    <option value="married">נשוי/אה</option>
                    <option value="divorced">גרוש/ה</option>
                    <option value="widowed">אלמנ/ית</option>
                  </select>
                </FormField>

                <FormField label="מספר ילדים">
                  <input
                    type="number"
                    min="0"
                    value={newCustomer.childrenCount}
                    onChange={(event) =>
                      updateNewCustomer("childrenCount", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="תואר אקדמי">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={newCustomer.hasAcademicDegree}
                      onChange={(event) =>
                        updateNewCustomer("hasAcademicDegree", event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm" style={{ color: INK }}>
                      יש תואר אקדמי
                    </span>
                  </label>
                </FormField>
              </FormSection>

              <FormSection icon={<MapPin size={15} />} title="כתובת">
                <FormField label="עיר">
                  <input
                    value={newCustomer.city}
                    onChange={(event) =>
                      updateNewCustomer("city", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="רחוב">
                  <input
                    value={newCustomer.street}
                    onChange={(event) =>
                      updateNewCustomer("street", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="מספר בית">
                  <input
                    value={newCustomer.houseNumber}
                    onChange={(event) =>
                      updateNewCustomer("houseNumber", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="מיקוד">
                  <input
                    value={newCustomer.zipCode}
                    onChange={(event) =>
                      updateNewCustomer("zipCode", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="תיבת דואר">
                  <input
                    value={newCustomer.poBox}
                    onChange={(event) =>
                      updateNewCustomer("poBox", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>
              </FormSection>

              <FormSection
                icon={<Building2 size={15} />}
                title="פרטי עסק"
              >
                <FormField label="שם העסק">
                  <input
                    value={newCustomer.businessName}
                    onChange={(event) =>
                      updateNewCustomer(
                        "businessName",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="עיסוק">
                  <input
                    value={newCustomer.occupation}
                    onChange={(event) =>
                      updateNewCustomer("occupation", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>
                <FormField label="סוג עוסק">
                  <select
                    value={newCustomer.businessType}
                    onChange={(event) =>
                      updateNewCustomer(
                        "businessType",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ ...inputStyle, background: "#FFFFFF" }}
                  >
                    <option value="">בחר סוג</option>
                    <option value="עוסק פטור">עוסק פטור</option>
                    <option value="עוסק מורשה">עוסק מורשה</option>
                    <option value='חברה בע"מ'>חברה בע״מ</option>
                    <option value="עמותה">עמותה</option>
                  </select>
                </FormField>

                <FormField label="מספר עוסק / חברה">
                  <input
                    value={newCustomer.businessNumber}
                    onChange={(event) =>
                      updateNewCustomer(
                        "businessNumber",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="תאריך פתיחת עסק">
                  <input
                    type="date"
                    value={newCustomer.businessOpenDate}
                    onChange={(event) =>
                      updateNewCustomer(
                        "businessOpenDate",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="סוג דיווח מע״מ">
                  <select
                    value={newCustomer.vatReportType}
                    onChange={(event) =>
                      updateNewCustomer(
                        "vatReportType",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ ...inputStyle, background: "#FFFFFF" }}
                  >
                    <option value="">בחר סוג דיווח</option>
                    {VAT_REPORT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </FormField>
              </FormSection>

              <FormSection
                icon={<FolderOpen size={15} />}
                title="תיקים ומספרים"
              >
                <FormField label="תיק מס הכנסה">
                  <input
                    value={newCustomer.incomeTaxFile}
                    onChange={(event) =>
                      updateNewCustomer(
                        "incomeTaxFile",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label="תיק ניכויים">
                  <input
                    value={newCustomer.deductionsFile}
                    onChange={(event) =>
                      updateNewCustomer(
                        "deductionsFile",
                        event.target.value,
                      )
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>

                <FormField label='תיק מע"מ'>                  <input
                  value={newCustomer.vatFile}
                  onChange={(event) =>
                    updateNewCustomer(
                      "vatFile",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                />
                </FormField>

                <FormField label="סטטוס">
                  <select
                    value={newCustomer.status}
                    onChange={(event) =>
                      updateNewCustomer("status", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={{ ...inputStyle, background: "#FFFFFF" }}
                  >
                    <option value="active">פעיל</option>
                    <option value="active-no-activity">פעיל ללא פעילות</option>
                    <option value="inactive">לא פעיל</option>
                  </select>
                </FormField>
                <FormField label="ניקוד">
                  <input
                    type="number"
                    min="0"
                    value={newCustomer.score}
                    onChange={(event) =>
                      updateNewCustomer("score", event.target.value)
                    }
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                    style={inputStyle}
                  />
                </FormField>
              </FormSection>
              <FormSection
  icon={<CreditCard size={15} />}
  title="שכר טרחה ותשלום"
>
  <FormField label="שכר טרחה">
    <input
      type="number"
      min="0"
      step="0.01"
      value={newCustomer.feeAmount}
      onChange={(event) =>
        updateNewCustomer("feeAmount", event.target.value)
      }
      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
      style={inputStyle}
    />
  </FormField>

  <FormField label="אמצעי תשלום">
    <select
      value={newCustomer.paymentMethod}
      onChange={(event) =>
        updateNewCustomer("paymentMethod", event.target.value)
      }
      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
      style={{ ...inputStyle, background: "#FFFFFF" }}
    >
      <option value="">בחר אמצעי תשלום</option>
      <option value="bank_transfer">העברה בנקאית</option>
      <option value="direct_debit">הוראת קבע</option>
      <option value="credit_card">כרטיס אשראי</option>
      <option value="cash">מזומן</option>
      <option value="check">צ׳ק</option>
    </select>
  </FormField>

  <FormField label="תדירות תשלום">
    <select
      value={newCustomer.paymentFrequency}
      onChange={(event) =>
        updateNewCustomer("paymentFrequency", event.target.value)
      }
      className="w-full rounded-xl px-4 py-3 text-sm outline-none"
      style={{ ...inputStyle, background: "#FFFFFF" }}
    >
      <option value="">בחר תדירות</option>
      <option value="monthly">חודשי</option>
      <option value="bimonthly">דו־חודשי</option>
      <option value="quarterly">רבעוני</option>
      <option value="annual">שנתי</option>
      <option value="one_time">חד־פעמי</option>
    </select>
  </FormField>
</FormSection>
              <FormSection
                icon={<ClipboardList size={15} />}
                title="מאפייני לקוח"
              >
                <CheckboxField
                  label="מלאי"
                  checked={newCustomer.hasInventory}
                  onChange={(checked) =>
                    updateNewCustomer("hasInventory", checked)
                  }
                />

                <CheckboxField
                  label="מפורט"
                  checked={newCustomer.isDetailed}
                  onChange={(checked) =>
                    updateNewCustomer("isDetailed", checked)
                  }
                />

                <CheckboxField
                  label="ביקורת"
                  checked={newCustomer.hasAudit}
                  onChange={(checked) =>
                    updateNewCustomer("hasAudit", checked)
                  }
                />

                <CheckboxField
                  label="סולר"
                  checked={newCustomer.hasFuel}
                  onChange={(checked) =>
                    updateNewCustomer("hasFuel", checked)
                  }
                />

                <CheckboxField
                  label="856"
                  checked={newCustomer.has856}
                  onChange={(checked) =>
                    updateNewCustomer("has856", checked)
                  }
                />

                <CheckboxField
                  label="הצהרת הון"
                  checked={newCustomer.hasCapitalDeclaration}
                  onChange={(checked) =>
                    updateNewCustomer("hasCapitalDeclaration", checked)
                  }
                />

                <CheckboxField
                  label="פנסיה ד.א"
                  checked={newCustomer.hasPension}
                  onChange={(checked) =>
                    updateNewCustomer("hasPension", checked)
                  }
                />

                <CheckboxField
                  label="בנפיט"
                  checked={newCustomer.hasBenefit}
                  onChange={(checked) =>
                    updateNewCustomer("hasBenefit", checked)
                  }
                />
              </FormSection>
              <FormSection icon={<StickyNote size={15} />} title="הערות">
                <div className="md:col-span-2 lg:col-span-3">
                  <textarea
                    value={newCustomer.notes}
                    onChange={(event) =>
                      updateNewCustomer("notes", event.target.value)
                    }
                    rows={3}
                    placeholder="הערות פנימיות על הלקוח..."
                    className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                    style={inputStyle}
                  />
                </div>
              </FormSection>

              {formError && (
                <div
                  className="mt-2 rounded-xl px-4 py-3 text-sm"
                  style={{
                    background: "#FEF3F2",
                    border: "1px solid #FECDCA",
                    color: "#B42318",
                  }}
                >
                  {formError}
                </div>
              )}
            </form>

            {/* פוטר המודל */}
            <div
              className="flex items-center justify-start gap-3 px-7 py-5"
              style={{ borderTop: `1px solid ${BORDER}`, background: "#FAFAFD" }}
            >
              <button
                type="submit"
                form="customer-form"
                disabled={savingCustomer}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                style={{ background: INDIGO }}
              >
                {savingCustomer && (
                  <span
                    className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white"
                    style={{ borderTopColor: "transparent" }}
                  />
                )}
                {savingCustomer
                  ? "שומר..."
                  : editingCustomerId
                  ? "שמירת עדכון"
                  : "שמירת לקוח"}
              </button>

              <button
                type="button"
                disabled={savingCustomer}
                onClick={closeCustomerForm}
                className="rounded-xl px-6 py-3 text-sm font-semibold transition-colors hover:bg-[#F3F3F8] disabled:opacity-60"
                style={{
                  color: SLATE,
                  border: `1px solid ${BORDER}`,
                  background: "#FFFFFF",
                }}
              >
                ביטול
              </button>
            </div>
          </div>

          <style jsx>{`
            @keyframes overlayIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            @keyframes modalIn {
              from {
                opacity: 0;
                transform: translateY(8px) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
          `}</style>
        </div>
      )}
    </DashboardShell>
  );
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${BORDER}`,
};

type FormSectionProps = {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
};

function FormSection({ icon, title, children }: FormSectionProps) {
  return (
    <div className="mb-6 last:mb-0">
      <div className="mb-3.5 flex items-center gap-2">
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md"
          style={{ background: INDIGO_SOFT, color: INDIGO }}
        >
          {icon}
        </span>
        <h3 className="text-sm font-semibold" style={{ color: INK }}>
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

type FormFieldProps = {
  label: string;
  children: React.ReactNode;
};

function FormField({ label, children }: FormFieldProps) {
  return (
    <div>
      <label
        className="mb-1.5 block text-xs font-medium"
        style={{ color: SLATE }}
      >
        {label}
      </label>

      {children}
    </div>
  );
}
type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function CheckboxField({
  label,
  checked,
  onChange,
}: CheckboxFieldProps) {

  return (
    <label
      className="flex cursor-pointer items-center gap-3 rounded-xl px-4 py-3"
      style={{
        border: `1px solid ${BORDER}`,
        background: checked ? INDIGO_SOFT : "#FFFFFF",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={{ accentColor: INDIGO }}
      />

      <span
        className="text-sm font-medium"
        style={{ color: checked ? INDIGO : SLATE }}
      >
        {label}
      </span>
    </label>
  );
}
