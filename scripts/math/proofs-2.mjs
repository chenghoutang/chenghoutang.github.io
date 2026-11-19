import {L,F} from './core.mjs';
export function steps(q){const a=q.variant+1,v=Number(q.family.at(-1))-1,d=q.difficulty;let formula,note;
switch(q.topic){
case 'domain':
 if(d==='easy'){formula=v?L`x-${a}\ne0\iff x\in\mathbb R\setminus\{${a}\}`:L`x-${a}\ge0\iff x\in[${a},+\infty)`;note=v?'分母非零是唯一限制；不用额外要求分母为正。':'根号内可以等于零，因此左端点包含在定义域中。';}
 else if(d==='medium'){formula=v?L`\begin{cases}x-${a}\ge0,\\x-${a+2}\ne0\end{cases}\iff x\in[${a},${a+2})\cup(${a+2},+\infty)`:L`\begin{cases}x-${a}>0,\\${a+3}-x\ge0\end{cases}\iff x\in(${a},${a+3}]`;note='同一函数内各部分必须同时有意义，所以取所有条件的交集，注意对数与根式对零的要求不同。';}
 else if(v){formula=L`\begin{aligned}\min_{x\ge${a+1}}(x^2-${2*a}x+m)&=\min_{x\ge${a+1}}[(x-${a})^2+m-${a*a}]\\&=1+m-${a*a},\\f\text{ 处处有定义}&\iff m\ge${a*a-1}.\end{aligned}`;note='最小点是给定半轴的左端点，不是被排除的对称轴 x=a；根号允许被开方数为零，所以临界 m 可取。';}
 else{formula=L`\begin{aligned}t=\log_{${a}}x:\quad&x>0,\\t(2-t)\ge0,\ t\ne1&\iff0\le t\le2,\ t\ne1,\\&\iff1\le x\le${a*a},\ x\ne${a}.\end{aligned}`;note='换元前先保证真数为正；因底数大于 1，反解对数不等式时方向不变。中间剔除点来自分母，不能把整段区间一起丢掉。';}break;
case 'properties':
 if(d==='easy'){formula=v?L`f(-x)=(-x)^{${2*a+1}}=-x^{${2*a+1}}=-f(x)`:L`f(-x)=(-x)^{${2*a}}+1=x^{${2*a}}+1=f(x)`;note='定义域为整个实数轴，先满足关于原点对称这一前提；再用代入 -x 的函数值判定奇偶性。';}
 else if(d==='medium'){formula=v?L`f(${10*a+1})=f(1+10\cdot${a})=f(1)=3`:L`\begin{aligned}g(${a})&=f(${a})+${a}=${3*a},\\g(-${a})&=-g(${a})=-${3*a},\\f(-${a})&=g(-${a})-${a}=-${4*a}.\end{aligned}`;note=v?'已知 a 是周期就足够使用整倍数平移，不要求它是最小正周期。':'具有奇性的是 g 而不是 f，最后要把加上的常数再减掉一次。';}
 else if(v){formula=L`\begin{aligned}f(-t)&=-f(t),\quad f'(t)=1+\frac2{1-t^2}>0,\\u&=\frac{x-${a}}{x+${a}},\quad w=\frac{x-${2*a}}{x+${2*a}},\\u,w\in(-1,1)&\iff x>0,\\f(u)+f(w)>0&\iff u>-w\\&\iff\frac{2(x^2-${2*a*a})}{(x+${a})(x+${2*a})}>0\\&\iff x>${a}\sqrt2.\end{aligned}`;note='单调性转换必须在两个自变量都落在定义域时使用。由 x>0 可知通分分母为正，才能直接比较分子。';}
 else{formula=L`\begin{aligned}f(x^2-${a}x)+f(2x-${a})<0&\iff f(x^2-${a}x)<f(${a}-2x)\\&\iff x^2+(2-${a})x-${a}<0,\\\Delta&=${a*a+4}.\end{aligned}`;note='先用奇性把右侧负号移入函数，再利用严格递增比较自变量；二次式开口向上，解集为两个不同实根之间的开区间。';}break;
case 'exp-log':
 if(d==='easy'){formula=v?L`\log_{${a}}(${a}^3)=3\quad(${a}>0,\ ${a}\ne1)`:L`${a}^2\cdot${a}^3=${a}^{2+3}=${a}^5`;note=v?'对数的值是满足底数的几次方等于真数的那个指数。':'同底数幂相乘是指数相加，不是指数相乘。';}
 else if(d==='medium'){formula=v?L`\begin{aligned}t&=\log_2x,\\t^2-${2*a+1}t+${a*(a+1)}&=(t-${a})(t-${a+1})=0,\\x_1x_2&=2^{${a}}2^{${a+1}}=2^{${2*a+1}}.\end{aligned}`:L`\log_2\frac{x^2}{y}=2\log_2x-\log_2y=2\cdot${a}-${a+1}=${a-1}`;note=v?'换元 t 的根要用 x=2ᵗ 换回，不能把两个 t 根的乘积误当成两个 x 根的乘积。':'已知对数有意义，x、y 均正，可合法使用积、商与幂的运算法则。';}
 else if(v){formula=L`\begin{aligned}t=2^{|x|}&\in[1,+\infty),\\h(t)&=t+\frac{${a*a}}t,\quad h'(t)=1-\frac{${a*a}}{t^2},\\h(1)&=${a*a+1},\quad h(${a})=${2*a},\\\text{四个不同 }x&\iff\text{两个不同 }t>1\\&\iff ${2*a}<k<${a*a+1}.\end{aligned}`;note='t=1 仅对应 x=0，t>1 才对应一正一负两个 x。下端两个 t 合并，上端出现 t=1，均不能产生四个不同根。';}
 else{formula=L`\begin{aligned}&0<x<${a*a},\\\log_{${a}}[x(${a*a}-x)]\ge1&\iff x(${a*a}-x)\ge${a}\\&\iff x^2-${a*a}x+${a}\le0,\\x_{1,2}&=\frac{${a*a}\pm\sqrt{${a**4-4*a}}}{2}.\end{aligned}`;note='两根之和正、乘积正，且都小于 a²，所以整个闭区间都满足真数限制；对数不等式允许等号，两个根可取。';}break;
case 'piecewise':
 if(d==='easy'){formula=v?L`-${a+1}<0\Longrightarrow f(-${a+1})=-(-${a+1})=${a+1}`:L`|${a}-${2*a+1}|=|-${a+1}|=${a+1}`;note=v?'先按自变量符号选分支，再代入该分支表达式。':'先算绝对值内部的符号，负数的绝对值取其相反数。';}
 else if(d==='medium'){formula=v?L`x=${a}\pm${a+2}\Longrightarrow x_1=-2,\ x_2=${2*a+2},\quad x_1x_2=-${4*a+4}`:L`f(-${a})=(-${a})^2=${a*a}\ge0\Longrightarrow f(f(-${a}))=f(${a*a})=${a*a+1}`;note=v?'绝对值等于正数给出两个分支，两个解都要计入根的乘积。':'第二次函数作用的输入已经变为非负数，必须重新选择分支。';}
 else if(v){formula=L`\begin{aligned}x\le${a+1}:\quad(x-${a})^2=m&\Longrightarrow x=${a}\pm\sqrt m,\\\text{该段两个不同根}&\iff0<m\le1,\\x>${a+1}:\quad x-${a+1}=m&\Longrightarrow x=m+${a+1},\\\text{该段一个根}&\iff m>0.\end{aligned}`;note='两个分支的定义域不重叠，根可直接相加。m=1 时左段右端点仍包含，故右端可取；m=0 时右段根位于被排除端点，必须排除。';}
 else{formula=L`\begin{aligned}|x^2-${2*a}x|=m&\iff\begin{cases}x^2-${2*a}x=m\end{cases}\ \text{或}\ \begin{cases}x^2-${2*a}x=-m\end{cases}\quad(m\ge0),\\\Delta_+&=4(${a*a}+m),\quad\Delta_-=4(${a*a}-m),\\\text{四个不同根}&\iff m>0,\ \Delta_->0\\&\iff0<m<${a*a}.\end{aligned}`;note='m>0 保证两组根不重合；m=0 时两方程相同。上端第二组有重根，故也不能计入四根范围。';}break;
case 'trig-function':
 if(d==='easy'){formula=v?L`-1\le\sin x\le1\Longrightarrow -${a}\le${a}\sin x\le${a}`:L`T=\frac{2\pi}{|\omega|}=\frac{2\pi}{${a}}`;note=v?'取 x=π/2+2kπ 可以达到上界。':'内层角速度越快，周期越短；最小正周期应是 2π 除以角速度。';}
 else if(d==='medium'){formula=v?L`${a}(\sin x+\cos x)=${a}\sqrt2\sin\left(x+\frac\pi4\right)\le${a}\sqrt2`:L`\sin(${a}x)=0\iff x=\frac{k\pi}{${a}},\quad0\le k<${2*a},\ k\in\mathbb Z`;note=v?'取 x=π/4+2kπ 时辅助角为 π/2，等号可达。':'区间含 0、不含 2π，故 k 从 0 到 2a-1，共 2a 个，不能把两端都计入。';}
 else if(v){formula=L`\begin{aligned}t&=\sin x+\cos x\in[-\sqrt2,\sqrt2],\quad\sin x\cos x=\frac{t^2-1}2,\\t=\sqrt2:&\quad${a}\sqrt2+\frac k2\le${2*a}\\&\Longrightarrow k\le${4*a}-${2*a}\sqrt2.\end{aligned}`;note='取这个正的上界 k 后，目标是 t 的凸二次式，闭区间最大值在端点；正端点恰为 2a，负端点更小。因此必要上界同时充分，且能取到。';}
 else{formula=L`\begin{aligned}g(t)&=t^2-\frac t{${a}}-m,\quad t=\sin x,\\\text{四个不同 }x&\iff g\text{ 有两不同根且均在 }(-1,1),\\\Delta>0&\iff m>-\frac1{${4*a*a}},\\g(1)>0,\ g(-1)>0&\iff m<${F(a-1,a)}.\end{aligned}`;note='对称轴 1/(2a) 已在 (-1,1) 内，因此配合判别式和两端正值构成充要条件。t=0 在半开周期中也有两个原根，不需要额外剔除 m=0。';}break;
}return {formula,note};}
