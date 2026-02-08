import { NextResponse } from "next/server";

import { getLedgerPostService } from "@/server/container";

import { parsePostDraftPayload } from "../_lib/payload";
import { errorResponse } from "../_lib/response";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = parsePostDraftPayload(json);
    const service = getLedgerPostService();
    const posted = service.postDraft(payload.draftTransactionId);

    return NextResponse.json({
      ok: true,
      posted: {
        id: posted.transaction.id,
        householdId: posted.transaction.householdId,
        occurredAt: posted.transaction.occurredAt,
        kind: posted.transaction.kind,
        memo: posted.transaction.memo,
        status: posted.transaction.status,
        postings: posted.postings
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
