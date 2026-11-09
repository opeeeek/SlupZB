/* =====================================================================
   SłupŻB – silnik obliczeń słupów żelbetowych wg PN-EN 1992-1-1
   (wartości parametrów krajowych wg Załącznika Krajowego PL tam, gdzie
   różnią się od zalecanych), PN-EN 1990 (kombinacje), PN-EN 1992-1-2
   (odporność ogniowa – metoda A).
   Jednostki wewnętrzne: N, mm, MPa.  Wyniki: kN, kNm.
   Kierunki: „y” – zginanie M_y w płaszczyźnie wymiaru h (wysokość użyteczna wzdłuż h),
             „z” – zginanie M_z w płaszczyźnie wymiaru b.
   Znak momentu: M > 0 – rozciągana krawędź „−” (lewa na schemacie), ściskana „+”.
   ===================================================================== */
(function (root) {
'use strict';

/* ---------------------------------------------------------------- tabele */
// nazwa, fck, fck,cube, fctm, fctk0.05, fctk0.95, Ecm[GPa], εc1, εcu1, εc2, εcu2, n, εc3, εcu3 [‰]  (Tablica 3.1)
const CONC_ROWS = [
  ['C12/15', 12, 15, 1.6, 1.1, 2.0, 27, 1.8, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C16/20', 16, 20, 1.9, 1.3, 2.5, 29, 1.9, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C20/25', 20, 25, 2.2, 1.5, 2.9, 30, 2.0, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C25/30', 25, 30, 2.6, 1.8, 3.3, 31, 2.1, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C30/37', 30, 37, 2.9, 2.0, 3.8, 33, 2.2, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C35/45', 35, 45, 3.2, 2.2, 4.2, 34, 2.25, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C40/50', 40, 50, 3.5, 2.5, 4.6, 35, 2.3, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C45/55', 45, 55, 3.8, 2.7, 4.9, 36, 2.4, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C50/60', 50, 60, 4.1, 2.9, 5.3, 37, 2.45, 3.5, 2.0, 3.5, 2.0, 1.75, 3.5],
  ['C55/67', 55, 67, 4.2, 3.0, 5.5, 38, 2.5, 3.2, 2.2, 3.1, 1.75, 1.8, 3.1],
  ['C60/75', 60, 75, 4.4, 3.1, 5.7, 39, 2.6, 3.0, 2.3, 2.9, 1.6, 1.9, 2.9],
  ['C70/85', 70, 85, 4.6, 3.2, 6.0, 41, 2.7, 2.8, 2.4, 2.7, 1.45, 2.0, 2.7],
  ['C80/95', 80, 95, 4.8, 3.4, 6.3, 42, 2.8, 2.8, 2.5, 2.6, 1.4, 2.2, 2.6],
  ['C90/105', 90, 105, 5.0, 3.5, 6.6, 44, 2.8, 2.8, 2.6, 2.6, 1.4, 2.3, 2.6],
];
const CONCRETE = {}, CONC_NAMES = [];
CONC_ROWS.forEach(r => {
  CONCRETE[r[0]] = { name: r[0], fck: r[1], fckcube: r[2], fctm: r[3], fctk05: r[4], fctk95: r[5], Ecm: r[6],
    ec1: r[7], ecu1: r[8], ec2: r[9], ecu2: r[10], n: r[11], ec3: r[12], ecu3: r[13] };
  CONC_NAMES.push(r[0]);
});
const classIdx = n => CONC_NAMES.indexOf(n);

// Stal zbrojeniowa (Załącznik C)
const STEEL_LIST = [
  { id: 'B500SPn', name: 'B500SP – klasa C', fyk: 500, cls: 'C', euk: 7.5, k: 1.15 },
  { id: 'B500SP', name: 'B500SP (EPSTAL) – klasa C', fyk: 500, cls: 'C', euk: 7.5, k: 1.15 },
  { id: 'B500C', name: 'B500C – klasa C', fyk: 500, cls: 'C', euk: 7.5, k: 1.15 },
  { id: 'B500B', name: 'B500B / BSt500S – klasa B', fyk: 500, cls: 'B', euk: 5.0, k: 1.08 },
  { id: 'B500A', name: 'B500A – klasa A', fyk: 500, cls: 'A', euk: 2.5, k: 1.05 },
  { id: 'B450C', name: 'B450C – klasa C', fyk: 450, cls: 'C', euk: 7.5, k: 1.15 },
  { id: 'B400B', name: 'B400B – klasa B', fyk: 400, cls: 'B', euk: 5.0, k: 1.08 },
];
const STEEL = {}; STEEL_LIST.forEach(s => STEEL[s.id] = s);

const BAR_DIAS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32, 36, 40];
const MAIN_DIAS = [12, 14, 16, 20, 25, 28, 32];
const TIE_DIAS = [6, 8, 10, 12];
const EXPOSURES = ['X0', 'XC1', 'XC2', 'XC3', 'XC4', 'XD1', 'XD2', 'XD3', 'XS1', 'XS2', 'XS3'];
const EXP_DESC = {
  X0: 'brak zagrożenia korozją', XC1: 'karbonatyzacja – sucho lub stale mokro', XC2: 'karbonatyzacja – mokro, rzadko sucho',
  XC3: 'karbonatyzacja – umiarkowana wilgotność', XC4: 'karbonatyzacja – cyklicznie mokro i sucho',
  XD1: 'chlorki – umiarkowana wilgotność', XD2: 'chlorki – mokro, rzadko sucho', XD3: 'chlorki – cyklicznie mokro i sucho',
  XS1: 'woda morska – sól w powietrzu', XS2: 'woda morska – stałe zanurzenie', XS3: 'woda morska – strefy pływów/rozbryzgów',
  XF1: 'mróz – umiarkowane nasycenie, bez odladzaczy', XF2: 'mróz – umiarkowane nasycenie, z odladzaczami',
  XF3: 'mróz – silne nasycenie, bez odladzaczy', XF4: 'mróz – silne nasycenie, z odladzaczami',
  XA1: 'agresja chemiczna – słaba', XA2: 'agresja chemiczna – umiarkowana', XA3: 'agresja chemiczna – silna'
};
// Tablica 4.4N  cmin,dur [mm]: kolumny X0, XC1, XC2/XC3, XC4, XD1/XS1, XD2/XS2, XD3/XS3
const CMIN_DUR = [
  [10, 10, 10, 15, 20, 25, 30],
  [10, 10, 15, 20, 25, 30, 35],
  [10, 10, 20, 25, 30, 35, 40],
  [10, 15, 25, 30, 35, 40, 45],
  [15, 20, 30, 35, 40, 45, 50],
  [20, 25, 35, 40, 45, 50, 55],
];
const EXP_COL = { X0: 0, XC1: 1, XC2: 2, XC3: 2, XC4: 3, XD1: 4, XS1: 4, XD2: 5, XS2: 5, XD3: 6, XS3: 6 };
const SC_STRENGTH = { X0: 'C30/37', XC1: 'C30/37', XC2: 'C35/45', XC3: 'C35/45', XC4: 'C40/50', XD1: 'C40/50', XD2: 'C40/50', XS1: 'C40/50', XD3: 'C45/55', XS2: 'C45/55', XS3: 'C45/55' };
const MIN_CLASS = { X0: 'C12/15', XC1: 'C20/25', XC2: 'C25/30', XC3: 'C30/37', XC4: 'C30/37', XD1: 'C30/37', XD2: 'C30/37', XD3: 'C35/45',
  XS1: 'C30/37', XS2: 'C35/45', XS3: 'C35/45', XF1: 'C30/37', XF2: 'C25/30', XF3: 'C30/37', XF4: 'C30/37', XA1: 'C30/37', XA2: 'C30/37', XA3: 'C35/45' };
const WMAX = { X0: 0.4, XC1: 0.4, XC2: 0.3, XC3: 0.3, XC4: 0.3, XD1: 0.3, XD2: 0.3, XD3: 0.3, XS1: 0.3, XS2: 0.3, XS3: 0.3 };

// PN-EN 1990, Tablica A1.1 (z ZK)
const PSI = {
  A: { name: 'Kat. A – powierzchnie mieszkalne', p0: 0.7, p1: 0.5, p2: 0.3 },
  B: { name: 'Kat. B – biura', p0: 0.7, p1: 0.5, p2: 0.3 },
  C: { name: 'Kat. C – miejsca zebrań', p0: 0.7, p1: 0.7, p2: 0.6 },
  D: { name: 'Kat. D – powierzchnie handlowe', p0: 0.7, p1: 0.7, p2: 0.6 },
  E: { name: 'Kat. E – magazyny', p0: 1.0, p1: 0.9, p2: 0.8 },
  F: { name: 'Kat. F – ruch pojazdów ≤ 30 kN', p0: 0.7, p1: 0.7, p2: 0.6 },
  G: { name: 'Kat. G – ruch pojazdów 30–160 kN', p0: 0.7, p1: 0.5, p2: 0.3 },
  H: { name: 'Kat. H – dachy', p0: 0.0, p1: 0.0, p2: 0.0 },
  S: { name: 'Śnieg (H ≤ 1000 m n.p.m.)', p0: 0.5, p1: 0.2, p2: 0.0 },
  SH: { name: 'Śnieg (H > 1000 m n.p.m.)', p0: 0.7, p1: 0.5, p2: 0.2 },
  W: { name: 'Wiatr', p0: 0.6, p1: 0.2, p2: 0.0 },
  T: { name: 'Temperatura (nie pożar)', p0: 0.6, p1: 0.5, p2: 0.0 },
};
const VAR_KINDS = { imp: 'Obciążenie użytkowe', snow: 'Obciążenie śniegiem', wind: 'Oddziaływanie wiatru', other: 'Inne obciążenie zmienne' };

// PN-EN 1992-1-2, Tablica 5.2a – słupy prostokątne i okrągłe (metoda A): [b_min, a, wymagane ≥ 8 prętów]
// kolumny: μ_fi = 0,2 | 0,5 | 0,7 ; ostatnia pozycja – słup eksponowany z jednej strony (μ_fi = 0,7)
const FIRE_COL = {
  R30: [[[200, 25]], [[200, 25]], [[200, 32], [300, 27]], [155, 25]],
  R60: [[[200, 25]], [[200, 36], [300, 31]], [[250, 46], [350, 40]], [155, 25]],
  R90: [[[200, 31], [300, 25]], [[300, 45], [400, 38]], [[350, 53], [450, 40, 1]], [155, 25]],
  R120: [[[250, 40], [350, 35]], [[350, 45, 1], [450, 40, 1]], [[350, 57, 1], [450, 51, 1]], [175, 35]],
  R180: [[[350, 45, 1]], [[350, 63, 1]], [[450, 70, 1]], [230, 55]],
  R240: [[[350, 61, 1]], [[450, 75, 1]], [], [295, 70]],
};
const FIRE_MIN = { R30: 30, R60: 60, R90: 90, R120: 120, R180: 180, R240: 240 };

// schematy podparcia słupa (rys. 5.7) – w każdym kierunku osobno
const SCH = {
  pp: { name: 'przegub – przegub (układ usztywniony)', short: 'przegub–przegub', braced: true, beta: 1.0, fig: 'a' },
  cant: { name: 'wspornik – utwierdzenie u dołu, góra swobodna', short: 'wspornik', braced: false, beta: 2.0, fig: 'b' },
  fp: { name: 'utwierdzenie u dołu – przegub u góry (usztywniony)', short: 'utwierdzenie–przegub', braced: true, beta: 0.7, fig: 'c' },
  ff: { name: 'utwierdzenie – utwierdzenie (usztywniony)', short: 'utwierdzenie–utwierdzenie', braced: true, beta: 0.5, fig: 'd' },
  ffs: { name: 'utwierdzenie – utwierdzenie przesuwne (nieusztywniony)', short: 'utwierdzenie–przesuwne', braced: false, beta: 1.0, fig: 'e' },
};
const DIRS = ['y', 'z'];

/* --------------------------------------------------------------- pomocnicze */
const area = d => Math.PI * d * d / 4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const num = (v, def) => {
  if (typeof v === 'number') return isFinite(v) ? v : def;
  if (v === null || v === undefined || v === '') return def;
  const x = parseFloat(String(v).replace(',', '.').replace(/\s/g, ''));
  return isFinite(x) ? x : def;
};
const optNum = v => (v === '' || v === null || v === undefined) ? '' : num(v, '');
const interp = (tab, x) => {
  if (x <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) {
    const [x0, y0] = tab[i - 1], [x1, y1] = tab[i];
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  }
  return tab[tab.length - 1][1];
};
const ceilTo = (v, s) => Math.ceil(v / s - 1e-9) * s;
const floorTo = (v, s) => Math.floor(v / s + 1e-9) * s;
const massPerM = d => 0.00617 * d * d;          // kg/m
const mandrelMin = d => (d <= 16 ? 4 : 7) * d;  // tab. 8.1N
const NPT = 40;                                  // liczba odcinków na wysokości słupa
const XI = Array.from({ length: NPT + 1 }, (_, i) => i / NPT);

/* ---------------------------------------------------------------- stan */
function newItem(kind, o) {
  return Object.assign({ kind, name: '', cat: 'B', alt: 'low', N: 0, eh: 0, eb: 0, Hh: 0, Hb: 0, qh: 0, qb: 0, Myt: 0, Myb: 0, Mzt: 0, Mzb: 0, pm: kind === 'wind', off: false, p0: 0.7, p1: 0.5, p2: 0.3 }, o || {});
}
function newRow(o) { return Object.assign({ name: '', N: 0, Myt: 0, Myb: 0, Mzt: 0, Mzb: 0, Vy: '', Vz: '', off: false }, o || {}); }
function defaultState() {
  return {
    meta: { name: 'Słup S-1', author: '', note: '', ticks: {}, repMode: 'full' },
    geom: { shape: 'rect', b: 350, h: 350, D: 400, L: 4.2 },
    buck: {
      same: true,
      y: { sch: 'pp', mode: 'auto', beta: 1.0, l0: '', k1: 0.1, k2: 0.1 },
      z: { sch: 'pp', mode: 'auto', beta: 1.0, l0: '', k1: 0.1, k2: 0.1 },
    },
    mat: { concrete: 'C30/37', steel: 'B500SPn', steelW: 'B500A', dg: 16, diag: 'parab' },
    env: { exp: 'XC1', expF: '-', expA: '-', life: 50, scSel: 'auto', qc: false, scRed: false, dcdev: 10, dcg: 0, dcst: 0, dcadd: 0, cnomSel: 'auto', cnomVal: 30 },
    loads: {
      mode: 'cases', sw: true, comb: '610ab', gG: 1.35, gGinf: 1.0, gQ: 1.5, xi: 0.85,
      items: [
        newItem('perm', { name: 'Obciążenia stałe ze stropów', N: 720, Myt: 18, Myb: 9, Mzt: 6, Mzb: -4 }),
        newItem('imp', { name: 'Użytkowe – biura', cat: 'B', N: 260, Myt: 9, Myb: 4, Mzt: 3, Mzb: -2 }),
        newItem('wind', { name: 'Wiatr na ścianę zewnętrzną', qb: 1.6, pm: true }),
      ],
      direct: [newRow({ name: 'Kombinacja 1', N: 1250, Myt: 45, Myb: 20, Mzt: 10, Mzb: -6 })],
      rqp: 0.6, rk: 0.74,
    },
    sec2: { method: 'nc', imp: 'theta', ei: '', c: '10', creep: 'calc', nsVar: 'full', V2: true, biax: '539', e0: true },
    sls: { RH: 50, t0: 28, cem: 'N', phiSel: 'auto', phi: 2.0, check: true },
    reb: { nb: 3, nh: 3, dc: 20, dm: 20, nc: 8, set: true },
    stir: { d: 'auto', s: 'auto', pins: 'auto', hookA: 135 },
    det: { base: 'found', top: 'cont', hTop: 300, hF: 800, cF: 50, lap: '100', sigma: 'fyd', Lmax: 12, kicker: 0 },
    fire: { R: '-', side: 'more', eta: 0.7, muSel: 'auto', mu: 0.7, l0fiK: 0.7 },
    coef: { gc: 1.4, gs: 1.15, gcE: 1.2, acc: 1.0, act: 1.0, k1: 0.6, k2: 0.45, k3: 0.8, phiMin: 12, eMaxFi: 0.15 },
  };
}
function psiOf(it) {
  if (it.kind === 'imp') return PSI[it.cat] || PSI.B;
  if (it.kind === 'snow') return it.alt === 'high' ? PSI.SH : PSI.S;
  if (it.kind === 'wind') return PSI.W;
  return { name: 'Inne (ψ podane)', p0: clamp(num(it.p0, 0.7), 0, 1), p1: clamp(num(it.p1, 0.5), 0, 1), p2: clamp(num(it.p2, 0.3), 0, 1) };
}
const ITEM_NUM = ['N', 'eh', 'eb', 'Hh', 'Hb', 'qh', 'qb', 'Myt', 'Myb', 'Mzt', 'Mzb', 'p0', 'p1', 'p2'];
function normItem(it) {
  const o = newItem((it && it.kind) || 'imp', it);
  if (!(o.kind === 'perm' || VAR_KINDS[o.kind])) o.kind = 'imp';
  ITEM_NUM.forEach(k => o[k] = num(o[k], 0));
  o.name = String(o.name || ''); o.pm = !!o.pm; o.off = !!o.off;
  if (!PSI[o.cat] || ['S', 'SH', 'W', 'T'].includes(o.cat)) o.cat = 'B';
  return o;
}
function normRow(r) {
  const o = newRow(r);
  ['N', 'Myt', 'Myb', 'Mzt', 'Mzb'].forEach(k => o[k] = num(o[k], 0));
  o.Vy = optNum(o.Vy); o.Vz = optNum(o.Vz); o.name = String(o.name || ''); o.off = !!o.off;
  return o;
}
function mergeDef(d, s) {
  for (const k in d) {
    if (s[k] === undefined || s[k] === null) s[k] = JSON.parse(JSON.stringify(d[k]));
    else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) { if (typeof s[k] !== 'object' || Array.isArray(s[k])) s[k] = JSON.parse(JSON.stringify(d[k])); else mergeDef(d[k], s[k]); }
  }
}
function normalize(S0) {
  const D = defaultState();
  const S = JSON.parse(JSON.stringify(S0 || {}));
  mergeDef(D, S);
  const G = S.geom;
  G.shape = G.shape === 'circ' ? 'circ' : 'rect';
  G.b = num(G.b, 350); G.h = num(G.h, 350); G.D = num(G.D, 400); G.L = num(G.L, 4.2);
  ['y', 'z'].forEach(d => {
    const q = S.buck[d];
    if (!SCH[q.sch]) q.sch = 'pp';
    if (!['auto', 'beta', 'k', 'l0'].includes(q.mode)) q.mode = 'auto';
    q.beta = num(q.beta, 1); q.l0 = optNum(q.l0); q.k1 = Math.max(0, num(q.k1, 0.1)); q.k2 = Math.max(0, num(q.k2, 0.1));
  });
  S.buck.same = S.buck.same !== false;
  if (S.buck.same) S.buck.z = JSON.parse(JSON.stringify(S.buck.y));
  if (!CONCRETE[S.mat.concrete]) S.mat.concrete = 'C30/37';
  if (!STEEL[S.mat.steel]) S.mat.steel = 'B500SPn';
  if (!STEEL[S.mat.steelW]) S.mat.steelW = 'B500A';
  S.mat.dg = num(S.mat.dg, 16); S.mat.diag = S.mat.diag === 'rect' ? 'rect' : 'parab';
  ['life', 'dcdev', 'dcg', 'dcst', 'dcadd', 'cnomVal'].forEach(k => S.env[k] = num(S.env[k], D.env[k]));
  const Lo = S.loads;
  Lo.mode = Lo.mode === 'direct' ? 'direct' : 'cases';
  Lo.items = (Array.isArray(Lo.items) ? Lo.items : []).map(normItem);
  Lo.direct = (Array.isArray(Lo.direct) ? Lo.direct : []).map(normRow);
  ['gG', 'gGinf', 'gQ', 'xi', 'rqp', 'rk'].forEach(k => Lo[k] = num(Lo[k], D.loads[k]));
  Lo.comb = Lo.comb === '610' ? '610' : '610ab'; Lo.sw = Lo.sw !== false;
  const R2 = S.sec2;
  if (!['nc', 'ns', 'gen'].includes(R2.method)) R2.method = 'nc';
  if (!['theta', 'l400', 'manual'].includes(R2.imp)) R2.imp = 'theta';
  R2.ei = optNum(R2.ei);
  if (!['8', '9.87', '10', '12'].includes(String(R2.c))) R2.c = '10'; R2.c = String(R2.c);
  if (!['calc', 'ignore'].includes(R2.creep)) R2.creep = 'calc';
  R2.nsVar = R2.nsVar === 'simple' ? 'simple' : 'full'; R2.V2 = R2.V2 !== false; R2.e0 = R2.e0 !== false;
  R2.biax = ['539', 'fiber'].includes(R2.biax) ? R2.biax : '539';
  ['RH', 't0', 'phi'].forEach(k => S.sls[k] = num(S.sls[k], D.sls[k]));
  if (!['auto', 'manual', 'off'].includes(S.sls.phiSel)) S.sls.phiSel = 'auto';
  const rb = S.reb;
  rb.nb = clamp(Math.round(num(rb.nb, 3)), 2, 16); rb.nh = clamp(Math.round(num(rb.nh, 3)), 2, 16); rb.nc = clamp(Math.round(num(rb.nc, 8)), 4, 40);
  rb.dc = num(rb.dc, 20); rb.dm = num(rb.dm, rb.dc); rb.set = rb.set !== false;
  const st = S.stir;
  st.d = st.d === 'auto' ? 'auto' : num(st.d, 8); st.s = st.s === 'auto' || st.s === '' ? 'auto' : num(st.s, 200);
  if (!['auto', 'all', 'none'].includes(st.pins)) st.pins = 'auto';
  st.hookA = num(st.hookA, 135) === 90 ? 90 : 135;
  const dt = S.det;
  dt.base = dt.base === 'col' ? 'col' : 'found'; dt.top = dt.top === 'anch' ? 'anch' : 'cont';
  ['hTop', 'hF', 'cF', 'Lmax', 'kicker'].forEach(k => dt[k] = num(dt[k], D.det[k]));
  if (!['50', '100'].includes(String(dt.lap))) dt.lap = '100'; dt.lap = String(dt.lap);
  dt.sigma = dt.sigma === 'actual' ? 'actual' : 'fyd';
  const F = S.fire;
  if (!FIRE_COL[F.R]) F.R = '-';
  F.side = F.side === 'one' ? 'one' : 'more';
  F.eta = clamp(num(F.eta, 0.7), 0.1, 1); F.mu = clamp(num(F.mu, 0.7), 0.05, 1); F.muSel = F.muSel === 'manual' ? 'manual' : 'auto'; F.l0fiK = clamp(num(F.l0fiK, 0.7), 0.3, 2);
  Object.keys(D.coef).forEach(k => S.coef[k] = num(S.coef[k], D.coef[k]));
  S.meta.ticks = S.meta.ticks && typeof S.meta.ticks === 'object' ? S.meta.ticks : {};
  return S;
}

