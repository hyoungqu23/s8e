export type ParsedTransactionRow = {
  date: string;
  accountName: string;
  description: string;
  category?: string | null;
  amount: number;
};

export type LedgerEntry = {
  date: string;
  accountName: string;
  description: string;
  category?: string | null;
  amount: number;
  direction: "income" | "expense";
};

export type LedgerSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  count: number;
};

export function toLedgerEntries(rows: ParsedTransactionRow[]): LedgerEntry[] {
  return rows.map((row) => ({
    date: row.date,
    accountName: row.accountName,
    description: row.description,
    category: row.category ?? null,
    amount: row.amount,
    direction: row.amount >= 0 ? "income" : "expense"
  }));
}

export function summarizeLedger(entries: LedgerEntry[]): LedgerSummary {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const entry of entries) {
    if (entry.amount >= 0) {
      totalIncome += entry.amount;
      continue;
    }

    totalExpense += Math.abs(entry.amount);
  }

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    count: entries.length
  };
}
