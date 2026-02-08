import { LedgerErrorCode } from "../errors/codes";
import type { PostingInput } from "./types";

export type BalancedValidationResult =
  | {
      ok: true;
      debitTotal: number;
      creditTotal: number;
    }
  | {
      ok: false;
      errorCode: string;
      debitTotal: number;
      creditTotal: number;
    };

export function validateBalanced(postings: PostingInput[]): BalancedValidationResult {
  if (postings.length === 0) {
    return {
      ok: false,
      errorCode: LedgerErrorCode.EMPTY_POSTINGS,
      debitTotal: 0,
      creditTotal: 0
    };
  }

  let debitTotal = 0;
  let creditTotal = 0;

  for (const posting of postings) {
    if (!Number.isFinite(posting.amountMinor) || posting.amountMinor <= 0) {
      return {
        ok: false,
        errorCode: LedgerErrorCode.INVALID_AMOUNT,
        debitTotal,
        creditTotal
      };
    }

    if (posting.direction === "DEBIT") {
      debitTotal += posting.amountMinor;
    } else {
      creditTotal += posting.amountMinor;
    }
  }

  if (debitTotal !== creditTotal) {
    return {
      ok: false,
      errorCode: LedgerErrorCode.UNBALANCED_POSTINGS,
      debitTotal,
      creditTotal
    };
  }

  return {
    ok: true,
    debitTotal,
    creditTotal
  };
}
