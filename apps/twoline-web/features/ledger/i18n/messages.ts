import type { AppLocale } from "../templates/catalog";

type TextMap = Record<string, string>;

const MESSAGES: Record<AppLocale, TextMap> = {
  ko: {
    "title.main": "TwoLine 거래 입력",
    "title.form": "템플릿 기반 입력",
    "title.drafts": "DRAFT",
    "title.posted": "POSTED 목록",
    "label.locale": "언어",
    "label.template": "템플릿",
    "label.occurredAt": "거래일",
    "label.amount": "금액 (KRW)",
    "label.memo": "메모",
    "button.saveDraft": "DRAFT 저장",
    "button.saveAndPost": "저장 후 POST",
    "button.post": "POST",
    "status.emptyDrafts": "저장된 DRAFT가 없습니다.",
    "status.emptyPosted": "아직 POSTED 거래가 없습니다.",
    "success.draftSaved": "DRAFT 저장 완료",
    "success.posted": "POST 완료",
    "error.invalidAmount": "금액은 1 이상이어야 합니다. 숫자를 다시 확인하세요.",
    "error.invalidDate": "유효한 날짜를 입력하세요. 예: 2026-02-08",
    "error.templateNotFound": "선택한 템플릿을 찾을 수 없습니다. 템플릿을 다시 선택하세요.",
    "error.unbalanced": "분개 합계가 맞지 않습니다. 금액을 다시 입력하세요.",
    "error.unknown": "처리 중 오류가 발생했습니다. 입력값을 확인 후 다시 시도하세요.",
    "meta.kind.ORIGINAL": "원본",
    "meta.kind.CORRECTION": "수정",
    "meta.kind.REVERSAL": "취소"
  },
  en: {
    "title.main": "TwoLine Transaction Input",
    "title.form": "Template-driven Form",
    "title.drafts": "Drafts",
    "title.posted": "Posted Transactions",
    "label.locale": "Locale",
    "label.template": "Template",
    "label.occurredAt": "Occurred at",
    "label.amount": "Amount (KRW)",
    "label.memo": "Memo",
    "button.saveDraft": "Save Draft",
    "button.saveAndPost": "Save and Post",
    "button.post": "Post",
    "status.emptyDrafts": "No saved drafts yet.",
    "status.emptyPosted": "No posted transactions yet.",
    "success.draftSaved": "Draft saved",
    "success.posted": "Transaction posted",
    "error.invalidAmount": "Amount must be at least 1. Please enter a valid number.",
    "error.invalidDate": "Enter a valid date. Example: 2026-02-08",
    "error.templateNotFound": "Template was not found. Please select another template.",
    "error.unbalanced": "Postings are unbalanced. Please check the amount.",
    "error.unknown": "An error occurred. Check your input and try again.",
    "meta.kind.ORIGINAL": "Original",
    "meta.kind.CORRECTION": "Correction",
    "meta.kind.REVERSAL": "Reversal"
  }
};

export function message(locale: AppLocale, key: string) {
  return MESSAGES[locale][key] ?? key;
}
