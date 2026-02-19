import type { AppLocale } from "@/features/i18n/types";

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
  },
  {
    id: "incentive",
    category: "income",
    name: {
      ko: "인센티브",
      en: "Incentive"
    },
    debitAccountCode: "asset:cash",
    creditAccountCode: "income:incentive",
    defaultMemo: {
      ko: "인센티브 입금",
      en: "Incentive income"
    }
  },
  {
    id: "account_transfer",
    category: "transfer",
    name: {
      ko: "계좌이체",
      en: "Account Transfer"
    },
    debitAccountCode: "asset:bank",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "계좌이체",
      en: "Account transfer"
    }
  },
  {
    id: "atm_withdrawal",
    category: "transfer",
    name: {
      ko: "ATM 인출",
      en: "ATM Withdrawal"
    },
    debitAccountCode: "asset:cash",
    creditAccountCode: "asset:bank",
    defaultMemo: {
      ko: "ATM 인출",
      en: "ATM withdrawal"
    }
  },
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
    id: "furniture",
    category: "spending",
    name: {
      ko: "가구 구매",
      en: "Furniture"
    },
    debitAccountCode: "expense:furniture",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "가구 구매",
      en: "Furniture purchase"
    }
  },
  {
    id: "utilities_water",
    category: "spending",
    name: {
      ko: "수도세",
      en: "Water Utility"
    },
    debitAccountCode: "expense:utilities_water",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "수도세 납부",
      en: "Water utility payment"
    }
  },
  {
    id: "utilities_electric",
    category: "spending",
    name: {
      ko: "전기세",
      en: "Electric Utility"
    },
    debitAccountCode: "expense:utilities_electric",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "전기세 납부",
      en: "Electric utility payment"
    }
  },
  {
    id: "fees",
    category: "spending",
    name: {
      ko: "수수료",
      en: "Fees"
    },
    debitAccountCode: "expense:fees",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "수수료 지출",
      en: "Fee expense"
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
    id: "deposit_rent",
    category: "housing",
    name: {
      ko: "보증금",
      en: "Rent Deposit"
    },
    debitAccountCode: "asset:deposit_rent",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "보증금 지급",
      en: "Rent deposit payment"
    }
  },
  {
    id: "contract_payment",
    category: "spending",
    name: {
      ko: "계약금",
      en: "Contract Payment"
    },
    debitAccountCode: "expense:contract",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "계약금 지급",
      en: "Contract payment"
    }
  },
  {
    id: "credit_card_spend",
    category: "cards",
    name: {
      ko: "신용카드 지출",
      en: "Credit Card Spend"
    },
    debitAccountCode: "expense:card",
    creditAccountCode: "liability:credit_card",
    defaultMemo: {
      ko: "신용카드 사용",
      en: "Credit card purchase"
    }
  },
  {
    id: "check_card_spend",
    category: "cards",
    name: {
      ko: "체크카드 지출",
      en: "Check Card Spend"
    },
    debitAccountCode: "expense:card",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "체크카드 사용",
      en: "Check card purchase"
    }
  },
  {
    id: "installment_spend",
    category: "cards",
    name: {
      ko: "할부 지출",
      en: "Installment Spend"
    },
    debitAccountCode: "expense:installment",
    creditAccountCode: "liability:installment",
    defaultMemo: {
      ko: "할부 구매",
      en: "Installment purchase"
    }
  },
  {
    id: "loan_from_friend",
    category: "loan",
    name: {
      ko: "지인 대출",
      en: "Loan from Friend"
    },
    debitAccountCode: "asset:cash",
    creditAccountCode: "liability:loan_friend",
    defaultMemo: {
      ko: "지인 대출",
      en: "Borrowed from friend"
    }
  },
  {
    id: "loan_repayment_lump",
    category: "loan",
    name: {
      ko: "지인 대출 상환",
      en: "Loan Repayment"
    },
    debitAccountCode: "liability:loan_friend",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "지인 대출 상환",
      en: "Loan repayment"
    }
  },
  {
    id: "stock_buy_domestic",
    category: "investment",
    name: {
      ko: "국내주식 매수",
      en: "Domestic Stock Buy"
    },
    debitAccountCode: "asset:investment_stock_domestic",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "국내주식 매수",
      en: "Domestic stock buy"
    }
  },
  {
    id: "stock_sell_domestic",
    category: "investment",
    name: {
      ko: "국내주식 매도",
      en: "Domestic Stock Sell"
    },
    debitAccountCode: "asset:cash",
    creditAccountCode: "asset:investment_stock_domestic",
    defaultMemo: {
      ko: "국내주식 매도",
      en: "Domestic stock sell"
    }
  },
  {
    id: "stock_buy_overseas_krw",
    category: "investment",
    name: {
      ko: "해외주식 매수(KRW)",
      en: "Overseas Stock Buy (KRW)"
    },
    debitAccountCode: "asset:investment_stock_overseas",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "해외주식 매수",
      en: "Overseas stock buy"
    }
  },
  {
    id: "investment_fee",
    category: "investment",
    name: {
      ko: "투자 수수료",
      en: "Investment Fee"
    },
    debitAccountCode: "expense:investment_fee",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "투자 수수료",
      en: "Investment fee"
    }
  },
  {
    id: "savings_auto_transfer",
    category: "savings",
    name: {
      ko: "적금 자동이체",
      en: "Savings Auto Transfer"
    },
    debitAccountCode: "asset:savings",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "적금 자동이체",
      en: "Savings auto transfer"
    }
  },
  {
    id: "savings_maturity",
    category: "savings",
    name: {
      ko: "적금 만기",
      en: "Savings Maturity"
    },
    debitAccountCode: "asset:cash",
    creditAccountCode: "asset:savings",
    defaultMemo: {
      ko: "적금 만기 입금",
      en: "Savings maturity payout"
    }
  },
  {
    id: "work_expense",
    category: "work",
    name: {
      ko: "업무 지출",
      en: "Work Expense"
    },
    debitAccountCode: "asset:receivable_reimbursement",
    creditAccountCode: "asset:cash",
    defaultMemo: {
      ko: "업무 관련 선지출",
      en: "Work-related expense paid"
    }
  },
  {
    id: "reimbursement_income",
    category: "work",
    name: {
      ko: "환급 입금",
      en: "Reimbursement Income"
    },
    debitAccountCode: "asset:cash",
    creditAccountCode: "asset:receivable_reimbursement",
    defaultMemo: {
      ko: "업무 지출 환급",
      en: "Work expense reimbursement"
    }
  }
];

export function getTemplateById(templateId: string) {
  return LEDGER_TEMPLATES.find((template) => template.id === templateId);
}
