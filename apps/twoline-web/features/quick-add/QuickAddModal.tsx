"use client";

import { useMemo, useState } from "react";

import { Button } from "@s8e/ui";

import { parseQuickAddText } from "./parse";
import { reasonCodeGuide } from "./reason-codes";

type QuickAddApplyInput = {
  occurredAt: string;
  amountMinor: number;
  memo: string;
  direction: "IN" | "OUT";
};

type QuickAddModalProps = {
  open: boolean;
  onClose: () => void;
  onApply: (input: QuickAddApplyInput) => void;
};

export function QuickAddModal({ open, onClose, onApply }: QuickAddModalProps) {
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
      setNotice("클립보드 내용을 불러왔습니다. Parse를 눌러 분석하세요.");
    } catch {
      setNotice("클립보드 접근에 실패했습니다. 직접 붙여넣어 주세요.");
    }
  };

  const handleParseClick = () => {
    const parsed = parseQuickAddText(inputText);
    setResult(parsed);
    if (parsed.blockingReasons.length > 0) {
      setNotice("일부 필드를 자동으로 채우지 못했습니다. 안내를 확인해 주세요.");
    } else {
      setNotice("파싱 완료. Apply로 거래 입력 폼에 반영할 수 있습니다.");
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
          <h2 className="text-lg font-semibold">Quick Add</h2>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          파싱은 버튼 클릭 시에만 실행됩니다. 앱 진입 시 자동 클립보드 읽기는 하지 않습니다.
        </p>
        <p className="mb-3 text-sm text-slate-700">{notice}</p>

        <label className="grid gap-1 text-sm">
          <span className="font-medium">붙여넣을 원문</span>
          <textarea
            className="min-h-40 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder="예: 2026-02-08 스타벅스 12,900원 카드승인"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void handlePasteClick()}>
            Paste
          </Button>
          <Button onClick={handleParseClick}>Parse</Button>
          <Button variant="secondary" disabled={!canApply} onClick={handleApplyClick}>
            Apply To Form
          </Button>
        </div>

        {result ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-3 text-sm">
            <p>
              Confidence: <span className="font-semibold">{result.overall_confidence}</span>
            </p>
            <p>occurred_at: {result.fields.occurred_at.value ?? "-"}</p>
            <p>amount: {result.fields.amount.value ?? "-"}</p>
            <p>memo: {result.fields.memo.value ?? "-"}</p>
            <p>direction: {result.fields.direction.value ?? "-"}</p>
            <div>
              <p className="font-medium">Reason codes</p>
              <ul className="mt-1 space-y-1">
                {reasonCodes.map((reasonCode) => (
                  <li key={reasonCode} className="text-xs text-slate-700">
                    {reasonCode}: {reasonCodeGuide(reasonCode)}
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
