import { Suspense } from "react";
import { EmailWorkshop } from "./email-workshop";

export default function WritePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-slate-500">Production</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Email corrector</h1>
        <p className="max-w-prose text-sm leading-7 text-slate-600">
          Paste the email you have to send today. You get the corrected version, the reason behind every change,
          the lesson that explains it, and the mistakes filed for review so they stop coming back.
        </p>
      </header>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-lg border border-slate-200 bg-white" />}>
        <EmailWorkshop />
      </Suspense>
    </div>
  );
}
