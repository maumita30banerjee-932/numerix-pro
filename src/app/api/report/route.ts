import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

/* ------------------ Core helpers ------------------ */
const MASTER = new Set([11, 22, 33]);
const onlyLetters = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, "");
const isVowel = (c: string) => "AEIOU".includes(c);

function digitSum(n: number) { let s=0; while(n>0){ s+=n%10; n=Math.floor(n/10);} return s; }
function reduce(n: number) { while(n>9 && !MASTER.has(n)) n = digitSum(n); return n; }

/* Pythagorean map (tuned; common variant) */
const MAP: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7
};

function sumName(name: string, filter?: (c: string)=>boolean){
  const arr = onlyLetters(name).split("");
  const pick = filter ? arr.filter(filter) : arr;
  return pick.reduce((s,c)=> s + (MAP[c] || 0), 0);
}

/* ------------------ Numerology numbers ------------------ */
function lifePath(dob: string) { const [y,m,d] = dob.split("-").map(Number); return reduce(digitSum(y)+digitSum(m)+digitSum(d)); }
function birthdayNum(dob: string) { const d = Number(dob.split("-")[2]); return reduce(d); }
function destiny(name: string) { return reduce(sumName(name)); }               // Expression
function soulUrge(name: string) { return reduce(sumName(name, isVowel)); }     // Heart’s Desire
function personality(name: string) { return reduce(sumName(name, c=>!isVowel(c))); }
function maturityNum(dob: string, name: string) { return reduce(lifePath(dob) + destiny(name)); }
function personalYear(dob: string, today = new Date()) {
  const [, m, d] = dob.split("-").map(Number);
  const year = today.getFullYear();
  return reduce(digitSum(year) + digitSum(m) + digitSum(d));
}

/* ------------------ Text libraries (brief but premium) ------------------ */
const meanings: Record<number, string> = {
  1:"Leader, initiative, independence, new beginnings.",
  2:"Diplomacy, partnership, intuition, balance.",
  3:"Creativity, communication, optimism, social charm.",
  4:"Stability, discipline, systems, practical results.",
  5:"Freedom, change, travel, versatility, marketing.",
  6:"Responsibility, family, harmony, aesthetics.",
  7:"Analysis, spiritual study, introspection, research.",
  8:"Power, finance, management, achievement.",
  9:"Compassion, service, healing, global outlook.",
  11:"Higher vision, inspiration, spiritual messenger.",
  22:"Master builder, big projects, practical vision.",
  33:"Compassionate teacher, healing through service."
};

const vastuByNumber: Record<number, string> = {
  1:"Northeast bright; add warm light; display awards to activate Sun energy.",
  2:"South-West tidy; pairs of objects; soft fabrics to strengthen Moon harmony.",
  3:"East green plant; study/creative desk in East; Jupiter wisdom zone.",
  4:"North work desk; square shapes; declutter storerooms; Saturn discipline.",
  5:"Keep center open; good airflow; Mercury colors (green/teal) in work area.",
  6:"West family wall; Venus colors (cream/pastel); fragrant flowers at entry.",
  7:"North-West quiet corner; wind chimes; Ketu/air element balancing.",
  8:"North zone clean; strong door hardware; Earthy tones; finance files North.",
  9:"South red accent; donation bowl near entry; Mars fire managed in kitchen.",
  11:"Meditation in East; vision board; soft golden light in temple area.",
  22:"Grand, clutter-free entrance; firm bed placement; quality furniture.",
  33:"Soothing palettes in living room; study/teaching corner in East."
};

