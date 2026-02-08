import { NextResponse } from "next/server";

import type { AppLocale } from "@/features/ledger/templates/catalog";
import { getRecurringService } from "@/server/container";

type CreateRulePayload = {
  householdId?: string;
  templateId?: string;
  amountMinor?: number;
  dayOfMonth?: number;
  startDate?: string;
  locale?: AppLocale;
  memo?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const householdId = url.searchParams.get("householdId")?.trim() || "household-demo";
  const service = getRecurringService();
  return NextResponse.json({
    ok: true,
    rules: service.listRules(householdId)
  });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateRulePayload;
    if (!payload.templateId || !payload.startDate || !payload.amountMinor || !payload.dayOfMonth) {
      throw new Error("RECURRING_RULE_INVALID_PAYLOAD");
    }

    const service = getRecurringService();
    const rule = service.createRule({
      householdId: payload.householdId?.trim() || "household-demo",
      templateId: payload.templateId,
      amountMinor: Number(payload.amountMinor),
      dayOfMonth: Number(payload.dayOfMonth),
      startDate: payload.startDate,
      locale: payload.locale ?? "ko",
      memo: payload.memo
    });

    return NextResponse.json({
      ok: true,
      rule
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "RECURRING_RULE_CREATE_FAILED",
        message_key: "error.recurring.createFailed"
      },
      { status: 400 }
    );
  }
}
