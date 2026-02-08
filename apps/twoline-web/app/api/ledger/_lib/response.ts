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

  return {
    error_code: errorCode,
    message_key: "error.unknown",
    suggested_fix: "Retry with valid input"
  };
}

export function errorResponse(error: unknown) {
  const status = error instanceof LedgerServiceError ? 409 : 400;

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