/* -------------------------------------------------------------- materiały */
function materials(S) {
  const c = CONCRETE[S.mat.concrete] || CONCRETE['C30/37'];
  const st = STEEL[S.mat.steel] || STEEL.B500SPn;
  const sw = STEEL[S.mat.steelW] || STEEL.B500A;
  const k = S.coef;
  const m = { c, st, sw, fck: c.fck, fcm: c.fck + 8, fctm: c.fctm, fctk05: c.fctk05, Ecm: c.Ecm * 1000, gc: k.gc, gs: k.gs, gcE: k.gcE, acc: k.acc, act: k.act };
  m.fcd = k.acc * c.fck / k.gc;
  m.fctd = k.act * c.fctk05 / k.gc;
  m.fctdBond = k.act * Math.min(c.fctk05, CONCRETE['C60/75'].fctk05) / k.gc;
  m.lambda = c.fck <= 50 ? 0.8 : 0.8 - (c.fck - 50) / 400;
  m.eta = c.fck <= 50 ? 1.0 : 1.0 - (c.fck - 50) / 200;
  m.ec1 = c.ec1 / 1000; m.ecu1 = c.ecu1 / 1000;
  m.ec2 = c.ec2 / 1000; m.ecu2 = c.ecu2 / 1000; m.npar = c.n; m.ec3 = c.ec3 / 1000; m.ecu3 = c.ecu3 / 1000;
  m.diag = S.mat.diag === 'rect' ? 'rect' : 'parab';
  if (m.diag === 'rect') { m.ec = m.ec3; m.ecu = m.ecu3; } else { m.ec = m.ec2; m.ecu = m.ecu2; }
  m.Es = 200000; m.fyk = st.fyk; m.fyd = st.fyk / k.gs; m.eyd = m.fyd / m.Es;
  m.euk = st.euk / 100; m.eud = 0.9 * m.euk;
  m.fywk = sw.fyk; m.fywd = sw.fyk / k.gs;
  m.Ecd = m.Ecm / k.gcE;
  m.nu1 = 0.6 * (1 - c.fck / 250);
  return m;
}

/* -------------------------------------------------------------- geometria */
// pole odcinka koła o promieniu R leżącego powyżej prostej w głębokości y (0 ≤ y ≤ 2R)
function circSeg(R, y) { y = clamp(y, 0, 2 * R); const t = R - y; return R * R * Math.acos(clamp(t / R, -1, 1)) - t * Math.sqrt(Math.max(0, 2 * R * y - y * y)); }
function partsOf(g, dir) {
  if (!g.circ) return dir === 'y' ? [{ y0: 0, y1: g.h, b: g.b }] : [{ y0: 0, y1: g.b, b: g.h }];
  const n = 48, R = g.D / 2, out = [];
  for (let i = 0; i < n; i++) { const y0 = g.D * i / n, y1 = g.D * (i + 1) / n; out.push({ y0, y1, b: (circSeg(R, y1) - circSeg(R, y0)) / (y1 - y0) }); }
  return out;
}
function grossProps(parts) {
  let A = 0, S = 0, I0 = 0;
  parts.forEach(p => { const d = p.y1 - p.y0; A += p.b * d; S += p.b * (p.y1 * p.y1 - p.y0 * p.y0) / 2; I0 += p.b * (p.y1 ** 3 - p.y0 ** 3) / 3; });
  const yc = S / A; return { A, yc, I: I0 - A * yc * yc };
}
function areaBetween(parts, ya, yb) {
  let A = 0, Ay = 0;
  parts.forEach(p => { const a = Math.max(ya, p.y0), b = Math.min(yb, p.y1); if (b > a) { A += p.b * (b - a); Ay += p.b * (b * b - a * a) / 2; } });
  return { A, Ay };
}
function geomCalc(S, R) {
  const G = S.geom, circ = G.shape === 'circ';
  const g = { circ, L: G.L * 1000 };
  if (circ) { g.D = G.D; g.b = g.h = G.D; g.Ac = area(G.D); g.Iy = g.Iz = Math.PI * G.D ** 4 / 64; g.u = Math.PI * G.D; }
  else { g.b = G.b; g.h = G.h; g.Ac = G.b * G.h; g.Iy = G.b * G.h ** 3 / 12; g.Iz = G.h * G.b ** 3 / 12; g.u = 2 * (G.b + G.h); }
  if (!(g.b >= 150 && g.h >= 150)) R.errors.push('Wymiary przekroju muszą być ≥ 150 mm.');
  if (!(g.L >= 500 && g.L <= 60000)) R.errors.push('Wysokość słupa L musi mieścić się w granicach 0,5 ÷ 60 m.');
  g.iy = Math.sqrt(g.Iy / g.Ac); g.iz = Math.sqrt(g.Iz / g.Ac);
  g.h0 = 2 * g.Ac / g.u;
  g.heq = g.iy * Math.sqrt(12); g.beq = g.iz * Math.sqrt(12);
  g.selfW = 25e-6 * g.Ac;            // kN/m = N/mm
  g.dmax = Math.max(g.b, g.h); g.dmin = Math.min(g.b, g.h);
  g.dir = {
    y: { depth: g.h, width: g.b, I: g.Iy, i: g.iy, eq: g.heq },
    z: { depth: g.b, width: g.h, I: g.Iz, i: g.iz, eq: g.beq },
  };
  g.parts = { y: partsOf(g, 'y'), z: partsOf(g, 'z') };
  g.wall = !circ && g.dmax > 4 * g.dmin;
  return g;
}

/* ---------------------------------------------------------------- otulina */
function coverCalc(S, m, dMain, dSw) {
  const env = S.env;
  const exp = EXP_COL[env.exp] !== undefined ? env.exp : 'XC1';
  let sc = 4; const mods = ['klasa wyjściowa S4'];
  if (+env.life >= 100) { sc += 2; mods.push('+2: projektowy okres użytkowania 100 lat'); }
  const thr = SC_STRENGTH[exp];
  const redPossible = !!(thr && classIdx(S.mat.concrete) >= classIdx(thr));
  if (redPossible && env.scRed) { sc -= 1; mods.push(`−1: klasa betonu ≥ ${thr} (tab. 4.3N, przyjęte przez projektanta)`); }
  else if (redPossible) mods.push(`możliwe −1: klasa betonu ≥ ${thr} (tab. 4.3N) – nieuwzględnione`);
  if (env.qc) { sc -= 1; mods.push('−1: zapewniona specjalna kontrola jakości'); }
  sc = clamp(sc, 1, 6);
  if (env.scSel && env.scSel !== 'auto') { sc = clamp(parseInt(String(env.scSel).replace('S', ''), 10) || 4, 1, 6); mods.push(`przyjęto ręcznie S${sc}`); }
  const cdur = CMIN_DUR[sc - 1][EXP_COL[exp]];
  const cdurRed = redPossible && !env.scRed && !(env.scSel && env.scSel !== 'auto') ? CMIN_DUR[clamp(sc - 1, 1, 6) - 1][EXP_COL[exp]] : null;
  const dg = S.mat.dg, add = dg > 32 ? 5 : 0;
  const cminb_sw = dSw + add, cminb_main = dMain + add;
  const cdurNet = cdur + env.dcg - env.dcst - env.dcadd;
  const cmin_sw = Math.max(cminb_sw, cdurNet, 10);
  const cmin_main = Math.max(cminb_main, cdurNet, 10);
  const dcdev = env.dcdev;
  const cnom_sw = cmin_sw + dcdev, cnom_main = cmin_main + dcdev;
  const req = Math.max(cnom_sw, cnom_main - dSw);
  const reqR = ceilTo(req, 5);
  const manual = env.cnomSel === 'manual';
  const cnom = manual ? Math.max(0, num(env.cnomVal, reqR)) : reqR;
  const exps = [exp]; if (env.expF && env.expF !== '-') exps.push(env.expF); if (env.expA && env.expA !== '-') exps.push(env.expA);
  let minCls = 'C12/15', minFrom = 'X0';
  exps.forEach(e => { const c = MIN_CLASS[e]; if (c && classIdx(c) > classIdx(minCls)) { minCls = c; minFrom = e; } });
  return { exp, exps, sc, mods, cdur, redPossible, scRed: !!env.scRed, cdurRed, thr, add, cminb_sw, cminb_main, cdurNet, cmin_sw, cmin_main, dcdev,
    cnom_sw, cnom_main, req, reqR, cnom, manual, dMain, dSw, minCls, minFrom, minOk: classIdx(S.mat.concrete) >= classIdx(minCls) };
}

/* --------------------------------------------------------- układ prętów */
const tieDiaAuto = dmax => TIE_DIAS.find(d => d >= Math.max(6, dmax / 4)) || 12;
function tieDia(S) { const dmax = Math.max(S.reb.dc, S.geom.shape === 'circ' ? 0 : S.reb.dm); return S.stir.d === 'auto' ? tieDiaAuto(dmax) : S.stir.d; }
// pokrycie prętów w świetle ≤ 150 mm od pręta utrzymanego strzemieniem (9.5.3(6)) – zachłannie, najmniej szpilek
function restrainFace(pos, dia, mode) {
  const n = pos.length, R = new Array(n).fill(false);
  R[0] = R[n - 1] = true;
  if (mode === 'all') { R.fill(true); return R; }
  if (mode === 'none' || n <= 2) return R;
  const clear = (i, j) => Math.abs(pos[j] - pos[i]) - (dia[i] + dia[j]) / 2;
  const covered = k => R.some((r, j) => r && clear(k, j) <= 150 + 1e-6);
  for (let guard = 0; guard < n; guard++) {
    let k = -1; for (let i = 1; i < n - 1; i++) if (!covered(i)) { k = i; break; }
    if (k < 0) break;
    let j = k; for (let t = k; t < n - 1; t++) if (clear(k, t) <= 150 + 1e-6) j = t;
    R[j] = true;
  }
  return R;
}
function layoutBars(S, g, cov, m) {
  const rb = S.reb, dt = tieDia(S), c = cov.cnom, rin = mandrelMin(dt) / 2;
  const lay = { bars: [], dt, issues: [], faces: {}, legs: { y: 2, z: 2 }, pins: [], set: rb.set };
  const smin = d => Math.max(d, S.mat.dg + 5, 20);
  if (!rb.set) { lay.As = 0; lay.n = 0; lay.dmax = 0; lay.dmin = 0; return lay; }
  if (g.circ) {
    const d = rb.dc, n = rb.nc, Rs = g.D / 2 - c - dt - d / 2;
    lay.Rs = Rs; lay.Rt = g.D / 2 - c - dt / 2;
    for (let k = 0; k < n; k++) { const t = (k + 0.5) * 2 * Math.PI / n; lay.bars.push({ x: g.D / 2 + Rs * Math.sin(t), y: g.D / 2 - Rs * Math.cos(t), d, A: area(d), corner: false, face: 'c' }); }
    const chord = 2 * Rs * Math.sin(Math.PI / n);
    lay.clear = { c: chord - d }; lay.smin = smin(d);
    lay.faces.c = { n, clear: chord - d, ctc: chord };
    lay.legs = { y: 2, z: 2 }; lay.restrained = lay.bars.length;
  } else {
    const nb = rb.nb, nh = rb.nh, dc = rb.dc, dm = rb.dm;
    const offC = c + dt + Math.max(dc / 2, rin - (rin - dc / 2) / Math.SQRT2);
    const offM = c + dt + dm / 2;
    lay.offC = offC; lay.offM = offM; lay.rin = rin;
    const xs = [], ys = [];
    for (let k = 0; k < nb; k++) xs.push(offC + k * (g.b - 2 * offC) / (nb - 1));
    for (let k = 0; k < nh; k++) ys.push(offC + k * (g.h - 2 * offC) / (nh - 1));
    const dB = xs.map((_, k) => (k === 0 || k === nb - 1) ? dc : dm), dH = ys.map((_, k) => (k === 0 || k === nh - 1) ? dc : dm);
    const rB = restrainFace(xs, dB, S.stir.pins), rH = restrainFace(ys, dH, S.stir.pins);
    const add = (x, y, d, corner, face, rest) => lay.bars.push({ x, y, d, A: area(d), corner, face, rest });
    add(offC, offC, dc, true, 'c', true); add(g.b - offC, offC, dc, true, 'c', true); add(offC, g.h - offC, dc, true, 'c', true); add(g.b - offC, g.h - offC, dc, true, 'c', true);
    for (let k = 1; k < nb - 1; k++) { add(xs[k], offM, dm, false, 'b', rB[k]); add(xs[k], g.h - offM, dm, false, 'b', rB[k]); }
    for (let k = 1; k < nh - 1; k++) { add(offM, ys[k], dm, false, 'h', rH[k]); add(g.b - offM, ys[k], dm, false, 'h', rH[k]); }
    const clr = (p, d) => { let mn = Infinity; for (let k = 0; k < p.length - 1; k++) mn = Math.min(mn, p[k + 1] - p[k] - (d[k] + d[k + 1]) / 2); return mn; };
    const farB = (() => { let mx = 0; xs.forEach((x, k) => { let best = Infinity; xs.forEach((x2, j) => { if (rB[j]) best = Math.min(best, Math.abs(x - x2) - (dB[k] + dB[j]) / 2); }); mx = Math.max(mx, rB[k] ? 0 : best); }); return mx; })();
    const farH = (() => { let mx = 0; ys.forEach((y, k) => { let best = Infinity; ys.forEach((y2, j) => { if (rH[j]) best = Math.min(best, Math.abs(y - y2) - (dH[k] + dH[j]) / 2); }); mx = Math.max(mx, rH[k] ? 0 : best); }); return mx; })();
    lay.faces.b = { n: nb, pos: xs, dia: dB, rest: rB, clear: clr(xs, dB), ctc: nb > 1 ? xs[1] - xs[0] : 0, far: farB };
    lay.faces.h = { n: nh, pos: ys, dia: dH, rest: rH, clear: clr(ys, dH), ctc: nh > 1 ? ys[1] - ys[0] : 0, far: farH };
    lay.smin = smin(Math.max(dc, dm));
    // szpilki: w kierunku h (łączą pręty ścian b) i w kierunku b (łączą pręty ścian h)
    for (let k = 1; k < nb - 1; k++) if (rB[k]) lay.pins.push({ dir: 'h', x: xs[k], d: dm });
    for (let k = 1; k < nh - 1; k++) if (rH[k]) lay.pins.push({ dir: 'b', y: ys[k], d: dm });
    lay.legs = { y: 2 + lay.pins.filter(p => p.dir === 'h').length, z: 2 + lay.pins.filter(p => p.dir === 'b').length };
    lay.restrained = lay.bars.filter(b => b.rest).length;
    if (g.b - 2 * offC < 0 || g.h - 2 * offC < 0) lay.issues.push('pręty nie mieszczą się w przekroju');
  }
  lay.As = lay.bars.reduce((a, b) => a + b.A, 0);
  lay.n = lay.bars.length;
  lay.dmax = Math.max(...lay.bars.map(b => b.d)); lay.dmin = Math.min(...lay.bars.map(b => b.d));
  lay.cl = c + dt;                                   // otulina prętów podłużnych (do pręta)
  lay.a = c + dt + lay.dmax / 2;                     // odległość osi prętów od krawędzi (do odporności ogniowej)
  if (!g.circ) lay.a = Math.min(lay.offC, lay.offM);
  else lay.a = g.D / 2 - lay.Rs;
  return lay;
}
// pręty we współrzędnych kierunku: y – głębokość mierzona od krawędzi „+” (ściskanej przy M > 0)
function barsDir(lay, g, dir) { return lay.bars.map(b => ({ y: dir === 'y' ? b.y : b.x, x: dir === 'y' ? b.x : b.y, A: b.A, d: b.d })); }

