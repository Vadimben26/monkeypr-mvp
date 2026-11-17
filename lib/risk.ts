// Monkeypr — explainable source-of-funds risk engine.
// Rule-based on purpose: every point added to the score comes with a
// plain-language reason, so a young user (and a bank) can see *why*.

export type IncomeType =
  | "salary"
  | "internship"
  | "scholarship"
  | "family_gift"
  | "resale"
  | "freelance"
  | "crypto"
  | "betting"
  | "forward_for_someone"
  | "other";

export type Method = "bank_transfer" | "payment_app" | "cheque" | "cash" | "crypto_wallet";
export type Payer = "employer" | "platform" | "institution" | "family" | "friend" | "unknown";
export type Evidence = "official" | "statement_only" | "none";
export type Frequency = "one_off" | "monthly";

export interface IncomeEntry {
  id: string;
  type: IncomeType;
  amount: number; // EUR
  frequency: Frequency;
  method: Method;
  payer: Payer;
  evidence: Evidence;
  note?: string;
}

export type Purpose = "open_account" | "large_deposit" | "rent" | "loan" | "other";
export type Status = "student" | "working_student" | "employed" | "other";

export interface Profile {
  name: string;
  age: number;
  status: Status;
  purpose: Purpose;
}

export const TYPE_LABEL: Record<IncomeType, string> = {
  salary: "Job / part-time salary",
  internship: "Internship stipend",
  scholarship: "Scholarship or grant",
  family_gift: "Gift or allowance from family",
  resale: "Selling items online (Vinted, eBay…)",
  freelance: "Freelance / side hustle",
  crypto: "Crypto or trading gains",
  betting: "Betting or gaming winnings",
  forward_for_someone: "Money I received to pass on to someone else",
  other: "Other",
};

export const METHOD_LABEL: Record<Method, string> = {
  bank_transfer: "Bank transfer",
  payment_app: "Payment app (PayPal, Lydia, Bizum, Revolut…)",
  cheque: "Cheque",
  cash: "Cash",
  crypto_wallet: "Crypto wallet",
};

export const PAYER_LABEL: Record<Payer, string> = {
  employer: "Employer",
  platform: "Platform (Vinted, Uber, Malt…)",
  institution: "School, state or official body",
  family: "Family member",
  friend: "Friend",
  unknown: "Someone I don't really know",
};

export const EVIDENCE_LABEL: Record<Evidence, string> = {
  official: "Official document (payslip, contract, invoice, platform report, gift letter)",
  statement_only: "Only my bank statement",
  none: "Nothing",
};

export const PURPOSE_LABEL: Record<Purpose, string> = {
  open_account: "Opening a bank account",
  large_deposit: "Explaining a large deposit",
  rent: "Renting a flat",
  loan: "Student loan or credit",
  other: "Other",
};

export const STATUS_LABEL: Record<Status, string> = {
  student: "Student (no job)",
  working_student: "Student with a job",
  employed: "Employed",
  other: "Other",
};

const TYPE_POINTS: Record<IncomeType, number> = {
  salary: 0,
  internship: 0,
  scholarship: 0,
  family_gift: 5,
  resale: 8,
  freelance: 8,
  crypto: 22,
  betting: 22,
  forward_for_someone: 70,
  other: 15,
};
const METHOD_POINTS: Record<Method, number> = {
  bank_transfer: 0,
  cheque: 3,
  payment_app: 5,
  cash: 18,
  crypto_wallet: 15,
};
const PAYER_POINTS: Record<Payer, number> = {
  employer: 0,
  platform: 0,
  institution: 0,
  family: 3,
  friend: 8,
  unknown: 25,
};
const EVIDENCE_POINTS: Record<Evidence, number> = {
  official: 0,
  statement_only: 10,
  none: 22,
};

export type Severity = "info" | "warning" | "critical";

export interface Flag {
  severity: Severity;
  title: string;
  detail: string;
  points: number;
}

