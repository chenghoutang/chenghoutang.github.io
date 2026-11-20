import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {latexProse,withoutMath} from './math/latex-prose.mjs';
const require=createRequire(import.meta.url),katex=require('../assets/katex/katex.min.js');
// Mathematical equivalence matters more than just valid TeX. These cases cover
// exponent grouping, nested roots, derivatives, and interpolated math islands.
const cases=[
 ['由 x²≥4，得 x≥2。','由 $x^{2}\\ge 4$，得 $x\\ge 2$。'],
 ['f′(x)=-4/x³-2x。',"$f'(x)=-4/x^{3}-2x$。"],
 ['(e^{2x}/2)′=e^{2x}。',"$(e^{2x}/2)'=e^{2x}$。"],
 ['P″(1)/P(1)。',"$P''(1)/P(1)$。"],
 ['e⁻ʳ+eᵗ。','$e^{-r}+e^{t}$。'],
 ['x=$\\frac{2}{3}$，t²$-\\frac{2}{3}$t+m=0。',' $x=\\frac{2}{3}$，$t^{2}-\\frac{2}{3}t+m=0$。'.trim()],
 ['取 12/3^2，而非 (12/3)^2。','取 $12/3^{2}$，而非 $(\\frac{12}{3})^{2}$。'],
 ['取 1.5/2。','取 $1.5/2$。'],
 ['√((6)²+(8)²)=10。','$\\sqrt{(6)^{2}+(8)^{2}}=10$。'],
 ['∛2·a²。','$\\sqrt[3]{2}\\cdot a^{2}$。'],
 ['∫₀¹f(x)dx。','$\\int _{0}^{1}f(x)dx$。'],
 ['u₊=max(u,0)。','$u_{+}=\\max (u,0)$。'],
 ['落在 [0,1)，由 x>0（定义域）可知。','落在 $[0,1)$，由 $x>0$（定义域）可知。'],
 ['cosAcosBcosC。','$\\cos A\\cos B\\cos C$。'],
 ['k=0,1,…,10。','$k=0,1,\\ldots ,10$。'],
 [String.raw`概率 $P(\text{甲}\mid\text{红})=\frac23$。`,String.raw`概率 $P(\text{甲}\mid\text{红})=\frac23$。`],
 [String.raw`保留 $\text{simple note}\quad x\le2$。`,String.raw`保留 $\text{simple note}\quad x\le2$。`]
];
for(const [input,expected] of cases){
 const output=latexProse(input);assert.equal(output,expected,input);
 assert.equal(latexProse(output),output,'inline normalization must be idempotent');
 assert.ok(!/[A-Za-z0-9\p{Sm}\p{No}\p{M}′″]/u.test(withoutMath(output)),input);
 for(const match of output.matchAll(/\$([^$]+)\$/g))katex.renderToString(match[1],{throwOnError:true,strict:'error'});
}
console.log(`PASS: ${cases.length} formula-formatting regressions; grouping, math islands, Chinese labels and strict KaTeX rendering.`);
