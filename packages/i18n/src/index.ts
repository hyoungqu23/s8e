export type Locale = 'en' | 'ko';

export type MessageTable = Record<string, string>;

const tables: Record<Locale, MessageTable> = {
  en: {
    greeting: 'Hello'
  },
  ko: {
    greeting: '안녕하세요'
  }
};

export const t = (locale: Locale, key: string) => tables[locale]?.[key] ?? key;
