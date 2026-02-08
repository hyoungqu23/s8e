import { describe, expect, it } from "vitest";

import { validateBalanced } from "@s8e/ledger-kit";

import { buildPostingsFromTemplate } from "../templates/build-postings";

describe("buildPostingsFromTemplate", () => {
  it("creates balanced postings from template config", () => {
    const postings = buildPostingsFromTemplate({
      templateId: "rent_monthly",
      amountMinor: 1_000_000,
      occurredAt: "2026-02-08",
      locale: "ko",
      memo: "2월 월세"
    });

    expect(postings).toHaveLength(2);
    expect(postings[0].direction).toBe("DEBIT");
    expect(postings[1].direction).toBe("CREDIT");

    const balance = validateBalanced(postings);
    expect(balance.ok).toBe(true);
  });

  it("throws when template id is unknown", () => {
    expect(() =>
      buildPostingsFromTemplate({
        templateId: "unknown",
        amountMinor: 1000,
        occurredAt: "2026-02-08",
        locale: "en"
      })
    ).toThrowError(/TEMPLATE_NOT_FOUND/);
  });
});
