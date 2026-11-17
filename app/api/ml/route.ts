import { NextResponse } from "next/server";

// Server-side proxy to the group's ML model hosted on PythonAnywhere.
// Called from the server to avoid CORS issues in the browser.
const ML_URL = process.env.ML_API_URL || "https://raquelpmf.pythonanywhere.com/api/predict";

export type SenderType = "company" | "crypto_exchange" | "individual" | "marketplace";

interface MlInput {
  id: string;
  transaction_amount: number;
  sender_type: SenderType;
  recurrence: number;
}

async function predictOne(t: MlInput) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(ML_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transaction_amount: t.transaction_amount,
        sender_type: t.sender_type,
        recurrence: t.recurrence,
      }),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const data = await r.json();
    if (!r.ok || typeof data.prediction !== "number") {
      return { id: t.id, ok: false as const, error: data?.error || `HTTP ${r.status}` };
    }
    return { id: t.id, ok: true as const, prediction: data.prediction as number, probability: data.probability as number };
  } catch (e) {
    return { id: t.id, ok: false as const, error: e instanceof Error ? e.message : "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  try {
    const { transactions } = (await req.json()) as { transactions: MlInput[] };
    if (!Array.isArray(transactions) || transactions.length === 0 || transactions.length > 30) {
      return NextResponse.json({ error: "Send 1–30 transactions" }, { status: 400 });
    }
    const results = await Promise.all(transactions.map(predictOne));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
