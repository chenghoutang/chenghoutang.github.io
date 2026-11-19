import {L,F} from './core.mjs';
export function steps(q){const a=q.variant+1,v=Number(q.family.at(-1))-1,d=q.difficulty;let formula,note;
switch(q.topic){
case 'trig-identity':
 if(d==='easy'){formula=v?L`\sin^2\theta+\cos^2\theta=1`:L`2\sin(${a}x)\cos(${a}x)=\sin(2\cdot${a}x)=\sin(${2*a}x)`;note=v?'这是同角平方恒等式，已知正弦的具体值不影响结果。':'二倍角公式改变的是整个角，不是把正弦值乘二。';}
 else if(d==='medium'){formula=v?L`\begin{aligned}(\sin x+\cos x)^2&=1+2\sin x\cos x=${F(a+1,a)},\\\sin x+\cos x>0&\Longrightarrow\sin x+\cos x=\sqrt{${F(a+1,a)}}.\end{aligned}`:L`\sin2x=\frac{2\sin x\cos x}{\sin^2x+\cos^2x}=\frac{2\tan x}{1+\tan^2x}=${F(2*a,1+a*a)}`;note=v?'平方后开方有正负两种可能，题目给出的和为正决定选择正根。':'正切有定义保证 cos x≠0，才可以分子分母同时除以 cos²x。';}
 else if(v){formula=L`\begin{aligned}t=\frac{${a}+\sin x}{${a}+\cos x}&\iff\sin x-t\cos x=${a}(t-1),\\\exists x&\iff |${a}(t-1)|\le\sqrt{1+t^2}\\&\iff(${a*a-1})t^2-${2*a*a}t+${a*a-1}\le0,\\t_\pm&=\frac{${a*a}\pm\sqrt{${2*a*a-1}}}{${a*a-1}}.\end{aligned}`;note='分母恒正，等价移项不会丢解。辅助角函数能取振幅内的每个值，因此根区间内的所有 t 都可达，端点亦可取。';}
 else{formula=L`\begin{aligned}t&=\sin x+\cos x\in[-\sqrt2,\sqrt2],\\g(t)&=t^2-\frac2{${a}}t+m-1,\\\Delta>0&\iff m<1+\frac1{${a*a}},\\g(\sqrt2)>0,\ g(-\sqrt2)>0&\iff m>\frac{2\sqrt2}{${a}}-1.\end{aligned}`;note='每个内部 t 对应两个 x，两个端点各只有一个 x。故要四根，需要两个不同 t 都严格在内部；对称轴 1/a 在内部保证这些条件充分。';}break;
case 'triangle':
 if(d==='easy'){formula=v?L`2R=\frac{${a}}{\sin30^\circ}=2\cdot${a}\Longrightarrow R=${a}`:L`c=\sqrt{(${3*a})^2+(${4*a})^2}=5\cdot${a}=${5*a}`;note=v?'正弦定理给出的边长与正弦之比是直径，不是半径。':'斜边对应直角，是三边中最大的一边，平方根取正值。';}
 else if(d==='medium'){formula=v?L`S=\frac12\cdot${a}\cdot${a+1}\sin60^\circ=${F(a*(a+1),4)}\sqrt3`:L`\cos C=\frac{${a}^2+${a}^2-${a+1}^2}{2\cdot${a}\cdot${a}}=${F(a*a-2*a-1,2*a*a)}`;note=v?'面积公式中使用两已知边的夹角，不是任意一个角。':'最长边为 a+1，其对应角用余弦定理时，该边的平方放在减号后。';}
 else if(v){formula=L`\begin{aligned}d^2-\frac{(b+c)^2}{4}&=\frac34(b-c)^2\ge0,\\p=\frac{b+c+d}{2}&\ge3(p-d),\\p-d&=r\cot\frac A2=${a}\sqrt3,\\2p&\ge${6*a}\sqrt3.\end{aligned}`;note='其中 d=BC，p 为半周长。等号要求 b=c；结合 A=60° 就得到等边三角形，其内切圆半径可取给定值，因此下界可达。';}
 else{formula=L`\begin{aligned}b+c&=${2*a},\quad d^2=${4*a*a}-3bc,\\r=\frac Sp&=\frac{\sqrt3\,bc}{2(${2*a}+d)}=\frac{\sqrt3(${2*a}-d)}6,\\bc\le${a*a}&\Longrightarrow d\ge${a},\\r&\le${F(a,6)}\sqrt3.\end{aligned}`;note='先用余弦定理把面积中的乘积换成 d，使半周长分母被约去；b=c=a 时满足所有约束并取等。';}break;
case 'vectors':
 if(d==='easy'){formula=v?L`(${a},1)\cdot(1,${a})=${a}\cdot1+1\cdot${a}=${2*a}`:L`(${a},2)+(1,${a})=(${a+1},${a+2})`;note=v?'数量积结果是实数，按对应坐标相乘后求和。':'向量加法按对应坐标分别相加，不是把所有坐标加到一起。';}
 else if(d==='medium'){formula=v?L`|u+v|^2=|u|^2+2u\cdot v+|v|^2=${a*a}+${2*a}+4=${a*a+2*a+4}`:L`(${a},1)\perp(2,k)\iff2\cdot${a}+k=0\iff k=-${2*a}`;note=v?'平方展开包含数量积的二倍；向量的模长不能直接相加后平方。':'两个向量均非零，垂直与数量积为零等价，不用先求两向量斜率。';}
 else if(v){formula=L`\begin{aligned}(A-P)\cdot(B-P)&=${a*a}-${2*a}(x+y),\\(x+y)^2&\le2(x^2+y^2)=${2*a*a},\\x+y&\le${a}\sqrt2,\\\min\overrightarrow{PA}\cdot\overrightarrow{PB}&=${a*a}-${2*a*a}\sqrt2.\end{aligned}`;note='x=y=a/√2 在圆上且让 x+y 达到正的上界，因此数量积的下界可取。注意目标中线性项系数为负，要最大化 x+y。';}
 else{formula=L`\begin{aligned}|w|^2&=t^2+(1-t)^2+2t(1-t)\cdot\frac12\\&=t^2-t+1,\\|w|^2\le${a}&\iff\left(t-\frac12\right)^2\le\frac{${4*a-3}}4.\end{aligned}`;note='t 是任意实参数，并没有被限制在 [0,1]。解配方后的平方不等式，边界满足等号，所以取闭区间。';}break;
case 'arithmetic':
 if(d==='easy'){formula=v?L`S_{${a}}=\frac{${a}}2[2\cdot${a}+(${a}-1)\cdot2]=${a*(2*a-1)}`:L`a_5=a_1+4d=1+4\cdot${a}=${1+4*a}`;note=v?'求和公式里的 n 同时出现在项数和末项位置，代入时要保持一致。':'从第 1 项到第 5 项有 4 个公差，不是 5 个。';}
 else if(d==='medium'){formula=v?L`a_1+a_6=2a_1+5d=a_2+a_5=${a}+${a+9}=${2*a+9}`:L`\begin{aligned}d&=\frac{a_7-a_3}{7-3}=2,\\a_5&=a_3+2d=${a+8},\\S_9&=\frac92(a_1+a_9)=9a_5=${9*(a+8)}.\end{aligned}`;note=v?'下标和相同时，通项展开后系数相同。':'奇数项求和可用正中间项乘项数，减少求首末项的步骤。';}
 else if(v){formula=L`S_n=\sum_{k=1}^n(${2*a+1}-2k)=n(${2*a}-n)=${a*a}-(n-${a})^2\le${a*a}`;note='等号在正整数 n=a 取得，不能仅用实变量二次函数的顶点而不检查整数约束。';}
 else{formula=L`\begin{aligned}S_n&=n(${2*a-1}-n),\\S_n\ge${a*a-a}&\iff(n-${a-1})(n-${a})\le0\\&\iff${a-1}\le n\le${a}.\end{aligned}`;note='两端都是正整数，且相差 1，因此恰有两个 n。连续区间长度与整数点个数不能混淆。';}break;
case 'geometric':
 if(d==='easy'){formula=v?L`S_3=${a}(1+2+2^2)=${7*a}`:L`a_4=a_1q^3=${a}\cdot3^3=${27*a}`;note=v?'只累加前三项；公比为 2 时第 3 项是首项的 4 倍。':'通项指数是项数减一，要乘三次公比。';}
 else if(d==='medium'){formula=v?L`a_4^2=a_2a_6=${a}\cdot${16*a}=${16*a*a}\Longrightarrow a_4=${4*a}`:L`${a}\cdot2^n\ge${128*a}\iff2^n\ge2^7\iff n\ge7`;note=v?'由正项条件选择正平方根；若没有这个条件需保留负根的可能。':'轮数从初始状态之后开始计算，n=0 表示尚未翻倍。';}
 else if(v){formula=L`\begin{aligned}\frac{A(1+q^2)}{Aq}&=\frac52\Longrightarrow 2q^2-5q+2=0,\\q&\in\{2,\tfrac12\},\quad A\in\{${a},${4*a}\},\\S_4^{(1)}+S_4^{(2)}&=${15*a}+${F(15*a,2)}=${F(45*a,2)}.\end{aligned}`;note='两个公比都为正，均满足正项数列条件，必须分别求和后再相加；不能只取大于 1 的公比。';}
 else{formula=L`\begin{aligned}S_n&=\frac{${a}[1-(-2)^n]}3,\\n\text{ 偶}:&\ S_n<0,\\n\text{ 奇}:&\ S_n>${21*a}\iff2^n>62,\\2^5&<62<2^7.\end{aligned}`;note='不等式先排除所有偶数项数，再在奇数 n 中找最小值；6 虽满足幂的大小，却不满足奇偶性。';}break;
}return {formula,note};}
