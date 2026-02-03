export type CSVRow = Record<string, string>;

export function parse(csv: string): CSVRow[] {
  const [headerLine, ...lines] = csv.trim().split(/\r?\n/);
  const headers = headerLine.split(',');
  return lines.map((line) => {
    const values = line.split(',');
    return headers.reduce<CSVRow>((row, header, idx) => {
      row[header] = values[idx] ?? '';
      return row;
    }, {} as CSVRow);
  });
}

export function stringify(rows: CSVRow[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join(',');
  const lines = rows.map((row) => headers.map((h) => row[h] ?? '').join(','));
  return [headerLine, ...lines].join('\n');
}
