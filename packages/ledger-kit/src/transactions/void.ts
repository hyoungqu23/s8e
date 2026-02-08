import { validateBalanced } from "../postings/validate-balanced";
import type { LedgerPosting, PostedTransaction } from "../postings/types";

type VoidTransactionOptions = {
  idFactory?: () => string;
  chainId?: string;
  occurredAt?: string;
  memo?: string;
};

function flipDirection(direction: LedgerPosting["direction"]): LedgerPosting["direction"] {
  return direction === "DEBIT" ? "CREDIT" : "DEBIT";
}

function defaultIdFactory() {
  return crypto.randomUUID();
}

export function voidTransaction(
  original: PostedTransaction,
  options: VoidTransactionOptions = {}
): PostedTransaction {
  const idFactory = options.idFactory ?? defaultIdFactory;
  const reversalTransactionId = idFactory();
  const chainId = options.chainId ?? original.chainId ?? original.id;

  const reversalPostings = original.postings.map((posting) => ({
    ...posting,
    id: idFactory(),
    transactionId: reversalTransactionId,
    chainId,
    direction: flipDirection(posting.direction),
    entryType: "REVERSAL" as const,
    linkedPostingId: posting.id
  }));

  const validation = validateBalanced(reversalPostings);
  if (!validation.ok) {
    throw new Error(validation.errorCode);
  }

  return {
    id: reversalTransactionId,
    chainId,
    kind: "REVERSAL",
    status: "POSTED",
    occurredAt: options.occurredAt ?? original.occurredAt,
    sourceTransactionId: original.id,
    memo: options.memo ?? original.memo,
    postings: reversalPostings
  };
}
