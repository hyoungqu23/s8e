import { NextResponse } from "next/server";

import { getLedgerPostService } from "@/server/container";

import { errorResponse } from "../_lib/response";

function parseHouseholdId(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("householdId")?.trim() || "household-demo";
}

function parseIncludeVoided(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("includeVoided") === "true";
}

export async function GET(request: Request) {
  try {
    const householdId = parseHouseholdId(request);
    const includeVoided = parseIncludeVoided(request);
    const service = getLedgerPostService();
    const posted = service.listPostedTransactions(householdId, { includeVoided });

    return NextResponse.json({
      ok: true,
      transactions: posted
    });
  } catch (error) {
    return errorResponse(error);
  }
}
