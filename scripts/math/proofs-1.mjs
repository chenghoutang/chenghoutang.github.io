import {L,F} from './core.mjs';
export function steps(q){const a=q.variant+1,v=Number(q.family.at(-1))-1,d=q.difficulty;let formula,note;
switch(q.topic){
case 'sets':
 if(d==='easy'){formula=v?L`|A|=${a}-(-${a})+1=${2*a+1}`:L`A\cap B=\{${a+1},${a+2}\},\qquad |A\cap B|=2`;note=v?'计数包含左右端点，所以要在端点差上加 1。':'求交集只保留两集合共有的元素，注意题目问的是元素个数。';}
 else if(d==='medium'){formula=v?L`N=2^{|A|-2}=2^{${a+1}}=${2**(a+1)}`:L`\begin{aligned}|A\cup B|&=${3*a+10}-${a}=${2*a+10},\\|A\cap B|&=|A|+|B|-|A\cup B|\\&=${2*a+3}+${a+5}-${2*a+10}=${a-2}.\end{aligned}`;note=v?'把 1 的状态固定为选、2 的状态固定为不选，其余元素才是可自由决定的二元选择。':'“两项都不参加”先用于求并集；容斥减掉的是重复计数的交集。';}
 else if(v){const n=a+3;formula=L`\begin{aligned}N&=3^{${n}}-2^{${n}}-2^{${n}}+1\\&=3^{${n}}-2\cdot2^{${n}}+1=${3**n-2*2**n+1}.\end{aligned}`;note='三种状态分别是只在 A、只在 B、同时在两者中。剔除两类包含关系后，A=B=U 被减去两次，必须补回一次；有序集合对不能再除以 2。';}
 else{formula=L`\begin{aligned}A&=[${a-1},${a+1}],\quad B=[m-2,m+2],\\A\subseteq B&\iff\begin{cases}m-2\le${a-1},\\m+2\ge${a+1}\end{cases}\\&\iff ${a-1}\le m\le${a+1}.\end{aligned}`;note='左端点要向左覆盖、右端点要向右覆盖。两个集合都是闭区间，端点重合仍满足包含关系。';}break;
case 'logic':
 if(d==='easy'){formula=v?L`\neg\left(\exists x\in\mathbb R:\ x^2<${a}\right)\iff\forall x\in\mathbb R:\ x^2\ge${a}`:L`x>${a}\Longrightarrow x^2>${a*a},\qquad x=-${a+1}:\ x^2>${a*a}\ \text{且}\ x\not>${a}`;note=v?'量词与结论同时否定；严格小于的否定包含等号。':'正向蕴含成立，负数反例否定逆向蕴含，因此是充分不必要条件。';}
 else if(d==='medium'){formula=v?L`(${a},+\infty)\subseteq(m,+\infty)\iff m\le${a}`:L`\min_{x\in\mathbb R}(x^2-${2*a}x+m)=m-${a*a}\ge0\iff m\ge${a*a}`;note=v?'当 m 等于原阈值时两区间相同，充分性仍成立。':'全称命题要求函数的最低点也非负，不能只验证某个 x。';}
 else if(v){formula=L`\begin{aligned}\exists y>0:\ y+\frac{${a*a}}y\le x+\frac kx&\iff x+\frac kx\ge${2*a},\\k>0:\quad\min_{x>0}\left(x+\frac kx\right)&=2\sqrt k,\\2\sqrt k\ge${2*a}&\iff k\ge${a*a}.\end{aligned}`;note='先对存在量词求左侧可达的最小值，再处理右侧的全称量词。k≤0 时取足够小的 x 就不能满足条件；k=a² 时 y=a 可对所有 x 使用。';}
 else{formula=L`\min_{x>0}\left(x+\frac{${a*a}}x\right)=${2*a}\quad(x=${a}),\qquad\exists x>0:\ x+\frac{${a*a}}x<m\iff m>${2*a}`;note='因为题目使用严格小于，当 m 等于最小值时依然无解，不能把左端点包括在内。';}break;
case 'complex':
 if(d==='easy'){formula=v?L`z=${a}-${a+1}i\quad\Longrightarrow\quad\overline z=${a}+${a+1}i`:L`|z|=\sqrt{(${3*a})^2+(${4*a})^2}=${a}\sqrt{9+16}=${5*a}`;note=v?'共轭只改变虚部系数的符号，实部保持不变。':'模长非负，先提取公共正因子，再利用 3、4、5 的勾股结构。';}
 else if(d==='medium'){formula=v?L`z=1+i(${a}+2i)=-1+${a}i,\qquad\operatorname{Im}z=${a}`:L`\frac{${a}+${a+2}i}{1+i}=\frac{(${a}+${a+2}i)(1-i)}{2}=${a+1}+i`;note=v?'虚部是 i 的实数系数，不包含 i 本身。':'乘分母的共轭后分母变为 2，同时利用 i²=-1。';}
 else if(v){formula=L`\begin{aligned}z=x+yi:\quad |z-${a}|=|z+${a}|&\iff(x-${a})^2+y^2=(x+${a})^2+y^2\\&\iff x=0,\\|y-${a+1}|=2&\iff y\in\{${a-1},${a+3}\},\\\max |z|&=${a+3}.\end{aligned}`;note='先把等距条件转成垂直平分线，再与圆求交；两候选 y 均非负，所以比较绝对值后取较大者。';}
 else{formula=L`\begin{aligned}d&=\sqrt{${a*a+1}},\quad r=${a},\quad d>r,\\\max|z|&=d+r,\quad\min|z|=d-r,\\(\max|z|)(\min|z|)&=d^2-r^2=1.\end{aligned}`;note='最近点和最远点在圆心与原点的连线上，均能取到。圆外点条件 d>r 保证最近距离用 d-r。';}break;
case 'inequalities':
 if(d==='easy'){formula=v?L`0<x<${a}\Longrightarrow -${a}<x-${a}<0`:L`x+\frac{${a*a}}x-2\cdot${a}=\frac{(x-${a})^2}x\ge0`;note=v?'相同地减去一个实数不会改变不等号方向。':'分母 x>0，所以平方差形式直接给出下界；x=a 时差为零，确认它是最小值而非仅一个下界。';}
 else if(d==='medium'){formula=v?L`xy=\frac{(x+y)^2-(x-y)^2}{4}=${a*a}-\frac{(x-y)^2}{4}\le${a*a}`:L`\begin{aligned}t&=x-1>0,\\x+\frac{${a*a}}{x-1}&=1+t+\frac{${a*a}}t\\&\ge1+2\cdot${a}=${2*a+1}.\end{aligned}`;note=v?'取 x=y=a 时平方差为零，且满足正数和的约束。':'取 t=a，即 x=a+1>1 时等号成立；先平移到正变量才能正确套用基本不等式。';}
 else if(v){formula=L`\begin{aligned}(x-1)(y-1)&=1,\quad x,y>1,\\t=x-1>0:&\quad y=1+\frac1t,\\${a*a}x+y&=${a*a+1}+${a*a}t+\frac1t\\&\ge${a*a+1}+2\cdot${a}=${(a+1)**2}.\end{aligned}`;note='等号要求 a²t=1/t，即 t=1/a。此时 x=1+1/a、y=1+a 都为正，并满足原倒数约束。';}
 else{formula=L`\begin{aligned}\left(\frac1x+\frac4y\right)(x+y)&\ge(1+2)^2=9,\\\frac1x+\frac4y&\ge\frac9{${a}},\\y=2x,\quad x+y=${a}&\Longrightarrow x=${F(a,3)},\ y=${F(2*a,3)}.\end{aligned}`;note='柯西不等式的等号要求两个向量成比例，这里等价于 y=2x；给出正数可行点后，才能宣布下界为最小值。';}break;
case 'quadratic':
 if(d==='easy'){formula=v?L`x_1+x_2=-\frac{-(2\cdot${a}+1)}1=${2*a+1}`:L`(x-${a})^2\ge0\Longrightarrow y\ge${a+1},\quad y(${a})=${a+1}`;note=v?'韦达公式使用一次项系数的相反数，而不是常数项。':'顶点在定义域内，故平方项的零值可取到。';}
 else if(d==='medium'){formula=v?L`\Delta=(-${2*a})^2-4m>0\iff m<${a*a}`:L`f(x)=(x-${a})^2-${a*a},\quad x-${a}\in[1,3]\Longrightarrow\min f=1-${a*a}`;note=v?'两个不相等的实根要求判别式严格为正，等号对应重根。':'整个区间位于对称轴右侧，平方随 x 增大；不能使用不在区间内的顶点值。';}
 else if(v){formula=L`\begin{aligned}x=y+1:\quad y^2+(2-2m)y+(${a+1}-m)&=0,\\y_1,y_2>0&\iff\begin{cases}2m-2>0,\\${a+1}-m>0,\\m^2-m-${a}\ge0,\end{cases}\\&\iff\frac{1+\sqrt{${4*a+1}}}{2}\le m<${a+1}.\end{aligned}`;note='先把“大于 1”平移为“两根为正”，同时检查根和、根积和实根条件。下端重根大于 1，可取；上端有根为 1，必须排除。';}
 else{formula=L`\begin{aligned}x_{1,2}&=t\pm\sqrt{${a}},\\0<x_1<x_2<${2*a}&\iff\begin{cases}t-\sqrt{${a}}>0,\\t+\sqrt{${a}}<${2*a}\end{cases}\\&\iff\sqrt{${a}}<t<${2*a}-\sqrt{${a}}.\end{aligned}`;note='两个根的次序已知，分别控制较小根和较大根即可；目标区间为开区间，因此两端都不能取。';}break;
}return {formula,note};}
