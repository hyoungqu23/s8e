import { describe, expect, it } from "vitest";

import {
  createTranslator,
  formatMessage,
  isValidBcp47,
  parseBcp47,
  resolveLocale,
  t
} from "../index";

describe("bcp47 + locale resolve", () => {
  it("parses valid bcp47 tags", () => {
    expect(parseBcp47("ko-KR")).toEqual({ language: "ko", region: "KR" });
    expect(parseBcp47("en-US")).toEqual({ language: "en", region: "US" });
    expect(isValidBcp47("ko")).toBe(true);
  });

  it("rejects invalid tags", () => {
    expect(parseBcp47("123")).toBeNull();
    expect(isValidBcp47("KOREAN")).toBe(false);
  });

  it("resolves locale with fallback", () => {
    expect(resolveLocale("ko-KR, en-US;q=0.8", "en")).toBe("ko");
    expect(resolveLocale("fr-FR", "en")).toBe("en");
    expect(resolveLocale(undefined, "ko")).toBe("ko");
  });
});

describe("message formatting", () => {
  it("formats placeholders", () => {
    expect(formatMessage("Hello, {name}", { name: "Min" })).toBe("Hello, Min");
    expect(formatMessage("{count} items", { count: 3 })).toBe("3 items");
  });

  it("supports default translator", () => {
    expect(t("ko-KR", "welcome_user", { name: "현민" })).toBe("현민님, 안녕하세요");
    expect(t("en-US", "welcome_user", { name: "Min" })).toBe("Hello, Min");
  });

  it("supports custom translator maps", () => {
    const custom = createTranslator(
      {
        ko: { title: "대시보드" },
        en: { title: "Dashboard" }
      },
      "en"
    );
    expect(custom("ko-KR", "title")).toBe("대시보드");
    expect(custom("fr-FR", "title")).toBe("Dashboard");
  });
});
