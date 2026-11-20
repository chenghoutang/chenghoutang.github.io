// Build-time migration for the bank's legacy mathematical prose. Existing
// authored LaTeX is kept as an atomic island, so a fraction interpolated into
// x=$...$ becomes one complete inline formula rather than two renderings.
const mathIsland=/\$\$([\s\S]*?)\$\$|\$([^$]+)\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)/g;
export const withoutMath=text=>text.replace(mathIsland,'');
const superscripts='⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿᵐᵏʳᵗ',superValues='0123456789+-nmkrt';
const subscripts='₀₁₂₃₄₅₆₇₈₉₊',subValues='0123456789+';
const symbols={
 '≤':'\\le ', '≥':'\\ge ', '≠':'\\ne ', '∞':'\\infty ',
 '∈':'\\in ', '∉':'\\notin ', '⊆':'\\subseteq ', '⊂':'\\subset ',
 '∪':'\\cup ', '∩':'\\cap ', '±':'\\pm ', '×':'\\times ',
 '·':'\\cdot ', 'Σ':'\\sum ', '∑':'\\sum ', '∏':'\\prod ',
 '∫':'\\int ', 'π':'\\pi ', 'θ':'\\theta ', 'ω':'\\omega ',
 'α':'\\alpha ', 'β':'\\beta ', 'γ':'\\gamma ', 'Δ':'\\Delta ',
 'λ':'\\lambda ', 'ξ':'\\xi ', 'μ':'\\mu ', 'σ':'\\sigma ', '→':'\\to ', '↦':'\\mapsto ',
 '⇒':'\\Rightarrow ', '⇔':'\\iff ', '≡':'\\equiv ', '…':'\\ldots ',
 '½':'\\frac12 ', '°':'^{\\circ}', '−':'-', '′':"'", '″':"''",
 '⊥':'\\perp ', '∥':'\\parallel ', '÷':'\\div ', '＋':'+', '∘':'\\circ '
};
function legacyTex(source){
 let text=source.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻ⁿᵐᵏʳᵗ]+/g,s=>`^{${[...s].map(c=>superValues[superscripts.indexOf(c)]).join('')}}`)
  .replace(/[₀₁₂₃₄₅₆₇₈₉₊]+/g,s=>`_{${[...s].map(c=>subValues[subscripts.indexOf(c)]).join('')}}`);
 // A Unicode combining overbar belongs to the preceding variable.
 text=text.replace(/([A-Za-z])\u0304/g,'\\overline{$1}');
 text=text.replace(/√|∛/g,c=>c==='√'?'\\sqrt':'\\sqrt[3]');
 // Root signs consume one balanced group, one variable or a whole numeral.
 // Convert parentheses around radicands to braces in a balanced pass.
 for(let start=text.indexOf('\\sqrt');start!==-1;start=text.indexOf('\\sqrt',start+1)){
  let arg=start+5;if(text.slice(arg,arg+3)==='[3]')arg+=3;
  if(text[arg]==='('){let depth=1,end=arg+1;for(;end<text.length&&depth;end++){if(text[end]==='(')depth++;if(text[end]===')')depth--;}
   if(depth)throw Error('Unbalanced root: '+source);
   text=text.slice(0,arg)+'{'+text.slice(arg+1,end-1)+'}'+text.slice(end);
  }else if(text[arg]!=='{'){const atom=text.slice(arg).match(/^(?:\d+|[A-Za-z])/);if(!atom)throw Error('Missing root argument: '+source);text=text.slice(0,arg)+'{'+atom[0]+'}'+text.slice(arg+atom[0].length);}
 }
 text=text.replace(/[≤≥≠∞∈∉⊆⊂∪∩±×·Σ∑∏∫πθωαβγΔλξμσ→↦⇒⇔≡…½°−′″⊥∥÷＋∘]/g,c=>symbols[c]);
 // Preserve grouping: ^(1-n), _(-1) and _{i<j} are single scripts.
 text=text.replace(/([_^])\(([^()]*)\)/g,'$1{$2}');
 text=text.replace(/([_^])(-?\d+)(?![\d}])/g,'$1{$2}');
 text=text.replace(/arctan|arcsin|arccos|sin|cos|tan|cot|ln|log|max|min|exp/g,word=>'\\'+word+' ');
 text=text.replace(/\b(Re|Im|Var)(?=\()/g,'\\operatorname{$1}');
 text=text.replace(/\(mod\s*([\dA-Za-z]+)\)/g,'\\pmod{$1}');
 // Clear, simple numerical fractions can be typeset as stacked fractions.
 // Other divisions retain /, which preserves their original grouping exactly.
 text=text.replace(/(?<![\w}.^_/])(\d+)\/(\d+)(?![\d{A-Za-z_^.])/g,'\\frac{$1}{$2}');
 return text;
}
export function latexProse(prose){
 const islands=[];
 const protectedText=prose.replace(mathIsland,(match,...args)=>{
  if(match.startsWith('$$')||match.startsWith('\\['))throw Error('Expected inline legacy prose');
  islands.push(args.slice(0,4).find(x=>x!==undefined));
  return String.fromCharCode(0xe000+islands.length-1);
 });
 // Chinese prose and its punctuation delimit formula runs. Full-width right
 // parentheses occur as interval endpoints as well as prose parentheses.
 return protectedText.replace(/[A-Za-z0-9\u00b0-\u00ff\u02b3\u0304\u0370-\u03ff\u1d00-\u1d7f\u2026\u2032-\u2033\u2070-\u209f\u2100-\u22ff\u2c7c\ue000-\uf8ff＋\\{}()[\],.+*/^_=<>!|'~%:\- \t]+[）]?/g,run=>{
  const leading=run.match(/^\s*/)[0],trailing=run.match(/\s*$/)[0];let body=run.trim();
  // Leave ordinary separators alone; isolated numbers are also math values.
  if(!/[A-Za-z0-9\u00b0-\u22ff\ue000-\uf8ff<>=＋]/.test(body))return run;
  // A Chinese prose closing parenthesis must stay prose unless this run has
  // an unmatched opening delimiter (e.g. the half-open interval [0,1)).
  let suffix='';if(body.endsWith('）')){body=body.slice(0,-1);if((body.match(/[([]/g)||[]).length>(body.match(/[)\]]/g)||[]).length)body+=')';else suffix='）';}
  // Normalize only legacy spans, never already-authored LaTeX commands.
  const tex=body.split(/([\ue000-\uf8ff])/).map(part=>{
   const code=part.charCodeAt(0)-0xe000;
   return part.length===1&&code>=0&&code<islands.length?islands[code]:legacyTex(part);
  }).join('');
  return leading+'$'+tex+'$'+suffix+trailing;
 });
}
