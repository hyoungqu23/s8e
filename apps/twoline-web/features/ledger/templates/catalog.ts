export type AppLocale = "ko" | "en";

export type LedgerTemplate = {
  id: string;
  category: string;
  name: Record<AppLocale, string>;
  debitAccountCode: string;
  creditAccountCode: string;
  defaultMemo: Record<AppLocale, string>;
};

export const LEDGER_TEMPLATES: LedgerTemplate[] = [
  {
    id: "living_spend",
    category: "spending",
    name: {
      ko: "생활비",
      en: "Living Spend"
    },
    debitAccountCode: "expense:living",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "생활비 지출",
      en: "Living expense"
    }
  },
  {
    id: "rent_monthly",
    category: "housing",
    name: {
      ko: "월세",
      en: "Rent"
    },
    debitAccountCode: "expense:rent",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "월세 납부",
      en: "Monthly rent"
    }
  },
  {
    id: "salary",
    category: "income",
    name: {
      ko: "월급",
      en: "Salary"
    },
    debitAccountCode: "asset:cash",
    creditAccountCode: "income:salary",
    defaultMemo: {
      ko: "월급 입금",
      en: "Salary income"
    }
  }
];

export function getTemplateById(templateId: string) {
  return LEDGER_TEMPLATES.find((template) => template.id === templateId);
}
