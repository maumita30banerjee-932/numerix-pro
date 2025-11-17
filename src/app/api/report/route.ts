import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb, PDFImage } from "pdf-lib";

/* ---------- helpers ---------- */
const MASTER = new Set([11,22,33]);
const onlyLetters = (s:string)=>s.toUpperCase().replace(/[^A-Z]/g,"");
const isVowel = (c:string)=>"AEIOU".includes(c);
const brandBlue = rgb(0.06,0.65,0.91);
const brandGold = rgb(0.95,0.75,0.20);
const softGrey = rgb(0.93,0.95,0.97);
const textGrey = rgb(0.28,0.30,0.34);

function digitSum(n:number){let s=0;while(n>0){s+=n%10;n=Math.floor(n/10);}return s;}
function reduce(n:number){while(n>9 && !MASTER.has(n)) n=digitSum(n); return n;}

const MAP:Record<string,number>={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:5,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7};
function sumName(name:string, filter?:(c:string)=>boolean){
  const arr = onlyLetters(name).split("");
  const pick = filter ? arr.filter(filter) : arr;
  return pick.reduce((s,c)=>s+(MAP[c]||0),0);
}

/* ---------- numbers ---------- */
function lifePath(dob:string){const [y,m,d]=dob.split("-").map(Number);return reduce(digitSum(y)+digitSum(m)+digitSum(d));}
function birthdayNum(dob:string){return reduce(Number(dob.split("-")[2]));}
function destiny(name:string){return reduce(sumName(name));}
function soulUrge(name:string){return reduce(sumName(name,isVowel));}
function personality(name:string){return reduce(sumName(name,c=>!isVowel(c)));}
function maturityNum(dob:string,name:string){return reduce(lifePath(dob)+destiny(name));}
function personalYear(dob:string,today=new Date()){const [,m,d]=dob.split("-").map(Number);const y=today.getFullYear();return reduce(digitSum(y)+digitSum(m)+digitSum(d));}

/* ---------- text libraries ---------- */
const meaning:Record<number,string>={
  1:"Leader, initiative, independence, fresh starts.",
  2:"Diplomacy, partnership, intuition, balance.",
  3:"Creativity, expression, optimism, social charm.",
  4:"Stability, discipline, systems, practical work.",
  5:"Freedom, change, travel, versatility, marketing.",
  6:"Responsibility, family, harmony, aesthetics.",
  7:"Analysis, spiritual study, introspection, research.",
  8:"Power, finance, management, achievement.",
  9:"Compassion, service, healing, global outlook.",
  11:"Higher vision, inspiration, spiritual messenger.",
  22:"Master builder, big projects, practical vision.",
  33:"Compassionate teacher, healing through service."
};
const vastuByNumber:Record<number,string>={
  1:"Northeast bright; warm light; display achievements to activate Sun energy.",
  2:"South-West tidy; pairs of objects; soft fabrics to strengthen Moon harmony.",
  3:"East green plant; study or creative desk in East—Jupiter wisdom zone.",
  4:"North work desk; square shapes; declutter storerooms—Saturn discipline.",
  5:"Keep center open; good airflow; Mercury greens/teal in work area.",
  6:"West family wall; Venus creams/pastels; fragrant flowers at entry.",
  7:"North-West quiet corner; wind chimes; balance Air element.",
  8:"North zone clean; strong door hardware; earthy tones; finance files North.",
  9:"South red accent; donation bowl near entry; manage Fire well in kitchen.",
  11:"Meditation in East; vision board; soft golden light in temple area.",
  22:"Grand, clutter-free entrance; firm bed placement; quality furniture.",
  33:"Soothing palettes in living room; study/teaching corner in East."
};
const lucky:Record<number,{colors:string;gem:string;days:string}>={
  1:{colors:"gold, orange", gem:"Ruby (Manik)", days:"Sunday"},
  2:{colors:"pearl white, silver", gem:"Pearl (Moti)", days:"Monday"},
  3:{colors:"yellow, green", gem:"Yellow Sapphire", days:"Thursday"},
  4:{colors:"deep blue, earthy", gem:"Hessonite/Blue Sapphire*", days:"Saturday"},
  5:{colors:"emerald, teal", gem:"Emerald (Panna)", days:"Wednesday"},
  6:{colors:"pastel pink, cream", gem:"Diamond/OP*", days:"Friday"},
  7:{colors:"indigo, violet", gem:"Cat’s Eye*", days:"Monday/Saturday"},
  8:{colors:"dark grey, black", gem:"Blue Sapphire*", days:"Saturday"},
  9:{colors:"red, maroon", gem:"Red Coral (Moonga)", days:"Tuesday"},
  11:{colors:"gold-white", gem:"Yellow/White Sapphire*", days:"Sun/Thu"},
  22:{colors:"earth-gold", gem:"Yellow Sapphire*", days:"Thu"},
  33:{colors:"rose-gold, cream", gem:"Diamond/OP*", days:"Fri"}
};
function comp(n:number){
  const m:Record<number,string>={
    1:"Best with 3,5,6. Needs patience with 4,8.",
    2:"Best with 4,6,8. Sensitive with 1,9.",
    3:"Best with 1,5,7. Avoid rigidity of 4.",
    4:"Best with 2,8. Friction with 1,3,5.",
    5:"Best with 1,3,6. Unsettled with 4,7.",
    6:"Best with 1,2,5,9. Over-giving with 7.",
    7:"Best with 3,7,9. Detached with 5,8.",
    8:"Best with 2,4,6. Power clashes with 1,9.",
    9:"Best with 3,6,9. Intense with 2,8.",
    11:"Aligns with 2,7,9. Ground energy daily.",
    22:"Aligns with 4,6,8. Blend vision with patience.",
    33:"Aligns with 3,6,9. Keep boundaries."
  };
  return m[n] || "";
}

