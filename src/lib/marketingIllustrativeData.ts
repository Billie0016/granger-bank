/**
 * Illustrative product-preview figures used ONLY by public marketing
 * sections (the homepage's "Financial Experience" and "Digital Banking
 * preview" sections) to show what the Granger Bank platform looks like —
 * the same way any bank's marketing site shows a mocked-up screenshot of
 * its app to a logged-out visitor.
 *
 * This is deliberately kept separate from anything a logged-in user sees.
 * No authenticated page in this app (src/app/dashboard/**, src/app/admin/**)
 * reads from this file — those pages fetch real data from the API and show
 * honest empty/pending states, per docs/production/01-current-architecture-audit.md.
 * If that ever changes, it would defeat the purpose of this file existing.
 */

export const illustrativeAccounts = [
  { id: "acc_checking", name: "Everyday Checking", type: "Checking", number: "•••• 2481", balance: 18420.32 },
  { id: "acc_savings", name: "High-Yield Savings", type: "Savings", number: "•••• 7793", balance: 61830.43 },
  { id: "acc_business", name: "Business Operating", type: "Business", number: "•••• 5510", balance: 4000.0 },
];

export const illustrativeTotalBalance = illustrativeAccounts.reduce((sum, a) => sum + a.balance, 0);
export const illustrativeMonthlySpending = 6420.3;
export const illustrativeSavingsGrowthPct = 12.8;

export const illustrativeSpendingByMonth = [
  { month: "Apr", spending: 5210, savings: 3100 },
  { month: "May", spending: 5480, savings: 3400 },
  { month: "Jun", spending: 5990, savings: 3820 },
  { month: "Jul", spending: 5720, savings: 4120 },
  { month: "Aug", spending: 6120, savings: 4590 },
  { month: "Sep", spending: 6420, savings: 5010 },
];

export const illustrativeTransactions = [
  { id: "tx_1", merchant: "Aria Rooftop, NYC", category: "Dining", date: "2026-08-31", amount: -186.4 },
  { id: "tx_2", merchant: "Payroll Deposit — Halcyon Studio", category: "Income", date: "2026-08-29", amount: 8200.0 },
  { id: "tx_3", merchant: "Delta Air Lines", category: "Travel", date: "2026-08-27", amount: -642.1 },
  { id: "tx_4", merchant: "Savings Auto-Transfer", category: "Transfer", date: "2026-08-25", amount: -1500.0 },
];

export function formatIllustrativeCurrency(value: number) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
