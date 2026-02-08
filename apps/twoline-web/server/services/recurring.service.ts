import { buildPostingsFromTemplate } from "../../features/ledger/templates/build-postings";
import type { AppLocale } from "../../features/i18n/types";

import { LedgerPostService } from "./ledger-post.service";

type RecurringRule = {
  id: string;
  householdId: string;
  templateId: string;
  amountMinor: number;
  dayOfMonth: number;
  locale: AppLocale;
  memo?: string;
  nextRunDate: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

type RecurringInstance = {
  id: string;
  ruleId: string;
  scheduledDate: string;
  draftTransactionId: string;
  status: "DRAFT_CREATED";
};

type CreateRuleInput = {
  householdId: string;
  templateId: string;
  amountMinor: number;
  dayOfMonth: number;
  startDate: string;
  locale: AppLocale;
  memo?: string;
};

type UpdateRuleInput = {
  amountMinor?: number;
  dayOfMonth?: number;
  templateId?: string;
  locale?: AppLocale;
  memo?: string;
  effectiveFrom: string;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getNextMonthlyDate(baseDate: string, dayOfMonth: number) {
  const date = new Date(`${baseDate}T00:00:00.000Z`);
  const next = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  next.setUTCDate(Math.max(1, Math.min(dayOfMonth, 28)));
  return isoDate(next);
}

function nextRunFrom(startDate: string, dayOfMonth: number) {
  const base = new Date(`${startDate}T00:00:00.000Z`);
  const candidate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1));
  candidate.setUTCDate(Math.max(1, Math.min(dayOfMonth, 28)));
  if (candidate < base) {
    return getNextMonthlyDate(startDate, dayOfMonth);
  }
  return isoDate(candidate);
}

export class RecurringService {
  private readonly rules = new Map<string, RecurringRule>();
  private readonly instances: RecurringInstance[] = [];
  private sequence = 1;

  constructor(private readonly ledgerPostService: LedgerPostService) {}

  createRule(input: CreateRuleInput) {
    const now = new Date().toISOString();
    const id = this.nextId("rule");
    const rule: RecurringRule = {
      id,
      householdId: input.householdId,
      templateId: input.templateId,
      amountMinor: input.amountMinor,
      dayOfMonth: input.dayOfMonth,
      locale: input.locale,
      memo: input.memo,
      nextRunDate: nextRunFrom(input.startDate, input.dayOfMonth),
      active: true,
      createdAt: now,
      updatedAt: now
    };
    this.rules.set(rule.id, rule);
    return rule;
  }

  updateRule(ruleId: string, input: UpdateRuleInput) {
    const existing = this.rules.get(ruleId);
    if (!existing) {
      throw new Error("RECURRING_RULE_NOT_FOUND");
    }

    const updated: RecurringRule = {
      ...existing,
      amountMinor: input.amountMinor ?? existing.amountMinor,
      dayOfMonth: input.dayOfMonth ?? existing.dayOfMonth,
      templateId: input.templateId ?? existing.templateId,
      locale: input.locale ?? existing.locale,
      memo: input.memo ?? existing.memo,
      nextRunDate: nextRunFrom(input.effectiveFrom, input.dayOfMonth ?? existing.dayOfMonth),
      updatedAt: new Date().toISOString()
    };

    this.rules.set(ruleId, updated);
    return updated;
  }

  listRules(householdId: string) {
    return [...this.rules.values()].filter((rule) => rule.householdId === householdId);
  }

  listInstances(ruleId?: string) {
    if (!ruleId) {
      return [...this.instances];
    }
    return this.instances.filter((instance) => instance.ruleId === ruleId);
  }

  runDue(targetDate: string) {
    const generated: RecurringInstance[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.active || rule.nextRunDate > targetDate) {
        continue;
      }

      const postings = buildPostingsFromTemplate({
        templateId: rule.templateId,
        amountMinor: rule.amountMinor,
        occurredAt: rule.nextRunDate,
        locale: rule.locale,
        memo: rule.memo
      });

      const draft = this.ledgerPostService.createDraft({
        householdId: rule.householdId,
        occurredAt: rule.nextRunDate,
        memo: rule.memo,
        postings,
        source: "RECURRING"
      });

      const instance: RecurringInstance = {
        id: this.nextId("instance"),
        ruleId: rule.id,
        scheduledDate: rule.nextRunDate,
        draftTransactionId: draft.id,
        status: "DRAFT_CREATED"
      };
      this.instances.push(instance);
      generated.push(instance);

      rule.nextRunDate = getNextMonthlyDate(rule.nextRunDate, rule.dayOfMonth);
      rule.updatedAt = new Date().toISOString();
      this.rules.set(rule.id, rule);
    }

    return generated;
  }

  private nextId(prefix: string) {
    const id = `${prefix}-${this.sequence}`;
    this.sequence += 1;
    return id;
  }
}
