import type { PostingInput } from "@s8e/ledger-kit";
import type { AppLocale } from "@/features/i18n/types";

import { getTemplateById } from "./catalog";

export type TemplateBuildInput = {
  templateId: string;
  amountMinor: number;
  occurredAt: string;
  locale: AppLocale;
  memo?: string;
};

export function buildPostingsFromTemplate(input: TemplateBuildInput): PostingInput[] {
  const template = getTemplateById(input.templateId);
  if (!template) {
    throw new Error("TEMPLATE_NOT_FOUND");
  }

  const memo = input.memo?.trim() || template.defaultMemo[input.locale];

  return [
    {
      accountCode: template.debitAccountCode,
      direction: "DEBIT",
      amountMinor: input.amountMinor,
      currency: "KRW",
      occurredAt: input.occurredAt,
      memo
    },
    {
      accountCode: template.creditAccountCode,
      direction: "CREDIT",
      amountMinor: input.amountMinor,
      currency: "KRW",
      occurredAt: input.occurredAt,
      memo
    }
  ];
}
