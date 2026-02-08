import { isValidBcp47, parseBcp47 } from "./locale/bcp47";
import { resolveLocale, type SupportedLocale } from "./locale/resolve";
import { formatMessage } from "./messages/format";
import type { MessageDictionary, MessageParams, MessagesByLocale } from "./messages/types";

export type Locale = SupportedLocale;
export type MessageTable = MessageDictionary;

const defaultMessages: MessagesByLocale = {
  en: {
    greeting: "Hello",
    welcome_user: "Hello, {name}"
  },
  ko: {
    greeting: "안녕하세요",
    welcome_user: "{name}님, 안녕하세요"
  }
};

export function createTranslator(messagesByLocale: MessagesByLocale, fallback: Locale = "en") {
  return (localeInput: string, key: string, params?: MessageParams) => {
    const locale = resolveLocale(localeInput, fallback);
    const template = messagesByLocale[locale]?.[key] ?? messagesByLocale[fallback]?.[key] ?? key;
    return formatMessage(template, params);
  };
}

const defaultTranslator = createTranslator(defaultMessages);

export function t(localeInput: string, key: string, params?: MessageParams) {
  return defaultTranslator(localeInput, key, params);
}

export { formatMessage, isValidBcp47, parseBcp47, resolveLocale };
export type { MessageParams, MessagesByLocale, SupportedLocale };
