"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeading } from "@/components/dashboard/PageHeading";
import { Badge } from "@/components/dashboard/Badge";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiError } from "@/lib/apiClient";
import { formatMinor, getDisplayBalanceMinor } from "@/lib/money";

type Account = {
  id: string;
  type: string;
  displayName: string;
  currency: string;
  status: string;
  cachedBalanceMinor: string | null;
  internalLedgerBalanceMinor: string | null;
  providerAccountRef: string | null;
};

type Txn = {
  id: string;
  type: string;
  direction: "DEBIT" | "CREDIT";
  amountMinor: string;
  currency: string;
  status: string;
  reference: string;
  description: string | null;
  initiatedAt: string;
  sourceAccount?: { displayName: string } | null;
  destinationAccount?: { displayName: string } | null;
};

type CustomerDetail = {
  id: string;
  legalFirstName: string;
  legalLastName: string;
  segment: string;
  createdAt: string;
  user: { email: string; status: string; mfaEnabled: boolean; createdAt: string };
  kyc: { status: string } | null;
  accounts: Account[];
  transactions: Txn[];
};

const USER_STATUSES = ["PENDING_VERIFICATION", "ACTIVE", "SUSPENDED", "CLOSED"];
const KYC_STATUSES = ["NOT_STARTED", "PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "EXPIRED"];

function userStatusTone(status: string) {
  if (status === "ACTIVE") return "positive" as const;
  if (status === "SUSPENDED" || status === "CLOSED") return "negative" as const;
  return "gold" as const;
}

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [kycStatus, setKycStatus] = useState("NOT_STARTED");
  const [userStatus, setUserStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [creditingAccountId, setCreditingAccountId] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [creditSubmitting, setCreditSubmitting] = useState(false);
  const [creditError, setCreditError] = useState("");

  const load = useCallback(() => {
    apiFetch<{ customer: CustomerDetail }>(`/api/admin/customers/${params.id}`)
      .then((d) => {
        setCustomer(d.customer);
        setFirstName(d.customer.legalFirstName);
        setLastName(d.customer.legalLastName);
        setEmail(d.customer.user.email);
        setKycStatus(d.customer.kyc?.status ?? "NOT_STARTED");
        setUserStatus(d.customer.user.status);
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : "Something went wrong."));
  }, [params.id]);

  useEffect(load, [load]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      await apiFetch(`/api/admin/customers/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ legalFirstName: firstName, legalLastName: lastName, email, kycStatus, userStatus }),
      });
      setEditing(false);
      load();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditingAccountId) return;
    setCreditSubmitting(true);
    setCreditError("");
    try {
      const amountMinor = Math.round(Number(creditAmount) * 100);
      await apiFetch(`/api/admin/accounts/${creditingAccountId}/credit`, {
        method: "POST",
        body: JSON.stringify({
          idempotencyKey: crypto.randomUUID(),
          amountMinor,
          reason: creditReason || "Demo credit",
        }),
      });
      setCreditingAccountId(null);
      setCreditAmount("");
      setCreditReason("");
      load();
    } catch (err) {
      setCreditError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setCreditSubmitting(false);
    }
  }

  if (loadError) return <p className="text-sm text-danger">{loadError}</p>;
  if (!customer) return <p className="text-sm text-mist">Loading…</p>;

  return (
    <div>
      <button
        onClick={() => router.push("/admin/customers")}
        className="mb-6 flex items-center gap-2 text-sm text-ivory-dim hover:text-ivory"
      >
        <ArrowLeft size={15} /> Back to Customers
      </button>

      <PageHeading
        title={`${customer.legalFirstName} ${customer.legalLastName}`}
        subtitle={customer.user.email}
        actions={
          <Button size="md" variant="secondary" onClick={() => setEditing((v) => !v)}>
            {editing ? "Cancel" : "Edit Customer"}
          </Button>
        }
      />

      {editing && (
        <form
          onSubmit={handleSaveEdit}
          className="mb-6 grid gap-4 rounded-2xl border border-line bg-ink-3 p-6 sm:grid-cols-2"
        >
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />
          <Field label="Email" value={email} onChange={setEmail} type="email" />
          <SelectField label="KYC Status" value={kycStatus} onChange={setKycStatus} options={KYC_STATUSES} />
          <SelectField label="Account Status" value={userStatus} onChange={setUserStatus} options={USER_STATUSES} />
          {saveError && <p className="text-sm text-danger sm:col-span-2">{saveError}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" size="md" disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      )}

      <div className="mb-8 rounded-2xl border border-line bg-ink-3 p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-mist">Customer</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="text-sm text-ivory-dim">
            Segment: <span className="text-ivory">{customer.segment}</span>
          </p>
          <p className="text-sm text-ivory-dim">
            Account status: <Badge tone={userStatusTone(customer.user.status)}>{customer.user.status.replace(/_/g, " ")}</Badge>
          </p>
          <p className="text-sm text-ivory-dim">
            KYC status:{" "}
            <Badge tone={customer.kyc?.status === "APPROVED" ? "positive" : "gold"}>
              {(customer.kyc?.status ?? "NOT_STARTED").replace(/_/g, " ")}
            </Badge>
          </p>
          <p className="text-sm text-ivory-dim">
            MFA enabled: <span className="text-ivory">{customer.user.mfaEnabled ? "Yes" : "No"}</span>
          </p>
          <p className="text-sm text-ivory-dim">
            Customer since: <span className="text-ivory">{new Date(customer.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-mist">Accounts</p>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {customer.accounts.length === 0 && <p className="text-sm text-mist">No accounts yet.</p>}
        {customer.accounts.map((acc) => (
          <div key={acc.id} className="rounded-2xl border border-line bg-ink-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-mist">{acc.type}</p>
              <Badge tone={acc.status === "ACTIVE" ? "positive" : acc.status === "PENDING" ? "gold" : "negative"}>
                {acc.status}
              </Badge>
            </div>
            <p className="mt-2 text-ivory">{acc.displayName}</p>
            <p className="mt-3 font-display text-2xl tabular-nums text-ivory">
              {formatMinor(getDisplayBalanceMinor(acc), acc.currency)}
            </p>

            {acc.providerAccountRef ? (
              <p className="mt-4 text-xs text-mist">Connected to a real provider — demo credit unavailable.</p>
            ) : creditingAccountId === acc.id ? (
              <form onSubmit={handleCredit} className="mt-4 space-y-2">
                <div className="flex items-center rounded-lg border border-line bg-ink-2 px-3 py-2 focus-within:border-gold/50">
                  <span className="mr-1 text-mist">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    autoFocus
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-transparent text-sm text-ivory placeholder:text-mist-dim focus:outline-none"
                  />
                </div>
                <input
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Reason (e.g. demo funding)"
                  className="w-full rounded-lg border border-line bg-ink-2 px-3 py-2 text-sm text-ivory placeholder:text-mist-dim focus:border-gold/50 focus:outline-none"
                />
                {creditError && <p className="text-xs text-danger">{creditError}</p>}
                <div className="flex gap-2">
                  <Button type="submit" size="md" className="flex-1" disabled={creditSubmitting}>
                    {creditSubmitting ? "Crediting…" : "Confirm Credit"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      setCreditingAccountId(null);
                      setCreditError("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <Button variant="secondary" size="md" className="mt-4 w-full" onClick={() => setCreditingAccountId(acc.id)}>
                Credit Account (Demo)
              </Button>
            )}
          </div>
        ))}
      </div>

      <p className="mb-3 text-xs uppercase tracking-[0.16em] text-mist">Recent Transactions</p>
      <div className="overflow-x-auto rounded-2xl border border-line bg-ink-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-mist">
              <th className="px-6 py-4 font-medium">Type</th>
              <th className="px-6 py-4 font-medium">Reference</th>
              <th className="px-6 py-4 font-medium">Account</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {customer.transactions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-mist">
                  No transactions yet.
                </td>
              </tr>
            )}
            {customer.transactions.map((t) => (
              <tr key={t.id} className="border-b border-line last:border-0 hover:bg-ink-4/50">
                <td className="px-6 py-4 text-ivory-dim">{t.type.replace(/_/g, " ")}</td>
                <td className="px-6 py-4 text-ivory">
                  {t.reference}
                  {t.description ? ` — ${t.description}` : ""}
                </td>
                <td className="px-6 py-4 text-ivory-dim">
                  {t.destinationAccount?.displayName ?? t.sourceAccount?.displayName ?? "—"}
                </td>
                <td className="px-6 py-4">
                  <Badge tone={t.status === "SETTLED" ? "positive" : t.status === "FAILED" ? "negative" : "gold"}>
                    {t.status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right tabular-nums text-ivory">
                  {t.direction === "CREDIT" ? "+" : "−"}
                  {formatMinor(t.amountMinor, t.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-mist">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-ivory focus:border-gold/50 focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
