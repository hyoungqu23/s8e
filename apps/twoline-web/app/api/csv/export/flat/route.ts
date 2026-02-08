import { NextResponse } from "next/server";

import { getCsvImportService } from "@/server/container";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const householdId = url.searchParams.get("householdId")?.trim() || "household-demo";
    const excelBom = url.searchParams.get("excelBom") === "true";
    const service = getCsvImportService();
    const content = service.exportFlat(householdId, excelBom);

    return NextResponse.json({
      ok: true,
      content
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "CSV_EXPORT_FLAT_FAILED",
        message_key: "error.csv.exportFlatFailed"
      },
      { status: 400 }
    );
  }
}
