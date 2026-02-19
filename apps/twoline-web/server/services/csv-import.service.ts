import {
  isDuplicateBundleImport,
  parseCanonicalBundle,
  serializeCanonicalBundle,
  serializeFlatCsv,
  validateCanonicalBundle,
  type CanonicalBundle,
  type CanonicalBundleFile,
  type CsvValidationError,
  type FlatCsvRow
} from "@s8e/csv-kit";
import { validateBalanced, type LedgerPosting, type PostingInput, type TransactionKind } from "@s8e/ledger-kit";

import type { TransactionRecord } from "../ledger/types";
import type { PostingRepository, TransactionRepository } from "../repos/ports";

type SessionStatus = "PREVIEWED" | "BLOCKED" | "COMMITTED";

type PreviewInput = {
  householdId: string;
  files: CanonicalBundleFile[];
  force?: boolean;
};

type CommitInput = {
  sessionId: string;
  force?: boolean;
};

type CsvImportSession = {
  sessionId: string;
  householdId: string;
  createdAt: string;
  status: SessionStatus;
  bundle: CanonicalBundle;
  fingerprint: string;
  errors: CsvValidationError[];
  warnings: CsvValidationError[];
};

type CsvAuditEvent = {
  eventId: string;
  sessionId: string;
  householdId: string;
  eventType: "CSV_IMPORT_PREVIEWED" | "CSV_IMPORT_COMMITTED" | "CSV_IMPORT_FAILED";
  occurredAt: string;
  payload: Record<string, unknown>;
};

function parseAmountMinor(value: string) {
  return Number(value);
}

function inferKindFromPostings(postings: LedgerPosting[]): TransactionKind {
  const entryType = postings[0]?.entryType ?? "ORIGINAL";
  return entryType;
}

function toPostingInputs(postings: LedgerPosting[]): PostingInput[] {
  return postings.map((posting) => ({
    accountCode: posting.accountCode,
    direction: posting.direction,
    amountMinor: posting.amountMinor,
    currency: posting.currency,
    occurredAt: posting.occurredAt,
    memo: posting.memo
  }));
}

function mapValidationToWarning(error: CsvValidationError): CsvValidationError {
  return {
    ...error,
    error_code: `${error.error_code}_WARNING`
  };
}

export class CsvImportService {
  private readonly sessions = new Map<string, CsvImportSession>();
  private readonly auditEvents: CsvAuditEvent[] = [];
  private readonly importedFingerprints = new Set<string>();
  private sequence = 1;

  constructor(
    private readonly transactionsRepo: TransactionRepository,
    private readonly postingsRepo: PostingRepository
  ) {}

  previewCanonical(input: PreviewInput) {
    const bundle = parseCanonicalBundle(input.files);
    const baseErrors = validateCanonicalBundle(bundle, { baseCurrency: "KRW" });
    const dedupe = isDuplicateBundleImport(bundle, this.importedFingerprints);
    const duplicateError: CsvValidationError[] = dedupe.isDuplicate
      ? [
          {
            error_code: "CSV_DUPLICATE_IMPORT",
            message_key: "error.csv.duplicateImport",
            suggested_fix: "Use force mode if this duplicate import is intentional"
          }
        ]
      : [];

    const errors = [...baseErrors, ...duplicateError];
    const warnings = input.force ? errors.map(mapValidationToWarning) : [];
    const sessionId = this.nextId("csv-session");
    const status: SessionStatus = errors.length > 0 ? "BLOCKED" : "PREVIEWED";

    const session: CsvImportSession = {
      sessionId,
      householdId: input.householdId,
      createdAt: new Date().toISOString(),
      status,
      bundle,
      fingerprint: dedupe.fingerprint,
      errors,
      warnings
    };
    this.sessions.set(sessionId, session);

    this.appendAuditEvent({
      sessionId,
      householdId: input.householdId,
      eventType: "CSV_IMPORT_PREVIEWED",
      payload: {
        status,
        errorCodes: errors.map((error) => error.error_code),
        warningCodes: warnings.map((warning) => warning.error_code),
        transactionCount: bundle.transactions.length,
        postingCount: bundle.postings.length
      }
    });

    return {
      sessionId,
      status,
      fingerprint: dedupe.fingerprint,
      rows: {
        accounts: bundle.accounts.length,
        transactions: bundle.transactions.length,
        postings: bundle.postings.length,
        audit_events: bundle.audit_events?.length ?? 0
      },
      errors,
      warnings
    };
  }

