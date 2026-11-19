import {L,F,C,fact} from './core.mjs';
export function steps(q){const a=q.variant+1,v=Number(q.family.at(-1))-1,d=q.difficulty;let formula,note;
switch(q.topic){
case 'space':
 if(d==='easy'){formula=v?L`\Pi:x+2y+${a}z=1\Longrightarrow n=(1,2,${a})`:L`(${a},1,2)\cdot(1,2,1)=${a}+2+2=${a+4}`;note=v?'平面上任意两点的差向量与方程系数向量数量积为零，因此系数向量就是法向量。':'空间数量积依旧逐坐标相乘求和，第三个坐标不可漏掉。';}
 else if(d==='medium'){formula=v?L`d(P,\Pi)=\frac{|${a}+2\cdot0+2\cdot0|}{\sqrt{1^2+2^2+2^2}}=${F(a,3)}`:L`\sin\alpha=\frac{|u\cdot n|}{|u||n|}=\frac{${a}}{${a}\sqrt2}=\frac{\sqrt2}2\Longrightarrow\alpha=45^\circ`;note=v?'点到平面距离使用法向量长度 3 归一化，绝对值保证非负。':'线面角是直线与法向量夹角的余角，因而数量积的余弦值对应线面角的正弦。';}
 else if(v){formula=L`\begin{aligned}n_1&=(1,1,${a}),\quad n_2=(1,-1,m),\\\cos60^\circ&=\frac{|n_1\cdot n_2|}{|n_1||n_2|}=\frac{${a}m}{\sqrt{${a*a+2}}\sqrt{m^2+2}},\\${4*a*a}m^2&=(${a*a+2})(m^2+2),\\m^2&=${F(2*(a*a+2),3*a*a-2)}.\end{aligned}`;note='m>0、a>0，所以数量积为正，平方不会产生符号伪根；最后取正平方根。两平面常数项不影响夹角。';}
 else{formula=L`\begin{aligned}d^2&=|OP|^2-\frac{(OP\cdot u)^2}{|u|^2}\\&=${a*a}+t^2-\frac{(${a}+t)^2}{3}\\&=\frac23\left(t-${F(a,2)}\right)^2+${F(a*a,2)},\\\min d&=${F(a,2)}\sqrt2.\end{aligned}`;note='从总长度平方中减掉沿直线投影的平方，剩余正交分量就是距离平方。t=a/2 是可取实数，故下界可达。';}break;
case 'solid':
 if(d==='easy'){formula=v?L`S=4\pi r^2=4\pi\cdot${a}^2=${4*a*a}\pi`:L`V=\ell^3=${a}^3=${a**3}`;note=v?'表面积量纲为长度平方，不能误用球体积中的三次幂。':'正方体三个相互垂直方向棱长相同，底面积乘高得到三次方。';}
 else if(d==='medium'){formula=v?L`V=\frac{\pi h}{3}(R^2+Rr+r^2)=\pi[${a+1}^2+${a+1}\cdot${a}+${a}^2]=${3*a*a+3*a+1}\pi`:L`S_{\text{底}}=${a}(${a}+1),\quad V=\frac13S_{\text{底}}h=\frac13\cdot${a}(${a}+1)\cdot3=${a*(a+1)}`;note=v?'圆台可由两个相似圆锥体积相减推出该式；中间的 Rr 项不能漏掉。':'棱锥体积是同底同高柱体的三分之一，高指垂直于底面的高度。';}
 else if(v){formula=L`\begin{aligned}\frac r{${a}}&=1-\frac h{${2*a}},\quad0<h<${2*a},\\V&=\frac\pi4h(${2*a}-h)^2,\\2h(${2*a}-h)^2&\le\left(\frac{2h+(${2*a}-h)+(${2*a}-h)}3\right)^3\\&=\left(\frac{${4*a}}3\right)^3,\\V&\le${F(8*a**3,27)}\pi.\end{aligned}`;note='相似截面给半径与高度的关系。均值等号要求 2h=2a-h，即 h=2a/3，半径 r=2a/3，均在允许范围内。';}
 else{formula=L`\begin{aligned}h&=\sqrt{${a}^2-\left(\frac{${a}}{\sqrt3}\right)^2}=\frac{${a}\sqrt6}{3},\\V&=\frac13\cdot\frac{\sqrt3}{4}${a}^2h=\frac{${a}^3\sqrt2}{12},\\S_{\text{总}}&=\sqrt3\,${a}^2,\quad V=\frac13rS_{\text{总}},\\r&=\frac{3V}{S_{\text{总}}}=${F(a,12)}\sqrt6.\end{aligned}`;note='把四面体按内心分为四个小棱锥，它们的高均为内切球半径，所以总体积等于 r 乘总表面积再除以 3。';}break;
case 'counting':
 if(d==='easy'){formula=v?L`N=A_{${a+3}}^2=(${a+3})(${a+2})=${(a+3)*(a+2)}`:L`N=\binom{${a+3}}2=\frac{(${a+3})(${a+2})}{2}=${C(a+3,2)}`;note=v?'班长、副班长有先后角色，不同分工算不同方案，不除以 2。':'两本书没有角色之分，同一对的两种选取顺序算一次，因此除以 2。';}
 else if(d==='medium'){formula=v?L`(1+x)^{${a+4}}=\sum_{k=0}^{${a+4}}\binom{${a+4}}k x^k\Longrightarrow[x^2]=\binom{${a+4}}2=${C(a+4,2)}`:L`N=2!\,(${a+2})!=${2*fact(a+2)}`;note=v?'选取两个因子贡献 x，其余因子贡献 1，故系数直接对应选法数。':'先捆成整体排，再排整体内部的甲乙；两类选择相互独立，使用乘法原理。';}
 else if(v){const n=a+8;formula=L`\begin{aligned}[x^4](1+x)^{${n}}(1-2x+x^2)&=\binom{${n}}4-2\binom{${n}}3+\binom{${n}}2\\&=${C(n,4)-2*C(n,3)+C(n,2)}.\end{aligned}`;note='按第二因子提供的次数 0、1、2 分类，与第一因子的次数凑成 4；保留中间项的负号和系数 2。';}
 else{formula=L`\begin{aligned}x_{i+1}-x_i\ge2,\quad y_i&=x_i-(i-1),\\1\le x_1<\cdots<x_4\le${a+7}&\longleftrightarrow1\le y_1<\cdots<y_4\le${a+4},\\N&=\binom{${a+4}}4=${C(a+4,4)}.\end{aligned}`;note='反变换 x_i=y_i+i-1 把任意严格递增四元组还原成不相邻选数，因此不仅是注入，而是一一对应。';}break;
case 'probability':
 if(d==='easy'){formula=v?L`P(\text{红})=\frac{1}{${a}+1}=${F(1,a+1)}`:L`P(\text{偶数})=\frac{\lfloor${a}/2\rfloor}{${a}}=${F(Math.floor(a/2),a)}`;note='古典概型先确认各样本点等可能，再用有利样本数除以总样本数，不能把事件类别当作等可能样本。';}
 else if(d==='medium'){formula=v?L`P(\text{至少一正})=1-P(\text{全反})=1-\left(\frac12\right)^{${a}}=${F(2**a-1,2**a)}`:L`P(\text{同色})=\frac{\binom22+\binom{${a}}2}{\binom{${a+2}}2}=${F(1+C(a,2),C(a+2,2))}`;note=v?'“至少一次”的对立事件只有“零次”，全反概率由独立性相乘。':'两红、两蓝互斥，故有利选法数相加；不放回抽样使用不同球组成的无序对计数。';}
 else if(v){const n=a+3;formula=L`\begin{aligned}P(A)&=P(B)=\frac1{${n}},\quad P(A\cap B)=\frac1{${n}(${n}-1)},\\P(A\triangle B)&=P(A)+P(B)-2P(A\cap B)\\&=${F(2*(n-2),n*(n-1))}.\end{aligned}`;note='“恰好一个”要求同时发生的情形完全剔除，交集在 P(A)+P(B) 中出现两次，因此减两次，不是只减一次。';}
 else{formula=L`\begin{aligned}E&=\{\text{至少一红}\},\quad H=\{\text{恰两红}\}\subseteq E,\\P(H\mid E)&=\frac{\binom32\binom{${a}}1}{\binom{${a+3}}3-\binom{${a}}3}\\&=${F(3*a,C(a+3,3)-C(a,3))}.\end{aligned}`;note='已知条件改变了分母样本空间。全蓝情形先从总选法中剔除；两红一蓝已自动满足条件，无需再扣减。';}break;
case 'conditional':
 if(d==='easy'){formula=v?L`A\perp B\Longrightarrow P(A\cap B)=P(A)P(B)=\frac1{${a}}\cdot\frac12=${F(1,2*a)}`:L`P(B\mid A)=\frac{P(A\cap B)}{P(A)}=\frac{1/${2*a}}{1/${a}}=\frac12`;note=v?'概率相乘需要题目给出的独立性，不能对一般事件直接使用。':'条件事件 A 的概率非零，公式中的分母是被给定事件 A，而不是 B。';}
 else if(d==='medium'){formula=v?L`P(D)=P(J)P(D\mid J)+P(Y)P(D\mid Y)=\frac13\frac1{${a}}+\frac23\frac1{${2*a}}=${F(2,3*a)}`:L`P(J\mid R)=\frac{P(J)P(R\mid J)}{P(J)P(R\mid J)+P(Y)P(R\mid Y)}=\frac{\frac12\frac{${a}}{${a+1}}}{\frac12\frac{${a}}{${a+1}}+\frac12\frac1{${a+1}}}=${F(a,a+1)}`;note=v?'甲乙来源构成互斥且完备的分类，用生产来源概率对各次品率加权。':'观察到红球后来源不再等可能，应使用贝叶斯公式更新，而不是继续沿用各 1/2。';}
 else if(v){formula=L`\begin{aligned}E&=\{\text{前两球均红}\},\\P(Y\mid E)&=\frac{\binom{${a}}2}{1+\binom{${a}}2},\\P(R_3\mid E)&=P(Y\mid E)\frac{${a-2}}{${a}}+P(J\mid E)\cdot0\\&=${F((a-1)*(a-2),a*(a-1)+2)}.\end{aligned}`;note='甲盒抽掉两红后已无红球；乙盒剩 a-2 红、总数 a。不放回的信息既改变来源后验，也改变各盒下一次的红球比例。';}
 else{formula=L`\begin{aligned}P(D\cap+)&=\frac1{${10*a}}\frac9{10},\\P(D^c\cap+)&=\frac{${10*a-1}}{${10*a}}\frac1{10},\\P(D\mid+)&=\frac{9}{9+(${10*a}-1)}=${F(9,10*a+8)}.\end{aligned}`;note='对未患病者，阳性率是特异度的补数 1/10。阳性准确率必须同时考虑真阳性与假阳性，不能直接等同于灵敏度 9/10。';}break;
}return {formula,note};}
