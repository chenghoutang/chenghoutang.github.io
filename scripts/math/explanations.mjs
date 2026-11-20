import {steps as batch1} from './proofs-1.mjs';
import {steps as batch2} from './proofs-2.mjs';
import {steps as batch3} from './proofs-3.mjs';
import {steps as batch4} from './proofs-4.mjs';
import {steps as batch5} from './proofs-5.mjs';
import {steps as batch6} from './proofs-6.mjs';
import {steps as advanced} from './proofs-advanced.mjs';
import {latexProse} from './latex-prose.mjs';
const batches=[null,batch1,batch2,batch3,batch4,batch5,batch6];
export function expandExplanation(q){
 const proof=q.batch<=6?batches[q.batch](q):advanced(q);
 if(!proof?.formula||!proof?.note)throw Error(`Missing detailed proof: ${q.id}`);
 return `${latexProse(q.explanation)}\n\n关键推导\n$$\n${proof.formula}\n$$\n${latexProse(proof.note)}`;
}
