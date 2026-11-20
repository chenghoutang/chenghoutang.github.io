import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {withoutMath} from './math/latex-prose.mjs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),katex=require('../assets/katex/katex.min.js');
const base=new URL('../math-practice/',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,base),'utf8');
const manifest=JSON.parse(read('data/manifest.json'));
const all=[],families=new Map();let formulas=0;
const render=tex=>{try{katex.renderToString(tex,{throwOnError:true,strict:'error',displayMode:true});}catch(error){throw Error(`${error.message}\nFormula: ${tex}`);}formulas++;};
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(read('data/manifest.js'),sandbox);
assert.equal(sandbox.window.MATH_MANIFEST.total,manifest.total);
for(const batch of manifest.batches){
 const data=JSON.parse(read(`data/batch-${batch}.json`));
 vm.runInContext(read(`data/batch-${batch}.js`),sandbox);
 assert.equal(data.questions.length,batch===9?100:batch===8?200:300);
 if(batch<=6){assert.equal(new Set(data.questions.map(q=>q.topic)).size,5);for(const level of ['easy','medium','hard'])assert.equal(data.questions.filter(q=>q.difficulty===level).length,100);}
 else if(batch<=8)assert.ok(data.questions.every(q=>q.difficulty==='hell'));else assert.equal(data.questions.length,100);
 for(const q of data.questions){
  assert.equal(q.id,`M${String(all.length+1).padStart(4,'0')}`);assert.equal(q.batch,batch);
  assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4,q.id);assert.ok(q.answer>=0&&q.answer<4);
  assert.equal(q.targetSeconds,{easy:15,medium:120,hard:300,hell:600}[q.difficulty]);
  if(q.difficulty==='hell'){assert.equal(q.contentRevision,manifest.hellRevision);assert.ok(q.strategy?.length>=6,q.id);}
  assert.ok(q.stem.length>10&&q.explanation.length>10,q.id);
  assert.ok(!/NaN|undefined|待补|重新按|TODO|�/.test(JSON.stringify(q)),q.id);
  for(const text of [q.stem,q.explanation]){
   const plain=text.replace(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g,(match,...args)=>{render(args.slice(0,4).find(v=>v!==undefined));return '';});
   assert.ok(!/\$|\\[a-zA-Z]+/.test(plain),`Unrendered LaTeX: ${q.id}`);
  }
  assert.ok(q.explanation.includes('关键推导\n$$\n'),q.id+' missing worked derivation');
  assert.ok(!/[A-Za-z0-9\p{Sm}\p{No}\p{M}′″]/u.test(withoutMath(q.explanation)),q.id+' formula outside LaTeX');
  q.options.forEach(render);families.set(q.family,(families.get(q.family)||0)+1);all.push(q);
 }
}
assert.equal(all.length,manifest.total);assert.equal(new Set(all.map(q=>q.stem)).size,all.length);
for(const count of families.values())assert.equal(count,10);
for(const level of ['easy','medium','hard'])assert.equal(all.filter(q=>q.difficulty===level).length,600+(level==='hard'&&manifest.batches.includes(9)?50:0));
assert.equal(all.filter(q=>q.difficulty==='hell').length,(manifest.batches.includes(7)?300:0)+(manifest.batches.includes(8)?200:0)+(manifest.batches.includes(9)?50:0));
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
 if(q.difficulty==='hell'||q.batch===9)continue;
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
 if(q.topic==='recurrence'&&q.difficulty==='hard'){
  if(v){let sum=0;for(let k=1;k<=a+3;k++)sum+=k*k/2**k;eq(numeric(answer),sum,q.id);}
  else{let x=a+1,sum=0;for(let n=1;n<=a;n++){const next=((a+1)*x-1)/(x+a-1);sum+=(x-1)*(next-1);x=next;}eq(numeric(answer),sum,q.id);}
 }
 if(q.topic==='line-circle'&&q.difficulty==='hard'&&!v){let max=0;for(let j=0;j<10000;j++){const c=Math.cos(j*Math.PI/10000),D=a*a*c*c+3*a*a;const r1=-a*c+Math.sqrt(D),r2=a*c+Math.sqrt(D);max=Math.max(max,r1*r1+r2*r2);}eq(max,numeric(answer),q.id);}
 if(q.topic==='ellipse'&&q.difficulty==='hard'){
  if(v)for(const theta of [.1,.5,1,1.5]){const c=Math.cos(theta),sn=Math.sin(theta),A=c*c/(a*a+1)+sn*sn,B=2*a*c/(a*a+1),C=-1/(a*a+1),D=B*B-4*A*C,r1=(-B+Math.sqrt(D))/(2*A),r2=(-B-Math.sqrt(D))/(2*A);eq(1/Math.abs(r1)+1/Math.abs(r2),2*Math.sqrt(a*a+1),q.id);}
  else{const x=Math.sqrt((a*a+1)*(a*a-1)/(a*a)),y=1/a;eq((x+a)*(x-a)+y*y,0,q.id);eq(a*y,numeric(answer),q.id);}
 }
 if(q.topic==='hyperbola'&&q.difficulty==='hard'){
  if(v)for(const t of [.1,.5,1,2]){const x=Math.cosh(t),y=a*Math.sinh(t);eq(Math.abs(y-a*x)*Math.abs(y+a*x)/(a*a+1),numeric(answer),q.id);}
  else{const x=a*Math.sqrt((a*a+2)/(a*a+1)),y=1/Math.sqrt(a*a+1),c=Math.sqrt(a*a+1);eq((x+c)*(x-c)+y*y,0,q.id);eq(Math.hypot(x+c,y)*Math.hypot(x-c,y),numeric(answer),q.id);}
 }
 if(q.topic==='parabola'&&q.difficulty==='hard'){
  if(v){const m=1/Math.sqrt(3),r1=2*a/(1-m),r2=2*a/(1+m);eq(Math.max(r1,r2)/Math.min(r1,r2),2+Math.sqrt(3),q.id);const cos=.5,FA=2*a/(1-cos),FB=2*a/(1+cos);eq(FA/FB,3,q.id);eq(FA+FB,numeric(answer),q.id);}
  else{const k=numeric(answer),S=4*a/k,P=8*a*a/k,D=S*S-4*P,y1=(S+Math.sqrt(D))/2,y2=(S-Math.sqrt(D))/2,x1=y1*y1/(4*a),x2=y2*y2/(4*a);eq(y1,k*x1+2*a,q.id);eq(y2,k*x2+2*a,q.id);eq((x1-a)*(x2-a)+y1*y2,0,q.id);}
 }
 if(q.topic==='space'&&q.difficulty==='hard'){
  if(v){const m=Math.sqrt(2*(a*a+2)/(3*a*a-2));eq(a*m/(Math.hypot(1,1,a)*Math.hypot(1,-1,m)),.5,q.id);}
  else{let min=Infinity;for(let j=-10000;j<=10000;j++){const t=a*j/10000;min=Math.min(min,a*a+t*t-(a+t)**2/3);}eq(min,a*a/2,q.id);}
 }
 if(q.topic==='solid'&&q.difficulty==='hard'&&v){let max=0;for(let j=0;j<=30000;j++){const h=2*a*j/30000,r=a-h/2;max=Math.max(max,Math.PI*r*r*h);}eq(max,8*Math.PI*a**3/27,q.id);}
 if(q.topic==='counting'&&q.difficulty==='hard'){
  if(v){let coeff=[1];for(let i=0;i<a+8;i++){const next=Array(coeff.length+1).fill(0);coeff.forEach((x,j)=>{next[j]+=x;next[j+1]+=x;});coeff=next;}eq(numeric(answer),coeff[4]-2*coeff[3]+coeff[2],q.id);}
  else{let count=0;for(let i=1;i<=a+7;i++)for(let j=i+2;j<=a+7;j++)for(let k=j+2;k<=a+7;k++)for(let l=k+2;l<=a+7;l++)count++;eq(numeric(answer),count,q.id);}
 }
 if(q.topic==='probability'&&q.difficulty==='hard'){
  if(v){const n=a+3;let yes=0;for(let i=1;i<=n;i++)for(let j=1;j<=n;j++)if(i!==j&&(Number(i===1)+Number(j===2)===1))yes++;eq(numeric(answer),yes/(n*(n-1)),q.id);}
  else{let condition=0,yes=0;for(let i=0;i<a+3;i++)for(let j=i+1;j<a+3;j++)for(let k=j+1;k<a+3;k++){const reds=[i,j,k].filter(x=>x<3).length;if(reds)condition++;if(reds===2)yes++;}eq(numeric(answer),yes/condition,q.id);}
 }
 if(q.topic==='conditional'&&q.difficulty==='hard'){
  if(v){let condition=0,yes=0;for(const red of [2,a])for(let i=0;i<a+2;i++)for(let j=0;j<a+2;j++)for(let k=0;k<a+2;k++)if(i!==j&&i!==k&&j!==k&&i<red&&j<red){condition++;if(k<red)yes++;}eq(numeric(answer),yes/condition,q.id);}
  else{const population=100*a,infected=10,positiveSick=infected*.9,positiveHealthy=(population-infected)*.1;eq(numeric(answer),positiveSick/(positiveSick+positiveHealthy),q.id);}
 }
 if(q.topic==='random-variable'&&q.difficulty==='hard'){
  if(v){const count=[0,0,0];let total=0;for(let i=0;i<2*a;i++)for(let j=i+1;j<2*a;j++){count[Number(i<a)+Number(j<a)]++;total++;}const mean=count.reduce((t,c,x)=>t+c*x*x/total,0),second=count.reduce((t,c,x)=>t+c*x**4/total,0);eq(numeric(answer),second-mean*mean,q.id);}
  else{const n=a+2,p=2/(n+1);let distribution=[1];for(let i=0;i<n;i++){const next=Array(distribution.length+1).fill(0);distribution.forEach((x,j)=>{next[j]+=x*(1-p);next[j+1]+=x*p;});distribution=next;}eq(distribution[1],distribution[2],q.id);eq(numeric(answer),distribution.reduce((t,c,x)=>t+c*x*(x-1),0),q.id);}
 }
 if(q.topic==='statistics'&&q.difficulty==='hard'){
  if(v){const pts=[[0,0],[1,a],[2,0],[3,a]];let min=Infinity;for(let j=-1000;j<=1000;j++){const b=a*j/1000,c=a/2-1.5*b;min=Math.min(min,pts.reduce((t,[x,y])=>t+(y-b*x-c)**2,0));}eq(numeric(answer),min,q.id);}
  else{const n=a+3,values=Array(n).fill(2);values[0]+=Math.sqrt(2*n);values[1]-=Math.sqrt(2*n);values.push(n+3);const mean=values.reduce((x,y)=>x+y)/values.length;eq(mean,3,q.id);eq(numeric(answer),values.reduce((t,x)=>t+(x-mean)**2,0)/values.length,q.id);}
 }
 if(q.topic==='derivative'&&q.difficulty==='hard'){
  if(v){const f=x=>2/x**2-x*x,h=1e-4;eq(numeric(answer),(f(a+h)-f(a-h))/(2*h),q.id);for(const x of [.5,1,2,a])eq(f(x)+2*f(1/x),3*x*x,q.id);}
  else for(const b of [-1,0,a**4/6,a**4/3,a**4/3+1]){
   const D=4*a**4-12*b,us=D<-1e-7?[]:Math.abs(D)<1e-7?[a*a/3]:[(2*a*a-Math.sqrt(D))/6,(2*a*a+Math.sqrt(D))/6];const lines=[];
   for(const u of us.filter(x=>x>=0))for(const t of u===0?[0]:[Math.sqrt(u),-Math.sqrt(u)]){const slope=4*t**3-4*a*a*t;if(!lines.some(l=>Math.abs(l-slope)<1e-6))lines.push(slope);eq(t**4-2*a*a*t*t-slope*t,b,q.id);}
   assert.equal(lines.length===4,b>0&&b<a**4/3,q.id);
  }
 }
 if(q.topic==='derivative-use'&&q.difficulty==='hard'){
  if(v)for(const m of [-1,0,Math.exp(-a-1)*.5,Math.exp(-a-1),Math.exp(-a-1)*2]){const roots=m<=0?1:-Math.log(m)-1>a+1e-8?2:Math.abs(-Math.log(m)-1-a)<1e-8?1:0;assert.equal(roots===2,m>0&&m<Math.exp(-a-1),q.id);}
  else for(const m of [-2*a**3-1,-2*a**3,0,2*a**3,2*a**3+1]){const h=x=>x**3-3*a*a*x-m;const intervals=[[-2*a,-a],[-a,a],[a,2*a]];const roots=intervals.filter(([x,y])=>h(x)*h(y)<0).length;assert.equal(roots===3,Math.abs(m)<2*a**3,q.id);}
 }
 if(q.topic==='integral')for(const x of [.5,1,2,3]){
  let primitive,integrand;
  if(q.difficulty==='easy'){primitive=v?t=>Math.exp(a*t)/a:t=>t**(a+1)/(a+1);integrand=v?Math.exp(a*x):x**a;}
  else if(q.difficulty==='medium'){primitive=v?t=>Math.sin(a*t+1)/a:t=>Math.log(t*t+a);integrand=v?Math.cos(a*x+1):2*x/(x*x+a);}
  else{primitive=v?t=>Math.log(t)-Math.log(1+t**a)/a:t=>t*t/2-a*Math.log(t*t+a)/2;integrand=v?1/(x*(1+x**a)):x**3/(x*x+a);}
  const h=1e-5;eq((primitive(x+h)-primitive(x-h))/(2*h),integrand,q.id);
 }
}
console.log(`PASS: ${all.length} questions, ${families.size} families, ${formulas} LaTeX expressions; schema, offline scripts and independent boundary/numerical audits.`);