/* ------------------------------------------- SGN przekroju: zgodność odkształceń */
function makeULS(parts, h, bars, m) {
  const gp = grossProps(parts); const yc = gp.yc;
  const yA = bars.length ? Math.max(...bars.map(b => b.y)) : h;
  const ecu = m.ecu, ec = m.ec, eud = m.eud, fcd = m.fcd;
  const sigParab = e => e <= 0 ? 0 : e >= m.ec2 ? fcd : fcd * (1 - Math.pow(1 - e / m.ec2, m.npar));
  function strains(p) {
    if (p <= 1) { const eT = -eud + p * (ecu + eud); const eB = eT + (-eud - eT) * h / yA; return [eT, eB]; }
    if (p <= 2) { const xAB = ecu / (ecu + eud) * yA; const x = xAB + (p - 1) * (h - xAB); return [ecu, ecu * (1 - h / x)]; }
    const yC = (1 - ec / ecu) * h; const eB = (p - 2) * ec; const eT = ec + (ec - eB) * yC / (h - yC); return [eT, eB];
  }
  function forces(eT, eB) {
    let N = 0, Fy = 0, block = null, x = null;
    const top = eT >= eB, emax = top ? eT : eB, emin = top ? eB : eT;
    if (emax > 0) x = emin >= 0 ? Infinity : emax * h / (emax - emin);
    if (m.diag === 'rect') {
      if (emax > 0) {
        const a = Math.min(m.lambda * x, h), s = m.eta * fcd;
        block = top ? [0, a] : [h - a, h];
        const r = areaBetween(parts, block[0], block[1]);
        N += s * r.A; Fy += s * r.Ay;
      }
    } else {
      parts.forEach(p => {
        const ns = Math.max(4, Math.round(60 * (p.y1 - p.y0) / h)), dy = (p.y1 - p.y0) / ns;
        for (let i = 0; i < ns; i++) {
          const y = p.y0 + (i + 0.5) * dy, e = eT + (eB - eT) * y / h;
          const s = sigParab(e); if (s > 0) { const F = s * p.b * dy; N += F; Fy += F * y; }
        }
      });
    }
    const bs = bars.map(b => {
      const e = eT + (eB - eT) * b.y / h;
      const ss = clamp(m.Es * e, -m.fyd, m.fyd);
      let sc = 0;
      if (m.diag === 'rect') { if (block && b.y >= block[0] && b.y <= block[1]) sc = m.eta * fcd; } else sc = sigParab(e);
      const F = b.A * (ss - sc); N += F; Fy += F * b.y;
      return { e, s: ss, y: b.y };
    });
    return { N, M: yc * N - Fy, eT, eB, x, block, bs };
  }
  const at = p => Object.assign(forces(...strains(p)), { p });
  const Nmin = at(0).N, Nmax = at(3).N;
  // tablica krzywej interakcji (szybkie M_Rd(N) przez interpolację)
  const NT = 360, tN = new Float64Array(NT + 1), tM = new Float64Array(NT + 1);
  for (let i = 0; i <= NT; i++) { const r = at(3 * i / NT); tN[i] = r.N; tM[i] = r.M; }
  function MRdFast(N) {
    if (N < Nmin - 1e-6 || N > Nmax + 1e-6) return null;
    let lo = 0, hi = NT;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (tN[mid] < N) lo = mid; else hi = mid; }
    const t = tN[hi] - tN[lo] > 1e-9 ? (N - tN[lo]) / (tN[hi] - tN[lo]) : 0;
    return tM[lo] + t * (tM[hi] - tM[lo]);
  }
  function MRd(N) {
    if (N < Nmin - 1e-6 || N > Nmax + 1e-6) return null;
    let lo = 0, hi = 3;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (at(mid).N < N) lo = mid; else hi = mid; }
    return at((lo + hi) / 2);
  }
  function curve(n) { const pts = []; n = n || 120; for (let i = 0; i <= n; i++) { const r = at(3 * i / n); pts.push([r.M, r.N]); } return pts; }
  return { yc, yA, h, at, MRd, MRdFast, curve, Nmin, Nmax };
}
// para krzywych: M > 0 (ściskana krawędź „+”, y = 0) i M < 0 (pręty odbite)
function makeDirULS(parts, h, bars, m) {
  const P = makeULS(parts, h, bars, m);
  const fl = parts.map(p => ({ y0: h - p.y1, y1: h - p.y0, b: p.b })).reverse();
  const Nn = makeULS(fl, h, bars.map(b => Object.assign({}, b, { y: h - b.y })), m);
  return {
    pos: P, neg: Nn, Nmin: Math.max(P.Nmin, Nn.Nmin), Nmax: Math.min(P.Nmax, Nn.Nmax),
    // nośność dla momentu o znaku sg przy sile N
    MRd: (N, sg) => { const v = (sg < 0 ? Nn : P).MRdFast(N); return v === null ? null : Math.max(0, v); },
    MRdX: (N, sg) => (sg < 0 ? Nn : P).MRd(N),
  };
}

/* --------------------------------------- zginanie ukośne – metoda włókien */
function pivotStrains(p, h, yA, m) {
  const ecu = m.ecu, ec = m.ec, eud = m.eud;
  if (p <= 1) { const eT = -eud + p * (ecu + eud); const eB = eT + (-eud - eT) * h / yA; return [eT, eB]; }
  if (p <= 2) { const xAB = ecu / (ecu + eud) * yA; const x = xAB + (p - 1) * (h - xAB); return [ecu, ecu * (1 - h / x)]; }
  const yC = (1 - ec / ecu) * h; const eB = (p - 2) * ec; const eT = ec + (ec - eB) * yC / (h - yC); return [eT, eB];
}
function fiberize(parts, ny0, nz0) {
  const fib = [], corners = [];
  const H = parts[parts.length - 1].y1 - parts[0].y0;
  parts.forEach(p => {
    const ny = Math.max(1, Math.round(ny0 * (p.y1 - p.y0) / H)), nz = nz0;
    const dy = (p.y1 - p.y0) / ny, dz = p.b / nz;
    for (let i = 0; i < ny; i++) for (let j = 0; j < nz; j++) fib.push({ y: p.y0 + (i + 0.5) * dy, z: -p.b / 2 + (j + 0.5) * dz, A: dy * dz, dy, dz });
    corners.push([p.y0, -p.b / 2], [p.y0, p.b / 2], [p.y1, -p.b / 2], [p.y1, p.b / 2]);
  });
  return { fib, corners };
}
function makeBiax(parts, bars, m, bw) {
  const { fib, corners } = fiberize(parts, parts.length > 1 ? parts.length : 40, 24);
  const nf = fib.length, yc = grossProps(parts).yc;
  const bz = bars.map(b => ({ y: b.y, z: b.x - bw / 2, A: b.A }));
  const fcd = m.fcd, rect = m.diag === 'rect', sR = m.eta * fcd;
  const sigP = e => e <= 0 ? 0 : e >= m.ec2 ? fcd : fcd * (1 - Math.pow(1 - e / m.ec2, m.npar));
  function prep(theta) {
    const c = Math.cos(theta), s = Math.sin(theta);
    let uMin = Infinity, uMax = -Infinity;
    corners.forEach(([y, z]) => { const v = y * c + z * s; uMin = Math.min(uMin, v); uMax = Math.max(uMax, v); });
    const uf = new Float64Array(nf); for (let i = 0; i < nf; i++) uf[i] = fib[i].y * c + fib[i].z * s - uMin;
    const ub = bz.map(b => b.y * c + b.z * s - uMin);
    return { hu: uMax - uMin, uf, ub, uA: ub.length ? Math.max(...ub) : uMax - uMin };
  }
  function evalP(P, p) {
    const [eT, eB] = pivotStrains(p, P.hu, Math.max(1, P.uA), m);
    const g = (eB - eT) / P.hu;
    let N = 0, My = 0, Mz = 0, blk = -1;
    if (rect && eT > 0) { const x = eB >= 0 ? Infinity : eT * P.hu / (eT - eB); blk = Math.min(m.lambda * x, P.hu); }
    for (let i = 0; i < nf; i++) {
      let s = 0;
      if (rect) { if (blk > 0 && P.uf[i] <= blk) s = sR; } else { const e = eT + g * P.uf[i]; if (e > 0) s = sigP(e); }
      if (s > 0) { const F = s * fib[i].A; N += F; My += F * (yc - fib[i].y); Mz -= F * fib[i].z; }
    }
    for (let j = 0; j < bz.length; j++) {
      const b = bz[j], uu = P.ub[j], e = eT + g * uu;
      const scc = rect ? (blk > 0 && uu <= blk ? sR : 0) : sigP(e);
      const F = b.A * (clamp(m.Es * e, -m.fyd, m.fyd) - scc);
      N += F; My += F * (yc - b.y); Mz -= F * b.z;
    }
    return { N, My, Mz };
  }
  const prepCache = new Map();
  const prepOf = th => { if (!prepCache.has(th)) prepCache.set(th, prep(th)); return prepCache.get(th); };
  const cache = {};
  function contour(N) {
    const key = Math.round(N / 100);
    if (key in cache) return cache[key];
    const pts = [];
    for (let i = 0; i < 72; i++) {
      const P = prepOf(i * Math.PI / 36);
      let a = 0, b = 3, ra = evalP(P, a), rb = evalP(P, b);
      if (N < ra.N - 1 || N > rb.N + 1) { cache[key] = null; return null; }
      let fa = ra.N - N, fb = rb.N - N, side = 0, r = ra;
      for (let it = 0; it < 60; it++) {
        const c = Math.abs(fb - fa) > 1e-12 ? (a * fb - b * fa) / (fb - fa) : (a + b) / 2;
        r = evalP(P, c); const fc = r.N - N;
        if (Math.abs(fc) < 5 || b - a < 1e-9) break;
        if (fc * fb > 0) { b = c; fb = fc; if (side === -1) fa /= 2; side = -1; }
        else { a = c; fa = fc; if (side === 1) fb /= 2; side = 1; }
      }
      pts.push([r.My, r.Mz]);
    }
    cache[key] = pts; return pts;
  }
  function util(N, My, Mz) {
    const pts = contour(N);
    if (!pts) return { u: Infinity, MRd: 0 };
    const L = Math.hypot(My, Mz); if (L < 1) return { u: 0, MRd: 0 };
    const dx = My / L, dy = Mz / L;
    let best = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      const ex = bx - ax, ey = by - ay, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-12) continue;
      const s = (ax * ey - ay * ex) / den, t = (ax * dy - ay * dx) / den;
      if (s > 0 && t >= -1e-9 && t <= 1 + 1e-9) best = Math.min(best, s);
    }
    return { u: isFinite(best) ? L / best : Infinity, MRd: best };
  }
  return { contour, util };
}
// SGU: przekrój zarysowany przy zginaniu ukośnym z siłą osiową (beton nie przenosi rozciągania)
function elasticBiax(parts, bars, bw, Ec, Es, N, My, Mz) {
  const { fib, corners } = fiberize(parts, parts.length > 1 ? parts.length : 40, 16);
  const yc = grossProps(parts).yc;
  const bz = bars.map(b => ({ y: b.y, z: b.x - bw / 2, A: b.A }));
  let a = [0, 0, 0];
  const strain = (y, z) => a[0] + a[1] * (yc - y) - a[2] * z;
  const solve3 = (J, r) => {
    const M = J.map((row, i) => [...row, r[i]]);
    for (let c = 0; c < 3; c++) {
      let p = c; for (let i = c + 1; i < 3; i++) if (Math.abs(M[i][c]) > Math.abs(M[p][c])) p = i;
      [M[c], M[p]] = [M[p], M[c]]; if (Math.abs(M[c][c]) < 1e-30) return [0, 0, 0];
      for (let i = 0; i < 3; i++) if (i !== c) { const f = M[i][c] / M[c][c]; for (let j = c; j < 4; j++) M[i][j] -= f * M[c][j]; }
    }
    return [M[0][3] / M[0][0], M[1][3] / M[1][1], M[2][3] / M[2][2]];
  };
  let conv = false;
  for (let it = 0; it < 80; it++) {
    const J = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], F = [0, 0, 0];
    const add = (k, y, z, sg, A) => { const v = [1, yc - y, -z]; for (let i = 0; i < 3; i++) { F[i] += sg * A * v[i]; for (let j = 0; j < 3; j++) J[i][j] += k * A * v[i] * v[j]; } };
    for (const f of fib) { const e = strain(f.y, f.z); if (it === 0 || e > 0) add(Ec, f.y, f.z, it === 0 ? 0 : Ec * e, f.A); }
    for (const b of bz) { const e = strain(b.y, b.z); add(Es, b.y, b.z, Es * e, b.A); }
    const res = [N - F[0], My - F[1], Mz - F[2]];
    const d = solve3(J, res);
    a = [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
    if (it > 1 && Math.abs(d[0]) < 1e-10 && Math.abs(d[1]) < 1e-13 && Math.abs(d[2]) < 1e-13) { conv = true; break; }
  }
  let sc = 0, ss = 0, ssc = 0;
  for (const [y, z] of corners) { const e = strain(y, z); if (e > 0) sc = Math.max(sc, Ec * e); }
  for (const b of bz) { const e = strain(b.y, b.z); ss = Math.max(ss, -Es * e); ssc = Math.max(ssc, Es * e); }
  return { sc, ss, ssc, plane: a.slice(), conv, yc };
}

/* ------------------------------------------------- pełzanie (zał. B) */
function creepCalc(S, m, g) {
  const RH = clamp(S.sls.RH, 20, 100), t0 = Math.max(1, S.sls.t0), cem = S.sls.cem;
  const fcm = m.fcm, h0 = g.h0;
  const alpha = { S: -1, N: 0, R: 1 }[cem] ?? 0;
  const a1 = (35 / fcm) ** 0.7, a2 = (35 / fcm) ** 0.2;
  const phiRH = fcm <= 35 ? 1 + (1 - RH / 100) / (0.1 * Math.cbrt(h0)) : (1 + (1 - RH / 100) / (0.1 * Math.cbrt(h0)) * a1) * a2;
  const bfcm = 16.8 / Math.sqrt(fcm);
  const t0adj = Math.max(0.5, t0 * Math.pow(9 / (2 + Math.pow(t0, 1.2)) + 1, alpha));
  const bt0 = 1 / (0.1 + Math.pow(t0adj, 0.2));
  const phi0 = phiRH * bfcm * bt0;
  const phiCalc = phi0;                  // t = ∞ → β_c(∞, t0) = 1
  const phi = S.sls.phiSel === 'off' ? 0 : S.sls.phiSel === 'manual' ? Math.max(0, S.sls.phi) : phiCalc;
  return { RH, t0, cem, alpha, h0, a1, a2, phiRH, bfcm, t0adj, bt0, phi0, phiCalc, phi, sel: S.sls.phiSel };
}

