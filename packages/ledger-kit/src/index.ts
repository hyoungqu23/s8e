export type LedgerEntry = {
  id: string;
  debit: number;
  credit: number;
  account: string;
  description?: string;
  date: string;
};

export type Ledger = {
  entries: LedgerEntry[];
};

export function validateLedger(ledger: Ledger): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  ledger.entries.forEach((entry, index) => {
    if (entry.debit < 0 || entry.credit < 0) {
      errors.push(`Entry ${index} has negative value.`);
    }
    if (!entry.account) {
      errors.push(`Entry ${index} missing account.`);
    }
  });
  const totals = ledger.entries.reduce(
    (acc, entry) => {
      acc.debit += entry.debit;
      acc.credit += entry.credit;
      return acc;
    },
    { debit: 0, credit: 0 }
  );
  if (totals.debit !== totals.credit) {
    errors.push('Ledger is not balanced.');
  }
  return { ok: errors.length === 0, errors };
}
