import { LedgerErrorCode } from "../errors/codes";
import { validateBalanced } from "../postings/validate-balanced";
import type { LedgerPosting, PostedTransaction, PostingInput } from "../postings/types";
import { voidTransaction } from "./void";

type CorrectTransactionOptions = {
  idFactory?: () => string;
  chainId?: string;
  occurredAt?: string;
  memo?: string;
};

export type CorrectionResult = {
  reversal: PostedTransaction;
  correction: PostedTransaction;
};

function defaultIdFactory() {
  return crypto.randomUUID();
}

function assertCurrencyMatch(original: PostedTransaction, correctionInputs: PostingInput[]) {
  const originalCurrencies = new Set(original.postings.map((posting) => posting.currency));

  for (const input of correctionInputs) {
    if (!originalCurrencies.has(input.currency)) {
      throw new Error(LedgerErrorCode.CURRENCY_MISMATCH);
    }
  }
}

function toCorrectionPostings(
  correctionInputs: PostingInput[],
  transactionId: string,
  chainId: string,
  idFactory: () => string
): LedgerPosting[] {
  return correctionInputs.map((input) => ({
    ...input,
    id: idFactory(),
    transactionId,
    chainId,
    entryType: "CORRECTION"
  }));
}

export function correctTransaction(
  original: PostedTransaction,
  correctionInputs: PostingInput[],
  options: CorrectTransactionOptions = {}
): CorrectionResult {
  const idFactory = options.idFactory ?? defaultIdFactory;
  const chainId = options.chainId ?? original.chainId ?? original.id;

  const reversal = voidTransaction(original, {
    idFactory,
    chainId,
    occurredAt: options.occurredAt ?? original.occurredAt,
    memo: options.memo ?? original.memo
  });

  assertCurrencyMatch(original, correctionInputs);

  const validation = validateBalanced(correctionInputs);
  if (!validation.ok) {
    throw new Error(validation.errorCode);
  }

  const correctionTransactionId = idFactory();
  const correctionPostings = toCorrectionPostings(
    correctionInputs,
    correctionTransactionId,
    chainId,
    idFactory
  );

  return {
    reversal,
    correction: {
      id: correctionTransactionId,
      chainId,
      kind: "CORRECTION",
      status: "POSTED",
      occurredAt: options.occurredAt ?? original.occurredAt,
      sourceTransactionId: original.id,
      memo: options.memo ?? original.memo,
      postings: correctionPostings
    }
  };
}
