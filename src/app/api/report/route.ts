// src/app/api/report/route.ts
import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
/**
 * Numerix Pro — Premium 5-page report generator (Option A)
 * - Cover with full-bleed color band
 * - 5 pages: Cover, Key Cards, Detailed Numerology (EN/HI), Vastu + Remedies, Signature & QR
 * - Embeds WhatsApp QR (uses Google Chart API). If fetch fails, PDF still builds without QR.
 *
 * Usage:
 * GET  /api/report?name=NAME&dob=YYYY-MM-DD
 * POST /api/report  with JSON { name:"...", dob:"YYYY-MM-DD" }
 *
 * Note: pdf-lib is used. Ensure it's in package.json dependencies.
 */

/* ---------- configuration ---------- */
const WHATSAPP_PHONE = "+917990619203"; // user's number as requested
const COVER_TITLE = "Numerix Pro — Premium Report"; // Option A
const COVER_SUB = "Automatic Numerology & Vastu Analysis";

const brandBlue = rgb(0.06, 0.65, 0.91);
const brandGold = rgb(0.95, 0.75, 0.20);
const softGrey = rgb(0.95, 0.96, 0.98);
const textGrey = rgb(0.18, 0.2, 0.25);

/* ---------- helpers ---------- */
function digitSum(n: number) {
  let s = 0;
  while (n > 0) {
    s += n % 10;
    n = Math.floor(n / 10);
  }
  return s;
}
const MASTER = new Set([11, 22, 33]);
function reduce(n: number) {
  while (n > 9 && !MASTER.has(n)) n = digitSum(n);
  return n;
}
const onlyLetters = (s: string) => (s || "").toUpperCase().replace(/[^A-Z]/g, "");
const isVowel = (c: string) => "AEIOU".includes(c);

const MAP: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 7, P: 8, Q: 1, R: 2,
  S: 3, T: 4, U: 6, V: 6, W: 6, X: 5, Y: 1, Z: 7
};

function sumName(name: string, filter?: (c: string) => boolean) {
  const arr = onlyLetters(name).split("");
  const pick = filter ? arr.filter(filter) : arr;
  return pick.reduce((s, c) => s + (MAP[c] || 0), 0);
}
function lifePath(dob: string) {
  const [y, m, d] = dob.split("-").map(Number);
  return reduce(digitSum(y) + digitSum(m) + digitSum(d));
}
function birthdayNum(dob: string) { return reduce(Number(dob.split("-")[2])); }
function destiny(name: string) { return reduce(sumName(name)); }
function soulUrge(name: string) { return reduce(sumName(name, isVowel)); }
function personality(name: string) { return reduce(sumName(name, c => !isVowel(c))); }
function maturityNum(dob: string, name: string) { return reduce(lifePath(dob) + destiny(name)); }
function personalYear(dob: string, today = new Date()) {
  const [, m, d] = dob.split("-").map(Number);
  const y = today.getFullYear();
  return reduce(digitSum(y) + digitSum(m) + digitSum(d));
}