/* ------------------------------------------------- statyka słupa (I rząd) */
// rozkład momentu M(x) = EI·w″ (x od podstawy, 0…L) od jednostkowych obciążeń w danym schemacie
function unitM(sch, kind, x, L) {
  const s = L - x;
  switch (kind) {
    case 'H':   // siła pozioma w głowicy (kierunek +)
      if (sch === 'cant') return [s, -1];
      if (sch === 'ffs') return [L / 2 - x, -1];
      return [0, 0];
    case 'q':   // obciążenie poziome równomierne na wysokości (kierunek +)
      if (sch === 'cant') return [s * s / 2, -s];
      if (sch === 'pp') return [-x * (L - x) / 2, -(L / 2 - x)];
      if (sch === 'fp') return [-(3 * L * s / 8 - s * s / 2), 3 * L / 8 - s];
      if (sch === 'ff') return [(L * L - 6 * L * x + 6 * x * x) / 12, (-6 * L + 12 * x) / 12];
      if (sch === 'ffs') return [s * s / 2 - L * L / 6, -s];
      return [0, 0];
    case 'Ma':  // moment przyłożony w głowicy (np. mimośród siły N), M(L) = +Ma
      if (sch === 'cant') return [1, 0];
      if (sch === 'pp') return [x / L, 1 / L];
      if (sch === 'fp') return [-0.5 + 1.5 * x / L, 1.5 / L];
      return [0, 0];
  }
  return [0, 0];
}
// rozkład od jednego obciążenia (wartości charakterystyczne, współczynnik 1): M[], V[] w obu kierunkach, N w głowicy
function itemDist(it, S, g) {
  const L = g.L, out = { Ntop: 0, sw: false, y: { M: new Float64Array(NPT + 1), V: new Float64Array(NPT + 1), tr: false }, z: { M: new Float64Array(NPT + 1), V: new Float64Array(NPT + 1), tr: false } };
  if (it.kind === 'sw') { out.sw = true; return out; }
  out.Ntop = it.N * 1e3;
  const map = { y: { H: it.Hh, q: it.qh, e: it.eh, Mt: it.Myt, Mb: it.Myb, V: it.Vy }, z: { H: it.Hb, q: it.qb, e: it.eb, Mt: it.Mzt, Mzb: 0, Mb: it.Mzb, V: it.Vz } };
  DIRS.forEach(d => {
    const q = map[d], sch = S.buck[d].sch, D = out[d];
    const H = (q.H || 0) * 1e3, qq = q.q || 0, Ma = out.Ntop * (q.e || 0), Mt = (q.Mt || 0) * 1e6, Mb = (q.Mb || 0) * 1e6;
    D.tr = Math.abs(H) > 0 && (sch === 'cant' || sch === 'ffs') || Math.abs(qq) > 0;
    for (let i = 0; i <= NPT; i++) {
      const x = XI[i] * L;
      const uH = unitM(sch, 'H', x, L), uq = unitM(sch, 'q', x, L), uM = unitM(sch, 'Ma', x, L);
      D.M[i] = H * uH[0] + qq * uq[0] + Ma * uM[0] + Mb + (Mt - Mb) * XI[i];
      D.V[i] = H * uH[1] + qq * uq[1] + Ma * uM[1] + (Mt - Mb) / L;
    }
    if (q.V !== undefined && q.V !== '' && q.V !== null && isFinite(+q.V)) D.Vgiven = Math.abs(+q.V) * 1e3;
  });
  return out;
}

/* ------------------------------------------------------ kombinacje */
function loadItems(S, g) {
  const Lo = S.loads, items = [];
  if (Lo.sw) items.push({ kind: 'sw', name: 'Ciężar własny słupa', id: 'G₀', perm: true, psi: null });
  if (Lo.mode === 'direct') {
    Lo.direct.filter(r => !r.off).forEach((r, i) => items.push(Object.assign({ kind: 'dir', id: 'K' + (i + 1), perm: false }, r, { name: r.name || `Kombinacja ${i + 1}`, eh: 0, eb: 0, Hh: 0, Hb: 0, qh: 0, qb: 0 })));
    return items;
  }
  let nG = 0, nQ = 0;
  Lo.items.forEach(it => { if (it.off) return; const perm = it.kind === 'perm'; items.push(Object.assign({}, it, { id: perm ? 'G' + (++nG) : 'Q' + (++nQ), perm, psi: perm ? null : psiOf(it) })); });
  return items;
}
function genCombos(items, Lo) {
  const nI = items.length, U = [], K = [], QP = [];
  const perm = items.map(it => it.perm);
  const mk = (fG, fQ) => { const f = new Float64Array(nI); items.forEach((it, i) => { f[i] = it.perm ? fG : (fQ[i] || 0); }); return f; };
  if (Lo.mode === 'direct') {
    items.forEach((it, i) => {
      if (it.kind !== 'dir') return;
      const f = new Float64Array(nI); f[i] = 1; items.forEach((q, j) => { if (q.kind === 'sw') f[j] = Lo.gG; });
      const fk = new Float64Array(nI), fq = new Float64Array(nI);
      fk[i] = Lo.rk; fq[i] = Lo.rqp; items.forEach((q, j) => { if (q.kind === 'sw') { fk[j] = 1; fq[j] = 1; } });
      U.push({ name: it.name, ref: 'wprost', f, fq, lead: i, desc: it.name });
      K.push({ name: 'char. ≈ ' + it.name, f: fk }); QP.push({ name: 'q-st. ≈ ' + it.name, f: fq });
    });
    return { U, K, QP, capped: false };
  }
  const vars = items.map((it, i) => it.perm ? null : i).filter(i => i !== null);
  // stany obciążeń zmiennych: 0 – brak, +1, −1 (obciążenia działające w obu kierunkach)
  const states = vars.map(i => items[i].pm ? [0, 1, -1] : [0, 1]);
  let total = states.reduce((a, s) => a * s.length, 1);
  const capped = total > 729;
  const subsets = [];
  if (!capped) {
    const idx = new Array(vars.length).fill(0);
    for (let t = 0; t < total; t++) {
      let r = t; const st = vars.map((_, k) => { const n = states[k].length; const v = states[k][r % n]; r = Math.floor(r / n); return v; });
      subsets.push(st);
    }
  } else {
    // zbyt wiele kombinacji – wszystkie obciążenia zmienne obecne, wiatr ± (uproszczenie)
    const pmIdx = vars.map((i, k) => items[i].pm ? k : -1).filter(k => k >= 0);
    for (let t = 0; t < (1 << pmIdx.length); t++) subsets.push(vars.map((i, k) => { const p = pmIdx.indexOf(k); return p < 0 ? 1 : ((t >> p) & 1 ? -1 : 1); }));
  }
  const isH = i => items[i].kind === 'imp' && items[i].cat === 'H', isSW = i => items[i].kind === 'snow' || items[i].kind === 'wind';
  const seen = new Set();
  const push = (arr, c) => { const k = c.ref + '|' + Array.from(c.f).map(v => v.toFixed(4)).join(','); if (seen.has(k)) return; seen.add(k); arr.push(c); };
  const nm = (st, lead) => vars.map((i, k) => st[k] ? `${st[k] < 0 ? '−' : ''}${items[i].id}${i === lead ? '*' : ''}` : '').filter(Boolean).join(', ');
  const gGs = [[Lo.gG, 'sup'], [Lo.gGinf, 'inf']];
  subsets.forEach(st => {
    const pres = vars.filter((i, k) => st[k] !== 0);
    if (pres.some(isH) && pres.some(isSW)) return;          // dach kat. H nie łączy się ze śniegiem / wiatrem
    const fq = new Float64Array(nI); items.forEach((it, i) => { if (it.perm) fq[i] = 1; });
    vars.forEach((i, k) => { if (st[k]) fq[i] = st[k] * items[i].psi.p2; });
    const sgn = i => st[vars.indexOf(i)];
    gGs.forEach(([gg, gl]) => {
      if (Lo.comb === '610') {
        if (!pres.length) push(U, { name: `6.10 – G${gl === 'inf' ? ' (γ_G,inf)' : ''}`, ref: '6.10', f: mk(gg, {}), fq, lead: null, gl });
        pres.forEach(j => { const fQ = {}; pres.forEach(i => fQ[i] = sgn(i) * Lo.gQ * (i === j ? 1 : items[i].psi.p0)); push(U, { name: `6.10 – ${nm(st, j)}${gl === 'inf' ? ', γ_G,inf' : ''}`, ref: '6.10', f: mk(gg, fQ), fq, lead: j, gl }); });
      } else {
        { const fQ = {}; pres.forEach(i => fQ[i] = sgn(i) * Lo.gQ * items[i].psi.p0); push(U, { name: `6.10a${pres.length ? ' – ' + nm(st, null) : ''}${gl === 'inf' ? ', γ_G,inf' : ''}`, ref: '6.10a', f: mk(gg, fQ), fq, lead: null, gl }); }
        const g2 = gl === 'inf' ? gg : Lo.xi * gg;
        if (!pres.length) push(U, { name: `6.10b${gl === 'inf' ? ', γ_G,inf' : ''}`, ref: '6.10b', f: mk(g2, {}), fq, lead: null, gl });
        pres.forEach(j => { const fQ = {}; pres.forEach(i => fQ[i] = sgn(i) * Lo.gQ * (i === j ? 1 : items[i].psi.p0)); push(U, { name: `6.10b – ${nm(st, j)}${gl === 'inf' ? ', γ_G,inf' : ''}`, ref: '6.10b', f: mk(g2, fQ), fq, lead: j, gl }); });
      }
    });
    // SGU: charakterystyczna (6.14b) i quasi-stała (6.16b)
    if (!pres.length) { push(K, { name: 'char. – G', ref: '6.14b', f: mk(1, {}) }); push(QP, { name: 'q-st. – G', ref: '6.16b', f: mk(1, {}) }); }
    pres.forEach(j => { const fQ = {}; pres.forEach(i => fQ[i] = sgn(i) * (i === j ? 1 : items[i].psi.p0)); push(K, { name: `char. – ${nm(st, j)}`, ref: '6.14b', f: mk(1, fQ) }); });
    if (pres.length) { const fQ = {}; pres.forEach(i => fQ[i] = sgn(i) * items[i].psi.p2); push(QP, { name: `q-st. – ${nm(st, null)}`, ref: '6.16b', f: mk(1, fQ) }); }
  });
  return { U, K, QP, capped, total };
}
function comboDesc(c, items) {
  const ff = v => (Math.round(v * 1000) / 1000).toString().replace('.', ',');
  const parts = [];
  items.forEach((it, i) => { const v = c.f[i]; if (!v) return; parts.push(`${parts.length ? (v < 0 ? ' − ' : ' + ') : (v < 0 ? '−' : '')}${ff(Math.abs(v))}·${it.id}`); });
  return parts.join('') || '0';
}
// siły I rzędu dla wektora współczynników f
function superpose(dists, items, f, g) {
  const L = g.L, r = { Ntop: 0, Nbot: 0, Nmid: 0, y: { M: new Float64Array(NPT + 1), V: new Float64Array(NPT + 1), tr: false, Vg: 0 }, z: { M: new Float64Array(NPT + 1), V: new Float64Array(NPT + 1), tr: false, Vg: 0 }, swF: 0 };
  for (let k = 0; k < items.length; k++) {
    const a = f[k]; if (!a) continue;
    const d = dists[k];
    if (d.sw) { r.swF = a; continue; }
    r.Ntop += a * d.Ntop;
    DIRS.forEach(dd => { const A = r[dd], B = d[dd]; for (let i = 0; i <= NPT; i++) { A.M[i] += a * B.M[i]; A.V[i] += a * B.V[i]; } if (B.tr) A.tr = true; if (B.Vgiven) A.Vg += Math.abs(a) * B.Vgiven; });
  }
  r.Nbot = r.Ntop + r.swF * g.selfW * L;
  r.Nmid = r.Ntop + r.swF * g.selfW * L / 2;
  r.Nat = xi => r.Ntop + r.swF * g.selfW * L * (1 - xi);
  return r;
}

/* ------------------------------------- długość wyboczeniowa i smukłość */
function bucklingDir(S, g, dir) {
  const q = S.buck[dir], sc = SCH[q.sch], L = g.L, gd = g.dir[dir];
  const b = { dir, sch: q.sch, schName: sc.name, braced: sc.braced, mode: q.mode, L, i: gd.i };
  if (q.mode === 'beta') { b.beta = Math.max(0.3, q.beta); b.l0 = b.beta * L; }
  else if (q.mode === 'l0') { b.l0 = Math.max(100, num(q.l0, L / 1000) * 1000); b.beta = b.l0 / L; }
  else if (q.mode === 'k') {
    const k1 = Math.max(q.k1, 0.1), k2 = Math.max(q.k2, 0.1);
    b.k1 = k1; b.k2 = k2; b.k1in = q.k1; b.k2in = q.k2;
    if (sc.braced) { b.l0 = 0.5 * L * Math.sqrt((1 + k1 / (0.45 + k1)) * (1 + k2 / (0.45 + k2))); b.eqn = '5.15'; }
    else { const a = Math.sqrt(1 + 10 * k1 * k2 / (k1 + k2)), c = (1 + k1 / (1 + k1)) * (1 + k2 / (1 + k2)); b.la = a; b.lc = c; b.l0 = L * Math.max(a, c); b.eqn = '5.16'; }
    b.beta = b.l0 / L;
  } else { b.beta = sc.beta; b.l0 = sc.beta * L; }
  b.lam = b.l0 / gd.i;
  return b;
}
// imperfekcje (5.2): θ_i = θ_0·α_h·α_m, e_i = θ_i·l_0/2
function imperfection(S, g, B) {
  const lm = g.L / 1000, ah = clamp(2 / Math.sqrt(lm), 2 / 3, 1), am = Math.sqrt(0.5 * (1 + 1 / 1));
  const th = (1 / 200) * ah * am;
  const o = { th0: 1 / 200, ah, am, m: 1, th, mode: S.sec2.imp };
  DIRS.forEach(d => {
    const l0 = B[d].l0;
    if (S.sec2.imp === 'l400') o[d] = l0 / 400;
    else if (S.sec2.imp === 'manual') o[d] = Math.max(0, num(S.sec2.ei, 0));
    else o[d] = th * l0 / 2;
  });
  return o;
}
// kształt rozkładu momentu II rzędu na wysokości (ξ od podstawy), znormalizowany do 1 w przekroju krytycznym
function m2Shape(sch, braced, xi) {
  if (sch === 'cant') return Math.cos(Math.PI * xi / 2);
  if (sch === 'ffs' || !braced) return Math.abs(Math.cos(Math.PI * xi));
  if (sch === 'ff') return Math.max(0, Math.sin(Math.PI * xi));
  if (sch === 'fp') { const k = 4.4934, f = t => Math.sin(k * t) - k * t + k * (1 - Math.cos(k * t)); let mx = 0; for (let i = 0; i <= 40; i++) mx = Math.max(mx, Math.abs(f(i / 40))); return Math.abs(f(xi)) / mx; }
  return Math.sin(Math.PI * xi);
}

