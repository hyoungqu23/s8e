"use client";

import { useEffect, useState } from "react";

import type { AppLocale } from "./types";

const STORAGE_KEY = "twoline.locale";

function normalizeLocale(value: string | null): AppLocale | null {
  if (value === "ko" || value === "en") {
    return value;
  }
  return null;
}

function detectInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "ko";
  }

  const stored = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
  if (stored) {
    return stored;
  }

  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith("en")) {
    return "en";
  }
  return "ko";
}

export function useAppLocale() {
  const [locale, setLocale] = useState<AppLocale>("ko");

  useEffect(() => {
    setLocale(detectInitialLocale());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  return { locale, setLocale };
}