/* ---------- textual libraries ---------- */
const meaning: Record<number, string> = {
  1: "Leader, initiative, independence, fresh starts.",
  2: "Diplomacy, partnership, intuition, balance.",
  3: "Creativity, expression, optimism, social charm.",
  4: "Stability, discipline, systems, practical work.",
  5: "Freedom, change, travel, versatility, marketing.",
  6: "Responsibility, family, harmony, aesthetics.",
  7: "Analysis, spiritual study, introspection, research.",
  8: "Power, finance, management, achievement.",
  9: "Compassion, service, healing, global outlook.",
  11: "Higher vision, inspiration, spiritual messenger.",
  22: "Master builder, big projects, practical vision.",
  33: "Compassionate teacher, healing through service."
};
const vastuByNumber: Record<number, string> = {
  1: "Northeast bright; warm light; display achievements to activate Sun energy.",
  2: "South-West tidy; pairs of objects; soft fabrics to strengthen Moon harmony.",
  3: "East green plant; study or creative desk in East—Jupiter wisdom zone.",
  4: "North work desk; square shapes; declutter storerooms—Saturn discipline.",
  5: "Keep center open; good airflow; Mercury greens/teal in work area.",
  6: "West family wall; Venus creams/pastels; fragrant flowers at entry.",
  7: "North-West quiet corner; wind chimes; balance Air element.",
  8: "North zone clean; strong door hardware; earthy tones; finance files North.",
  9: "South red accent; donation bowl near entry; manage Fire well in kitchen.",
  11: "Meditation in East; vision board; soft golden light in temple area.",
  22: "Grand, clutter-free entrance; firm bed placement; quality furniture.",
  33: "Soothing palettes in living room; study/teaching corner in East."
};
const lucky: Record<number, { colors: string; gem: string; days: string }> = {
  1: { colors: "gold, orange", gem: "Ruby (Manik)", days: "Sunday" },
  2: { colors: "pearl white, silver", gem: "Pearl (Moti)", days: "Monday" },
  3: { colors: "yellow, green", gem: "Yellow Sapphire", days: "Thursday" },
  4: { colors: "deep blue, earthy", gem: "Hessonite/Blue Sapphire*", days: "Saturday" },
  5: { colors: "emerald, teal", gem: "Emerald (Panna)", days: "Wednesday" },
  6: { colors: "pastel pink, cream", gem: "Diamond/OP*", days: "Friday" },
  7: { colors: "indigo, violet", gem: "Cat’s Eye*", days: "Mon/Sat" },
  8: { colors: "dark grey, black", gem: "Blue Sapphire*", days: "Saturday" },
  9: { colors: "red, maroon", gem: "Red Coral (Moonga)", days: "Tuesday" },
  11: { colors: "gold-white", gem: "Yellow/White Sapphire*", days: "Sun/Thu" },
  22: { colors: "earth-gold", gem: "Yellow Sapphire*", days: "Thu" },
  33: { colors: "rose-gold, cream", gem: "Diamond/OP*", days: "Fri" }
};
function comp(n: number) {
  const m: Record<number, string> = {
    1: "Best with 3,5,6. Needs patience with 4,8.",
    2: "Best with 4,6,8. Sensitive with 1,9.",
    3: "Best with 1,5,7. Avoid rigidity of 4.",
    4: "Best with 2,8. Friction with 1,3,5.",
    5: "Best with 1,3,6. Unsettled with 4,7.",
    6: "Best with 1,2,5,9. Over-giving with 7.",
    7: "Best with 3,7,9. Detached with 5,8.",
    8: "Best with 2,4,6. Power clashes with 1,9.",
    9: "Best with 3,6,9. Intense with 2,8.",
    11: "Aligns with 2,7,9. Ground energy daily.",
    22: "Aligns with 4,6,8. Blend vision with patience.",
    33: "Aligns with 3,6,9. Keep boundaries."
  };
  return m[n] || "";
}