/* ---------- layout helpers ---------- */
function wrap(text:string,max=92){
  const w=text.split(" ");const lines:string[]=[];let line="";
  for(const x of w){const t=(line?line+" ":"")+x;if(t.length>max){lines.push(line);line=x;}else line=t;}
  if(line) lines.push(line); return lines;
}
async function loadLogo(pdf:PDFDocument){
  // If you upload public/logo.png, Vercel serves it at /logo.png.
  // We can’t fetch externally in this serverless handler, so we just skip if not embedded.
  return null as unknown as PDFImage | null;
}
function card(p:any,{x,y,w,h}:{x:number;y:number;w:number;h:number}, title:string, value:string){
  p.drawRectangle({x, y:y-h, width:w, height:h, color:softGrey, opacity:1, borderColor:rgb(0.85,0.88,0.92), borderWidth:1});
  p.drawText(title,{x:x+12,y:y-22,size:10,color:textGrey});
  p.drawText(value,{x:x+12,y:y-42,size:16});
}
function headerBand(p:any, title:string, sub:string){
  p.drawRectangle({x:0,y:792,width:595.28,height:52,color:brandBlue});
  p.drawText(title,{x:32,y:808,size:20,color:rgb(1,1,1),font:bold});
  p.drawText(sub,{x:32,y:790,size:11,color:rgb(1,1,1)});
}
function footer(p:any,pageNo:number,total:number){
  p.drawLine({start:{x:32,y:40},end:{x:563,y:40},color:rgb(0.86,0.88,0.9),thickness:1});
  p.drawText(`Page ${pageNo} of ${total} · Prepared by Mamta Banerjee — Vastu & Numerology Consultant`,{x:32,y:24,size:9,color:rgb(0.4,0.4,0.4)});
}

