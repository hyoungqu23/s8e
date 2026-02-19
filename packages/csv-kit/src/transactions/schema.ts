export const CSVHeader = ["계정명", "날짜", "내용", "금액", "카테고리"] as const;

export type CSVField = (typeof CSVHeader)[number] | "헤더";

export type RawTransactionRow = {
  accountName: string;
  date: string;
  description: string;
  amount: string;
  category?: string | null;
};

export type ParsedTransactionRow = {
  accountName: string;
  date: string;
  description: string;
  amount: number;
  category?: string | null;
};

export type CSVRowError = {
  row: number;
  field: CSVField;
  code: string;
  message: string;
};
