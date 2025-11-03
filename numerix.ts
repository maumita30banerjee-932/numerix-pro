export type NumerixInput = { name: string; dob: string };

function digitSum(n: number): number { let s = 0; while (n > 0) { s += n % 10; n = Math.floor(n/10); } return s; }
function reduceToOneDigit(n: number): number { const master = new Set([11,22,33]); while (n>9 && !master.has(n)) n = digitSum(n); return n; }
export function lifePath(dob: string): number { const [y,m,d] = dob.split("-").map(Number); return reduceToOneDigit(digitSum(y)+digitSum(m)+digitSum(d)); }
export function nameNumber(name: string): number {
  const map: Record<string, number> = {A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,J:1,K:2,L:3,M:4,N:4,O:7,P:8,Q:1,R:2,S:3,T:4,U:6,V:6,W:6,X:5,Y:1,Z:7};
  const total = name.toUpperCase().replace(/[^A-Z]/g,"").split("").reduce((s,ch)=>s+(map[ch]||0),0);
  return reduceToOneDigit(total);
}
export function basicAdvice(lp: number, nn: number): string {
  const tips: Record<number,string> = {
    1:"Leadership—use warm light NE.",2:"Partnerships—tidy SW bedroom.",3:"Creativity—small plant East.",
    4:"Stability—desk facing North.",5:"Change—declutter the center.",6:"Harmony—family photos West.",
    7:"Spiritual—quiet NW corner.",8:"Finances—keep North clean.",9:"Service—add red to South.",
    11:"Intuition—meditate East.",22:"Builder—clear entrance.",33:"Teacher—soft colors."
  };
  return tips[lp] || tips[nn] || "Balance: clean entrance, good light & airflow.";
}
