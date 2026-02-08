"use client";

import { useState } from "react";

import { Button } from "@s8e/ui";

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

export function CsvStudioWorkbench() {
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
      setNotice(`Export failed: ${data.error_code ?? "CSV_EXPORT_CANONICAL_FAILED"}`);
      return;
    }

    setCanonicalFiles(data.files);
    setCanonicalText(stringifyJson(data.files));
    setNotice("Canonical export loaded");
  };

  const loadFlatExport = async () => {
    const response = await fetch(`/api/csv/export/flat?householdId=${HOUSEHOLD_ID}&excelBom=true`);
    const data = (await response.json()) as { ok: boolean; content?: string; error_code?: string };
    if (!response.ok || !data.ok || !data.content) {
      setNotice(`Flat export failed: ${data.error_code ?? "CSV_EXPORT_FLAT_FAILED"}`);
      return;
    }

    setFlatText(data.content);
    setNotice("Flat export loaded");
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
        setNotice(`Preview failed: ${data.error_code ?? "CSV_IMPORT_PREVIEW_FAILED"}`);
        return;
      }

      setPreview(data);
      setNotice("Preview completed");
    } catch {
      setNotice("Import payload must be valid JSON array");
    }
  };

  const commitImport = async () => {
    if (!preview?.sessionId) {
      setNotice("Preview first to get a session id");
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
      setNotice(`Commit failed: ${data.error_code ?? "CSV_IMPORT_COMMIT_FAILED"}`);
      return;
    }

    setNotice("Import committed");
  };

  const loadAuditEvents = async () => {
    const response = await fetch(`/api/csv/import/audit?householdId=${HOUSEHOLD_ID}`);
    const data = (await response.json()) as { ok: boolean; events?: CsvAuditEvent[] };
    if (!response.ok || !data.ok || !data.events) {
      setNotice("Failed to load audit events");
      return;
    }

    setAuditEvents(data.events);
    setNotice("Audit events loaded");
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">CSV Studio</h1>
        <p className="text-sm text-slate-600">{notice}</p>
        <a href="/" className="inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline">
          Back to Transactions
        </a>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Export</h2>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void loadCanonicalExport()}>Load Canonical</Button>
            <Button variant="secondary" onClick={() => void loadFlatExport()}>
              Load Flat (BOM)
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setImportText(stringifyJson(canonicalFiles));
                setNotice("Canonical export copied to import payload");
              }}
            >
              Use Canonical As Import
            </Button>
          </div>
          <label className="mt-4 grid gap-1 text-sm">
            <span className="font-medium">Canonical Bundle Files (JSON)</span>
            <textarea
              className="min-h-48 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              value={canonicalText}
              onChange={(event) => setCanonicalText(event.target.value)}
            />
          </label>
          <label className="mt-4 grid gap-1 text-sm">
            <span className="font-medium">Flat CSV</span>
            <textarea
              className="min-h-40 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              value={flatText}
              onChange={(event) => setFlatText(event.target.value)}
            />
          </label>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Import Pipeline</h2>

          <label className="mb-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={forceMode}
              onChange={(event) => setForceMode(event.target.checked)}
            />
            Force mode (allows commit with preview errors)
          </label>

          <label className="grid gap-1 text-sm">
            <span className="font-medium">Import Payload (Canonical files JSON array)</span>
            <textarea
              className="min-h-48 rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void previewImport()}>Preview</Button>
            <Button variant="secondary" onClick={() => void commitImport()}>
              Commit
            </Button>
            <Button variant="secondary" onClick={() => void loadAuditEvents()}>
              Refresh Audit
            </Button>
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            {preview ? (
              <>
                <p>
                  Session: <span className="font-mono">{preview.sessionId}</span>
                </p>
                <p>Status: {preview.status}</p>
                <p>
                  Rows:{" "}
                  {Object.entries(preview.rows)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(", ")}
                </p>
                <div>
                  <p className="font-medium">Errors</p>
                  {preview.errors.length === 0 ? (
                    <p className="text-slate-500">None</p>
                  ) : (
                    preview.errors.map((error) => (
                      <p key={`${preview.sessionId}-${error.error_code}`} className="text-rose-600">
                        {error.error_code} - {error.suggested_fix}
                      </p>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-500">Run preview to see validation results.</p>
            )}
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="mb-3 text-lg font-semibold">Audit Events</h2>
        <div className="grid gap-2">
          {auditEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No audit events yet.</p>
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
