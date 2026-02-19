"use client";

import { useMemo, useState } from "react";

import { Button } from "@s8e/ui";

import { runCSVImport, selectEntriesByPolicy, type ImportPolicy } from "../src/usecases/runCSVImport";

export function CSVImportClient() {
  const [csvInput, setCsvInput] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [policy, setPolicy] = useState<ImportPolicy>("fail_on_any_error");
  const [preview, setPreview] = useState<ReturnType<typeof runCSVImport> | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  const applyDecision = useMemo(() => {
    if (!preview) {
      return null;
    }
    return selectEntriesByPolicy(preview, policy);
  }, [policy, preview]);

  const handlePreview = () => {
    setApplyMessage(null);
    setPreview(runCSVImport(csvInput));
  };

  const handleApply = () => {
    if (!preview || !applyDecision) {
      return;
    }

    if (!applyDecision.canApply) {
      setApplyMessage(applyDecision.reason ?? "반영할 수 없습니다.");
      return;
    }

    setApplyMessage(
      `반영 완료: ${applyDecision.summary.count}건, 수입 ${applyDecision.summary.totalIncome.toLocaleString()}원, 지출 ${applyDecision.summary.totalExpense.toLocaleString()}원`
    );
  };

  const handleFileUpload = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    const text = await file.text();
    setFileName(file.name);
    setCsvInput(text);
    setApplyMessage(null);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 bg-slate-50 px-4 py-10 text-slate-900 md:px-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">TwoLine CSV Import</h1>
        <p className="text-sm text-slate-600">CSV 스키마: 계정명, 날짜, 내용, 금액, 카테고리(nullable)</p>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => {
              void handleFileUpload(e.target.files?.[0]);
            }}
            className="block w-full text-sm text-slate-700"
          />
          <Button onClick={handlePreview}>미리보기 생성</Button>
        </div>
        {fileName ? <p className="mt-2 text-xs text-slate-500">선택 파일: {fileName}</p> : null}

        <textarea
          value={csvInput}
          onChange={(e) => setCsvInput(e.target.value)}
          placeholder="계정명,날짜,내용,금액,카테고리"
          className="mt-3 min-h-52 w-full rounded-lg border border-slate-300 p-3 font-mono text-sm"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold">반영 정책</h2>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="policy"
              checked={policy === "fail_on_any_error"}
              onChange={() => setPolicy("fail_on_any_error")}
            />
            전체 실패 (오류가 1건이라도 있으면 반영 불가)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="policy"
              checked={policy === "allow_partial"}
              onChange={() => setPolicy("allow_partial")}
            />
            부분 반영 (오류 행 제외)
          </label>
        </div>
      </section>

      {preview ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">미리보기</h2>
          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
            <p>유효 행: {preview.summary.count}</p>
            <p>오류 행: {preview.errors.length}</p>
            <p>수입 합계: {preview.summary.totalIncome.toLocaleString()}원</p>
            <p>지출 합계: {preview.summary.totalExpense.toLocaleString()}원</p>
            <p className="md:col-span-2">순손익: {preview.summary.net.toLocaleString()}원</p>
          </div>

          {preview.errors.length > 0 ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3">
              <h3 className="font-medium text-rose-700">오류 목록</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-rose-700">
                {preview.errors.map((error, idx) => (
                  <li key={`${error.row}-${error.code}-${idx}`}>
                    {error.row}행 [{error.field}] {error.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <Button onClick={handleApply} disabled={Boolean(applyDecision && !applyDecision.canApply)}>
              반영 실행
            </Button>
            {applyDecision && !applyDecision.canApply ? (
              <span className="text-sm text-rose-700">{applyDecision.reason}</span>
            ) : null}
          </div>

          {applyMessage ? <p className="mt-3 text-sm text-emerald-700">{applyMessage}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
