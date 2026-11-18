import assert from 'node:assert/strict';
export const L = String.raw;
export const M = tex => `$${tex}$`;
export const gcd = (a,b) => b ? gcd(b,a%b) : Math.abs(a);
export const F = (a,b=1) => { if(b<0){a=-a;b=-b;}const g=gcd(a,b);a/=g;b/=g;return b===1?String(a):`${a<0?'-':''}\\frac{${Math.abs(a)}}{${b}}`; };
export const C = (n,k) => {let value=1;for(let i=1;i<=k;i++)value=value*(n-i+1)/i;return Math.round(value);};
export const fact = n => n<2?1:n*fact(n-1);
export const near = (a,b) => assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);
// A reduced fraction may also be interpolated into explanatory prose.
// Preserve existing math delimiters and render those fractions as math too.
export const mathProse = text => text.split('$').map((part,i)=>i%2?part:part.replace(/-?\\frac\{\d+\}\{\d+\}/g,tex=>M(tex))).join('$');
export function Q(stem, answer, explanation, distractors) {
    const correct=String(answer);
    let wrong=distractors?.map(String) || [Number(answer)+1,Number(answer)-1,Number(answer)+2].map(String);
    wrong=[...new Set(wrong)].filter(value=>value!==correct);
    if(wrong.length<3){const frac=correct.match(/^(-?)\\frac\{(\d+)\}\{(\d+)\}$/);const value=frac?(frac[1]?-1:1)*Number(frac[2])/Number(frac[3]):Number(answer);assert.ok(Number.isFinite(value),`Need three distinct distractors: ${stem}`);for(let i=3;wrong.length<3;i++){const candidate=frac?F((frac[1]?-1:1)*Number(frac[2])+i*Number(frac[3]),Number(frac[3])):String(value+i);if(!wrong.includes(candidate)&&candidate!==correct)wrong.push(candidate);}}
    assert.ok(wrong.length>=3 && ![correct,...wrong].some(s=>/NaN|undefined/.test(s)),stem);
    return {stem:mathProse(stem),correct,explanation:mathProse(explanation),choices:[correct,...wrong.slice(0,3)]};
}
export const numeric = (stem,answer,explanation,wrong) => Q(stem,answer,explanation,wrong);
export const interval = (left,right,closedLeft=false,closedRight=false)=>`${closedLeft?'[':'('}${left},${right}${closedRight?']':')'}`;
