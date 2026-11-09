/* SłupŻB – testy weryfikacyjne silnika obliczeń (node tests/weryfikacja.js)
   Wartości oczekiwane liczone niezależnie (wzory podręcznikowe / ręczne), porównywane z wynikami programu. */
'use strict';
const E = require('../web/engine.js');
let nOk = 0, nBad = 0;
const near = (name, got, exp, tol) => {
  tol = tol === undefined ? 0.005 : tol;
  const ok = Math.abs(got - exp) <= tol * Math.max(1, Math.abs(exp));
  if (ok) nOk++; else nBad++;
  console.log(`${ok ? '✔' : '✖'} ${name}: ${(+got).toPrecision(6)} (oczekiwane ${(+exp).toPrecision(6)})`);
};
const truth = (name, v) => { if (v) nOk++; else nBad++; console.log(`${v ? '✔' : '✖'} ${name}`); };

/* 1. Statyka – momenty od obciążeń jednostkowych w schematach podparcia (x od podstawy) */
{
  const L = 4000, q = 1, H = 1;
  const M = (sch, k, x) => E.unitM(sch, k, x, L)[0];
  near('wspornik, H w głowicy: M(0) = H·L', M('cant', 'H', 0), H * L);
  near('wspornik, q: M(0) = qL²/2', M('cant', 'q', 0), q * L * L / 2);
  near('przegub–przegub, q: |M(L/2)| = qL²/8', -M('pp', 'q', L / 2), q * L * L / 8);
  near('utwierdzenie–przegub, q: M(0) = qL²/8', M('fp', 'q', 0), q * L * L / 8);
  { let mx = 0; for (let i = 0; i <= 400; i++) mx = Math.max(mx, -M('fp', 'q', i * L / 400)); near('utwierdzenie–przegub, q: |M_przęsło,max| = 9qL²/128', mx, 9 * q * L * L / 128, 0.001); }
  near('utwierdzenie–utwierdzenie, q: M(0) = qL²/12', M('ff', 'q', 0), q * L * L / 12);
  near('utwierdzenie–utwierdzenie, q: |M(L/2)| = qL²/24', -M('ff', 'q', L / 2), q * L * L / 24);
  near('utwierdzenie przesuwne, H: M(0) = H·L/2', M('ffs', 'H', 0), H * L / 2);
  near('utwierdzenie przesuwne, q: M(0) = qL²/3', M('ffs', 'q', 0), q * L * L / 3);
  near('utwierdzenie przesuwne, q: M(L) = −qL²/6', M('ffs', 'q', L), -q * L * L / 6);
  near('utwierdzenie–przegub, moment w głowicy: M(0) = −M/2', M('fp', 'Ma', 0), -0.5);
  // równowaga: V = dM/dx (różnice skończone)
  ['cant', 'pp', 'fp', 'ff', 'ffs'].forEach(s => { const x = 0.37 * L, h = 1; const d = (M(s, 'q', x + h) - M(s, 'q', x - h)) / (2 * h); near(`${s}: V = dM/dx (q)`, E.unitM(s, 'q', x, L)[1], d, 1e-4); });
}

/* 2. Długości wyboczeniowe (rys. 5.7, wzory 5.15/5.16) */
{
  const S = E.defaultState(); S.geom.L = 5;
  const g = E.geomCalc(E.normalize(S), { errors: [] });
  const B = sch => { const T = E.normalize(Object.assign({}, S, { buck: { same: false, y: { sch, mode: 'auto' }, z: { sch: 'pp', mode: 'auto' } } })); return E.bucklingDir(T, g, 'y').l0; };
  near('l₀ wspornik = 2l', B('cant'), 10000); near('l₀ utwierdzenie–przegub = 0,7l', B('fp'), 3500); near('l₀ utwierdzenie–utwierdzenie = 0,5l', B('ff'), 2500);
  const Tk = E.normalize(Object.assign({}, S, { buck: { same: false, y: { sch: 'pp', mode: 'k', k1: 0.4, k2: 0.6 }, z: { sch: 'cant', mode: 'k', k1: 0.4, k2: 0.6 } } }));
  const l15 = 0.5 * 5000 * Math.sqrt((1 + 0.4 / 0.85) * (1 + 0.6 / 1.05));
  near('l₀ wg (5.15), k₁ = 0,4, k₂ = 0,6', E.bucklingDir(Tk, g, 'y').l0, l15);
  const l16 = 5000 * Math.max(Math.sqrt(1 + 10 * 0.24 / 1.0), (1 + 0.4 / 1.4) * (1 + 0.6 / 1.6));
  near('l₀ wg (5.16), k₁ = 0,4, k₂ = 0,6', E.bucklingDir(Tk, g, 'z').l0, l16);
}

