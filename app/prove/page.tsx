"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  assess,
  Assessment,
  DEMO_ENTRIES,
  DEMO_PROFILE,
  EVIDENCE_LABEL,
  IncomeEntry,
  METHOD_LABEL,
  PAYER_LABEL,
  Profile,
  PURPOSE_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
} from "@/lib/risk";

const uid = () => Math.random().toString(36).slice(2, 9);
const eur = (n: number) => "€" + Math.round(n).toLocaleString("en-GB");

const blankEntry = (): IncomeEntry => ({
  id: uid(),
  type: "salary",
  amount: 0,
  frequency: "monthly",
  method: "bank_transfer",
  payer: "employer",
  evidence: "official",
});

function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Record<T, string>;
  onChange: (v: T) => void;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {(Object.keys(options) as T[]).map((k) => (
          <option key={k} value={k}>
            {options[k]}
          </option>
        ))}
      </select>
    </label>
  );
}

const toneClass = {
  green: "bg-emerald-500",
  amber: "bg-amber-400",
  orange: "bg-orange-500",
  red: "bg-red-600",
};

function riskTone(r: number) {
  return r < 25 ? "text-emerald-700 bg-emerald-50" : r < 50 ? "text-amber-700 bg-amber-50" : r < 75 ? "text-orange-700 bg-orange-50" : "text-red-700 bg-red-50";
}