const lucky: Record<number, {colors: string; gem: string; days: string}> = {
  1:{colors:"gold, ruby, orange", gem:"Ruby (Manik)", days:"Sun, Sunday"},
  2:{colors:"pearl white, silver", gem:"Pearl (Moti)", days:"Monday"},
  3:{colors:"yellow, green", gem:"Yellow Sapphire (Pukhraj)", days:"Thursday"},
  4:{colors:"deep blue, earthy", gem:"Hessonite/Blue Sapphire (as advised)", days:"Saturday"},
  5:{colors:"emerald, teal", gem:"Emerald (Panna)", days:"Wednesday"},
  6:{colors:"pastel pink, cream", gem:"Diamond/OP (as advised)", days:"Friday"},
  7:{colors:"indigo, violet", gem:"Cat’s Eye (as advised)", days:"Monday/Saturday"},
  8:{colors:"dark grey, black", gem:"Blue Sapphire (as advised)", days:"Saturday"},
  9:{colors:"red, maroon", gem:"Red Coral (Moonga)", days:"Tuesday"},
  11:{colors:"gold-white", gem:"Yellow/White Sapphire (as advised)", days:"Sunday/Thursday"},
  22:{colors:"earth-gold", gem:"Yellow Sapphire (as advised)", days:"Thursday"},
  33:{colors:"rose-gold, cream", gem:"Diamond/OP (as advised)", days:"Friday"}
};

function compatibility(n: number) {
  const map: Record<number, string> = {
    1:"Best with 3,5,6. Needs patience with 4,8.",
    2:"Best with 4,6,8. Sensitive with 1,9.",
    3:"Best with 1,5,7. Avoid pessimism of 4.",
    4:"Best with 2,8. Friction with 1,3,5.",
    5:"Best with 1,3,6. Unsettled with 4,7.",
    6:"Best with 1,2,5,9. Overgive to 7.",
    7:"Best with 3,7,9. Detached with 5,8.",
    8:"Best with 2,4,6. Power clashes with 1,9.",
    9:"Best with 3,6,9. Intense with 2,8.",
    11:"Aligns with 2,7,9. Requires grounding.",
    22:"Aligns with 4,6,8. Needs vision + patience.",
    33:"Aligns with 3,6,9. Needs boundaries."
  };
  return map[n] || "Maintain balance with clear communication.";
}

/* ------------------ PDF helpers ------------------ */
async function startPdf() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  return { pdf, page, font, bold };
}
function wrap(txt: string, max=92){
  const w = txt.split(" "); const out: string[] = [];
  let line = "";
  for (const word of w){
    const tryLine = (line?line+" ":"")+word;
    if (tryLine.length>max){ out.push(line); line = word; } else line = tryLine;
  }
  if (line) out.push(line);
  return out;
}
function ensureSpace(pdf: PDFDocument, font: any, bold: any, pages: any[], y: {v:number}) {
  if (y.v < 80) {
    const p = pdf.addPage([595.28, 841.89]);
    pages.push(p); y.v = 780;
    // footer line on previous page
  }
}

