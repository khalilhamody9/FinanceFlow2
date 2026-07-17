"use client";

import { useMemo, useState, type ReactNode } from "react";
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

type ServiceForm = {
  clientId: string;
  serviceDate: string;
  serviceType: string;
  assignedTo: string;
  price: string;
  notes: string;
};

const today = new Date().toISOString().split("T")[0];

const initialForm: ServiceForm = {
  clientId: "",
  serviceDate: today,
  serviceType: "",
  assignedTo: "",
  price: "",
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

    if (!form.serviceType) {
      setErrorMessage(
        "צריך לבחור סוג שירות.",
      );
      return;
    }

    if (!form.assignedTo) {
      setErrorMessage(
        "צריך לבחור מטפל בשירות.",
      );
      return;
    }

    if (!form.price.trim()) {
      setErrorMessage("צריך להזין מחיר.");
      return;
    }

    const price = Number(form.price);

    if (
      Number.isNaN(price) ||
      price < 0
    ) {
      setErrorMessage(
        "צריך להזין מחיר תקין.",
      );
      return;
    }

    setIsSaving(true);

    const { error } = await supabase
      .from("services")
      .insert({
        organization_id: organizationId,
        client_id: form.clientId,
        service_date: form.serviceDate,
        service_type: form.serviceType,
        assigned_to: form.assignedTo,
        price,
        notes: form.notes.trim() || null,
        status: "active",
        created_by: userId,
      });

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
          <div className="max-h-[96vh] w-full max-w-[1180px] overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="relative flex min-h-[125px] items-center justify-center rounded-t-[28px] bg-gradient-to-l from-[#2895CC] to-[#2D83C4] px-6 py-6 text-white">
              <div className="absolute right-7 top-1/2 -translate-y-1/2 rounded-3xl bg-white/10 p-3">
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
                <h3 className="text-xl font-black text-[#282B59] sm:text-2xl">
                  פרטים
                </h3>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <Field label="סוג שירות">
                    <select
                      value={form.serviceType}
                      onChange={(event) =>
                        updateForm(
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
                      ).map(
                        ([value, label]) => (
                          <option
                            key={value}
                            value={value}
                          >
                            {label}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>

                  <Field label="מחיר">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={(event) =>
                        updateForm(
                          "price",
                          event.target.value,
                        )
                      }
                      placeholder="0.00"
                      className="service-input"
                    />
                  </Field>
                </div>
              </section>

              <div className="mt-8 border-t border-[#D9DCE5] pt-7">
                <div className="w-full max-w-[550px] rounded-[25px] border-2 border-[#D9DCFF] px-7 py-5 text-xl font-black text-[#2B2E55]">
                  סה״כ:
                  <strong className="float-left text-[#4164F5]">
                    {formatCurrency(form.price)}
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
                  className="min-h-14 rounded-xl border border-[#D5D8E2] px-9 font-bold text-[#626679] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ביטול
                </button>

                <button
                  type="button"
                  onClick={createService}
                  disabled={isSaving}
                  className="inline-flex min-h-14 items-center justify-center gap-3 rounded-xl bg-gradient-to-l from-[#4A9EFF] to-[#3C58FF] px-12 text-lg font-bold text-white shadow-lg transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
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

      <style jsx global>{`
        .service-input {
          width: 100%;
          min-height: 58px;
          border: 2px solid #dfe1ff;
          border-radius: 999px;
          background: #f8f9fd;
          padding: 0 20px;
          color: #222642;
          outline: none;
          transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            background 0.2s ease;
        }

        .service-input:focus {
          border-color: #5875ff;
          background: #ffffff;
          box-shadow: 0 0 0 4px
            rgba(75, 101, 255, 0.1);
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