export default function Prove() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<Profile>({ name: "", age: 19, status: "student", purpose: "open_account" });
  const [entries, setEntries] = useState<IncomeEntry[]>([blankEntry()]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo")) loadDemo();
  }, []);

  function loadDemo() {
    setProfile(DEMO_PROFILE);
    setEntries(DEMO_ENTRIES.map((e) => ({ ...e, id: uid() })));
    setStep(2);
  }

  const valid = entries.filter((e) => e.amount > 0);
  const result: Assessment | null = useMemo(
    () => (step === 3 ? assess(profile, valid) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [step, profile, entries]
  );

  const update = (id: string, patch: Partial<IncomeEntry>) =>
    setEntries((xs) => xs.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  async function download() {
    if (!result) return;
    setBusy(true);
    const { buildProofPdf, makeReference } = await import("@/lib/pdf");
    const doc = buildProofPdf(profile, result, makeReference());
    doc.save(`monkeypr-source-of-funds-${(profile.name || "statement").replace(/\s+/g, "-").toLowerCase()}.pdf`);
    setBusy(false);
  }

  return (
    <main className="min-h-screen pb-24">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
        <Link href="/" className="text-lg font-black tracking-tight">Monkeypr</Link>
        <button onClick={loadDemo} className="text-sm font-medium underline underline-offset-4 text-black/60 hover:text-black">
          Load demo profile
        </button>
      </nav>

      <div className="mx-auto max-w-3xl px-5">
        {/* progress */}
        <div className="mb-8 flex gap-2">
          {["About you", "Your money", "Your result"].map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i + 1 <= step ? "bg-ink" : "bg-black/10"}`} />
              <div className={`mt-2 text-xs font-medium ${i + 1 === step ? "text-black" : "text-black/40"}`}>{s}</div>
            </div>
          ))}
        </div>

        {step === 1 && (
          <section>
            <h1 className="text-3xl font-black tracking-tight">First, a bit about you</h1>
            <p className="mt-2 text-black/60">Banks compare the money you receive with who you are. Nothing leaves your device.</p>
            <div className="card mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="label">Full name (appears on your statement)</span>
                <input className="field" value={profile.name} placeholder="e.g. Alex Dupont"
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="label">Age</span>
                <input type="number" min={14} max={35} className="field" value={profile.age}
                  onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} />
              </label>
              <Select label="Situation" value={profile.status} options={STATUS_LABEL}
                onChange={(v) => setProfile({ ...profile, status: v })} />
              <div className="sm:col-span-2">
                <Select label="Why do you need to prove your funds?" value={profile.purpose} options={PURPOSE_LABEL}
                  onChange={(v) => setProfile({ ...profile, purpose: v })} />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="btn btn-dark" disabled={!profile.name.trim() || !profile.age} onClick={() => setStep(2)}>
                Continue →
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-3xl font-black tracking-tight">Where does your money come from?</h1>
            <p className="mt-2 text-black/60">Add every regular or one-off source from the last 12 months. Be honest — the score is only for you.</p>

            <div className="mt-6 space-y-4">
              {entries.map((e, i) => (
                <div key={e.id} className="card">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-bold">Source {i + 1}</span>
                    {entries.length > 1 && (
                      <button className="text-sm text-black/50 hover:text-red-600"
                        onClick={() => setEntries((xs) => xs.filter((x) => x.id !== e.id))}>Remove</button>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Select label="What is it?" value={e.type} options={TYPE_LABEL} onChange={(v) => update(e.id, { type: v })} />
                    </div>
                    <label className="block">
                      <span className="label">Amount (€)</span>
                      <input type="number" min={0} inputMode="decimal" className="field" value={e.amount || ""} placeholder="0"
                        onChange={(ev) => update(e.id, { amount: Number(ev.target.value) })} />
                    </label>
                    <Select label="How often?" value={e.frequency}
                      options={{ monthly: "Every month", one_off: "One time" }}
                      onChange={(v) => update(e.id, { frequency: v })} />
                    <Select label="How did you receive it?" value={e.method} options={METHOD_LABEL} onChange={(v) => update(e.id, { method: v })} />
                    <Select label="Who paid you?" value={e.payer} options={PAYER_LABEL} onChange={(v) => update(e.id, { payer: v })} />
                    <div className="sm:col-span-2">
                      <Select label="What proof do you have?" value={e.evidence} options={EVIDENCE_LABEL} onChange={(v) => update(e.id, { evidence: v })} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-ghost mt-4 w-full" onClick={() => setEntries((xs) => [...xs, blankEntry()])}>
              + Add another source
            </button>

            <div className="mt-6 flex justify-between">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="btn btn-dark" disabled={valid.length === 0} onClick={() => { setStep(3); window.scrollTo(0, 0); }}>
                See how a bank sees me →
              </button>
            </div>
          </section>
        )}

        {step === 3 && result && (
          <section>
            <div className="card overflow-hidden p-0">
              <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                <div className="relative h-32 w-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#0000000f" strokeWidth="3.2" />
                    <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.2" strokeLinecap="round"
                      className={result.band.tone === "green" ? "stroke-emerald-500" : result.band.tone === "amber" ? "stroke-amber-400" : result.band.tone === "orange" ? "stroke-orange-500" : "stroke-red-600"}
                      strokeDasharray={`${result.score} 100`} pathLength={100} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black">{result.score}</span>
                    <span className="text-[11px] font-medium text-black/50">risk / 100</span>
                  </div>
                </div>
                <div>
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold text-white ${toneClass[result.band.tone]}`}>
                    {result.band.label}
                  </span>
                  <h1 className="mt-2 text-2xl font-black tracking-tight">{profile.name.split(" ")[0]}, here&apos;s how a bank sees your money</h1>
                  <p className="mt-1 text-black/60">{result.band.summary}</p>
                  <p className="mt-2 text-sm text-black/50">Total declared: <b className="text-black">{eur(result.totalAnnual)}</b> per year · {result.entries.length} source{result.entries.length > 1 ? "s" : ""}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-black/10 bg-black/[0.02] p-4">
                <button className="btn btn-dark" onClick={download} disabled={busy}>
                  {busy ? "Generating…" : "↓ Download bank-ready statement (PDF)"}
                </button>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>Edit my sources</button>
              </div>
            </div>

            {result.flags.length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-black">Alerts</h2>
                <div className="mt-3 space-y-3">
                  {result.flags.map((f) => (
                    <div key={f.title}
                      className={`rounded-2xl border p-4 ${f.severity === "critical" ? "border-red-300 bg-red-50" : f.severity === "warning" ? "border-orange-200 bg-orange-50" : "border-sky-200 bg-sky-50"}`}>
                      <div className="flex items-center justify-between gap-3">
                        <b>{f.severity === "critical" ? "⛔ " : f.severity === "warning" ? "⚠️ " : "ℹ️ "}{f.title}</b>
                        <span className="text-xs font-semibold text-black/50">+{f.points} pts</span>
                      </div>
                      <p className="mt-1 text-sm text-black/70">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h2 className="text-lg font-black">Source by source</h2>
              <div className="mt-3 space-y-3">
                {result.entries.map((r) => (
                  <div key={r.entry.id} className="card">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <b>{TYPE_LABEL[r.entry.type]}</b>
                        <div className="text-sm text-black/50">
                          {eur(r.entry.amount)} {r.entry.frequency === "monthly" ? "/ month" : "one-off"} · {METHOD_LABEL[r.entry.method].split(" (")[0]} · {PAYER_LABEL[r.entry.payer].split(" (")[0]}
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${riskTone(r.risk)}`}>Risk {r.risk}</span>
                    </div>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-black/40">Why</div>
                        <ul className="mt-1 space-y-1 text-sm text-black/70">
                          {r.reasons.map((x) => <li key={x}>• {x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide text-black/40">Documents to gather</div>
                        <ul className="mt-1 space-y-1 text-sm text-black/70">
                          {r.documents.map((x) => <li key={x}>☐ {x}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-ink p-6 text-white">
              <h2 className="text-lg font-black">Learn: what nobody told you about money</h2>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {result.tips.map((t) => <li key={t}>→ {t}</li>)}
              </ul>
            </div>

            <details className="mt-6 text-sm text-black/60">
              <summary className="cursor-pointer font-semibold text-black">How is the score calculated?</summary>
              <p className="mt-2">
                Each source gets points for its type, payment method, who paid you and the proof you have (0–100). Sources are
                weighted by how much money they represent, then pattern-level alerts are added (money-mule behaviour, amounts
                just under thresholds, heavy cash use, income inconsistent with your profile). Rules are inspired by the risk
                factors banks use for AML / KYC checks. Educational tool — not legal advice.
              </p>
            </details>
          </section>
        )}
      </div>
    </main>
  );
}
