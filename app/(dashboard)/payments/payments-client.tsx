"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CreditCard,
  Landmark,
  Plus,
  Search,
  Trash2,
  WalletCards,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type PaymentMethod =
  | "cash"
  | "bank_transfer"
  | "credit_card"
  | "check";

type Client = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  business_name: string | null;
  business_number: string | null;
  income_tax_file: string | null;
};

type PaymentLine = {
  id: string;
  amount: number;
  bank_name: string | null;
  bank_code: string | null;
  branch_number: string | null;
  account_number: string | null;
  check_number: string | null;
  check_date: string | null;
  check_status: string | null;
  transaction_number: string | null;
  credit_company: string | null;
  installments: number | null;
};

type Payment = {
  id: string;
  payment_number: number;
  payment_date: string;
  payment_method: PaymentMethod;
  total_amount: number;
  status: string;
  notes: string | null;
  client_id: string;
  clients: Client | Client[] | null;
  payment_lines: PaymentLine[];
};

type Props = {
  organizationId: string;
  userId: string;
  initialClients: Client[];
  initialPayments: Payment[];
};

type PaymentForm = {
  clientId: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  amount: string;
  bankName: string;
  bankCode: string;
  branchNumber: string;
  accountNumber: string;
  checkNumber: string;
  checkDate: string;
  checkStatus: string;
  transactionNumber: string;
  creditCompany: string;
  installments: string;
  notes: string;
};

const today = new Date().toISOString().split("T")[0];

const initialForm: PaymentForm = {
  clientId: "",
  paymentDate: today,
  paymentMethod: "bank_transfer",
  amount: "",
  bankName: "",
  bankCode: "",
  branchNumber: "",
  accountNumber: "",
  checkNumber: "",
  checkDate: today,
  checkStatus: "pending",
  transactionNumber: "",
  creditCompany: "",
  installments: "1",
  notes: "",
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "מזומן",
  bank_transfer: "העברה בנקאית",
  credit_card: "אשראי",
  check: "צ׳ק",
};

const statusLabels: Record<string, string> = {
  paid: "שולם",
  pending: "ממתין",
  cancelled: "בוטל",
};

function getClient(payment: Payment): Client | null {
  if (!payment.clients) return null;

  if (Array.isArray(payment.clients)) {
    return payment.clients[0] ?? null;
  }

  return payment.clients;
}

function getClientName(client: Client | null) {
  if (!client) return "לקוח לא נמצא";

  if (client.business_name) {
    return client.business_name;
  }

  return [client.first_name, client.last_name]
    .filter(Boolean)
    .join(" ");
}

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
  }).format(Number(amount || 0));
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("he-IL").format(new Date(date));
}

