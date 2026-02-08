import { NextResponse } from "next/server";

import { getCsvImportService } from "@/server/container";

type PreviewPayload = {
  householdId?: string;
  files?: Array<{ path: string; content: string }>;
  force?: boolean;
};

function parsePayload(payload: PreviewPayload) {
  const householdId = payload.householdId?.trim() || "household-demo";
  const files = payload.files ?? [];
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("CSV_IMPORT_MISSING_FILES");
  }
  return {
    householdId,
    files,
    force: payload.force ?? false
  };
}

export async function POST(request: Request) {
  try {
    const payload = parsePayload((await request.json()) as PreviewPayload);
    const service = getCsvImportService();
    const preview = service.previewCanonical(payload);

    return NextResponse.json({
      ok: true,
      ...preview
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "CSV_IMPORT_UNKNOWN",
        message_key: "error.csv.previewFailed",
        suggested_fix: "Check canonical files and retry preview"
      },
      { status: 400 }
    );
  }
}
