"use client";

import { useMemo, useState } from "react";

import { Button } from "@s8e/ui";

import { uiMessage } from "@/features/i18n/messages";
import type { AppLocale } from "@/features/i18n/types";

import { parseQuickAddText } from "./parse";
import { reasonCodeGuide } from "./reason-codes";

type QuickAddApplyInput = {
  occurredAt: string;
  amountMinor: number;
  memo: string;
  direction: "IN" | "OUT";
};

type QuickAddModalProps = {
  locale: AppLocale;
  open: boolean;
  onClose: () => void;
  onApply: (input: QuickAddApplyInput) => void;
};

export function QuickAddModal({ locale, open, onClose, onApply }: QuickAddModalProps) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<ReturnType<typeof parseQuickAddText> | null>(null);
  const [notice, setNotice] = useState("");

  const canApply = Boolean(result?.fields.amount.value && result?.fields.occurred_at.value);

  const reasonCodes = useMemo(() => {
    if (!result) {
      return [];
    }

    const allReasons = new Set([
      result.fields.amount.reason,
      result.fields.occurred_at.reason,
      result.fields.memo.reason,
      result.fields.direction.reason,
      ...result.blockingReasons
    ]);

    return [...allReasons];
  }, [result]);

  if (!open) {
    return null;
  }

  const handlePasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputText(text);
      setNotice(uiMessage(locale, "quickAdd.notice.pasteLoaded"));
    } catch {
      setNotice(uiMessage(locale, "quickAdd.notice.pasteFailed"));
    }
  };

  const handleParseClick = () => {
    const parsed = parseQuickAddText(inputText);
    setResult(parsed);
    if (parsed.blockingReasons.length > 0) {
      setNotice(uiMessage(locale, "quickAdd.notice.partial"));
    } else {
      setNotice(uiMessage(locale, "quickAdd.notice.ready"));
    }
  };

  const handleApplyClick = () => {
    if (!result?.fields.amount.value || !result.fields.occurred_at.value) {
      return;
    }

    onApply({
      occurredAt: result.fields.occurred_at.value,
      amountMinor: result.fields.amount.value,
      memo: result.fields.memo.value ?? "",
      direction: result.fields.direction.value ?? "OUT"
    });
    onClose();
    setNotice("");
    setResult(null);
    setInputText("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{uiMessage(locale, "quickAdd.title")}</h2>
          <Button variant="secondary" onClick={onClose}>
            {uiMessage(locale, "quickAdd.button.close")}
          </Button>
        </div>
        <p className="mb-3 text-sm text-slate-600">{uiMessage(locale, "quickAdd.notice.manualTrigger")}</p>
        <p className="mb-3 text-sm text-slate-700">{notice}</p>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">{uiMessage(locale, "quickAdd.label.inputText")}</span>
          <textarea
            className="min-h-40 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder={uiMessage(locale, "quickAdd.placeholder.inputText")}
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void handlePasteClick()}>
            {uiMessage(locale, "quickAdd.button.paste")}
          </Button>
          <Button onClick={handleParseClick}>{uiMessage(locale, "quickAdd.button.parse")}</Button>
          <Button variant="secondary" disabled={!canApply} onClick={handleApplyClick}>
            {uiMessage(locale, "quickAdd.button.apply")}
          </Button>
        </div>

        {result ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <p>
              {uiMessage(locale, "quickAdd.label.confidence")}:{" "}
              <span className="font-semibold">{result.overall_confidence}</span>
            </p>
            <p>
              {uiMessage(locale, "quickAdd.label.occurredAt")}: {result.fields.occurred_at.value ?? "-"}
            </p>
            <p>
              {uiMessage(locale, "quickAdd.label.amount")}: {result.fields.amount.value ?? "-"}
            </p>
            <p>
              {uiMessage(locale, "quickAdd.label.memo")}: {result.fields.memo.value ?? "-"}
            </p>
            <p>
              {uiMessage(locale, "quickAdd.label.direction")}: {result.fields.direction.value ?? "-"}
            </p>
            <div>
              <p className="font-medium">{uiMessage(locale, "quickAdd.label.reasonCodes")}</p>
              <ul className="mt-1 space-y-1">
                {reasonCodes.map((reasonCode) => (
                  <li key={reasonCode} className="text-xs text-slate-700">
                    {reasonCode}: {reasonCodeGuide(reasonCode, locale)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