  commitCanonical(input: CommitInput) {
    const session = this.sessions.get(input.sessionId);
    if (!session) {
      throw new Error("CSV_IMPORT_SESSION_NOT_FOUND");
    }

    if (session.errors.length > 0 && !input.force) {
      throw new Error("CSV_IMPORT_BLOCKED");
    }

    const transactionSnapshot = this.transactionsRepo.snapshot();
    const postingSnapshot = this.postingsRepo.snapshot();

    try {
      this.applyBundle(session.householdId, session.bundle);
    } catch (error) {
      this.transactionsRepo.restore(transactionSnapshot);
      this.postingsRepo.restore(postingSnapshot);
      this.appendAuditEvent({
        sessionId: session.sessionId,
        householdId: session.householdId,
        eventType: "CSV_IMPORT_FAILED",
        payload: {
          reason: error instanceof Error ? error.message : "UNKNOWN_ERROR"
        }
      });
      throw error;
    }

    this.importedFingerprints.add(session.fingerprint);
    session.status = "COMMITTED";
    this.sessions.set(session.sessionId, session);

    this.appendAuditEvent({
      sessionId: session.sessionId,
      householdId: session.householdId,
      eventType: "CSV_IMPORT_COMMITTED",
      payload: {
        committedTransactions: session.bundle.transactions.length,
        committedPostings: session.bundle.postings.length
      }
    });

    return {
      sessionId: session.sessionId,
      status: session.status
    };
  }

  exportCanonical(householdId: string) {
    const postedTransactions = this.transactionsRepo
      .listAll()
      .filter((transaction) => transaction.householdId === householdId && transaction.status === "POSTED");
    const postings = postedTransactions.flatMap((transaction) =>
      this.postingsRepo.listByTransactionId(transaction.id)
    );

    const accountCodes = [...new Set(postings.map((posting) => posting.accountCode))];
    const accountIdMap = new Map<string, string>();
    for (const accountCode of accountCodes) {
      accountIdMap.set(accountCode, `acc:${accountCode}`);
    }

    const bundle: CanonicalBundle = {
      manifest: {
        version: "1.0.0",
        base_currency: "KRW",
        locale_hint: "ko"
      },
      accounts: accountCodes.map((accountCode) => ({
        id: accountIdMap.get(accountCode) ?? accountCode,
        household_id: householdId,
        code: accountCode,
        name: accountCode,
        type: accountCode.split(":")[0]?.toUpperCase() || "UNKNOWN"
      })),
      transactions: postedTransactions.map((transaction) => ({
        id: transaction.id,
        household_id: householdId,
        occurred_at: transaction.occurredAt,
        posted_at: transaction.occurredAt,
        status: transaction.status,
        memo: transaction.memo ?? ""
      })),
      postings: postings.map((posting) => ({
        id: posting.id,
        transaction_id: posting.transactionId,
        account_id: accountIdMap.get(posting.accountCode) ?? posting.accountCode,
        direction: posting.direction,
        amount_minor: String(posting.amountMinor),
        currency: posting.currency,
        entry_type: posting.entryType,
        linked_posting_id: posting.linkedPostingId ?? ""
      })),
      audit_events: this.auditEvents
        .filter((event) => event.householdId === householdId)
        .map((event) => ({
          id: event.eventId,
          transaction_id: event.sessionId,
          event_type: event.eventType,
          occurred_at: event.occurredAt
        }))
    };

    return serializeCanonicalBundle(bundle);
  }

  exportFlat(householdId: string, excelBom = false) {
    const postedTransactions = this.transactionsRepo
      .listAll()
      .filter((transaction) => transaction.householdId === householdId && transaction.status === "POSTED");

    const voidedTargets = new Set(
      postedTransactions
        .filter((transaction) => transaction.kind === "REVERSAL")
        .map((transaction) => transaction.sourceTransactionId)
        .filter((id): id is string => Boolean(id))
    );
    const correctedTargets = new Set(
      postedTransactions
        .filter((transaction) => transaction.kind === "CORRECTION")
        .map((transaction) => transaction.sourceTransactionId)
        .filter((id): id is string => Boolean(id))
    );

    const rows: FlatCsvRow[] = postedTransactions
      .filter((transaction) => transaction.kind !== "REVERSAL")
      .map((transaction) => {
        const postings = this.postingsRepo.listByTransactionId(transaction.id);
        const amount = postings
          .filter((posting) => posting.direction === "DEBIT")
          .reduce((sum, posting) => sum + posting.amountMinor, 0);
        return {
          occurred_at: transaction.occurredAt,
          posted_at: transaction.occurredAt,
          amount: String(amount),
          memo: transaction.memo ?? "",
          counterparty: "",
          template_id: "",
          category: "",
          voided: String(voidedTargets.has(transaction.id)),
          superseded: String(correctedTargets.has(transaction.id))
        };
      });

    return serializeFlatCsv(rows, { excelBom });
  }

