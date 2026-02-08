"use client";

import { useEffect, useState } from "react";

import { Button } from "@s8e/ui";

import { useAppLocale } from "@/features/i18n/locale-client";
import { uiMessage } from "@/features/i18n/messages";
import type { AppLocale } from "@/features/i18n/types";
import { LEDGER_TEMPLATES } from "@/features/ledger/templates/catalog";

type RecurringRule = {
  id: string;
  templateId: string;
  amountMinor: number;
  dayOfMonth: number;
  nextRunDate: string;
  memo?: string;
};

type GeneratedInstance = {
  id: string;
  ruleId: string;
  scheduledDate: string;
  draftTransactionId: string;
  status: "DRAFT_CREATED";
};

const HOUSEHOLD_ID = "household-demo";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function RecurringWorkbench() {
  const { locale, setLocale } = useAppLocale();
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [generated, setGenerated] = useState<GeneratedInstance[]>([]);
  const [notice, setNotice] = useState("");
  const [templateId, setTemplateId] = useState(LEDGER_TEMPLATES[0]?.id ?? "");
  const [amountMinor, setAmountMinor] = useState("10000");
  const [dayOfMonth, setDayOfMonth] = useState("1");
  const [startDate, setStartDate] = useState(today());
  const [memo, setMemo] = useState("");
  const [runDate, setRunDate] = useState(today());

  const loadRules = async () => {
    const response = await fetch(`/api/recurring/rules?householdId=${HOUSEHOLD_ID}`);
    const data = (await response.json()) as { ok: boolean; rules?: RecurringRule[] };
    if (!response.ok || !data.ok || !data.rules) {
      setNotice(uiMessage(locale, "recurring.notice.loadFailed"));
      return;
    }
    setRules(data.rules);
  };

  useEffect(() => {
    void loadRules();
  }, []);

  const createRule = async () => {
    const response = await fetch("/api/recurring/rules", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        householdId: HOUSEHOLD_ID,
        templateId,
        amountMinor: Number(amountMinor),
        dayOfMonth: Number(dayOfMonth),
        startDate,
        memo,
        locale
      })
    });
    const data = (await response.json()) as { ok: boolean; error_code?: string };
    if (!response.ok || !data.ok) {
      setNotice(uiMessage(locale, "recurring.notice.runFailed", { code: data.error_code ?? "UNKNOWN" }));
      return;
    }

    setNotice(uiMessage(locale, "recurring.notice.ruleCreated"));
    await loadRules();
  };

  const runDue = async () => {
    const response = await fetch("/api/recurring/run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        targetDate: runDate
      })
    });
    const data = (await response.json()) as {
      ok: boolean;
      generated?: GeneratedInstance[];
      error_code?: string;
    };
    if (!response.ok || !data.ok || !data.generated) {
      setNotice(uiMessage(locale, "recurring.notice.runFailed", { code: data.error_code ?? "UNKNOWN" }));
      return;
    }

    setGenerated(data.generated);
    setNotice(uiMessage(locale, "recurring.notice.generated", { count: data.generated.length }));
    await loadRules();
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">{uiMessage(locale, "recurring.title")}</h1>
        <p className="text-sm text-slate-600">{notice}</p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="/" className="inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline">
            {uiMessage(locale, "common.backToTransactions")}
          </a>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "common.locale")}</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-1"
              value={locale}
              onChange={(event) => setLocale(event.target.value as AppLocale)}
            >
              <option value="ko">{uiMessage(locale, "common.lang.ko")}</option>
              <option value="en">{uiMessage(locale, "common.lang.en")}</option>
            </select>
          </label>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{uiMessage(locale, "recurring.title.createRule")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "recurring.label.template")}</span>
            <select
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {LEDGER_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name[locale]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "recurring.label.amount")}</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              type="number"
              min={1}
              value={amountMinor}
              onChange={(event) => setAmountMinor(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "recurring.label.dayOfMonth")}</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              type="number"
              min={1}
              max={28}
              value={dayOfMonth}
              onChange={(event) => setDayOfMonth(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "recurring.label.startDate")}</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="font-medium">{uiMessage(locale, "recurring.label.memo")}</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              type="text"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </label>
        </div>
        <div className="mt-3">
          <Button onClick={() => void createRule()}>{uiMessage(locale, "recurring.button.createRule")}</Button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-4 text-lg font-semibold">{uiMessage(locale, "recurring.title.run")}</h2>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "recurring.label.targetDate")}</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              type="date"
              value={runDate}
              onChange={(event) => setRunDate(event.target.value)}
            />
          </label>
          <Button onClick={() => void runDue()}>{uiMessage(locale, "recurring.button.generateDrafts")}</Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold">{uiMessage(locale, "recurring.title.rules")}</h2>
          <div className="grid gap-2 text-sm">
            {rules.length === 0 ? (
              <p className="text-slate-500">{uiMessage(locale, "recurring.status.noRules")}</p>
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium">{rule.templateId}</p>
                  <p>amount={rule.amountMinor}</p>
                  <p>day={rule.dayOfMonth}</p>
                  <p>nextRun={rule.nextRunDate}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-3 text-lg font-semibold">{uiMessage(locale, "recurring.title.generated")}</h2>
          <div className="grid gap-2 text-sm">
            {generated.length === 0 ? (
              <p className="text-slate-500">{uiMessage(locale, "recurring.status.noGenerated")}</p>
            ) : (
              generated.map((instance) => (
                <div key={instance.id} className="rounded-lg border border-slate-200 p-3">
                  <p className="font-medium">{instance.id}</p>
                  <p>rule={instance.ruleId}</p>
                  <p>scheduled={instance.scheduledDate}</p>
                  <p>draft={instance.draftTransactionId}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </main>
  );
}