export interface EntryResult {
  entry: IncomeEntry;
  annual: number;
  risk: number; // 0–100
  reasons: string[];
  documents: string[];
}

export interface Assessment {
  score: number; // 0–100
  band: { label: string; tone: "green" | "amber" | "orange" | "red"; summary: string };
  totalAnnual: number;
  entries: EntryResult[];
  flags: Flag[];
  tips: string[];
}

export const annualise = (e: IncomeEntry) => (e.frequency === "monthly" ? e.amount * 12 : e.amount);

function documentsFor(e: IncomeEntry): string[] {
  const d: string[] = [];
  switch (e.type) {
    case "salary":
      d.push("Employment contract", "Last 3 payslips");
      break;
    case "internship":
      d.push("Internship agreement (convenio / convention de stage)", "Stipend payslips");
      break;
    case "scholarship":
      d.push("Award letter from the institution");
      break;
    case "family_gift":
      d.push("Signed gift letter from the family member", "Transfer coming from their own bank account");
      break;
    case "resale":
      d.push("Annual sales report from the platform", "Screenshots of sold listings");
      break;
    case "freelance":
      d.push("Invoices issued", "Self-employed / freelancer registration");
      break;
    case "crypto":
      d.push("Exchange transaction history (buy & sell)", "Proof of the money originally invested");
      break;
    case "betting":
      d.push("Account statement from a licensed operator showing the win");
      break;
    case "forward_for_someone":
      d.push("Do NOT forward the money — contact your bank first");
      break;
    default:
      d.push("Any document explaining where the money came from");
  }
  if (e.method === "cash") d.push("Proof of where the cash came from before it was deposited");
  return d;
}

function scoreEntry(e: IncomeEntry): EntryResult {
  const reasons: string[] = [];
  let r = TYPE_POINTS[e.type] + METHOD_POINTS[e.method] + PAYER_POINTS[e.payer] + EVIDENCE_POINTS[e.evidence];
  if (e.type === "other") reasons.push("An unexplained source is something banks check closely");
  else if (TYPE_POINTS[e.type] >= 15) reasons.push(`${TYPE_LABEL[e.type]} is a source banks check closely`);
  if (e.method === "cash") reasons.push("Cash leaves no trail — the bank cannot see where it came from");
  if (e.method === "crypto_wallet") reasons.push("Crypto wallets need an exchange history to be traced");
  if (e.payer === "unknown") reasons.push("Money from someone you don't know is the #1 money-mule warning sign");
  if (e.payer === "friend") reasons.push("Payments from friends are hard to justify without context");
  if (e.evidence === "none") reasons.push("No document to back it up");
  if (e.evidence === "statement_only") reasons.push("A bank statement shows the money arrived, not why");
  if (e.method === "cash" && e.amount >= 1000)
    reasons.push("Cash amounts of €1,000+ often trigger questions or legal limits on cash payments");
  r = Math.min(100, r);
  if (reasons.length === 0) reasons.push("Clear, traceable and documented");
  return { entry: e, annual: annualise(e), risk: r, reasons, documents: documentsFor(e) };
}

// ---- ML model integration -------------------------------------------------
// The model (PythonAnywhere /api/predict) expects:
//   transaction_amount (float), sender_type (company | crypto_exchange | individual | marketplace),
//   recurrence (int: 1 = recurring, 0 = one-off)
// and returns { prediction: class id, probability }.
// Class meanings come from the training data — fill in ML_CLASS below.
// `risky: true` classes add points to the score.
export const ML_CLASS: Record<number, { label: string; risky: boolean }> = {
  // e.g. 2: { label: "High risk", risky: true },
};
export const mlLabel = (c: number) => ML_CLASS[c]?.label ?? `Class ${c}`;
export const mlRisky = (c: number) => ML_CLASS[c]?.risky ?? false;
export type SenderType = "company" | "crypto_exchange" | "individual" | "marketplace";

