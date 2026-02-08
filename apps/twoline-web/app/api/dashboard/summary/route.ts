import { NextResponse } from "next/server";

import { getDashboardService } from "@/server/container";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const householdId = url.searchParams.get("householdId")?.trim() || "household-demo";
    const today = url.searchParams.get("today")?.trim();
    const service = getDashboardService();
    const summary = service.getSummary(householdId, { today: today || undefined });

    return NextResponse.json({
      ok: true,
      summary
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "DASHBOARD_SUMMARY_FAILED",
        message_key: "error.dashboard.summaryFailed"
      },
      { status: 400 }
    );
  }
}
