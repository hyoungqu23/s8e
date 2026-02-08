import type { SupportedLocale } from "../locale/resolve";

export type MessageValue = string | number | boolean;
export type MessageParams = Record<string, MessageValue>;
export type MessageDictionary = Record<string, string>;
export type MessagesByLocale = Record<SupportedLocale, MessageDictionary>;
