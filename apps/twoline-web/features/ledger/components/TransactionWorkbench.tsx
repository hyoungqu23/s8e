"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@s8e/ui";

import { QuickAddModal } from "@/features/quick-add/QuickAddModal";

import { message } from "../i18n/messages";
import { LEDGER_TEMPLATES, type AppLocale } from "../templates/catalog";

const HOUSEHOLD_ID = "household-demo";

type DraftResponse = {
  id: string;
  householdId: string;
  templateId: string;
  templateName: string;
  occurredAt: string;
  memo?: string;
  status: "DRAFT";
};

type PostedResponse = {
  id: string;
  householdId: string;
  chainId: string;
  kind: "ORIGINAL" | "REVERSAL" | "CORRECTION";
  status: "POSTED";
  occurredAt: string;
  sourceTransactionId?: string;
  memo?: string;
};

type ApiErrorPayload = {
  message_key?: string;
  error_code?: string;
};

type FormState = {
  templateId: string;
  occurredAt: string;
  amountMinor: string;
  memo: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function readErrorMessage(response: Response, locale: AppLocale) {
  try {
    const data = (await response.json()) as ApiErrorPayload;
    if (data.message_key) {
      return message(locale, data.message_key);
    }
  } catch {
    return message(locale, "error.unknown");
  }
  return message(locale, "error.unknown");
}

function validateForm(form: FormState, locale: AppLocale): FieldErrors {
  const errors: FieldErrors = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.occurredAt)) {
    errors.occurredAt = message(locale, "error.invalidDate");
  }

  const amountMinor = Number(form.amountMinor);
  if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
    errors.amountMinor = message(locale, "error.invalidAmount");
  }

  return errors;
}

