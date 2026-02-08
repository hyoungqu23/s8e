import { NextResponse } from "next/server";

import { getCsvImportService } from "@/server/container";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const householdId = url.searchParams.get("householdId")?.trim() || "household-demo";
  const service = getCsvImportService();
  const events = service.listAuditEvents(householdId);

  return NextResponse.json({
    ok: true,
    events
  });
}
