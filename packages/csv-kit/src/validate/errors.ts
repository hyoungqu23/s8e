import type { CanonicalBundle } from "../formats/canonical/bundle";

export const CsvErrorCode = {
  INVALID_DATE: "CSV_INVALID_DATE",
  INVALID_AMOUNT: "CSV_INVALID_AMOUNT",
  MISSING_REQUIRED: "CSV_MISSING_REQUIRED",
  UNBALANCED_POSTINGS: "CSV_UNBALANCED_POSTINGS",
  CURRENCY_MISMATCH: "CSV_CURRENCY_MISMATCH",
  LOCKED_TRANSACTION: "CSV_LOCKED_TRANSACTION"
} as const;

export type CsvValidationError = {
  error_code: string;
  message_key: string;
  suggested_fix: string;
};

type ValidationOptions = {
  baseCurrency?: string;
  lockedTransactionIds?: Set<string>;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}/;

function makeError(
  errorCode: string,
  messageKey: string,
  suggestedFix: string
): CsvValidationError {
  return {
    error_code: errorCode,
    message_key: messageKey,
    suggested_fix: suggestedFix
  };
}

function validateDates(bundle: CanonicalBundle) {
  const errors: CsvValidationError[] = [];

  for (const transaction of bundle.transactions) {
    if (!ISO_DATE_PATTERN.test(transaction.occurred_at)) {
      errors.push(
        makeError(
          CsvErrorCode.INVALID_DATE,
          "errors.csv.invalidDate",
          `Fix occurred_at in transaction ${transaction.id}`
        )
      );
    }

    if (!ISO_DATE_PATTERN.test(transaction.posted_at)) {
      errors.push(
        makeError(
          CsvErrorCode.INVALID_DATE,
          "errors.csv.invalidDate",
          `Fix posted_at in transaction ${transaction.id}`
        )
      );
    }
  }

  return errors;
}

function validateAmounts(bundle: CanonicalBundle) {
  const errors: CsvValidationError[] = [];

  for (const posting of bundle.postings) {
    const amount = Number(posting.amount_minor);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(
        makeError(
          CsvErrorCode.INVALID_AMOUNT,
          "errors.csv.invalidAmount",
          `Fix amount_minor in posting ${posting.id}`
        )
      );
    }
  }

  return errors;
}

function validateCurrency(bundle: CanonicalBundle, baseCurrency?: string) {
  const errors: CsvValidationError[] = [];
  if (!baseCurrency) {
    return errors;
  }

  for (const posting of bundle.postings) {
    if (posting.currency !== baseCurrency) {
      errors.push(
        makeError(
          CsvErrorCode.CURRENCY_MISMATCH,
          "errors.csv.currencyMismatch",
          `Convert posting ${posting.id} currency to ${baseCurrency}`
        )
      );
    }
  }

  return errors;
}

function validateLocks(bundle: CanonicalBundle, lockedTransactionIds?: Set<string>) {
  const errors: CsvValidationError[] = [];
  if (!lockedTransactionIds || lockedTransactionIds.size === 0) {
    return errors;
  }

  for (const transaction of bundle.transactions) {
    if (lockedTransactionIds.has(transaction.id)) {
      errors.push(
        makeError(
          CsvErrorCode.LOCKED_TRANSACTION,
          "errors.csv.lockedTransaction",
          `Unlock transaction ${transaction.id} before import`
        )
      );
    }
  }

  return errors;
}

function validateBalance(bundle: CanonicalBundle) {
  const errors: CsvValidationError[] = [];
  const totalsByTransaction = new Map<string, { debit: number; credit: number }>();

  for (const posting of bundle.postings) {
    const totals = totalsByTransaction.get(posting.transaction_id) ?? { debit: 0, credit: 0 };
    const amount = Number(posting.amount_minor);

    if (posting.direction === "DEBIT") {
      totals.debit += amount;
    } else {
      totals.credit += amount;
    }

    totalsByTransaction.set(posting.transaction_id, totals);
  }

  for (const [transactionId, totals] of totalsByTransaction.entries()) {
    if (totals.debit !== totals.credit) {
      errors.push(
        makeError(
          CsvErrorCode.UNBALANCED_POSTINGS,
          "errors.csv.unbalancedPostings",
          `Adjust postings for transaction ${transactionId} so debit equals credit`
        )
      );
    }
  }

  return errors;
}

export function validateCanonicalBundle(
  bundle: CanonicalBundle,
  options?: ValidationOptions
): CsvValidationError[] {
  const errors: CsvValidationError[] = [];

  if (!bundle.manifest.version || !bundle.manifest.base_currency) {
    errors.push(
      makeError(
        CsvErrorCode.MISSING_REQUIRED,
        "errors.csv.missingRequired",
        "Set manifest.version and manifest.base_currency"
      )
    );
  }

  if (bundle.accounts.length === 0 || bundle.transactions.length === 0 || bundle.postings.length === 0) {
    errors.push(
      makeError(
        CsvErrorCode.MISSING_REQUIRED,
        "errors.csv.missingRequired",
        "Include accounts, transactions, and postings rows"
      )
    );
  }

  errors.push(...validateDates(bundle));
  errors.push(...validateAmounts(bundle));
  errors.push(...validateBalance(bundle));
  errors.push(...validateCurrency(bundle, options?.baseCurrency));
  errors.push(...validateLocks(bundle, options?.lockedTransactionIds));

  return errors;
}
