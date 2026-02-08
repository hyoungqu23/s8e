import type { MessageParams } from "./types";

export function formatMessage(template: string, params?: MessageParams) {
  if (!params) {
    return template;
  }

  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, key: string) => {
    const value = params[key];
    if (value === undefined) {
      return full;
    }
    return String(value);
  });
}
