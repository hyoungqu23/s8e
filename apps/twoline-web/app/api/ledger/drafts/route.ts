import { NextResponse } from "next/server";

import { buildPostingsFromTemplate } from "@/features/ledger/templates/build-postings";
import { getTemplateById } from "@/features/ledger/templates/catalog";
import { getLedgerPostService } from "@/server/container";

import { parseCreateDraftPayload } from "../_lib/payload";
import { errorResponse } from "../_lib/response";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const payload = parseCreateDraftPayload(json);
    const template = getTemplateById(payload.templateId);
    if (!template) {
      throw new Error("TEMPLATE_NOT_FOUND");
    }

    const postings = buildPostingsFromTemplate({
      templateId: payload.templateId,
      amountMinor: payload.amountMinor,
      occurredAt: payload.occurredAt,
      locale: payload.locale,
      memo: payload.memo
    });

    const service = getLedgerPostService();
    const draft = service.createDraft({
      householdId: payload.householdId,
      occurredAt: payload.occurredAt,
      memo: payload.memo,
      postings,
      source: payload.source ?? "MANUAL"
    });

    return NextResponse.json({
      ok: true,
      draft: {
        id: draft.id,
        householdId: draft.householdId,
        templateId: payload.templateId,
        templateName: template.name[payload.locale],
        occurredAt: draft.occurredAt,
        memo: draft.memo,
        status: draft.status
      }
    });
  } catch (error) {
    return errorResponse(error);
  }
}
