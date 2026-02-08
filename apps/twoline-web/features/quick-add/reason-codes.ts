export const QuickAddReasonCode = {
  OK: "OK",
  HEURISTIC_MATCH: "HEURISTIC_MATCH",
  PARSE_NO_AMOUNT: "PARSE_NO_AMOUNT",
  PARSE_MULTIPLE_AMOUNTS: "PARSE_MULTIPLE_AMOUNTS",
  PARSE_NO_DATETIME: "PARSE_NO_DATETIME",
  PARSE_AMBIGUOUS_DATETIME: "PARSE_AMBIGUOUS_DATETIME",
  PARSE_UNSUPPORTED_FORMAT: "PARSE_UNSUPPORTED_FORMAT"
} as const;

export type QuickAddReasonCode = (typeof QuickAddReasonCode)[keyof typeof QuickAddReasonCode];

export function reasonCodeGuide(reasonCode: QuickAddReasonCode, locale: "ko" | "en" = "ko") {
  if (locale === "en") {
    switch (reasonCode) {
      case QuickAddReasonCode.PARSE_NO_AMOUNT:
        return "Include one amount value (e.g. KRW 12,900) and try again.";
      case QuickAddReasonCode.PARSE_MULTIPLE_AMOUNTS:
        return "Multiple amounts detected. Keep only the actual payment amount.";
      case QuickAddReasonCode.PARSE_NO_DATETIME:
        return "Include a date (e.g. 2026-02-08) in the pasted text.";
      case QuickAddReasonCode.PARSE_AMBIGUOUS_DATETIME:
        return "Multiple dates detected. Keep only one target transaction date.";
      case QuickAddReasonCode.PARSE_UNSUPPORTED_FORMAT:
        return "Unsupported format. Paste raw bank/card notification text.";
      default:
        return "Review fields manually before saving.";
    }
  }

  switch (reasonCode) {
    case QuickAddReasonCode.PARSE_NO_AMOUNT:
      return "금액 숫자(예: 12,900원)를 포함해 다시 붙여넣으세요.";
    case QuickAddReasonCode.PARSE_MULTIPLE_AMOUNTS:
      return "여러 금액이 감지되었습니다. 실제 결제 금액만 남겨주세요.";
    case QuickAddReasonCode.PARSE_NO_DATETIME:
      return "날짜(예: 2026-02-08)를 포함한 메시지를 붙여넣으세요.";
    case QuickAddReasonCode.PARSE_AMBIGUOUS_DATETIME:
      return "날짜가 여러 개입니다. 원하는 거래일 하나만 남겨주세요.";
    case QuickAddReasonCode.PARSE_UNSUPPORTED_FORMAT:
      return "지원되지 않는 포맷입니다. 은행/카드 알림 원문을 그대로 붙여넣어 주세요.";
    default:
      return "필드를 직접 확인 후 저장하세요.";
  }
}
