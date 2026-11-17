(function(){
'use strict';
const P = window.PHYS = window.PHYS || {};
P.topics = [
  {id:'hooke',     name:`Hooke's law & spring constant`},
  {id:'describe',  name:'Describing oscillations'},
  {id:'damping',   name:'Damping'},
  {id:'pendulum',  name:'Pendulums'},
  {id:'resonance', name:'Resonance'},
  {id:'waves',     name:'Waves'}
];

/* ---------- helpers for the static question bank ---------- */
const Q = [];
let T = '';
const cnt = {};
function FL(f){
  const o = {};
  if (f) {
    if (f.indexOf('n') >= 0) o.notes = true;
    if (f.indexOf('t') >= 0) o.trap = true;
    if (f.indexOf('i') >= 0) o.inline = true;
  }
  return o;
}
function add(level, type, o, f){
  cnt[T] = (cnt[T] || 0) + 1;
  const id = T + '-' + (cnt[T] < 10 ? '0' : '') + cnt[T];
  Q.push(Object.assign({id: id, topic: T, level: level, type: type}, o, FL(f)));
}
// mc: first choice is the correct one (the engine shuffles the choices)
function mc(level, prompt, right, wrong, explain, f){
  add(level, 'mc', {prompt: prompt, choices: [right].concat(wrong), answer: 0, explain: explain}, f);
}
function multi(level, prompt, right, wrong, explain, f){
  add(level, 'multi', {prompt: prompt, choices: right.concat(wrong), answer: right.map(function(_, i){ return i; }), explain: explain}, f);
}
function tf(level, prompt, answer, explain, f){
  add(level, 'tf', {prompt: prompt, answer: answer, explain: explain}, f);
}
function num(level, prompt, answer, calc, unit, tol, explain, f){
  add(level, 'num', {prompt: prompt, answer: answer, unit: unit, tol: tol, calc: calc, explain: explain}, f);
}
function open(level, prompt, model, points, f){
  add(level, 'open', {prompt: prompt, model: model, points: points, explain: ''}, f);
}
function dp(n){ Q[Q.length - 1].dp = n; }
// worked solution: Given -> Formula -> Insert -> Result
function W(g, f, i, r){
  return '<b>Given:</b> ' + g + '<br><b>Formula:</b> ' + f + '<br><b>Insert:</b> ' + i + '<br><b>Result:</b> ' + r;
}

/* =================== HOOKE =================== */
T = 'hooke';

mc(1, `Which equation is Hooke's law?`,
  `F = &minus;k &middot; x`,
  [`F = &minus;x / k`, `F = k / x`, `F = m &middot; g &middot; x`],
  `Hooke's law says the spring force is proportional to the stretch: F = &minus;k&middot;x. F = &minus;x/k would make a stiffer spring (bigger k) pull back <i>less</i>; F = k/x would make the force <i>smaller</i> the further you stretch. Both contradict a real spring.`, 'i');

mc(1, `In F = &minus;k&middot;x, what does the minus sign tell you?`,
  `The spring force points opposite to the displacement (it pulls back towards the rest position).`,
  [`The spring constant k is negative.`, `The spring gets shorter when you pull on it.`, `The force is smaller than the extension.`],
  `The minus sign is about <b>direction</b>: the force is a restoring force, always pointing back to the rest position. k itself is always positive. For sizes (magnitudes) you simply use F = k&middot;x.`, 'i');

mc(1, `What is the unit of the spring constant k?`,
  `N/m`,
  [`N&middot;m`, `N`, `m/N`],
  `k = F / x, so the unit is newton per metre. N/m is also kg/s&sup2; (1 N = 1 kg&middot;m/s&sup2;, so 1 N/m = 1 kg/s&sup2;). N&middot;m would be a unit of energy, and N alone is only the force.`, 'i');

tf(1, `The unit N/m can also be written as kg/s&sup2;.`, true,
  `True. 1 N = 1 kg&middot;m/s&sup2;, so 1 N/m = 1 kg&middot;m/s&sup2; / m = 1 kg/s&sup2;. Your notes have this right.`, 'n');

mc(1, `A spring has a <b>large</b> spring constant k. What does that mean?`,
  `The spring is stiff: you need a large force for every metre of stretch.`,
  [`The spring is soft and stretches easily.`, `The spring is very long.`, `The spring is heavy.`],
  `k is the force needed per metre of stretch. Big k = stiff spring, small k = soft spring. Length and weight of the spring are not what k measures.`);

tf(1, `Hooke's law holds for every stretch, right up to the moment the spring breaks.`, false,
  `False. Hooke's law only holds in the <b>elastic region</b>. Beyond the elastic limit the F&ndash;x line bends and the spring is permanently deformed before it finally breaks.`, 'i');

mc(1, `What does the F&ndash;x graph of a spring look like inside the elastic region?`,
  `A straight line through the origin; its slope is k.`,
  [`A curve that gets steeper and steeper.`, `A horizontal line.`, `A straight line that starts above the origin.`],
  `Force and extension are proportional, so the graph is a straight line through (0|0). The slope F/x is the spring constant k. A line that starts above the origin would mean a force with no stretch.`);

tf(1, `The spring force always points in the same direction as the displacement.`, false,
  `False. The spring force is a restoring force: it points <b>opposite</b> to the displacement. That is the minus sign in F = &minus;k&middot;x.`);

num(2, `Spring A: a force of <b>4 N</b> stretches it by <b>2.0 cm</b>. Calculate its spring constant k in N/m.`,
  200, '4/0.02', `N/m`, 0.02,
  W(`F = 4 N, x = 2.0 cm = 0.020 m`, `k = F / x`, `k = 4 N / 0.020 m`, `k = 200 N/m`) + `<br>Tempting mistake: using x = 2.0 without converting cm to m gives 2 N/cm, not N/m.`, 'i');

mc(2, `Spring A: 4 N at x = 0.02 m. Spring B: 2 N at x = 0.04 m. Which spring is stiffer?`,
  `Spring A, k = 200 N/m (B has only 50 N/m); on an F&ndash;x graph A is the steeper line.`,
  [`Spring B, because it stretches further.`, `Both are equally stiff, because both lines go through the origin.`, `Spring B, k = 200 N/m (A has only 50 N/m).`],
  `Stiffness is the slope k = F/x. A: 4 / 0.02 = 200 N/m. B: 2 / 0.04 = 50 N/m. B stretches further for less force, so it is the <b>softer</b> one. Every spring in the elastic region gives a line through the origin; only the slope differs.`, 'i');

num(2, `Hanging-mass experiment (your table, row 1): a mass of <b>0.5 kg</b> stretches a spring by <b>0.008 m</b>. Use g = 9.81 m/s&sup2;. Calculate k in N/m.`,
  613.125, '0.5*9.81/0.008', `N/m`, 0.02,
  W(`m = 0.5 kg, x = 0.008 m, g = 9.81 m/s&sup2;`, `F = m&middot;g, then k = F / x`, `F = 0.5 kg &middot; 9.81 m/s&sup2; = 4.905 N; k = 4.905 N / 0.008 m`, `k &asymp; 613.1 N/m`) + `<br>This one matches your notes (613.125).`, 'ni');

num(2, `A spring has k = 200 N/m. How large is the force needed to stretch it by <b>3.5 cm</b>? Answer in N.`,
  7.000000000000001, '200*0.035', `N`, 0.02,
  W(`k = 200 N/m, x = 3.5 cm = 0.035 m`, `F = k &middot; x`, `F = 200 N/m &middot; 0.035 m`, `F = 7.0 N`));

num(2, `A spring (k = 300 N/m) is pulled with a force of <b>12 N</b>. How far does it stretch? Give the answer in <b>cm</b>.`,
  4, '12/300*100', `cm`, 0.02,
  W(`F = 12 N, k = 300 N/m`, `x = F / k`, `x = 12 N / 300 N/m = 0.040 m`, `x = 4.0 cm`) + `<br>Multiply by 100 to go from m to cm.`);

num(2, `<b>Spot the mistake.</b> In your table, row 3: m = 2.5 kg, length L = 0.069 m, initial length L<sub>0</sub> = 0.017 m. You wrote k = 437.5 N/m. Calculate the correct k in N/m (g = 9.81 m/s&sup2;).`,
  471.63461538461536, '2.5*9.81/(0.069-0.017)', `N/m`, 0.02,
  W(`m = 2.5 kg, L = 0.069 m, L<sub>0</sub> = 0.017 m`, `x = L &minus; L<sub>0</sub>, F = m&middot;g, k = F / x`, `x = 0.069 m &minus; 0.017 m = 0.052 m; F = 2.5 kg &middot; 9.81 m/s&sup2; = 24.525 N; k = 24.525 N / 0.052 m`, `k &asymp; 471.6 N/m`) + `<br>Your 437.5 comes from 2.5 &middot; <b>9.1</b> / 0.052: the digits of g slipped (9.1 instead of 9.81). Easy to do. Also note that the extension is L &minus; L<sub>0</sub>, not L itself.`, 'nt');

mc(2, `<b>Spot the mistake.</b> Row 4 of your table: m = 3.5 kg, x = 0.067 m. You wrote k = 496.79 N/m. What is the correct value (g = 9.81 m/s&sup2;)?`,
  `512.5 N/m`,
  [`496.79 N/m (your value is correct)`, `5.12 N/m (x was used in cm)`, `0.0020 N/m (x divided by F)`],
  `F = 3.5 &middot; 9.81 = 34.335 N, k = F/x = 34.335 / 0.067 = <b>512.5 N/m</b>. Your 496.79 comes from 3.5 &middot; <b>9.51</b> / 0.067: a small typing slip in g (9.51 instead of 9.81). 5.12 appears if you put x = 6.7 (cm) into the formula; 0.0020 appears if you divide the wrong way round (x / F).`, 'nt');

mc(2, `The initial length of a spring is 1.7 cm. Hanging a mass makes it 4.7 cm long. What is the extension x in metres?`,
  `0.030 m`,
  [`0.047 m (the whole new length)`, `0.064 m (the lengths added)`, `3.0 m (cm not converted)`],
  `x = L &minus; L<sub>0</sub> = 4.7 cm &minus; 1.7 cm = 3.0 cm = 0.030 m. Hooke's law uses the <b>change</b> in length, measured from the original length, and in metres.`, 'n');

mc(2, `<b>Spot the mistake.</b> A student calculates k = 6 N / 2 cm = 3 N/m. What is the correct spring constant?`,
  `300 N/m`,
  [`3 N/m (the student is right)`, `12 N/m`, `0.03 N/m`],
  `2 cm = 0.02 m, so k = 6 N / 0.02 m = 300 N/m. The student forgot to convert cm to m (3 is N/cm, not N/m). Always convert to metres before you divide.`, 't');

num(2, `A mass hangs on a spring with k = 250 N/m and stretches it by <b>6.0 cm</b>. What is the mass in kg? (g = 9.81 m/s&sup2;)`,
  1.529051987767584, '250*0.06/9.81', `kg`, 0.02,
  W(`k = 250 N/m, x = 6.0 cm = 0.060 m, g = 9.81 m/s&sup2;`, `F = k&middot;x and F = m&middot;g, so m = k&middot;x / g`, `F = 250 N/m &middot; 0.060 m = 15 N; m = 15 N / 9.81 m/s&sup2;`, `m &asymp; 1.53 kg`));

num(2, `The four correct k values from your experiment are 613.1, 490.5, 471.6 and 512.5 N/m. What is their average?`,
  521.925, '(613.1+490.5+471.6+512.5)/4', `N/m`, 0.02,
  W(`613.1, 490.5, 471.6, 512.5 N/m`, `average = sum / 4`, `(613.1 + 490.5 + 471.6 + 512.5) N/m / 4 = 2087.7 N/m / 4`, `&asymp; 522 N/m`) + `<br>A best-fit line through the origin gives about 497 N/m, so you can say k &asymp; 500 N/m.`, 'n');

mc(1, `In the experiment, which force goes into k = F / x for a hanging mass?`,
  `The weight of the mass, F = m&middot;g`,
  [`The mass m in kg`, `The length L of the spring`, `The mass divided by g, m / g`],
  `Hooke's law needs a <b>force</b> in newtons. The hanging mass pulls with its weight, F = m&middot;g (with g = 9.81 m/s&sup2;). The mass in kg is not a force.`, 'n');

multi(2, `Which statements are true for a spring inside its elastic region?`,
  [`Force and extension are proportional.`, `The spring returns to its original length when released.`, `The F&ndash;x graph is a straight line through the origin.`],
  [`The spring stays stretched after you let go.`, `A twice as large force gives four times the extension.`],
  `Inside the elastic region F &prop; x: double the force gives <b>double</b> the extension (not four times), and the spring springs back. Staying permanently stretched happens only <b>beyond</b> the elastic limit.`);

mc(3, `Two springs: A with k = 200 N/m and B with k = 50 N/m. Both are pulled with 10 N. What happens?`,
  `B stretches 4 times as far as A (20 cm instead of 5 cm).`,
  [`A stretches 4 times as far as B.`, `Both stretch equally, because the force is the same.`, `B stretches half as far as A.`],
  `x = F / k. A: 10 / 200 = 0.05 m = 5 cm. B: 10 / 50 = 0.20 m = 20 cm. The softer spring (small k) stretches further for the same force.`);

open(3, `In your experiment the k values were 613, 490, 472 and 512 N/m. Explain why they scatter so much, and how you could get a more reliable k.`,
  `The extensions are tiny (the first one is only 8 mm), so misreading the scale by 1 mm changes k by more than 10 % (613 becomes 545 or 701 N/m). Better: use several masses and bigger extensions, then average the k values or take the slope of the F&ndash;x graph.`,
  [`Extensions are very small (e.g. 8 mm)`, `A 1 mm reading error changes k by more than 10 %`, `Remedy: several masses / bigger extensions`, `Remedy: average or use the slope of the F&ndash;x graph`], 'n');

open(3, `What is the elastic region of a spring? What is different outside it?`,
  `In the elastic region force and extension are proportional (Hooke's law holds, F&ndash;x graph is a straight line through the origin) and the spring returns to its original length. Beyond the elastic limit the line bends, the spring stays deformed and finally breaks; Hooke's law no longer applies.`,
  [`Proportional F and x, straight line through the origin`, `Spring returns to its original length`, `Beyond the limit: line bends, permanent deformation, finally breaks`, `Hooke's law does not apply outside`]);

open(3, `Explain how you find the spring constant from an F&ndash;x graph, and what a steeper line means.`,
  `k is the slope of the straight line: k = F / x (read one point, e.g. 4 N at 0.02 m gives 200 N/m). A steeper line means a larger k, i.e. a stiffer spring that needs more force per metre.`,
  [`k = slope = F / x`, `Use a point on the line (with SI units: N and m)`, `Steeper line = bigger k = stiffer spring`]);

num(2, `Hooke's law: a spring has k = 490.5 N/m (your row 2). How large is the force at an extension of 0.030 m? Compare with the weight of 1.5 kg (g = 9.81 m/s&sup2;).`,
  14.715, '490.5*0.030', `N`, 0.02,
  W(`k = 490.5 N/m, x = 0.030 m`, `F = k &middot; x`, `F = 490.5 N/m &middot; 0.030 m`, `F = 14.7 N`) + `<br>That equals the weight of 1.5 kg: 1.5 &middot; 9.81 = 14.715 N. Good, row 2 of your table is consistent.`, 'n');

/* =================== DESCRIBE =================== */
T = 'describe';

mc(1, `What is the <b>amplitude r</b> of an oscillation?`,
  `The maximum elongation: the largest distance from the rest position.`,
  [`The distance from the lowest to the highest point.`, `The time for one full oscillation.`, `The number of oscillations per second.`],
  `r is measured from the rest (equilibrium) position to the extreme point. From lowest to highest point is 2r (twice the amplitude). Time for one oscillation is the period T; oscillations per second is the frequency f.`, 'i');

mc(1, `What is the <b>period T</b>?`,
  `The time for ONE full oscillation (there and back).`,
  [`The time for half an oscillation (top to bottom).`, `The number of oscillations per second.`, `The largest distance from the rest position.`],
  `One full oscillation means back to the starting point and moving the same way again, e.g. top &rarr; bottom &rarr; top. Top &rarr; bottom alone is only half a period. The number per second is the frequency.`, 'i');

mc(1, `What does a frequency of 1 Hz mean?`,
  `One full oscillation per second (1 Hz = 1/s).`,
  [`One oscillation takes 1 metre.`, `The amplitude is 1 cm.`, `One half-swing per second.`],
  `The hertz is the unit of frequency: full oscillations per second. One half-swing per second would be only 0.5 Hz, because one full oscillation has two half-swings.`);

mc(1, `Which pair of formulas links period and frequency?`,
  `f = 1/T and T = 1/f`,
  [`f = T and T = f`, `f = 2&pi;/T and T = 2&pi;f`, `f = T/2&pi;`],
  `If one oscillation takes T seconds, then 1/T oscillations fit into one second. 2&pi; belongs to the angular velocity &omega;, not to f.`, 'i');

mc(1, `Which formula gives the angular velocity &omega; from the period T?`,
  `&omega; = 2&pi; / T`,
  [`&omega; = 2&pi; &middot; T`, `&omega; = T / 2&pi;`, `&omega; = 1 / T`],
  `One oscillation = one full turn = 2&pi; rad, and it takes T seconds, so &omega; = 2&pi;/T (rad/s). 1/T is the frequency f. Multiplying by T would make &omega; bigger for slower oscillations, which cannot be right.`, 'i');

tf(1, `&omega; = 2&pi; &middot; f.`, true,
  `True. Since f = 1/T, &omega; = 2&pi;/T = 2&pi;&middot;f. The unit is rad/s (also written 1/s).`);

mc(1, `For y(t) = r &middot; cos(&omega; &middot; t): where is the object at t = 0?`,
  `At the maximum elongation, y = r.`,
  [`At the rest position, y = 0.`, `At the minimum, y = &minus;r.`, `It depends on &omega;.`],
  `cos(0) = 1, so y(0) = r. With sin it would be sin(0) = 0, i.e. the rest position. &omega; drops out at t = 0 because &omega; &middot; 0 = 0.`, 'i');

mc(1, `For y(t) = r &middot; sin(&omega; &middot; t): where is the object at t = 0?`,
  `At the rest position, y = 0.`,
  [`At the maximum elongation, y = r.`, `At the minimum, y = &minus;r.`, `Half way between rest and maximum.`],
  `sin(0) = 0. Sine starts at the rest position, cosine starts at the maximum. So it matters which one you choose.`);

tf(1, `The sine and cosine oscillation have the same shape, but the sine reaches its maximum at the same time as the cosine does.`, false,
  `False. They have the same shape, but they are shifted by a quarter period (T/4): the sine reaches its maximum T/4 <b>later</b> than the cosine.`, 'nt');

tf(1, `360&deg; corresponds to 2&pi; rad, and 180&deg; to &pi; rad.`, true,
  `True. rad = deg &middot; &pi;/180. 90&deg; = &pi;/2, 180&deg; = &pi;, 270&deg; = 3&pi;/2, 360&deg; = 2&pi;. One radian is about 57.3&deg;.`);

mc(1, `<b>Spot the mistake.</b> Your first attempt at the oscillation formula was y(t) = r &middot; cos(t). What is missing?`,
  `The angular velocity: it must be y(t) = r &middot; cos(&omega; &middot; t).`,
  [`Nothing, the formula is complete.`, `The period: it must be y(t) = r &middot; cos(T).`, `The minus sign: y(t) = &minus;r &middot; cos(t).`],
  `Without &omega; the formula would force every oscillation to have the same speed (&omega; = 1 rad/s). The factor &omega; &middot; t is the angle covered after time t and tells how fast the oscillation is.`, 'nti');

num(2, `A weight on a spring needs <b>T = 0.50 s</b> for one oscillation. Calculate the frequency f in Hz.`,
  2, '1/0.5', `Hz`, 0.02,
  W(`T = 0.50 s`, `f = 1 / T`, `f = 1 / 0.50 s`, `f = 2.0 Hz`), 'i');

num(2, `From your damping table the period works out as T &asymp; 0.82 s. What is the frequency in Hz? (Round to 2 decimals.)`,
  1.2195121951219512, '1/0.82', `Hz`, 0.02,
  W(`T = 0.82 s`, `f = 1 / T`, `f = 1 / 0.82 s`, `f &asymp; 1.22 Hz`), 'n'); dp(2);

num(2, `From your damping table the period works out as T &asymp; 0.82 s. Calculate the angular velocity &omega; in rad/s.`,
  7.662421106316569, '2*Math.PI/0.82', `rad/s`, 0.02,
  W(`T = 0.82 s`, `&omega; = 2&pi; / T`, `&omega; = 2&pi; / 0.82 s`, `&omega; &asymp; 7.66 rad/s`) + `<br>(The Damping page rounds this to 7.7 rad/s.)`, 'ni');

num(2, `An oscillator has a frequency of <b>1.5 Hz</b>. Calculate &omega; in rad/s.`,
  9.42477796076938, '2*Math.PI*1.5', `rad/s`, 0.02,
  W(`f = 1.5 Hz`, `&omega; = 2&pi; &middot; f`, `&omega; = 2&pi; &middot; 1.5 Hz`, `&omega; &asymp; 9.42 rad/s`));

num(2, `A weight oscillates as y(t) = r &middot; cos(&omega; &middot; t) with r = 0.12 m and &omega; = 5 rad/s. Find the elongation at <b>t = 0.5 s</b> in m. (Calculator in RAD mode!)`,
  -0.09613723386563204, '0.12*Math.cos(5*0.5)', `m`, 0.03,
  W(`r = 0.12 m, &omega; = 5 rad/s, t = 0.5 s`, `y = r &middot; cos(&omega; &middot; t)`, `y = 0.12 m &middot; cos(5 rad/s &middot; 0.5 s) = 0.12 m &middot; cos(2.5)`, `cos(2.5) = &minus;0.801, so y &asymp; &minus;0.096 m`) + `<br>Negative means below the rest position. In DEG mode you would get cos(2.5&deg;) &asymp; 1.00 and a wrong y &asymp; 0.12 m.`);

mc(2, `<b>Spot the mistake.</b> A student evaluates y = 10 cm &middot; cos(2 rad/s &middot; 1 s) and gets 9.99 cm. What is the correct elongation?`,
  `&minus;4.16 cm (calculator in RAD mode)`,
  [`9.99 cm (the student is right)`, `4.16 cm (sign dropped)`, `&minus;0.999 cm`],
  `&omega;&middot;t = 2 rad, so you need cos(2) in <b>RAD</b> mode = &minus;0.416, giving &minus;4.16 cm. The student had the calculator in DEG mode and calculated cos(2&deg;) = 0.9994. The angle &omega;&middot;t is always in radians.`, 't');

num(2, `Convert <b>60&deg;</b> to radians. Give the answer as a decimal.`,
  1.0471975511965976, '60*Math.PI/180', `rad`, 0.02,
  W(`angle = 60&deg;`, `rad = deg &middot; &pi; / 180`, `rad = 60 &middot; &pi; / 180`, `&asymp; 1.047 rad (= &pi;/3)`), 'i');

mc(2, `Which angle in radians equals 270&deg;?`,
  `3&pi;/2`,
  [`&pi;/2`, `2&pi;/3`, `3&pi;`],
  `270&deg; &middot; &pi;/180 = 1.5&pi; = 3&pi;/2 (three quarters of a full turn of 2&pi;). &pi;/2 is 90&deg;; 3&pi; is one and a half turns.`);

mc(2, `A weight is at its <b>highest point</b> (maximum elongation) at t = 0. Which function matches?`,
  `y = r &middot; cos(&omega; &middot; t), because cos starts at the maximum.`,
  [`y = r &middot; sin(&omega; &middot; t), because sin starts at the maximum.`, `Both fit equally well, sin and cos are the same.`, `y = r &middot; sin(t)`],
  `Choose the function that matches the start: cos starts at y = r, sin starts at y = 0. They are shifted by T/4, so they are not the same function.`);

mc(2, `A weight passes through the rest position at t = 0, moving upwards. Which function matches?`,
  `y = r &middot; sin(&omega; &middot; t)`,
  [`y = r &middot; cos(&omega; &middot; t)`, `y = &minus;r &middot; sin(&omega; &middot; t)`, `y = r &middot; cos(2&pi;)`],
  `sin(0) = 0 is the rest position, and the positive sine then rises towards +r. Cosine would put the object at its maximum at t = 0. (&minus;r&middot;sin would move downwards first.)`, 'i');

mc(2, `<b>Spot the mistake.</b> You measure that the weight needs 0.4 s to go from the top to the bottom, and conclude T = 0.4 s. What is wrong?`,
  `Top to bottom is only half an oscillation, so T = 0.8 s.`,
  [`Nothing, T = 0.4 s is correct.`, `T = 0.2 s, because top to bottom is a quarter period.`, `T = 0.4 s is the frequency in Hz.`],
  `A full oscillation is top &rarr; bottom &rarr; <b>top</b>. One way is a half period, so T = 2 &middot; 0.4 s = 0.8 s. The same trap appears in your damping table: the turning points are half periods apart.`, 'nt');

num(2, `A weight completes <b>20 oscillations in 16 s</b>. Calculate its frequency in Hz.`,
  1.25, '20/16', `Hz`, 0.02,
  W(`20 oscillations in 16 s`, `f = number of oscillations / time`, `f = 20 / 16 s`, `f = 1.25 Hz (T = 0.80 s)`));

num(2, `For y = r &middot; cos(&omega; &middot; t) the oscillation has T = 0.80 s. After how many seconds does the weight first reach the rest position?`,
  0.2, '0.8/4', `s`, 0.02,
  W(`T = 0.80 s`, `cosine starts at r and reaches y = 0 a quarter period later: t = T / 4`, `t = 0.80 s / 4`, `t = 0.20 s`) + `<br>Check: &omega;&middot;t = &pi;/2 and cos(&pi;/2) = 0.`);

mc(2, `Oscillator A has T = 2 s, oscillator B has T = 1 s. Which statement is correct?`,
  `B has twice the frequency and twice the angular velocity of A.`,
  [`B has half the frequency of A.`, `B has the same &omega; as A, only the amplitude differs.`, `B has twice the period of A.`],
  `f = 1/T: A 0.5 Hz, B 1 Hz. &omega; = 2&pi;/T: A 3.14 rad/s, B 6.28 rad/s. The shorter the period, the larger f and &omega;.`);

multi(2, `Which of these are correct ways to calculate the angular velocity &omega;?`,
  [`&omega; = 2&pi; / T`, `&omega; = 2&pi; &middot; f`],
  [`&omega; = 2&pi; &middot; T`, `&omega; = f / 2&pi;`],
  `&omega; = 2&pi;/T = 2&pi;f. The wrong versions mix up T and f (f is 1/T) or put 2&pi; in the denominator.`);

mc(2, `What does &omega; tell you?`,
  `How much angle (in radians) is covered per second; one full oscillation is 2&pi; rad and takes T seconds.`,
  [`How many full oscillations happen per second.`, `How long one oscillation takes.`, `How far the weight moves from the rest position.`],
  `Oscillations per second is f, the time of one oscillation is T, and the largest distance is r. &omega; = 2&pi;/T is the angle per second on the unit circle.`);

tf(1, `The elongation y(t) is the distance of the object from its rest position at time t.`, true,
  `True. y(t) tells you where the object is at time t, measured from the rest (equilibrium) position. Its largest value is the amplitude r.`);

open(3, `Use the unit circle to explain where the sine curve of an oscillation comes from.`,
  `A point moves around a circle of radius r with constant angular velocity &omega;. After time t it has turned by the angle &alpha; = &omega;&middot;t, and its height is y = r&middot;sin(&alpha;) (right-angled triangle: sin &alpha; = y / r). Plotting this height against time gives the sine curve; one full turn (2&pi;) corresponds to one period T.`,
  [`Point moves around circle (radius r) with constant &omega;`, `Angle &alpha; = &omega;&middot;t, height y = r&middot;sin(&alpha;) from the triangle`, `Height plotted against t gives the sine curve`, `One turn = 2&pi; = one period T`]);

open(3, `Why must the formula for the elongation contain &omega;? What would y(t) = r&middot;cos(t) describe, and why is that a problem?`,
  `&omega;&middot;t is the angle covered after time t, and &omega; = 2&pi;/T sets how fast the oscillation runs. Without &omega; the formula always means &omega; = 1 rad/s, so every oscillation would have the same period of about 6.3 s, whatever the real oscillator does.`,
  [`&omega;&middot;t is the angle covered after time t`, `&omega; = 2&pi;/T sets the speed of the oscillation`, `r&middot;cos(t) means &omega; = 1 rad/s: one fixed period for every oscillator`], 'n');

open(3, `Your notes say that sin or cos does matter. Explain how you decide which one to use, and how the two curves are related.`,
  `Look at where the object is at t = 0: if it starts at the maximum use r&middot;cos(&omega;t) (cos(0) = 1); if it starts at the rest position use r&middot;sin(&omega;t) (sin(0) = 0). The curves have the same shape but are shifted by a quarter period T/4.`,
  [`Decide using the position at t = 0`, `cos starts at y = r, sin starts at y = 0`, `Same shape, shifted by T/4`], 'n');

/* ---- additions: graph reading, equation choice, rad -> deg ---- */
mc(2, `An oscillator has r = 5 cm and T = 2 s. At t = 0 the weight is at its <b>highest point</b>. Which equation describes it (t in s)?`,
  `y(t) = 0.05 m &middot; cos(&pi; &middot; t)`,
  [`y(t) = 0.05 m &middot; sin(&pi; &middot; t)`, `y(t) = 0.05 m &middot; cos(2 &middot; t)`, `y(t) = 0.05 m &middot; cos(2&pi; &middot; t)`, `y(t) = 5 m &middot; cos(&pi; &middot; t)`],
  W(`r = 5 cm = 0.05 m, T = 2 s, starts at the maximum`, `y = r &middot; cos(&omega;t) with &omega; = 2&pi; / T`, `&omega; = 2&pi; / 2 s = &pi; rad/s`, `y(t) = 0.05 m &middot; cos(&pi; &middot; t)`) + `<br>sin would start at y = 0; cos(2&middot;t) uses T instead of &omega;; cos(2&pi;t) forgets to divide by T (that would be T = 1 s); 5 m forgets cm &rarr; m.`);

const GRAPH_SVG = (function(){
  const x0 = 40, x1 = 300, yc = 80, sx = (x1 - x0) / 1.2, sy = 20;
  let pts = '';
  for (let i = 0; i <= 120; i++) { const t = i * 0.01; pts += (x0 + sx * t).toFixed(1) + ',' + (yc - sy * 3 * Math.cos(2 * Math.PI * t / 0.4)).toFixed(1) + ' '; }
  let ticks = '';
  for (let k = 0; k <= 6; k++) { const x = (x0 + sx * 0.2 * k).toFixed(1); ticks += '<line x1="' + x + '" y1="' + (yc - 4) + '" x2="' + x + '" y2="' + (yc + 4) + '" style="stroke:var(--ink-3)"/><text x="' + x + '" y="' + (yc + 16) + '" text-anchor="middle" font-size="10" style="fill:var(--ink-3)">' + (0.2 * k).toFixed(1) + '</text>'; }
  let yt = '';
  [[3, '3'], [0, '0'], [-3, '&minus;3']].forEach(function(p){ const y = yc - sy * p[0]; yt += '<line x1="' + (x0 - 4) + '" y1="' + y + '" x2="' + (x0 + 4) + '" y2="' + y + '" style="stroke:var(--ink-3)"/><text x="' + (x0 - 8) + '" y="' + (y + 3) + '" text-anchor="end" font-size="10" style="fill:var(--ink-3)">' + p[1] + '</text>'; });
  return '<svg viewBox="0 0 320 160" role="img" aria-label="Graph of y in cm against t in s: a cosine with maximum 3 cm and maxima at 0, 0.4, 0.8 and 1.2 s" style="width:100%;max-width:360px;height:auto;display:block;margin:8px 0">' +
    '<line x1="' + x0 + '" y1="10" x2="' + x0 + '" y2="150" style="stroke:var(--ink-3)"/><line x1="' + x0 + '" y1="' + yc + '" x2="' + (x1 + 12) + '" y2="' + yc + '" style="stroke:var(--ink-3)"/>' +
    ticks + yt +
    '<polyline points="' + pts + '" fill="none" stroke-width="2" style="stroke:var(--blue)"/>' +
    '<text x="' + (x1 + 6) + '" y="' + (yc + 28) + '" text-anchor="end" font-size="11" style="fill:var(--ink-3)">t (s)</text>' +
    '<text x="' + (x0 + 6) + '" y="14" font-size="11" style="fill:var(--ink-3)">y (cm)</text></svg>';
})();

num(2, `The graph shows the elongation y of an oscillating weight. Read the period from the graph and calculate the frequency in Hz.` + GRAPH_SVG,
  2.5, '1/0.4', `Hz`, 0.03,
  W(`maxima at t = 0 s and t = 0.4 s, so T = 0.4 s`, `f = 1 / T`, `f = 1 / 0.4 s`, `f = 2.5 Hz`) + `<br>Read the period between two neighbouring maxima (or two neighbouring minima), not between a maximum and a minimum: that would be only half a period.`, 'i');

num(1, `Same graph: what is the amplitude r in cm?` + GRAPH_SVG,
  3, '3', `cm`, 0.03,
  W(`highest point of the curve: y = 3 cm, rest position y = 0`, `r = maximum elongation`, `r = 3 cm &minus; 0 cm`, `r = 3 cm`) + `<br>From the lowest to the highest point is 6 cm, which is 2r, not r.`);

num(2, `Convert <b>2.5 rad</b> to degrees. (Round to 1 decimal.)`,
  143.2394487827058, '2.5*180/Math.PI', `°`, 0.02,
  W(`angle = 2.5 rad`, `deg = rad &middot; 180 / &pi;`, `deg = 2.5 &middot; 180 / &pi;`, `&asymp; 143.2&deg;`) + `<br>Check: 1 rad &asymp; 57.3&deg;, so 2.5 rad &asymp; 143&deg;.`);
dp(1);

mc(2, `How many degrees is <b>3&pi;/2 rad</b>?`,
  `270&deg;`,
  [`135&deg;`, `540&deg;`, `90&deg;`],
  `deg = rad &middot; 180/&pi; = (3&pi;/2) &middot; 180/&pi; = 270&deg;. Also: &pi; = 180&deg;, so 3&pi;/2 is one and a half times 180&deg;. 135&deg; would be 3&pi;/4; 540&deg; is 3&pi;.`);

/* =================== DAMPING =================== */
T = 'damping';

mc(1, `What is <b>damping</b>?`,
  `Friction (e.g. air resistance, friction inside the spring) takes energy away, so the oscillation gradually dies out.`,
  [`An external force that makes the amplitude bigger.`, `A change of the period while the amplitude stays the same.`, `The spring being stretched beyond its elastic limit.`],
  `Damping removes energy from the oscillating system, so the amplitude shrinks until the weight comes to rest. A growing amplitude belongs to resonance; the elastic limit is about Hooke's law.`, 'i');

mc(1, `A weight on a spring is weakly damped. Which quantity stays the same while the oscillation dies out?`,
  `The frequency (and the period).`,
  [`The amplitude.`, `The energy of the oscillation.`, `The maximum elongation.`],
  `Amplitude (= maximum elongation) and energy decrease. The frequency stays the same: in your table the time between maxima stays about 0.82 s although the amplitude shrinks.`, 'ni');

tf(1, `With weak damping the frequency gets smaller and smaller as the oscillation dies out.`, false,
  `False. Only the amplitude gets smaller. Period and frequency stay (about) the same.`, 'ni');

mc(1, `In class the amplitude decreased <b>exponentially</b>. What does that mean?`,
  `In every half-swing the amplitude is multiplied by (about) the same factor, here about 0.8.`,
  [`In every half-swing the same amount (e.g. 8 cm) is subtracted.`, `The amplitude drops by the same number of cm every swing (40 &rarr; 30 &rarr; 20 &rarr; 10).`, `The amplitude stays constant and then suddenly drops.`],
  `Exponential decay: A<sub>n</sub> = A<sub>0</sub> &middot; q<sup>n</sup>. The <b>ratio</b> of successive amplitudes is constant (about 0.8), not the difference. Subtracting a fixed amount would reach zero after a few swings and then go negative.`, 'i');

mc(1, `Multiplying the amplitude by 0.8 is the same as dividing it by&hellip;`,
  `1.25 (= 5/4)`,
  [`0.2`, `8`, `0.8`],
  `0.8 = 4/5, so &times; 0.8 = &divide; 5/4 = &divide; 1.25. For example 40 cm &divide; 1.25 = 32 cm = 40 cm &middot; 0.8.`, 'n');

mc(1, `Which is an example of damping from your notes?`,
  `Shock absorbers of a car, which make the bouncing on the springs stop quickly.`,
  [`Pushing a child on a swing in rhythm with the swing.`, `A wine glass breaking when a loud sound hits it.`, `A rope moved up and down to make a wave.`],
  `Shock absorbers use friction to take energy away from the bouncing car. The swing and the wine glass are resonance examples; the rope is a wave.`, 'n');

tf(1, `Air resistance and friction inside the spring are causes of damping.`, true,
  `True. Different kinds of friction remove energy from the system.`);

num(2, `In class the amplitude was multiplied by 0.8 each half-swing, starting at <b>40 cm</b>. What is the amplitude after <b>3</b> half-swings?`,
  20.480000000000004, '40*Math.pow(0.8,3)', `cm`, 0.02,
  W(`A<sub>0</sub> = 40 cm, q = 0.8, n = 3`, `A<sub>n</sub> = A<sub>0</sub> &middot; q<sup>n</sup>`, `A<sub>3</sub> = 40 cm &middot; 0.8<sup>3</sup> = 40 cm &middot; 0.512`, `A<sub>3</sub> &asymp; 20.5 cm`), 'ni');

num(2, `A damped oscillation starts with A<sub>0</sub> = 25 cm. Each half-swing the amplitude is multiplied by 0.8. What is the amplitude after <b>5</b> half-swings?`,
  8.192000000000002, '25*Math.pow(0.8,5)', `cm`, 0.02,
  W(`A<sub>0</sub> = 25 cm, q = 0.8, n = 5`, `A<sub>n</sub> = A<sub>0</sub> &middot; q<sup>n</sup>`, `A<sub>5</sub> = 25 cm &middot; 0.8<sup>5</sup> = 25 cm &middot; 0.32768`, `A<sub>5</sub> &asymp; 8.2 cm`));

num(2, `Your damping table has maxima at t = 0 s and t = 3.28 s, with <b>4 full periods</b> in between. Calculate the period T in s.`,
  0.82, '3.28/4', `s`, 0.02,
  W(`4 periods in 3.28 s`, `T = total time / number of periods`, `T = 3.28 s / 4`, `T = 0.82 s`) + `<br>Then f = 1/T &asymp; 1.22 Hz and &omega; = 2&pi;/T &asymp; 7.7 rad/s.`, 'ni');

num(2, `Your damping table: the amplitude goes from y = 24 cm to the next turning point at y = &minus;20 cm. Calculate the ratio |y<sub>next</sub>| / |y<sub>before</sub>| (3 decimals).`,
  0.8333333333333334, '20/24', `` , 0.03,
  W(`|y| = 24 cm, then |y| = 20 cm`, `ratio = |y<sub>next</sub>| / |y<sub>before</sub>|`, `ratio = 20 cm / 24 cm`, `ratio &asymp; 0.83`) + `<br>Your ratios are all between 0.70 and 0.86, on average about 0.80: exponential decay with q &asymp; 0.8.`, 'n'); dp(3);

mc(2, `Your table has turning points at t = 0, 0.42, 0.86, 1.21 s&hellip; roughly every 0.41 s. What does the 0.41 s stand for?`,
  `A half period, so T &asymp; 0.82 s.`,
  [`A full period, so T &asymp; 0.41 s.`, `The frequency f = 0.41 Hz.`, `A quarter period, so T &asymp; 1.64 s.`],
  `Successive turning points are one HALF swing apart (top &rarr; bottom). Two of them make one period: 2 &middot; 0.41 s = 0.82 s. Mixing up half period and period is a typical mistake.`, 'nti');

mc(2, `<b>Spot the mistake.</b> A student says: &quot;The amplitude is 40 cm and shrinks by 8 cm each half-swing, so after 2 half-swings it is 24 cm.&quot; What is the correct value for exponential decay with factor 0.8?`,
  `25.6 cm: multiply twice, 40 &middot; 0.8 &middot; 0.8.`,
  [`24 cm: the student is right.`, `32 cm: only one half-swing has passed.`, `20.5 cm: that is after 3 half-swings.`],
  `Exponential decay multiplies by 0.8 each time: 40 &rarr; 32 &rarr; 25.6. The student subtracted a constant 8 cm, which is a linear decrease (and the second step would only be 6.4 cm, not 8).`, 't');

mc(2, `Two damped oscillators start with the same amplitude. Oscillator 1 has factor q = 0.8 per half-swing, oscillator 2 has q = 0.5. What happens?`,
  `Oscillator 2 is damped more strongly: its amplitude falls faster.`,
  [`Oscillator 1 is damped more strongly.`, `Oscillator 2 has the larger frequency.`, `Both die out equally fast, because both are exponential.`],
  `A smaller q means a bigger reduction per half-swing (halved each time instead of &minus;20 %). The frequency is not changed by damping.`);

multi(2, `Which statements about a weakly damped oscillation are correct?`,
  [`The amplitude gets smaller with time.`, `Energy is taken away from the oscillating system.`, `The period stays the same.`],
  [`The period gets longer.`, `The frequency gets smaller.`],
  `Damping acts on the amplitude (and energy). In class and in your data the period (about 0.82 s) and so the frequency stay the same.`);

tf(2, `In a damped oscillation the curve keeps its cosine shape and the same &omega;; only its amplitude shrinks from swing to swing.`, true,
  `True. Damping acts on the amplitude r only; &omega; (and so T and f) stay the same. On the graph you see a cosine-shaped curve inside a shrinking curved envelope.`);

num(3, `The amplitude starts at 40 cm and is multiplied by 0.8 each half-swing. After how many half-swings does it first fall <b>below 10 cm</b>? (Whole number.)`,
  7, 'Math.ceil(Math.log(0.25)/Math.log(0.8))', ``, 0.02,
  W(`A<sub>0</sub> = 40 cm, q = 0.8, goal A<sub>n</sub> &lt; 10 cm`, `A<sub>n</sub> = 40 cm &middot; 0.8<sup>n</sup>`, `n = 6: 40 &middot; 0.262 = 10.5 cm (still above); n = 7: 40 &middot; 0.210 = 8.4 cm`, `n = 7 half-swings`) + `<br>(Maths shortcut: 0.8<sup>n</sup> &lt; 0.25 gives n &gt; 6.2.)`);

open(3, `Describe what the position&ndash;time graph of a damped oscillation looks like, and say what changes and what does not change.`,
  `The graph is a cosine-shaped wave inside a shrinking curved envelope: the amplitude gets smaller from swing to swing (exponentially, in class about &times;0.8 per half-swing). The period (about 0.82 s in your data) and the frequency stay the same.`,
  [`Cosine-like curve in a shrinking envelope`, `Amplitude decreases exponentially (factor about 0.8 per half-swing)`, `Period / frequency stay the same`], 'n');

open(3, `Explain why a bouncing weight on a spring finally comes to rest, and give an example where damping is useful.`,
  `Friction (air resistance, friction inside the spring) takes a little energy from the weight in every swing, so the amplitude gets smaller until it stops. Car shock absorbers use this on purpose so that the car does not keep bouncing on its springs.`,
  [`Friction takes energy away`, `Amplitude decreases until it stops`, `Example: car shock absorbers (or swing, guitar string, door closer)`]);

open(3, `Your table (23 Oct): A<sub>1</sub> = 40 cm, A<sub>2</sub> = 33 cm, A<sub>3</sub> = 24 cm, with &quot;&times; 0.8 (was supposed to be)&quot;. Compare your data with the model and decide whether they fit.`,
  `The model gives 40 &rarr; 32 &rarr; 25.6 cm. Your 33 and 24 cm are close (within about 1.6 cm), and the measured ratios are 0.83 and 0.73, around the average of 0.8. So the data fit the exponential model well; the small differences come from reading the graph.`,
  [`Model values 32 cm and 25.6 cm`, `Measured values are close (ratios 0.83 and 0.73)`, `Conclusion: fits the factor 0.8; deviations are reading errors`], 'n');

open(3, `Sketch a weakly damped oscillation y(t) that starts at the top. Say what you label, and what changes and what stays the same.`,
  `Draw axes (t horizontal, y vertical) and a cosine-shaped curve that starts at +r at t = 0. The peaks get lower from swing to swing and lie inside a curved, shrinking envelope (the amplitude falls exponentially, by the same factor each swing). The distance between the peaks, the period T, stays the same.`,
  [`Starts at the maximum (+r at t = 0)`, `Amplitude shrinks by the same factor each swing (exponential), peaks inside a curved envelope`, `Period / frequency stay the same (equal spacing of peaks)`, `Axes labelled t (s) and y`]);

/* =================== PENDULUM =================== */
T = 'pendulum';

mc(1, `Does the frequency of a pendulum depend on the mass of the bob?`,
  `No. The mass does not appear in the formula.`,
  [`Yes: a heavier bob swings faster.`, `Yes: a heavier bob swings slower.`, `Only if the pendulum is very short.`],
  `&omega; = &radic;(g/l) contains only g and l, no m. A heavier bob feels a bigger pull of gravity, but it is also harder to accelerate, and the two effects cancel.`, 'ti');

mc(1, `What happens to the frequency of a pendulum if you make it <b>longer</b>?`,
  `It gets smaller: a longer pendulum swings more slowly.`,
  [`It gets larger.`, `It stays the same.`, `It depends on the mass.`],
  `&omega; = &radic;(g/l): a larger l gives a smaller &omega; and f, and a longer period T. The shorter the pendulum, the faster it swings.`, 'i');

tf(1, `On a planet with stronger gravity the same pendulum swings with a higher frequency.`, true,
  `True. &omega; = &radic;(g/l): a larger g gives a larger &omega; and f (and a shorter period).`);

mc(1, `Which formula gives the angular velocity &omega; of a pendulum of length l?`,
  `&omega; = &radic;(g / l)`,
  [`&omega; = &radic;(l / g)`, `&omega; = g / l`, `&omega; = &radic;(g &middot; l)`],
  `Large g speeds the pendulum up (g in the numerator), large l slows it down (l in the denominator). &radic;(l/g) has it the wrong way round: a longer pendulum would swing faster.`, 'i');

mc(1, `Which formula gives the period T of a pendulum?`,
  `T = 2&pi; &middot; &radic;(l / g)`,
  [`T = 2&pi; &middot; &radic;(g / l)`, `T = &radic;(l / g) / 2&pi;`, `T = 2&pi; &middot; l / g`],
  `From &omega; = &radic;(g/l) and T = 2&pi;/&omega; you get T = 2&pi;&middot;&radic;(l/g). The root is needed: l/g without the root would be wrong.`);

tf(1, `The pendulum formulas are only valid for small swing angles (roughly below 10&ndash;15&deg;).`, true,
  `True. For big swings the pendulum is slower than the formula predicts.`);

tf(1, `A pendulum with a heavier bob has a longer period.`, false,
  `False. The mass is not in T = 2&pi;&radic;(l/g). Only length and gravity matter.`, 't');

mc(1, `Why do you time <b>10 full swings</b> and divide by 10 when you measure T?`,
  `The reaction-time error of the stopwatch is spread over 10 swings, so T becomes more accurate.`,
  [`Because T is defined as the time of 10 swings.`, `Because the pendulum is only valid for 10 swings.`, `To make the amplitude smaller.`],
  `A start/stop error of, say, 0.2 s is a big part of one swing of 2 s, but only a small part of 20 s. Dividing the total time by 10 then gives a much better T.`);

num(2, `Calculate the period of a pendulum with length <b>l = 1.00 m</b> on Earth (g = 9.81 m/s&sup2;).`,
  2.0060666807106475, '2*Math.PI*Math.sqrt(1/9.81)', `s`, 0.02,
  W(`l = 1.00 m, g = 9.81 m/s&sup2;`, `T = 2&pi; &middot; &radic;(l / g)`, `T = 2&pi; &middot; &radic;(1.00 m / 9.81 m/s&sup2;) = 2&pi; &middot; 0.319 s`, `T &asymp; 2.01 s`) + `<br>So on Earth a 1 m pendulum swings in about 2.01 s.`, 'i');

num(2, `A pendulum has length <b>0.64 m</b> (g = 9.81 m/s&sup2;). Calculate its angular velocity &omega; in rad/s.`,
  3.9151149408414563, 'Math.sqrt(9.81/0.64)', `rad/s`, 0.02,
  W(`l = 0.64 m, g = 9.81 m/s&sup2;`, `&omega; = &radic;(g / l)`, `&omega; = &radic;(9.81 m/s&sup2; / 0.64 m) = &radic;(15.33 1/s&sup2;)`, `&omega; &asymp; 3.92 rad/s`));

num(2, `Your example A (23 Oct): l = 1 m and T = 2.55 s in the simulation. Calculate g in m/s&sup2;.`,
  6.071267605437514, '4*Math.PI*Math.PI*1/(2.55*2.55)', `m/s²`, 0.02,
  W(`l = 1 m, T = 2.55 s`, `g = 4&pi;&sup2; &middot; l / T&sup2; (same as g = &omega;&sup2; &middot; l with &omega; = 2&pi;/T)`, `g = 4&pi;&sup2; &middot; 1 m / (2.55 s)&sup2; = 39.48 m / 6.5025 s&sup2;`, `g &asymp; 6.07 m/s&sup2;`) + `<br>Your route (f = 0.392 Hz, &omega; = 2.464 rad/s, g = &omega;&sup2;&middot;l) gives the same.`, 'ni');

num(2, `Your example B (5 Nov, Planet X): l = 1 m and T = 1.69 s. Calculate g in m/s&sup2;.`,
  13.822491370875472, '4*Math.PI*Math.PI*1/(1.69*1.69)', `m/s²`, 0.02,
  W(`l = 1 m, T = 1.69 s`, `g = (2&pi; / T)&sup2; &middot; l`, `g = (2&pi; / 1.69 s)&sup2; &middot; 1 m = (3.718 1/s)&sup2; &middot; 1 m`, `g &asymp; 13.82 m/s&sup2;`), 'n');

num(2, `A pendulum of length <b>0.80 m</b> on a planet needs <b>2.2 s</b> for one swing (one period). Calculate g in m/s&sup2;.`,
  6.525358281711971, '4*Math.PI*Math.PI*0.8/(2.2*2.2)', `m/s²`, 0.03,
  W(`l = 0.80 m, T = 2.2 s`, `g = (2&pi; / T)&sup2; &middot; l`, `&omega; = 2&pi; / 2.2 s = 2.856 rad/s; g = (2.856 1/s)&sup2; &middot; 0.80 m`, `g &asymp; 6.5 m/s&sup2;`));

num(2, `<b>Spot the mistake.</b> A pendulum with <b>l = 0.50 m</b> has T = 1.20 s on Planet Y. Calculate g in m/s&sup2;. (Forgetting to multiply by l gives a wrong answer of about 27.4.)`,
  13.707783890401888, 'Math.pow(2*Math.PI/1.2,2)*0.5', `m/s²`, 0.02,
  W(`l = 0.50 m, T = 1.20 s`, `g = (2&pi; / T)&sup2; &middot; l`, `g = (2&pi; / 1.20 s)&sup2; &middot; 0.50 m = 27.42 1/s&sup2; &middot; 0.50 m`, `g &asymp; 13.7 m/s&sup2;`) + `<br>In your examples l = 1 m, so multiplying by l was invisible. With another length it matters.`, 't');

num(2, `A pendulum on Earth has a period of <b>2.0 s</b>. How long is it? Use g = 9.81 m/s&sup2;. Answer in m.`,
  0.9939608115313336, '9.81*4/(4*Math.PI*Math.PI)', `m`, 0.02,
  W(`T = 2.0 s, g = 9.81 m/s&sup2;`, `T = 2&pi;&radic;(l/g) &rArr; l = g &middot; T&sup2; / (4&pi;&sup2;)`, `l = 9.81 m/s&sup2; &middot; (2.0 s)&sup2; / 39.48`, `l &asymp; 0.99 m`));

num(2, `Calculate the frequency of a 1.00 m pendulum on Earth (g = 9.81 m/s&sup2;) in Hz.`,
  0.4984879164862809, '1/(2*Math.PI*Math.sqrt(1/9.81))', `Hz`, 0.02,
  W(`l = 1.00 m, g = 9.81 m/s&sup2;`, `T = 2&pi;&radic;(l/g), f = 1 / T`, `T = 2.006 s; f = 1 / 2.006 s`, `f &asymp; 0.50 Hz`));

mc(2, `A pendulum has length l and period T. If you make it <b>4 times longer</b>, the period becomes&hellip;`,
  `2 T (doubled)`,
  [`4 T`, `16 T`, `T / 2`],
  `T = 2&pi;&radic;(l/g), so T is proportional to &radic;l. &radic;4 = 2: four times the length gives twice the period (e.g. 0.25 m: 1.0 s, 1 m: 2.0 s). 4T would be the answer if T were proportional to l.`, 'i');

mc(2, `A pendulum has T = 2 s. Its length is cut to a quarter. The new period is&hellip;`,
  `1 s`,
  [`0.5 s`, `0.25 s`, `8 s`],
  `T &prop; &radic;l and &radic;(1/4) = 1/2, so T halves: 1 s. A quarter of the length does not give a quarter of the period.`);

mc(2, `<b>Spot the mistake.</b> A student says: &quot;I will hang a heavy mass on the pendulum to make it swing faster.&quot; What is wrong?`,
  `The period does not depend on the mass. To swing faster use a shorter string (or stronger gravity).`,
  [`Nothing; heavier means faster.`, `A heavy mass swings slower, so use a light one.`, `Mass only matters for angles above 90&deg;.`],
  `Neither mass direction is right: m does not appear in &omega; = &radic;(g/l). The frequency goes up only with a shorter l or a larger g.`, 'tn');

mc(2, `Your example A gave T = 2.55 s for l = 1 m, but on Earth a 1 m pendulum has T &asymp; 2.01 s. What does that tell you about the gravity in the simulation?`,
  `It was weaker than on Earth (g &asymp; 6.07 m/s&sup2;).`,
  [`It was stronger than on Earth.`, `It was the same; the simulation is just slower.`, `Nothing; the mass of the bob was different.`],
  `A longer period means a smaller &omega; = &radic;(g/l), so g must be smaller: 6.07 instead of 9.81 m/s&sup2;. The mass cannot matter.`, 'n');

mc(2, `The pendulum formula T = 2&pi;&radic;(l/g) is a good description when&hellip;`,
  `the swing angle is small (below about 10&ndash;15&deg;).`,
  [`the swing angle is large, e.g. 60&deg;.`, `the bob is heavy.`, `the string is very short.`],
  `The formula is an approximation for small angles. For big swings the true period is longer than the formula says.`);

multi(2, `Which changes would make a pendulum swing with a <b>higher</b> frequency?`,
  [`A shorter string`, `A planet with stronger gravity`],
  [`A heavier bob`, `A longer string`],
  `f is large for small l and large g (&omega; = &radic;(g/l)). The mass has no influence.`);

mc(3, `(extra) For a mass on a spring the period is T = 2&pi;&radic;(m/k). What happens to T if you use a <b>heavier</b> mass on the same spring?`,
  `T gets longer: the oscillation is slower.`,
  [`T stays the same, as for a pendulum.`, `T gets shorter.`, `T gets shorter, because gravity pulls harder on a heavy mass.`],
  `(extra, not in your notes) For a spring oscillator the mass DOES matter: larger m gives a longer T, and a stiffer spring (larger k) a shorter T. Do not transfer this to the pendulum, where mass drops out.`);

open(3, `A friend says: &quot;A heavier pendulum bob swings slower, because it is harder to move.&quot; Respond using the pendulum formula and say what does matter.`,
  `The formula &omega; = &radic;(g/l) (or T = 2&pi;&radic;(l/g)) contains no mass, so the bob's mass does not change the period. Only the length l and the gravitational acceleration g matter: shorter l or larger g means higher frequency.`,
  [`Formula contains no mass`, `Only l and g matter`, `Shorter l / stronger g gives higher frequency`], 't');

open(3, `Describe how you can determine g of a planet with a pendulum. Say what you measure, which formula you use and why you time several swings.`,
  `Measure the length l and the time of e.g. 10 full swings; divide by 10 to get the period T. Then g = (2&pi;/T)&sup2; &middot; l = 4&pi;&sup2;l/T&sup2;. Timing 10 swings makes the reaction-time error of the stopwatch small compared with the measured time.`,
  [`Measure l and T (T from 10 swings / 10)`, `Use g = 4&pi;&sup2; &middot; l / T&sup2;, small swing angle`, `Reason: reduces reaction-time error`], 'n');

open(3, `A pendulum is taken to a planet with weaker gravity (same length, same bob). Predict what happens to &omega;, f and T, and explain.`,
  `&omega; = &radic;(g/l): a smaller g gives a smaller &omega;, so the frequency f gets lower and the period T gets longer; the pendulum swings more slowly. The mass of the bob is irrelevant.`,
  [`Smaller g gives smaller &omega; and f`, `T gets longer (slower swings)`, `Mass does not matter`]);

/* =================== RESONANCE =================== */
T = 'resonance';

mc(1, `What is <b>resonance</b>?`,
  `An external periodic force acts on a system that can oscillate, at or near its natural frequency, and the amplitude increases (it can become very large).`,
  [`The frequency of an oscillation getting higher and higher.`, `An oscillation dying out because of friction.`, `An external force that is much faster than the natural frequency, making the amplitude large.`],
  `Resonance needs a periodic driving force that matches the natural frequency. Dying out is damping. Driving far from the natural frequency gives only a small amplitude.`, 'i');

mc(1, `What is the <b>natural frequency</b> (eigenfrequency) of a system?`,
  `The frequency at which the system oscillates by itself after it was disturbed once.`,
  [`The frequency of the external force pushing the system.`, `The highest frequency a system can have.`, `The frequency with which the amplitude decreases.`],
  `The natural frequency is a property of the system itself (a swing, a glass, a bridge). The driving frequency belongs to the external force; resonance happens when the two (nearly) match.`, 'i');

tf(1, `Resonance means that the amplitude gets large when the driving frequency is at or close to the natural frequency.`, true,
  `True. At the natural frequency the amplitude is largest; far below or far above it the amplitude stays small.`, 'i');

tf(1, `The amplitude is largest when the driving frequency is much higher than the natural frequency.`, false,
  `False. Far above (or far below) the natural frequency the response is small. The peak is at the natural frequency.`);

tf(1, `Resonance can only happen with sound.`, false,
  `False. Resonance appears whenever a periodic force drives a system that can oscillate: a swing, a bridge, parts of a car, a wine glass.`, 't');

mc(1, `Which is an example of resonance?`,
  `Pushing a child on a swing in rhythm with the swing, so it goes higher and higher.`,
  [`A car shock absorber stopping the car from bouncing.`, `A weight on a spring slowly coming to rest.`, `A ruler bending permanently when overstretched.`],
  `Pushing in rhythm with the natural frequency makes the amplitude grow. The shock absorber and the slowing weight are damping; the bent ruler is the elastic limit.`, 'i');

mc(2, `A system has a natural frequency of 2.0 Hz. It is driven by an external force. Which driving frequency gives the <b>largest</b> amplitude?`,
  `1.9 Hz`,
  [`0.2 Hz`, `5 Hz`, `20 Hz`],
  `The amplitude is largest when the driving frequency is at or very close to the natural frequency. 0.2, 5 and 20 Hz are far away, so the response is small.`);

num(2, `A swing has a period of <b>2.5 s</b>. What is its natural frequency in Hz, i.e. how often per second do you have to push it for resonance?`,
  0.4, '1/2.5', `Hz`, 0.02,
  W(`T = 2.5 s`, `f = 1 / T`, `f = 1 / 2.5 s`, `f = 0.40 Hz (one push every 2.5 s)`), 'i');

num(2, `A bridge has a natural frequency of <b>1.25 Hz</b>. How much time (in s) is between two footsteps that match this frequency?`,
  0.8, '1/1.25', `s`, 0.02,
  W(`f = 1.25 Hz`, `T = 1 / f`, `T = 1 / 1.25 Hz`, `T = 0.80 s`) + `<br>Footsteps every 0.8 s would drive this bridge at resonance.`);

mc(2, `How does strong damping change the resonance peak?`,
  `The peak stays lower: the amplitude does not grow as much.`,
  [`The peak becomes higher, because damping adds energy.`, `The natural frequency becomes zero.`, `Strong damping has no influence on resonance.`],
  `Damping takes energy away, so the amplitude cannot grow as large. That is why the London Millennium Bridge was fixed with dampers.`);

mc(2, `Why are soldiers ordered to break step when they march over a bridge?`,
  `Steady footsteps could match the bridge's natural frequency and make its oscillation grow large (resonance).`,
  [`Marching in step makes the bridge's damping stronger.`, `Marching in step makes the soldiers heavier.`, `Marching in step lowers the bridge's natural frequency to zero.`],
  `Regular footsteps are a periodic driving force. If their frequency is close to the natural frequency of the bridge, the amplitude can increase a lot.`);

mc(2, `<b>Spot the mistake.</b> A student says: &quot;At resonance the object oscillates with a higher frequency than before.&quot; What is correct?`,
  `The natural frequency of the system does not change. Resonance means the driving force matches it, and the amplitude grows.`,
  [`The student is right: resonance doubles the frequency.`, `At resonance the oscillation stops.`, `The amplitude gets smaller at resonance.`],
  `The natural frequency belongs to the system. At resonance the <b>amplitude</b> increases, not the frequency.`, 't');

open(3, `Explain resonance using a child on a swing.`,
  `A swing has a natural frequency (one swing takes a certain time). If you push in rhythm with it, a little push in every swing adds up and the amplitude gets bigger and bigger. If you push at the wrong rhythm, the pushes work against the motion and the amplitude stays small.`,
  [`Swing has a natural frequency`, `Periodic pushes matching it make the amplitude increase`, `Pushing at another rhythm gives only a small amplitude`]);

open(3, `In 2000 the London Millennium Bridge started to wobble sideways when many people walked over it. Explain what happened and how it was fixed.`,
  `The walkers' footsteps acted as a periodic force whose frequency matched a natural frequency of the bridge, so the sideways amplitude grew (resonance). The bridge was fixed by adding dampers, which take energy away and keep the amplitude small.`,
  [`Footsteps = periodic driving force`, `Matched the natural frequency, amplitude grew (resonance)`, `Fix: dampers (damping lowers the peak)`]);

open(3, `A loud sound can shatter a wine glass. Why does this only work at one particular pitch?`,
  `The glass has its own natural frequency. A sound with exactly that frequency drives the glass at resonance, so its vibration amplitude grows until it breaks. Sounds with other frequencies only cause small vibrations.`,
  [`Glass has a natural frequency`, `Sound at that frequency causes resonance, large amplitude`, `Other frequencies cause only a small amplitude`]);

mc(3, `A car's dashboard rattles only at one particular engine speed. Which explanation is correct?`,
  `At that engine speed the vibration of the engine matches the natural frequency of the part, so it resonates; at other speeds it does not.`,
  [`At that speed the damping is zero for all parts.`, `At that speed the part's natural frequency becomes very large.`, `The engine's frequency does not matter; the car is simply too heavy.`],
  `The engine drives the part periodically. Only when the driving frequency is close to the part's natural frequency does the amplitude become large enough to hear as a rattle.`);

mc(1, `Your teacher's wording: &quot;Resonance happens when an external force acts on a potentially oscillating system at or close to its natural (or individual) frequency.&quot; What happens then?`,
  `The amplitude increases (it can become very large).`,
  [`The frequency of the system increases.`, `The system stops oscillating.`, `The amplitude decreases because the force works against the motion.`],
  `At or close to the natural frequency the periodic force keeps adding energy in rhythm, so the amplitude grows. Resonance does not change the natural frequency itself, and it is the opposite of an oscillation dying out.`, 'n');

/* =================== WAVES =================== */
T = 'waves';

mc(1, `What is a <b>wave</b>?`,
  `An oscillation that spreads out in space: each particle is set oscillating by its neighbour.`,
  [`A particle that travels from one place to another.`, `An oscillation that stays at one place and dies out.`, `A force that pulls a particle back to the rest position.`],
  `A wave is a spreading oscillation. The particles are excited one after the other by their neighbours; they do not themselves travel along.`, 'i');

mc(1, `Which is the best answer to: does a bead travel along with the wave?`,
  `No. Each bead only oscillates around its rest position; only the oscillation (energy) travels.`,
  [`Yes, the beads move with the wave to the right.`, `Yes, but only the beads at the crest.`, `No, because the chain does not get longer.`],
  `The particles only oscillate around their rest position. What travels is the disturbance, i.e. the energy. Both of these choices say &quot;No&quot;, but &quot;the chain does not get longer&quot; is not the reason: it says nothing about how the bead moves. The reason is that the bead only oscillates around its rest position (see your worksheet Q3).`, 'ni');

mc(1, `In a <b>transverse</b> wave the direction of oscillation is&hellip;`,
  `perpendicular to the direction in which the wave travels.`,
  [`parallel to the direction in which the wave travels.`, `always up and down.`, `always the same as the wavelength.`],
  `Transverse: oscillation &perp; propagation (rope moved up and down, wave runs horizontally). Parallel is the longitudinal wave. &quot;Up and down&quot; is only right if the wave travels horizontally.`, 'i');

mc(1, `In a <b>longitudinal</b> wave the direction of oscillation is&hellip;`,
  `parallel to the direction in which the wave travels.`,
  [`perpendicular to the direction in which the wave travels.`, `circular.`, `unrelated to the direction of the wave.`],
  `Longitudinal: oscillation &#8741; propagation, e.g. sound in air with compressions and rarefactions, or a slinky pushed and pulled along its length.`, 'i');

mc(1, `Which is an example of a <b>longitudinal</b> wave?`,
  `Sound in air`,
  [`A rope moved up and down`, `A guitar string`, `The stadium wave (La Ola)`],
  `In sound, air particles move back and forth along the direction of travel. The rope, the guitar string and the stadium wave are transverse.`);

multi(1, `Which of these are <b>transverse</b> waves?`,
  [`A rope moved up and down`, `A vibrating guitar string`, `The stadium wave (people stand up and sit down)`],
  [`Sound in air`, `A slinky pushed and pulled along its length`],
  `In the transverse examples the oscillation (up/down) is perpendicular to the way the wave runs. Sound and the pushed slinky are longitudinal.`);

mc(1, `<b>Spot the mistake.</b> A student writes &quot;sound is a longitude wave&quot;. What is the correct term?`,
  `Longitudinal wave (longitude is a term from geography).`,
  [`Longitude wave is fine.`, `Transverse wave.`, `Lengthwise wave, the same as transversal.`],
  `The word is <b>longitudinal</b>. Sound is longitudinal because the particles oscillate parallel to the travel direction. (Transverse, also called transversal, is the other type.)`, 'nt');

mc(1, `The <b>wavelength &lambda;</b> is the distance between&hellip;`,
  `two neighbouring crests (or two neighbouring troughs).`,
  [`a crest and the next trough.`, `the rest position and the crest.`, `the start and the end of the string.`],
  `One wavelength is a full cycle of the wave: crest to crest. Crest to trough is only half a wavelength; rest position to crest is the amplitude.`, 'i');

mc(1, `In a sound wave, the places where the air particles are squeezed together are called&hellip;`,
  `compressions`,
  [`crests`, `rarefactions`, `troughs`],
  `In longitudinal waves we speak of compressions (particles close together) and rarefactions (particles far apart). Crests and troughs are for transverse waves.`);

mc(1, `Which equation gives the wave speed c?`,
  `c = f &middot; &lambda;`,
  [`c = f / &lambda;`, `c = &lambda; / f`, `c = f + &lambda;`],
  `In one period T the wave moves on by one wavelength, so c = &lambda;/T = &lambda;&middot;f. Dividing f by &lambda; (or &lambda; by f) gives wrong units.`, 'i');

tf(1, `The speed of a wave on a string depends on the tension of the string: more tension, faster wave.`, true,
  `True. The speed depends on the medium; for a string, on its tension.`, 'ni');

tf(1, `A wave with a larger amplitude travels faster along the string.`, false,
  `False. The wave speed does NOT depend on amplitude or frequency.`, 'ni');

tf(1, `In a transverse wave the particles move in the same direction as the wave travels.`, false,
  `False. In a transverse wave the oscillation is perpendicular to the direction of travel; the particles only move up and down around the rest position.`);

tf(2, `In a longitudinal wave such as sound the particles oscillate back and forth along the direction in which the wave travels.`, true,
  `True. That is what makes the compressions and rarefactions.`);

mc(1, `A pulse runs along a string and is reflected at a <b>fixed</b> end. How does it come back?`,
  `Upside down (inverted).`,
  [`The same way up (upright).`, `Smaller but upright.`, `It does not come back.`],
  `Fixed end: the pulse comes back inverted (&quot;goes under&quot;). If it also looks smaller, that is energy loss, not the rule.`, 'ni');

mc(1, `A pulse runs along a string and is reflected at a <b>loose (free)</b> end. How does it come back?`,
  `The same way up (upright).`,
  [`Upside down (inverted).`, `Only half of it comes back.`, `It turns into a longitudinal wave.`],
  `Loose end: the pulse returns upright. Fixed end: inverted.`);

num(2, `Control question: a wave on a string has f = <b>4 Hz</b> and &lambda; = <b>0.5 m</b>. Calculate the wave speed c in m/s.`,
  2, '4*0.5', `m/s`, 0.02,
  W(`f = 4 Hz, &lambda; = 0.5 m`, `c = f &middot; &lambda;`, `c = 4 Hz &middot; 0.5 m = 4 1/s &middot; 0.5 m`, `c = 2 m/s`), 'ni');

num(2, `Worksheet task B (same tension): at f = 2 Hz the wavelength was &lambda; = 2.1 cm. Calculate c in cm/s.`,
  4.2, '2*2.1', `cm/s`, 0.02,
  W(`f = 2 Hz, &lambda; = 2.1 cm`, `c = f &middot; &lambda;`, `c = 2 1/s &middot; 2.1 cm`, `c = 4.2 cm/s`) + `<br>At 1 Hz (4.2 cm) and 3 Hz (1.4 cm) you also get 4.2 cm/s: the speed is constant at the same tension.`, 'n');

num(2, `A sound wave travels at 340 m/s in air. What is the wavelength of a note with <b>f = 680 Hz</b>?`,
  0.5, '340/680', `m`, 0.02,
  W(`c = 340 m/s (given), f = 680 Hz`, `c = f &middot; &lambda; &rArr; &lambda; = c / f`, `&lambda; = 340 m/s / 680 Hz`, `&lambda; = 0.50 m`));

num(2, `A wave on a string travels at c = 2.4 m/s and has a wavelength of <b>0.30 m</b>. Calculate its frequency in Hz.`,
  8, '2.4/0.3', `Hz`, 0.02,
  W(`c = 2.4 m/s, &lambda; = 0.30 m`, `f = c / &lambda;`, `f = 2.4 m/s / 0.30 m`, `f = 8.0 Hz`));

num(2, `A wave on a string has f = 2 Hz and &lambda; = 0.84 m. The frequency is increased to <b>3 Hz</b> at the <b>same tension</b>. Find the new wavelength in m.`,
  0.5599999999999999, '0.84*2/3', `m`, 0.02,
  W(`f<sub>1</sub> = 2 Hz, &lambda;<sub>1</sub> = 0.84 m, f<sub>2</sub> = 3 Hz, same tension so c stays the same`, `c = f<sub>1</sub>&middot;&lambda;<sub>1</sub>; &lambda;<sub>2</sub> = c / f<sub>2</sub>`, `c = 2 Hz &middot; 0.84 m = 1.68 m/s; &lambda;<sub>2</sub> = 1.68 m/s / 3 Hz`, `&lambda;<sub>2</sub> = 0.56 m`) + `<br>Higher frequency, shorter wavelength, same speed.`, 'i');

num(2, `A wave has a wavelength of 3.0 m and a period of 0.50 s. Calculate its speed in m/s.`,
  6, '3.0/0.5', `m/s`, 0.02,
  W(`&lambda; = 3.0 m, T = 0.50 s`, `c = &lambda; / T (in one period the wave moves one wavelength)`, `c = 3.0 m / 0.50 s`, `c = 6.0 m/s`));

num(2, `A wave on a string travels 12 m in 3.0 s. Its frequency is 5.0 Hz. Calculate the wavelength in m.`,
  0.8, '(12/3)/5', `m`, 0.02,
  W(`distance 12 m, time 3.0 s, f = 5.0 Hz`, `c = distance / time; &lambda; = c / f`, `c = 12 m / 3.0 s = 4.0 m/s; &lambda; = 4.0 m/s / 5.0 Hz`, `&lambda; = 0.80 m`));

mc(2, `Worksheet task B: f = 1, 2, 3 Hz gave &lambda; = 4.2, 2.1, 1.4 cm. What stays the same?`,
  `The product &lambda; &middot; f = 4.2 cm/s, which is the wave speed.`,
  [`The wavelength.`, `The ratio &lambda; / f.`, `The sum &lambda; + f.`],
  `Bigger frequency gives shorter wavelength, but &lambda;&middot;f is always 4.2 cm/s = c: same tension, same speed. The ratio &lambda;/f changes (4.2, 1.05, 0.47).`, 'ni');

mc(2, `Worksheet task C (stopwatch times for the pulse to cross the string): <table class="tbl"><tr><th>Setting</th><th>Time</th></tr><tr><td>Low tension (39 %)</td><td>2.71 s</td></tr><tr><td>High tension (80 %)</td><td>1.66 s</td></tr></table> What do you conclude?`,
  `Higher tension makes the pulse faster.`,
  [`Lower tension makes the pulse faster.`, `Tension has no effect on the speed.`, `The pulse is faster because its amplitude is larger.`],
  `A shorter crossing time means a higher speed, and the only thing changed is the tension. So more tension gives a faster wave (your Q7 answer is right).`, 'ni');

mc(2, `<b>Spot the mistake (worksheet Q8).</b> At high tension the pulse took 1.66 s. With a <b>bigger amplitude</b> it took 1.76 s. You wrote: &quot;a bigger amplitude makes it slower.&quot; What is the correct conclusion?`,
  `The wave speed does not depend on the amplitude; the 0.1 s difference is stopwatch (reaction-time) error.`,
  [`Your answer is right: bigger amplitude means slower.`, `A bigger amplitude makes it faster, but only by a little.`, `The speed depends on both tension and amplitude.`],
  `The speed depends on the medium (the tension), NOT on amplitude or frequency. A difference of 0.1 s is of the order of the human reaction time when starting and stopping a stopwatch, so it is no real effect.`, 'nti');

mc(2, `<b>Spot the mistake (worksheet Q3).</b> Which answer to &quot;Does the bead travel with the wave?&quot; is the best?`,
  `No. Each bead only oscillates up and down around its rest position; only the oscillation (energy) moves to the right.`,
  [`No, because the chain itself isn't getting longer.`, `Yes, because the wave moves to the right.`, `Yes, but slower than the wave.`],
  `A good answer says what the beads <b>do</b> (oscillate around the rest position) and what travels (the oscillation). &quot;The chain isn't getting longer&quot; does not explain anything about the motion of the beads.`, 'nt');

mc(2, `<b>Spot the mistake (worksheet task D).</b> At a loose end the pulse came back upright. You explained this with &quot;less amplitude&quot;. What is the rule?`,
  `A loose end reflects the pulse upright; a fixed end reflects it inverted. Smaller size is just energy loss.`,
  [`A loose end reflects with a smaller amplitude, a fixed end with a bigger one.`, `A loose end reflects the pulse inverted.`, `The whole string moves, and that is the reason.`],
  `The reflection rule is about <b>orientation</b>, not size: loose end = upright, fixed end = inverted. A smaller pulse after reflection comes from energy loss (damping).`, 'nt');

mc(2, `Same string, same tension: you <b>double the frequency</b>. What happens?`,
  `The wavelength halves; the wave speed stays the same.`,
  [`The wavelength doubles.`, `The speed doubles; the wavelength stays the same.`, `Both the speed and the wavelength halve.`],
  `c = f&middot;&lambda; is fixed by the tension. If f doubles, &lambda; must halve to keep the product constant.`, 'ni');

mc(2, `You want a pulse to reach the other end of a string <b>sooner</b>. Which change helps?`,
  `Increase the tension.`,
  [`Increase the amplitude.`, `Increase the frequency of the source.`, `Use a smaller amplitude.`],
  `Speed depends on the medium (tension), not on amplitude or frequency, so only more tension makes the pulse faster.`, 'i');

mc(2, `<b>Spot the mistake.</b> A pulse returns smaller from a fixed end. A student says: &quot;So a fixed end reflects the pulse smaller.&quot; What is wrong?`,
  `The rule for a fixed end is that the pulse comes back inverted; getting smaller is only energy loss.`,
  [`Nothing is wrong.`, `Fixed ends reflect the pulse upright.`, `The pulse should come back bigger.`],
  `Reflection rule: fixed end &rarr; inverted, loose end &rarr; upright. A smaller size is due to damping and does not define the rule.`, 't');

mc(3, `Same string and tension: the source frequency is increased from 2 Hz to 6 Hz. What happens to the wavelength?`,
  `It becomes one third of the original wavelength; the speed is unchanged.`,
  [`It becomes three times as large.`, `It stays the same.`, `It becomes one third, and the speed becomes three times as large.`],
  `c is constant (same tension), and &lambda; = c/f. Three times the frequency gives one third of the wavelength.`);

multi(3, `The stadium wave: people stand up and sit down, and the wave runs around the stadium. Which statements are correct?`,
  [`It is a transverse wave: people move up and down, the wave runs sideways.`, `The people do not travel around the stadium; only the standing-up travels.`],
  [`It is a longitudinal wave, because people stand along the stadium.`, `The people run around the stadium with the wave.`],
  `Each person oscillates around a rest position (up/down), perpendicular to the way the wave runs. Only the oscillation (the excitation) is passed on from neighbour to neighbour.`);

open(3, `<b>Worksheet Q3.</b> Does a bead on the chain travel with the wave? Write a good answer.`,
  `No. Each bead only oscillates up and down around its rest position. Only the oscillation (the energy) travels along to the right.`,
  [`Answer: no`, `Beads oscillate around the rest position`, `Only the oscillation / energy travels`], 'n');

open(3, `<b>Worksheet Q8.</b> The pulse needed 1.66 s at high tension and 1.76 s at high tension with a bigger amplitude. Explain what this tells you about amplitude and wave speed.`,
  `Nothing real: the wave speed does not depend on the amplitude. The 0.1 s difference is within stopwatch reaction-time error. Speed depends on the tension of the string.`,
  [`Speed does not depend on amplitude`, `0.1 s difference = timing (reaction-time) error`, `Speed depends on the tension (the medium)`], 'nt');

open(3, `Explain the difference between a transverse and a longitudinal wave. Give one example of each.`,
  `In a transverse wave the particles oscillate perpendicular to the direction of travel (rope moved up and down, guitar string, stadium wave). In a longitudinal wave they oscillate parallel to it (sound in air with compressions and rarefactions, a slinky pushed and pulled).`,
  [`Transverse: oscillation perpendicular to travel`, `Longitudinal: oscillation parallel to travel`, `One valid example of each`]);

open(3, `Your task B results: f = 1, 2, 3 Hz and &lambda; = 4.2, 2.1, 1.4 cm. What do they show, and what is the product &lambda; &middot; f?`,
  `Higher frequency gives a shorter wavelength. The product &lambda;&middot;f is 4.2 cm/s every time; that is the wave speed c = f&middot;&lambda;, which stays the same because the tension is the same.`,
  [`Bigger f, shorter &lambda;`, `&lambda;&middot;f = 4.2 cm/s each time`, `That product is the wave speed, constant at the same tension`], 'n');

open(3, `Describe what happens to a pulse reflected at a fixed end and at a loose end. Why is &quot;the pulse is smaller&quot; not the rule?`,
  `At a fixed end the pulse comes back inverted (upside down); at a loose end it comes back upright. If it is smaller after reflection, that is energy loss (damping), not the reflection rule.`,
  [`Fixed end: inverted`, `Loose end: upright`, `Smaller size = energy loss, not the rule`], 'n');

open(2, `Draw a transverse wave and label one wavelength &lambda; and the amplitude.`,
  `Draw a wavy line (sine shape) around a straight rest line. The wavelength &lambda; is the distance between two neighbouring crests (or two neighbouring troughs). The amplitude is the maximum distance of a crest (or trough) from the rest line. Add an arrow for the direction of travel.`,
  [`Wavy line around a straight rest position`, `&lambda; marked from crest to neighbouring crest (or trough to trough)`, `Amplitude marked from the rest line to a crest`, `Direction of travel is perpendicular to the oscillation`]);

/* =================== GENERATORS =================== */
const G = [];
const PI = Math.PI;
const g0 = 9.81;
function pick(r, arr){ return arr[Math.floor(r() * arr.length)]; }
function stepv(r, lo, hi, st){
  const n = Math.round((hi - lo) / st);
  return Number((lo + st * Math.floor(r() * (n + 1))).toFixed(6));
}
function fmt(x, n){ return String(Number(x.toPrecision(n || 3))); }
function gen(id, topic, level, title, make){ G.push({id: id, topic: topic, level: level, title: title, make: make}); }

gen('gen-k', 'hooke', 2, 'Spring constant from a hanging mass (cm!)', function(rand){
  const m = stepv(rand, 0.5, 4.0, 0.5), xcm = stepv(rand, 1, 12, 0.5), x = xcm / 100;
  const F = m * g0, k = F / x;
  return {
    prompt: 'A mass of <b>' + fmt(m) + ' kg</b> hangs on a spring and stretches it by <b>' + fmt(xcm) + ' cm</b>. Calculate the spring constant k in N/m. (g = 9.81 m/s&sup2;)',
    answer: k, unit: 'N/m', tol: 0.02, given: {m: m, x: x, g: g0},
    steps: [
      'Convert the extension to metres: x = ' + fmt(xcm) + ' cm = ' + fmt(x) + ' m',
      'Force = weight: F = m&middot;g = ' + fmt(m) + ' kg &middot; 9.81 m/s&sup2; = ' + fmt(F) + ' N',
      'Hooke: k = F / x = ' + fmt(F) + ' N / ' + fmt(x) + ' m',
      'k &asymp; ' + fmt(k) + ' N/m'
    ]};
});

gen('gen-F', 'hooke', 2, 'Force from spring constant and extension', function(rand){
  const k = stepv(rand, 50, 800, 10), xcm = stepv(rand, 1, 15, 0.5), x = xcm / 100;
  const F = k * x;
  return {
    prompt: 'A spring has k = <b>' + fmt(k) + ' N/m</b>. It is stretched by <b>' + fmt(xcm) + ' cm</b>. How large is the spring force in N?',
    answer: F, unit: 'N', tol: 0.02, given: {k: k, x: x},
    steps: [
      'Convert: x = ' + fmt(xcm) + ' cm = ' + fmt(x) + ' m',
      'Hooke (size): F = k&middot;x',
      'F = ' + fmt(k) + ' N/m &middot; ' + fmt(x) + ' m',
      'F &asymp; ' + fmt(F) + ' N'
    ]};
});

gen('gen-x', 'hooke', 2, 'Extension from force and spring constant (answer in cm)', function(rand){
  const k = stepv(rand, 100, 500, 50), F = stepv(rand, 5, 25, 5);
  const x = F / k, xcm = x * 100;
  return {
    prompt: 'A force of <b>' + fmt(F) + ' N</b> acts on a spring with k = <b>' + fmt(k) + ' N/m</b>. How far does it stretch? Give the answer in <b>cm</b>.',
    answer: xcm, unit: 'cm', tol: 0.02, given: {F: F, k: k},
    steps: [
      'Hooke: x = F / k',
      'x = ' + fmt(F) + ' N / ' + fmt(k) + ' N/m = ' + fmt(x) + ' m',
      'Convert to cm: &times; 100',
      'x &asymp; ' + fmt(xcm) + ' cm'
    ]};
});

gen('gen-f-from-T', 'describe', 1, 'Frequency from the period', function(rand){
  const T = stepv(rand, 0.2, 2.5, 0.05), f = 1 / T;
  return {
    prompt: 'One oscillation takes <b>T = ' + fmt(T) + ' s</b>. Calculate the frequency f in Hz.',
    answer: f, unit: 'Hz', tol: 0.02, given: {T: T},
    steps: ['Formula: f = 1 / T', 'f = 1 / ' + fmt(T) + ' s', 'f &asymp; ' + fmt(f) + ' Hz']};
});

gen('gen-T-from-f', 'describe', 1, 'Period from the frequency', function(rand){
  const f = stepv(rand, 0.5, 8, 0.5), T = 1 / f;
  return {
    prompt: 'An oscillator has a frequency of <b>' + fmt(f) + ' Hz</b>. Calculate the period T in s (round to 3 significant figures).',
    answer: T, unit: 's', tol: 0.02, given: {f: f},
    steps: ['Formula: T = 1 / f', 'T = 1 / ' + fmt(f) + ' Hz', 'T &asymp; ' + fmt(T) + ' s']};
});

gen('gen-omega-T', 'describe', 2, 'Angular velocity from the period', function(rand){
  const T = stepv(rand, 0.2, 3.0, 0.05), w = 2 * PI / T;
  return {
    prompt: 'An oscillation has the period <b>T = ' + fmt(T) + ' s</b>. Calculate the angular velocity &omega; in rad/s.',
    answer: w, unit: 'rad/s', tol: 0.02, given: {T: T},
    steps: ['Formula: &omega; = 2&pi; / T', '&omega; = 2&pi; / ' + fmt(T) + ' s', '&omega; &asymp; ' + fmt(w) + ' rad/s']};
});

gen('gen-omega-f', 'describe', 2, 'Angular velocity from the frequency', function(rand){
  const f = stepv(rand, 0.5, 10, 0.25), w = 2 * PI * f;
  return {
    prompt: 'An oscillator has the frequency <b>f = ' + fmt(f) + ' Hz</b>. Calculate the angular velocity &omega; in rad/s.',
    answer: w, unit: 'rad/s', tol: 0.02, given: {f: f},
    steps: ['Formula: &omega; = 2&pi; &middot; f', '&omega; = 2&pi; &middot; ' + fmt(f) + ' Hz', '&omega; &asymp; ' + fmt(w) + ' rad/s']};
});

gen('gen-y-t', 'describe', 2, 'Elongation y(t) = r&middot;cos(&omega;&middot;t) (RAD mode!)', function(rand){
  let r, w, t, y, tries = 0;
  do {
    r = stepv(rand, 0.05, 0.30, 0.05); w = stepv(rand, 2, 12, 1); t = stepv(rand, 0.1, 2.0, 0.1);
    y = r * Math.cos(w * t); tries++;
  } while ((Math.abs(y) < 0.1 * r || Math.abs(y) < 0.01) && tries < 200);
  if (Math.abs(y) < 0.1 * r || Math.abs(y) < 0.01) { r = 0.2; w = 4; t = 0.3; y = r * Math.cos(w * t); }
  const a = w * t;
  return {
    prompt: 'A weight oscillates as y(t) = r &middot; cos(&omega; &middot; t) with r = <b>' + fmt(r) + ' m</b> and &omega; = <b>' + fmt(w) + ' rad/s</b>. Find the elongation y at <b>t = ' + fmt(t) + ' s</b>. Give the answer in <b>cm</b>, rounded to 1 decimal. (Calculator in RAD mode!)',
    answer: y * 100, unit: 'cm', dp: 1, tol: 0.03, given: {r: r, w: w, t: t},
    steps: [
      'Switch the calculator to RAD mode (the angle &omega;&middot;t is in radians).',
      'Angle: &omega;&middot;t = ' + fmt(w) + ' rad/s &middot; ' + fmt(t) + ' s = ' + fmt(a) + ' rad',
      'cos(' + fmt(a) + ') = ' + fmt(Math.cos(a), 4),
      'y = r &middot; cos(&omega;&middot;t) = ' + fmt(r) + ' m &middot; ' + fmt(Math.cos(a), 4) + ' = ' + fmt(y, 4) + ' m &asymp; ' + (y * 100).toFixed(1) + ' cm'
    ]};
});

gen('gen-deg-rad', 'describe', 1, 'Degrees to radians', function(rand){
  const d = pick(rand, [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360]);
  const rad = d * PI / 180;
  return {
    prompt: 'Convert <b>' + d + '&deg;</b> to radians. Give the answer as a decimal number (3 decimals).',
    answer: rad, unit: 'rad', dp: 3, tol: 0.02, given: {deg: d},
    steps: ['Formula: rad = deg &middot; &pi; / 180', 'rad = ' + d + ' &middot; &pi; / 180', 'rad &asymp; ' + fmt(rad, 4)]};
});

gen('gen-damp', 'damping', 2, 'Damped amplitude after n half-swings', function(rand){
  const A0 = stepv(rand, 20, 60, 5), q = pick(rand, [0.8, 0.75, 0.7, 0.9, 0.6, 0.5]), n = stepv(rand, 2, 6, 1);
  const A = A0 * Math.pow(q, n);
  return {
    prompt: 'A damped oscillation starts with an amplitude of <b>' + fmt(A0) + ' cm</b>. In every half-swing the amplitude is multiplied by <b>' + fmt(q) + '</b>. What is the amplitude after <b>' + n + ' half-swings</b>? (cm, 2 decimals)',
    answer: A, unit: 'cm', dp: 2, tol: 0.02, given: {A0: A0, q: q, n: n},
    steps: [
      'Exponential decay: A<sub>n</sub> = A<sub>0</sub> &middot; q<sup>n</sup>',
      'q<sup>n</sup> = ' + fmt(q) + '<sup>' + n + '</sup> = ' + fmt(Math.pow(q, n), 4),
      'A<sub>' + n + '</sub> = ' + fmt(A0) + ' cm &middot; ' + fmt(Math.pow(q, n), 4) + ' &asymp; ' + fmt(A) + ' cm'
    ]};
});

gen('gen-pend-T', 'pendulum', 2, 'Pendulum period from length', function(rand){
  const l = stepv(rand, 0.25, 2.0, 0.05), T = 2 * PI * Math.sqrt(l / g0);
  return {
    prompt: 'A pendulum on Earth has the length <b>l = ' + fmt(l) + ' m</b>. Calculate its period T in s. (g = 9.81 m/s&sup2;, small swings)',
    answer: T, unit: 's', tol: 0.02, given: {l: l, g: g0},
    steps: [
      'Formula: T = 2&pi; &middot; &radic;(l / g)',
      'l / g = ' + fmt(l) + ' m / 9.81 m/s&sup2; = ' + fmt(l / g0, 4) + ' s&sup2;',
      '&radic;(' + fmt(l / g0, 4) + ' s&sup2;) = ' + fmt(Math.sqrt(l / g0), 4) + ' s',
      'T = 2&pi; &middot; ' + fmt(Math.sqrt(l / g0), 4) + ' s &asymp; ' + fmt(T) + ' s'
    ]};
});

gen('gen-pend-g', 'pendulum', 2, 'Pendulum: find g of a planet from l and T', function(rand){
  const gp = pick(rand, [1.6, 3.7, 6.1, 8.9, 13.8, 20.0]), l = stepv(rand, 0.25, 2.0, 0.05);
  const T = Number((2 * PI * Math.sqrt(l / gp)).toFixed(2));
  const g = 4 * PI * PI * l / (T * T);
  return {
    prompt: 'On Planet X a pendulum of length <b>l = ' + fmt(l) + ' m</b> has the period <b>T = ' + T.toFixed(2) + ' s</b>. Calculate g in m/s&sup2;.',
    answer: g, unit: 'm/s²', tol: 0.03, given: {l: l, T: T},
    steps: [
      'Formula: g = (2&pi; / T)&sup2; &middot; l = 4&pi;&sup2; &middot; l / T&sup2;',
      '&omega; = 2&pi; / T = 2&pi; / ' + T.toFixed(2) + ' s = ' + fmt(2 * PI / T, 4) + ' rad/s',
      'g = &omega;&sup2; &middot; l = (' + fmt(2 * PI / T, 4) + ' 1/s)&sup2; &middot; ' + fmt(l) + ' m',
      'g &asymp; ' + fmt(g) + ' m/s&sup2; (do not forget to multiply by l!)'
    ]};
});

gen('gen-pend-l', 'pendulum', 2, 'Pendulum: find the length from T and g', function(rand){
  let g, T, l, tries = 0;
  do {
    g = pick(rand, [g0, 3.7, 6.1, 8.9, 13.8]); T = stepv(rand, 0.8, 3.5, 0.1);
    l = g * T * T / (4 * PI * PI); tries++;
  } while ((l < 0.15 || l > 3) && tries < 200);
  if (l < 0.15 || l > 3) { g = g0; T = 2.0; l = g * T * T / (4 * PI * PI); }
  return {
    prompt: 'A pendulum has the period <b>T = ' + fmt(T) + ' s</b> at a place where g = <b>' + fmt(g) + ' m/s&sup2;</b>. How long is the pendulum? (m, round to 3 significant figures)',
    answer: l, unit: 'm', tol: 0.02, given: {T: T, g: g},
    steps: [
      'From T = 2&pi;&radic;(l/g): l = g &middot; T&sup2; / (4&pi;&sup2;)',
      'T&sup2; = (' + fmt(T) + ' s)&sup2; = ' + fmt(T * T, 4) + ' s&sup2;',
      'l = ' + fmt(g) + ' m/s&sup2; &middot; ' + fmt(T * T, 4) + ' s&sup2; / 39.48',
      'l &asymp; ' + fmt(l) + ' m'
    ]};
});

gen('gen-c', 'waves', 2, 'Wave speed c = f &middot; &lambda;', function(rand){
  const f = stepv(rand, 1, 10, 1), lam = stepv(rand, 0.1, 1.5, 0.05), c = f * lam;
  return {
    prompt: 'A wave on a string has the frequency <b>f = ' + fmt(f) + ' Hz</b> and the wavelength <b>&lambda; = ' + fmt(lam) + ' m</b>. Calculate the wave speed c in m/s.',
    answer: c, unit: 'm/s', tol: 0.02, given: {f: f, lambda: lam},
    steps: ['Formula: c = f &middot; &lambda;', 'c = ' + fmt(f) + ' Hz &middot; ' + fmt(lam) + ' m', 'c &asymp; ' + fmt(c) + ' m/s']};
});

gen('gen-lambda', 'waves', 2, 'Wavelength from c and f', function(rand){
  const f = stepv(rand, 1, 10, 0.5), c = stepv(rand, 0.4, 4.0, 0.2), lam = c / f;
  return {
    prompt: 'A wave travels with <b>c = ' + fmt(c) + ' m/s</b> and has the frequency <b>f = ' + fmt(f) + ' Hz</b>. Calculate the wavelength &lambda; in m (round to 3 significant figures).',
    answer: lam, unit: 'm', tol: 0.02, given: {c: c, f: f},
    steps: ['From c = f &middot; &lambda;: &lambda; = c / f', '&lambda; = ' + fmt(c) + ' m/s / ' + fmt(f) + ' Hz', '&lambda; &asymp; ' + fmt(lam) + ' m']};
});

gen('gen-f-wave', 'waves', 2, 'Frequency from c and wavelength', function(rand){
  const c = stepv(rand, 0.4, 4.0, 0.2), lam = stepv(rand, 0.1, 1.0, 0.05), f = c / lam;
  return {
    prompt: 'A wave travels with <b>c = ' + fmt(c) + ' m/s</b> and has the wavelength <b>&lambda; = ' + fmt(lam) + ' m</b>. Calculate the frequency f in Hz.',
    answer: f, unit: 'Hz', tol: 0.02, given: {c: c, lambda: lam},
    steps: ['From c = f &middot; &lambda;: f = c / &lambda;', 'f = ' + fmt(c) + ' m/s / ' + fmt(lam) + ' m', 'f &asymp; ' + fmt(f) + ' Hz']};
});

gen('gen-lambda-new', 'waves', 2, 'New wavelength when f changes (same tension)', function(rand){
  const f1 = stepv(rand, 1, 5, 1), lam1 = stepv(rand, 0.2, 2.0, 0.1), f2 = f1 * pick(rand, [2, 3, 4]);
  const c = f1 * lam1, lam2 = c / f2;
  return {
    prompt: 'On a string with constant tension a wave has f = <b>' + fmt(f1) + ' Hz</b> and &lambda; = <b>' + fmt(lam1) + ' m</b>. The frequency is changed to <b>' + fmt(f2) + ' Hz</b>. What is the new wavelength in m? (round to 3 significant figures)',
    answer: lam2, unit: 'm', tol: 0.02, given: {f1: f1, lambda1: lam1, f2: f2},
    steps: [
      'Same tension means the same wave speed: c = f<sub>1</sub> &middot; &lambda;<sub>1</sub> = ' + fmt(f1) + ' Hz &middot; ' + fmt(lam1) + ' m = ' + fmt(c) + ' m/s',
      'New wavelength: &lambda;<sub>2</sub> = c / f<sub>2</sub> = ' + fmt(c) + ' m/s / ' + fmt(f2) + ' Hz',
      '&lambda;<sub>2</sub> &asymp; ' + fmt(lam2) + ' m (higher frequency, shorter wavelength)'
    ]};
});

/* =================== FLASHCARDS =================== */
const F = [];
let fcN = 0;
function fc(topic, front, back){ fcN++; F.push({id: 'fc-' + (fcN < 100 ? (fcN < 10 ? '00' : '0') : '') + fcN, topic: topic, front: front, back: back}); }

// ---- Hooke
fc('hooke', `Hooke's law`, `F = &minus;k &middot; x<br>(size: F = k &middot; x)`);
fc('hooke', `What does the minus sign in F = &minus;k&middot;x mean?`, `The spring force points opposite to the displacement: it is a restoring force back to the rest position.`);
fc('hooke', `k = ? (from F and x)`, `k = F / x`);
fc('hooke', `x = ? (from F and k)`, `x = F / k`);
fc('hooke', `F = ? (from k and x)`, `F = k &middot; x`);
fc('hooke', `Unit of the spring constant k`, `N/m = kg/s&sup2;`);
fc('hooke', `What does a large k tell you?`, `A stiff spring: a large force is needed per metre of stretch. Small k = soft spring.`);
fc('hooke', `Meaning of x in Hooke's law`, `The distance the spring is stretched or compressed, measured from its original length (in m).`);
fc('hooke', `Elastic region`, `The range where Hooke's law holds: F and x are proportional and the spring returns to its original length.`);
fc('hooke', `What happens beyond the elastic limit?`, `The F&ndash;x line bends, the spring is permanently deformed, finally it breaks. Hooke's law no longer applies.`);
fc('hooke', `F&ndash;x graph of a spring in the elastic region`, `Straight line through the origin. Slope = k = F / x. Steeper = stiffer.`);
fc('hooke', `Force of a hanging mass`, `F = m &middot; g (weight), with g = 9.81 m/s&sup2;`);
fc('hooke', `Extension x from lengths`, `x = L &minus; L<sub>0</sub> (new length minus original length), in metres`);
fc('hooke', `Your data: k from m = 0.5 kg, x = 0.008 m`, `k = 0.5 &middot; 9.81 / 0.008 &asymp; 613 N/m`);
fc('hooke', `Your data: the corrected k values (rows 3 and 4)`, `471.6 N/m and 512.5 N/m (not 437.5 and 496.79)`);
fc('hooke', `Your data: why do the k values scatter?`, `Tiny extensions (8 mm): a 1 mm reading error changes k by more than 10 %. Use several masses, bigger x, average or graph slope.`);
fc('hooke', `1 cm = ? m &nbsp;|&nbsp; 1 mm = ? m`, `1 cm = 0.01 m &nbsp;|&nbsp; 1 mm = 0.001 m &mdash; convert before you calculate!`);

// ---- Describe
fc('describe', `Oscillation`, `A repeating back-and-forth motion around a rest (equilibrium) position.`);
fc('describe', `Elongation y(t)`, `The displacement from the rest position at time t (in m).`);
fc('describe', `Amplitude r`, `The maximum elongation (largest distance from the rest position).`);
fc('describe', `Period T`, `Time for ONE full oscillation (there and back). Unit: s.`);
fc('describe', `Frequency f`, `Number of full oscillations per second. Unit: Hz = 1/s.`);
fc('describe', `Hertz (Hz)`, `1 Hz = 1 oscillation per second = 1/s = s<sup>&minus;1</sup>`);
fc('describe', `f = ? (from T)`, `f = 1 / T`);
fc('describe', `T = ? (from f)`, `T = 1 / f`);
fc('describe', `Angular velocity &omega;`, `The angle (in rad) covered per second. One oscillation = 2&pi; rad in T seconds. Unit: rad/s.`);
fc('describe', `&omega; = ? (from T)`, `&omega; = 2&pi; / T`);
fc('describe', `&omega; = ? (from f)`, `&omega; = 2&pi; &middot; f`);
fc('describe', `Oscillation formula with cosine`, `y(t) = r &middot; cos(&omega; &middot; t)<br>starts at the maximum, y(0) = r`);
fc('describe', `Oscillation formula with sine`, `y(t) = r &middot; sin(&omega; &middot; t)<br>starts at the rest position, y(0) = 0`);
fc('describe', `How are the sine and cosine curves related?`, `Same shape, shifted by a quarter period (T/4).`);
fc('describe', `Radian`, `Another scale for angles: 360&deg; = 2&pi; rad, 180&deg; = &pi;, 90&deg; = &pi;/2; 1 rad &asymp; 57.3&deg;.`);
fc('describe', `deg &rarr; rad`, `rad = deg &middot; &pi; / 180`);
fc('describe', `rad &rarr; deg`, `deg = rad &middot; 180 / &pi;`);
fc('describe', `Calculator trap for y = r&middot;cos(&omega;t)`, `&omega;&middot;t is in radians: set the calculator to RAD, not DEG.`);
fc('describe', `Unit circle link`, `A point moves on a circle (radius r) with constant &omega;. Its height y = r &middot; sin(&omega;t) plotted against t gives the sine curve.`);
fc('describe', `SOH CAH TOA`, `sin = opposite / hypotenuse<br>cos = adjacent / hypotenuse<br>tan = opposite / adjacent`);
fc('describe', `Common mistake: y = r&middot;cos(t)`, `&omega; is missing. Correct: y(t) = r &middot; cos(&omega; &middot; t).`);
fc('describe', `Common mistake: top to bottom takes 0.4 s, so T = 0.4 s?`, `No: that is only half an oscillation. T = 0.8 s.`);

// ---- Damping
fc('damping', `Damping`, `Friction (air resistance, friction in the spring) takes energy away, so the oscillation gradually dies out.`);
fc('damping', `What changes and what stays the same with weak damping?`, `Amplitude decreases; frequency and period stay the same.`);
fc('damping', `Exponential decay`, `In each half-swing the amplitude is multiplied by (about) the same factor q &mdash; in class q &asymp; 0.8.`);
fc('damping', `Amplitude after n half-swings`, `A<sub>n</sub> = A<sub>0</sub> &middot; q<sup>n</sup><br>(40 &rarr; 32 &rarr; 25.6 &rarr; 20.5 cm for q = 0.8)`);
fc('damping', `&times; 0.8 is the same as &divide; ?`, `&divide; 1.25 (= 5/4)`);
fc('damping', `Your data: period of the damped oscillation`, `Maxima at 0, 0.86, 1.64, 2.46, 3.28 s: T &asymp; 0.82 s, f &asymp; 1.22 Hz, &omega; &asymp; 7.7 rad/s.`);
fc('damping', `Your data: why are turning points about 0.41 s apart?`, `Turning points are half a period apart: T &asymp; 2 &middot; 0.41 s = 0.82 s.`);
fc('damping', `Your data: what do the ratios of successive |y| show?`, `They are about 0.80 on average: exponential decay.`);
fc('damping', `Graph of a damped oscillation`, `A cosine-shaped curve inside a shrinking curved envelope.`);
fc('damping', `Example of damping`, `Car shock absorbers (also: a swing slowing down, a guitar string fading, a door closer).`);

// ---- Pendulum
fc('pendulum', `Does the pendulum frequency depend on the mass m?`, `No.`);
fc('pendulum', `Does the pendulum frequency depend on the length l?`, `Yes: the shorter the pendulum, the higher the frequency.`);
fc('pendulum', `Does the pendulum frequency depend on g?`, `Yes: the stronger the gravity, the higher the frequency.`);
fc('pendulum', `&omega; of a pendulum`, `&omega; = &radic;(g / l)`);
fc('pendulum', `T of a pendulum`, `T = 2&pi; &middot; &radic;(l / g)`);
fc('pendulum', `g from a pendulum (l and T)`, `g = &omega;&sup2; &middot; l = 4&pi;&sup2; &middot; l / T&sup2; = (2&pi;/T)&sup2; &middot; l`);
fc('pendulum', `4 times longer pendulum: what happens to T?`, `T doubles (T is proportional to &radic;l).`);
fc('pendulum', `When is the pendulum formula valid?`, `For small swing angles (roughly below 10&ndash;15&deg;).`);
fc('pendulum', `How to measure T accurately`, `Time 10 full swings and divide by 10: reduces reaction-time error.`);
fc('pendulum', `Your data: l = 1 m, T = 2.55 s`, `g = (2&pi;/2.55)&sup2; &middot; 1 &asymp; 6.07 m/s&sup2; (weaker than on Earth)`);
fc('pendulum', `Your data: Planet X, l = 1 m, T = 1.69 s`, `g = (2&pi;/1.69)&sup2; &middot; 1 &asymp; 13.82 m/s&sup2;`);
fc('pendulum', `Earth: period of a 1 m pendulum`, `T &asymp; 2.01 s (g = 9.81 m/s&sup2;)`);
fc('pendulum', `Common mistake in g = (2&pi;/T)&sup2; &middot; l`, `Forgetting the factor l (invisible when l = 1 m).`);

// ---- Resonance
fc('resonance', `Resonance`, `An external periodic force acts on a system that can oscillate, at or close to its natural frequency: the amplitude increases (can become very large).`);
fc('resonance', `Natural frequency (eigenfrequency)`, `The frequency at which a system oscillates by itself after being disturbed once.`);
fc('resonance', `Driving far below or far above the natural frequency`, `Far below: the mass just follows the driver (about ×1). Far above: it hardly moves. At or near the natural frequency: the largest amplitude.`);
fc('resonance', `Effect of strong damping on resonance`, `The resonance peak stays lower.`);
fc('resonance', `Examples of resonance`, `Pushing a swing in rhythm; wine glass shattered by sound; rattling car parts at one engine speed; soldiers break step on a bridge; London Millennium Bridge (2000).`);
fc('resonance', `London Millennium Bridge: what happened and what was the fix?`, `Footsteps matched its natural frequency, it wobbled sideways. Fix: dampers.`);

// ---- Waves
fc('waves', `Wave`, `An oscillation that spreads out in space: each particle is excited by its neighbour.`);
fc('waves', `Do particles travel with the wave?`, `No. They only oscillate around their rest position; the oscillation (energy) travels.`);
fc('waves', `Transverse (transversal) wave`, `Oscillation perpendicular to the direction of travel. E.g. rope up and down, guitar string, stadium wave.`);
fc('waves', `Longitudinal wave`, `Oscillation parallel to the direction of travel. E.g. sound in air, slinky pushed and pulled. (Not &quot;longitude&quot;!)`);
fc('waves', `Wavelength &lambda;`, `Distance between two neighbouring crests (or troughs, or compressions). Unit: m.`);
fc('waves', `Crest / trough`, `Crest = highest point, trough = lowest point of a transverse wave.`);
fc('waves', `Compression / rarefaction`, `In a longitudinal wave: particles close together / far apart.`);
fc('waves', `Amplitude of a wave`, `The maximum displacement from the rest position.`);
fc('waves', `Wave speed`, `c = f &middot; &lambda; = &lambda; / T<br>(in one period the wave moves on by one wavelength)`);
fc('waves', `&lambda; = ? (from c and f)`, `&lambda; = c / f`);
fc('waves', `f = ? (from c and &lambda;)`, `f = c / &lambda;`);
fc('waves', `What does the wave speed on a string depend on?`, `On the medium: the tension (more tension = faster). NOT on frequency or amplitude.`);
fc('waves', `Same tension, double the frequency: what changes?`, `&lambda; halves, speed stays the same.`);
fc('waves', `Reflection at a fixed end`, `The pulse comes back inverted (upside down).`);
fc('waves', `Reflection at a loose end`, `The pulse comes back upright (same way up).`);
fc('waves', `Pulse returns smaller: why?`, `Energy loss (damping). It is not the reflection rule.`);
fc('waves', `Your data: f = 1, 2, 3 Hz and &lambda; = 4.2, 2.1, 1.4 cm`, `&lambda; &middot; f = 4.2 cm/s every time = the wave speed.`);
fc('waves', `Your data: f = 4 Hz, &lambda; = 0.5 m`, `c = 4 &middot; 0.5 = 2 m/s`);
fc('waves', `Worksheet Q8: 1.66 s vs 1.76 s at different amplitude`, `Speed does not depend on amplitude; 0.1 s is stopwatch reaction-time error.`);
fc('waves', `Worksheet Q3: does the bead travel with the wave?`, `No: it only oscillates up and down around its rest position; only the oscillation travels.`);

fc("resonance", `Natural (or individual) frequency`, `Your teacher's wording: the frequency at which a system oscillates by itself (eigenfrequency).`);
fc("resonance", `Potentially oscillating system`, `A system that can oscillate (swing, spring, bridge, glass): resonance can only happen with such a system.`);
fc("waves", `Oscillation &#8793; excitation (your note)`, `Each particle is excited by its neighbour, so the oscillation is passed on and spreads out as a wave.`);
fc("hooke", `F = m&middot;a with a = g`, `For a hanging mass the acceleration is g, so the force is the weight F = m&middot;g.`);
fc("describe", `Angular velocity vs angular frequency`, `Some books call &omega; the angular frequency; your class says angular velocity (rad/s).`);

// Items that go beyond her 8 pages of notes (correct physics, but not written in the notes): shown with an "Extra" tag.
["pendulum-05","pendulum-06","pendulum-08","pendulum-17","pendulum-18","pendulum-21","pendulum-25","resonance-06","resonance-08","resonance-09","resonance-10","resonance-11","resonance-13","resonance-14","resonance-15","resonance-16","waves-06","waves-09","waves-22","waves-33","describe-18","describe-35"].forEach(function(id){var q=Q.find(function(x){return x.id===id});if(!q)throw new Error("missing "+id);q.extra=true;});
["fc-032","fc-033","fc-034","fc-049","fc-054","fc-056","fc-057","fc-058","fc-061","fc-066","fc-067","fc-068","fc-071","fc-072","fc-075","fc-077","fc-093"].forEach(function(id){var c=F.find(function(x){return x.id===id});if(!c)throw new Error("missing "+id);c.extra=true;});
G.forEach(function(g){if(g.id==="gen-deg-rad")g.extra=true;});

P.questions = Q;
P.generators = G;
P.flashcards = F;
})();
