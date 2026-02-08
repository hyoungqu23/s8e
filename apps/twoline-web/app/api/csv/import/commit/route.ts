import { NextResponse } from "next/server";

import { getCsvImportService } from "@/server/container";

type CommitPayload = {
  sessionId?: string;
  force?: boolean;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CommitPayload;
    const sessionId = payload.sessionId?.trim();
    if (!sessionId) {
      throw new Error("CSV_IMPORT_MISSING_SESSION");
    }

    const service = getCsvImportService();
    const commit = service.commitCanonical({
      sessionId,
      force: payload.force ?? false
    });

    return NextResponse.json({
      ok: true,
      ...commit
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "CSV_IMPORT_COMMIT_FAILED",
        message_key: "error.csv.commitFailed",
        suggested_fix: "Run preview first and resolve blocking errors"
      },
      { status: 409 }
    );
  }
}
