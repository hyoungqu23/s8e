import { QuickAddReasonCode, type QuickAddReasonCode as QuickAddReasonCodeType } from "./reason-codes";

type ParsedField<T> = {
  value?: T;
  confidence: number;
  reason: QuickAddReasonCodeType;
};

export type QuickAddParseResult = {
  fields: {
    occurred_at: ParsedField<string>;
    amount: ParsedField<number>;
    memo: ParsedField<string>;
    direction: ParsedField<"IN" | "OUT">;
  };
  overall_confidence: number;
  blockingReasons: QuickAddReasonCodeType[];
};

function toMinorUnit(raw: string) {
  return Number(raw.replaceAll(",", ""));
}

function extractAmounts(text: string) {
  const matches: number[] = [];
  const patterns = [
    /(\d{1,3}(?:,\d{3})+|\d+)\s*원/gi,
    /KRW\s*(\d{1,3}(?:,\d{3})+|\d+)/gi,
    /(\d{1,3}(?:,\d{3})+|\d+)\s*KRW/gi
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const parsed = toMinorUnit(match[1] ?? "0");
      if (Number.isFinite(parsed) && parsed > 0) {
        matches.push(parsed);
      }
    }
  }

  return [...new Set(matches)];
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeDate(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function extractDate(text: string): ParsedField<string> {
  const fullDateMatches = [...text.matchAll(/(\d{4})[./-](\d{1,2})[./-](\d{1,2})/g)].map((match) =>
    normalizeDate(Number(match[1]), Number(match[2]), Number(match[3]))
  );
  const uniqueFullDates = [...new Set(fullDateMatches)];
  if (uniqueFullDates.length === 1) {
    return {
      value: uniqueFullDates[0],
      confidence: 0.95,
      reason: QuickAddReasonCode.OK
    };
  }
  if (uniqueFullDates.length > 1) {
    return {
      confidence: 0.2,
      reason: QuickAddReasonCode.PARSE_AMBIGUOUS_DATETIME
    };
  }

  const shortDateMatches = [...text.matchAll(/(\d{1,2})[./-](\d{1,2})(?:\s+\d{1,2}:\d{2})?/g)].map(
    (match) => {
      const year = new Date().getUTCFullYear();
      return normalizeDate(year, Number(match[1]), Number(match[2]));
    }
  );
  const uniqueShortDates = [...new Set(shortDateMatches)];
  if (uniqueShortDates.length === 1) {
    return {
      value: uniqueShortDates[0],
      confidence: 0.7,
      reason: QuickAddReasonCode.HEURISTIC_MATCH
    };
  }
  if (uniqueShortDates.length > 1) {
    return {
      confidence: 0.2,
      reason: QuickAddReasonCode.PARSE_AMBIGUOUS_DATETIME
    };
  }

  return {
    confidence: 0.1,
    reason: QuickAddReasonCode.PARSE_NO_DATETIME
  };
}

function extractDirection(text: string): ParsedField<"IN" | "OUT"> {
  const normalized = text.toLowerCase();
  const outMatched = /(출금|결제|승인|사용|이체|debit|payment|spent)/i.test(normalized);
  const inMatched = /(입금|환불|취소|refund|deposit|credited)/i.test(normalized);

  if (inMatched && !outMatched) {
    return {
      value: "IN",
      confidence: 0.85,
      reason: QuickAddReasonCode.OK
    };
  }

  return {
    value: "OUT",
    confidence: outMatched ? 0.85 : 0.6,
    reason: outMatched ? QuickAddReasonCode.OK : QuickAddReasonCode.HEURISTIC_MATCH
  };
}

function extractMemo(text: string): ParsedField<string> {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const candidate = lines.find(
    (line) =>
      !/\d/.test(line) &&
      !/(KRW|원|출금|입금|결제|승인|사용|refund|payment|deposit|approved)/i.test(line)
  );

  if (candidate) {
    return {
      value: candidate,
      confidence: 0.75,
      reason: QuickAddReasonCode.HEURISTIC_MATCH
    };
  }

  return {
    value: lines[0] || text.slice(0, 32),
    confidence: 0.5,
    reason: QuickAddReasonCode.HEURISTIC_MATCH
  };
}

function extractAmount(text: string): ParsedField<number> {
  const amounts = extractAmounts(text);
  if (amounts.length === 1) {
    return {
      value: amounts[0],
      confidence: 0.95,
      reason: QuickAddReasonCode.OK
    };
  }
  if (amounts.length > 1) {
    return {
      confidence: 0.2,
      reason: QuickAddReasonCode.PARSE_MULTIPLE_AMOUNTS
    };
  }
  return {
    confidence: 0.1,
    reason: QuickAddReasonCode.PARSE_NO_AMOUNT
  };
}

function calculateOverallConfidence(fields: QuickAddParseResult["fields"]) {
  const values = [
    fields.occurred_at.confidence,
    fields.amount.confidence,
    fields.memo.confidence,
    fields.direction.confidence
  ];
  const score = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Number(score.toFixed(2));
}

export function parseQuickAddText(text: string): QuickAddParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      fields: {
        occurred_at: { confidence: 0.1, reason: QuickAddReasonCode.PARSE_UNSUPPORTED_FORMAT },
        amount: { confidence: 0.1, reason: QuickAddReasonCode.PARSE_NO_AMOUNT },
        memo: { confidence: 0.1, reason: QuickAddReasonCode.PARSE_UNSUPPORTED_FORMAT },
        direction: { confidence: 0.1, reason: QuickAddReasonCode.PARSE_UNSUPPORTED_FORMAT }
      },
      overall_confidence: 0.1,
      blockingReasons: [QuickAddReasonCode.PARSE_UNSUPPORTED_FORMAT]
    };
  }

  const fields: QuickAddParseResult["fields"] = {
    occurred_at: extractDate(trimmed),
    amount: extractAmount(trimmed),
    memo: extractMemo(trimmed),
    direction: extractDirection(trimmed)
  };

  const blockingReasons = new Set<QuickAddReasonCodeType>();
  if (!fields.amount.value) {
    blockingReasons.add(fields.amount.reason);
  }
  if (!fields.occurred_at.value) {
    blockingReasons.add(fields.occurred_at.reason);
  }

  return {
    fields,
    overall_confidence: calculateOverallConfidence(fields),
    blockingReasons: [...blockingReasons]
  };
}