/* 3. Nośność przekroju – ściskanie osiowe i zginanie czyste (przekrój 400×400, 8⌀20, C30/37, B500) */
{
  const S = E.defaultState(); S.geom.b = 400; S.geom.h = 400; S.reb = { nb: 3, nh: 3, dc: 20, dm: 20, set: true };
  S.loads.items = [E.newItem('perm', { N: 100 })];
  const R = E.calc(S, { fast: true });
  const m = R.m, As = R.lay.As;
  const Nrd = (400 * 400 - As) * m.fcd + As * Math.min(m.fyd, 200000 * m.ec2);      // beton netto (bez pola prętów)
  near('N_Rd (ε_c = ε_c2): (A_c − A_s)·f_cd + A_s·E_s·ε_c2', R.dirs.y.U.Nmax, Nrd, 0.001);
  near('N_Rd,min (rozciąganie): A_s·f_yd', -R.dirs.y.U.Nmin, As * m.fyd, 0.001);
  // zginanie czyste: prostokątny blok – rozwiązanie z równowagi (3 pręty u góry i u dołu, 2 w osi)
  const a = R.lay.offC, d = 400 - a, A1 = 3 * E.area(20), A2 = 3 * E.area(20), Am = 2 * E.area(20);
  let lo = 1, hi = 300, sol = null;
  for (let i = 0; i < 200; i++) {
    const x = (lo + hi) / 2, eps = y => 0.0035 * (x - y) / x;
    const sc = e => Math.max(-m.fyd, Math.min(m.fyd, 200000 * e));
    const Fc = 0.8 * x * 400 * m.fcd;
    const F = Fc + A2 * (sc(eps(a)) - (a < 0.8 * x ? m.fcd : 0)) + Am * sc(eps(200)) + A1 * sc(eps(d));
    if (F > 0) hi = x; else lo = x;
    sol = { x, M: Fc * (200 - 0.4 * x) + A2 * (sc(eps(a)) - (a < 0.8 * x ? m.fcd : 0)) * (200 - a) - A1 * sc(eps(d)) * (d - 200) };
  }
  const T = JSON.parse(JSON.stringify(S)); T.mat.diag = 'rect';
  const Rr = E.calc(T, { fast: true });
  near('M_Rd(N = 0), wykres prostokątny – obliczenie ręczne', Rr.dirs.y.U.MRd(0, 1), Math.abs(sol.M), 0.01);
}

