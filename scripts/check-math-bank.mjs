import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),katex=require('../assets/katex/katex.min.js');
const base=new URL('../math-practice/',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,base),'utf8');
const manifest=JSON.parse(read('data/manifest.json'));
const all=[],families=new Map();let formulas=0;
const render=tex=>{katex.renderToString(tex,{throwOnError:true,strict:'error'});formulas++;};
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(read('data/manifest.js'),sandbox);
assert.equal(sandbox.window.MATH_MANIFEST.total,manifest.total);
for(const batch of manifest.batches){
 const data=JSON.parse(read(`data/batch-${batch}.json`));
 vm.runInContext(read(`data/batch-${batch}.js`),sandbox);
 assert.equal(data.questions.length,300);assert.equal(new Set(data.questions.map(q=>q.topic)).size,5);
 for(const level of ['easy','medium','hard'])assert.equal(data.questions.filter(q=>q.difficulty===level).length,100);
 for(const q of data.questions){
  assert.equal(q.id,`M${String(all.length+1).padStart(4,'0')}`);assert.equal(q.batch,batch);
  assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4,q.id);assert.ok(q.answer>=0&&q.answer<4);
  assert.equal(q.targetSeconds,{easy:15,medium:120,hard:300}[q.difficulty]);
  assert.ok(q.stem.length>10&&q.explanation.length>10,q.id);
  assert.ok(!/NaN|undefined|待补|重新按|TODO|�/.test(JSON.stringify(q)),q.id);
  for(const text of [q.stem,q.explanation]){
   assert.equal((text.match(/\$/g)||[]).length%2,0,q.id);
   for(const m of text.matchAll(/\$([^$]+)\$/g))render(m[1]);
  }
  q.options.forEach(render);families.set(q.family,(families.get(q.family)||0)+1);all.push(q);
 }
}
assert.equal(all.length,manifest.total);assert.equal(new Set(all.map(q=>q.stem)).size,all.length);
for(const count of families.values())assert.equal(count,10);
assert.equal(JSON.stringify(sandbox.window.MATH_BATCHES.flatMap(b=>b.questions)),JSON.stringify(all));
const html=read('index.html');
for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
 if(!/^(?:https?:|#)/.test(match[1]))assert.ok(fs.existsSync(new URL(match[1],base)),match[1]);
}
// Independent numerical / boundary audits: derive from the defining conditions,
// rather than using the formula that generated the stored correct answer.
const numeric=tex=>{if(/^-?\d+(?:\.\d+)?$/.test(tex))return +tex;const m=tex.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/);return m?(m[1]?-1:1)*m[2]/m[3]:NaN;};
const eq=(x,y,id)=>assert.ok(Math.abs(x-y)<1e-6*Math.max(1,Math.abs(y)),`${id}: ${x} != ${y}`);
for(const q of all){
 const a=q.variant+1,v=Number(q.family.at(-1))-1,answer=q.options[q.answer];
 if(q.topic==='quadratic'&&q.difficulty==='hard'&&v===1){
  const lo=(1+Math.sqrt(1+4*a))/2,hi=a+1;
  for(const m of [lo-.01,lo,lo+.01,hi-.01,hi,hi+.01]){
   const D=m*m-m-a,valid=D>=-1e-8&&m-Math.sqrt(Math.max(0,D))>1+1e-9;
   assert.equal(valid,m>=lo-1e-8&&m<hi-1e-8,q.id);
  }
  assert.ok(answer.includes(`sqrt{${4*a+1}}`)&&answer.endsWith(`${hi}\\right)`),q.id);
 }
 if(q.topic==='inequalities'&&q.difficulty==='hard'){
  const lower=numeric(answer);let min=Infinity;
  for(let j=1;j<10000;j++){
   const x=v?1+j/100: a*j/10000,y=v?x/(x-1):a-x;
   const value=v?a*a*x+y:1/x+4/y;
   assert.ok(value>=lower-1e-8,q.id);min=Math.min(min,value);
  }
  eq(v?a*a*(1+1/a)+(a+1):1/(a/3)+4/(2*a/3),lower,q.id);
 }
 if(q.topic==='sets'&&q.difficulty==='hard'&&v===1){
  // DP tracks whether an A-only and a B-only element have both appeared.
  let counts=[1,0,0,0];for(let j=0;j<a+3;j++){const next=[0,0,0,0];for(let m=0;m<4;m++)for(const flag of [0,1,2])next[m|flag]+=counts[m];counts=next;}
  eq(numeric(answer),counts[3],q.id);
 }
 if(q.topic==='complex'&&q.difficulty==='hard'&&v===0){
  const theta=Math.atan2(1,a),lo=Math.hypot(a+a*Math.cos(theta+Math.PI),1+a*Math.sin(theta+Math.PI)),hi=Math.hypot(a+a*Math.cos(theta),1+a*Math.sin(theta));eq(lo*hi,numeric(answer),q.id);
 }
 if(q.topic==='trig-function'&&q.difficulty==='hard'){
  if(v){const k=4*a-2*a*Math.SQRT2;let max=-Infinity;for(let j=0;j<10000;j++){const x=j*Math.PI/5000;max=Math.max(max,a*(Math.sin(x)+Math.cos(x))+k*Math.sin(x)*Math.cos(x));}eq(max,2*a,q.id);assert.ok(answer.includes(`${4*a}-${2*a}\\sqrt2`),q.id);}
  else for(const m of [-1/(4*a*a)-.001,-1/(4*a*a),0,(a-1)/a-.001,(a-1)/a,(a-1)/a+.001]){
   const D=1/(a*a)+4*m,roots=D<-1e-10?[]:D<1e-10?[1/(2*a)]:[(1/a-Math.sqrt(D))/2,(1/a+Math.sqrt(D))/2];
   const count=roots.reduce((n,t)=>n+(Math.abs(t)>1+1e-9?0:Math.abs(Math.abs(t)-1)<1e-9?1:2),0);
   assert.equal(count===4,m>-1/(4*a*a)+1e-9&&m<(a-1)/a-1e-9,q.id);
  }
 }
 if(q.topic==='exp-log'&&q.difficulty==='hard'&&v===1)for(const k of [2*a-.01,2*a,2*a+.01,a*a+1-.01,a*a+1,a*a+1+.01]){
  const D=k*k-4*a*a,ts=D<-1e-8?[]:Math.abs(D)<1e-8?[k/2]:[(k-Math.sqrt(D))/2,(k+Math.sqrt(D))/2];
  const count=ts.reduce((n,t)=>n+(t<1-1e-9?0:Math.abs(t-1)<1e-9?1:2),0);
  assert.equal(count===4,k>2*a&&k<a*a+1,q.id);
 }
 if(q.topic==='piecewise'&&q.difficulty==='hard'&&!v)for(const m of [-.1,0,.1,a*a-.1,a*a,a*a+.1]){
  const roots=[];if(m>=0)for(const c of [m,-m]){const D=a*a+c;if(D>=0)for(const r of [a-Math.sqrt(D),a+Math.sqrt(D)])if(!roots.some(x=>Math.abs(x-r)<1e-8))roots.push(r);}
  assert.equal(roots.length===4,m>0&&m<a*a,q.id);
 }
 if(q.topic==='properties'&&q.difficulty==='hard'&&v)for(const x of [.1,a,a*Math.SQRT2-.001,a*Math.SQRT2+.001,10*a]){
  const f=t=>t+Math.log((1+t)/(1-t));const sum=f((x-a)/(x+a))+f((x-2*a)/(x+2*a));assert.equal(sum>0,x>a*Math.SQRT2,q.id);
 }
 if(q.topic==='trig-identity'&&q.difficulty==='hard'){
  if(v){let lo=Infinity,hi=-Infinity;for(let j=0;j<100000;j++){const x=j*Math.PI/50000,y=(a+Math.sin(x))/(a+Math.cos(x));lo=Math.min(lo,y);hi=Math.max(hi,y);}eq(lo,(a*a-Math.sqrt(2*a*a-1))/(a*a-1),q.id);eq(hi,(a*a+Math.sqrt(2*a*a-1))/(a*a-1),q.id);}
  else for(const m of [2*Math.SQRT2/a-1-.001,2*Math.SQRT2/a-1,(2*Math.SQRT2/a+a**-2)/2,1+a**-2,1+a**-2+.001]){
   const D=1+a**-2-m,ts=D<0?[]:D<1e-9?[1/a]:[1/a-Math.sqrt(D),1/a+Math.sqrt(D)];const count=ts.reduce((n,t)=>n+(Math.abs(t)>Math.SQRT2+1e-9?0:Math.abs(Math.abs(t)-Math.SQRT2)<1e-9?1:2),0);
   assert.equal(count===4,m>2*Math.SQRT2/a-1+1e-9&&m<1+a**-2-1e-9,q.id);
  }
 }
 if(q.topic==='triangle'&&q.difficulty==='hard'&&!v){let maximum=0;for(let j=1;j<20000;j++){const b=2*a*j/20000,c=2*a-b,d=Math.sqrt(b*b+c*c-b*c),area=Math.sqrt(3)*b*c/4;maximum=Math.max(maximum,2*area/(b+c+d));}eq(maximum,a*Math.sqrt(3)/6,q.id);}
 if(q.topic==='vectors'&&q.difficulty==='hard'&&v){let min=Infinity;for(let j=0;j<10000;j++){const x=a*Math.cos(j*Math.PI/5000),y=a*Math.sin(j*Math.PI/5000);min=Math.min(min,(2*a-x)*(-x)+(-y)*(2*a-y));}eq(min,a*a-2*a*a*Math.SQRT2,q.id);}
 if(q.topic==='arithmetic'&&q.difficulty==='hard'){const sums=[];let sum=0;for(let n=1;n<=4*a;n++){sum+=2*a+(v?1:0)-2*n;sums.push(sum);}if(v)eq(numeric(answer),Math.max(...sums),q.id);else eq(numeric(answer),sums.filter(x=>x>=a*a-a).length,q.id);}
 if(q.topic==='geometric'&&q.difficulty==='hard'&&!v){let sum=0,n=0;do{sum+=a*(-2)**n;n++;}while(sum<=21*a);eq(numeric(answer),n,q.id);}
}
console.log(`PASS: ${all.length} questions, ${families.size} families, ${formulas} LaTeX expressions; schema, offline scripts and independent boundary/numerical audits.`);
