import { NextResponse } from "next/server";

import type { AppLocale } from "@/features/i18n/types";
import { getRecurringService } from "@/server/container";

type UpdateRulePayload = {
  amountMinor?: number;
  dayOfMonth?: number;
  templateId?: string;
  locale?: AppLocale;
  memo?: string;
  effectiveFrom?: string;
};

export async function PATCH(request: Request, context: { params: Promise<{ ruleId: string }> }) {
  try {
    const payload = (await request.json()) as UpdateRulePayload;
    const params = await context.params;
    if (!payload.effectiveFrom) {
      throw new Error("RECURRING_RULE_MISSING_EFFECTIVE_FROM");
    }

    const service = getRecurringService();
    const rule = service.updateRule(params.ruleId, {
      amountMinor: payload.amountMinor,
      dayOfMonth: payload.dayOfMonth,
      templateId: payload.templateId,
      locale: payload.locale,
      memo: payload.memo,
      effectiveFrom: payload.effectiveFrom
    });

    return NextResponse.json({
      ok: true,
      rule
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error_code: error instanceof Error ? error.message : "RECURRING_RULE_UPDATE_FAILED",
        message_key: "error.recurring.updateFailed"
      },
      { status: 400 }
    );
  }
}
