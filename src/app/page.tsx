"use client";
import { useState } from "react";

export default function Home() {
  // --- simple numerology & vastu (all-in-one file) ---
  const digitSum = (n:number)=>{ let s=0; while(n>0){s+=n%10; n=Math.floor(n/10);} return s; };
  const reduce = (n:number)=>{ const m=new Set([11,22,33]); while(n>9 && !m.has(n)) n=digitSum(n); return n; };
  const lifePath = (dob:string)=>{ const [y,m,d]=dob.split("-").map(Number); return reduce(digitSum(y)+digitSum(m)+digitSum(d)); };
  const nameNumber = (name:string)=> {
    const map:Record<string,number>={A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:4,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7};
    const total = name.toUpperCase().replace(/[^A-Z]/g,"").split("").reduce((s,c)=>s+(map[c]||0),0);
    return reduce(total);
  };
  const tips:Record<number,string>={
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

  // --- UI state ---
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");     // YYYY-MM-DD
  const [email, setEmail] = useState("");
  const canCalc = !!name && !!dob;
  const lp = canCalc ? lifePath(dob) : null;
  const nn = canCalc ? nameNumber(name) : null;

  return (
    <main style={{maxWidth:980,margin:"0 auto",padding:24,fontFamily:"system-ui"}}>
      <h1>Numerix Pro</h1>
      <p style={{color:"#6b7280"}}>Automatic Numerology & simple Vastu tips</p>

      <div style={{display:"grid",gap:16,gridTemplateColumns:"1.2fr .8fr"}}>
        <section style={{border:"1px solid #e5e7eb",borderRadius:16,padding:16}}>
          <div style={{display:"grid",gap:10}}>
            <input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
            <input type="date" value={dob} onChange={e=>setDob(e.target.value)} />
            <input type="email" placeholder="Email (optional)" value={email} onChange={e=>setEmail(e.target.value)} />
          </div>

          {canCalc && (
            <div style={{marginTop:16,border:"1px solid #e5e7eb",borderRadius:14,padding:14}}>
              <h3>Your Core Numbers</h3>
              <p><b>Life Path:</b> {lp}</p>
              <p><b>Name Number:</b> {nn}</p>
              <p>{tips[lp!] || tips[nn!] || "Balance: clean entrance, light & airflow."}</p>
            </div>
          )}
        </section>

        <section style={{border:"1px solid #e5e7eb",borderRadius:16,padding:16}}>
          <h3>Get full report</h3>
          <p style={{color:"#6b7280"}}>Payments coming soon (Paytm).</p>
          <button disabled style={{padding:"10px 14px",borderRadius:12,border:0,background:"#9ca3af",color:"#fff"}}>
            Paytm Checkout — not connected yet
          </button>
          <p style={{marginTop:8,color:"#6b7280",fontSize:12}}>We’ll enable this once your Paytm keys are ready.</p>
        </section>
      </div>
    </main>
  );
}
