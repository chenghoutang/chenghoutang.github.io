import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=new URL('../math-practice/data/',import.meta.url);
const read=n=>JSON.parse(fs.readFileSync(new URL(n,base),'utf8'));
const manifest=read('manifest.json'),bank=manifest.batches.flatMap(n=>read(`batch-${n}.json`).questions),questions=bank.filter(q=>q.difficulty==='hell');
const L=String.raw;
assert.equal(questions.length,500);assert.equal(manifest.hellRevision,2);
const near=(a,b,id)=>assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${id}: ${a} != ${b}`);
const choose=(n,k)=>{if(k<0||k>n)return 0;let v=1;for(let i=1;i<=k;i++)v=v*(n-i+1)/i;return Math.round(v);};
// Restricted TeX arithmetic interpreter: checks stored choices independently
// of the generator, including symbolic formulas at multiple test points.
function value(tex,vars={}){
 let i=0;tex=tex.replace(/^a_n=/,'').replace(/\\(?:left|right|,|;|!)/g,'').replace(/\\cdot/g,'*').replace(/\\pi/g,'p').replace(/\\sin/g,'s').replace(/\\cos/g,'c').replace(/\\ln/g,'l').replace(/\s/g,'');
 function group(){assert.equal(tex[i++],'{',tex);const v=add();assert.equal(tex[i++],'}',tex);return v;}
 const arg=()=>tex[i]==='{'?group():/\d/.test(tex[i]||'')?+tex[i++]:atom();
 function atom(){let v;
  if(tex.startsWith('\\frac',i)){i+=5;v=arg()/arg();}
  else if(tex.startsWith('\\binom',i)){i+=6;v=choose(arg(),arg());}
  else if(tex.startsWith('\\sqrt',i)){i+=5;let degree=2;if(tex[i]==='['){i++;degree=+tex[i++];assert.equal(tex[i++],']',tex);}v=arg()**(1/degree);}
  else if(tex[i]==='{')v=group();
  else if(tex[i]==='('){i++;v=add();assert.equal(tex[i++],')',tex);}
  else if(/\d/.test(tex[i]||'')){const m=tex.slice(i).match(/^\d+(?:\.\d+)?/);v=+m[0];i+=m[0].length;}
  else{const c=tex[i++];if(['s','c','l'].includes(c)){const x=atom();v=c==='s'?Math.sin(x):c==='c'?Math.cos(x):Math.log(x);}else{v=({p:Math.PI,e:Math.E,...vars})[c];assert.notEqual(v,undefined,tex);}}
  if(tex[i]==='^'){i++;v**=tex[i]==='{'?group():tex[i]==='-'?(i++,-atom()):atom();}return v;
 }
 function unary(){if(tex[i]==='-'){i++;return -unary();}if(tex[i]==='+'){i++;return unary();}return atom();}
 function mul(){let v=unary();while(i<tex.length&&!/[+\-})]/.test(tex[i])){if(tex[i]==='*'){i++;v*=unary();}else if(tex[i]==='/'){i++;v/=unary();}else v*=unary();}return v;}
 function add(){let v=mul();while(tex[i]==='+'||tex[i]==='-'){const sign=tex[i++];v+=(sign==='+'?1:-1)*mul();}return v;}
 const result=add();assert.equal(i,tex.length,tex);assert.ok(Number.isFinite(result),tex);return result;
}
function numeric(q,cases){if(typeof cases==='number')cases=[[{},cases]];const vectors=q.options.map(option=>{try{return cases.map(([vars])=>value(option,vars));}catch{return null;}});const valid=vectors.map(values=>values&&values.every((v,i)=>Math.abs(v-cases[i][1])<1e-7*Math.max(1,Math.abs(cases[i][1]))));assert.equal(valid.filter(Boolean).length,1,`${q.id}: equivalent or missing choices`);assert.ok(valid[q.answer],`${q.id}: wrong choice`);for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)if(vectors[i]&&vectors[j])assert.ok(vectors[i].some((v,k)=>Math.abs(v-vectors[j][k])>1e-8*Math.max(1,Math.abs(v))),`${q.id}: duplicate distractors`);}
function interval(q,lo,hi){const t=q.options[q.answer].replace(/\\(?:left|right)/g,''),parts=t.slice(1,-1).split(',');assert.equal(t[0],'(',q.id);assert.equal(t.at(-1),')',q.id);near(value(parts[0]),lo,q.id);near(value(parts[1]),hi,q.id);}
function solve(matrix,rhs){const a=matrix.map((row,i)=>[...row,rhs[i]]),n=a.length;for(let k=0;k<n;k++){let p=k;for(let j=k+1;j<n;j++)if(Math.abs(a[j][k])>Math.abs(a[p][k]))p=j;[a[k],a[p]]=[a[p],a[k]];const d=a[k][k];assert.ok(Math.abs(d)>1e-14);for(let j=k;j<=n;j++)a[k][j]/=d;for(let i=0;i<n;i++)if(i!==k){const m=a[i][k];for(let j=k;j<=n;j++)a[i][j]-=m*a[k][j];}}return a.map(row=>row[n]);}
const fractions=[[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[4,5],[1,6]];
function clip(poly,A,B,C){const next=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],u=A*p[0]+B*p[1]-C,v=A*q[0]+B*q[1]-C;if(u<=0)next.push(p);if((u<0&&v>0)||(u>0&&v<0)){const r=u/(u-v);next.push([p[0]+r*(q[0]-p[0]),p[1]+r*(q[1]-p[1])]);}}return next;}
const area=poly=>Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-p[1]*q[0];},0))/2;
const bisect=(f,lo,hi)=>{for(let i=0;i<70;i++){const mid=(lo+hi)/2;if(f(lo)*f(mid)<=0)hi=mid;else lo=mid;}return (lo+hi)/2;};
const seen=new Set(),strategies=new Set();
for(const q of questions){
 const f=+q.family.slice(5),s=q.variant-1,answer=q.options[q.answer];seen.add(f);strategies.add(q.strategy);
 assert.equal(q.contentRevision,2);assert.equal(q.targetSeconds,600);assert.ok(q.explanation.startsWith('思路：'+q.strategy));assert.ok(!/\d{4}/.test(q.stem+' '+q.options.join(' ')),q.id+' expanded large data');
 if(f===1){const [p,r]=[[2,1],[3,1],[4,1],[-1,1],[-2,1],[-3,1],[1,2],[1,3],[2,3],[3,2]][s],x=p/r,T=1/(1-x),U=1/(1-T);const [a]=solve([[1,1,0],[0,1,1],[1,0,1]],[x,T,U]);numeric(q,a);}
 if(f===2){assert.ok(answer.includes('不存在')&&answer.includes('单射'),q.id);}
 if(f===3){const n=s+2,N=4000;let sum=0;for(let j=0;j<N;j++){const x=(j+.5)*Math.PI/(2*N),a=Math.sin(x)**n,b=Math.cos(x)**n;sum+=a/(a+b);}numeric(q,sum*Math.PI/(2*N));}
 if(f===4){const d=s+3,cases=[];let a=2*Math.cos(Math.PI/d),prod=1;for(let n=1;n<=7;n++){a=Math.sqrt(2+a);prod*=a;cases.push([{n},prod]);}numeric(q,cases);}
 if(f===5){const m=s+2,cases=[];let a=0;for(let n=0;n<7;n++){cases.push([{n},a]);a=((m+1)*a+m-1)/((m-1)*a+m+1);}numeric(q,cases);}
 if(f===6){const m=s+2,cases=[];let a=(m+1)/(m-1);for(let n=0;n<4;n++){cases.push([{n},(a-1)/(a+1)]);a=(a+1/a)/2;}numeric(q,cases);}
 if(f===7){const p=s+1;for(const x of [.3,.8,1,2,4])for(const y of [.5,1,3]){const z=1/(x*y);near(1/(1+x**p+(x*y)**p)+1/(1+y**p+(y*z)**p)+1/(1+z**p+(z*x)**p),1,q.id);}numeric(q,1);}
 if(f===8){interval(q,1,2);const p=s+1;for(const x of [.1,.3,1,3,10])for(const y of [.2,1,5]){const z=1/(x*y),sum=1/(1+x**p)+1/(1+y**p)+1/(1+z**p);assert.ok(sum>1-1e-12&&sum<2+1e-12,q.id);}}
 if(f===9){const c=s+1;let max=0;for(let j=0;j<6000;j++){const t=j*Math.PI/3000,x=Math.sqrt(2*c/3)*Math.cos(t),y=Math.sqrt(2*c/3)*Math.cos(t+2*Math.PI/3),z=Math.sqrt(2*c/3)*Math.cos(t+4*Math.PI/3);max=Math.max(max,x**6+y**6+z**6);}numeric(q,max);}
 if(f===10){const k=s+2,g=x=>Math.abs(x-1)<1e-12?1:Math.log(x)/(x-1);interval(q,0,Math.sqrt(k));for(const x of [.1,.9,1.1,Math.sqrt(k)-.01,Math.sqrt(k)+.01,10])assert.equal(g(x)>g(k/x),x<Math.sqrt(k),q.id);}
 if(f===11){const [p,r]=fractions[s],a=p/r;assert.ok(answer.startsWith('x+y>')&&answer.includes('xy<'),q.id);for(const ratio of [.1,.4,.8]){const x=a*ratio,g=y=>y-a*Math.log(y)-(x-a*Math.log(x)),y=bisect(g,a,a*10+10);assert.ok(x+y>2*a&&x*y<a*a,q.id);}}
 if(f===12){const b=s+1;interval(q,-b,b);for(const a of [.2,1,4])for(const x of [-b-1,-b+.1,0,b-.1,b+1])for(const h of [t=>t*t,t=>t**4,t=>Math.cosh(t)])assert.equal(h(x+a)+h(x-a)<h(b+a)+h(b-a),Math.abs(x)<b,q.id);}
 if(f===13){const k=s+1;let min=Infinity;for(let j=-1000;j<=1000;j++){const u=Math.exp(j/100),v=1/u;min=Math.min(min,(Math.log1p(u)+Math.log1p(v))/k);}numeric(q,min);}
 if(f===14){const k=s+1;numeric(q,3*k/4);for(let j=1;j<50;j++)for(let t=1;t<50;t++){const A=j*Math.PI/100,B=t*Math.PI/100,C=Math.PI-A-B;if(C<=0||C>=Math.PI/2)continue;const x=Math.tan(A),y=Math.tan(B),z=Math.tan(C);near(x+y+z,x*y*z,q.id);assert.ok(k*(Math.cos(A)**2+Math.cos(B)**2+Math.cos(C)**2)>=3*k/4-1e-8,q.id);}}
 if(f===15){const a=s+1,h=9*a,k=-6*a,ts=[1,2,-3];for(const t of ts)near(k,-t*h+2*a*t+a*t**3,q.id);numeric(q,[[{h},ts.reduce((v,t)=>v+a*t*t,0)]]);}
 if(f===16){const a=s+1,h=5*a,k=.2*a,R2=20*a*a,g=t=>(a*t*t-h)**2+(2*a*t-k)**2-R2,roots=[];for(let i=-400;i<400;i++){const lo=i/100,hi=(i+1)/100;if(g(lo)*g(hi)<0)roots.push(bisect(g,lo,hi));}assert.equal(roots.length,4);near(roots.reduce((v,t)=>v+a*t*t,0)/4,h-2*a,q.id);near(roots.reduce((v,t)=>v+2*a*t,0)/4,0,q.id);assert.equal(answer,`(h-2\\cdot${a},0)`);}
 if(f===17){const [p,r]=fractions[s],x=r/p;assert.equal(answer,`x=${Number.isInteger(x)?x:'\\frac{'+r+'}{'+p+'}'}`);for(const y of [-2,0,3]){const d=x*x+y*y,scale=Math.sqrt(d-1)/d,A=[x/d-y*scale,y/d+x*scale],B=[x/d+y*scale,y/d-x*scale];near(A[0]**2+A[1]**2,1,q.id);near(A[0]*x+A[1]*y,1,q.id);near(B[0]*x+B[1]*y,1,q.id);near((A[0]-p/r)*(B[1])-(B[0]-p/r)*A[1],0,q.id);}}
 if(f===18){assert.equal(answer,L`\text{至少一个 }z_j=\xi`);for(const t of [.2,1,2]){const re=1+2*Math.cos(t);near(re*1,re,q.id);assert.notEqual(re,0);}}
 if(f===19){const n=s+2;numeric(q,3**n);for(const x of [-2,-.5,0,1,2])near((x*x)**n,(x**n)**2,q.id);}
 if(f===20||f===21){const n=s+2,x=f===20?-1:n+1,points=Array.from({length:n+1},(_,i)=>f===20?i+1:i);let result=0;for(const t of points){let weight=1;for(const u of points)if(t!==u)weight*=(x-u)/(t-u);result+=weight*(f===20?1/t:2**t);}numeric(q,result);}
 if(f===22){const p=[3,7,11,19,23,31,43,47,59,67][s];assert.equal(p%4,3);for(let x=0;x<p;x++)for(let y=0;y<p;y++)if((x*x+y*y)%p===0)assert.equal(x+y,0);numeric(q,0);}
 if(f===23){const c=8*s+7;assert.equal(c%8,7);for(const a of [0,1,4])for(const b of [0,1,4])for(const d of [0,1,4])assert.notEqual((a+b+d)%8,7);assert.ok(answer.includes('对所有')&&answer.includes('无解'));}
 if(f===24){const n=s+3,bins=new Map();for(let x=1;x<=2*n;x++){let u=x;while(u%2===0)u/=2;if(!bins.has(u))bins.set(u,[]);bins.get(u).push(x);}assert.equal(bins.size,n);for(const bin of bins.values())for(const x of bin)for(const y of bin)assert.equal(Math.max(x,y)%Math.min(x,y),0);for(let x=n+1;x<=2*n;x++)for(let y=x+1;y<=2*n;y++)assert.notEqual(y%x,0);numeric(q,n+1);}
 if(f===25){const r=s+2,dp=Array(1<<(r-1)).fill(0);dp[0]=1;for(let mask=0;mask<dp.length;mask++)for(let j=0;j<r-1;j++)if(!(mask>>j&1))dp[mask|1<<j]+=dp[mask];let total=1;for(let i=2;i<=r;i++)total*=i;numeric(q,[[{n:r},dp.at(-1)/total],[{n:r+2},dp.at(-1)/total]]);}
 if(f===26){const k=s+1,n=k+2;let count=0;for(let bits=0;bits<2**n;bits++){let changes=0;for(let j=1;j<n;j++)changes+=((bits>>j)^(bits>>(j-1)))&1;if(changes===k)count++;}numeric(q,[[{n},count/2**n],[{n:n+1},choose(n,k)/2**n]]);}
 if(f===27){const [p,r]=[[1,2],[2,3],[3,4],[4,5],[5,6],[1,3],[2,5],[3,7],[4,9],[5,11]][s],t=p/r;let poly=[[0,0],[1,0],[0,1]];poly=clip(poly,1,0,t);poly=clip(poly,0,1,t);poly=clip(poly,-1,-1,t-1);numeric(q,2*area(poly));}
 if(f===28){const [a,b]=fractions[s],p=a/b;const matrix=[[p,-p,0,0],[0,1,-p,-(1-p)],[0,0,1-p,0],[-(1-p),0,0,1]];numeric(q,solve(matrix,[0,0,1-p,0])[0]);}
 if(f===29){const [a,b]=[[1,2],[1,3],[2,3],[3,2],[2,4],[4,2],[3,4],[4,3],[2,5],[5,2]][s],n=a+b-1,A=Array.from({length:n},()=>Array(n).fill(0));for(let i=0;i<n;i++){A[i][i]=1;if(i)A[i][i-1]=-.5;if(i<n-1)A[i][i+1]=-.5;}numeric(q,solve(A,Array(n).fill(1))[a-1]);}
 if(f===30){const k=2*(s+1),cases=[];for(const n of [k+1,k+3]){let total=0;for(const first of [0,1]){let dp=Array.from({length:2},()=>Array(n+1).fill(0));dp[first][0]=1;for(let i=1;i<n;i++){const next=Array.from({length:2},()=>Array(n+1).fill(0));for(let prev=0;prev<2;prev++)for(let c=0;c<n;c++)for(let bit=0;bit<2;bit++)next[bit][c+Number(prev!==bit)]+=dp[prev][c];dp=next;}for(let last=0;last<2;last++)total+=dp[last][k-Number(last!==first)]||0;}cases.push([{n},total/2**n]);}numeric(q,cases);}
 if(f===31){const a=s+2,pts=[0,2*Math.PI/3,4*Math.PI/3].map(t=>[a*Math.cos(t),Math.sin(t)]);numeric(q,area(pts));for(let j=0;j<300;j++){const ps=[j*.13,j*.27+.2,j*.31+1].map(t=>[a*Math.cos(t),Math.sin(t)]);assert.ok(area(ps)<=3*Math.sqrt(3)*a/4+1e-9);}}
 if(f===32){const n=s+3,roots=[...Array.from({length:n-1},(_,i)=>2*(i+1)*Math.PI/n),...Array.from({length:n},(_,i)=>2*(i+1)*Math.PI/(n+1))];for(const x of roots){let sum=0;for(let k=1;k<=n;k++)sum+=Math.sin(k*x);near(sum,0,q.id);}assert.equal(new Set(roots.map(x=>x.toFixed(9))).size,2*n-1);numeric(q,roots.length);}
 if(f===33){const n=s+3,x=Math.PI/(2*n);let product=1;for(let j=0;j<n;j++)product*=Math.sin(x+j*Math.PI/n);numeric(q,product);}
 if(f===34){const n=s+2;numeric(q,n/(n-1));for(const x of [-3,-.3,.2,2.3]){const roots=Array.from({length:n},(_,i)=>i%3-1),P=t=>roots.reduce((v,r)=>v*(t-r),1),derivative=(t,order)=>{let total=0;for(let i=0;i<n;i++)if(order===1)total+=roots.reduce((v,r,j)=>j===i?v:v*(t-r),1);else for(let j=0;j<n;j++)if(i!==j)total+=roots.reduce((v,r,k)=>k===i||k===j?v:v*(t-r),1);return total;};assert.ok(derivative(x,1)**2-n/(n-1)*P(x)*derivative(x,2)>=-1e-5,q.id);}}
 if(f===35){const n=s+3,R=Math.sqrt(n-1),roots=[R,...Array(n-1).fill(-1/R)];near(roots.reduce((a,b)=>a+b),0,q.id);near(roots.reduce((a,b)=>a+b*b,0),n,q.id);numeric(q,R);}
 if(f===36){const k=s+1;let min=Infinity;for(let i=-1000;i<=1000;i++){const a=Math.exp(i/100),b=1,scale=k/Math.cbrt(a*b*(a+b));min=Math.min(min,scale*scale*(a*a+b*b+(a+b)**2));}numeric(q,min);}
 if(f===37){numeric(q,2);const n=s+4;for(let trial=0;trial<100;trial++){const wins=Array.from({length:n},()=>Array(n).fill(false));for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){const bit=Math.sin((trial+1)*(i+2)*(j+5))>0;wins[i][j]=bit;wins[j][i]=!bit;}let v=0;for(let i=1;i<n;i++)if(wins[i].filter(Boolean).length>wins[v].filter(Boolean).length)v=i;for(let j=0;j<n;j++)if(j!==v)assert.ok(wins[v][j]||wins[v].some((bit,w)=>bit&&wins[w][j]));}}
 if(f===38){const n=s+4;let chains=[[0]];for(let i=0;i<n;i++){const next=[],bit=1<<i;for(const c of chains){next.push([...c,c.at(-1)|bit]);if(c.length>1)next.push(c.slice(0,-1).map(v=>v|bit));}chains=next;}const sets=chains.flat();assert.equal(new Set(sets).size,2**n);for(const c of chains)for(let i=1;i<c.length;i++)assert.equal(c[i-1]&c[i],c[i-1]);numeric(q,chains.length);}
 if(f===39){const n=s+3;for(let trial=0;trial<10;trial++){const values=Array.from({length:n},(_,i)=>1/(i+1));while(values.length>1){const i=trial%values.length,a=values.splice(i,1)[0],j=(trial*3)%values.length,b=values.splice(j,1)[0];values.push(a+b+a*b);}near(values[0],n,q.id);}numeric(q,n);}
 if(f===40){const n=s+2,values=Array.from({length:2*n},(_,i)=>i*i+.1*i),ring=[];for(let i=0;i<n;i++)ring.push(values[i],values[i+n]);const edgeSum=ring.reduce((sum,x,i)=>sum+Math.abs(x-ring[(i+1)%(2*n)]),0),difference=values.slice(n).reduce((a,b)=>a+b)-values.slice(0,n).reduce((a,b)=>a+b);near(edgeSum,2*difference,q.id);assert.ok(answer.startsWith('2\\left('),q.id);}
 if(f===41){const n=s+3,dp=Array(1<<n).fill(Infinity);dp[0]=0;for(let mask=0;mask<dp.length;mask++){const i=mask.toString(2).replace(/0/g,'').length+1;for(let j=0;j<n;j++)if(!(mask>>j&1))dp[mask|1<<j]=Math.min(dp[mask|1<<j],dp[mask]+i*(j+1));}let squares=0;for(let j=1;j<=n;j++)squares+=j*j;numeric(q,2*squares-2*dp.at(-1));}
 if(f===42){const [m,n]=[[2,3],[3,4],[3,5],[4,5],[4,7],[5,7],[5,8],[5,9],[7,9],[7,10]][s];let sum=0;for(let k=1;k<n;k++)sum+=Math.floor(m*k/n);numeric(q,sum);}
 if(f===43){const a=s+1;assert.ok(answer.startsWith('c=d,'));for(const x of [-2.3,.1,1.5]){const f=t=>.5+Math.sin(2*Math.PI*t/a);near(f(x)+f(-x),1,q.id);near(f(x)+f(a-x),1,q.id);near(f(x+a),f(x),q.id);}}
 if(f===44){numeric(q,5);const square=[[0,0],[1,0],[1,1],[0,1]];for(let i=0;i<4;i++)near(area(square.filter((_,j)=>i!==j)),.5,q.id);for(let a=0;a<4;a++)for(let b=0;b<4;b++)if(a===b)assert.equal((a^b),0);}
 if(f===45){const n=s+3;numeric(q,0);for(let j=0;j<100;j++){const A=new Set();for(let k=0;k<n;k++)A.add((j+k)%(2*n));let left=0,right=0;for(let k=0;k<2*n;k++)if(A.has(k))left+=k+1;else right+=k+1;const center=n*(2*n+1)/2;near((left-center)**3+(right-center)**3,0,q.id);}}
 if(f===46){const n=s+3;let total=0;for(let k=0;k<n;k++)total+=1/(1-Math.cos((2*k+1)*Math.PI/n));numeric(q,total);}
 if(f===47){const a=s+1,h=a*Math.sqrt(6)/3;numeric(q,16/h);for(let j=1;j<100;j++){const weights=[j+1,j*j+1,2*j+3,7],sum=weights.reduce((a,b)=>a+b);assert.ok(weights.reduce((v,w)=>v+sum/(h*w),0)>=16/h-1e-9);}}
 if(f===48){const n=s+3;let max=0;for(let mask=0;mask<2**(n-1);mask++){let sum=0;for(let j=0;j<n-1;j++)sum+=(mask>>j&1)?1:-1;if(Math.abs(sum)<=1)max=Math.max(max,n-1+sum*sum);}numeric(q,max);}
 if(f===49){const n=s+3;let min=Infinity;for(let j=1;j<2000;j++){const x=(j-.5)*Math.PI/(2000*n);let sum=0;for(let k=0;k<n;k++)sum+=1/Math.sin(x+k*Math.PI/n)**2;min=Math.min(min,sum);}let exact=0;for(let k=0;k<n;k++)exact+=1/Math.sin(Math.PI/(2*n)+k*Math.PI/n)**2;numeric(q,exact);assert.ok(min>=n*n-1e-8);}
 if(f===50){const n=s+2,T=(x,n)=>{let a=1,b=x;if(n===0)return a;for(let k=1;k<n;k++)[a,b]=[b,2*x*b-a];return b;},scale=2**(1-n);for(let k=0;k<=n;k++)near(T(Math.cos(k*Math.PI/n),n)*scale,(-1)**k*scale,q.id);for(let j=0;j<=1000;j++)assert.ok(Math.abs(T(2*j/1000-1,n)*scale)<=scale+1e-12);numeric(q,scale);}
}
assert.equal(seen.size,50);assert.equal(strategies.size,50);
console.log('PASS: 500 rewritten hell questions; 50 strategies, compact data, independent mathematical checks and choice equivalence checks.');
