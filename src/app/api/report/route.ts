import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function digitSum(n: number){ let s=0; while(n>0){ s+=n%10; n=Math.floor(n/10);} return s; }
function reduce(n:number){ const m=new Set([11,22,33]); while(n>9 && !m.has(n)) n=digitSum(n); return n; }
function lifePath(dob:string){ const [y,m,d]=dob.split("-").map(Number); return reduce(digitSum(y)+digitSum(m)+digitSum(d)); }
function nameNumber(name:string){
  const map:Record<string,number>={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:4,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7};
  const total=name.toUpperCase().replace(/[^A-Z]/g,"").split("").reduce((s,c)=>s+(map[c]||0),0);
  return reduce(total);
}
function tipFor(n:number, fb:number){
  const t:Record<number,string>={
    1:"Leadership—brighten North-East with warm light.",
    2:"Partnership—keep South-West tidy; calm bedroom colors.",
    3:"Creativity—place a healthy plant in the East.",
    4:"Stability—desk facing North; declutter.",
    5:"Change—keep the center open for movement.",
    6:"Harmony—family photos in the West; soft tones.",
    7:"Spiritual—quiet corner in North-West.",
    8:"Power/finance—keep North clean; fix leaks.",
    9:"Service—add a small red accent in the South.",
    11:"Vision—meditation space in the East.",
    22:"Master builder—strong, clutter-free entrance.",
    33:"Compassionate teacher—soothing colors in living area."
  };
  return t[n] || t[fb] || "Balance your space: clean entrance, light & airflow.";
}

async function buildPdf(name:string, dob:string){
  const lp = lifePath(dob);
  const nn = nameNumber(name);
  const advice = tipFor(lp, nn);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  page.drawRectangle({ x:0, y:792, width:595.28, height:49.89, color: rgb(0.06,0.65,0.91) });
  page.drawText("Numerix Pro", { x:32, y:808, size:18, font:bold, color: rgb(1,1,1) });
  page.drawText("Automatic Numerology & Vastu Report", { x:32, y:790, size:11, font, color: rgb(1,1,1) });

  let y = 740;
  page.drawText("Client Details", { x:32, y, size:14, font:bold }); y-=18;
  page.drawText(`Name: ${name}`, { x:32, y, size:11, font }); y-=16;
  page.drawText(`DOB:  ${dob}`, { x:32, y, size:11, font }); y-=24;

  page.drawText("Core Numbers", { x:32, y, size:14, font:bold }); y-=18;
  page.drawText(`Life Path: ${lp}`, { x:32, y, size:12, font:bold }); y-=16;
  page.drawText(`Name Number: ${nn}`, { x:32, y, size:12, font:bold }); y-=24;

  page.drawText("Vastu Guidance", { x:32, y, size:14, font:bold }); y-=18;
  const wrap=(t:string,m=90)=>{const w=t.split(" ");const L:string[]=[];let l="";for(const x of w){const t2=(l?l+" ":"")+x;if(t2.length>m){L.push(l);l=x;}else l=t2;} if(l) L.push(l);return L;};
  for (const line of wrap(advice)) { page.drawText(line, { x:32, y, size:11, font }); y-=14; }
  y-=8;
  const more="General Enhancements: keep the entrance clean and well-lit; allow natural light and airflow; declutter regularly; repair leaks; choose calming colors for rest areas.";
  for (const line of wrap(more)) { page.drawText(line, { x:32, y, size:10, font, color: rgb(0.25,0.25,0.25) }); y-=13; }

  page.drawLine({ start:{x:32,y:40}, end:{x:563,y:40}, color: rgb(0.85,0.85,0.85), thickness:1 });
  page.drawText("© Numerix Pro • Auto-generated report", { x:32, y:24, size:9, font, color: rgb(0.4,0.4,0.4) });

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="NumerixPro_Report.pdf"'
    }
  });
}

// POST: used by the button
export async function POST(req: Request){
  const { name="", dob="" } = await req.json().catch(()=>({}));
  if(!name || !dob) return NextResponse.json({error:"Name and DOB required"}, {status:400});
  return buildPdf(name, dob);
}

// GET: fallback so a simple link works too
export async function GET(req: Request){
  const u = new URL(req.url);
  const name = u.searchParams.get("name") || "User";
  const dob  = u.searchParams.get("dob")  || "2000-01-01";
  return buildPdf(name, dob);
}
