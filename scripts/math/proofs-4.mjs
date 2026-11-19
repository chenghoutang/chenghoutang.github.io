import {L,F} from './core.mjs';
export function steps(q){const a=q.variant+1,n=a+3,v=Number(q.family.at(-1))-1,d=q.difficulty;let formula,note;
switch(q.topic){
case 'recurrence':
 if(d==='easy'){formula=v?L`a_4=a_1+3\cdot2=${a}+6=${a+6}`:L`a_{${a}}=${a}(${a}+1)=${a*(a+1)}`;note=v?'递推三次可达第 4 项，也可识别为公差 2 的等差数列。':'将题目所求下标代入通项，不要把 n 当成另一项的数值。';}
 else if(d==='medium'){formula=v?L`\begin{aligned}\frac1{(k+${a})(k+${a+1})}&=\frac1{k+${a}}-\frac1{k+${a+1}},\\\sum_{k=1}^{${a}}\frac1{(k+${a})(k+${a+1})}&=\frac1{${a+1}}-\frac1{${2*a+1}}=${F(a,(a+1)*(2*a+1))}.\end{aligned}`:L`\begin{aligned}b_n=a_n+1&\Longrightarrow b_{n+1}=2b_n,\quad b_1=${a+1},\\a_4&=b_4-1=2^3(${a}+1)-1=${8*a+7}.\end{aligned}`;note=v?'求和首项的前半分母是 a+1，最后余下的后半分母是 2a+1，裂项后只保留这两个边界。':'常数平移把非齐次递推化为等比数列，最后必须减回平移量。';}
 else if(v){formula=L`\begin{aligned}T_N&=\sum_{k=1}^N\frac{k^2}{2^k},\quad U_N=\sum_{k=1}^N\frac{k}{2^k}=2-\frac{N+2}{2^N},\\\frac{T_N}{2}&=\sum_{k=1}^N\frac{2k-1}{2^k}-\frac{N^2}{2^{N+1}}\\&=2U_N-\left(1-2^{-N}\right)-\frac{N^2}{2^{N+1}},\\T_{${n}}&=6-\frac{${n}^2+4\cdot${n}+6}{2^{${n}}}=${F(6*2**n-n*n-4*n-6,2**n)}.\end{aligned}`;note='错位相减时末端未配对项必须保留，否则会把有限和误写成无穷和 6；线性加权和再做一次错位相减即可。';}
 else{formula=L`\begin{aligned}a_{n+1}-1&=\frac{${a}(a_n-1)}{a_n+${a-1}},\\\frac1{a_{n+1}-1}&=\frac1{a_n-1}+\frac1{${a}},\\a_n-1&=\frac{${a}}n,\\\sum_{n=1}^{${a}}(a_n-1)(a_{n+1}-1)&=${a*a}\sum_{n=1}^{${a}}\left(\frac1n-\frac1{n+1}\right)=${F(a**3,a+1)}.\end{aligned}`;note='初值 a₁=a+1 给出倒数数列首项 1/a；推导同时表明 a_n>1，取倒数与原递推的所有分母都合法。';}break;
case 'line-circle':
 if(d==='easy'){formula=v?L`r^2=9,\quad r>0\Longrightarrow r=3`:L`k=\frac{(${2*a+1})-1}{${a}-0}=2`;note=v?'标准式圆心的平移不影响半径，右端常数是半径平方。':'两横坐标不同，斜率存在；先按同一顺序作纵、横坐标差。';}
 else if(d==='medium'){formula=v?L`y=${a},\quad x^2+y^2=${a*a+9}\Longrightarrow x=\pm3,\quad |AB|=3-(-3)=6`:L`d=\frac{|3\cdot${a}+4\cdot0+${2*a}|}{\sqrt{3^2+4^2}}=\frac{${5*a}}5=${a}`;note=v?'弦水平，两端横坐标差即为长度；也可由半径与圆心到直线距离组成的直角三角形求半弦。':'绝对值保证距离非负，分母使用直线法向量的模长。';}
 else if(v){formula=L`\begin{aligned}T=(x,y):\quad OT\perp PT&\Longrightarrow T\cdot(P-T)=0,\\${2*a}x&=x^2+y^2=${a*a},\\AB:&\quad x=${F(a,2)},\\d(O,AB)&=${F(a,2)}.\end{aligned}`;note='两切点都满足同一个线性方程，因此接触弦就是该直线；外点到圆心距离为半径两倍，确实存在两条切线。';}
 else{formula=L`\begin{aligned}PA\cdot PB&=R^2-OP^2=${3*a*a},\\AB^2&=4(R^2-d^2)=${16*a*a}-4d^2,\\PA^2+PB^2&=(PA+PB)^2-2PA\cdot PB\\&=${10*a*a}-4d^2\le${10*a*a}.\end{aligned}`;note='这里 PA、PB 都表示非负长度，P 在弦内部，故 PA+PB=AB。直线经过圆心时 d=0，可达到最大值。';}break;
case 'ellipse':
 if(d==='easy'){formula=v?L`c^2=A^2-B^2=${a*a+1}-1=${a*a},\quad |F_1F_2|=2c=${2*a}`:L`A^2=${4*a*a}\Longrightarrow 2A=${4*a}`;note='A、B 分别记长、短半轴，焦距是两焦点距离 2c，不是 c。';}
 else if(d==='medium'){formula=v?L`PF_1+PF_2=2A=2\sqrt{${a*a+1}}`:L`c^2=${4*a*a}-${3*a*a}=${a*a},\quad e=\frac cA=\frac{${a}}{${2*a}}=\frac12`;note=v?'椭圆的距离和恒定是定义，圆锥曲线上任一点都满足，不需要知道 P 的坐标。':'椭圆的 c²=A²-B²，与双曲线的加号不同；离心率应在 (0,1) 内。';}
 else if(v){formula=L`\begin{aligned}A&=\sqrt{${a*a+1}},\quad e=\frac{${a}}A,\quad p=\frac1A,\\\frac1{FA}&=\frac{1-e\cos\theta}{p},\quad\frac1{FB}=\frac{1+e\cos\theta}{p},\\\frac1{FA}+\frac1{FB}&=\frac2p=2\sqrt{${a*a+1}}.\end{aligned}`;note='两交点从焦点看位于相反射线上，角度余弦互为相反数，故方向项相消。焦点在椭圆内，正的焦半径都存在。';}
 else{formula=L`\begin{aligned}r_1+r_2&=2\sqrt{${a*a+1}},\\r_1^2+r_2^2&=|F_1F_2|^2=${4*a*a},\\2r_1r_2&=(r_1+r_2)^2-(r_1^2+r_2^2)=4,\\S&=\frac12r_1r_2\sin90^\circ=1.\end{aligned}`;note='可取 y²=1/a²、x²=(a²+1)(a²-1)/a²，验证椭圆和直角条件同时成立，且 y≠0。因此面积结论并非建立在不存在的点上。';}break;
case 'hyperbola':
 if(d==='easy'){formula=v?L`y=\pm\frac BAx=\pm\frac{${2*a}}{${a}}x=\pm2x`:L`A=\sqrt{${a*a}}=${a}\Longrightarrow\text{实轴长}=2A=${2*a}`;note=v?'渐近线由齐次部分 x²/A²-y²/B²=0 得到；斜率为 B/A，不是 A/B。':'正项在 x² 前，实轴沿 x 轴；标准式分母给的是实半轴平方。';}
 else if(d==='medium'){formula=v?L`c^2=A^2+B^2=${4*a*a},\quad e=\frac cA=\frac{${2*a}}{${a}}=2`:L`c^2=1+(${a*a-1})=${a*a},\quad |F_1F_2|=2c=${2*a}`;note='双曲线用 c²=A²+B²，其离心率大于 1；焦距依然是 2c。';}
 else if(v){formula=L`\begin{aligned}d_1d_2&=\frac{|y-${a}x|\,|y+${a}x|}{${a*a+1}}\\&=\frac{|y^2-${a*a}x^2|}{${a*a+1}}\\&=\frac{${a*a}}{${a*a+1}}.\end{aligned}`;note='两条直线的法向量模都相同，所以距离乘积的分母可合并；曲线方程使分子成为定值，绝对值不可漏。';}
 else{formula=L`\begin{aligned}r_1-r_2&=2A=${2*a},\\r_1^2+r_2^2&=4c^2=${4*(a*a+1)},\\2r_1r_2&=r_1^2+r_2^2-(r_1-r_2)^2=4,\\r_1r_2&=2.\end{aligned}`;note='取 x²=a²(a²+2)/(a²+1)、y²=1/(a²+1)，既在右支又满足直角条件，说明所设几何配置确实可行。';}break;
case 'parabola':
 if(d==='easy'){formula=v?L`y^2=4fx,\quad f=${a}\Longrightarrow\text{准线}:x=-${a}`:L`y^2=4fx,\quad f=${a}\Longrightarrow F=(${a},0)`;note='用焦点横坐标 f 统一记号：焦点 (f,0)、准线 x=-f，二者到顶点的距离相同。';}
 else if(d==='medium'){formula=v?L`PF=d(P,\{x=-${a}\})=x_P+${a}=${a+1}+${a}=${2*a+1}`:L`y_0y=2f(x+x_0)\Longrightarrow ${2*a}y=${2*a}(x+${a})\Longrightarrow y=x+${a}`;note=v?'抛物线上点到焦点的距离等于到准线的距离，不需要先算纵坐标再开根。':'切点满足曲线方程。也可隐式求导 2yy′=4f，在给定点得到斜率 1。';}
 else if(v){formula=L`\begin{aligned}FA&=\frac{2f}{1-\cos\theta},\quad FB=\frac{2f}{1+\cos\theta},\\\frac1{FA}+\frac1{FB}&=\frac1f=\frac1{${a}},\\FA=3t,\ FB=t:&\quad\frac1{3t}+\frac1t=\frac1{${a}}\\&\Longrightarrow t=${F(4*a,3)},\quad AB=4t=${F(16*a,3)}.\end{aligned}`;note='焦半径公式可从 x=f+r cosθ、y=r sinθ 代入曲线推得。两点位于焦点两侧，弦长才是两焦半径之和；水平射线无第二交点，不属于本题配置。';}
 else{formula=L`\begin{aligned}ky^2-${4*a}y+${8*a*a}&=0\quad(k\ne0),\\s=y_1+y_2&=\frac{${4*a}}k,\quad p=y_1y_2=\frac{${8*a*a}}k,\\\overrightarrow{FA}\cdot\overrightarrow{FB}&=\frac{p^2}{${16*a*a}}-\frac{s^2-2p}{4}+${a*a}+p\\&=${a*a}\left(1+\frac{12}k\right)=0\\&\Longrightarrow k=-12.\end{aligned}`;note='k=0 只有一个交点，先排除。k=-12 时原二次方程判别式为 400a²>0，确有两个不同交点，所得参数满足题意。';}break;
}return {formula,note};}