/* ------------------------------------- efekty II rzędu w jednym kierunku */
// D – dane kierunku: {B, ei, e0, U (krzywe), g, m, phiInf, dEff, Is, Ic, omega, As, Ac}
function evalDir(D, S, fr, frq, opts) {
  const m = D.m, g = D.g, B = D.B, L = g.L, dir = D.dir;
  const M0 = fr[dir].M, V0 = fr[dir].V;
  const n = NPT, Mt = M0[n], Mb = M0[0];
  const NE = B.braced ? fr.Nmid : fr.Nbot;
  const NEd = Math.max(0, NE);
  // kierunek najbardziej niekorzystny (znak momentu o największej wartości)
  let iMax = 0; for (let i = 0; i <= n; i++) if (Math.abs(M0[i]) > Math.abs(M0[iMax])) iMax = i;
  const sg = M0[iMax] < 0 ? -1 : 1;
  const topBig = Math.abs(Mt) >= Math.abs(Mb);
  const M02s = topBig ? Mt : Mb, M01s = topBig ? Mb : Mt;
  const sEnd = M02s < 0 ? -1 : M02s > 0 ? 1 : sg;
  const M02 = Math.abs(M02s), M01 = M01s * sEnd;
  // obciążenie poprzeczne – odchyłka od rozkładu liniowego
  let dev = 0, mx = 0; for (let i = 0; i <= n; i++) { dev = Math.max(dev, Math.abs(M0[i] - (Mb + (Mt - Mb) * XI[i]))); mx = Math.max(mx, Math.abs(M0[i])); }
  const tr = fr[dir].tr && dev > 0.005 * mx + 1e3;
  const ei = D.ei, e0 = D.e0;
  const r = { dir, NEd, Ntop: fr.Ntop, Nbot: fr.Nbot, Nmid: fr.Nmid, Mt, Mb, M01, M02, sg, sEnd, tr, ei, e0, braced: B.braced, sch: B.sch, l0: B.l0, lam: B.lam };
  r.Mi = NEd * ei;
  r.M02i = M02 + NEd * ei; r.M01i = M01 + NEd * ei;
  r.M0e = Math.max(0.6 * r.M02i + 0.4 * r.M01i, 0.4 * r.M02i);
  let Mint = 0; for (let i = 0; i <= n; i++) if (XI[i] >= 0.15 - 1e-9 && XI[i] <= 0.85 + 1e-9) Mint = Math.max(Mint, Math.abs(M0[i]));
  r.Mint = Mint;
  if (B.braced) r.M0Ed = tr ? Math.max(r.M0e, Mint + NEd * ei) : r.M0e;
  else r.M0Ed = Math.max(Math.abs(Mb), B.sch === 'cant' ? 0 : Math.abs(Mt)) + NEd * ei;
  // pełzanie efektywne (5.19): φ_ef = φ(∞,t0)·M0Eqp/M0Ed
  if (D.direct) { r.rqp = S.loads.rqp; }
  else if (frq) {
    const Mq = frq[dir].M, Nq = B.braced ? frq.Nmid : frq.Nbot;
    const qa = topBig ? Mq[n] : Mq[0], qb = topBig ? Mq[0] : Mq[n], sq = qa < 0 ? -1 : 1;
    const q2 = Math.abs(qa), q1 = qb * sq;
    let qint = 0; for (let i = 0; i <= n; i++) if (XI[i] >= 0.15 && XI[i] <= 0.85) qint = Math.max(qint, Math.abs(Mq[i]));
    const q2i = q2 + Math.max(0, Nq) * ei, q1i = q1 + Math.max(0, Nq) * ei;
    let Mqp = B.braced ? Math.max(0.6 * q2i + 0.4 * q1i, 0.4 * q2i) : Math.max(Math.abs(Mq[0]), B.sch === 'cant' ? 0 : Math.abs(Mq[n])) + Math.max(0, Nq) * ei;
    if (B.braced && tr) Mqp = Math.max(Mqp, qint + Math.max(0, Nq) * ei);
    r.M0Eqp = Mqp; r.Nqp = Nq;
    r.rqp = r.M0Ed > 1e3 ? Mqp / r.M0Ed : (NEd > 0 ? Nq / NEd : 0);
  } else r.rqp = 0;
  r.rqp = clamp(r.rqp, 0, 2);
  r.phiEf = D.phiInf * r.rqp;
  r.creepIgn = false;
  if (S.sec2.creep === 'ignore' && D.phiInf <= 2 && B.lam <= 75 && NEd > 0 && r.M0Ed / NEd >= g.dir[dir].depth) { r.phiEf = 0; r.creepIgn = true; }
  // smukłość graniczna (5.13N)
  r.n = NEd / (g.Ac * m.fcd);
  r.omega = D.omega;
  r.A = 1 / (1 + 0.2 * r.phiEf);
  r.Bc = Math.sqrt(1 + 2 * r.omega);
  const M01n = M01, M02n = M02;
  r.rm = M02n > 1e3 ? M01n / M02n : 1;
  r.Cmode = !B.braced ? 'unbraced' : tr ? 'transverse' : (M02n < NEd * ei ? 'imp' : 'ends');
  r.C = r.Cmode === 'ends' ? 1.7 - r.rm : 0.7;
  r.lamLim = r.n > 1e-6 ? 20 * r.A * r.Bc * r.C / Math.sqrt(r.n) : Infinity;
  r.slender = B.lam > r.lamLim && NEd > 0;
  // metoda
  r.method = S.sec2.method;
  r.M2 = 0;
  const dEff = D.dEff;
  if (r.slender) {
    if (r.method === 'ns') {
      const k1 = Math.sqrt(m.fck / 20), k2 = Math.min(0.20, r.n * B.lam / 170);
      const rho = D.As / g.Ac;
      let Kc, Ks;
      if (S.sec2.nsVar === 'simple' && rho >= 0.01) { Ks = 0; Kc = 0.3 / (1 + 0.5 * r.phiEf); r.nsEq = '5.26'; }
      else { Ks = 1; Kc = k1 * k2 / (1 + r.phiEf); r.nsEq = '5.22'; }
      const EI = Kc * m.Ecd * D.Ic + Ks * m.Es * D.Is;
      const NB = Math.PI * Math.PI * EI / (B.l0 * B.l0);
      let beta = 1, c0 = null;
      if (B.braced && !tr) { c0 = 8; beta = Math.PI * Math.PI / 8; }
      Object.assign(r, { k1, k2, Kc, Ks, rho, EI, NB, beta, c0 });
      if (NEd >= NB) { r.unstable = true; r.amp = Infinity; r.M2 = Infinity; }
      else { r.amp = 1 + beta / (NB / NEd - 1); r.M2 = r.M0Ed * (r.amp - 1); }
    } else {
      // metoda nominalnej krzywizny (5.8.8); metoda ogólna liczona osobno (słup modelowy)
      const nu = 1 + r.omega, nbal = 0.4;
      const Kr = clamp((nu - r.n) / (nu - nbal), 0, 1);
      const beta = 0.35 + m.fck / 200 - B.lam / 150;
      const Kphi = Math.max(1, 1 + beta * r.phiEf);
      const r0 = m.eyd / (0.45 * dEff);
      const c = +S.sec2.c === 9.87 ? Math.PI * Math.PI : +S.sec2.c;
      const curv = Kr * Kphi * r0;
      const e2 = curv * B.l0 * B.l0 / c;
      Object.assign(r, { nu, nbal, Kr, betaPhi: beta, Kphi, r0, c, curv, e2, d: dEff });
      r.M2 = NEd * e2;
    }
    if (r.method === 'gen' && D.gen) {
      const G = D.gen(r, fr);
      r.gen = G;
      if (G) { if (G.unstable) { r.unstable = true; r.M2 = Infinity; } else r.M2 = Math.max(0, G.M2); }
    }
  }
  // przekroje: podstawa (0), środek (krytyczny wewnętrzny), głowica (1)
  const M2 = r.M2;
  const sec = (key, xi, N, Mfirst, add2) => {
    const Mwith = Math.abs(Mfirst) + Math.max(0, N) * ei + add2;
    const Mmin = S.sec2.e0 ? Math.max(0, N) * e0 : 0;
    return { key, xi, N, M0: Mfirst, Mimp: Math.max(0, N) * ei, M2: add2, M: Math.max(Mwith, Mmin), Mn: Math.abs(Mfirst) + add2, e0gov: Mmin > Mwith, sg: Mfirst !== 0 ? Math.sign(Mfirst) : sg };
  };
  if (B.braced) {
    const Mmid = Math.max(r.M0Ed + M2, r.M01i + 0.5 * M2);
    const mid = { key: 'mid', xi: 0.5, N: fr.Nmid, M0: r.M0Ed - NEd * ei, Mimp: NEd * ei, M2, sg: tr ? sg : sEnd };
    mid.M = Math.max(Mmid, S.sec2.e0 ? Math.max(0, fr.Nmid) * e0 : 0); mid.Mn = Math.max(Mmid - NEd * ei, 0); mid.e0gov = mid.M > Mmid + 1;
    mid.mOpt = r.M01i + 0.5 * M2 > r.M0Ed + M2 ? 'M01+0,5M2' : 'M0Ed+M2';
    r.secs = [sec('base', 0, fr.Nbot, Mb, 0), mid, sec('top', 1, fr.Ntop, Mt, 0)];
  } else {
    const sh = x => m2Shape(B.sch, false, x);
    const Mm = M0[n / 2];
    r.secs = [sec('base', 0, fr.Nbot, Mb, isFinite(M2) ? M2 * sh(0) : Infinity), sec('mid', 0.5, fr.Nmid, Mm, isFinite(M2) ? M2 * sh(0.5) : Infinity), sec('top', 1, fr.Ntop, Mt, isFinite(M2) ? M2 * sh(1) : Infinity)];
  }
  r.MEd = Math.max(...r.secs.map(s => s.M));
  // nośność przekrojów (jednokierunkowo, przy N w przekroju)
  r.secs.forEach(s => {
    const sgn = s.sg || 1;
    const MR = D.U.MRd(s.N, sgn);
    s.MRd = MR; s.u = MR === null ? Infinity : (s.M <= 1 ? 0 : (MR > 0 ? s.M / MR : Infinity));
    if (s.N > D.U.Nmax) s.u = Infinity;
  });
  r.gov = r.secs.reduce((a, s) => (s.u > a.u ? s : a));
  r.u = r.gov.u;
  // ścinanie: V_Ed = max|V0| (+ π·M₂/l₀)
  let Vm = 0; for (let i = 0; i <= n; i++) Vm = Math.max(Vm, Math.abs(V0[i]));
  if (fr[dir].Vg) Vm = Math.max(Vm, fr[dir].Vg);
  r.V0 = Vm; r.V2 = S.sec2.V2 && isFinite(M2) ? Math.PI * M2 / B.l0 : 0; r.VEd = Vm + r.V2;
  return r;
}

/* ------------------------------ metoda ogólna (5.8.6) – słup modelowy */
// zależność M–κ przy stałej sile N: beton wg 3.1.5 z f_cd i E_cd, odkształcenia ×(1 + φ_ef), stal dwuliniowa f_yd
function mkCurve(parts, h, bars, m, N, phiEf) {
  const yc = grossProps(parts).yc, k = 1.05 * m.Ecd * m.ec1 / m.fcd, cr = 1 + phiEf;
  const ecLim = m.ecu1 * cr;
  const sigC = e => { if (e <= 0) return 0; const ee = e / cr; if (ee > m.ecu1) return 0; const eta = ee / m.ec1; return Math.max(0, m.fcd * (k * eta - eta * eta) / (1 + (k - 2) * eta)); };
  const strips = []; parts.forEach(p => { const ns = Math.max(3, Math.round(80 * (p.y1 - p.y0) / h)), dy = (p.y1 - p.y0) / ns; for (let i = 0; i < ns; i++) strips.push({ y: p.y0 + (i + 0.5) * dy, A: p.b * dy }); });
  const force = (e0, kap) => { let F = 0, Mm = 0; for (const s of strips) { const e = e0 + kap * (yc - s.y); const sc = sigC(e); if (sc) { F += sc * s.A; Mm += sc * s.A * (yc - s.y); } } for (const b of bars) { const e = e0 + kap * (yc - b.y); const ss = clamp(m.Es * e, -m.fyd, m.fyd) - sigC(e); F += ss * b.A; Mm += ss * b.A * (yc - b.y); } return [F, Mm]; };
  const solve = kap => { let lo = -0.02, hi = ecLim; for (let i = 0; i < 70; i++) { const mid = (lo + hi) / 2; if (force(mid, kap)[0] < N) lo = mid; else hi = mid; } const e0 = (lo + hi) / 2; const [F, Mm] = force(e0, kap); return { e0, F, M: Mm, ok: Math.abs(F - N) < Math.max(50, 1e-4 * Math.abs(N)) }; };
  const pts = [[0, 0]];
  const kMax = 0.06 / h;
  let prev = 0, peak = 0, kPeak = 0;
  for (let i = 1; i <= 160; i++) {
    const kap = kMax * Math.pow(i / 160, 1.6);
    const s = solve(kap);
    if (!s.ok) break;
    const eTop = s.e0 + kap * yc; if (eTop > ecLim) break;
    if (s.M < prev - 1e-6) { pts.push([kap, s.M]); break; }
    pts.push([kap, s.M]); prev = s.M; if (s.M > peak) { peak = s.M; kPeak = kap; }
  }
  return { pts, Mmax: peak, kPeak };
}
function makeGen(D) {
  const g = D.g, m = D.m, B = D.B, dir = D.dir;
  const parts = g.parts[dir], h = g.dir[dir].depth, bars = D.bars;
  const cache = new Map();
  return (r) => {
    const N = r.NEd; if (!(N > 0)) return { M2: 0 };
    const key = Math.round(N / 2000) + '|' + r.phiEf.toFixed(2);
    let C = cache.get(key); if (!C) { C = mkCurve(parts, h, bars, m, N, r.phiEf); cache.set(key, C); }
    const pts = C.pts; if (pts.length < 3) return { unstable: true, note: 'brak równowagi przekroju przy N_Ed' };
    const kapOf = M => { if (M >= C.Mmax) return null; for (let i = 1; i < pts.length; i++) if (pts[i][1] >= M) { const [k0, m0] = pts[i - 1], [k1, m1] = pts[i]; return k0 + (k1 - k0) * (M - m0) / (m1 - m0); } return null; };
    // słup modelowy: usztywniony – pręt przegubowy o długości l₀ z momentami M01, M02 i łukiem wstępnym e_i;
    // nieusztywniony – wspornik o długości l₀/2 z momentem M0Ed u podstawy i pochyleniem θ_i
    const nS = 40, braced = B.braced;
    const Lm = braced ? B.l0 : B.l0 / 2;
    const xs = Array.from({ length: nS + 1 }, (_, i) => i * Lm / nS);
    const M01 = r.M01, M02 = r.M02, ei = r.ei;
    const M0 = xs.map(x => braced ? (r.tr ? Math.max(r.Mint, M02) * Math.sin(Math.PI * x / Lm) + 0 : M01 + (M02 - M01) * x / Lm) : (r.M0Ed - N * ei));
    const y0 = xs.map(x => braced ? ei * Math.sin(Math.PI * x / Lm) : ei * x / Lm);
    let y = new Float64Array(nS + 1), Mx = new Float64Array(nS + 1);
    for (let it = 0; it < 200; it++) {
      for (let i = 0; i <= nS; i++) Mx[i] = braced ? M0[i] + N * (y0[i] + y[i]) : M0[i] + N * ((y0[nS] + y[nS]) - (y0[i] + y[i]));
      const kap = new Float64Array(nS + 1);
      for (let i = 0; i <= nS; i++) { const kk = kapOf(Math.abs(Mx[i])); if (kk === null) return { unstable: true, Mmax: C.Mmax, note: 'moment przekracza maksimum zależności M–κ (utrata stateczności lub nośności)' }; kap[i] = kk * Math.sign(Mx[i] || 1); }
      // całkowanie krzywizny (y″ = κ – ugięcie w kierunku momentu)
      const yn = new Float64Array(nS + 1), dx = Lm / nS;
      if (braced) { const t = new Float64Array(nS + 1); for (let i = 1; i <= nS; i++) t[i] = t[i - 1] + (kap[i - 1] + kap[i]) / 2 * dx; const w = new Float64Array(nS + 1); for (let i = 1; i <= nS; i++) w[i] = w[i - 1] + (t[i - 1] + t[i]) / 2 * dx; for (let i = 0; i <= nS; i++) yn[i] = -(w[i] - w[nS] * i / nS); }
      else { const t = new Float64Array(nS + 1); for (let i = 1; i <= nS; i++) t[i] = t[i - 1] + (kap[i - 1] + kap[i]) / 2 * dx; for (let i = 1; i <= nS; i++) yn[i] = yn[i - 1] + (t[i - 1] + t[i]) / 2 * dx; }
      let dmax = 0; for (let i = 0; i <= nS; i++) { dmax = Math.max(dmax, Math.abs(yn[i] - y[i])); y[i] = 0.5 * y[i] + 0.5 * yn[i]; }
      if (dmax < 0.02 && it > 3) break;
      if (it === 199) return { unstable: true, Mmax: C.Mmax, note: 'brak zbieżności iteracji (utrata stateczności)' };
    }
    let Mmax = 0; for (let i = 0; i <= nS; i++) Mmax = Math.max(Mmax, Math.abs(Mx[i]));
    const M0max = braced ? r.M0Ed : r.M0Ed;
    const ymax = braced ? Math.max(...Array.from(y).map(Math.abs)) : Math.abs(y[nS]);
    return { M2: Math.max(0, Mmax - M0max), Mtot: Mmax, ymax, Lm, Mmax: C.Mmax, curve: pts };
  };
}

/* ------------------------------------------------ odporność ogniowa (metoda A) */
function fireCalc(S, g, m, lay, R) {
  const F = S.fire;
  if (F.R === '-' || !lay.n) return null;
  const tab = FIRE_COL[F.R];
  const b = g.circ ? g.D : g.dmin, a = lay.a;
  const NEdMax = R.NEdMax;
  const NEdFi = F.eta * NEdMax;
  const uAx = R.radUtil || 1;
  const muAuto = clamp(F.eta * uAx, 0.05, 1);
  const mu = F.muSel === 'manual' ? F.mu : muAuto;
  const o = { R: F.R, Rreq: FIRE_MIN[F.R], b, a, eta: F.eta, NEdFi, mu, muAuto, uAx, side: F.side };
  // wymagane a dla danego b w kolumnie tablicy
  const aReqCol = list => { if (!list || !list.length) return null; if (b < list[0][0] - 1e-6) return null; let ar = list[0][1], need8 = !!list[0][2]; for (let i = 1; i < list.length; i++) { if (b >= list[i][0]) { ar = list[i][1]; need8 = !!list[i][2]; } else { const [b0, a0] = list[i - 1], [b1, a1] = list[i]; ar = a0 + (a1 - a0) * (b - b0) / (b1 - b0); need8 = !!list[i][2] || !!list[i - 1][2]; break; } } return { a: ar, need8 }; };
  if (F.side === 'one') {
    const [bmin, amin] = tab[3]; o.bmin = bmin; o.amin = amin; o.tabOk = b >= bmin && a >= amin - 1e-6;
  } else {
    const cols = [0.2, 0.5, 0.7].map((u, i) => ({ u, r: aReqCol(tab[i]) }));
    let r;
    if (mu <= 0.2) r = cols[0].r;
    else if (mu > 0.7 + 1e-9) r = null;
    else { const j = mu <= 0.5 ? 0 : 1; const A = cols[j], Bc = cols[j + 1]; if (A.r && Bc.r) { const t = (mu - A.u) / (Bc.u - A.u); r = { a: A.r.a + t * (Bc.r.a - A.r.a), need8: A.r.need8 || Bc.r.need8 }; } else r = Bc.r && mu >= Bc.u - 1e-9 ? Bc.r : null; }
    o.aReq = r ? r.a : null; o.need8 = r ? r.need8 : false;
    o.bmin = (() => { const j = mu <= 0.2 ? 0 : mu <= 0.5 ? 1 : 2; return tab[j] && tab[j].length ? tab[j][0][0] : null; })();
    o.tabOk = !!r && a >= r.a - 1e-6 && (!r.need8 || lay.n >= 8);
  }
  // warunki stosowania metody A
  const l0fi = F.l0fiK * g.L;
  o.l0fi = l0fi;
  o.emax = S.coef.eMaxFi * (g.circ ? g.D : g.dmin);
  o.e = R.e0fi || 0;
  o.rho = lay.As / g.Ac;
  o.condL = l0fi <= 3000 + 1e-6; o.condE = o.e <= o.emax + 1e-6; o.condA = lay.As < 0.04 * g.Ac;
  // wzór (5.7)
  const omega = lay.As * m.fyd / (g.Ac * m.fcd);
  const bp = g.circ ? g.D : 2 * g.Ac / (g.b + g.h);
  const Reta = 83 * (1 - mu * (1 + omega) / (0.85 / m.acc + omega));
  const Ra = 1.60 * (clamp(a, 25, 80) - 30);
  const Rl = 9.60 * (5 - clamp(l0fi / 1000, 2, 6));
  const Rb = 0.09 * clamp(bp, 200, 450);
  const Rn = lay.n > 4 ? 12 : 0;
  const sum = Reta + Ra + Rl + Rb + Rn;
  const Rcalc = sum > 0 ? 120 * Math.pow(sum / 120, 1.8) : 0;
  Object.assign(o, { omega, bp, Reta, Ra, Rl, Rb, Rn, Rcalc, formOk: Rcalc >= o.Rreq, formValid: a >= 25 && a <= 80 && bp >= 200 && bp <= 450 && l0fi <= 6000 && (g.circ || g.dmax <= 1.5 * g.dmin) });
  o.ok = o.condE && o.condA && ((o.condL && o.tabOk) || (o.formValid && o.formOk));
  return o;
}

/* ------------------------------------------------ zakotwienia i zakłady */
function anchCalc(S, m, lay, cov, tension) {
  const dia = lay.dmax, eta2 = dia <= 32 ? 1 : (132 - dia) / 100, eta1 = 1.0;
  const fbd = 2.25 * eta1 * eta2 * m.fctdBond;
  const sigma = m.fyd;
  const lbrqd = dia / 4 * sigma / fbd;
  const a6 = S.det.lap === '50' ? 1.4 : 1.5;
  // ściskanie: α1…α5 = 1
  const l0minC = Math.max(0.3 * a6 * lbrqd, 15 * dia, 200);
  const l0C = Math.max(a6 * lbrqd, l0minC);
  // rozciąganie: α1 = 1 (pręt prosty), α2 = 1 (bezpiecznie), α3 = α5 = 1
  const l0T = Math.max(a6 * lbrqd, l0minC);
  const l0 = ceilTo(tension ? Math.max(l0T, l0C) : l0C, 10);
  const lbminC = Math.max(0.6 * lbrqd, 10 * dia, 100);
  const lbdC = Math.max(lbrqd, lbminC);
  const lbminT = Math.max(0.3 * lbrqd, 10 * dia, 100);
  const cd = Math.min(cov.cnom + lay.dt, 50);
  const al1 = cd > 3 * dia ? 0.7 : 1.0;
  const lbdT = Math.max(al1 * lbrqd, lbminT);
  const lbd = Math.max(lbdC, tension ? lbdT : 0);
  return { dia, eta1, eta2, fbd, sigma, lbrqd, a6, l0minC, l0C, l0T, l0, tension, lbminC, lbdC, lbminT, al1, lbdT, lbd, cd };
}

