export type FlatCsvRow = {
  occurred_at: string;
  posted_at: string;
  amount: string;
  memo: string;
  counterparty: string;
  template_id: string;
  category: string;
  voided: string;
  superseded: string;
};

export const FLAT_CSV_HEADERS: Array<keyof FlatCsvRow> = [
  "occurred_at",
  "posted_at",
  "amount",
  "memo",
  "counterparty",
  "template_id",
  "category",
  "voided",
  "superseded"
];
