import Link from "next/link";

const steps = [
  { n: "01", t: "Tell us where your money comes from", d: "Student job, Vinted sales, money from family, crypto… in plain words, no jargon." },
  { n: "02", t: "See it through a bank's eyes", d: "Our AML risk engine scores every source and explains what a compliance officer would flag." },
  { n: "03", t: "Fix it and prove it", d: "Get the exact documents to collect and download a bank-ready source-of-funds statement." },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="text-lg font-black tracking-tight">Monkeypr</span>
        <Link href="/prove" className="btn btn-dark text-sm">Start my check</Link>
      </nav>

      <section className="mx-auto max-w-5xl px-5 pb-16 pt-10 sm:pt-20">
        <p className="mb-5 inline-block rounded-full bg-lime px-3 py-1 text-xs font-bold uppercase tracking-wider">
          RegTech for Gen Z · AML & source of funds
        </p>
        <h1 className="max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
          Your bank will ask where your money comes from. Be ready.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-black/65">
          Accounts frozen over a Vinted payout or a birthday transfer from grandma are real. Nobody teaches young people how
          anti-money-laundering checks work. Monkeypr does — in 3 minutes, and it hands you the proof.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/prove" className="btn btn-dark">Check my money →</Link>
          <Link href="/prove?demo=1" className="btn btn-ghost">Try with a demo profile</Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-20 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="card">
            <div className="text-sm font-black text-black/30">{s.n}</div>
            <h3 className="mt-2 font-bold">{s.t}</h3>
            <p className="mt-1.5 text-sm text-black/60">{s.d}</p>
          </div>
        ))}
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid max-w-5xl gap-8 px-5 py-14 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black">Why this matters for our generation</h2>
            <p className="mt-3 text-white/70">
              Money is still a taboo topic in many families, so young people open their first account, start side hustles
              and receive transfers without knowing what banks are legally required to check. Criminals exploit that gap
              by recruiting students as money mules on social media.
            </p>
          </div>
          <ul className="space-y-3 text-white/80">
            <li>✔ Explainable score — every point comes with a reason</li>
            <li>✔ Money-mule pattern detection with a clear “stop” alert</li>
            <li>✔ Personalised document checklist</li>
            <li>✔ Bank-ready PDF statement, generated on your device</li>
            <li>✔ No account needed, nothing stored on our servers</li>
          </ul>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-5 py-8 text-xs text-black/45">
        Monkeypr MVP · IE University Fintech project · Educational tool, not legal or financial advice.
      </footer>
    </main>
  );
}
