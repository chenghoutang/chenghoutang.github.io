import assert from 'node:assert/strict';
import fs from 'node:fs';
const folder=new URL('../math-practice/data/',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',folder),'utf8'));
const questions=manifest.batches.flatMap(n=>JSON.parse(fs.readFileSync(new URL(`batch-${n}.json`,folder),'utf8')).questions).filter(q=>q.difficulty==='hell');
// Small arithmetic TeX evaluator used only by the checker. No evaluated text
// comes from visitors; supported operators cover these generated options.
function evaluate(tex,variables={}){
 let i=0;tex=tex.replace(/\\(?:left|right|,|;|!)/g,'').replace(/\\cdot/g,'*').replace(/\\pi/g,'p').replace(/\\ln/g,'l').replace(/\\sin/g,'s').replace(/\\cos/g,'c').replace(/\s/g,'').replace(/\+C$/,'');
 function group(){if(tex[i]!=='{')throw Error('Expected group: '+tex.slice(i));i++;const v=add();assert.equal(tex[i++],'}',tex);return v;}
 function argument(){return tex[i]==='{'?group():/\d/.test(tex[i]||'')?Number(tex[i++]):atom();}
 function atom(){let value;if(tex.startsWith('\\frac',i)){i+=5;value=argument()/argument();}else if(tex.startsWith('\\sqrt',i)){i+=5;value=Math.sqrt(argument());}else if(tex[i]==='{')value=group();else if(tex[i]==='('){i++;value=add();assert.equal(tex[i++],')',tex);}else if(/[0-9.]/.test(tex[i]||'')){const m=tex.slice(i).match(/^\d+(?:\.\d+)?/);value=+m[0];i+=m[0].length;}else{const c=tex[i++];if(c==='l'||c==='s'||c==='c'){const inner=atom();value=c==='l'?Math.log(inner):c==='s'?Math.sin(inner):Math.cos(inner);}else{value=({e:Math.E,p:Math.PI,...variables})[c];assert.ok(value!==undefined,`Unknown atom ${c}: ${tex}`);}}
 if(tex[i]==='^'){i++;const power=tex[i]==='{'?group():Number(tex[i++]);value**=power;}return value;}
 function unary(){if(tex[i]==='+'){i++;return unary();}if(tex[i]==='-'){i++;return -unary();}return atom();}
 function product(){let v=unary();while(i<tex.length&&!/[+\-})]/.test(tex[i])){if(tex[i]==='*'){i++;v*=unary();}else if(tex[i]==='/'){i++;v/=unary();}else v*=unary();}return v;}
 function add(){let v=product();while(tex[i]==='+'||tex[i]==='-'){const sign=tex[i++];v+= (sign==='+'?1:-1)*product();}return v;}
 const value=add();assert.equal(i,tex.length,tex);assert.ok(Number.isFinite(value),tex);return value;
}
const close=(x,y)=>Math.abs(x-y)<2e-6*Math.max(1,Math.abs(y));
const near=(x,y,id)=>assert.ok(close(x,y),`${id}: ${x} != ${y}`);
function single(q,expected){const tolerance=Number.isInteger(expected)?.1:2e-7*Math.max(1e-30,Math.abs(expected));const valid=q.options.map(t=>Math.abs(evaluate(t)-expected)<tolerance);assert.equal(valid.filter(Boolean).length,1,q.id+' equivalent options');assert.ok(valid[q.answer],q.id+' wrong answer');}
function interval(q,lo,hi,closedLo=false,closedHi=false){const text=q.options[q.answer].replace(/\\(?:left|right)/g,'');assert.equal(text[0],closedLo?'[':'(',q.id);assert.equal(text.at(-1),closedHi?']':')',q.id);const parts=text.slice(1,-1).split(',');near(evaluate(parts[0]),lo,q.id);if(hi===Infinity)assert.equal(parts[1],'+\\infty',q.id);else near(evaluate(parts[1]),hi,q.id);}
const unique=values=>values.filter((v,i)=>values.findIndex(w=>Math.abs(w-v)<1e-7*Math.max(1,Math.abs(v)))===i);
for(const q of questions){const f=+q.family.slice(5),a=q.variant+1;
 if(f===1||f===2){const upper=f===1?a*a:a**8;interval(q,0,upper);for(const m of [-1,0,upper/4,upper,upper*1.5]){
  let us=[];if(m>=0){if(f===1){for(const v of unique([a*a+m,a*a-m]).filter(v=>v>=0))us.push(...unique([4*a*a+v,4*a*a-v]));}else for(const t2 of unique([a**4+Math.sqrt(m),a**4-Math.sqrt(m)]).filter(v=>v>=0))for(const t of unique([Math.sqrt(t2),-Math.sqrt(t2)]))us.push(4*a*a+t);}
  const roots=unique(us).reduce((n,u)=>n+(u>1e-7?2:Math.abs(u)<1e-7?1:0),0);assert.equal(roots===8,m>0&&m<upper,q.id);
 }}
 if(f===3){interval(q,2/a-1,1/a**2);for(const m of [2/a-1-.001,2/a-1,(2/a-1+1/a**2)/2,1/a**2,1/a**2+.001]){const D=1/a**2-m,ts=D<0?[]:D<1e-10?[1/a]:[1/a-Math.sqrt(D),1/a+Math.sqrt(D)];const roots=ts.reduce((n,t)=>n+(Math.abs(t)>1+1e-8?0:Math.abs(Math.abs(t)-1)<1e-8?2:4),0);assert.equal(roots===8,m>2/a-1+1e-9&&m<1/a**2-1e-9,q.id);}}
 if(f===4){let max=0;for(let j=0;j<40000;j++){const t=j*Math.PI/20000;max=Math.max(max,(a+Math.sin(t))/(a+Math.cos(t)));}single(q,max);}
 if(f===5){let max=-Infinity;for(let j=-1000;j<=1000;j++){const x=Math.exp(a+.5+j/1000);max=Math.max(max,(Math.log(x)-a)/x**2);}single(q,max);}
 if(f===6){const h=x=>x**3-3*a*a*x,edge=7*a/4;interval(q,h(-edge),h(edge));for(const m of [-(a**3),0,a**3]){const count=[[-edge,-a],[-a,a],[a,edge]].filter(([l,r])=>(h(l)-m)*(h(r)-m)<0).length;assert.equal(count===3,m>h(-edge)&&m<h(edge),q.id);}}
 if(f===7){interval(q,Math.log(a)-.5,Infinity);for(const t of [a/2,a,a*2]){const b=Math.log(t)-1+a*a/(2*t*t),u=a*a/t;near(Math.log(t)-t/t,b+u*u/(2*a*a)-u*u/(a*a),q.id);assert.ok(b>=Math.log(a)-.5-1e-9,q.id);}}
 if(f===8){interval(q,Math.E**2/(4*a*a),Infinity);for(const x of [-a,a,2*a,4*a]){const r=Math.exp(x/a)/(x*x);if(x>0)assert.ok(r>=Math.E**2/(4*a*a)-1e-9,q.id);}}
 if(f===9||f===24){const integrand=f===9?x=>x**5/(x*x+a)**2:x=>x**a*Math.log(x)**2;const candidates=q.options.map(option=>[.7,1.2,2.1].every(x=>{const h=1e-5;return close((evaluate(option,{x:x+h})-evaluate(option,{x:x-h}))/(2*h),integrand(x));}));assert.equal(candidates.filter(Boolean).length,1,q.id);assert.ok(candidates[q.answer],q.id);}
 if(f===10){let min=Infinity;for(let j=0;j<10000;j++){const t=j*Math.PI/20000,r1=1/Math.sqrt(Math.cos(t)**2/(4*a*a)+Math.sin(t)**2/(a*a)),r2=1/Math.sqrt(Math.sin(t)**2/(4*a*a)+Math.cos(t)**2/(a*a));min=Math.min(min,r1*r2/2);}single(q,min);}
 if(f===11){let min=Infinity;for(let j=1;j<=10000;j++){const u=j/1000,v=-1/u,A=[a*u*u,2*a*u],B=[a*v*v,2*a*v],T=[a*u*v,a*(u+v)];const area=Math.abs((A[0]-T[0])*(B[1]-T[1])-(A[1]-T[1])*(B[0]-T[0]))/2;min=Math.min(min,area);}single(q,min);}
 if(f===12){let counts=[1];for(let j=0;j<4;j++){const next=Array(counts.length+a).fill(0);counts.forEach((x,k)=>{for(let t=0;t<=a;t++)next[k+t]+=x;});counts=next;}single(q,counts[2*a]);}
 if(f===13){const n=q.variant+4;let dp=Array.from({length:3},(_,c)=>Array(8).fill(0));dp[0][1]=1;for(let k=1;k<n;k++){const next=Array.from({length:3},()=>Array(8).fill(0));for(let prev=0;prev<3;prev++)for(let mask=0;mask<8;mask++)for(let c=0;c<3;c++)if(c!==prev)next[c][mask|1<<c]+=dp[prev][mask];dp=next;}single(q,3*(dp[1][7]+dp[2][7]));}
 if(f===14){const n=q.variant+5;let count=0,total=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)for(let k=0;k<n;k++)if(i!==j&&i!==k&&j!==k){total++;if(Math.abs(i-j)>1&&Math.abs(i-k)>1&&Math.abs(j-k)>1)count++;}single(q,count/total);}
 if(f===15){const n=q.variant+2,dp=Array.from({length:n+1},()=>Array(n+1).fill(0));dp[0][0]=1;for(let x=0;x<=n;x++)for(let y=0;y<=x;y++){if(x<n)dp[x+1][y]+=dp[x][y];if(y<x)dp[x][y+1]+=dp[x][y];}single(q,dp[n][n]);}
 if(f===16){const n=q.variant+5;let coefficients=[1];for(let i=0;i<n;i++){const next=Array(coefficients.length+1).fill(0);coefficients.forEach((v,j)=>{next[j]+=v;next[j+1]+=v;});coefficients=next;}const D=[1,0,1,2,9];let denom=0;for(let wrong=0;wrong<=4;wrong++){let choose=1;for(let k=1;k<=wrong;k++)choose=choose*(n-k+1)/k;denom+=choose*D[wrong];}single(q,n*(n-1)*(n-2)*(n-3)/24*9/denom);}
 if(f===17){const p=1/a;let state=[1,0],expect=0;for(let k=0;k<200000;k++){expect+=state[0]+state[1];state=[(state[0]+state[1])*(1-p),state[0]*p];if(state[0]+state[1]<1e-13)break;}single(q,expect);}
 if(f===18){let h=Array(a+1).fill(0);h[a]=1;for(let j=0;j<20000;j++){const next=[...h];for(let i=1;i<a;i++)next[i]=(2*h[i+1]+h[i-1])/3;h=next;}single(q,h[1]);}
 if(f===19){let sum=0,second=0;for(let x=1;x<=a;x++)for(let y=1;y<=a;y++){const z=Math.max(x,y);sum+=z/(a*a);second+=z*z/(a*a);}single(q,second-sum*sum);}
 if(f===20){const p=[1/(a+2),1/(a+2),a/(a+2)],E=Array(8).fill(0);for(let mask=6;mask>=0;mask--){let numer=1,remain=0;for(let i=0;i<3;i++)if(mask&(1<<i))remain+=p[i];else numer+=p[i]*E[mask|1<<i];E[mask]=numer/(1-remain);}single(q,E[0]);}
 if(f===21){const r=a/3,R=Math.hypot(a/2,a,3*a/2);single(q,r/R);near((6*a-11*r)/7,r,q.id);}
 if(f===22){let max=0;for(let j=0;j<=60000;j++){const t=3*a*j/60000,pos=x=>Math.max(0,x)**2,area=Math.sqrt(3)/2*(pos(t)-3*pos(t-a)+3*pos(t-2*a)-pos(t-3*a));max=Math.max(max,area);}single(q,max);}
 if(f===23){let total=0;for(let j=0;j<5;j++){const t=j*2*Math.PI/5;total+=1/((a-Math.cos(t))**2+Math.sin(t)**2);}single(q,total);}
 if(f===25){let min=Infinity;for(let j=0;j<=10000;j++){const t=j*Math.PI/20000,u=Math.cos(t)**2/(a*a)-Math.sin(t)**2/(4*a*a),v=Math.sin(t)**2/(a*a)-Math.cos(t)**2/(4*a*a);if(u>0&&v>0)min=Math.min(min,1/(2*Math.sqrt(u*v)));}single(q,min);}
}
console.log(`PASS: ${questions.length} hell questions; independent root counts, optimization, geometry, counting, probability and differentiation checks.`);