  listAuditEvents(householdId: string) {
    return this.auditEvents.filter((event) => event.householdId === householdId);
  }

  private applyBundle(householdId: string, bundle: CanonicalBundle) {
    const txRowsById = new Map(bundle.transactions.map((row) => [row.id, row]));
    const postingsByTxId = new Map<string, LedgerPosting[]>();
    const postingTxIndex = new Map<string, string>();
    for (const posting of this.postingsRepo.listAll()) {
      postingTxIndex.set(posting.id, posting.transactionId);
    }
    for (const posting of bundle.postings) {
      postingTxIndex.set(posting.id, posting.transaction_id);
    }

    for (const posting of bundle.postings) {
      if (!txRowsById.has(posting.transaction_id)) {
        throw new Error("CSV_IMPORT_MISSING_TRANSACTION");
      }
      if (this.postingsRepo.listAll().some((existing) => existing.id === posting.id)) {
        throw new Error("CSV_IMPORT_DUPLICATE_POSTING_ID");
      }
    }

    for (const row of bundle.transactions) {
      if (this.transactionsRepo.exists(row.id)) {
        throw new Error("CSV_IMPORT_DUPLICATE_TRANSACTION_ID");
      }
    }

    for (const txRow of bundle.transactions) {
      const txPostings = bundle.postings
        .filter((postingRow) => postingRow.transaction_id === txRow.id)
        .map((postingRow) => {
          const occurredAt = txRow.occurred_at;
          const mapped: LedgerPosting = {
            id: postingRow.id,
            transactionId: postingRow.transaction_id,
            chainId: txRow.id,
            entryType: postingRow.entry_type,
            linkedPostingId: postingRow.linked_posting_id || undefined,
            accountCode: this.resolveAccountCode(bundle, postingRow.account_id),
            direction: postingRow.direction,
            amountMinor: parseAmountMinor(postingRow.amount_minor),
            currency: postingRow.currency,
            occurredAt,
            memo: txRow.memo
          };

          return mapped;
        });

      const balance = validateBalanced(toPostingInputs(txPostings));
      if (!balance.ok) {
        throw new Error("CSV_IMPORT_UNBALANCED");
      }

      postingsByTxId.set(txRow.id, txPostings);
      const transaction: TransactionRecord = {
        id: txRow.id,
        householdId,
        chainId: txRow.id,
        kind: inferKindFromPostings(txPostings),
        status: "POSTED",
        occurredAt: txRow.occurred_at,
        sourceTransactionId: this.resolveSourceTransactionId(txPostings, postingTxIndex),
        memo: txRow.memo,
        source: "CSV_IMPORT",
        lockState: "UNLOCKED"
      };

      this.transactionsRepo.create(transaction);
    }

    const allPostings = [...postingsByTxId.values()].flat();
    this.postingsRepo.insertMany(allPostings);
  }

  private resolveAccountCode(bundle: CanonicalBundle, accountId: string) {
    const account = bundle.accounts.find((row) => row.id === accountId);
    return account?.code ?? accountId;
  }

  private resolveSourceTransactionId(postings: LedgerPosting[], postingTxIndex: Map<string, string>) {
    const linkedPostingId = postings.find((posting) => Boolean(posting.linkedPostingId))?.linkedPostingId;
    if (!linkedPostingId) {
      return undefined;
    }

    return postingTxIndex.get(linkedPostingId);
  }

  private appendAuditEvent(event: Omit<CsvAuditEvent, "eventId" | "occurredAt">) {
    const auditEvent: CsvAuditEvent = {
      eventId: this.nextId("audit"),
      occurredAt: new Date().toISOString(),
      ...event
    };
    this.auditEvents.push(auditEvent);
    console.info(
      JSON.stringify({
        scope: "csv-import",
        ...auditEvent
      })
    );
  }

  private nextId(prefix: string) {
    const id = `${prefix}-${this.sequence}`;
    this.sequence += 1;
    return id;
  }
}
