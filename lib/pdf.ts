import { jsPDF } from "jspdf";
import {
  Assessment,
  Profile,
  TYPE_LABEL,
  METHOD_LABEL,
  PAYER_LABEL,
  EVIDENCE_LABEL,
  PURPOSE_LABEL,
  STATUS_LABEL,
} from "./risk";

const eur = (n: number) => `EUR ${Math.round(n).toLocaleString("en-GB")}`;

export function makeReference() {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `MKP-${d}-${s}`;
}

export function buildProofPdf(profile: Profile, a: Assessment, reference: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 18;
  let y = 0;

  // Header band
  doc.setFillColor(10, 10, 10);
  doc.rect(0, 0, W, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Monkeypr", M, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Source-of-Funds Statement", M, 21);
  doc.text(`Ref. ${reference}`, W - M, 14, { align: "right" });
  doc.text(new Date().toLocaleDateString("en-GB"), W - M, 21, { align: "right" });

  doc.setTextColor(20, 20, 20);
  y = 42;

  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(label, M, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, M + 45, y);
    y += 6;
  };

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("1. Declarant", M, y);
  y += 7;
  line("Name", profile.name || "-");
  line("Age", String(profile.age));
  line("Status", STATUS_LABEL[profile.status]);
  line("Purpose", PURPOSE_LABEL[profile.purpose]);

  y += 4;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("2. Declared sources of funds", M, y);
  y += 6;

  // Table header
  const cols = [M, M + 52, M + 82, M + 117, M + 150];
  doc.setFillColor(240, 240, 240);
  doc.rect(M, y - 4, W - 2 * M, 7, "F");
  doc.setFontSize(8.5);
  ["Source", "Paid by", "Method", "Evidence", "Per year"].forEach((h, i) =>
    doc.text(h, i === 4 ? W - M - 2 : cols[i] + 1, y, { align: i === 4 ? "right" : "left" })
  );
  y += 7;
  doc.setFont("helvetica", "normal");

  a.entries.forEach((r) => {
    const cells = [
      doc.splitTextToSize(TYPE_LABEL[r.entry.type], 50),
      doc.splitTextToSize(PAYER_LABEL[r.entry.payer], 28),
      doc.splitTextToSize(METHOD_LABEL[r.entry.method].split(" (")[0], 33),
      doc.splitTextToSize(EVIDENCE_LABEL[r.entry.evidence].split(" (")[0], 31),
    ];
    const h = Math.max(...cells.map((c) => c.length)) * 4 + 2;
    if (y + h > 270) {
      doc.addPage();
      y = 20;
    }
    cells.forEach((c, i) => doc.text(c, cols[i] + 1, y));
    doc.text(
      eur(r.annual) + (r.entry.frequency === "monthly" ? "*" : ""),
      W - M - 2,
      y,
      { align: "right" }
    );
    y += h;
    doc.setDrawColor(225, 225, 225);
    doc.line(M, y - 3, W - M, y - 3);
  });

  doc.setFont("helvetica", "bold");
  doc.text("Total declared per year", M + 1, y + 1);
  doc.text(eur(a.totalAnnual), W - M - 2, y + 1, { align: "right" });
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.text("* recurring monthly amount x 12", M + 1, y);
  y += 9;

  // Readiness
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("3. Documentation checklist", M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const docs = Array.from(new Set(a.entries.flatMap((r) => r.documents)));
  docs.forEach((d) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.rect(M + 1, y - 3, 3, 3);
    doc.text(doc.splitTextToSize(d, W - 2 * M - 10), M + 7, y);
    y += 6;
  });

  y += 3;
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("4. Declaration", M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const decl = doc.splitTextToSize(
    `I, ${profile.name || "the undersigned"}, declare that the information above is true and complete, that the funds described come from the lawful sources listed, and that no funds held in my accounts belong to or are being transferred on behalf of a third party.`,
    W - 2 * M
  );
  doc.text(decl, M, y);
  y += decl.length * 4.5 + 10;
  doc.line(M, y, M + 70, y);
  doc.line(W - M - 50, y, W - M, y);
  doc.setFontSize(8);
  doc.text("Signature", M, y + 4);
  doc.text("Date", W - M - 50, y + 4);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    doc.splitTextToSize(
      "Self-declared statement generated with Monkeypr (MVP). It organises the declarant's information for a bank or landlord; it is not a certification and does not replace the supporting documents listed above.",
      W - 2 * M
    ),
    M,
    287
  );

  return doc;
}
