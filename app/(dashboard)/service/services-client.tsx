"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  Check,
  ClipboardList,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
};

type Employee = {
  id: string;
  full_name: string | null;
  role: string | null;
};

type RelatedClient = {
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
};

type RelatedEmployee = {
  full_name: string | null;
};

type Service = {
  id: string;
  service_number: number;
  service_date: string;
  service_type: string;
  price: number;
  status: string;
  notes: string | null;
  assigned_to: string | null;
  clients: RelatedClient | RelatedClient[] | null;
  profiles: RelatedEmployee | RelatedEmployee[] | null;
};

type Props = {
  organizationId: string;
  userId: string;
  clients: Client[];
  employees: Employee[];
  services: Service[];
};

type ServiceLine = {
  id: string;
  serviceType: string;
  amount: string;
  includesVat: boolean;
};

type ServiceForm = {
  clientId: string;
  serviceDate: string;
  assignedTo: string;
  serviceLines: ServiceLine[];
  notes: string;
};

const DEFAULT_VAT_RATE = 0.17;
const VAT_STORAGE_KEY = "financeflow-vat-rate";
const VAT_REMINDER_YEAR_KEY = "financeflow-vat-reminder-year";

function createEmptyServiceLine(id: string): ServiceLine {
  return {
    id,
    serviceType: "",
    amount: "",
    includesVat: false,
  };
}

const today = new Date().toISOString().split("T")[0];

const initialForm: ServiceForm = {
  clientId: "",
  serviceDate: today,
  assignedTo: "",
  serviceLines: [createEmptyServiceLine("line-1")],
  notes: "",
};

const serviceTypeLabels: Record<string, string> = {
  monthly_bookkeeping: "הנהלת חשבונות חודשית",
  vat_report: "דיווח מע״מ",
  income_tax_report: "דיווח מס הכנסה",
  deductions_report: "דיווח ניכויים",
  payroll: "משכורות",
  annual_report: "דוח שנתי",
  capital_declaration: "הצהרת הון",
  open_file: "פתיחת תיק",
  close_file: "סגירת תיק",
  tax_consulting: "ייעוץ מס",
  tax_refund: "החזר מס",
  audit: "ביקורת דוחות",
  other: "שירות אחר",
};

const statusLabels: Record<string, string> = {
  active: "פעיל",
  completed: "הושלם",
  cancelled: "בוטל",
};

