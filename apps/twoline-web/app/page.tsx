import { t } from "@s8e/i18n";
import { Button } from "@s8e/ui";

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 text-slate-900">
      <h1 className="text-3xl font-semibold">TwoLine Web</h1>
      <p>{t("en", "greeting")}</p>
      <Button>Get Started</Button>
    </main>
  );
}