/* ----------------------------------------------- strzemiona i zestawienie stali */
function tiesCalc(S, g, lay, anch, sh) {
  const dt = lay.dt, dminL = lay.dmin, dmaxL = lay.dmax;
  const dtReq = Math.max(6, dmaxL / 4);
  const scl = Math.min(20 * dminL, g.dmin, 400);
  const sclRed = 0.6 * scl;
  let sAuto = floorTo(scl, 25); if (sAuto < 100) sAuto = floorTo(scl, 10);
  let sShear = sh && sh.sMaxShear ? sh.sMaxShear : Infinity;
  const sMan = S.stir.s === 'auto' ? null : S.stir.s;
  let s = sMan !== null ? sMan : Math.min(sAuto, sShear >= 1e9 ? Infinity : floorTo(sShear, 10));
  s = Math.max(50, s);
  let sRed = floorTo(Math.min(sclRed, s), sclRed < 100 ? 10 : 25); if (sRed < 50) sRed = floorTo(sclRed, 5);
  sRed = Math.max(40, Math.min(sRed, s));
  const L = g.L;
  const zB0 = g.dmax;                                       // strefa przy stropie / fundamencie (9.5.3(4))
  const lapZone = dmaxL > 14 ? anch.l0 + 4 * dmaxL : 0;     // strefa zakładu (9.5.3(4), 8.7.4.2(4))
  const zBot = Math.min(L, Math.max(zB0, lapZone)), zTop = Math.min(L - zBot, zB0);
  const zMid = Math.max(0, L - zBot - zTop);
  const first = 50;
  const pos = [];
  const fill = (a, b, sp) => { const n = Math.max(1, Math.ceil((b - a) / sp - 1e-9)); for (let i = 0; i <= n; i++) pos.push(a + (b - a) * i / n); return (b - a) / n; };
  const pB = fill(first, Math.max(first + 1, zBot), sRed);
  let pM = null; if (zMid > 1) pM = fill(zBot, L - zTop, s);
  const pT = fill(L - zTop, L - first, sRed);
  const P = Array.from(new Set(pos.map(v => Math.round(v)))).sort((a, b) => a - b);
  const sets = P.length;
  // długości
  const c = S.env.cnomSel === 'manual' ? num(S.env.cnomVal, 30) : null;
  return { dt, dtReq, scl, sclRed, sAuto, sShear, sMan, s, sRed, zBot, zTop, zMid, lapZone, zB0, pos: P, sets, pB, pM, pT, cman: c };
}
function schedule(S, g, lay, cov, anch, ties) {
  const rows = [], dt = lay.dt, c = cov.cnom;
  const hook = Math.max(10 * dt, 75);                       // hak 135°: ≥ max(5⌀; 50) – przyjęto max(10⌀; 75 mm) jak w praktyce wykonawczej
  const hookMin = S.stir.hookA === 90 ? Math.max(10 * dt, 70) : Math.max(5 * dt, 50);
  const L = g.L, top = S.det.top, base = S.det.base;
  const groups = {}; lay.bars.forEach(b => { groups[b.d] = (groups[b.d] || 0) + 1; });
  const dias = Object.keys(groups).map(Number).sort((a, b) => b - a);
  let pos = 0;
  const bendLeg = d => Math.max(12 * d, 150);
  dias.forEach(d => {
    const n = groups[d];
    const lTopStraight = top === 'cont' ? S.det.hTop + anch.l0 : S.det.hTop - c - dt - d;
    const straight = L + lTopStraight;
    const leg = top === 'anch' ? ceilTo(Math.max(bendLeg(d), anch.lbd - (S.det.hTop - c)), 10) : 0;
    rows.push({ pos: ++pos, kind: 'main', name: 'Pręty podłużne słupa', d, n, len: ceilTo(straight + leg, 10), straight: ceilTo(straight, 10), leg, shape: top === 'anch' ? 'L' : 'I' });
  });
  if (base === 'found') dias.forEach(d => {
    const n = groups[d];
    const inF = S.det.hF - S.det.cF - 2 * 10;              // nad siatką dolną fundamentu
    const foot = ceilTo(Math.max(15 * d, 200), 10);
    const above = anch.l0 + (S.det.kicker || 0);
    rows.push({ pos: ++pos, kind: 'start', name: 'Pręty startowe (w fundamencie)', d, n, len: ceilTo(inF + above + foot, 10), straight: ceilTo(inF + above, 10), leg: foot, inF, above, shape: 'L' });
  });
  // strzemiona
  let tieLen, pinLen = 0;
  if (g.circ) { const Dt = g.D - 2 * c - dt; tieLen = ceilTo(Math.PI * Dt + 2 * hook + Math.max(anch.lbrqd * 0.0, 0), 10); }
  else { const bt = g.b - 2 * c - dt, ht = g.h - 2 * c - dt; tieLen = ceilTo(2 * (bt + ht) + 2 * hook, 10); }
  rows.push({ pos: ++pos, kind: 'tie', name: g.circ ? 'Strzemiona okrągłe' : 'Strzemiona zamknięte', d: dt, n: ties.sets, len: tieLen, hook, hookMin, shape: g.circ ? 'O' : 'S' });
  if (lay.pins.length) {
    const pH = lay.pins.filter(p => p.dir === 'h').length, pB = lay.pins.filter(p => p.dir === 'b').length;
    if (pH) rows.push({ pos: ++pos, kind: 'pin', name: 'Szpilki (w kierunku h)', d: dt, n: pH * ties.sets, len: ceilTo(g.h - 2 * c + 2 * hook, 10), hook, shape: 'P' });
    if (pB) rows.push({ pos: ++pos, kind: 'pin', name: 'Szpilki (w kierunku b)', d: dt, n: pB * ties.sets, len: ceilTo(g.b - 2 * c + 2 * hook, 10), hook, shape: 'P' });
  }
  rows.forEach(r => { r.tot = r.n * r.len / 1000; r.kg = r.tot * massPerM(r.d); r.steel = r.kind === 'tie' || r.kind === 'pin' ? 'W' : 'L'; });
  const byD = {}; rows.forEach(r => { const k = r.steel + r.d; byD[k] = byD[k] || { d: r.d, steel: r.steel, m: 0, kg: 0 }; byD[k].m += r.tot; byD[k].kg += r.kg; });
  const tot = rows.reduce((a, r) => a + r.kg, 0);
  const tooLong = rows.filter(r => S.det.Lmax > 0 && r.len > S.det.Lmax * 1000);
  return { rows, byD: Object.values(byD).sort((a, b) => a.steel.localeCompare(b.steel) || a.d - b.d), tot, hook, hookMin, tooLong };
}

/* ======================================================================
   GŁÓWNA PROCEDURA
   ====================================================================== */
function calc(S0, opts) {
  opts = opts || {};
  const S = normalize(S0);
  const R = { S, errors: [], warns: [], infos: [], checks: [] };
  const m = R.m = materials(S);
  const g = R.g = geomCalc(S, R);
  if (R.errors.length) return R;
  const dt0 = tieDia(S);
  const cov = R.cov = coverCalc(S, m, S.reb.set ? Math.max(S.reb.dc, g.circ ? 0 : S.reb.dm) : 12, dt0);
  const lay = R.lay = layoutBars(S, g, cov, m);
  R.bare = !lay.n;
  const cr = R.creep = creepCalc(S, m, g);
  // długości wyboczeniowe, imperfekcje
  const B = R.buck = { y: bucklingDir(S, g, 'y'), z: bucklingDir(S, g, 'z') };
  const imp = R.imp = imperfection(S, g, B);
  // obciążenia i kombinacje
  const items = R.items = loadItems(S, g);
  const dists = R.dists = items.map(it => itemDist(it, S, g));
  const C = R.combos = genCombos(items, S.loads);
  if (!C.U.length) R.warns.push('Brak obciążeń – dodaj obciążenia w zakładce Dane.');
  if (C.capped) R.infos.push(`Liczba wariantów obciążeń zmiennych przekracza 729 – przyjęto wszystkie obciążenia zmienne jednocześnie (obciążenia dwukierunkowe ±).`);
  // dane kierunków
  const dirs = R.dirs = {};
  DIRS.forEach(d => {
    const gd = g.dir[d], bars = barsDir(lay, g, d);
    const D = { dir: d, g, m, B: B[d], ei: imp[d], e0: Math.max(gd.depth / 30, 20), phiInf: cr.phi, bars, direct: S.loads.mode === 'direct' };
    D.As = lay.As; D.omega = lay.As * m.fyd / (g.Ac * m.fcd);
    const ycG = gd.depth / 2;
    D.Is = bars.reduce((a, b) => a + b.A * (b.y - ycG) ** 2, 0);
    D.Ic = gd.I;
    D.is = lay.As > 0 ? Math.sqrt(D.Is / lay.As) : 0;
    D.dEff = gd.depth / 2 + D.is;
    D.U = lay.n ? makeDirULS(g.parts[d], gd.depth, bars, m) : makeDirULS(g.parts[d], gd.depth, [], m);
    if (S.sec2.method === 'gen' && lay.n) D.gen = makeGen(D);
    dirs[d] = D;
  });
  R.NRd0 = g.Ac * m.fcd + lay.As * m.fyd;
  // ocena wszystkich kombinacji SGN
  const res = R.res = [];
  C.U.forEach((c, ci) => {
    const fr = superpose(dists, items, c.f, g);
    const frq = c.fq ? superpose(dists, items, c.fq, g) : null;
    const ry = evalDir(dirs.y, S, fr, frq), rz = evalDir(dirs.z, S, fr, frq);
    const o = { ci, c, fr, y: ry, z: rz };
    o.biax = biaxQuick(R, o);
    o.u = Math.max(ry.u, rz.u, o.biax.u539 || 0);
    res.push(o);
  });
  R.NEdMax = res.length ? Math.max(...res.map(o => o.fr.Nbot)) : 0;
  R.NEdMin = res.length ? Math.min(...res.map(o => o.fr.Ntop)) : 0;
  // zginanie ukośne – metoda włókien dla kombinacji decydujących
  if (lay.n && res.length && !opts.fast) {
    R.bx = makeBiax(g.parts.y, barsDir(lay, g, 'y'), m, g.circ ? g.D : g.b);
    const cand = res.slice().sort((a, b) => (b.biax.u539 || b.u) - (a.biax.u539 || a.u)).slice(0, 4);
    cand.forEach(o => { o.biax.fib = fiberBiax(R, o); });
  }
  // ścinanie
  R.sh = shearCalc(R, S);
  // strzemiona, zakotwienia
  const tension = res.some(o => hasTension(R, o));
  R.anch = anchCalc(S, m, lay.n ? lay : Object.assign({}, lay, { dmax: 16 }), cov, tension);
  R.ties = tiesCalc(S, g, lay.n ? lay : Object.assign({}, lay, { dmin: 12, dmax: 12, dt: dt0 }), R.anch, R.sh);
  // SGU
  R.sls = lay.n && S.sls.check !== false ? slsCalc(R, S) : null;
  // odporność ogniowa
  if (lay.n && res.length) {
    const gv = res.reduce((a, o) => (o.fr.Nbot > a.fr.Nbot ? o : a));
    R.radUtil = radialUtil(R, gv);
    const Nf = gv.fr.Nbot; R.e0fi = Nf > 0 ? Math.max(Math.abs(gv.y.Mb), Math.abs(gv.y.Mt), Math.abs(gv.z.Mb), Math.abs(gv.z.Mt)) / Nf : 0;
  }
  R.fire = lay.n ? fireCalc(S, g, m, lay, R) : null;
  R.sched = lay.n ? schedule(S, g, lay, cov, R.anch, R.ties) : null;
  checksCalc(R, S);
  const bad = R.checks.filter(c => c.status === 'fail');
  R.ok = !R.errors.length && !bad.length && res.length > 0;
  R.maxUtil = R.checks.filter(c => c.status !== 'info' && isFinite(c.ratio) && ETA_IDS.has(c.id) && (c.id !== 'biaxF' || S.sec2.biax === 'fiber')).reduce((a, c) => Math.max(a, c.ratio), 0);
  return R;
}

