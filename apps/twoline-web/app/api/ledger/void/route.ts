import { NextResponse } from "next/server";

import { getLedgerPostService } from "@/server/container";

import { errorResponse } from "../_lib/response";

type VoidPayload = {
  postedTransactionId?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as VoidPayload;
    const postedTransactionId = payload.postedTransactionId?.trim();
    if (!postedTransactionId) {
      throw new Error("VALIDATION_MISSING_POSTED_ID");
    }

    const service = getLedgerPostService();
    const voided = service.deletePosted(postedTransactionId);

    return NextResponse.json({
      ok: true,
      voided: {
        id: voided.transaction.id,
        kind: voided.transaction.kind,
        sourceTransactionId: voided.transaction.sourceTransactionId
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
