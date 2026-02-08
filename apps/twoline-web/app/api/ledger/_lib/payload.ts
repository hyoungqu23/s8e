import type { AppLocale } from "@/features/ledger/templates/catalog";
import type { TransactionSource } from "@/server/ledger/types";

export type CreateDraftPayload = {
  householdId: string;
  templateId: string;
  occurredAt: string;
  amountMinor: number;
  memo?: string;
  locale: AppLocale;
  source?: TransactionSource;
};

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseCreateDraftPayload(value: unknown): CreateDraftPayload {
  if (!value || typeof value !== "object") {
    throw new Error("VALIDATION_INVALID_PAYLOAD");
  }

  const payload = value as Partial<CreateDraftPayload>;
  const householdId = payload.householdId?.trim();
  const templateId = payload.templateId?.trim();
  const occurredAt = payload.occurredAt?.trim();
  const amountMinor = Number(payload.amountMinor);
  const memo = payload.memo?.trim();
  const locale = payload.locale;
  const source = payload.source;

  if (!householdId) {
    throw new Error("VALIDATION_MISSING_HOUSEHOLD_ID");
  }
  if (!templateId) {
    throw new Error("VALIDATION_MISSING_TEMPLATE_ID");
  }
  if (!occurredAt || !ISO_DATE_PATTERN.test(occurredAt)) {
    throw new Error("VALIDATION_INVALID_OCCURRED_AT");
  }
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    throw new Error("VALIDATION_INVALID_AMOUNT");
  }
  if (locale !== "ko" && locale !== "en") {
    throw new Error("VALIDATION_INVALID_LOCALE");
  }
  if (source && !["MANUAL", "QUICK_ADD", "RECURRING", "CSV_IMPORT"].includes(source)) {
    throw new Error("VALIDATION_INVALID_SOURCE");
  }

  return {
    householdId,
    templateId,
    occurredAt,
    amountMinor,
    memo,
    locale,
    source
  };
}

export function parsePostDraftPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    throw new Error("VALIDATION_INVALID_PAYLOAD");
  }

  const payload = value as { draftTransactionId?: string };
  const draftTransactionId = payload.draftTransactionId?.trim();
  if (!draftTransactionId) {
    throw new Error("VALIDATION_MISSING_DRAFT_ID");
  }

  return {
    draftTransactionId
  };
}