// czy pod obciążeniem obliczeniowym występuje rozciąganie (przekrój niezarysowany, krawędź najbardziej rozciągana)
function hasTension(R, o) {
  const g = R.g, Wy = g.Iy / (g.h / 2), Wz = g.Iz / (g.b / 2);
  return [0, 1, 2].some(i => { const sy = o.y.secs[i], sz = o.z.secs[i]; return sy.N / g.Ac - sy.M / Wy - sz.Mn / Wz < 0 || sy.N / g.Ac - sy.Mn / Wy - sz.M / Wz < 0; });
}
// SGU: przekrój zarysowany przy zginaniu w jednej płaszczyźnie z siłą N (ściskanie +), M ≥ 0 – ściskana krawędź y = 0
function crackedUni(parts, h, bars, N, M, Ec, Es) {
  const yc = grossProps(parts).yc;
  const st = x => { // oś obojętna na głębokości x; κ z równowagi momentów względem środka, potem N
    const strips = []; parts.forEach(p => { const ns = 40, dy = (p.y1 - p.y0) / ns; for (let i = 0; i < ns; i++) strips.push({ y: p.y0 + (i + 0.5) * dy, A: p.b * dy }); });
    let FN = 0, FM = 0; // dla κ = 1: ε(y) = (x − y)
    strips.forEach(s => { const e = x - s.y; if (e > 0) { FN += Ec * e * s.A; FM += Ec * e * s.A * (yc - s.y); } });
    bars.forEach(b => { const e = x - b.y; FN += Es * e * b.A; FM += Es * e * b.A * (yc - b.y); });
    return { FN, FM };
  };
  // szukane x: stosunek M/N równy FM/FN (mimośród)
  const target = N !== 0 ? M / N : Infinity;
  const f = x => { const q = st(x); return N !== 0 ? q.FM - target * q.FN : q.FN; };
  let lo = 1e-3 * h, hi = 20 * h, flo = f(lo), fhi = f(hi);
  if (flo * fhi > 0) { const q = st(hi); const k = N / q.FN; return { x: hi, k, sc: Ec * k * hi, ss: 0, full: true }; }
  for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2, fm = f(mid); if (fm * flo > 0) { lo = mid; flo = fm; } else hi = mid; }
  const x = (lo + hi) / 2, q = st(x), k = N !== 0 ? N / q.FN : M / q.FM;
  const ymax = Math.max(...bars.map(b => b.y));
  return { x, k, sc: Ec * k * x, ss: Math.max(0, -Es * k * (x - ymax)) };
}
// 5.8.9 – uproszczone kryteria i wzór (5.39) w przekrojach podstawy, środka i głowicy
function biaxQuick(R, o) {
  const g = R.g, m = R.m, lay = R.lay, S = R.S;
  const out = { secs: [], u539: 0 };
  const NRd = R.NRd0;
  const lamOk = R.buck.y.lam / R.buck.z.lam <= 2 && R.buck.z.lam / R.buck.y.lam <= 2;
  ['base', 'mid', 'top'].forEach((k, i) => {
    const sy = o.y.secs[i], sz = o.z.secs[i], N = sy.N;
    const cases = [
      { imp: 'y', My: sy.M, Mz: sz.Mn },
      { imp: 'z', My: sy.Mn, Mz: sz.M },
    ];
    const ry = R.dirs.y.U.MRd(N, sy.sg || 1), rz = R.dirs.z.U.MRd(N, sz.sg || 1);
    const ratio = NRd > 0 ? N / NRd : 0;
    const a = g.circ ? 2 : ratio <= 0.1 ? 1.0 : ratio >= 1 ? 2.0 : ratio <= 0.7 ? 1.0 + (ratio - 0.1) / 0.6 * 0.5 : 1.5 + (ratio - 0.7) / 0.3 * 0.5;
    cases.forEach(cs => {
      const ey = N > 0 ? cs.Mz / N : Infinity, ez = N > 0 ? cs.My / N : Infinity;   // e_y – w kierunku b (od M_z), e_z – w kierunku h (od M_y)
      const relB = ey / g.beq, relH = ez / g.heq;
      const rr = relH > 0 ? relB / relH : Infinity;
      const eccOk = rr <= 0.2 || rr >= 5;
      cs.relB = relB; cs.relH = relH; cs.rr = rr; cs.lamOk = lamOk; cs.eccOk = eccOk; cs.req = !(lamOk && eccOk);
      cs.MRdy = ry; cs.MRdz = rz; cs.a = a; cs.NRd = NRd; cs.ratio = ratio;
      cs.v = (ry === null || rz === null) ? Infinity : Math.pow(cs.Mz / Math.max(rz, 1e-9), a) + Math.pow(cs.My / Math.max(ry, 1e-9), a);
      if (cs.Mz < 1 && cs.My < 1) cs.v = 0;
    });
    const gov = cases.reduce((p, q) => ((q.req ? q.v : -1) > (p.req ? p.v : -1) ? q : p));
    out.secs.push({ key: k, N, cases, gov });
  });
  out.gov = out.secs.reduce((p, q) => ((q.gov.req ? q.gov.v : -1) > (p.gov.req ? p.gov.v : -1) ? q : p));
  out.req = out.secs.some(s => s.cases.some(c => c.req));
  out.u539 = out.req ? Math.max(...out.secs.map(s => Math.max(...s.cases.map(c => c.req ? c.v : 0)))) : 0;
  return out;
}
function fiberBiax(R, o) {
  const bx = R.bx; let best = null;
  o.biax.secs.forEach(s => s.cases.forEach(cs => {
    const sy = o.y.secs.find(q => q.key === s.key), sz = o.z.secs.find(q => q.key === s.key);
    const My = cs.My * (sy.sg || 1), Mz = cs.Mz * (sz.sg || 1);
    const u = bx.util(s.N, My, Mz);
    if (!best || u.u > best.u) best = { u: u.u, MRd: u.MRd, N: s.N, My, Mz, key: s.key, imp: cs.imp };
  }));
  return best;
}
// wykorzystanie „promieniowe” (N i M zwiększane proporcjonalnie) – do μ_fi
function radialUtil(R, o) {
  let worst = 0;
  DIRS.forEach(d => {
    const s = o[d].gov; if (!s || !(s.N > 0)) return;
    const U = R.dirs[d].U, sg = s.sg || 1;
    const fits = k => { const M = U.MRd(k * s.N, sg); return M !== null && M >= k * s.M; };
    if (!fits(1)) { worst = Math.max(worst, 1); return; }
    let lo = 1, hi = 50; for (let i = 0; i < 50; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    worst = Math.max(worst, 1 / lo);
  });
  return worst || 0;
}

/* ------------------------------------------------------------ ścinanie */
function shearCalc(R, S) {
  const g = R.g, m = R.m, lay = R.lay, out = {};
  if (!R.res.length) return out;
  let sMaxShear = Infinity;
  DIRS.forEach(d => {
    const gd = g.dir[d];
    const gov = R.res.reduce((a, o) => (o[d].VEd > a[d].VEd ? o : a));
    const VEd = gov[d].VEd;
    const Nmin = gov.fr.Ntop, Nmax = gov.fr.Nbot;
    let bw, dd;
    if (g.circ) { bw = g.D; dd = g.D / 2 + 2 * (lay.Rs || g.D / 2 - 50) / Math.PI; }
    else { bw = gd.width; const bars = barsDir(lay, g, d); dd = bars.length ? Math.max(...bars.map(b => b.y)) : gd.depth - 50; }
    const z = 0.9 * dd;
    const bars = barsDir(lay, g, d);
    const Asl = bars.filter(b => b.y > gd.depth / 2 + 1).reduce((a, b) => a + b.A, 0);
    const k = Math.min(2, 1 + Math.sqrt(200 / dd));
    const rhoL = Math.min(0.02, Asl / (bw * dd));
    const scp = Math.min(Math.max(Nmin, -1e12) / g.Ac, 0.2 * m.fcd);
    const CRd = 0.18 / m.gc, k1 = 0.15;
    const vmin = 0.035 * Math.pow(k, 1.5) * Math.sqrt(m.fck);
    const VRdc1 = (CRd * k * Math.cbrt(100 * rhoL * m.fck) + k1 * scp) * bw * dd;
    const VRdc2 = (vmin + k1 * scp) * bw * dd;
    const VRdc = Math.max(VRdc1, VRdc2, 0);
    const acwOf = sc => { const r = sc / m.fcd; if (r <= 0) return 1; if (r <= 0.25) return 1 + r; if (r <= 0.5) return 1.25; return Math.max(0, 2.5 * (1 - r)); };
    const acw = Math.min(acwOf(Math.max(0, Nmin) / g.Ac), acwOf(Math.max(0, Nmax) / g.Ac));
    const legs = g.circ ? 2 : lay.legs[d];
    const Asw = legs * area(lay.dt);
    const VRdmaxOf = cot => acw * bw * z * m.nu1 * m.fcd / (cot + 1 / cot);
    let cot = 2.5; while (cot > 1 && VRdmaxOf(cot) < VEd) cot = Math.max(1, cot - 0.05);
    const VRdmax = VRdmaxOf(cot);
    const sReq = VEd > VRdc ? Asw * z * m.fywd * cot / VEd : Infinity;
    if (VEd > VRdc) sMaxShear = Math.min(sMaxShear, sReq);
    out[d] = { gov, VEd, V0: gov[d].V0, V2: gov[d].V2, bw, d: dd, z, Asl, k, rhoL, scp, CRd, k1, vmin, VRdc1, VRdc2, VRdc, acw, legs, Asw, cot, VRdmax, sReq, needs: VEd > VRdc, Nmin, Nmax };
  });
  out.sMaxShear = sMaxShear;
  return out;
}
function shearFinal(R) {
  const sh = R.sh, m = R.m, ties = R.ties;
  DIRS.forEach(d => { const q = sh[d]; if (!q) return; q.s = ties.s; q.VRds = q.Asw / ties.s * q.z * m.fywd * q.cot; });
}

/* ---------------------------------------------------------------- SGU */
function slsCalc(R, S) {
  const g = R.g, m = R.m, lay = R.lay, C = R.combos, dists = R.dists, items = R.items;
  const bars = barsDir(lay, g, 'y'), bw = g.circ ? g.D : g.b, parts = g.parts.y;
  const Wy = g.Iy / (g.h / 2), Wz = g.Iz / (g.b / 2);
  const proxy = fr => [0, NPT / 2, NPT].map(i => ({ i, N: fr.Nat(XI[i]), My: fr.y.M[i], Mz: fr.z.M[i] }));
  const pick = (list, Ec) => {
    const all = []; list.forEach(c => { const fr = superpose(dists, items, c.f, g); proxy(fr).forEach(p => all.push(Object.assign(p, { c }))); });
    const pc = q => Math.max(0, q.N) / g.Ac + Math.abs(q.My) / Wy + Math.abs(q.Mz) / Wz;
    const ps = q => Math.abs(q.My) / Wy + Math.abs(q.Mz) / Wz - q.N / g.Ac;
    const sel = new Set([...all.slice().sort((a, b) => pc(b) - pc(a)).slice(0, 3), ...all.slice().sort((a, b) => ps(b) - ps(a)).slice(0, 3)]);
    let wc = null, ws = null;
    sel.forEach(q => { const r = elasticBiax(parts, bars, bw, Ec, m.Es, q.N, q.My, q.Mz); const o = Object.assign({}, q, r); if (!wc || r.sc > wc.sc) wc = o; if (!ws || r.ss > ws.ss) ws = o; });
    return { wc, ws };
  };
  const phi = R.creep.phi;
  const Eeff = m.Ecm / (1 + phi);
  const K = C.K.length ? pick(C.K, m.Ecm) : null;
  const KL = C.K.length ? pick(C.K, Eeff) : null;
  const Q = C.QP.length ? pick(C.QP, Eeff) : null;
  const o = { Eeff, K, KL, Q };
  o.sck = K && K.wc ? K.wc.sc : 0;
  o.ssk = Math.max(K && K.ws ? K.ws.ss : 0, KL && KL.ws ? KL.ws.ss : 0);
  o.scqp = Q && Q.wc ? Q.wc.sc : 0;
  o.ssqp = Q && Q.ws ? Q.ws.ss : 0;
  o.lim = { sck: S.coef.k1 * m.fck, scqp: S.coef.k2 * m.fck, ssk: S.coef.k3 * m.fyk };
  o.needSck = ['XD1', 'XD2', 'XD3', 'XS1', 'XS2', 'XS3'].includes(R.cov.exp) || (S.env.expF && S.env.expF !== '-');
  // szerokość rys (7.3.4) – gdy w kombinacji quasi-stałej pręty są rozciągane
  if (Q && Q.ws && Q.ws.ss > 1) {
    const q = Q.ws; const dir = Math.abs(q.My) / Wy >= Math.abs(q.Mz) / Wz ? 'y' : 'z';
    const gd = g.dir[dir], Mv = dir === 'y' ? q.My : q.Mz, sg = Mv >= 0 ? 1 : -1;
    const bd = barsDir(lay, g, dir), bb = sg > 0 ? bd : bd.map(b => Object.assign({}, b, { y: gd.depth - b.y }));
    const cu = crackedUni(g.parts[dir], gd.depth, bb, q.N, Math.abs(Mv), Eeff, m.Es);
    const x = clamp(cu.x, 1, gd.depth);
    const dmax = Math.max(...bb.map(b => b.y));
    const ht = Math.max(1, Math.min(2.5 * (gd.depth - dmax), (gd.depth - x) / 3, gd.depth / 2));
    const tens = bb.filter(b => b.y >= gd.depth - ht - 1e-6);
    const AsT = Math.max(tens.reduce((a, b) => a + b.A, 0), bb.filter(b => b.y >= dmax - 1).reduce((a, b) => a + b.A, 0));
    const Aceff = gd.width * ht;
    const rho = Math.max(AsT / Aceff, 1e-4);
    const ae = m.Es / m.Ecm, kt = 0.4, fct = m.fctm;
    const ss = Math.max(cu.ss, 0);
    const de1 = (ss - kt * fct / rho * (1 + ae * rho)) / m.Es, de2 = 0.6 * ss / m.Es;
    const de = Math.max(de1, de2);
    const c = R.cov.cnom + lay.dt, phiB = lay.dmax;
    const k1 = 0.8, k2 = 0.5, k3 = 3.4, k4 = 0.425;
    const spacing = g.circ ? (lay.faces.c ? lay.faces.c.ctc : 0) : (dir === 'y' ? lay.faces.b.ctc : lay.faces.h.ctc);
    let sr = k3 * c + k1 * k2 * k4 * phiB / rho, srNote = '7.11';
    if (spacing > 5 * (c + phiB / 2)) { sr = 1.3 * (gd.depth - x); srNote = '7.14'; }
    const wk = sr * de;
    o.wk = { dir, N: q.N, M: Math.abs(Mv), x, ht, AsT, Aceff, rho, ae, kt, fct, ss, de1, de2, de, c, phiB, sr, srNote, wk, wmax: WMAX[R.cov.exp] || 0.3, spacing, k1, k2, k3, k4, cname: q.c.name };
  }
  return o;
}

/* --------------------------------------------------------------- sprawdzenia */
const ETA_IDS = new Set(['My', 'Mz', 'biax', 'biaxF', 'Nmax', 'stab', 'Vy', 'Vz', 'Vmaxy', 'Vmaxz', 'sck', 'ssk', 'wk', 'scqp', 'gen']);
function checksCalc(R, S) {
  const C = R.checks, g = R.g, m = R.m, lay = R.lay, cov = R.cov;
  const add = (grp, id, name, ref, Ed, Rd, unit, opt) => {
    opt = opt || {};
    const ratio = opt.ratio !== undefined ? opt.ratio : (opt.rel === '≥' ? (Ed > 0 ? (Rd > 0 ? Ed / Rd : Infinity) : 0) : (Rd > 0 ? Ed / Rd : (Ed > 0 ? Infinity : 0)));
    const status = opt.status || (ratio <= 1 + 1e-6 ? 'ok' : (opt.soft ? 'warn' : 'fail'));
    C.push({ grp, id, name, ref, Ed, Rd, unit, ratio, status, rel: opt.rel || '≤', note: opt.note || '', fmt: opt.fmt, at: opt.at || null, sec: opt.sec || null });
    return C[C.length - 1];
  };
  const gK = 'Otulina i trwałość', gD = 'Konstrukcja (rozdz. 8 i 9.5)', gN = 'SGN – ściskanie ze zginaniem', gS = 'SGN – smukłość i efekty II rzędu', gV = 'SGN – ścinanie', gU = 'SGU – naprężenia i rysy', gF = 'Odporność ogniowa (PN-EN 1992-1-2)';
  // otulina
  add(gK, 'cnom', 'Otulina nominalna c_nom (do strzemion)', '4.4.1', cov.reqR, cov.cnom, 'mm', { rel: '≥', note: cov.manual ? `przyjęto ręcznie; wymagane ${cov.req.toFixed(0)} mm → ${cov.reqR} mm` : `wymagane ${cov.req.toFixed(0)} mm → zaokr. ${cov.reqR} mm`, sec: 'cov' });
  const mc = add(gK, 'minclass', 'Minimalna klasa betonu dla ekspozycji', 'Zał. E', classIdx(cov.minCls), classIdx(S.mat.concrete), '', { rel: '≥', soft: true, ratio: cov.minOk ? 0 : 1.01, status: cov.minOk ? 'ok' : 'warn', note: `${S.mat.concrete} vs min. ${cov.minCls} (${cov.minFrom})`, fmt: 'text', sec: 'cov' });
  mc.EdTxt = cov.minCls; mc.RdTxt = S.mat.concrete;
  if (g.wall) add(gD, 'wall', 'Element o h > 4b – ściana, nie słup (9.5.1)', '9.5.1', g.dmax / g.dmin, 4, '', { soft: true, note: 'zastosuj wymagania dla ścian (9.6)', sec: 'det' });
  if (!lay.n) {
    add(gD, 'bare', 'Brak zbrojenia podłużnego – dobierz zbrojenie', '9.5.2', 1, 0, '', { ratio: Infinity, status: 'fail', note: 'zakładka Przekrój i zbrojenie: „Dobierz zbrojenie”', sec: 'det' });
  }
  const res = R.res;
  if (!res.length) return;
  // --- SGN: zginanie z siłą podłużną (jednokierunkowo)
  const govOf = d => res.reduce((a, o) => (o[d].u > a[d].u ? o : a));
  if (lay.n) {
    DIRS.forEach(d => {
      const o = govOf(d), r = o[d], s = r.gov;
      const nm = d === 'y' ? 'Zginanie z siłą podłużną w płaszczyźnie h: M_Ed,y ≤ M_Rd,y(N_Ed)' : 'Zginanie z siłą podłużną w płaszczyźnie b: M_Ed,z ≤ M_Rd,z(N_Ed)';
      const where = { base: 'podstawa', mid: 'strefa środkowa', top: 'głowica' }[s.key];
      add(gN, d === 'y' ? 'My' : 'Mz', nm, '6.1', s.M / 1e6, s.MRd === null ? 0 : s.MRd / 1e6, 'kNm', { ratio: s.u, note: `${where}; N_Ed = ${(s.N / 1e3).toFixed(1)} kN; ${o.c.name}`, at: { ci: o.ci, dir: d, sec: s.key }, sec: 'uls' + d });
    });
    // nośność na ściskanie osiowe
    const oN = res.reduce((a, o) => (o.fr.Nbot > a.fr.Nbot ? o : a));
    const Nmax = Math.min(R.dirs.y.U.Nmax, R.dirs.z.U.Nmax);
    add(gN, 'Nmax', 'Ściskanie: N_Ed ≤ N_Rd (przekrój, ε_c ≤ ε_c2)', '6.1(5)', oN.fr.Nbot / 1e3, Nmax / 1e3, 'kN', { note: oN.c.name, at: { ci: oN.ci }, sec: 'ulsN' });
    // zginanie ukośne
    const ob = res.reduce((a, o) => ((o.biax.u539 || 0) > (a.biax.u539 || 0) ? o : a));
    if (!ob.biax.req) add(gN, 'biax', 'Zginanie ukośne – kryteria 5.38a, 5.38b spełnione (sprawdzenie osobno w kierunkach wystarcza)', '5.8.9(3)', 0, 1, '', { ratio: 0, status: 'ok', note: 'λ_y/λ_z ≤ 2, λ_z/λ_y ≤ 2 i stosunek mimośrodów względnych ≤ 0,2 lub ≥ 5 we wszystkich kombinacjach', fmt: 'text', sec: 'biax' });
    else {
      const cs = ob.biax.gov.gov;
      add(gN, 'biax', 'Zginanie ukośne: (M_Edz/M_Rdz)^a + (M_Edy/M_Rdy)^a ≤ 1,0', '5.8.9(4)', ob.biax.u539, 1, '', { note: `a = ${cs.a.toFixed(2)}; ${{ base: 'podstawa', mid: 'strefa środkowa', top: 'głowica' }[ob.biax.gov.key]}; imperfekcja w kierunku ${cs.imp === 'y' ? 'h' : 'b'}; ${ob.c.name}`, at: { ci: ob.ci, sec: ob.biax.gov.key }, sec: 'biax' });
    }
    const fibs = res.filter(o => o.biax.fib).map(o => ({ o, f: o.biax.fib }));
    if (fibs.length) {
      const w = fibs.reduce((a, q) => (q.f.u > a.f.u ? q : a));
      const asCheck = S.sec2.biax === 'fiber';
      add(gN, 'biaxF', 'Zginanie ukośne – kontur nośności M_y–M_z przy N_Ed (metoda włókien)', '6.1', Math.hypot(w.f.My, w.f.Mz) / 1e6, w.f.MRd / 1e6, 'kNm', { ratio: w.f.u, status: asCheck ? undefined : 'info', note: `${{ base: 'podstawa', mid: 'strefa środkowa', top: 'głowica' }[w.f.key]}; N_Ed = ${(w.f.N / 1e3).toFixed(1)} kN; ${asCheck ? 'kryterium decydujące (wybór w opcjach)' : 'sprawdzenie dokładne – informacyjnie (decyduje wzór 5.39)'}`, at: { ci: w.o.ci, sec: w.f.key }, sec: 'biax' });
    }
    // --- smukłość
    DIRS.forEach(d => {
      const o = res.reduce((a, q) => ((q[d].lam / q[d].lamLim) > (a[d].lam / a[d].lamLim) ? q : a));
      const r = o[d];
      add(gS, 'lam' + d, `Smukłość w płaszczyźnie ${d === 'y' ? 'h' : 'b'}: λ = l₀/i ≤ λ_lim (efekty II rzędu ${r.slender ? 'uwzględnione' : 'pomijalne'})`, '5.8.3.1', r.lam, r.lamLim, '', { status: 'info', ratio: r.lam / r.lamLim, note: `l₀ = ${(r.l0 / 1000).toFixed(2)} m; ${o.c.name}`, at: { ci: o.ci, dir: d }, sec: 'slen' + d });
      if (S.sec2.method === 'ns') {
        const os = res.filter(q => q[d].NB).reduce((a, q) => (!a || q[d].NEd / q[d].NB > a[d].NEd / a[d].NB ? q : a), null);
        if (os) add(gS, 'stab', `Stateczność (metoda nominalnej sztywności) w płaszczyźnie ${d === 'y' ? 'h' : 'b'}: N_Ed < N_B`, '5.8.7.3', os[d].NEd / 1e3, os[d].NB / 1e3, 'kN', { note: `EI = ${(os[d].EI / 1e12).toFixed(2)} MNm²`, at: { ci: os.ci, dir: d }, sec: 'slen' + d });
      }
      if (S.sec2.method === 'gen') {
        const og = res.find(q => q[d].unstable);
        if (og) add(gS, 'gen', `Metoda ogólna (5.8.6) w płaszczyźnie ${d === 'y' ? 'h' : 'b'}: brak stanu równowagi`, '5.8.6', 1, 0, '', { ratio: Infinity, status: 'fail', note: (og[d].gen && og[d].gen.note) || 'utrata stateczności', at: { ci: og.ci, dir: d }, sec: 'slen' + d });
      }
    });
    const lmax = Math.max(R.buck.y.lam, R.buck.z.lam);
    if (lmax > 140) add(gS, 'lam140', 'Smukłość bardzo duża (λ > 140) – zalecane powiększenie przekroju', '5.8.3', lmax, 140, '', { soft: true, sec: 'sleny' });
  }
  // --- ścinanie
  shearFinal(R);
  if (lay.n) DIRS.forEach(d => {
    const q = R.sh[d]; if (!q) return;
    const pl = d === 'y' ? 'h' : 'b';
    if (!q.needs) add(gV, 'V' + d, `Ścinanie w płaszczyźnie ${pl}: V_Ed ≤ V_Rd,c (zbrojenie obliczeniowo zbędne)`, '6.2.2', q.VEd / 1e3, q.VRdc / 1e3, 'kN', { note: q.gov.c.name, at: { ci: q.gov.ci, dir: d }, sec: 'shear' + d });
    else add(gV, 'V' + d, `Ścinanie w płaszczyźnie ${pl}: V_Ed ≤ V_Rd,s (strzemiona)`, '6.2.3(3)', q.VEd / 1e3, q.VRds / 1e3, 'kN', { note: `cot θ = ${q.cot.toFixed(2)}, ${q.legs} ramion, s = ${R.ties.s} mm`, at: { ci: q.gov.ci, dir: d }, sec: 'shear' + d });
    add(gV, 'Vmax' + d, `Ściskane krzyżulce betonowe w płaszczyźnie ${pl}: V_Ed ≤ V_Rd,max`, '6.2.3(3)', q.VEd / 1e3, q.VRdmax / 1e3, 'kN', { note: `α_cw = ${q.acw.toFixed(3)}`, sec: 'shear' + d });
  });
  // --- konstrukcja
  if (lay.n) {
    const NmaxEd = R.NEdMax;
    const AsMin = Math.max(0.10 * Math.max(0, NmaxEd) / m.fyd, 0.002 * g.Ac);
    R.AsMin = AsMin; R.AsMax = 0.04 * g.Ac;
    add(gD, 'asmin', 'Zbrojenie podłużne A_s ≥ A_s,min = max(0,10·N_Ed/f_yd; 0,002·A_c)', '9.5.2(2)', AsMin, lay.As, 'mm²', { rel: '≥', sec: 'det' });
    add(gD, 'asmax', 'Zbrojenie podłużne A_s ≤ A_s,max = 0,04·A_c (poza zakładami)', '9.5.2(3)', lay.As, 0.04 * g.Ac, 'mm²', { sec: 'det' });
    const lapF = S.det.lap === '100' ? 2 : 1.5;
    add(gD, 'asmaxl', `Zbrojenie w strefie zakładu ≤ 0,08·A_c (${S.det.lap === '100' ? 'wszystkie pręty łączone w jednym przekroju' : '50% prętów łączonych'})`, '9.5.2(3)', lapF * lay.As, 0.08 * g.Ac, 'mm²', { sec: 'det' });
    add(gD, 'phimin', 'Średnica prętów podłużnych ⌀ ≥ ⌀_min', '9.5.2(1)', S.coef.phiMin, lay.dmin, 'mm', { rel: '≥', sec: 'det' });
    if (g.circ) add(gD, 'nbars', 'Liczba prętów w słupie okrągłym ≥ 4 (zalecane ≥ 6)', '9.5.2(4)', 4, lay.n, 'szt.', { rel: '≥', note: lay.n < 6 ? 'zalecane co najmniej 6 prętów' : '', sec: 'det' });
    else add(gD, 'nbars', 'Pręt w każdym narożu przekroju', '9.5.2(4)', 4, lay.bars.filter(b => b.corner).length, 'szt.', { rel: '≥', sec: 'det' });
    const clr = g.circ ? lay.faces.c.clear : Math.min(lay.faces.b.clear, lay.faces.h.clear);
    if (lay.n > 1) add(gD, 'sp', 'Odstęp prętów w świetle ≥ max(⌀; d_g + 5 mm; 20 mm)', '8.2(2)', lay.smin, clr, 'mm', { rel: '≥', sec: 'det' });
    if (!g.circ) {
      const far = Math.max(lay.faces.b.far, lay.faces.h.far);
      add(gD, 'tied', 'Każdy pręt w odległości ≤ 150 mm (w świetle) od pręta utrzymanego strzemieniem', '9.5.3(6)', far, 150, 'mm', { note: lay.pins.length ? `szpilki: ${lay.pins.length} (w kierunku h: ${lay.pins.filter(p => p.dir === 'h').length}, b: ${lay.pins.filter(p => p.dir === 'b').length})` : 'tylko pręty narożne utrzymane', sec: 'ties' });
    }
    const T = R.ties;
    add(gD, 'phit', 'Średnica strzemion ⌀_t ≥ max(6 mm; ⌀_max/4)', '9.5.3(1)', T.dtReq, lay.dt, 'mm', { rel: '≥', sec: 'ties' });
    add(gD, 'st', 'Rozstaw strzemion s ≤ s_cl,tmax = min(20⌀_min; b; 400 mm)', '9.5.3(3)', T.s, T.scl, 'mm', { sec: 'ties' });
    add(gD, 'st2', 'Rozstaw strzemion przy stropach i w strefie zakładów ≤ 0,6·s_cl,tmax', '9.5.3(4)', T.sRed, T.sclRed, 'mm', { sec: 'ties' });
    const sch = R.sched;
    if (sch && sch.tooLong.length) add(gD, 'Lmax', `Długość pręta ≤ L_max = ${S.det.Lmax} m`, '—', Math.max(...sch.tooLong.map(r => r.len)) / 1000, S.det.Lmax, 'm', { soft: true, note: 'podziel pręty zakładem', sec: 'sched' });
    if (S.det.base === 'found') {
      const av = S.det.hF - S.det.cF - 20;
      add(gD, 'anchF', 'Zakotwienie prętów startowych w fundamencie: h_F − c ≥ l_bd', '8.4.4', R.anch.lbd, av, 'mm', { rel: '≥', ratio: av > 0 ? R.anch.lbd / av : Infinity, soft: true, note: `${R.anch.tension ? 'pręty rozciągane – z odgięciem α₁' : 'pręty ściskane – odgięcie nie skraca zakotwienia'}; zwiększ wysokość fundamentu lub zastosuj mniejsze średnice`, sec: 'anch' });
    }
  }
  // --- SGU
  const L = R.sls;
  if (L) {
    if (L.needSck) add(gU, 'sck', 'Naprężenia ściskające w betonie (kombinacja char.) σ_c ≤ k₁·f_ck', '7.2(2)', L.sck, L.lim.sck, 'MPa', { sec: 'sls' });
    else add(gU, 'sck', 'Naprężenia ściskające w betonie (kombinacja char.) σ_c ≤ k₁·f_ck – wymagane tylko w klasach XD, XF, XS', '7.2(2)', L.sck, L.lim.sck, 'MPa', { status: 'info', sec: 'sls' });
    add(gU, 'scqp', 'Liniowość pełzania: σ_c (kombinacja quasi-stała) ≤ k₂·f_ck', '7.2(3)', L.scqp, L.lim.scqp, 'MPa', { soft: true, note: 'przy przekroczeniu – pełzanie nieliniowe', sec: 'sls' });
    add(gU, 'ssk', 'Naprężenia w stali (kombinacja char.) σ_s ≤ k₃·f_yk', '7.2(5)', L.ssk, L.lim.ssk, 'MPa', { sec: 'sls' });
    if (L.wk) add(gU, 'wk', 'Szerokość rys (kombinacja quasi-stała) w_k ≤ w_max', '7.3.4', L.wk.wk, L.wk.wmax, 'mm', { sec: 'sls' });
    else add(gU, 'wk', 'Rysy – brak rozciągania prętów w kombinacji quasi-stałej (przekrój ściśnięty)', '7.3', 0, 1, 'mm', { ratio: 0, status: 'ok', fmt: 'text', sec: 'sls' });
  }
  // --- pożar
  const F = R.fire;
  if (F) {
    const RR = F.R;
    if (F.side === 'one') add(gF, 'fireT', `${RR}: wymiar i odległość osi prętów (tab. 5.2a, ekspozycja jednostronna) b ≥ ${F.bmin} mm, a ≥ ${F.amin} mm`, 'PN-EN 1992-1-2, 5.3.2', F.amin, F.a, 'mm', { rel: '≥', ratio: F.tabOk ? F.amin / F.a : Infinity, status: F.tabOk ? 'ok' : 'fail', sec: 'fire' });
    else add(gF, 'fireT', `${RR}: tablica 5.2a (μ_fi = ${F.mu.toFixed(2)}) – odległość osi prętów a ≥ a_min${F.need8 ? ', ≥ 8 prętów' : ''}`, 'PN-EN 1992-1-2, 5.3.2', F.aReq === null ? 0 : F.aReq, F.a, 'mm', { rel: '≥', ratio: F.aReq === null ? Infinity : F.aReq / F.a, status: F.tabOk ? 'ok' : (F.formValid && F.formOk ? 'info' : 'fail'), note: F.aReq === null ? `wymiar b = ${F.b} mm mniejszy od minimalnego w tablicy` : `b = ${F.b} mm${F.bmin ? `, b_min = ${F.bmin} mm` : ''}`, sec: 'fire' });
    add(gF, 'fireF', `${RR}: wzór (5.7) – R = ${F.Rcalc.toFixed(0)} min ≥ ${F.Rreq} min`, 'PN-EN 1992-1-2, (5.7)', F.Rreq, F.Rcalc, 'min', { rel: '≥', status: F.formValid ? (F.formOk ? 'ok' : (F.tabOk ? 'info' : 'fail')) : 'info', note: F.formValid ? '' : 'poza zakresem stosowania wzoru (a, b′, l₀,fi, h ≤ 1,5b)', sec: 'fire' });
    add(gF, 'fireC', 'Warunki metody A: l₀,fi ≤ 3 m, e ≤ e_max, A_s < 0,04·A_c', 'PN-EN 1992-1-2, 5.3.2(2)', F.l0fi / 1000, 3, 'm', { status: F.condE && F.condA ? (F.condL ? 'ok' : 'warn') : 'fail', ratio: F.l0fi / 3000, note: `l₀,fi = ${(F.l0fi / 1000).toFixed(2)} m; e = ${F.e.toFixed(0)} mm ≤ e_max = ${F.emax.toFixed(0)} mm ${F.condE ? '✔' : '✖'}; A_s/A_c = ${(F.rho * 100).toFixed(2)}%${F.condL ? '' : '; l₀,fi > 3 m – tablica nie ma zastosowania (decyduje wzór 5.7)'}`, sec: 'fire' });
  }
  // odhaczanie (ticks) – domyślnie wszystkie
}

/* ======================================================================
   DOBÓR ZBROJENIA I PRZEKROJU
   ====================================================================== */
const NODES = new Set(['minclass', 'lam140', 'wall', 'Lmax', 'anchF']);
function badChecks(R, eta) {
  eta = eta || 1;
  return (R && R.checks ? R.checks : []).filter(c => c.status === 'fail' || (c.status === 'warn' && !NODES.has(c.id) && c.id !== 'scqp') || (eta < 1 && ETA_IDS.has(c.id) && c.status !== 'info' && isFinite(c.ratio) && c.ratio > eta + 1e-9));
}
// kandydaci zbrojenia: jedna średnica, liczby prętów na ścianach
function rebCandidates(S, g, cov) {
  const out = [], dt = tieDiaAuto(32), c = cov.cnom;
  const dias = MAIN_DIAS.filter(d => d >= S.coef.phiMin && d !== 14);
  const dFix = S.reb.fixD ? +S.reb.fixD : 0;
  (dFix ? [dFix] : dias).forEach(d => {
    const smin = Math.max(d, S.mat.dg + 5, 20);
    if (g.circ) {
      const Rs = g.D / 2 - c - tieDiaAuto(d) - d / 2;
      for (let n = 6; n <= 40; n++) { const chord = 2 * Rs * Math.sin(Math.PI / n); if (chord - d < smin) break; out.push({ d, nc: n, As: n * area(d), n }); }
      return;
    }
    const t = tieDiaAuto(d), off = c + t + d / 2;
    const maxN = L => { const span = L - 2 * off; let n = 2; while (n < 16 && span / n - d >= smin) n++; return n; };
    const nbM = maxN(g.b), nhM = maxN(g.h);
    for (let nb = 2; nb <= nbM; nb++) for (let nh = 2; nh <= nhM; nh++) {
      const n = 2 * nb + 2 * nh - 4; out.push({ d, nb, nh, As: n * area(d), n });
    }
  });
  return out.sort((a, b) => a.As - b.As || a.n - b.n);
}
function applyCand(S, cd) {
  const T = JSON.parse(JSON.stringify(S));
  T.reb.set = true; T.reb.dc = cd.d; T.reb.dm = cd.d;
  if (cd.nc) T.reb.nc = cd.nc; else { T.reb.nb = cd.nb; T.reb.nh = cd.nh; }
  return T;
}
function autoReb(S0, opts) {
  opts = opts || {};
  const eta = opts.eta || 1;
  const S = normalize(S0);
  const R0 = calc(Object.assign({}, S, { reb: Object.assign({}, S.reb, { set: true, dc: 16, dm: 16 }) }), { fast: true });
  if (R0.errors.length) return { ok: false, S, msg: R0.errors.join(' ') };
  const AsMin = Math.max(0.10 * Math.max(0, R0.NEdMax) / R0.m.fyd, 0.002 * R0.g.Ac), AsMax = 0.04 * R0.g.Ac;
  const list = rebCandidates(S, R0.g, R0.cov).filter(c => c.As >= AsMin - 0.5 && c.As <= AsMax + 0.5);
  if (!list.length) return { ok: false, S, msg: 'Brak układów prętów mieszczących się w przekroju między A_s,min i A_s,max.' };
  let tried = 0, best = null, bestBad = Infinity;
  const memo = new Map();
  const quick = i => {
    if (memo.has(i)) return memo.get(i);
    const T = applyCand(S, list[i]); const Rq = calc(T, { fast: true }); tried++;
    const b = badChecks(Rq, eta).filter(c => c.id !== 'biaxF');
    const r = { T, R: Rq, bad: b, ok: !b.length };
    if (b.length < bestBad) { bestBad = b.length; best = { S: T, R: Rq, cand: list[i], bad: b }; }
    memo.set(i, r); return r;
  };
  const full = i => { const q = quick(i); const Rf = calc(q.T); const b2 = badChecks(Rf, eta); if (b2.length < bestBad || (b2.length === 0)) { bestBad = b2.length; best = { S: q.T, R: Rf, cand: list[i], bad: b2 }; } return { ok: !b2.length, R: Rf, T: q.T }; };
  // największe zbrojenie – czy przekrój w ogóle wystarcza
  const last = list.length - 1;
  if (!quick(last).ok) {
    // spróbuj kilku największych (inne rozmieszczenie)
    let any = -1; for (let i = last - 1; i >= Math.max(0, last - 8); i--) if (quick(i).ok) { any = i; break; }
    if (any < 0) return { ok: false, S: best ? best.S : S, R: best ? best.R : null, best, tried, tooSmall: true, msg: 'Przekrój za mały – nawet przy A_s ≈ 4%·A_c nie są spełnione warunki: ' + (best ? best.bad.map(c => c.name).slice(0, 3).join('; ') : '') };
  }
  // bisekcja po liście uporządkowanej wg A_s, potem przegląd od dołu
  let lo = 0, hi = last;
  if (quick(0).ok) hi = 0;
  else { while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (quick(mid).ok) hi = mid; else lo = mid; } }
  const start = Math.max(0, hi - 12);
  for (let i = start; i <= last; i++) {
    if (!quick(i).ok) continue;
    const f = full(i);
    if (f.ok) return { ok: true, S: f.T, R: f.R, cand: list[i], tried };
    if (tried > (opts.maxTry || 300)) break;
  }
  return { ok: false, S: best ? best.S : S, R: best ? best.R : null, best, tried, msg: best ? 'Nie znaleziono zbrojenia spełniającego wszystkie warunki: ' + best.bad.map(c => c.name).slice(0, 3).join('; ') : 'Brak kandydatów zbrojenia.' };
}
// kandydaci wymiarów przekroju: zachowana proporcja h/b (co 50 mm), rosnąco
function dimCandidates(S0) {
  const S = normalize(S0), out = [];
  if (S.geom.shape === 'circ') { for (let D = 250; D <= 1500; D += 50) out.push({ D, A: area(D) }); return out; }
  const r = S.geom.h / S.geom.b;
  for (let b = 200; b <= 1200; b += 50) { const h = Math.max(200, Math.round(b * r / 50) * 50); if (h > 1500) break; out.push({ b, h, A: b * h }); }
  return out;
}
function applyDims(S, sz) { const T = JSON.parse(JSON.stringify(S)); if (sz.D) T.geom.D = sz.D; else { T.geom.b = sz.b; T.geom.h = sz.h; } return T; }
// jeden krok doboru przekroju (wywoływany kolejno przez interfejs – postęp, przerwanie)
function tryDims(S0, sz, opts) {
  const T = applyDims(normalize(S0), sz);
  const r = autoReb(T, { eta: opts && opts.eta, maxTry: 150 });
  return r.ok ? { ok: true, S: opts && opts.dimsOnly ? Object.assign(T, { reb: S0.reb }) : r.S, R: r.R, size: sz } : { ok: false, tooSmall: r.tooSmall, msg: r.msg };
}
function designDims(S0, opts) {
  opts = opts || {};
  const t0 = Date.now();
  for (const sz of dimCandidates(S0)) { const r = tryDims(S0, sz, opts); if (r.ok) return Object.assign(r, { ms: Date.now() - t0 }); if (Date.now() - t0 > (opts.timeout || 60000)) break; }
  return { ok: false, S: normalize(S0), msg: 'Nie znaleziono przekroju spełniającego warunki.' };
}

const API = {
  calc, normalize, defaultState, materials, coverCalc, geomCalc, layoutBars, makeULS, makeDirULS, makeBiax, elasticBiax, creepCalc,
  bucklingDir, imperfection, unitM, itemDist, genCombos, comboDesc, superpose, evalDir, m2Shape, fireCalc, anchCalc, schedule,
  autoReb, designDims, dimCandidates, applyDims, tryDims, badChecks, rebCandidates, applyCand, newItem, newRow, psiOf, normItem, normRow, tieDia, tieDiaAuto, barsDir, partsOf, mkCurve,
  CONCRETE, CONC_NAMES, STEEL, STEEL_LIST, BAR_DIAS, MAIN_DIAS, TIE_DIAS, EXPOSURES, EXP_DESC, PSI, VAR_KINDS, SCH, DIRS, FIRE_COL, FIRE_MIN, WMAX, MIN_CLASS, CMIN_DUR,
  area, num, clamp, massPerM, mandrelMin, classIdx, ETA_IDS, NPT, XI,
};
if (typeof module !== 'undefined' && module.exports) module.exports = API;
root.EC2 = API;
})(typeof window !== 'undefined' ? window : globalThis);
