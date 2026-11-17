# Monkeypr — MVP

**RegTech for Gen Z · AML & source of funds.**
Young people get bank accounts frozen over a Vinted payout or a family transfer because nobody explains how anti-money-laundering (AML) checks work. Monkeypr shows them how a bank sees their money, tells them what to fix, and generates a bank-ready source-of-funds statement.

## User journey (working)
1. **About you**: name, age, situation, and why the user needs to prove their funds.
2. **Your money**: add each source: type, amount, frequency, payment method, payer, and the proof available.
3. **Your result**:
   - an explainable risk score from 0 to 100 with a band (Bank-ready / Almost there / Expect questions / High risk),
   - pattern alerts: money-mule behaviour, structuring just under €1k / €10k, heavy cash use, undocumented third-party money, income inconsistent with the profile,
   - a source-by-source breakdown with reasons and a document checklist,
   - educational tips (DAC7 platform reporting, gift letters, cash, crypto, never lending your account),
   - a **PDF source-of-funds statement** generated in the browser.

Try it fast with `/prove?demo=1`.

## Risk engine
`lib/risk.ts` is rule-based and fully explainable on purpose, because regulators expect AML decisions to be explainable. Each source scores points for type + method + payer + evidence. The overall score is 60% the amount-weighted average plus 40% the riskiest material source, plus points from pattern-level flags.

## Privacy
Everything runs client-side. No account and no database, and no data leaves the device.

## Stack
Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · jsPDF. Deployed on Vercel.

```bash
npm install
npm run dev   # http://localhost:3000
```

## Roadmap
- Bank-statement upload (CSV / Open Banking API) to pre-fill sources automatically
- ML anomaly model trained on synthetic transaction data, on top of the rules
- "Data access" module: see and revoke the apps that hold your financial data
- Save and share the statement with a verification link / QR
- French & Spanish versions

_Educational tool, not legal or financial advice. IE University Fintech course project._