export function TransactionWorkbench() {
  const [locale, setLocale] = useState<AppLocale>("ko");
  const [form, setForm] = useState<FormState>({
    templateId: LEDGER_TEMPLATES[0]?.id ?? "",
    occurredAt: today(),
    amountMinor: "",
    memo: ""
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [drafts, setDrafts] = useState<DraftResponse[]>([]);
  const [posted, setPosted] = useState<PostedResponse[]>([]);
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPosted, setIsLoadingPosted] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isQuickAddApplied, setIsQuickAddApplied] = useState(false);

  const selectedTemplate = useMemo(
    () => LEDGER_TEMPLATES.find((template) => template.id === form.templateId),
    [form.templateId]
  );

  const loadPostedTransactions = async () => {
    setIsLoadingPosted(true);
    try {
      const response = await fetch(`/api/ledger/posted?householdId=${HOUSEHOLD_ID}`);
      if (!response.ok) {
        setNotice(await readErrorMessage(response, locale));
        return;
      }
      const data = (await response.json()) as { transactions: PostedResponse[] };
      setPosted(data.transactions);
    } finally {
      setIsLoadingPosted(false);
    }
  };

  useEffect(() => {
    void loadPostedTransactions();
  }, []);

  const createDraft = async () => {
    const errors = validateForm(form, locale);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice(message(locale, "error.unknown"));
      return null;
    }

    if (!selectedTemplate) {
      setNotice(message(locale, "error.templateNotFound"));
      return null;
    }

    const response = await fetch("/api/ledger/drafts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        householdId: HOUSEHOLD_ID,
        templateId: form.templateId,
        occurredAt: form.occurredAt,
        amountMinor: Number(form.amountMinor),
          memo: form.memo,
          locale,
          source: isQuickAddApplied ? "QUICK_ADD" : "MANUAL"
        })
      });

    if (!response.ok) {
      setNotice(await readErrorMessage(response, locale));
      return null;
    }

    const data = (await response.json()) as { draft: DraftResponse };
    setDrafts((current) => [data.draft, ...current]);
    setNotice(message(locale, "success.draftSaved"));
    setIsQuickAddApplied(false);

    return data.draft;
  };

  const postDraft = async (draftId: string) => {
    const response = await fetch("/api/ledger/post", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ draftTransactionId: draftId })
    });

    if (!response.ok) {
      setNotice(await readErrorMessage(response, locale));
      return;
    }

    setDrafts((current) => current.filter((draft) => draft.id !== draftId));
    await loadPostedTransactions();
    setNotice(message(locale, "success.posted"));
  };

  const handleSaveDraft = async () => {
    setIsSubmitting(true);
    try {
      await createDraft();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAndPost = async () => {
    setIsSubmitting(true);
    try {
      const draft = await createDraft();
      if (draft) {
        await postDraft(draft.id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold sm:text-3xl">{message(locale, "title.main")}</h1>
        <p className="text-sm text-slate-600">{notice}</p>
        <div className="flex gap-4">
          <a
            href="/dashboard"
            className="inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            Dashboard
          </a>
          <a
            href="/csv-studio"
            className="inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            CSV Studio
          </a>
          <a
            href="/recurring"
            className="inline-flex text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
          >
            Recurring
          </a>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">{message(locale, "title.form")}</h2>

          <div className="grid gap-4">
            <label className="grid gap-1 text-sm">
              <span className="font-medium">{message(locale, "label.locale")}</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2"
                value={locale}
                onChange={(event) => setLocale(event.target.value as AppLocale)}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">{message(locale, "label.template")}</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2"
                value={form.templateId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    templateId: event.target.value
                  }))
                }
              >
                {LEDGER_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name[locale]}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">{message(locale, "label.occurredAt")}</span>
              <input
                type="date"
                className="rounded-lg border border-slate-300 px-3 py-2"
                value={form.occurredAt}
                aria-describedby="occurredAt-help"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    occurredAt: event.target.value
                  }))
                }
              />
              <span id="occurredAt-help" className="text-xs text-rose-600">
                {fieldErrors.occurredAt}
              </span>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">{message(locale, "label.amount")}</span>
              <input
                type="number"
                min={1}
                step={1}
                className="rounded-lg border border-slate-300 px-3 py-2"
                value={form.amountMinor}
                aria-describedby="amount-help"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    amountMinor: event.target.value
                  }))
                }
              />
              <span id="amount-help" className="text-xs text-rose-600">
                {fieldErrors.amountMinor}
              </span>
            </label>

            <label className="grid gap-1 text-sm">
              <span className="font-medium">{message(locale, "label.memo")}</span>
              <input
                type="text"
                className="rounded-lg border border-slate-300 px-3 py-2"
                value={form.memo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    memo: event.target.value
                  }))
                }
                placeholder={selectedTemplate?.defaultMemo[locale] ?? ""}
              />
            </label>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <Button variant="secondary" onClick={() => setIsQuickAddOpen(true)}>
                Quick Add
              </Button>
              <Button disabled={isSubmitting} onClick={() => void handleSaveDraft()}>
                {message(locale, "button.saveDraft")}
              </Button>
              <Button
                disabled={isSubmitting}
                variant="secondary"
                onClick={() => void handleSaveAndPost()}
              >
                {message(locale, "button.saveAndPost")}
              </Button>
            </div>
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">{message(locale, "title.drafts")}</h2>
            <div className="grid gap-2">
              {drafts.length === 0 ? (
                <p className="text-sm text-slate-500">{message(locale, "status.emptyDrafts")}</p>
              ) : (
                drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{draft.templateName}</p>
                      <p className="truncate text-xs text-slate-600">{draft.memo || "-"}</p>
                    </div>
                    <Button
                      variant="secondary"
                      className="shrink-0"
                      onClick={() => void postDraft(draft.id)}
                    >
                      {message(locale, "button.post")}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-semibold">{message(locale, "title.posted")}</h2>
            <div className="grid gap-2">
              {isLoadingPosted ? (
                <p className="text-sm text-slate-500">Loading...</p>
              ) : posted.length === 0 ? (
                <p className="text-sm text-slate-500">{message(locale, "status.emptyPosted")}</p>
              ) : (
                posted.map((transaction) => (
                  <div key={transaction.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{transaction.memo || transaction.id}</p>
                      <span className="text-xs text-slate-600">
                        {message(locale, `meta.kind.${transaction.kind}`)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{transaction.occurredAt}</p>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>

      <QuickAddModal
        open={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onApply={(parsed) => {
          setForm((current) => ({
            ...current,
            templateId: parsed.direction === "IN" ? "salary" : current.templateId,
            occurredAt: parsed.occurredAt,
            amountMinor: String(parsed.amountMinor),
            memo: parsed.memo || current.memo
          }));
          setIsQuickAddApplied(true);
          setNotice("Quick Add 결과를 입력 폼에 반영했습니다.");
        }}
      />
    </main>
  );
}
