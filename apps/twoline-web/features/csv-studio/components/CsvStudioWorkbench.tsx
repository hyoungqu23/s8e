"use client";

import { useState } from "react";

import { Button } from "@s8e/ui";

import { useAppLocale } from "@/features/i18n/locale-client";
import { uiMessage } from "@/features/i18n/messages";
import type { AppLocale } from "@/features/i18n/types";

const HOUSEHOLD_ID = "household-demo";

type CanonicalFile = {
  path: string;
  content: string;
};

type CsvPreviewResult = {
  sessionId: string;
  status: string;
  rows: Record<string, number>;
  errors: Array<{
    error_code: string;
    message_key: string;
    suggested_fix: string;
  }>;
  warnings: Array<{
    error_code: string;
    message_key: string;
    suggested_fix: string;
  }>;
};

type CsvAuditEvent = {
  eventId: string;
  eventType: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

function stringifyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function toCsvErrorText(locale: AppLocale, messageKey: string, fallback: string) {
  const translated = uiMessage(locale, `csv.error.message.${messageKey}`);
  return translated === `csv.error.message.${messageKey}` ? fallback : translated;
}

export function CsvStudioWorkbench() {
  const { locale, setLocale } = useAppLocale();
  const [canonicalFiles, setCanonicalFiles] = useState<CanonicalFile[]>([]);
  const [canonicalText, setCanonicalText] = useState("");
  const [flatText, setFlatText] = useState("");
  const [importText, setImportText] = useState("");
  const [preview, setPreview] = useState<CsvPreviewResult | null>(null);
  const [forceMode, setForceMode] = useState(false);
  const [auditEvents, setAuditEvents] = useState<CsvAuditEvent[]>([]);
  const [notice, setNotice] = useState("");

  const loadCanonicalExport = async () => {
    const response = await fetch(`/api/csv/export/canonical?householdId=${HOUSEHOLD_ID}`);
    const data = (await response.json()) as { ok: boolean; files?: CanonicalFile[]; error_code?: string };
    if (!response.ok || !data.ok || !data.files) {
      setNotice(
        uiMessage(locale, "csv.error.exportCanonicalFailed", {
          code: data.error_code ?? "CSV_EXPORT_CANONICAL_FAILED"
        })
      );
      return;
    }

    setCanonicalFiles(data.files);
    setCanonicalText(stringifyJson(data.files));
    setNotice(uiMessage(locale, "csv.notice.exportCanonicalLoaded"));
  };

  const loadFlatExport = async () => {
    const response = await fetch(`/api/csv/export/flat?householdId=${HOUSEHOLD_ID}&excelBom=true`);
    const data = (await response.json()) as { ok: boolean; content?: string; error_code?: string };
    if (!response.ok || !data.ok || !data.content) {
      setNotice(
        uiMessage(locale, "csv.error.exportFlatFailed", {
          code: data.error_code ?? "CSV_EXPORT_FLAT_FAILED"
        })
      );
      return;
    }

    setFlatText(data.content);
    setNotice(uiMessage(locale, "csv.notice.exportFlatLoaded"));
  };

  const previewImport = async () => {
    try {
      const parsed = JSON.parse(importText) as CanonicalFile[];
      const response = await fetch("/api/csv/import/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          householdId: HOUSEHOLD_ID,
          files: parsed,
          force: forceMode
        })
      });

      const data = (await response.json()) as CsvPreviewResult & { ok: boolean; error_code?: string };
      if (!response.ok || !data.ok) {
        setNotice(
          uiMessage(locale, "csv.error.previewFailed", {
            code: data.error_code ?? "CSV_IMPORT_PREVIEW_FAILED"
          })
        );
        return;
      }

      setPreview(data);
      setNotice(uiMessage(locale, "csv.notice.previewCompleted"));
    } catch {
      setNotice(uiMessage(locale, "csv.notice.invalidImportPayload"));
    }
  };

  const commitImport = async () => {
    if (!preview?.sessionId) {
      setNotice(uiMessage(locale, "csv.error.previewFirst"));
      return;
    }

    const response = await fetch("/api/csv/import/commit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sessionId: preview.sessionId,
        force: forceMode
      })
    });
    const data = (await response.json()) as { ok: boolean; error_code?: string };
    if (!response.ok || !data.ok) {
      setNotice(
        uiMessage(locale, "csv.error.commitFailed", {
          code: data.error_code ?? "CSV_IMPORT_COMMIT_FAILED"
        })
      );
      return;
    }

    setNotice(uiMessage(locale, "csv.notice.commitCompleted"));
  };

  const loadAuditEvents = async () => {
    const response = await fetch(`/api/csv/import/audit?householdId=${HOUSEHOLD_ID}`);
    const data = (await response.json()) as { ok: boolean; events?: CsvAuditEvent[] };
    if (!response.ok || !data.ok || !data.events) {
      setNotice(uiMessage(locale, "csv.error.auditFailed"));
      return;
    }

    setAuditEvents(data.events);
    setNotice(uiMessage(locale, "csv.notice.auditLoaded"));
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">{uiMessage(locale, "csv.title")}</h1>
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

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">{uiMessage(locale, "csv.title.export")}</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadCanonicalExport()}>{uiMessage(locale, "csv.button.loadCanonical")}</Button>
            <Button variant="secondary" onClick={() => void loadFlatExport()}>
              {uiMessage(locale, "csv.button.loadFlatBom")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImportText(stringifyJson(canonicalFiles));
                setNotice(uiMessage(locale, "csv.notice.canonicalCopied"));
              }}
            >
              {uiMessage(locale, "csv.button.useCanonicalAsImport")}
            </Button>
          </div>
          <label className="mt-4 grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "csv.label.canonicalFiles")}</span>
            <textarea
              className="min-h-48 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              value={canonicalText}
              onChange={(event) => setCanonicalText(event.target.value)}
            />
          </label>
          <label className="mt-4 grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "csv.label.flatCsv")}</span>
            <textarea
              className="min-h-40 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              value={flatText}
              onChange={(event) => setFlatText(event.target.value)}
            />
          </label>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">{uiMessage(locale, "csv.title.importPipeline")}</h2>

          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={forceMode}
              onChange={(event) => setForceMode(event.target.checked)}
            />
            {uiMessage(locale, "csv.label.forceMode")}
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">{uiMessage(locale, "csv.label.importPayload")}</span>
            <textarea
              className="min-h-48 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void previewImport()}>{uiMessage(locale, "csv.button.preview")}</Button>
            <Button variant="secondary" onClick={() => void commitImport()}>
              {uiMessage(locale, "csv.button.commit")}
            </Button>
            <Button variant="secondary" onClick={() => void loadAuditEvents()}>
              {uiMessage(locale, "csv.button.refreshAudit")}
            </Button>
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            {preview ? (
              <>
                <p>
                  {uiMessage(locale, "csv.label.session")}: <span className="font-mono">{preview.sessionId}</span>
                </p>
                <p>
                  {uiMessage(locale, "csv.label.status")}: {preview.status}
                </p>
                <p>
                  {uiMessage(locale, "csv.label.rows")}:{" "}
                  {Object.entries(preview.rows)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(", ")}
                </p>
                <div>
                  <p className="font-medium">{uiMessage(locale, "csv.label.errors")}</p>
                  {preview.errors.length === 0 ? (
                    <p className="text-slate-500">{uiMessage(locale, "csv.status.none")}</p>
                  ) : (
                    preview.errors.map((error) => (
                      <p key={`${preview.sessionId}-${error.error_code}`} className="text-rose-600">
                        {error.error_code} - {toCsvErrorText(locale, error.message_key, error.suggested_fix)}
                      </p>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-500">{uiMessage(locale, "csv.status.noPreview")}</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold">{uiMessage(locale, "csv.title.auditEvents")}</h2>
        <div className="grid gap-2">
          {auditEvents.length === 0 ? (
            <p className="text-sm text-slate-500">{uiMessage(locale, "csv.status.noAudit")}</p>
          ) : (
            auditEvents.map((event) => (
              <div key={event.eventId} className="rounded-lg border border-slate-200 p-3 text-sm">
                <p className="font-medium">{event.eventType}</p>
                <p className="text-xs text-slate-600">{event.occurredAt}</p>
                <pre className="mt-1 overflow-x-auto text-xs text-slate-700">
                  {stringifyJson(event.payload)}
                </pre>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
