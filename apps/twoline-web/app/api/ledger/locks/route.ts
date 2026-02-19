import { NextResponse } from "next/server";

import type { HouseholdRole } from "@/server/ledger/types";
import { getLedgerPostService } from "@/server/container";

import { errorResponse } from "../_lib/response";

type LockAction = "reconcile" | "unreconcile" | "close" | "reopen";

type LockPayload = {
  postedTransactionId?: string;
  action?: LockAction;
  actorRole?: HouseholdRole;
};

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as LockPayload;
    const postedTransactionId = payload.postedTransactionId?.trim();
    const action = payload.action;
    const actorRole = payload.actorRole ?? "member";

    if (!postedTransactionId || !action) {
      throw new Error("VALIDATION_INVALID_PAYLOAD");
    }

    const service = getLedgerPostService();
    const transaction =
      action === "reconcile"
        ? service.reconcilePosted(postedTransactionId)
        : action === "unreconcile"
          ? service.unreconcilePosted(postedTransactionId)
          : action === "close"
            ? service.closePosted(postedTransactionId, actorRole)
            : service.reopenPosted(postedTransactionId, actorRole);

    return NextResponse.json({
      ok: true,
      transaction
    });
  } catch (error) {
    return errorResponse(error);
  }
}
