import { NextResponse } from "next/server";

import { LedgerServiceError } from "@/server/ledger/errors";

function fromCode(errorCode: string) {
  if (errorCode.includes("AMOUNT")) {
    return {
      error_code: errorCode,
      message_key: "error.invalidAmount",
      suggested_fix: "Provide a positive integer amount"
    };
  }

  if (errorCode.includes("DATE")) {
    return {
      error_code: errorCode,
      message_key: "error.invalidDate",
      suggested_fix: "Provide date in YYYY-MM-DD format"
    };
  }

  if (errorCode.includes("TEMPLATE")) {
    return {
      error_code: errorCode,
      message_key: "error.templateNotFound",
      suggested_fix: "Select an available template"
    };
  }

  if (errorCode.includes("UNBALANCED")) {
    return {
      error_code: errorCode,
      message_key: "error.unbalanced",
      suggested_fix: "Check debit/credit inputs"
    };
  }

  if (errorCode.includes("RECONCILED_LOCKED")) {
    return {
      error_code: errorCode,
      message_key: "error.reconciledLocked",
      suggested_fix: "Un-reconcile transaction before editing or deleting"
    };
  }

  if (errorCode.includes("CLOSED_LOCKED")) {
    return {
      error_code: errorCode,
      message_key: "error.closedLocked",
      suggested_fix: "Reopen period first (owner only)"
    };
  }

  if (errorCode.includes("OWNER_REQUIRED")) {
    return {
      error_code: errorCode,
      message_key: "error.ownerRequired",
      suggested_fix: "Retry with owner role"
    };
  }

  return {
    error_code: errorCode,
    message_key: "error.unknown",
    suggested_fix: "Retry with valid input"
  };
}

export function errorResponse(error: unknown) {
  const status = error instanceof LedgerServiceError ? 409 : 400;

  if (error instanceof LedgerServiceError) {
    const mapped = fromCode(error.code);
    return NextResponse.json(
      {
        ok: false,
        ...mapped
      },
      { status }
    );
  }

  if (error instanceof Error) {
    const mapped = fromCode(error.message || error.name);
    return NextResponse.json(
      {
        ok: false,
        ...mapped
      },
      { status }
    );
  }

  const fallback = fromCode("UNKNOWN_ERROR");
  return NextResponse.json(
    {
      ok: false,
      ...fallback
    },
    { status: 500 }
  );
}
