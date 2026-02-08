import { NextResponse } from "next/server";

import { getRecurringService } from "@/server/container";

type RunPayload = {
  targetDate?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RunPayload;
    if (!payload.targetDate) {
      throw new Error("RECURRING_RUN_MISSING_TARGET_DATE");
    }

    const service = getRecurringService();
    const generated = service.runDue(payload.targetDate);

    return NextResponse.json({
      ok: true,
      generatedCount: generated.length,
      generated
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "RECURRING_RUN_FAILED",
        message_key: "error.recurring.runFailed"
      },
      { status: 400 }
    );
  }
}