export function toSenderType(e: IncomeEntry): SenderType {
  if (e.type === "crypto" || e.method === "crypto_wallet") return "crypto_exchange";
  if (e.payer === "employer" || e.payer === "institution") return "company";
  if (e.payer === "platform") return "marketplace";
  return "individual";
}

export const SENDER_LABEL: Record<SenderType, string> = {
  company: "Company",
  crypto_exchange: "Crypto exchange",
  individual: "Individual",
  marketplace: "Marketplace",
};

export function toMlInput(e: IncomeEntry) {
  return {
    id: e.id,
    transaction_amount: e.amount,
    sender_type: toSenderType(e),
    recurrence: e.frequency === "monthly" ? 1 : 0,
  };
}

export type MlResult =
  | { id: string; ok: true; prediction: number; probability: number }
  | { id: string; ok: false; error: string };

export function assess(profile: Profile, entries: IncomeEntry[], ml?: MlResult[]): Assessment {
  const results = entries.map(scoreEntry);
  const totalAnnual = results.reduce((s, x) => s + x.annual, 0);
  const flags: Flag[] = [];
  const tips: string[] = [];

  // Amount-weighted average risk of the entries.
  const weighted =
    totalAnnual > 0 ? results.reduce((s, x) => s + x.risk * (x.annual / totalAnnual), 0) : 0;

  // 1. Money-mule pattern
  if (entries.some((e) => e.type === "forward_for_someone")) {
    flags.push({
      severity: "critical",
      title: "Possible money-mule pattern",
      detail:
        "Receiving money to pass it on for someone else is how criminals launder money through young people's accounts. Even if you keep nothing, you can lose your bank account and face prosecution. Stop, don't forward it, and talk to your bank.",
      points: 35,
    });
  }

  // 2. Structuring: several deposits just under round thresholds
  const nearThreshold = entries.filter(
    (e) => (e.amount >= 900 && e.amount < 1000) || (e.amount >= 9000 && e.amount < 10000)
  );
  if (nearThreshold.length >= 2) {
    flags.push({
      severity: "warning",
      title: "Amounts just below reporting thresholds",
      detail:
        "Several amounts sit just under €1,000 or €10,000. Banks are trained to spot this 'structuring' pattern, even when it's a coincidence. Be ready to explain each one.",
      points: 15,
    });
  }

  // 3. Cash share
  const cash = results.filter((x) => x.entry.method === "cash").reduce((s, x) => s + x.annual, 0);
  if (totalAnnual > 0 && cash / totalAnnual > 0.4) {
    flags.push({
      severity: "warning",
      title: "Most of your money is cash",
      detail: `${Math.round((cash / totalAnnual) * 100)}% of your income arrives in cash. Deposit it regularly and keep a record of where each amount came from.`,
      points: 10,
    });
  }

  // 4. Large unexplained third-party money
  const undocumentedThirdParty = results.filter(
    (x) => (x.entry.payer === "unknown" || x.entry.payer === "friend") && x.entry.evidence === "none" && x.annual >= 1000
  );
  if (undocumentedThirdParty.length) {
    flags.push({
      severity: "warning",
      title: "Undocumented money from third parties",
      detail: "At least €1,000 a year comes from people outside your family or work, with no paperwork.",
      points: 10,
    });
  }

  // 5. Profile consistency
  if (profile.status === "student" && totalAnnual > 25000) {
    flags.push({
      severity: "warning",
      title: "Income high for your profile",
      detail:
        "You told us you're a student without a job, but over €25,000 a year comes in. Banks compare money in with your profile — make sure the paperwork tells the story.",
      points: 10,
    });
  }
  if (profile.age < 18 && totalAnnual > 5000) {
    flags.push({
      severity: "info",
      title: "Under 18 with significant income",
      detail: "Minors' accounts are usually linked to a parent. Expect your bank to ask a parent or guardian to confirm the source.",
      points: 5,
    });
  }

  // 6. Big one-off
  const bigOneOff = entries.filter((e) => e.frequency === "one_off" && e.amount >= 10000);
  if (bigOneOff.length) {
    flags.push({
      severity: "info",
      title: "Large one-off amount",
      detail: "Single amounts of €10,000 or more usually trigger enhanced checks. A clear document for it matters more than anything else in your file.",
      points: 5,
    });
  }

  // 7. ML model second opinion
  const mlFlagged = (ml || []).filter((m) => m.ok && mlRisky(m.prediction));
  if (mlFlagged.length) {
    flags.push({
      severity: "warning",
      title: `ML model flagged ${mlFlagged.length} transaction${mlFlagged.length > 1 ? "s" : ""}`,
      detail:
        "Our machine-learning model, trained on transaction data, classifies these transactions as suspicious based on amount, sender type and recurrence. Check them first — they're the ones a bank's monitoring system is most likely to stop.",
      points: Math.min(20, 10 * mlFlagged.length),
    });
  }

  // Educational tips
  if (entries.some((e) => e.type === "resale"))
    tips.push(
      "Selling online: under EU rules (DAC7), platforms like Vinted report sellers with 30+ sales or €2,000+ per year to the tax authorities. Keep your sales report."
    );
  if (entries.some((e) => e.type === "family_gift"))
    tips.push("Family money: a short signed gift letter + a transfer from their account turns 'random deposit' into 'documented gift'.");
  if (entries.some((e) => e.type === "crypto"))
    tips.push("Crypto: gains are generally taxable when you sell. Download your full exchange history once a year — exchanges can close.");
  if (entries.some((e) => e.method === "cash"))
    tips.push("Cash: deposit it soon after you receive it and write down who paid you and why. A cash diary is better than nothing.");
  if (entries.some((e) => e.type === "freelance"))
    tips.push("Side hustle: once it's regular, you usually need to register (e.g. micro-entrepreneur in France, autónomo in Spain).");
  tips.push("Never lend your bank account, card or login to anyone — not even for a 'quick favour'.");

  // A single risky source shouldn't disappear behind a big clean salary:
  // blend the weighted average with the riskiest *material* source (≥ €500/yr or ≥ 10% of total).
  const material = results.filter((x) => x.annual >= 500 || (totalAnnual > 0 && x.annual / totalAnnual >= 0.1));
  const worst = material.length ? Math.max(...material.map((x) => x.risk)) : 0;
  const base = 0.6 * weighted + 0.4 * worst;

  const flagPoints = flags.reduce((s, f) => s + f.points, 0);
  const score = Math.min(100, Math.round(base + flagPoints));

  const band =
    score < 25
      ? { label: "Bank-ready", tone: "green" as const, summary: "Your money is clear and documented. Download your proof and you're good to go." }
      : score < 50
      ? { label: "Almost there", tone: "amber" as const, summary: "A few documents missing. Gather them and your file will be solid." }
      : score < 75
      ? { label: "Expect questions", tone: "orange" as const, summary: "A bank would likely ask you to explain several items. Fix the red points before you apply." }
      : { label: "High risk — act now", tone: "red" as const, summary: "This looks like what banks flag as suspicious. Read the alerts carefully before moving any money." };

  return { score, band, totalAnnual, entries: results, flags, tips };
}

export const DEMO_PROFILE: Profile = { name: "Lucía Martín", age: 19, status: "working_student", purpose: "rent" };

export const DEMO_ENTRIES: IncomeEntry[] = [
  { id: "d1", type: "salary", amount: 650, frequency: "monthly", method: "bank_transfer", payer: "employer", evidence: "official" },
  { id: "d2", type: "family_gift", amount: 3000, frequency: "one_off", method: "bank_transfer", payer: "family", evidence: "none" },
  { id: "d3", type: "resale", amount: 120, frequency: "monthly", method: "payment_app", payer: "platform", evidence: "statement_only" },
  { id: "d4", type: "other", amount: 950, frequency: "one_off", method: "cash", payer: "friend", evidence: "none" },
];