export default function PaymentsClient({
  organizationId,
  userId,
  initialClients,
  initialPayments,
}: Props) {
  const supabase = createClient();

  const [payments, setPayments] = useState(initialPayments);
  const [form, setForm] = useState<PaymentForm>(initialForm);

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredPayments = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const client = getClient(payment);
      const clientName = getClientName(client);

      const searchableText = [
        clientName,
        client?.business_number,
        client?.income_tax_file,
        payment.payment_number,
        payment.total_amount,
        paymentMethodLabels[payment.payment_method],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      const matchesDateFrom =
        !dateFrom || payment.payment_date >= dateFrom;

      const matchesDateTo =
        !dateTo || payment.payment_date <= dateTo;

      return (
        matchesSearch &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [payments, search, dateFrom, dateTo]);

  const totalPayments = useMemo(() => {
    return filteredPayments
      .filter((payment) => payment.status !== "cancelled")
      .reduce(
        (total, payment) =>
          total + Number(payment.total_amount),
        0,
      );
  }, [filteredPayments]);

  function updateForm<K extends keyof PaymentForm>(
    key: K,
    value: PaymentForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setForm({
      ...initialForm,
      paymentDate: new Date().toISOString().split("T")[0],
      checkDate: new Date().toISOString().split("T")[0],
    });

    setErrorMessage("");
  }

  function closeModal() {
    setIsModalOpen(false);
    resetForm();
  }

  async function loadPayments() {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        id,
        payment_number,
        payment_date,
        payment_method,
        total_amount,
        status,
        notes,
        client_id,
        clients (
          id,
          first_name,
          last_name,
          business_name,
          business_number,
          income_tax_file
        ),
        payment_lines (
          id,
          amount,
          bank_name,
          bank_code,
          branch_number,
          account_number,
          check_number,
          check_date,
          check_status,
          transaction_number,
          credit_company,
          installments
        )
      `)
      .eq("organization_id", organizationId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("LOAD PAYMENTS ERROR:", error);
      return;
    }

    setPayments((data ?? []) as Payment[]);
  }

  async function createPayment() {
    setErrorMessage("");

    if (!form.clientId) {
      setErrorMessage("צריך לבחור לקוח.");
      return;
    }

    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setErrorMessage("צריך להזין סכום גדול מאפס.");
      return;
    }

    setIsSaving(true);

    const { data: payment, error: paymentError } =
      await supabase
        .from("payments")
        .insert({
          organization_id: organizationId,
          client_id: form.clientId,
          payment_date: form.paymentDate,
          payment_method: form.paymentMethod,
          total_amount: amount,
          status:
            form.paymentMethod === "check"
              ? "pending"
              : "paid",
          received_by: userId,
          notes: form.notes.trim() || null,
        })
        .select("id")
        .single();

    if (paymentError || !payment) {
      console.error(
        "CREATE PAYMENT ERROR:",
        paymentError,
      );

      setErrorMessage(
        paymentError?.message ||
          "שמירת התשלום נכשלה.",
      );

      setIsSaving(false);
      return;
    }

    const paymentLine = {
      organization_id: organizationId,
      payment_id: payment.id,
      amount,

      bank_name:
        form.paymentMethod === "bank_transfer" ||
        form.paymentMethod === "check"
          ? form.bankName.trim() || null
          : null,

      bank_code:
        form.paymentMethod === "bank_transfer" ||
        form.paymentMethod === "check"
          ? form.bankCode.trim() || null
          : null,

      branch_number:
        form.paymentMethod === "bank_transfer" ||
        form.paymentMethod === "check"
          ? form.branchNumber.trim() || null
          : null,

      account_number:
        form.paymentMethod === "bank_transfer" ||
        form.paymentMethod === "check"
          ? form.accountNumber.trim() || null
          : null,

      check_number:
        form.paymentMethod === "check"
          ? form.checkNumber.trim() || null
          : null,

      check_date:
        form.paymentMethod === "check"
          ? form.checkDate
          : null,

      check_status:
        form.paymentMethod === "check"
          ? form.checkStatus
          : null,

      transaction_number:
        form.paymentMethod === "bank_transfer" ||
        form.paymentMethod === "credit_card"
          ? form.transactionNumber.trim() || null
          : null,

      credit_company:
        form.paymentMethod === "credit_card"
          ? form.creditCompany.trim() || null
          : null,

      installments:
        form.paymentMethod === "credit_card"
          ? Number(form.installments || 1)
          : null,
    };

    const { error: lineError } = await supabase
      .from("payment_lines")
      .insert(paymentLine);

    if (lineError) {
      console.error(
        "CREATE PAYMENT LINE ERROR:",
        lineError,
      );

      await supabase
        .from("payments")
        .delete()
        .eq("id", payment.id);

      setErrorMessage(
        lineError.message ||
          "שמירת פרטי התשלום נכשלה.",
      );

      setIsSaving(false);
      return;
    }

    await loadPayments();

    setIsSaving(false);
    closeModal();
  }

  async function deletePayment(paymentId: string) {
    const confirmed = window.confirm(
      "האם למחוק את התשלום?",
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("payments")
      .delete()
      .eq("id", paymentId)
      .eq("organization_id", organizationId);

    if (error) {
      console.error("DELETE PAYMENT ERROR:", error);
      window.alert("מחיקת התשלום נכשלה.");
      return;
    }

    setPayments((current) =>
      current.filter(
        (payment) => payment.id !== paymentId,
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
              רשימת תשלומים
            </h1>

            <p className="mt-3 text-sm text-[#7A7D91] sm:text-base">
              ניהול תשלומים, אמצעי תשלום ופרטי גבייה
              לפי לקוח.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex min-h-12 items-center gap-3 rounded-full border-2 border-[#3F66FF] px-6 font-bold text-[#3F66FF] transition hover:bg-[#3F66FF] hover:text-white"
            >
              <Plus size={22} />
              הוספת תשלום חדש
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 xl:grid-cols-[minmax(300px,1fr)_210px_210px_auto] xl:items-end">
          <label className="relative block">
            <span className="mb-2 block text-sm font-bold text-[#55586F]">
              חיפוש
            </span>

            <Search
              size={22}
              className="absolute right-5 top-[52px] -translate-y-1/2 text-[#204CFF]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="חיפוש לפי לקוח, מספר תיק, סכום או סוג תשלום"
              className="h-14 w-full rounded-full border border-[#D9DBE8] bg-white pr-14 pl-5 outline-none transition focus:border-[#4167FF] focus:ring-4 focus:ring-[#4167FF]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#55586F]">
              מתאריך
            </span>

            <div className="relative">
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) =>
                  setDateFrom(event.target.value)
                }
                className="h-14 w-full rounded-full border border-[#D9DBE8] bg-white px-5 outline-none transition focus:border-[#4167FF] focus:ring-4 focus:ring-[#4167FF]/10"
              />

              {dateFrom && (
                <button
                  type="button"
                  onClick={() => setDateFrom("")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-1 text-[#254CFF]"
                  aria-label="ניקוי תאריך התחלה"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-[#55586F]">
              עד תאריך
            </span>

            <div className="relative">
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) =>
                  setDateTo(event.target.value)
                }
                className="h-14 w-full rounded-full border border-[#D9DBE8] bg-white px-5 outline-none transition focus:border-[#4167FF] focus:ring-4 focus:ring-[#4167FF]/10"
              />

              {dateTo && (
                <button
                  type="button"
                  onClick={() => setDateTo("")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-1 text-[#254CFF]"
                  aria-label="ניקוי תאריך סיום"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </label>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setDateFrom("");
              setDateTo("");
            }}
            disabled={
              !search && !dateFrom && !dateTo
            }
            className="h-14 rounded-full border border-[#D8DAE7] px-6 font-bold text-[#62667C] transition hover:border-[#4167FF] hover:text-[#4167FF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ניקוי סינון
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#777B8F]">
            נמצאו{" "}
            <strong className="text-[#252942]">
              {filteredPayments.length}
            </strong>{" "}
            תשלומים
          </p>

          <div className="rounded-full border-2 border-[#A9AAF0] px-7 py-3 text-lg text-[#62658C]">
            סה״כ שולם:
            <strong className="mr-3 text-[#20243D]">
              {formatCurrency(totalPayments)}
            </strong>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto">
          <table className="min-w-[1050px] w-full border-separate border-spacing-0 text-right">
            <thead>
              <tr className="bg-[#F7F8FA] text-[#4F5263]">
                <th className="px-5 py-5">
                  מספר תשלום
                </th>
                <th className="px-5 py-5">
                  לקוח
                </th>
                <th className="px-5 py-5">
                  תאריך
                </th>
                <th className="px-5 py-5">
                  סוג תשלום
                </th>
                <th className="px-5 py-5">
                  אסמכתא
                </th>
                <th className="px-5 py-5">
                  סטטוס
                </th>
                <th className="px-5 py-5">
                  סכום
                </th>
                <th className="px-5 py-5">
                  פעולות
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((payment) => {
                const client = getClient(payment);
                const paymentLine =
                  payment.payment_lines?.[0];

                return (
                  <tr
                    key={payment.id}
                    className="transition hover:bg-[#FAFAFF]"
                  >
                    <td className="border-b border-[#ECECF3] px-5 py-5 font-bold text-[#244FE6]">
                      {payment.payment_number}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5 font-bold text-[#244FE6]">
                      {getClientName(client)}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      {formatDate(
                        payment.payment_date,
                      )}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      {
                        paymentMethodLabels[
                          payment.payment_method
                        ]
                      }
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      {paymentLine?.transaction_number ||
                        paymentLine?.check_number ||
                        "—"}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      <span className="rounded-full bg-[#EFEEFF] px-4 py-2 font-bold text-[#6159D5]">
                        {statusLabels[payment.status] ??
                          payment.status}
                      </span>
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5 font-bold">
                      {formatCurrency(
                        payment.total_amount,
                      )}
                    </td>

                    <td className="border-b border-[#ECECF3] px-5 py-5">
                      <button
                        type="button"
                        onClick={() =>
                          deletePayment(payment.id)
                        }
                        className="rounded-full p-3 text-[#FF4E5D] transition hover:bg-[#FFF0F2]"
                        aria-label="מחיקת תשלום"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredPayments.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-16 text-center text-[#777B8F]"
                  >
                    לא נמצאו תשלומים בהתאם
                    לסינון שנבחר.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#13182C]/55 p-3 backdrop-blur-sm">
          <div className="max-h-[94vh] w-full max-w-[1200px] overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E7E8EF] bg-white px-6 py-5">
              <div>
                <h2 className="text-2xl font-black text-[#252750]">
                  הוספת תשלום חדש
                </h2>

                <p className="mt-1 text-sm text-[#7C8092]">
                  הזן את פרטי התשלום שהתקבל מהלקוח
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-[#F3F4F8] p-3 text-[#34364C] transition hover:bg-[#E9EAF0]"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <Field label="לקוח">
                  <select
                    value={form.clientId}
                    onChange={(event) =>
                      updateForm(
                        "clientId",
                        event.target.value,
                      )
                    }
                    className="payment-input"
                  >
                    <option value="">בחר לקוח</option>

                    {initialClients.map((client) => (
                      <option
                        key={client.id}
                        value={client.id}
                      >
                        {getClientName(client)}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="תאריך תשלום">
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(event) =>
                      updateForm(
                        "paymentDate",
                        event.target.value,
                      )
                    }
                    className="payment-input"
                  />
                </Field>

                <Field label="סוג תשלום">
                  <select
                    value={form.paymentMethod}
                    onChange={(event) =>
                      updateForm(
                        "paymentMethod",
                        event.target.value as PaymentMethod,
                      )
                    }
                    className="payment-input"
                  >
                    <option value="cash">מזומן</option>
                    <option value="bank_transfer">
                      העברה בנקאית
                    </option>
                    <option value="credit_card">
                      אשראי
                    </option>
                    <option value="check">צ׳ק</option>
                  </select>
                </Field>

                <Field label="סכום">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={(event) =>
                      updateForm(
                        "amount",
                        event.target.value,
                      )
                    }
                    placeholder="0.00"
                    className="payment-input"
                  />
                </Field>
              </div>

              {form.paymentMethod === "bank_transfer" && (
                <PaymentDetailsSection
                  title="פרטי העברה בנקאית"
                  icon={<Landmark size={23} />}
                >
                  <div className="grid gap-5 md:grid-cols-2">
                    <Field label="שם הבנק">
                      <input
                        value={form.bankName}
                        onChange={(event) =>
                          updateForm(
                            "bankName",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר בנק">
                      <input
                        value={form.bankCode}
                        onChange={(event) =>
                          updateForm(
                            "bankCode",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר סניף">
                      <input
                        value={form.branchNumber}
                        onChange={(event) =>
                          updateForm(
                            "branchNumber",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר חשבון">
                      <input
                        value={form.accountNumber}
                        onChange={(event) =>
                          updateForm(
                            "accountNumber",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="אסמכתא">
                      <input
                        value={form.transactionNumber}
                        onChange={(event) =>
                          updateForm(
                            "transactionNumber",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>
                  </div>
                </PaymentDetailsSection>
              )}

              {form.paymentMethod === "credit_card" && (
                <PaymentDetailsSection
                  title="פרטי אשראי"
                  icon={<CreditCard size={23} />}
                >
                  <div className="grid gap-5 md:grid-cols-3">
                    <Field label="חברת אשראי">
                      <input
                        value={form.creditCompany}
                        onChange={(event) =>
                          updateForm(
                            "creditCompany",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="אסמכתא">
                      <input
                        value={form.transactionNumber}
                        onChange={(event) =>
                          updateForm(
                            "transactionNumber",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר תשלומים">
                      <input
                        type="number"
                        min="1"
                        value={form.installments}
                        onChange={(event) =>
                          updateForm(
                            "installments",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>
                  </div>
                </PaymentDetailsSection>
              )}

              {form.paymentMethod === "check" && (
                <PaymentDetailsSection
                  title="פרטי צ׳ק"
                  icon={<WalletCards size={23} />}
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field label="תאריך פירעון">
                      <input
                        type="date"
                        value={form.checkDate}
                        onChange={(event) =>
                          updateForm(
                            "checkDate",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="שם הבנק">
                      <input
                        value={form.bankName}
                        onChange={(event) =>
                          updateForm(
                            "bankName",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר בנק">
                      <input
                        value={form.bankCode}
                        onChange={(event) =>
                          updateForm(
                            "bankCode",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר סניף">
                      <input
                        value={form.branchNumber}
                        onChange={(event) =>
                          updateForm(
                            "branchNumber",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר חשבון">
                      <input
                        value={form.accountNumber}
                        onChange={(event) =>
                          updateForm(
                            "accountNumber",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="מספר צ׳ק">
                      <input
                        value={form.checkNumber}
                        onChange={(event) =>
                          updateForm(
                            "checkNumber",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      />
                    </Field>

                    <Field label="סטטוס צ׳ק">
                      <select
                        value={form.checkStatus}
                        onChange={(event) =>
                          updateForm(
                            "checkStatus",
                            event.target.value,
                          )
                        }
                        className="payment-input"
                      >
                        <option value="pending">
                          ממתין
                        </option>
                        <option value="deposited">
                          הופקד
                        </option>
                        <option value="cleared">
                          נפרע
                        </option>
                        <option value="returned">
                          חזר
                        </option>
                        <option value="cancelled">
                          בוטל
                        </option>
                      </select>
                    </Field>
                  </div>
                </PaymentDetailsSection>
              )}

              {form.paymentMethod === "cash" && (
                <PaymentDetailsSection
                  title="תשלום במזומן"
                  icon={<WalletCards size={23} />}
                >
                  <p className="text-sm text-[#6E7287]">
                    בתשלום מזומן אין צורך להזין פרטי בנק
                    או אסמכתא.
                  </p>
                </PaymentDetailsSection>
              )}

              <div className="mt-7">
                <Field label="הערות">
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      updateForm(
                        "notes",
                        event.target.value,
                      )
                    }
                    rows={4}
                    className="payment-input min-h-28 resize-y rounded-[20px]"
                  />
                </Field>
              </div>

              {errorMessage && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[#E5E7EE] pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="min-h-13 rounded-xl border border-[#D6D8E2] px-8 font-bold text-[#5F6375]"
                >
                  ביטול
                </button>

                <button
                  type="button"
                  onClick={createPayment}
                  disabled={isSaving}
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#4E9FFF] to-[#3D59FF] px-10 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check size={20} />

                  {isSaving
                    ? "שומר תשלום..."
                    : "שמירת תשלום"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .payment-input {
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

        .payment-input:focus {
          border-color: #5875ff;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(75, 101, 255, 0.1);
        }

        textarea.payment-input {
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
  children: React.ReactNode;
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

function PaymentDetailsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 border-t border-[#DADDE6] pt-7">
      <div className="mb-5 flex items-center gap-3 text-[#292D59]">
        {icon}

        <h3 className="text-xl font-black">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}