/* ---------- build PDF ---------- */
async function buildPdf(name:string, dob:string){
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // numbers
  const lp = lifePath(dob);
  const bd = birthdayNum(dob);
  const de = destiny(name);
  const su = soulUrge(name);
  const pe = personality(name);
  const mat = maturityNum(dob,name);
  const py = personalYear(dob);
  const anchor = lp;

  /* --- Page 1: Cover + key cards --- */
  let p1 = pdf.addPage([595.28,841.89]);
  // @ts-ignore
  globalThis.bold = bold; // small hack so helper can see it
  headerBand(p1,"Numerix Pro","Automatic Numerology & Vastu Report");

  p1.drawText("Client Details",{x:32,y:740,size:14,font:bold});
  p1.drawText(`Name: ${name}`,{x:32,y:722,size:11,font});
  p1.drawText(`DOB : ${dob}`,{x:32,y:706,size:11,font});

  // cards row
  card(p1,{x:32,y:670,w:165,h:70},"Life Path",String(lp));
  card(p1,{x:212,y:670,w:165,h:70},"Destiny",String(de));
  card(p1,{x:392,y:670,w:165,h:70},"Soul Urge",String(su));

  card(p1,{x:32,y:580,w:165,h:70},"Personality",String(pe));
  card(p1,{x:212,y:580,w:165,h:70},"Birth Day",String(bd));
  card(p1,{x:392,y:580,w:165,h:70},"Maturity",String(mat));

  // banner strip with personal year
  p1.drawRectangle({x:32,y:520,width:525,height:40,color:brandGold,opacity:0.9});
  p1.drawText(`Personal Year: ${py} — ${meaning[py]}`,{x:44,y:534,size:12,font:bold,color:rgb(0.15,0.15,0.15)});

  // quick summary text
  p1.drawText("Snapshot:",{x:32,y:470,size:13,font:bold});
  for(const L of wrap(`${meaning[lp]} Your path aligns best with ${comp(lp)} Focus on ${meaning[py].toLowerCase()}.`, 95)){
    p1.drawText(L,{x:32,y:452-(14*(wrap(`${meaning[lp]} x`,95).indexOf(L))),size:11,font,color:textGrey});
  }
  footer(p1,1,3);

  /* --- Page 2: Detailed meanings --- */
  let p2 = pdf.addPage([595.28,841.89]);
  headerBand(p2,"Numerology Insights","Detailed interpretations");
  let y = 740;

  function section(title:string, n:number){
    p2.drawText(`${title}: ${n}`,{x:32,y,size:13,font:bold});
    y-=16;
    for(const L of wrap(meaning[n], 92)){ p2.drawText(L,{x:32,y,size:11,font}); y-=13; }
    y-=8;
  }
  section("Life Path", lp);
  section("Destiny (Expression)", de);
  section("Soul Urge", su);
  section("Personality", pe);
  section("Birth Day", bd);
  section("Maturity", mat);
  section("Personal Year", py);

  footer(p2,2,3);

  /* --- Page 3: Vastu, Lucky palette, Compatibility --- */
  let p3 = pdf.addPage([595.28,841.89]);
  headerBand(p3,"Vastu Guidance & Lifestyle","Personalized home & office remedies");
  y = 740;

  p3.drawText("Vastu Guidance (by core vibration)",{x:32,y,size:13,font:bold}); y-=18;
  for(const L of wrap(vastuByNumber[anchor] || "Maintain a clean, well-lit entrance; support natural light and airflow.")){ p3.drawText(L,{x:32,y,size:11,font}); y-=13; }

  const remedies = [
    "Entrance: declutter; bright, welcoming light; fix wobbly hardware.",
    "Northeast: meditation/temple tidy and bright.",
    "Kitchen: balance Fire & Water; repair leaks quickly.",
    "Work desk: face North or East; solid wall behind; invite natural light.",
    "Center: keep open for movement; avoid heavy storage."
  ];
  y-=10; p3.drawText("General Remedies", {x:32,y,size:13,font:bold}); y-=16;
  for(const r of remedies){ for(const L of wrap("• "+r, 90)){ p3.drawText(L,{x:32,y,size:11,font}); y-=13; } }

  // Lucky palette
  const LUCK = lucky[anchor] || lucky[lp];
  y-=10; p3.drawText("Lucky Alignment", {x:32,y,size:13,font:bold}); y-=16;
  p3.drawText(`Colors: ${LUCK.colors}  |  Gemstone: ${LUCK.gem}*  |  Auspicious Days: ${LUCK.days}`,{x:32,y,size:11,font}); y-=14;
  p3.drawText("* Gemstones marked with * should be worn only after professional consultation.",{x:32,y,size:9,font,color:textGrey}); y-=16;

  // Compatibility
  p3.drawText("Compatibility & Social Strategy", {x:32,y,size:13,font:bold}); y-=16;
  for(const L of wrap(comp(lp), 92)){ p3.drawText(L,{x:32,y,size:11,font}); y-=13; }

  footer(p3,3,3);

  const bytes = await pdf.save();
  return new Response(bytes, {
    headers:{
      "Content-Type":"application/pdf",
      "Content-Disposition":'attachment; filename="NumerixPro_Full_Report.pdf"'
    }
  });
}

/* ---------- API ---------- */
export async function POST(req:Request){
  const { name="", dob="" } = await req.json().catch(()=>({}));
  if(!name || !dob) return NextResponse.json({error:"Name and DOB required"}, {status:400});
  return buildPdf(name, dob);
}
export async function GET(req:Request){
  const u = new URL(req.url);
  const name = u.searchParams.get("name") || "User";
  const dob  = u.searchParams.get("dob")  || "2000-01-01";
  return buildPdf(name, dob);
}
