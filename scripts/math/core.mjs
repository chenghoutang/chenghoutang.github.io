import assert from 'node:assert/strict';
export const L = String.raw;
export const M = tex => `$${tex}$`;
export const gcd = (a,b) => b ? gcd(b,a%b) : Math.abs(a);
export const F = (a,b=1) => { if(b<0){a=-a;b=-b;}const g=gcd(a,b);a/=g;b/=g;return b===1?String(a):`${a<0?'-':''}\\frac{${Math.abs(a)}}{${b}}`; };
export const C = (n,k) => {let value=1;for(let i=1;i<=k;i++)value=value*(n-i+1)/i;return Math.round(value);};
export const fact = n => n<2?1:n*fact(n-1);
export const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
export function Q(stem, answer, explanation, distractors) {
    const correct=String(answer);
    let wrong=distractors?.map(String) || [Number(answer)+1,Number(answer)-1,Number(answer)+2].map(String);
    wrong=[...new Set(wrong)].filter(value=>value!==correct);
    if(wrong.length<3){assert.ok(Number.isFinite(Number(answer)),`Need three distinct distractors: ${stem}`);for(let i=3;wrong.length<3;i++)if(!wrong.includes(String(Number(answer)+i))&&String(Number(answer)+i)!==correct)wrong.push(String(Number(answer)+i));}
    assert.ok(wrong.length>=3 && ![correct,...wrong].some(s=>/NaN|undefined/.test(s)),stem);
    return {stem,correct,explanation,choices:[correct,...wrong.slice(0,3)]};
}
export const numeric = (stem,answer,explanation,wrong) => Q(stem,answer,explanation,wrong);
export const interval = (left,right,closedLeft=false,closedRight=false)=>`${closedLeft?'[':'('}${left},${right}${closedRight?']':')'}`;