/* 4. Słup wzorcowy – metoda nominalnej krzywizny, obliczenie ręczne krok po kroku */
{
  const S = E.defaultState();          // 350×350, l = 4,2 m, przegub–przegub, C30/37, 8⌀20
  const R = E.calc(S);
  const o = R.res.find(q => q.c.name === '6.10a – Q1' && q.c.gl === 'sup');
  const r = o.y, m = R.m;
  const Ac = 350 * 350, fcd = 30 / 1.4, As = 8 * E.area(20), fyd = 500 / 1.15;
  const sw = 25e-6 * Ac * 4200 * 1.35;
  const Ntop = (1.35 * 720 + 1.5 * 0.7 * 260) * 1e3, Nmid = Ntop + sw / 2;
  near('N_Ed (połowa wysokości)', r.NEd, Nmid, 1e-6);
  const ah = 2 / Math.sqrt(4.2), ei = 0.005 * ah * 4200 / 2;
  near('e_i = θ_i·l₀/2', r.ei, ei, 1e-6);
  const M02 = (1.35 * 18 + 1.05 * 9) * 1e6 + Nmid * ei, M01 = (1.35 * 9 + 1.05 * 4) * 1e6 + Nmid * ei;
  const M0e = 0.6 * M02 + 0.4 * M01;
  near('M_0e = 0,6M₀₂ + 0,4M₀₁', r.M0e, M0e, 1e-6);
  // pełzanie (zał. B): h₀ = 175 mm, RH = 50%, t₀ = 28, f_cm = 38 MPa
  const h0 = 175, fcm = 38, a1 = (35 / fcm) ** 0.7, a2 = (35 / fcm) ** 0.2;
  const phiRH = (1 + 0.5 / (0.1 * Math.cbrt(h0)) * a1) * a2, phi = phiRH * 16.8 / Math.sqrt(fcm) / (0.1 + 28 ** 0.2);
  near('φ(∞, 28)', R.creep.phi, phi, 1e-6);
  const Nq = (720 + 0.3 * 260) * 1e3 + 25e-6 * Ac * 4200 / 2;
  const q2 = (18 + 0.3 * 9) * 1e6 + Nq * ei, q1 = (9 + 0.3 * 4) * 1e6 + Nq * ei;
  const phiEf = phi * (0.6 * q2 + 0.4 * q1) / M0e;
  near('φ_ef = φ·M_0Eqp/M_0Ed', r.phiEf, phiEf, 1e-6);
  const n = Nmid / (Ac * fcd), w = As * fyd / (Ac * fcd), rm = ((1.35 * 9 + 1.05 * 4) / (1.35 * 18 + 1.05 * 9));
  const lamLim = 20 * (1 / (1 + 0.2 * phiEf)) * Math.sqrt(1 + 2 * w) * (1.7 - rm) / Math.sqrt(n);
  near('λ_lim (5.13N)', r.lamLim, lamLim, 1e-6);
  near('λ = l₀/i', r.lam, 4200 / (350 / Math.sqrt(12)), 1e-6);
  const Is0 = R.lay.bars.reduce((a, b) => a + b.A * (b.y - 175) ** 2, 0), is = Math.sqrt(Is0 / As), d = 175 + is;   // rzeczywiste położenia prętów
  const Kr = Math.min(1, (1 + w - n) / (1 + w - 0.4)), beta = 0.35 + 30 / 200 - r.lam / 150, Kphi = Math.max(1, 1 + beta * phiEf);
  const e2 = Kr * Kphi * (fyd / 200000) / (0.45 * d) * 4200 * 4200 / 10;
  near('e₂ = (1/r)·l₀²/c', r.e2, e2, 1e-6);
  near('M_Ed = M_0e + N·e₂', r.secs[1].M, M0e + Nmid * e2, 1e-6);
  // metoda nominalnej sztywności – ten sam słup
  const T = JSON.parse(JSON.stringify(S)); T.sec2.method = 'ns';
  const Rn = E.calc(T), rn = Rn.res.find(q => q.c.name === '6.10a – Q1' && q.c.gl === 'sup').y;
  const k1 = Math.sqrt(30 / 20), k2 = Math.min(0.2, n * r.lam / 170), Kc = k1 * k2 / (1 + phiEf);
  const Is = Is0, Ic = 350 ** 4 / 12, EI = Kc * 33000 / 1.2 * Ic + 200000 * Is;
  const NB = Math.PI ** 2 * EI / 4200 ** 2;
  near('EI (5.21)', rn.EI, EI, 1e-6); near('N_B = π²EI/l₀²', rn.NB, NB, 1e-6);
  near('M_Ed = M_0e·[1 + (π²/8)/(N_B/N − 1)]', rn.secs[1].M, M0e * (1 + Math.PI ** 2 / 8 / (NB / Nmid - 1)), 1e-6);
  // metoda ogólna – wynik pomiędzy krzywizną nominalną a I rzędem (sprawdzenie zgodności rzędu wielkości)
  const Tg = JSON.parse(JSON.stringify(S)); Tg.sec2.method = 'gen';
  const rg = E.calc(Tg).res.find(q => q.c.name === '6.10a – Q1' && q.c.gl === 'sup').y;
  truth(`metoda ogólna: M₀ₑ < M_Ed,gen = ${(rg.secs[1].M / 1e6).toFixed(1)} < M_Ed,NC = ${(r.secs[1].M / 1e6).toFixed(1)} kNm`, rg.secs[1].M > M0e && rg.secs[1].M < r.secs[1].M);
}

