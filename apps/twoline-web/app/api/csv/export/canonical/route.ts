import { NextResponse } from "next/server";

import { getCsvImportService } from "@/server/container";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const householdId = url.searchParams.get("householdId")?.trim() || "household-demo";
    const service = getCsvImportService();
    const files = service.exportCanonical(householdId);

    return NextResponse.json({
      ok: true,
      files
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "CSV_EXPORT_CANONICAL_FAILED",
        message_key: "error.csv.exportCanonicalFailed"
      },
      { status: 400 }
    );
  }
}