/* ------------------ Build the multi-page report ------------------ */
async function buildPdf(name: string, dob: string){
  const { pdf, page, font, bold } = await startPdf();
  const pages = [page];
  let p = page;
  let y = 800;

  const lp = lifePath(dob);
  const bd = birthdayNum(dob);
  const de = destiny(name);
  const su = soulUrge(name);
  const pe = personality(name);
  const mat = maturityNum(dob, name);
  const py = personalYear(dob);
  const focus = lp; // primary anchor for Vastu & tips

  // Header band
  p.drawRectangle({ x:0, y:792, width:595.28, height:49.89, color: rgb(0.06,0.65,0.91) });
  p.drawText("Numerix Pro", { x:32, y:808, size:18, font:bold, color: rgb(1,1,1) });
  p.drawText("Automatic Numerology & Vastu Report", { x:32, y:790, size:11, font, color: rgb(1,1,1) });

  // Client block
  y = 740;
  p.drawText("Client Details", { x:32, y, size:14, font:bold }); y-=18;
  p.drawText(`Name: ${name}`, { x:32, y, size:11, font }); y-=16;
  p.drawText(`DOB : ${dob}`, { x:32, y, size:11, font }); y-=28;

  // Core Numbers table (compact)
  p.drawText("Core Numbers", { x:32, y, size:14, font:bold }); y-=18;
  const core = [
    `Life Path: ${lp} — ${meanings[lp]}`,
    `Destiny (Expression): ${de} — ${meanings[de]}`,
    `Soul Urge (Heart’s Desire): ${su} — ${meanings[su]}`,
    `Personality: ${pe} — ${meanings[pe]}`,
    `Birth Day: ${bd} — ${meanings[bd]}`,
    `Maturity: ${mat} — ${meanings[mat]}`,
    `Personal Year: ${py} — Focus for this year: ${meanings[py]}`
  ];
  for (const line of core){
    for (const L of wrap(line)) { p.drawText(L, { x:32, y, size:11, font }); y -= 14; }
    ensureSpace(pdf, font, bold, pages, {v:y});
  }
  y -= 10;

  // Lucky palette
  const L = lucky[focus] || lucky[lp];
  p.drawText("Lucky Alignment", { x:32, y, size:14, font:bold }); y -= 18;
  p.drawText(`Colors: ${L.colors}  •  Gemstone: ${L.gem}  •  Auspicious days: ${L.days}`, { x:32, y, size:11, font }); y -= 24;

  // Page break for details
  p = pdf.addPage([595.28, 841.89]); pages.push(p); y = 780;

  // Detailed interpretations
  const sections: Array<[string, number]> = [
    ["Life Path", lp], ["Destiny (Expression)", de], ["Soul Urge", su],
    ["Personality", pe], ["Birth Day", bd], ["Maturity", mat], ["Personal Year", py]
  ];
  for (const [title, n] of sections){
    p.drawText(`${title}: ${n}`, { x:32, y, size:13, font:bold }); y -= 16;
    for (const L of wrap(meanings[n])) { p.drawText(L, { x:32, y, size:11, font }); y -= 13; }
    y -= 8;
    if (y < 100) { p = pdf.addPage([595.28,841.89]); pages.push(p); y = 780; }
  }

  // Compatibility
  p.drawText("Compatibility & Social Strategy", { x:32, y, size:13, font:bold }); y -= 16;
  for (const L of wrap(compatibility(lp))) { p.drawText(L, { x:32, y, size:11, font }); y -= 13; }
  y -= 8;

  // Vastu Guidance (expanded)
  if (y < 160) { p = pdf.addPage([595.28,841.89]); pages.push(p); y = 780; }
  const vText = vastuByNumber[focus] || "Maintain clean entrance, light, and airflow.";
  p.drawText("Vastu Guidance (Home & Office)", { x:32, y, size:13, font:bold }); y -= 16;
  for (const L of wrap(vText)) { p.drawText(L, { x:32, y, size:11, font }); y -= 13; }
  const remedies = [
    "Entrance: declutter; ensure bright, welcoming light.",
    "Northeast: keep spiritual/meditation space tidy and bright.",
    "Kitchen: maintain hygiene; avoid leaking taps; balance Fire & Water.",
    "Work desk: face North or East; solid wall behind; natural light.",
    "Center of home: keep open for movement; reduce heavy storage."
  ];
  for (const R of remedies){ for (const L2 of wrap("• "+R, 88)){ p.drawText(L2, { x:32, y, size:11, font }); y -= 13; } }

  // Footer on last page
  p.drawLine({ start:{x:32,y:40}, end:{x:563,y:40}, color: rgb(0.85,0.85,0.85), thickness: 1 });
  p.drawText("Prepared by Mamta Banerjee — Vastu & Numerology Consultant | © Numerix Pro", { x:32, y:24, size:9, font, color: rgb(0.4,0.4,0.4) });

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="NumerixPro_Full_Report.pdf"'
    }
  });
}

/* ------------------ API handlers ------------------ */
export async function POST(req: Request){
  const { name="", dob="" } = await req.json().catch(()=>({}));
  if (!name || !dob) return NextResponse.json({ error: "Name and DOB required" }, { status: 400 });
  return buildPdf(name, dob);
}

export async function GET(req: Request){
  const u = new URL(req.url);
  const name = u.searchParams.get("name") || "User";
  const dob  = u.searchParams.get("dob")  || "2000-01-01";
  return buildPdf(name, dob);
}