function getClientDisplayName(client: Client) {
  if (client.business_name?.trim()) {
    return client.business_name.trim();
  }

  const fullName = [client.first_name, client.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "לקוח ללא שם";
}

function getServiceClientName(service: Service) {
  const client = Array.isArray(service.clients)
    ? service.clients[0]
    : service.clients;

  if (!client) {
    return "לקוח לא נמצא";
  }

  if (client.business_name?.trim()) {
    return client.business_name.trim();
  }

  const fullName = [client.first_name, client.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return fullName || "לקוח ללא שם";
}

function getServiceEmployeeName(service: Service) {
  const employee = Array.isArray(service.profiles)
    ? service.profiles[0]
    : service.profiles;

  return employee?.full_name?.trim() || "לא הוגדר";
}

function getEmployeeRoleLabel(
  role: string | null,
) {
  const normalizedRole =
    role?.trim().toLowerCase();

  switch (normalizedRole) {
    case "admin":
      return "מנהל המשרד";

    case "manager":
      return "מנהל";

    case "accountant":
      return "רואה חשבון";

    case "employee":
      return "עובד";

    default:
      return "עובד";
  }
}

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(date: string) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("he-IL").format(
    new Date(`${date}T00:00:00`),
  );
}

function getLineTotal(line: ServiceLine, vatRate: number) {
  const amount = Number(line.amount || 0);
  if (Number.isNaN(amount) || amount < 0) {
    return 0;
  }

  return line.includesVat
    ? Math.round((amount * (1 + vatRate) + Number.EPSILON) * 100) / 100
    : amount;
}

export default function ServicesClient({
  organizationId,
  userId,
  clients = [],
  employees = [],
  services: initialServices = [],
}: Props) {
  const supabase = useMemo(() => createClient(), []);

const [services, setServices] = useState<Service[]>(
  Array.isArray(initialServices)
    ? initialServices
    : [],
);
  const [form, setForm] =
    useState<ServiceForm>(initialForm);

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] =
    useState(false);
  const [isSaving, setIsSaving] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");
  const [vatRate, setVatRate] = useState<number>(DEFAULT_VAT_RATE);
  const [showVatReminder, setShowVatReminder] = useState(false);
  const [isVatEditorOpen, setIsVatEditorOpen] =
    useState(false);
  const [vatEditorValue, setVatEditorValue] =
    useState(vatRate.toString());

  const totalAmount = useMemo(() => {
    return form.serviceLines.reduce(
      (total, line) => total + getLineTotal(line, vatRate),
      0,
    );
  }, [form.serviceLines, vatRate]);

  function updateServiceLine(
    lineId: string,
    field: keyof ServiceLine,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      serviceLines: current.serviceLines.map((line) =>
        line.id === lineId
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    }));
  }

  function dismissVatReminder() {
    setShowVatReminder(false);

    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      VAT_REMINDER_YEAR_KEY,
      new Date().getFullYear().toString(),
    );
  }

  function saveVatRate() {
    const parsed = Number(vatEditorValue);
    if (Number.isNaN(parsed) || parsed < 0) {
      setErrorMessage("יש להזין שיעור מע״מ תקין.");
      return;
    }

    setVatRate(parsed);
    setIsVatEditorOpen(false);
    setErrorMessage("");
  }

  function addServiceLine() {
    setForm((current) => ({
      ...current,
      serviceLines: [
        ...current.serviceLines,
        createEmptyServiceLine(
          `line-${current.serviceLines.length + 1}`,
        ),
      ],
    }));
  }

  function removeServiceLine(lineId: string) {
    setForm((current) => ({
      ...current,
      serviceLines: current.serviceLines.filter(
        (line) => line.id !== lineId,
      ),
    }));
  }

  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) =>
      getClientDisplayName(a).localeCompare(
        getClientDisplayName(b),
        "he",
      ),
    );
  }, [clients]);

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) =>
      (a.full_name || "").localeCompare(
        b.full_name || "",
        "he",
      ),
    );
  }, [employees]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedVatRate =
      window.localStorage.getItem(
        VAT_STORAGE_KEY,
      );
    if (storedVatRate) {
      const parsed = Number(storedVatRate);
      if (!Number.isNaN(parsed)) {
        setVatRate(parsed);
        setVatEditorValue(parsed.toString());
      }
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const reminderYear = Number(
      window.localStorage.getItem(
        VAT_REMINDER_YEAR_KEY,
      ),
    );

    if (
      today.getMonth() === 0 &&
      today.getDate() === 1 &&
      reminderYear !== currentYear
    ) {
      setShowVatReminder(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        VAT_STORAGE_KEY,
        vatRate.toString(),
      );
    }
  }, [vatRate]);

 const filteredServices = useMemo<Service[]>(() => {
  const safeServices = Array.isArray(services)
    ? services
    : [];

  const normalizedSearch =
    search.trim().toLowerCase();

  if (!normalizedSearch) {
    return safeServices;
  }

  return safeServices.filter((service) => {
    const searchableText = [
      service.service_number,
      getServiceClientName(service),
      serviceTypeLabels[service.service_type] ||
        service.service_type,
      getServiceEmployeeName(service),
      service.price,
      statusLabels[service.status] ||
        service.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(
      normalizedSearch,
    );
  });
}, [services, search]);

const totalServices = useMemo(() => {
  return filteredServices.reduce(
    (total, service) => {
      if (service.status === "cancelled") {
        return total;
      }

      return (
        total +
        Number(service.price || 0)
      );
    },
    0,
  );
}, [filteredServices]);

  function updateForm<K extends keyof ServiceForm>(
    key: K,
    value: ServiceForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openModal() {
    setErrorMessage("");

    setForm({
      ...initialForm,
      serviceDate:
        new Date().toISOString().split("T")[0],
      assignedTo: userId,
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    if (isSaving) {
      return;
    }

    setIsModalOpen(false);
    setErrorMessage("");
    setForm(initialForm);
  }

  async function loadServices() {
    const { data, error } = await supabase
      .from("services")
      .select(`
        id,
        service_number,
        service_date,
        service_type,
        price,
        status,
        notes,
        assigned_to,
        clients (
          first_name,
          last_name,
          business_name
        ),
        profiles!services_assigned_to_fkey (
          full_name
        )
      `)
      .eq("organization_id", organizationId)
      .order("service_date", {
        ascending: false,
      })
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "LOAD SERVICES ERROR:",
        error,
      );
      setErrorMessage(
        "השירות נשמר, אבל טעינת הרשימה מחדש נכשלה.",
      );
      return false;
    }

    setServices((data ?? []) as Service[]);
    return true;
  }

  async function createService() {
    setErrorMessage("");

    if (!form.clientId) {
      setErrorMessage("צריך לבחור לקוח.");
      return;
    }

    if (!form.serviceDate) {
      setErrorMessage(
        "צריך לבחור תאריך שירות.",
      );
      return;
    }

    if (!form.assignedTo) {
      setErrorMessage(
        "צריך לבחור מטפל בשירות.",
      );
      return;
    }

    const filledLines = form.serviceLines.filter(
      (line) => line.serviceType || line.amount.trim(),
    );

    if (filledLines.length === 0) {
      setErrorMessage(
        "צריך להזין לפחות שירות אחד.",
      );
      return;
    }

    for (const line of filledLines) {
      if (!line.serviceType) {
        setErrorMessage(
          "צריך לבחור סוג שירות בכל שורה.",
        );
        return;
      }

      if (!line.amount.trim()) {
        setErrorMessage(
          "צריך להזין מחיר בכל שורה.",
        );
        return;
      }

      const amount = Number(line.amount);
      if (
        Number.isNaN(amount) ||
        amount < 0
      ) {
        setErrorMessage(
          "צריך להזין מחיר תקין בכל שורה.",
        );
        return;
      }
    }

    setIsSaving(true);

    const rowsToInsert = filledLines.map(
      (line) => ({
        organization_id: organizationId,
        client_id: form.clientId,
        service_date: form.serviceDate,
        service_type: line.serviceType,
        assigned_to: form.assignedTo,
        price: getLineTotal(line, vatRate),
        notes: form.notes.trim() || null,
        status: "active",
        created_by: userId,
      }),
    );

    const { error } = await supabase
      .from("services")
      .insert(rowsToInsert);

    if (error) {
      console.error(
        "CREATE SERVICE ERROR:",
        error,
      );

      setErrorMessage(
        error.message ||
          "שמירת השירות נכשלה.",
      );
      setIsSaving(false);
      return;
    }

    const loadedSuccessfully =
      await loadServices();

    setIsSaving(false);

    if (loadedSuccessfully) {
      setIsModalOpen(false);
      setForm(initialForm);
      setErrorMessage("");
    }
  }

  async function deleteService(
    serviceId: string,
  ) {
    const confirmed = window.confirm(
      "האם למחוק את השירות?",
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", serviceId)
      .eq(
        "organization_id",
        organizationId,
      );

    if (error) {
      console.error(
        "DELETE SERVICE ERROR:",
        error,
      );

      window.alert(
        error.message ||
          "מחיקת השירות נכשלה.",
      );
      return;
    }

    setServices((current) =>
      current.filter(
        (service) =>
          service.id !== serviceId,
      ),
    );
  }

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-[1600px] px-4 py-6 sm:px-8"
    >
      <section className="rounded-[28px] border border-[#E8E9F2] bg-white p-5 shadow-[0_15px_50px_rgba(71,88,255,0.08)] sm:p-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#55547F] sm:text-5xl">
              רשימת שירותים
            </h1>

            <p className="mt-3 text-sm text-[#7A7D91] sm:text-base">
              ניהול שירותים, לקוחות, מטפלים
              ומחירים
            </p>
          </div>

          <button
            type="button"
            onClick={openModal}
            className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border-2 border-[#3F66FF] px-6 font-bold text-[#3F66FF] transition hover:bg-[#3F66FF] hover:text-white"
          >
            <Plus size={22} />
            הוספת שירות חדש
          </button>
        </div>

        {showVatReminder && (
          <div className="mt-6 rounded-[24px] border border-[#FFDEB9] bg-[#FFF6EA] px-6 py-5 text-[#7A5900] shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-lg text-[#7A5900]">
                  היום 1/1: עדכון שיעור המע״מ
                </p>
                <p className="mt-2 text-sm leading-6">
                  שיעור המע״מ הוא אחוז ומשתנה מדי פעם. האם לשנות את השיעור או להשאיר אותו כפי שהוא?
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setIsVatEditorOpen(true)}
                  className="inline-flex items-center justify-center rounded-full border border-[#D9AE46] bg-[#F7E4B0] px-5 py-3 text-sm font-bold text-[#7A5900] transition hover:bg-[#F1D885]"
                >
                  עדכן שיעור מע״מ
                </button>

                <button
                  type="button"
                  onClick={dismissVatReminder}
                  className="inline-flex items-center justify-center rounded-full border border-[#D9AE46] bg-white px-5 py-3 text-sm font-bold text-[#7A5900] transition hover:bg-[#F7E4B0]"
                >
                  השאר כפי שהוא
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center">
          <label className="relative block flex-1">
            <Search
              size={22}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-[#204CFF]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="חיפוש לפי לקוח, שירות, מטפל או מחיר"
              className="h-14 w-full rounded-full border border-[#D9DBE8] bg-white pr-14 pl-5 outline-none transition focus:border-[#4167FF] focus:ring-4 focus:ring-[#4167FF]/10"
            />
          </label>

          <div className="rounded-full border-2 border-[#A9AAF0] px-7 py-3 text-lg text-[#62658C]">
            סה״כ שירותים:
            <strong className="mr-3 text-[#20243D]">
              {formatCurrency(totalServices)}
            </strong>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-right">
            <thead>
              <tr className="bg-[#F7F8FA] text-[#4F5263]">
                <th className="px-5 py-5">
                  מספר שירות
                </th>
                <th className="px-5 py-5">
                  לקוח
                </th>
                <th className="px-5 py-5">
                  תאריך שירות
                </th>
                <th className="px-5 py-5">
                  סוג שירות
                </th>
                <th className="px-5 py-5">
                  מטפל
                </th>
                <th className="px-5 py-5">
                  מחיר
                </th>
                <th className="px-5 py-5">
                  סטטוס
                </th>
                <th className="px-5 py-5">
                  פעולות
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredServices.map(
                (service) => (
                  <tr
                    key={service.id}
                    className="transition hover:bg-[#FAFAFF]"
                  >
                    <td className="border-b border-[#ECECF3] px-5 py-5 font-bold text-[#244FE6]">
                      {service.service_number}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5 font-bold text-[#244FE6]">
                      {getServiceClientName(
                        service,
                      )}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      {formatDate(
                        service.service_date,
                      )}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      {serviceTypeLabels[
                        service.service_type
                      ] ||
                        service.service_type}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      {getServiceEmployeeName(
                        service,
                      )}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5 font-bold">
                      {formatCurrency(
                        service.price,
                      )}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      <span className="rounded-full bg-[#EFEEFF] px-4 py-2 font-bold text-[#6159D5]">
                        {statusLabels[
                          service.status
                        ] ||
                          service.status}
                      </span>
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      <button
                        type="button"
                        onClick={() =>
                          deleteService(
                            service.id,
                          )
                        }
                        className="rounded-full p-3 text-[#FF4E5D] transition hover:bg-[#FFF0F2]"
                        aria-label="מחיקת שירות"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ),
              )}

              {filteredServices.length ===
                0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-[#777B8F]"
                  >
                    עדיין לא קיימים שירותים.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141B29]/65 p-3 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeModal();
            }
          }}
        >
          <div className="max-h-[96vh] w-full max-w-[1180px] overflow-y-auto rounded-[28px] bg-[#F7F9FF] shadow-[0_40px_90px_rgba(13,76,171,0.18)] ring-1 ring-[#B7D4FF]">
            <div className="relative flex min-h-[135px] items-center justify-center rounded-t-[28px] bg-gradient-to-r from-[#0D4CAB] via-[#5B8CFF] to-[#F2C94C] px-6 py-8 text-white">
              <div className="absolute right-7 top-1/2 -translate-y-1/2 rounded-3xl bg-white/15 p-3 shadow-lg shadow-[#0f4cab]/10">
                <ClipboardList
                  size={56}
                  strokeWidth={1.8}
                />
              </div>

              <h2 className="text-center text-3xl font-black sm:text-5xl">
                הוספת שירות חדש
              </h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={isSaving}
                className="absolute left-5 top-5 rounded-full p-2 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="סגירת החלון"
              >
                <X
                  size={28}
                  strokeWidth={4}
                />
              </button>
            </div>

            <div className="p-6 sm:p-10">
              <section>
                <h3 className="text-xl font-black text-[#282B59] sm:text-2xl">
                  פרטי לקוח ושירות
                </h3>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <Field label="שם לקוח / עוסק מורשה">
                    <select
                      value={form.clientId}
                      onChange={(event) =>
                        updateForm(
                          "clientId",
                          event.target.value,
                        )
                      }
                      className="service-input"
                    >
                      <option value="">
                        בחר לקוח
                      </option>

                      {sortedClients.map(
                        (client) => (
                          <option
                            key={client.id}
                            value={client.id}
                          >
                            {getClientDisplayName(
                              client,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>

                  <Field label="תאריך שירות">
                    <input
                      type="date"
                      value={form.serviceDate}
                      onChange={(event) =>
                        updateForm(
                          "serviceDate",
                          event.target.value,
                        )
                      }
                      className="service-input"
                    />
                  </Field>

                  <Field label="מי מטפל בשירות">
                    <select
                      value={form.assignedTo}
                      onChange={(event) =>
                        updateForm(
                          "assignedTo",
                          event.target.value,
                        )
                      }
                      className="service-input"
                    >
                      <option value="">
                        בחר מטפל
                      </option>

                      {sortedEmployees.map(
                        (employee) => (
                          <option
                            key={employee.id}
                            value={employee.id}
                          >
                            {employee.full_name ||
                              "משתמש ללא שם"}{" "}
                            —{" "}
                            {getEmployeeRoleLabel(
                              employee.role,
                            )}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                </div>
              </section>

              <section className="mt-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-xl font-black text-[#282B59] sm:text-2xl">
                    פרטי שירות
                  </h3>

                  <button
                    type="button"
                    onClick={addServiceLine}
                    className="inline-flex items-center justify-center rounded-full border border-[#0D4CAB] bg-white px-4 py-2 text-sm font-bold text-[#0D4CAB] transition hover:border-[#F2C94C] hover:bg-[#FDF4D0] hover:text-[#0D4CAB] shadow-sm shadow-[#0d4cab]/10"
                  >
                    הוסף שירות נוסף
                  </button>
                </div>

                <div className="mt-6 space-y-6">
                  {form.serviceLines.map((line, index) => (
                    <div
                      key={line.id}
                      className="rounded-[28px] border border-[#D9E4FF] bg-white p-5 shadow-sm shadow-[#0D4CAB]/5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="flex-1">
                          <Field label={`סוג שירות ${index + 1}`}>
                            <select
                              value={line.serviceType}
                              onChange={(event) =>
                                updateServiceLine(
                                  line.id,
                                  "serviceType",
                                  event.target.value,
                                )
                              }
                              className="service-input"
                            >
                              <option value="">
                                בחר שירות
                              </option>

                              {Object.entries(
                                serviceTypeLabels,
                              ).map(([value, label]) => (
                                <option
                                  key={value}
                                  value={value}
                                >
                                  {label}
                                </option>
                              ))}
                            </select>
                          </Field>
                        </div>

                        <div className="flex-1">
                          <Field label={`מחיר ${index + 1}`}>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.amount}
                              onChange={(event) =>
                                updateServiceLine(
                                  line.id,
                                  "amount",
                                  event.target.value,
                                )
                              }
                              placeholder="0.00"
                              className="service-input"
                            />
                          </Field>
                        </div>

                        <div className="flex flex-1 flex-col gap-3">
                          <Field label="כולל או ללא מע״מ">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateServiceLine(
                                    line.id,
                                    "includesVat",
                                    false,
                                  )
                                }
                                className={`rounded-full border px-4 py-3 text-sm font-bold transition ${
                                  !line.includesVat
                                    ? "border-[#3F66FF] bg-[#3F66FF] text-white"
                                    : "border-[#D9DBE8] bg-white text-[#4F5263]"
                                }`}
                              >
                                ללא מע״מ
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  updateServiceLine(
                                    line.id,
                                    "includesVat",
                                    true,
                                  )
                                }
                                className={`rounded-full border px-4 py-3 text-sm font-bold transition ${
                                  line.includesVat
                                    ? "border-[#3F66FF] bg-[#3F66FF] text-white"
                                    : "border-[#D9DBE8] bg-white text-[#4F5263]"
                                }`}
                              >
                                כולל מע״מ
                              </button>
                            </div>
                          </Field>

                          <div className="rounded-3xl border border-[#D9DCFF] bg-white px-4 py-3 text-sm font-black text-[#2B2E55]">
                            סכום סופי:
                            <span className="float-left text-[#4164F5]">
                              {formatCurrency(getLineTotal(line, vatRate))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {form.serviceLines.length > 1 && (
                        <div className="mt-4 text-left">
                          <button
                            type="button"
                            onClick={() => removeServiceLine(line.id)}
                            className="text-sm font-bold text-[#FF4E5D] transition hover:text-[#D22A3A]"
                          >
                            הסר שירות זה
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <div className="mt-8 border-t border-[#D9DCE5] pt-7">
                <div className="w-full max-w-[550px] rounded-[25px] border-2 border-[#D9DCFF] px-7 py-5 text-xl font-black text-[#2B2E55]">
                  סה״כ:
                  <strong className="float-left text-[#4164F5]">
                    {formatCurrency(totalAmount)}
                  </strong>
                </div>
              </div>

              <section className="mt-8">
                <Field label="הערות וסיכום">
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm(
                        "notes",
                        event.target.value,
                      )
                    }
                    rows={4}
                    placeholder="הקלד הערות לגבי השירות..."
                    className="service-input min-h-[110px] resize-y rounded-[20px]"
                  />
                </Field>
              </section>

              {errorMessage && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-bold text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E1E3EA] pt-7 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="min-h-14 rounded-xl border border-[#B7D4FF] bg-white px-9 font-bold text-[#102144] transition hover:bg-[#F2F8FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ביטול
                </button>

                <button
                  type="button"
                  onClick={createService}
                  disabled={isSaving}
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#0D4CAB] via-[#5B8CFF] to-[#F2C94C] px-12 text-lg font-bold text-white shadow-lg shadow-[#0d4cab]/20 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={22} />

                  {isSaving
                    ? "שומר שירות..."
                    : "שמירה"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isVatEditorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#141B29]/65 p-3 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsVatEditorOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#222642]">
                  עדכון שיעור מע״מ
                </h2>
                <p className="mt-2 text-sm text-[#5C5F78]">
                  עדכן את שיעור המע״מ המשמש לחישוב סכום כולל מע״מ.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsVatEditorOpen(false)}
                className="rounded-full p-2 text-[#6671A2] transition hover:bg-[#F1F4FF]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm font-bold text-[#34375D]">
                שיעור מע״מ
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={vatEditorValue}
                onChange={(event) =>
                  setVatEditorValue(event.target.value)
                }
                className="w-full rounded-2xl border border-[#D9DBE8] bg-[#F7F8FB] px-4 py-3 text-sm outline-none transition focus:border-[#4167FF] focus:ring-4 focus:ring-[#4167FF]/10"
              />
              <div className="rounded-3xl border border-[#D9DCFF] bg-[#FAFBFF] px-4 py-4 text-sm text-[#2B2E55]">
                שיעור המע״מ הנוכחי: <strong>{(vatRate * 100).toFixed(2)}%</strong>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsVatEditorOpen(false)}
                className="rounded-xl border border-[#D5D8E2] px-5 py-3 text-sm font-bold text-[#626679] transition hover:bg-[#F7F8FA]"
              >
                ביטול
              </button>

              <button
                type="button"
                onClick={saveVatRate}
                className="rounded-xl bg-gradient-to-r from-[#0D4CAB] via-[#5B8CFF] to-[#F2C94C] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0d4cab]/20 transition hover:brightness-105"
              >
                שמור שיעור
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .service-input {
          width: 100%;
          min-height: 58px;
          border: 2px solid #c5dcff;
          border-radius: 999px;
          background: #eef6ff;
          padding: 0 20px;
          color: #102144;
          outline: none;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .service-input:focus {
          border-color: #0d4cab;
          background: #ffffff;
          box-shadow: 0 0 0 4px
            rgba(13, 76, 171, 0.12);
        }

        textarea.service-input {
          padding-top: 16px;
          padding-bottom: 16px;
        }
      `}</style>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-bold text-[#34375D]">
        {label}
      </span>

      {children}
    </label>
  );
}