/* 5. Zginanie ukośne – wykładnik a (5.39) */
{
  const S = E.defaultState(); const R = E.calc(S);
  const cs = R.res[0].biax.secs[0].cases[0];
  const ratio = cs.ratio, aExp = ratio <= 0.1 ? 1 : ratio <= 0.7 ? 1 + (ratio - 0.1) / 0.6 * 0.5 : 1.5 + (ratio - 0.7) / 0.3 * 0.5;
  near('a (interpolacja wg N_Ed/N_Rd)', cs.a, aExp, 1e-9);
}

/* 6. Zakład prętów (8.7.3) i zakotwienie */
{
  const S = E.defaultState(); const R = E.calc(S); const A = R.anch, m = R.m;
  const fbd = 2.25 * 1 * 1 * Math.min(2.0, 2.0) / 1.4;         // C30/37: f_ctk,0.05 = 2,0 MPa
  near('f_bd = 2,25·η₁·η₂·f_ctd', A.fbd, fbd, 1e-9);
  near('l_b,rqd = ⌀/4·f_yd/f_bd', A.lbrqd, 20 / 4 * m.fyd / fbd, 1e-9);
  near('l₀ = α₆·l_b,rqd (α₆ = 1,5, zaokr. 10 mm)', A.l0, Math.ceil(1.5 * 20 / 4 * m.fyd / fbd / 10) * 10, 1e-9);
}

/* 7. Odporność ogniowa – wzór (5.7) */
{
  const S = E.defaultState(); S.fire.R = 'R60'; S.fire.muSel = 'manual'; S.fire.mu = 0.5; S.fire.l0fiK = 0.7;
  const R = E.calc(S); const F = R.fire, m = R.m;
  const w = R.lay.As * m.fyd / (350 * 350 * m.fcd), a = F.a;
  const Reta = 83 * (1 - 0.5 * (1 + w) / (0.85 + w)), Ra = 1.6 * (a - 30), Rl = 9.6 * (5 - 0.7 * 4.2), Rb = 0.09 * 350, Rn = 12;
  near('R wg (5.7)', F.Rcalc, 120 * Math.pow((Reta + Ra + Rl + Rb + Rn) / 120, 1.8), 1e-9);
  truth(`tablica 5.2a, R60, μ = 0,5, b = 350: a_min = ${F.aReq} mm (oczekiwane 31 mm – interpolacja 300/31…)`, Math.abs(F.aReq - 31) < 1e-9);
}

/* 8. Wymagania konstrukcyjne 9.5 */
{
  const S = E.defaultState(); const R = E.calc(S);
  near('A_s,min = max(0,1·N_Ed/f_yd; 0,002·A_c)', R.AsMin, Math.max(0.1 * R.NEdMax / R.m.fyd, 0.002 * 350 * 350), 1e-9);
  near('s_cl,tmax = min(20⌀; b; 400)', R.ties.scl, Math.min(20 * 20, 350, 400), 1e-9);
  truth('⌀_t ≥ max(6; ⌀/4)', R.lay.dt >= Math.max(6, 20 / 4));
}

/* 9. Kombinacje: 1 obciążenie stałe + użytkowe + wiatr ± (6.10a/b) */
{
  const S = E.defaultState(); const R = E.calc(S);
  truth(`liczba kombinacji SGN: ${R.combos.U.length} (> 0, w tym γ_G,inf i wiatr ±)`, R.combos.U.length >= 20 && R.combos.U.some(c => c.gl === 'inf') && R.combos.U.some(c => Array.from(c.f).some(v => v < 0)));
}

/* 10. Dobór zbrojenia i przekroju – wynik spełnia wszystkie warunki */
{
  const S = E.defaultState(); S.loads.items[0].N = 1500;
  const A = E.autoReb(S);
  truth(`dobór zbrojenia: ${A.ok ? A.cand.n + '⌀' + A.cand.d : A.msg}`, A.ok && A.R.ok);
  const D = E.designDims(Object.assign(S, { geom: Object.assign(S.geom, { b: 250, h: 250 }) }));
  truth(`dobór przekroju: ${D.ok ? D.size.b + '×' + D.size.h + ' mm' : D.msg}`, D.ok && D.R.ok);
}

console.log(`\nWynik: ${nOk} zgodnych, ${nBad} niezgodnych.`);
process.exit(nBad ? 1 : 0);