/* ---------- layout helpers ---------- */
function wrap(text: string, max = 92) {
  const w = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const x of w) {
    const t = (line ? line + " " : "") + x;
    if (t.length > max) { lines.push(line); line = x; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

async function fetchWhatsAppQR(phone: string) {
  try {
    // Google Chart API QR
    const url = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=https%3A%2F%2Fwa.me%2F${encodeURIComponent(phone.replace(/\+/g, ""))}&choe=UTF-8`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf;
  } catch (e) {
    return null;
  }
}

/* ---------- PDF builder ---------- */
async function buildPdf(name: string, dob: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // numbers
  const lp = lifePath(dob);
  const bd = birthdayNum(dob);
  const de = destiny(name);
  const su = soulUrge(name);
  const pe = personality(name);
  const mat = maturityNum(dob, name);
  const py = personalYear(dob);
  const anchor = lp;

  // attempt to fetch QR
  const qrBuf = await fetchWhatsAppQR(WHATSAPP_PHONE);
  let qrImage: any = null;
  if (qrBuf) {
    try {
      qrImage = await pdf.embedPng(qrBuf);
    } catch (e) { qrImage = null; }
  }

  /* ---------- helpers that draw on pages ---------- */
  function headerBand(p: any, title: string, sub: string) {
    p.drawRectangle({ x: 0, y: 792, width: 595.28, height: 52, color: brandBlue });
    p.drawText(title, { x: 32, y: 808, size: 20, color: rgb(1, 1, 1), font: bold });
    p.drawText(sub, { x: 32, y: 790, size: 11, color: rgb(1, 1, 1), font });
  }
  function footer(p: any, pageNo: number, total: number) {
    p.drawLine({ start: { x: 32, y: 40 }, end: { x: 563, y: 40 }, color: rgb(0.86, 0.88, 0.9), thickness: 1 });
    p.drawText(`Page ${pageNo} of ${total} · Prepared by Mamta Banerjee — Vastu & Numerology Consultant`, { x: 32, y: 24, size: 9, color: rgb(0.45, 0.45, 0.45), font });
  }
  function drawCard(p: any, x: number, y: number, w: number, h: number, title: string, value: string) {
    p.drawRectangle({ x, y: y - h, width: w, height: h, color: softGrey, borderColor: rgb(0.86, 0.88, 0.92), borderWidth: 0.8 });
    p.drawText(title, { x: x + 10, y: y - 22, size: 10, color: textGrey, font });
    p.drawText(value, { x: x + 10, y: y - 44, size: 18, font: bold });
  }

  /* ---------- Page 1: Cover ---------- */
  const p1 = pdf.addPage([595.28, 841.89]);
  headerBand(p1, COVER_TITLE, COVER_SUB);

  // big coloured cover band
  p1.drawRectangle({ x: 0, y: 550, width: 595.28, height: 240, color: brandBlue });
  p1.drawText(COVER_TITLE, { x: 36, y: 690, size: 28, font: bold, color: rgb(1, 1, 1) });
  p1.drawText(COVER_SUB, { x: 36, y: 665, size: 12, font, color: rgb(1, 1, 1) });

  // subtitle and tagline bilingual
  p1.drawText("Automatic Numerology & Vastu Report", { x: 36, y: 640, size: 11, font, color: rgb(1, 1, 1) });
  p1.drawText("स्वचालित अंक ज्योतिष और वास्तु रिपोर्ट", { x: 36, y: 625, size: 11, font, color: rgb(1, 1, 1) });

  // small details on left
  p1.drawText(`Client: ${name}`, { x: 36, y: 590, size: 11, font });
  p1.drawText(`DOB   : ${dob}`, { x: 36, y: 575, size: 11, font });
  p1.drawText(`Report : Premium (5 pages)`, { x: 36, y: 560, size: 11, font });

  // cover right: signature/branding block
  p1.drawRectangle({ x: 380, y: 560, width: 180, height: 120, color: rgb(1, 1, 1), opacity: 0.08, borderColor: rgb(1, 1, 1), borderWidth: 0.4 });
  p1.drawText("Prepared by", { x: 392, y: 660, size: 10, font, color: rgb(1, 1, 1) });
  p1.drawText("Mamta Banerjee", { x: 392, y: 642, size: 14, font: bold, color: rgb(1, 1, 1) });
  p1.drawText("Vastu & Numerology Consultant", { x: 392, y: 626, size: 9, font, color: rgb(1, 1, 1) });

  footer(p1, 1, 5);

  /* ---------- Page 2: Key numbers & cards ---------- */
  const p2 = pdf.addPage([595.28, 841.89]);
  headerBand(p2, "Key Numerology Snapshot", "Quick, actionable numerix");
  p2.drawText("Core Numbers (Quick View)", { x: 32, y: 730, size: 13, font: bold });

  drawCard(p2, 32, 700, 180, 90, "Life Path", String(lp));
  drawCard(p2, 232, 700, 180, 90, "Destiny", String(de));
  drawCard(p2, 432, 700, 130, 90, "Soul Urge", String(su));

  drawCard(p2, 32, 590, 180, 90, "Personality", String(pe));
  drawCard(p2, 232, 590, 180, 90, "Birth Day", String(bd));
  drawCard(p2, 432, 590, 130, 90, "Maturity", String(mat));

  // banner with Personal Year
  p2.drawRectangle({ x: 32, y: 525, width: 525, height: 40, color: brandGold, opacity: 0.95 });
  p2.drawText(`Personal Year: ${py} — ${meaning[py] || ""}`, { x: 44, y: 541, size: 12, font: bold, color: rgb(0.09, 0.09, 0.09) });

  // bilingual short snapshot
  let snapshotEn = `${meaning[lp] || ""} Focus areas this year: ${meaning[py] || ""}`;
  let snapshotHi = `सारांश: ${meaning[lp] || ""} इस वर्ष ध्यान दें: ${meaning[py] || ""}`;
  const snapY = 480;
  for (let i = 0; i < wrap(snapshotEn, 90).length; i++) {
    p2.drawText(wrap(snapshotEn, 90)[i], { x: 32, y: snapY - i * 14, size: 11, font, color: textGrey });
  }
  const hiStart = snapY - (wrap(snapshotEn, 90).length * 14) - 12;
  p2.drawText(snapshotHi, { x: 32, y: hiStart, size: 11, font, color: textGrey });

  footer(p2, 2, 5);

  /* ---------- Page 3: Detailed numerology EN/HI ---------- */
  const p3 = pdf.addPage([595.28, 841.89]);
  headerBand(p3, "Numerology Insights", "Detailed readings (EN/HI)");
  let y = 740;

  function writeBlock(titleEn: string, titleHi: string, valueNum: number) {
    p3.drawText(`${titleEn} (${titleHi}): ${valueNum}`, { x: 32, y, size: 12, font: bold });
    y -= 14;
    const textEn = meaning[valueNum] || "";
    const linesEn = wrap(textEn, 92);
    for (const L of linesEn) {
      p3.drawText(L, { x: 32, y, size: 11, font, color: textGrey });
      y -= 13;
    }
    y -= 8;
  }

  writeBlock("Life Path", "लाइफ पाथ", lp);
  writeBlock("Destiny (Expression)", "डेस्टिनी", de);
  writeBlock("Soul Urge", "सोल अर्जी", su);
  writeBlock("Personality", "पर्सनैलिटी", pe);
  writeBlock("Birth Day", "जन्म दिन", bd);
  writeBlock("Maturity", "परिपक्वता", mat);
  writeBlock("Personal Year", "पर्सनल वर्ष", py);

  footer(p3, 3, 5);

  /* ---------- Page 4: Vastu, Remedies, Lucky palette ---------- */
  const p4 = pdf.addPage([595.28, 841.89]);
  headerBand(p4, "Vastu Guidance & Lifestyle", "Personalized home & office remedies (EN/HI)");
  let y4 = 740;

  p4.drawText("By Core Number (English):", { x: 32, y: y4, size: 12, font: bold }); y4 -= 16;
  const vb = vastuByNumber[anchor] || "Maintain clean, well-lit entrance; support natural light and airflow.";
  for (const L of wrap(vb, 92)) { p4.drawText(L, { x: 32, y: y4, size: 11, font }); y4 -= 13; }
  y4 -= 6;
  p4.drawText("वास्तु सुझाव (हिन्):", { x: 32, y: y4, size: 12, font: bold }); y4 -= 16;
  // small Hindi translation-friendly lines (short)
  const hival = vb.replace(" ; ", " । ").slice(0, 400);
  for (const L of wrap(hival, 92)) { p4.drawText(L, { x: 32, y: y4, size: 11, font }); y4 -= 13; }

  y4 -= 8;
  p4.drawText("General Remedies / सामान्य उपाय:", { x: 32, y: y4, size: 12, font: bold }); y4 -= 14;
  const remedies = [
    "Entrance: declutter; bright, welcoming light; fix hardware.",
    "Northeast: meditation/temple tidy and bright.",
    "Kitchen: balance Fire & Water; repair leaks quickly.",
    "Work desk: face North or East; solid wall behind; invite natural light.",
    "Center: keep open for movement; avoid heavy storage."
  ];
  for (const r of remedies) {
    for (const L of wrap("• " + r, 90)) { p4.drawText(L, { x: 32, y: y4, size: 11, font }); y4 -= 13; }
    y4 -= 4;
  }

  // Lucky palette box
  const luck = lucky[anchor] || lucky[lp] || { colors: "neutral", gem: "-", days: "-" };
  p4.drawRectangle({ x: 360, y: y4 + 60, width: 200, height: 80, color: softGrey, borderColor: rgb(0.86, 0.88, 0.92) });
  p4.drawText("Lucky Alignment", { x: 370, y: y4 + 110, size: 12, font: bold });
  p4.drawText(`Colors: ${luck.colors}`, { x: 370, y: y4 + 92, size: 11, font });
  p4.drawText(`Gemstone: ${luck.gem}`, { x: 370, y: y4 + 74, size: 11, font });
  p4.drawText(`Auspicious Days: ${luck.days}`, { x: 370, y: y4 + 56, size: 9, font, color: textGrey });

  footer(p4, 4, 5);

  /* ---------- Page 5: Signature, QR & Next steps ---------- */
  const p5 = pdf.addPage([595.28, 841.89]);
  headerBand(p5, "Summary & Next Steps", "Practical actions and contact");

  let y5 = 720;
  p5.drawText("Quick Action Plan / त्वरित कार्य योजना:", { x: 32, y: y5, size: 12, font: bold }); y5 -= 16;
  const actions = [
    "Declutter main entrance and ensure good light.",
    "Place plants in East for growth; fix kitchen leaks.",
    "Face North/East at work desk; use supportive colors.",
    "Monthly reflection: set small measurable goals each new moon.",
  ];
  for (const a of actions) {
    for (const L of wrap("• " + a, 92)) { p5.drawText(L, { x: 32, y: y5, size: 11, font }); y5 -= 13; }
    y5 -= 6;
  }

  // signature box
  p5.drawRectangle({ x: 36, y: 260, width: 280, height: 110, color: softGrey, borderColor: rgb(0.84, 0.85, 0.87) });
  p5.drawText("Consultant Signature:", { x: 46, y: 350, size: 11, font: bold });
  p5.drawText("Mamta Banerjee", { x: 46, y: 332, size: 12, font: bold });
  p5.drawText("Vastu & Numerology Consultant", { x: 46, y: 316, size: 10, font });

  // QR & contact on right
  const qrX = 380, qrY = 360;
  if (qrImage) {
    const qrDims = qrImage.scale(0.8);
    p5.drawImage(qrImage, { x: qrX, y: qrY - qrDims.height, width: qrDims.width, height: qrDims.height });
    p5.drawText("Scan to message on WhatsApp", { x: qrX, y: qrY - qrDims.height - 10, size: 9, font, color: textGrey });
  } else {
    // fallback: draw WhatsApp link text
    p5.drawText("WhatsApp: " + WHATSAPP_PHONE, { x: qrX, y: qrY, size: 11, font: bold });
    p5.drawText("Unable to fetch QR. Contact via above number.", { x: qrX, y: qrY - 16, size: 9, font });
  }
  p5.drawText("Website: (your website)", { x: qrX, y: qrY - 40, size: 9, font, color: textGrey });

  // bilingual closing note
  p5.drawText("Thank you — शुभकामनाएँ", { x: 36, y: 220, size: 11, font: bold });
  p5.drawText("For a detailed paid report (deeper remedies, charts & customised gemstone guidance), contact on WhatsApp.", { x: 36, y: 205, size: 10, font, color: textGrey });

  footer(p5, 5, 5);

  const bytes = await pdf.save();
  return bytes;
}

/* ---------- API handlers ---------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = (body.name || "User").toString();
    const dob = (body.dob || "2000-01-01").toString();

    const bytes = await buildPdf(name, dob);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="NumerixPro_Premium_Report.pdf"`
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to build PDF", details: String(err) }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const name = (u.searchParams.get("name") || "User").toString();
    const dob = (u.searchParams.get("dob") || "2000-01-01").toString();

    const bytes = await buildPdf(name, dob);
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="NumerixPro_Premium_Report.pdf"`
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to build PDF", details: String(err) }, { status: 500 });
  }
}
