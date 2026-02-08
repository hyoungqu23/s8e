"use client";

import { useEffect, useState } from "react";

import { Button } from "@s8e/ui";

type DashboardSummary = {
  monthlySpendTrend: Array<{ month: string; amountMinor: number }>;
  categoryBreakdown: Array<{ category: string; amountMinor: number }>;
  cashflow: { incomeMinor: number; expenseMinor: number; netMinor: number };
  recurringUpcomingDrafts: Array<{
    ruleId: string;
    templateId: string;
    nextRunDate: string;
    amountMinor: number;
  }>;
  inputHealth: {
    daysTrackedLast30: number;
    quickAddRatioPct: number;
    csvImportSuccessRatePct: number | null;
  };
};

const HOUSEHOLD_ID = "household-demo";

function formatCurrency(valueMinor: number) {
  return new Intl.NumberFormat("ko-KR").format(valueMinor);
}

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

export function DashboardWorkbench() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [notice, setNotice] = useState("Loading dashboard...");

  const loadSummary = async () => {
    const response = await fetch(`/api/dashboard/summary?householdId=${HOUSEHOLD_ID}`);
    const data = (await response.json()) as {
      ok: boolean;
      summary?: DashboardSummary;
      error_code?: string;
    };

    if (!response.ok || !data.ok || !data.summary) {
      setNotice(`Failed to load dashboard: ${data.error_code ?? "UNKNOWN"}`);
      return;
    }

    setSummary(data.summary);
    setNotice("Dashboard updated");
  };

  useEffect(() => {
    void loadSummary();
  }, []);

  const spendMax = maxValue(summary?.monthlySpendTrend.map((item) => item.amountMinor) ?? []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">Dashboard</h1>
        <p className="text-sm text-slate-600">{notice}</p>
        <div className="flex gap-4">
          <a href="/" className="inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline">
            Back to Transactions
          </a>
          <Button variant="secondary" onClick={() => void loadSummary()}>
            Refresh
          </Button>
        </div>
      </header>

      {!summary ? null : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Income</p>
              <p className="text-xl font-semibold">{formatCurrency(summary.cashflow.incomeMinor)} KRW</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Expense</p>
              <p className="text-xl font-semibold">{formatCurrency(summary.cashflow.expenseMinor)} KRW</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-600">Net</p>
              <p className="text-xl font-semibold">{formatCurrency(summary.cashflow.netMinor)} KRW</p>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Monthly Spend Trend</h2>
              <div className="grid gap-2">
                {summary.monthlySpendTrend.map((item) => (
                  <div key={item.month} className="grid gap-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>{item.month}</span>
                      <span>{formatCurrency(item.amountMinor)}</span>
                    </div>
                    <div className="h-2 rounded bg-slate-100">
                      <div
                        className="h-2 rounded bg-blue-600"
                        style={{ width: `${Math.max(4, (item.amountMinor / spendMax) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Category Breakdown</h2>
              <div className="grid gap-2 text-sm">
                {summary.categoryBreakdown.length === 0 ? (
                  <p className="text-slate-500">No expense data yet.</p>
                ) : (
                  summary.categoryBreakdown.map((item) => (
                    <div key={item.category} className="flex justify-between rounded border border-slate-200 p-2">
                      <span>{item.category}</span>
                      <span>{formatCurrency(item.amountMinor)}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Recurring Upcoming Drafts</h2>
              <div className="grid gap-2 text-sm">
                {summary.recurringUpcomingDrafts.length === 0 ? (
                  <p className="text-slate-500">No recurring rules yet.</p>
                ) : (
                  summary.recurringUpcomingDrafts.map((item) => (
                    <div key={item.ruleId} className="rounded border border-slate-200 p-2">
                      <p className="font-medium">{item.templateId}</p>
                      <p>{item.nextRunDate}</p>
                      <p>{formatCurrency(item.amountMinor)} KRW</p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <h2 className="mb-3 text-lg font-semibold">Input Health</h2>
              <div className="grid gap-2 text-sm">
                <p>Days tracked (30d): {summary.inputHealth.daysTrackedLast30}</p>
                <p>Quick Add ratio: {summary.inputHealth.quickAddRatioPct}%</p>
                <p>
                  CSV import success:{" "}
                  {summary.inputHealth.csvImportSuccessRatePct === null
                    ? "-"
                    : `${summary.inputHealth.csvImportSuccessRatePct}%`}
                </p>
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  );
}
