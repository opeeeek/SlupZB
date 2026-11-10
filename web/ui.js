/* SłupŻB – interfejs użytkownika */
(function () {
'use strict';
const E = window.EC2, Dw = window.SZD;
const U = window.SZ = {};
let S = E.defaultState();
let R = null, filePath = '', dirty = false, rendered = {}, selCombo = null, schDiag = 'M', chSrc = null;

/* ------------------------------------------------------------ narzędzia */
const $ = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = Dw.fmt;
const sym = s => esc(s).replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>')
  .replace(/_([0-9A-Za-ząćęłńóśźżθφλ]+(?:,[0-9A-Za-ząćęłńóśźż]+)*)/g, '<sub>$1</sub>');
const getP = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const setP = (o, p, v) => { const ks = p.split('.'); let a = o; for (let i = 0; i < ks.length - 1; i++) { if (a[ks[i]] === undefined || a[ks[i]] === null) a[ks[i]] = {}; a = a[ks[i]]; } a[ks[ks.length - 1]] = v; };
const parseNum = s => { if (typeof s === 'number') return s; const x = parseFloat(String(s).replace(',', '.').replace(/\s/g, '')); return isFinite(x) ? x : null; };
const showNum = v => (v === '' || v === null || v === undefined) ? '' : String(v).replace('.', ',');
const rng = (a, b, st) => { const r = []; for (let v = a; v <= b + 1e-9; v += st) r.push(+v.toFixed(3)); return r; };
const PL = d => d === 'y' ? 'h' : 'b';
Object.assign(U, { esc, fmt, sym, getP });

/* ---------------------------------------------------------- definicja pól */
const CIRC = s => s.geom.shape === 'circ';
const SHP = s => s.geom.shape, RECT = s => SHP(s) === 'rect', ROUND = s => SHP(s) === 'circ' || SHP(s) === 'ring', POLY = s => SHP(s) === 'T' || SHP(s) === 'L';
const shapeTxt = s => { const G = s.geom; return SHP(s) === 'circ' ? `⌀${G.D}` : SHP(s) === 'ring' ? `⌀${G.pipe.D} × ${G.pipe.t}` : SHP(s) === 'T' ? `T ${G.tee.bf}×${G.tee.hf} / ${G.tee.bw}×${G.tee.h}` : SHP(s) === 'L' ? `L ${G.ang.b}×${G.ang.h} (t ${G.ang.th}/${G.ang.tb})` : `${G.b} × ${G.h}`; };
const DIMF = (pre) => [
  { k: 'geom.b', t: 'num', l: 'Wymiar b (wzdłuż osi y)', u: 'mm', list: [250, 300, 350, 400, 450, 500, 600, 700, 800], min: 150, show: RECT, re: true },
  { k: 'geom.h', t: 'num', l: 'Wymiar h (wzdłuż osi z)', u: 'mm', list: [250, 300, 350, 400, 450, 500, 600, 700, 800, 1000], min: 150, show: RECT, re: true },
  { k: 'geom.D', t: 'num', l: 'Średnica D', u: 'mm', list: [300, 350, 400, 450, 500, 600, 700, 800, 1000], min: 200, show: CIRC, re: true },
  { k: 'geom.pipe.D', t: 'num', l: 'Średnica zewnętrzna D', u: 'mm', list: [400, 500, 600, 700, 800, 1000, 1200, 1500], min: 300, show: s => SHP(s) === 'ring', re: true },
  { k: 'geom.pipe.t', t: 'num', l: 'Grubość ścianki t', u: 'mm', list: [100, 120, 150, 180, 200, 250, 300], min: 80, show: s => SHP(s) === 'ring', re: true },
  { k: 'geom.tee.bf', t: 'num', l: 'Szerokość półki b_{f}', u: 'mm', list: [500, 600, 700, 800, 1000, 1200], min: 200, show: s => SHP(s) === 'T', re: true },
  { k: 'geom.tee.hf', t: 'num', l: 'Grubość półki h_{f}', u: 'mm', list: [150, 180, 200, 250, 300], min: 100, show: s => SHP(s) === 'T', re: true },
  { k: 'geom.tee.bw', t: 'num', l: 'Grubość środnika b_{w}', u: 'mm', list: [200, 250, 300, 350, 400], min: 150, show: s => SHP(s) === 'T', re: true },
  { k: 'geom.tee.h', t: 'num', l: 'Wysokość całkowita h', u: 'mm', list: [400, 500, 600, 700, 800, 1000], min: 250, show: s => SHP(s) === 'T', re: true },
  { k: 'geom.ang.b', t: 'num', l: 'Wymiar b (ramię poziome)', u: 'mm', list: [400, 500, 600, 700, 800, 1000], min: 250, show: s => SHP(s) === 'L', re: true },
  { k: 'geom.ang.h', t: 'num', l: 'Wymiar h (ramię pionowe)', u: 'mm', list: [400, 500, 600, 700, 800, 1000], min: 250, show: s => SHP(s) === 'L', re: true },
  { k: 'geom.ang.th', t: 'num', l: 'Grubość ramienia pionowego t_{h}', u: 'mm', list: [200, 250, 300, 350, 400], min: 150, show: s => SHP(s) === 'L', re: true },
  { k: 'geom.ang.tb', t: 'num', l: 'Grubość ramienia poziomego t_{b}', u: 'mm', list: [200, 250, 300, 350, 400], min: 150, show: s => SHP(s) === 'L', re: true },
];
const SAME = s => s.buck.same;
const DIR_LBL = (s, d) => s.buck.same ? '' : (d === 'y' ? 'płaszczyzna h: ' : 'płaszczyzna b: ');
function buckFields(d) {
  return [
    { k: `buck.${d}.sch`, t: 'sel', l: s => DIR_LBL(s, d) + 'Warunki podparcia (rys. 5.7)', o: () => Object.entries(E.SCH).map(([k, v]) => [k, `${v.name} – β = ${String(v.beta).replace('.', ',')}`]), wide: true, re: true, show: s => d === 'y' || !s.buck.same },
    { k: `buck.${d}.mode`, t: 'sel', l: s => DIR_LBL(s, d) + 'Długość wyboczeniowa l₀', o: [['auto', 'wg schematu podparcia (β z rys. 5.7)'], ['beta', 'współczynnik β podany'], ['k', 'z podatności węzłów k₁, k₂ (wzory 5.15 / 5.16)'], ['l0', 'długość l₀ podana']], wide: true, re: true, show: s => d === 'y' || !s.buck.same },
    { k: `buck.${d}.beta`, t: 'num', l: 'Współczynnik β (l₀ = β·l)', list: [0.5, 0.6, 0.7, 0.8, 0.85, 0.9, 1.0, 1.2, 1.5, 2.0, 2.5], min: 0.3, show: s => (d === 'y' || !s.buck.same) && s.buck[d].mode === 'beta' },
    { k: `buck.${d}.l0`, t: 'num', l: 'Długość wyboczeniowa l₀', u: 'm', list: [2, 2.5, 3, 3.5, 4, 5, 6, 8, 10], min: 0.1, show: s => (d === 'y' || !s.buck.same) && s.buck[d].mode === 'l0' },
    { k: `buck.${d}.k1`, t: 'num', l: 'k₁ – podatność węzła dolnego', list: [0, 0.1, 0.2, 0.5, 1, 2, 5, 10], min: 0, show: s => (d === 'y' || !s.buck.same) && s.buck[d].mode === 'k' },
    { k: `buck.${d}.k2`, t: 'num', l: 'k₂ – podatność węzła górnego', list: [0, 0.1, 0.2, 0.5, 1, 2, 5, 10], min: 0, show: s => (d === 'y' || !s.buck.same) && s.buck[d].mode === 'k' },
  ];
}
const GROUPS = [
  { id: 'geo', title: 'Przekrój, wysokość i podparcie', items: [
    { k: 'geom.shape', t: 'sel', l: 'Kształt przekroju', o: () => Object.entries(E.SHAPES), wide: true, re: true },
    ...DIMF(),
    { t: 'hint', h: s => POLY(s) && R && R.g && R.g.isPoly ? `A<sub>c</sub> = ${fmt(R.g.Ac / 1e6, 4)} m², środek ciężkości: x<sub>c</sub> = ${fmt(R.g.xc, 0)}, y<sub>c</sub> = ${fmt(R.g.yc, 0)} mm od lewej i górnej krawędzi; i<sub>y</sub> = ${fmt(R.g.iy, 1)}, i<sub>z</sub> = ${fmt(R.g.iz, 1)}${Math.abs(R.g.Iyz) > 1 ? `, i<sub>min</sub> = ${fmt(R.g.iMin, 1)} mm (oś główna)` : ''} mm` : '' },
    { k: 'geom.L', t: 'num', l: 'Wysokość słupa w świetle l', u: 'm', list: [2.5, 2.8, 3.0, 3.3, 3.5, 4.0, 4.5, 5.0, 6.0, 7.0, 8.0, 10.0], min: 0.5, max: 60 },
    { t: 'sub', l: 'Warunki podparcia i długość wyboczeniowa' },
    { k: 'buck.same', t: 'chk', l: 'Jednakowe w obu płaszczyznach (h i b)', re: true },
    ...buckFields('y'), ...buckFields('z'),
    { t: 'hint', exT: 'Jak wybrać warunki podparcia?', h: () => hintBuck() },
  ] },
  { id: 'mat', title: 'Materiały', items: [
    { k: 'mat.concrete', t: 'sel', l: 'Klasa betonu', o: () => E.CONC_NAMES.map(n => [n, n]) },
    { k: 'mat.steel', t: 'sel', l: 'Stal zbrojenia podłużnego', o: () => E.STEEL_LIST.map(s => [s.id, s.name]), wide: true },
    { k: 'mat.steelW', t: 'sel', l: 'Stal strzemion', o: () => E.STEEL_LIST.map(s => [s.id, s.name]), wide: true },
    { k: 'mat.dg', t: 'sel', l: 'Maks. wymiar kruszywa d_{g}', o: [[8, '8 mm'], [16, '16 mm'], [22, '22 mm'], [32, '32 mm']], num: true },
    { k: 'mat.diag', t: 'sel', l: 'Wykres σ–ε betonu (nośność przekroju)', o: [['parab', 'parabola-prostokąt (3.1.7(1))'], ['rect', 'prostokątny (3.1.7(3))']], wide: true },
    { t: 'hint', h: s => { const m = E.materials(E.normalize(s)); return `f<sub>cd</sub> = ${fmt(m.fcd)} MPa · E<sub>cm</sub> = ${fmt(m.Ecm / 1000, 0)} GPa · E<sub>cd</sub> = E<sub>cm</sub>/γ<sub>cE</sub> = ${fmt(m.Ecd / 1000, 1)} GPa · f<sub>yd</sub> = ${fmt(m.fyd)} MPa · ε<sub>yd</sub> = ${fmt(m.eyd * 1000, 2)}‰ · f<sub>ywd</sub> = ${fmt(m.fywd)} MPa`; } },
  ] },
  { id: 'env', title: 'Środowisko i otulina', items: [
    { k: 'env.exp', t: 'sel', l: 'Klasa ekspozycji (korozja)', o: () => E.EXPOSURES.map(x => [x, `${x} – ${E.EXP_DESC[x]}`]), wide: true },
    { t: 'hint', h: s => `${window.SZN && window.SZN.EXP && window.SZN.EXP[s.env.exp] ? `Np.: ${window.SZN.EXP[s.env.exp]}. ` : ''}<button class="lnk" data-expall="1">przykłady wszystkich klas ekspozycji</button>` },
    { k: 'env.expF', t: 'sel', l: 'Zamrażanie/rozmrażanie', o: [['-', 'brak'], ...['XF1', 'XF2', 'XF3', 'XF4'].map(x => [x, `${x} – ${E.EXP_DESC[x]}`])], wide: true },
    { k: 'env.expA', t: 'sel', l: 'Agresja chemiczna', o: [['-', 'brak'], ...['XA1', 'XA2', 'XA3'].map(x => [x, `${x} – ${E.EXP_DESC[x]}`])], wide: true },
    { k: 'env.life', t: 'sel', l: 'Projektowy okres użytkowania', o: [[50, '50 lat'], [100, '100 lat']], num: true },
    { k: 'env.scSel', t: 'sel', l: 'Klasa konstrukcji', o: [['auto', 'automatycznie (tab. 4.3N)'], ...[1, 2, 3, 4, 5, 6].map(i => ['S' + i, 'S' + i])] },
    { k: 'env.qc', t: 'chk', l: 'Specjalna kontrola jakości produkcji betonu (−1 klasa)' },
    { k: 'env.scRed', t: 'chk', l: 'Obniżenie klasy konstrukcji o 1 za klasę wytrzymałości betonu (tab. 4.3N)' },
    { k: 'env.dcdev', t: 'sel', l: 'Odchyłka wykonawcza Δc_{dev}', o: [[0, '0 mm'], [5, '5 mm'], [10, '10 mm'], [15, '15 mm']], num: true },
    { k: 'env.dcg', t: 'sel', l: 'Δc_{dur,γ} (dodatek bezp.)', o: [[0, '0 mm'], [5, '5 mm'], [10, '10 mm']], num: true },
    { k: 'env.cnomSel', t: 'sel', l: 'Otulina c_{nom} (do strzemion)', o: [['auto', 'automatycznie – wymagana (zaokr. do 5 mm)'], ['manual', 'podana ręcznie']], wide: true, re: true },
    { k: 'env.cnomVal', t: 'num', l: 'Przyjęta otulina c_{nom}', u: 'mm', list: rng(15, 80, 5), min: 0, show: s => s.env.cnomSel === 'manual' },
    { t: 'hint', h: () => R && R.cov ? `Klasa konstrukcji <b>S${R.cov.sc}</b>, c<sub>min,dur</sub> = ${R.cov.cdur} mm, c<sub>min,b</sub> = ${R.cov.cminb_main} mm (pręt) / ${R.cov.cminb_sw} mm (strzemię) → c<sub>nom</sub> wymagane <b>${R.cov.reqR} mm</b>, przyjęto <b>${R.cov.cnom} mm</b>${R.cov.manual && R.cov.cnom < R.cov.reqR ? ' <span style="color:var(--fail)">– mniej niż wymagane</span>' : ''}. Min. klasa betonu: ${R.cov.minCls}.` + (R.cov.redPossible && !R.cov.scRed && R.cov.cdurRed !== null ? ` ℹ Możliwe obniżenie klasy konstrukcji (beton ≥ ${R.cov.thr}): c<sub>min,dur</sub> ${R.cov.cdur} → ${R.cov.cdurRed} mm – zaznacz pole powyżej.` : '') : '' },
  ] },
  { id: 'load', title: 'Obciążenia i kombinacje', items: [
    { k: 'loads.mode', t: 'sel', l: 'Sposób zadania obciążeń', o: [['cases', 'obciążenia charakterystyczne → kombinacje automatycznie (PN-EN 1990)'], ['direct', 'siły obliczeniowe wprost (z programu statycznego)']], wide: true, re: true },
    { k: 'loads.sw', t: 'chk', l: 'Ciężar własny słupa (25 kN/m³) – dodawany do N na wysokości' },
    { k: 'loads.comb', t: 'sel', l: 'Kombinacja SGN (PN-EN 1990)', o: [['610ab', 'wzory 6.10a i 6.10b'], ['610', 'wzór 6.10']], wide: true, show: s => s.loads.mode === 'cases' },
    { k: 'loads.gG', t: 'num', l: 'γ_{G,sup}', list: [1.0, 1.15, 1.35], min: 0, show: s => s.loads.mode === 'cases' || s.loads.sw },
    { k: 'loads.gGinf', t: 'num', l: 'γ_{G,inf} (działanie korzystne)', list: [0.9, 1.0], min: 0, show: s => s.loads.mode === 'cases' },
    { k: 'loads.gQ', t: 'num', l: 'γ_{Q}', list: [0, 1.0, 1.5], min: 0, show: s => s.loads.mode === 'cases' },
    { k: 'loads.xi', t: 'num', l: 'ξ (redukcja obc. stałych w 6.10b)', list: [0.85, 0.9, 1.0], show: s => s.loads.mode === 'cases' && s.loads.comb === '610ab', min: 0 },
    { k: 'loads.rqp', t: 'num', l: 'Stosunek M_{0Eqp}/M_{0Ed} (pełzanie, kombinacja quasi-stała)', list: [0.4, 0.5, 0.6, 0.7, 0.8], min: 0, max: 1.5, show: s => s.loads.mode === 'direct' },
    { k: 'loads.rk', t: 'num', l: 'Siły charakterystyczne / obliczeniowe (SGU)', list: [0.67, 0.7, 0.74, 0.8], min: 0, max: 1, show: s => s.loads.mode === 'direct' },
    { t: 'hint', h: s => s.loads.mode === 'cases' ? 'Obciążenia dodajesz w panelu po prawej („Zestawienie obciążeń”) – kliknij wiersz, aby zmienić wartości. Program tworzy wszystkie kombinacje SGN: każde obciążenie zmienne obecne lub nie, kolejno jako wiodące, obciążenia dwukierunkowe (wiatr) z oboma znakami, ciężar stały z γ<sub>G,sup</sub> i γ<sub>G,inf</sub>.' : 'Siły obliczeniowe z programu statycznego (N i momenty I rzędu na końcach) wpisujesz w tabeli po prawej. Program dodaje imperfekcje, efekty II rzędu i mimośród minimalny. Do SGU siły charakterystyczne przyjmowane są jako ułamek obliczeniowych, a do pełzania – stosunek M<sub>0Eqp</sub>/M<sub>0Ed</sub>.' },
  ] },
  { id: 'sec2', title: 'Smukłość i efekty II rzędu', items: [
    { k: 'sec2.method', t: 'sel', l: 'Metoda analizy II rzędu', o: [['nc', 'nominalnej krzywizny (5.8.8)'], ['ns', 'nominalnej sztywności (5.8.7)'], ['gen', 'ogólna – analiza nieliniowa (5.8.6)']], wide: true, re: true },
    { k: 'sec2.c', t: 'sel', l: 'Współczynnik c (rozkład krzywizny)', o: [['10', '10 (≈ π², zwykle)'], ['9.87', 'π² = 9,87'], ['8', '8 (stały moment I rzędu)'], ['12', '12']], show: s => s.sec2.method === 'nc' },
    { k: 'sec2.nsVar', t: 'sel', l: 'Sztywność nominalna EI', o: [['full', 'wzory (5.21)–(5.22): K_c = k₁k₂/(1+φ_ef), K_s = 1'], ['simple', 'wzór (5.26): K_c = 0,3/(1+0,5φ_ef), K_s = 0 (ρ ≥ 0,01)']], wide: true, show: s => s.sec2.method === 'ns' },
    { k: 'sec2.imp', t: 'sel', l: 'Imperfekcje geometryczne (5.2)', o: [['theta', 'e_i = θ_i·l₀/2 (θ₀ = 1/200, α_h, α_m)'], ['l400', 'e_i = l₀/400 (uproszczenie 5.2(9))'], ['manual', 'e_i podany']], wide: true, re: true },
    { k: 'sec2.ei', t: 'num', l: 'Mimośród niezamierzony e_{i}', u: 'mm', list: [5, 10, 15, 20, 25], min: 0, show: s => s.sec2.imp === 'manual' },
    { k: 'sec2.e0', t: 'chk', l: 'Mimośród minimalny e₀ = max(h/30; 20 mm) (6.1(4))' },
    { k: 'sec2.creep', t: 'sel', l: 'Pełzanie efektywne φ_{ef}', o: [['calc', 'φ_ef = φ(∞,t₀)·M_0Eqp/M_0Ed (5.19)'], ['ignore', 'pomijane, gdy spełnione warunki 5.8.4(4)']], wide: true },
    { k: 'sec2.V2', t: 'chk', l: 'Siła poprzeczna od efektów II rzędu V ≈ π·M₂/l₀ (bezpiecznie)' },
    { k: 'sec2.biax', t: 'sel', l: 'Zginanie ukośne – kryterium decydujące', o: [['539', 'wzór (5.39) – 5.8.9(4)'], ['fiber', 'kontur nośności M_y–M_z (metoda włókien, 6.1)']], wide: true },
    { t: 'hint', h: () => hintSlender() },
  ] },
  { id: 'sls', title: 'Pełzanie i SGU', items: [
    { k: 'sls.phiSel', t: 'sel', l: 'Współczynnik pełzania φ(∞,t₀)', o: [['auto', 'obliczany wg zał. B'], ['manual', 'podany'], ['off', 'pominięty (φ = 0)']], wide: true, re: true },
    { k: 'sls.phi', t: 'num', l: 'φ(∞, t₀)', list: [1.0, 1.5, 2.0, 2.5, 3.0], min: 0, show: s => s.sls.phiSel === 'manual' },
    { k: 'sls.RH', t: 'sel', l: 'Wilgotność względna RH', o: [[40, '40% (ogrzewane wnętrza)'], [50, '50% (wnętrza)'], [60, '60%'], [70, '70%'], [80, '80% (na zewnątrz)'], [90, '90%']], num: true, wide: true, show: s => s.sls.phiSel === 'auto' },
    { k: 'sls.t0', t: 'sel', l: 'Wiek betonu przy obciążeniu t₀', o: [3, 7, 10, 14, 21, 28, 60, 90].map(v => [v, v + ' dni']), num: true, show: s => s.sls.phiSel === 'auto' },
    { k: 'sls.cem', t: 'sel', l: 'Klasa cementu', o: [['S', 'S (wolnowiążący)'], ['N', 'N (normalny)'], ['R', 'R (szybkowiążący)']], show: s => s.sls.phiSel === 'auto' },
    { k: 'sls.check', t: 'chk', l: 'Sprawdzenia SGU: naprężenia (7.2) i szerokość rys (7.3)' },
    { t: 'hint', h: () => R && R.creep ? `φ(∞, t₀) = <b>${fmt(R.creep.phi, 2)}</b>${R.creep.sel === 'auto' ? ` (h₀ = ${fmt(R.creep.h0, 0)} mm, RH = ${R.creep.RH}%, t₀ = ${R.creep.t0} d)` : ''}` : '' },
  ] },
  { id: 'det', title: 'Zbrojenie – strzemiona, zakłady, zakotwienia', items: [
    { k: 'reb.fixD', t: 'sel', l: 'Średnica prętów przy doborze zbrojenia', o: [['', 'automatycznie – najmniejsza masa stali'], ...E.MAIN_DIAS.filter(d => d !== 14).map(d => [String(d), '⌀' + d])], wide: true },
    { k: 'stir.d', t: 'sel', l: 'Średnica strzemion ⌀_{t}', o: [['auto', 'auto: max(6; ⌀/4)'], ...E.TIE_DIAS.map(d => [d, '⌀' + d])], re: true },
    { k: 'stir.s', t: 'num', auto: true, l: 'Rozstaw strzemion s (poza strefami zagęszczenia)', u: 'mm', list: ['auto', 100, 150, 200, 250, 300, 350, 400], ph: 'auto' },
    { k: 'stir.pins', t: 'sel', l: 'Szpilki / strzemiona wewnętrzne', o: [['auto', 'gdzie wymagane (9.5.3(6): ≤ 150 mm)'], ['all', 'przy każdym pręcie'], ['none', 'brak – tylko strzemię obwodowe']], wide: true, re: true, show: s => !ROUND(s) },
    { k: 'det.base', t: 'sel', l: 'Dół słupa', o: [['found', 'fundament – pręty startowe'], ['col', 'słup kondygnacji niższej – zakład nad stropem']], wide: true, re: true },
    { k: 'det.hF', t: 'num', l: 'Wysokość fundamentu h_{F}', u: 'mm', list: [400, 500, 600, 700, 800, 1000, 1200], min: 200, show: s => s.det.base === 'found' },
    { k: 'det.top', t: 'sel', l: 'Góra słupa', o: [['cont', 'pręty przedłużone na zakład do słupa wyżej'], ['anch', 'ostatnia kondygnacja – pręty zakotwione w stropie / belce']], wide: true },
    { k: 'det.hTop', t: 'num', l: 'Grubość stropu / wysokość belki nad słupem', u: 'mm', list: [200, 250, 300, 400, 500, 600, 700], min: 100 },
    { k: 'det.lap', t: 'sel', l: 'Udział prętów łączonych w jednym przekroju', o: [['100', 'wszystkie pręty (α₆ = 1,5)'], ['50', '50% prętów (α₆ = 1,4)']], wide: true },
    { k: 'det.Lmax', t: 'sel', l: 'Maks. długość pręta (handlowa)', o: [[6, '6 m'], [8, '8 m'], [10, '10 m'], [12, '12 m'], [14, '14 m'], [0, 'bez ograniczeń']], num: true },
    { t: 'hint', h: () => R && R.ties && R.lay.n ? `Strzemiona ⌀${R.lay.dt}: s<sub>cl,tmax</sub> = min(20⌀<sub>min</sub>; b; 400) = ${fmt(R.ties.scl, 0)} mm → przyjęto <b>s = ${R.ties.s} mm</b>; przy stropach (na długości ${fmt(R.ties.zB0, 0)} mm) i w strefie zakładu – <b>s = ${R.ties.sRed} mm</b> (≤ 0,6·s<sub>cl,tmax</sub>). Zakład prętów l₀ = <b>${fmt(R.anch.l0, 0)} mm</b> (${R.anch.tension ? 'pręty rozciągane' : 'pręty ściskane'}).` : '' },
  ] },
  { id: 'fire', title: 'Odporność ogniowa (PN-EN 1992-1-2)', items: [
    { k: 'fire.R', t: 'sel', l: 'Wymagana klasa odporności ogniowej', o: [['-', 'nie sprawdzać'], ...Object.keys(E.FIRE_COL).map(k => [k, k])] , re: true },
    { k: 'fire.side', t: 'sel', l: 'Ekspozycja na ogień', o: [['more', 'z więcej niż jednej strony'], ['one', 'z jednej strony (μ_fi ≤ 0,7)']], wide: true, show: s => s.fire.R !== '-' },
    { k: 'fire.eta', t: 'num', l: 'η_{fi} = N_{Ed,fi}/N_{Ed} (2.4.2(3))', list: [0.5, 0.6, 0.65, 0.7], min: 0.1, max: 1, show: s => s.fire.R !== '-' },
    { k: 'fire.muSel', t: 'sel', l: 'Stopień wykorzystania μ_{fi}', o: [['auto', 'obliczany: η_fi·N_Ed/N_Rd'], ['manual', 'podany (np. 0,7 – bezpiecznie)']], wide: true, re: true, show: s => s.fire.R !== '-' },
    { k: 'fire.mu', t: 'num', l: 'μ_{fi}', list: [0.2, 0.5, 0.7], min: 0.05, max: 1, show: s => s.fire.R !== '-' && s.fire.muSel === 'manual' },
    { k: 'fire.l0fiK', t: 'sel', l: 'Długość efektywna w pożarze l_{0,fi}', o: [[0.5, '0,5·l – kondygnacja pośrednia'], [0.7, '0,7·l – kondygnacja najwyższa'], [1.0, '1,0·l']], num: true, wide: true, show: s => s.fire.R !== '-' },
    { t: 'hint', h: () => fireHint() },
  ] },
  { id: 'coef', title: 'Współczynniki i parametry krajowe', closed: true, items: [
    { k: 'coef.gc', t: 'num', l: 'γ_{c}', list: [1.4, 1.5], min: 1 },
    { k: 'coef.gs', t: 'num', l: 'γ_{s}', list: [1.15], min: 1 },
    { k: 'coef.gcE', t: 'num', l: 'γ_{cE} (E_{cd} = E_{cm}/γ_{cE})', list: [1.2], min: 1 },
    { k: 'coef.acc', t: 'num', l: 'α_{cc}', list: [0.85, 1.0], min: 0.5, max: 1 },
    { k: 'coef.phiMin', t: 'num', l: '⌀_{min} prętów podłużnych (9.5.2(1))', u: 'mm', list: [8, 10, 12], min: 6 },
    { k: 'coef.k1', t: 'num', l: 'k₁ (σ_c ≤ k₁f_ck, char.)', list: [0.6], min: 0 },
    { k: 'coef.k2', t: 'num', l: 'k₂ (σ_c ≤ k₂f_ck, q-st.)', list: [0.45], min: 0 },
    { k: 'coef.k3', t: 'num', l: 'k₃ (σ_s ≤ k₃f_yk)', list: [0.8], min: 0 },
    { k: 'coef.eMaxFi', t: 'num', l: 'e_{max}/b w metodzie A (pożar)', list: [0.15, 0.25, 0.5], min: 0 },
  ] },
];
const POP = {
  reb: [
    { k: 'reb.pf', t: 'chk', l: 'Zbrojenie zadane osobno dla każdego boku (góra, dół, lewy, prawy)', re: true, show: RECT },
    { k: 'reb.nb', t: 'sel', l: 'Liczba prętów wzdłuż boku b (z narożnymi)', o: () => rng(2, 12, 1).map(v => [v, String(v)]), num: true, re: true, show: s => RECT(s) && !s.reb.pf },
    { k: 'reb.nh', t: 'sel', l: 'Liczba prętów wzdłuż boku h (z narożnymi)', o: () => rng(2, 12, 1).map(v => [v, String(v)]), num: true, re: true, show: s => RECT(s) && !s.reb.pf },
    { k: 'reb.nc', t: 'sel', l: s => SHP(s) === 'ring' ? 'Liczba prętów – obwód zewnętrzny' : 'Liczba prętów na obwodzie', o: () => rng(4, 40, 1).map(v => [v, String(v)]), num: true, re: true, show: ROUND },
    { k: 'reb.nci', t: 'sel', l: 'Liczba prętów – obwód wewnętrzny', o: () => [[0, 'brak (jedna warstwa)'], ...rng(4, 40, 1).map(v => [v, String(v)])], num: true, re: true, show: s => SHP(s) === 'ring' },
    { k: 'reb.dc', t: 'sel', l: s => ROUND(s) ? 'Średnica prętów' : POLY(s) ? 'Średnica prętów w narożach i przecięciach strzemion' : 'Średnica prętów narożnych', o: () => E.MAIN_DIAS.map(d => [d, '⌀' + d]), num: true, re: true, wide: true },
    { k: 'reb.dm', t: 'sel', l: 'Średnica prętów pośrednich', o: () => E.MAIN_DIAS.map(d => [d, '⌀' + d]), num: true, re: true, show: s => !ROUND(s) && !(RECT(s) && s.reb.pf) },
    ...['top', 'bot', 'lft', 'rgt'].flatMap(q => [
      { k: `reb.fc.${q}.n`, t: 'sel', l: `Bok ${E.FACE_N[q]} – pręty pośrednie (bez narożnych)`, o: () => rng(0, 14, 1).map(v => [v, String(v)]), num: true, re: true, show: s => RECT(s) && s.reb.pf },
      { k: `reb.fc.${q}.d`, t: 'sel', l: `Bok ${E.FACE_N[q]} – średnica`, o: () => E.MAIN_DIAS.map(d => [d, '⌀' + d]), num: true, re: true, show: s => RECT(s) && s.reb.pf && s.reb.fc && s.reb.fc[q].n > 0 }]),
    { k: 'reb.dci', t: 'sel', l: 'Średnica prętów – obwód wewnętrzny', o: () => [[0, 'jak na obwodzie zewnętrznym'], ...E.MAIN_DIAS.map(d => [d, '⌀' + d])], num: true, re: true, show: s => SHP(s) === 'ring' && s.reb.nci > 0 },
    { k: 'reb.sMax', t: 'sel', l: 'Pręty pośrednie na ścianach – rozstaw osiowy ≤', o: [[0, 'brak – tylko naroża i przecięcia strzemion'], [300, '300 mm'], [250, '250 mm'], [200, '200 mm'], [150, '150 mm'], [120, '120 mm'], [100, '100 mm']], num: true, re: true, wide: true, show: POLY },
    { t: 'hint', h: s => POLY(s) && Object.keys(s.reb.edge || {}).length ? `Liczba lub średnica prętów zadana osobno dla ${Object.keys(s.reb.edge).length} krawędzi (kliknięcie krawędzi przekroju). <button class="lnk" data-edgeclr="1">przywróć rozstaw automatyczny</button>` : '' },
    { t: 'hint', h: () => rebHint() },
  ],
  cov: [
    { k: 'env.cnomSel', t: 'sel', l: 'Otulina c_{nom} (do strzemion)', o: [['auto', 'automatycznie – wymagana (zaokr. do 5 mm)'], ['manual', 'podana ręcznie']], wide: true, re: true },
    { k: 'env.cnomVal', t: 'num', l: 'Przyjęta otulina c_{nom}', u: 'mm', list: rng(15, 80, 5), min: 0, show: s => s.env.cnomSel === 'manual' },
    { k: 'env.exp', t: 'sel', l: 'Klasa ekspozycji (korozja)', o: () => E.EXPOSURES.map(x => [x, `${x} – ${E.EXP_DESC[x]}`]), wide: true },
    { k: 'env.dcdev', t: 'sel', l: 'Odchyłka wykonawcza Δc_{dev}', o: [[0, '0 mm'], [5, '5 mm'], [10, '10 mm'], [15, '15 mm']], num: true },
    { t: 'hint', h: () => R && R.cov ? `Klasa konstrukcji <b>S${R.cov.sc}</b>, c<sub>min,dur</sub> = ${R.cov.cdur} mm, c<sub>min,b</sub> = ${R.cov.cminb_main} mm (pręt) / ${R.cov.cminb_sw} mm (strzemię) → c<sub>nom</sub> wymagane <b>${R.cov.reqR} mm</b>, przyjęto <b>${R.cov.cnom} mm</b>${R.cov.manual && R.cov.cnom < R.cov.reqR ? ' <span style="color:var(--fail)">– mniej niż wymagane</span>' : ''}.${R.fire ? ` Odporność ogniowa ${R.fire.R}: odległość osi prętów a = ${fmt(R.fire.a, 0)} mm${R.fire.aReq ? ` (wymagane ≥ ${fmt(R.fire.aReq, 0)} mm)` : ''}.` : ''}` : '' },
  ],
  tie: [
    { k: 'stir.d', t: 'sel', l: 'Średnica strzemion ⌀_{t}', o: [['auto', 'auto: max(6; ⌀/4)'], ...E.TIE_DIAS.map(d => [d, '⌀' + d])], re: true },
    { k: 'stir.s', t: 'num', auto: true, l: 'Rozstaw podstawowy s', u: 'mm', list: ['auto', 100, 150, 200, 250, 300, 350, 400], ph: 'auto' },
    { k: 'stir.pins', t: 'sel', l: 'Szpilki / strzemiona wewnętrzne', o: [['auto', 'gdzie wymagane (≤ 150 mm od pręta utrzymanego)'], ['all', 'przy każdym pręcie'], ['none', 'brak']], wide: true, re: true, show: s => !ROUND(s) },
    { k: 'stir.hookA', t: 'sel', l: 'Haki strzemion', o: [[135, '135° (zalecane)'], [90, '90°']], num: true },
    { t: 'hint', h: () => R && R.ties ? `Wymagane: ⌀<sub>t</sub> ≥ ${fmt(R.ties.dtReq, 1)} mm; s ≤ ${fmt(R.ties.scl, 0)} mm (strefy przy stropach i zakładach ≤ ${fmt(R.ties.sclRed, 0)} mm)${isFinite(R.ties.sShear) ? `; ze ścinania s ≤ ${fmt(R.ties.sShear, 0)} mm` : ''}.` : '' },
  ],
  geo: [
    { k: 'geom.shape', t: 'sel', l: 'Kształt przekroju', o: () => Object.entries(E.SHAPES), wide: true, re: true },
    ...DIMF(),
    { k: 'env.cnomSel', t: 'sel', l: 'Otulina c_{nom}', o: [['auto', 'automatycznie – wymagana'], ['manual', 'podana ręcznie']], wide: true, re: true },
    { k: 'env.cnomVal', t: 'num', l: 'Przyjęta otulina c_{nom}', u: 'mm', list: rng(15, 80, 5), min: 0, show: s => s.env.cnomSel === 'manual' },
  ],
};
POP.schY = [...buckFields('y').map(f => Object.assign({}, f, { show: f.k.endsWith('.sch') || f.k.endsWith('.mode') ? undefined : s => s.buck.y.mode === (f.k.endsWith('beta') ? 'beta' : f.k.endsWith('l0') ? 'l0' : 'k'), l: typeof f.l === 'function' ? f.l(Object.assign({}, S, { buck: { same: true } })) : f.l })), { k: 'buck.same', t: 'chk', l: 'Jednakowe w obu płaszczyznach', re: true }];
POP.schZ = [...buckFields('z').map(f => Object.assign({}, f, { show: f.k.endsWith('.sch') || f.k.endsWith('.mode') ? undefined : s => s.buck.z.mode === (f.k.endsWith('beta') ? 'beta' : f.k.endsWith('l0') ? 'l0' : 'k'), l: typeof f.l === 'function' ? f.l(Object.assign({}, S, { buck: { same: true } })) : f.l })), { k: 'buck.same', t: 'chk', l: 'Jednakowe w obu płaszczyznach', re: true }];

// odporność ogniowa – wynik na bieżąco i podpowiedź, co zmienić (otulina, wymiary przekroju, stopień wykorzystania)
function fireHint() {
  if (!R || !R.fire) return '';
  const F = R.fire, tips = [];
  if (!F.ok) {
    if (F.bmin && F.b < F.bmin) tips.push(`zwiększ mniejszy wymiar przekroju do b ≥ ${F.bmin} mm`);
    if (F.aReq !== null && F.aReq !== undefined && F.a < F.aReq - 1e-6) { const dA = Math.ceil((F.aReq - F.a) / 5) * 5; tips.push(`zwiększ otulinę c<sub>nom</sub> z ${R.cov.cnom} do ≥ ${R.cov.cnom + dA} mm (odległość osi a = ${fmt(F.a, 0)} → ≥ ${fmt(F.aReq, 0)} mm)`); }
    if (F.aReq === null) tips.push('przekrój mniejszy od najmniejszego w tablicy 5.2a – zwiększ wymiary');
    if (S.fire.muSel === 'manual' && S.fire.mu >= 0.5) tips.push('przyjmij μ<sub>fi</sub> obliczany (zwykle mniejszy niż 0,7)');
    if (F.need8 && R.lay.n < 8) tips.push('zastosuj co najmniej 8 prętów');
  }
  return `<span style="color:var(--${F.ok ? 'ok' : 'fail'})">${F.ok ? '✔' : '✖'}</span> ${esc(F.R)}: a = ${fmt(F.a, 0)} mm (oś pręta od krawędzi), μ<sub>fi</sub> = ${fmt(F.mu, 2)}, l<sub>0,fi</sub> = ${fmt(F.l0fi / 1000, 2)} m; ${F.aReq !== null && F.aReq !== undefined ? `tab. 5.2a: a ≥ ${fmt(F.aReq, 0)} mm` : 'poza tab. 5.2a'}; wzór (5.7): R = ${fmt(F.Rcalc, 0)} min → <b style="color:var(--${F.ok ? 'ok' : 'fail'})">${F.ok ? 'spełnione' : 'niespełnione'}</b>${tips.length ? `<br><b>Co zmienić:</b> ${tips.join('; ')}.` : ''}`;
}
// przykłady klas ekspozycji
function expAll() {
  const X = (window.SZN && window.SZN.EXP) || {}, m = $('#modal');
  const rows = [...E.EXPOSURES, 'XF1', 'XF2', 'XF3', 'XF4', 'XA1', 'XA2', 'XA3'].map(c => `<tr><td><b>${c}</b></td><td>${esc(E.EXP_DESC[c] || '')}</td><td>${esc(X[c] || '')}</td></tr>`).join('');
  m.innerHTML = `<div class="dlg norm"><h3>Klasy ekspozycji – przykłady elementów</h3><p>Przykłady orientacyjne (por. PN-EN 1992-1-1, tab. 4.1 i PN-EN 206); o klasie decydują rzeczywiste warunki środowiska słupa.</p><div class="tscroll"><table class="sched exptab"><tr><th>Klasa</th><th>Środowisko</th><th>Przykłady elementów i obiektów</th></tr>${rows}</table></div><div class="dbtn"><button class="btn pri" id="nClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; popRedraw = null; $('#nClose', m).onclick = closeModal;
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('[data-expall]')) { e.preventDefault(); expAll(); } });
function hintBuck() {
  const t = 'Schemat podparcia określa rozkład momentów od obciążeń poziomych (H, q, mimośród) i domyślną długość wyboczeniową l₀ = β·l (rys. 5.7). <b>Układ usztywniony</b> (przegub–przegub, utwierdzenie–przegub, utwierdzenie–utwierdzenie): głowica nie przesuwa się poziomo (stężenia, ściany, trzony) – efekty II rzędu w środkowej części słupa, momenty końcowe bez przyrostu. <b>Układ nieusztywniony</b> (wspornik, utwierdzenie przesuwne): przemieszczenie głowicy swobodne – efekty II rzędu dodają się do momentów na końcach. Przy ramach liczonych programem statycznym podaj podatności węzłów k₁, k₂ = (θ/M)·(EI/l) (0 – utwierdzenie, ∞ – przegub; norma zaleca k ≥ 0,1).';
  if (!R || !R.buck) return ['', t];
  const b = R.buck; const row = d => `${PL(d)}: l₀ = <b>${fmt(b[d].l0 / 1000, 2)} m</b> (β = ${fmt(b[d].beta, 2)}), i = ${fmt(b[d].i, 1)} mm, <b>λ = ${fmt(b[d].lam, 1)}</b>`;
  return [`${row('y')} · ${row('z')} · e<sub>i</sub> = ${fmt(R.imp.y, 1)} / ${fmt(R.imp.z, 1)} mm`, t];
}
function hintSlender() {
  if (!R || !R.res || !R.res.length) return '';
  const g = d => R.res.reduce((a, q) => (q[d].u > a[d].u ? q : a))[d];
  const row = d => { const r = g(d); return `${PL(d)}: λ = ${fmt(r.lam, 1)} ${r.slender ? '>' : '≤'} λ<sub>lim</sub> = ${fmt(r.lamLim, 1)} → ${r.slender ? `<b>M₂ = ${fmt(r.M2 / 1e6, 1)} kNm</b>` : 'efekty II rzędu pomijalne'}, φ<sub>ef</sub> = ${fmt(r.phiEf, 2)}`; };
  return [row('y') + '<br>' + row('z'), 'Smukłość graniczna λ<sub>lim</sub> = 20·A·B·C/√n (5.13N) zależy od pełzania (A), zbrojenia (B), stosunku momentów końcowych (C) i siły względnej n. Gdy λ > λ<sub>lim</sub>, moment obliczeniowy powiększa się o efekty II rzędu wybraną metodą. Wartości dla kombinacji decydującej.'];
}
function rebHint() {
  if (!R || !R.lay) return '';
  const L = R.lay, g = R.g;
  if (!L.n) return 'Brak zbrojenia – użyj „Dobierz zbrojenie” albo wybierz liczbę i średnicę prętów.';
  const clr = L.minClear;
  return `${L.n} prętów, A<sub>s</sub> = <b>${fmt(L.As, 0)} mm²</b>, ρ = ${fmt(L.As / g.Ac * 100, 2)}% (A<sub>s,min</sub> = ${fmt(R.AsMin || 0, 0)}, A<sub>s,max</sub> = ${fmt(0.04 * g.Ac, 0)} mm²); odstęp w świetle ${fmt(clr, 0)} mm ${clr >= L.smin ? '≥' : '<'} ${fmt(L.smin, 0)} mm${!g.circ ? `; szpilki: ${L.pins.length}` : ''}.`;
}

/* ------------------------------------------------------------- formularze */
const exDetails = (ex, t) => ex ? `<details class="exh"><summary>${t || 'Objaśnienie'}</summary><div>${ex}</div></details>` : '';
function hintHTML(f) { const h = f.h(S); if (!h) return ''; if (Array.isArray(h)) return (h[0] || '') + exDetails(h[1], f.exT); return f.ex ? exDetails(h, f.exT) : h; }
const lab = f => sym(typeof f.l === 'function' ? f.l(S) : f.l);
function fieldsHTML(items, gid) {
  let html = '';
  items.forEach((f, i) => {
    if (f.show && !f.show(S)) return;
    const id = `f_${gid}_${i}`;
    if (f.t === 'hint') { const h = hintHTML(f); html += `<div class="hint" data-hint="${gid}_${i}"${h ? '' : ' style="display:none"'}>${h}</div>`; return; }
    if (f.t === 'sub') { html += `<div class="lsub">${sym(f.l)}</div>`; return; }
    if (f.t === 'sel') {
      const v = getP(S, f.k); const opts = typeof f.o === 'function' ? f.o(S) : f.o;
      html += `<div class="row ${f.wide ? 'wide' : ''}"><label for="${id}">${lab(f)}</label><select id="${id}" data-k="${f.k}" data-num="${f.num ? 1 : ''}" data-re="${f.re ? 1 : ''}">${opts.map(([val, l]) => `<option value="${esc(val)}" ${String(val) === String(v === undefined ? '' : v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>${f.wide ? '' : '<span></span>'}</div>`;
    } else if (f.t === 'num') {
      const v = getP(S, f.k);
      html += `<div class="row"><label for="${id}">${lab(f)}</label><div class="combo"><input id="${id}" data-k="${f.k}" value="${esc(showNum(v))}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ''} ${f.auto ? 'data-auto="1"' : ''} data-min="${f.min !== undefined ? f.min : ''}" data-max="${f.max !== undefined ? f.max : ''}" data-re="${f.re ? 1 : ''}" autocomplete="off" spellcheck="false"><button tabindex="-1" data-list="${esc(JSON.stringify(f.list || []))}" aria-label="lista">▾</button></div><span class="unit">${esc(f.u || '')}</span></div>`;
    } else if (f.t === 'chk') {
      html += `<label class="chk"><input type="checkbox" data-k="${f.k}" data-re="${f.re ? 1 : ''}" ${getP(S, f.k) ? 'checked' : ''}><span>${lab(f)}</span></label>`;
    }
  });
  return html;
}
function renderInputs() {
  renderAutoBar();
  const host = $('#inputs'), pane = $('#p-data'), st = pane ? pane.scrollTop : 0;
  const openState = {}; $$('details.grp', host).forEach(d => openState[d.dataset.id] = d.open);
  host.innerHTML = GROUPS.map(G => { const open = openState[G.id] !== undefined ? openState[G.id] : !G.closed; return `<details class="grp" data-id="${G.id}" ${open ? 'open' : ''}><summary>${esc(G.title)}</summary><div class="fields">${fieldsHTML(G.items, G.id)}</div></details>`; }).join('');
  if (pane) pane.scrollTop = st;
  bindInputs(host);
}
function refreshHints() {
  const all = GROUPS.map(G => [G.id, G.items]).concat(Object.entries(POP).map(([k, v]) => ['pop_' + k, v]));
  all.forEach(([gid, items]) => items.forEach((f, i) => {
    if (f.t !== 'hint') return;
    const el = $(`[data-hint="${gid}_${i}"]`); if (!el) return;
    const open = !!el.querySelector('details.exh[open]'), h = hintHTML(f); el.innerHTML = h; el.style.display = h ? '' : 'none'; if (open) { const d = el.querySelector('details.exh'); if (d) d.open = true; }
  }));
}
function bindInputs(host) {
  $$('select[data-k]', host).forEach(el => el.addEventListener('change', () => {
    let v = el.value; if (el.dataset.num) v = parseNum(v);
    setP(S, el.dataset.k, v);
    if (el.dataset.k.startsWith('buck.y') && S.buck.same) S.buck.z = JSON.parse(JSON.stringify(S.buck.y));
    changed(!!el.dataset.re);
  }));
  $$('input[type=checkbox][data-k]', host).forEach(el => el.addEventListener('change', () => {
    if (el.dataset.k === 'reb.pf' && el.checked) { ensurePF(); changed(true); return; }
    setP(S, el.dataset.k, el.checked); if (el.dataset.k === 'buck.same' && el.checked) S.buck.z = JSON.parse(JSON.stringify(S.buck.y)); changed(!!el.dataset.re); }));
  $$('.combo input', host).forEach(el => {
    el.addEventListener('input', () => numInput(el, false));
    el.addEventListener('change', () => numInput(el, true));
    el.addEventListener('keydown', e => { if (e.key === 'ArrowDown' && e.altKey) { openList(el.nextElementSibling); e.preventDefault(); } });
  });
  $$('.combo button', host).forEach(b => b.addEventListener('mousedown', e => { e.preventDefault(); openList(b); }));
}
function numInput(el, final) {
  const raw = el.value.trim(), k = el.dataset.k;
  const min = el.dataset.min !== '' ? parseFloat(el.dataset.min) : null, max = el.dataset.max ? parseFloat(el.dataset.max) : null;
  if (el.dataset.auto && (raw === '' || /^auto/i.test(raw))) { el.classList.remove('bad'); setP(S, k, 'auto'); if (final) el.value = 'auto'; changed(false); return; }
  if (raw === '' && /\.l0$|sec2\.ei/.test(k)) { el.classList.remove('bad'); setP(S, k, ''); changed(false); return; }
  const v = parseNum(raw);
  const bad = v === null || (min !== null && v < min) || (max !== null && v > max);
  el.classList.toggle('bad', bad); if (bad) return;
  setP(S, k, v);
  if (k.startsWith('buck.y') && S.buck.same) S.buck.z = JSON.parse(JSON.stringify(S.buck.y));
  if (final) el.value = showNum(v);
  changed(final && !!el.dataset.re);
}
let popFor = null;
function openList(btn) {
  const pop = $('#pop'); const inp = btn.previousElementSibling;
  if (popFor === inp && pop.style.display === 'block') { closeList(); return; }
  const list = JSON.parse(btn.dataset.list || '[]');
  pop.innerHTML = list.map(v => `<div data-v="${esc(String(v))}" class="${String(v) === String(parseNum(inp.value) ?? inp.value) ? 'cur' : ''}">${v === '' ? (inp.placeholder || '—') : esc(showNum(v))}</div>`).join('');
  const r = inp.parentElement.getBoundingClientRect();
  pop.style.display = 'block'; pop.style.minWidth = r.width + 'px';
  const ph = Math.min(260, pop.scrollHeight), below = window.innerHeight - r.bottom > ph + 6;
  pop.style.left = r.left + 'px'; pop.style.top = (below ? r.bottom + 2 : r.top - ph - 2) + 'px';
  popFor = inp;
  $$('div', pop).forEach(d => d.addEventListener('mousedown', e => { e.preventDefault(); inp.value = showNum(d.dataset.v); numInput(inp, true); closeList(); inp.focus(); }));
}
function closeList() { $('#pop').style.display = 'none'; popFor = null; }
document.addEventListener('mousedown', e => { if (!e.target.closest('#pop') && !e.target.closest('.combo button')) closeList(); });
window.addEventListener('resize', closeList);

/* ----------------------------------------------------------- obliczenia */
let tmr = null, popRedraw = null;
function changed(rerender) {
  dirty = true; updateTitle();
  if (rerender) { renderInputs(); }
  clearTimeout(tmr); tmr = setTimeout(recalc, 60);
  autosave();
}
function recalc() {
  try { R = E.calc(S); } catch (e) { R = { errors: ['Błąd obliczeń: ' + e.message], checks: [], S, res: [] }; console.error(e); }
  U.R = R; U.S = S;
  syncTicks();
  if (selCombo !== null && (!R.res || !R.res[selCombo])) selCombo = null;
  refreshHints();
  renderStatus();
  renderDsum();
  rendered = {};
  renderActive();
  dimQueue();
  if (popRedraw && $('#modal').style.display === 'flex') popRedraw();
}
function renderActive() {
  const t = $('.tabs button.on').dataset.tab;
  if (rendered[t]) return; rendered[t] = true;
  const el = $('#p-' + t);
  try {
    if (t === 'data') renderDataSide();
    else if (t === 'sec') renderSection(el);
    else if (t === 'chart') renderCharts(el);
    else if (t === 'elev') renderElev(el);
    else if (t === 'sum') renderSummary(el);
    else if (t === 'report') renderReport(el);
  } catch (e) { console.error(e); el.insertAdjacentHTML('afterbegin', `<div class="msg err">Błąd rysowania: ${esc(e.message)}</div>`); }
}
const errBox = () => R && R.errors && R.errors.length ? `<div class="msgs">${R.errors.map(e => `<div class="msg err">${esc(e)}</div>`).join('')}</div>` : '';

/* ------------------------------------------------- szybkie sprawdzenia */
const DSUM = [
  ['SGN', 'N + M', x => /^(My|Mz|Nmax|biax|biaxF)$/.test(x.id)],
  ['II rząd', 'smukłość', x => /^(stab|gen|lam140)$/.test(x.id)],
  ['SGN', 'ścinanie', x => /^V/.test(x.id)],
  ['SGU', 'naprężenia, rysy', x => /^(sck|scqp|ssk|wk)$/.test(x.id)],
  ['', 'konstrukcja', x => /^Konstrukcja|^Otulina/.test(x.grp)],
  ['', 'pożar', x => /^Odporność/.test(x.grp)],
];
function dsumHTML() {
  if (!R || !R.checks) return '';
  if (R.errors && R.errors.length) return `<div class="dsum"><span class="dsb fail">✖ błąd danych – wyniki niedostępne</span></div>`;
  let h = '<div class="dsum">';
  if (R.bare) h += `<button class="dsb fail" data-auto="1">✖ <b>brak zbrojenia</b> – dobierz</button>`;
  DSUM.forEach(([a, l, pr], gi) => {
    const cs = R.checks.filter(pr).filter(x => x.status !== 'info'); if (!cs.length) return;
    const st = cs.some(x => x.status === 'fail') ? 'fail' : cs.some(x => x.status === 'warn') ? 'warn' : 'ok';
    const rv = x => isFinite(x.ratio) ? x.ratio : 9.99, w = cs.reduce((p, q) => (rv(q) > rv(p) ? q : p));
    const bad = cs.filter(x => x.status === 'fail').length;
    h += `<button class="dsb ${st}" data-dg="${gi}" title="${esc(w.name.replace(/_\{?([^}]*)\}?/g, '$1'))}${isFinite(w.ratio) ? ' – ' + fmt(w.ratio * 100, 0) + '%' : ''} · kliknij, aby przejść do Podsumowania"><span class="ic">${st === 'fail' ? '✖' : st === 'warn' ? '!' : '✔'}</span>${a ? `<b>${a}</b> ` : ''}${l}<span class="pc">${isFinite(w.ratio) ? fmt(w.ratio * 100, 0) + '%' : '∞'}</span>${bad ? `<span class="nb">${bad}</span>` : ''}</button>`;
  });
  if (R.res && R.res.length) { const sl = DIRS().some(d => R.res.some(q => q[d].slender)); h += `<span class="dsb ${sl ? 'warn' : 'ok'}" style="cursor:default" title="Smukłość λ względem λ_lim"><span class="ic">λ</span>${sl ? 'słup smukły – II rząd' : 'efekty II rzędu pomijalne'}</span>`; }
  return h + '</div>';
}
const DIRS = () => ['y', 'z'];
function renderDsum() {
  $$('#dsum, .dsumx').forEach(el => {
    el.innerHTML = dsumHTML();
    $$('[data-auto]', el).forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); doAutoReb(); }));
    // klik w podgląd wyniku – Podsumowanie, wiersz warunku niespełnionego (albo z uwagą, albo decydującego) z wyróżnieniem
    $$('[data-dg]', el).forEach(b => b.addEventListener('click', () => {
      const pr = DSUM[+b.dataset.dg][2], c = R.checks;
      let i = c.findIndex(x => pr(x) && x.status === 'fail'); if (i < 0) i = c.findIndex(x => pr(x) && x.status === 'warn');
      if (i < 0) { let best = -1; c.forEach((x, j) => { if (pr(x) && x.status !== 'info' && (best < 0 || (isFinite(x.ratio) ? x.ratio : 9) > (isFinite(c[best].ratio) ? c[best].ratio : 9))) best = j; }); i = best; }
      goSum(i);
    }));
  });
  requestAnimationFrame(() => { const x = $$('.pane.on > .dsumx')[0]; if (x && x.offsetHeight) document.documentElement.style.setProperty('--dsh', x.offsetHeight + 'px'); });
}
// przejście do Podsumowania – wiersz sprawdzenia i (wszystkie) wiersze niespełnione wyróżnione
function goSum(i) {
  closeModal(); U.selectTab('sum');
  setTimeout(() => { const tr = $(`#p-sum tr[data-ci="${i}"]`); if (!tr) return; tr.scrollIntoView({ block: 'center' }); flash(tr); const g = $('.goto', tr); if (g) g.focus({ preventScroll: true }); }, 70);
}
function renderStatus() {
  const el = $('#status');
  const set = (cls, txt) => { el.className = cls; el.textContent = txt; };
  if (!R || (R.errors && R.errors.length)) { set('fail', '✖ Błąd danych'); return; }
  const fails = R.checks.filter(c => c.status === 'fail').length, warns = R.checks.filter(c => c.status === 'warn').length;
  if (fails) set('fail', `✖ Niespełnione warunki: ${fails}`);
  else if (warns) set('warn', `✔ Nośność OK · uwagi: ${warns} · η = ${fmt(R.maxUtil * 100, 0)}%`);
  else set('ok', `✔ Wszystkie warunki spełnione · η = ${fmt(R.maxUtil * 100, 0)}%`);
}
function flash(el) { if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 2200); }
U.flash = flash;
// czerwone podświetlenie elementu do zmiany (pole, strefa przekroju) – trwa do kliknięcia poza oknem lub Esc
let hlgT = 0;
function hlg(t) {
  const els = (Array.isArray(t) ? t : [t]).flatMap(x => typeof x === 'string' ? $$(x) : x ? [x] : []);
  els.forEach((el, i) => {
    const box = el.closest && !(el instanceof SVGElement) ? (el.closest('.row, tr, label.chk, .zl') || el) : el;
    if (i === 0 && box.scrollIntoView) box.scrollIntoView({ block: 'center' });
    box.classList.remove('hlg'); void (box.offsetWidth || box.getBBox); box.classList.add('hlg');
  });
  if (els.length) hlgT = Date.now();
  return els.length;
}
const hlgOff = () => $$('.hlg').forEach(x => x.classList.remove('hlg'));
document.addEventListener('pointerdown', e => { if (Date.now() - hlgT < 400) return; if (e.target.closest && e.target.closest('#nmodal .dlg, #modal .dlg')) return; hlgOff(); }, true);
document.addEventListener('keydown', e => { if (e.key === 'Escape') hlgOff(); });
// powiększanie rysunków: Ctrl + kółko – zoom względem kursora (viewBox), przeciąganie – przesuw, dwuklik lub „✕” w rogu – 100%
const ZSVG = new WeakMap();
function zsvgOf(t) {
  let svg = t && t.closest ? t.closest('svg') : null; if (!svg) return null;
  for (let p = svg.parentElement && svg.parentElement.closest('svg'); p; p = p.parentElement && p.parentElement.closest('svg')) svg = p;
  if (svg.closest('button, .nozoom')) return null;
  const r = svg.getBoundingClientRect(); return r.width >= 120 && r.height >= 80 ? svg : null;
}
function zsvgGet(svg) {
  let z = ZSVG.get(svg);
  if (!z) { const vb = svg.viewBox && svg.viewBox.baseVal, r = svg.getBoundingClientRect(); const b = vb && vb.width > 0 ? { x: vb.x, y: vb.y, w: vb.width, h: vb.height } : { x: 0, y: 0, w: +svg.getAttribute('width') || r.width, h: +svg.getAttribute('height') || r.height };
    z = { b, v: Object.assign({}, b), had: svg.hasAttribute('viewBox') }; ZSVG.set(svg, z); }
  return z;
}
function zsvgApply(svg, z) {
  const b = z.b, v = z.v, k = b.w / v.w;
  let ov = svg.querySelector(':scope > g.zsvgov');
  if (k <= 1.001) { z.v = Object.assign({}, b); if (z.had) svg.setAttribute('viewBox', `${b.x} ${b.y} ${b.w} ${b.h}`); else svg.removeAttribute('viewBox'); if (ov) ov.remove(); return; }
  v.x = Math.min(b.x + b.w - v.w, Math.max(b.x, v.x)); v.y = Math.min(b.y + b.h - v.h, Math.max(b.y, v.y));
  svg.setAttribute('viewBox', `${v.x} ${v.y} ${v.w} ${v.h}`);
  if (!ov) { ov = document.createElementNS('http://www.w3.org/2000/svg', 'g'); ov.setAttribute('class', 'zsvgov'); svg.appendChild(ov); }
  const r = svg.getBoundingClientRect(), u = v.w / Math.max(1, r.width), txt = `${Math.round(k * 100)}% ✕`, tw = (txt.length * 6.4 + 10) * u, th = 18 * u;
  ov.innerHTML = `<title>Przywróć widok 100% (albo dwuklik na rysunku)</title><rect x="${v.x + v.w - tw - 4 * u}" y="${v.y + 4 * u}" width="${tw}" height="${th}" rx="${4 * u}" fill="#1d5bb8" fill-opacity="0.88"/><text x="${v.x + v.w - tw / 2 - 4 * u}" y="${v.y + 4 * u + th * 0.68}" font-size="${11 * u}" text-anchor="middle" fill="#fff" font-weight="600">${txt}</text>`;
}
const zsvgReset = svg => { const z = ZSVG.get(svg); if (!z) return; z.v = Object.assign({}, z.b); zsvgApply(svg, z); };
let zsDrag = null;
document.addEventListener('wheel', e => {
  if (!e.ctrlKey) return; const svg = zsvgOf(e.target); if (!svg) return;
  e.preventDefault(); const z = zsvgGet(svg), v = z.v, k0 = z.b.w / v.w, k = Math.max(1, Math.min(10, k0 * Math.exp(-e.deltaY * 0.0022)));
  let pt = null; try { const m = svg.getScreenCTM().inverse(), p0 = svg.createSVGPoint(); p0.x = e.clientX; p0.y = e.clientY; pt = p0.matrixTransform(m); } catch (er) { pt = { x: v.x + v.w / 2, y: v.y + v.h / 2 }; }
  const w2 = z.b.w / k, h2 = z.b.h / k; z.v = { x: pt.x - (pt.x - v.x) * w2 / v.w, y: pt.y - (pt.y - v.y) * h2 / v.h, w: w2, h: h2 };
  zsvgApply(svg, z);
}, { passive: false });
document.addEventListener('pointerdown', e => { if (e.button !== 0) return; const svg = zsvgOf(e.target); if (!svg) return; const z = ZSVG.get(svg); if (!z || z.b.w / z.v.w <= 1.001) return;
  if (e.target.closest('g.zsvgov')) { zsvgReset(svg); e.preventDefault(); return; }
  zsDrag = { svg, z, x0: e.clientX, y0: e.clientY, v0: Object.assign({}, z.v), moved: false }; });
document.addEventListener('pointermove', e => { if (!zsDrag) return; const dx = e.clientX - zsDrag.x0, dy = e.clientY - zsDrag.y0; if (!zsDrag.moved && Math.hypot(dx, dy) < 5) return; zsDrag.moved = true;
  const r = zsDrag.svg.getBoundingClientRect(), u = zsDrag.v0.w / Math.max(1, r.width); zsDrag.z.v = Object.assign({}, zsDrag.v0, { x: zsDrag.v0.x - dx * u, y: zsDrag.v0.y - dy * u }); zsvgApply(zsDrag.svg, zsDrag.z); });
document.addEventListener('pointerup', () => { if (zsDrag && zsDrag.moved) { const stop = ev => { ev.stopPropagation(); ev.preventDefault(); window.removeEventListener('click', stop, true); }; window.addEventListener('click', stop, true); setTimeout(() => window.removeEventListener('click', stop, true), 50); } zsDrag = null; });
document.addEventListener('dblclick', e => { const svg = zsvgOf(e.target); if (!svg) return; const z = ZSVG.get(svg); if (z && z.b.w / z.v.w > 1.001) { e.preventDefault(); e.stopPropagation(); zsvgReset(svg); } }, true);
// znaczniki „sprawdzone”: warunek, który przestał być spełniony – odznaczany; który zaczął być spełniony (lub nowy spełniony) – zaznaczany
const SAT = c => c.status === 'ok' || c.status === 'info';
let prevStat = null;
function syncTicks() {
  if (!R || !R.checks || !R.checks.length || (R.errors && R.errors.length)) return;
  const T = S.meta.ticks = S.meta.ticks || {};
  let ch = false;
  if (!S.meta.ticksInit) {
    Object.keys(T).forEach(k => { if (!R.checks.some(c => c.key === k)) delete T[k]; });
    if (!Object.keys(T).length) R.checks.forEach(c => { if (SAT(c)) T[c.key] = true; });
    S.meta.ticksInit = true; ch = true;
  } else if (prevStat) {
    R.checks.forEach(c => {
      const p = prevStat[c.key], now = SAT(c);
      if ((p === undefined || p === false) && now && !T[c.key]) { T[c.key] = true; ch = true; }
      else if (p === true && !now && T[c.key]) { delete T[c.key]; ch = true; }
    });
  }
  prevStat = {}; R.checks.forEach(c => { prevStat[c.key] = SAT(c); });
  if (ch) autosave();
}
// „pokaż →”: przejście z Podsumowania do miejsca, którego dotyczy warunek – z czerwonym podświetleniem tego, co zmienić
function gotoCheck(c) {
  const id = c.id, at = c.at || {};
  const go = (tab, fn) => { closeModal(); U.selectTab(tab); setTimeout(() => { try { fn && fn(); } catch (e) { console.error(e); } }, 90); };
  const inPop = (open, sels) => { open(); setTimeout(() => { if (!hlg(sels.map(q => '#modal ' + q))) hlg('#modal .dlg'); }, 60); };
  const dat = sels => go('data', () => { $$('#inputs details.grp').forEach(d => { if (sels.some(q => d.querySelector(q.replace('#inputs ', '')))) d.open = true; }); hlg(sels); });
  const barZ = dir => { const L = R.lay, g = R.g; if (g.round) return ['#p-sec .ringz']; if (g.isPoly) return ['#p-sec .facez', '#p-sec .cornz'];
    return dir === 'y' ? ['#p-sec .facez[data-z="f:top"]', '#p-sec .facez[data-z="f:bot"]', '#p-sec .cornz'] : dir === 'z' ? ['#p-sec .facez[data-z="f:lft"]', '#p-sec .facez[data-z="f:rgt"]', '#p-sec .cornz'] : ['#p-sec .facez', '#p-sec .cornz']; };
  const sec = sels => go('sec', () => { if (!hlg(sels)) hlg('#p-sec .rebbar'); });
  const dims = ['#inputs [data-k="geom.b"]', '#inputs [data-k="geom.h"]', '#inputs [data-k="geom.D"]', '#inputs [data-k="geom.pipe.D"]', '#inputs [data-k="geom.pipe.t"]', '#inputs [data-k^="geom.tee"]', '#inputs [data-k^="geom.ang"]'];
  if (R.bare || id === 'bare') return sec(['#sbAuto']);
  if (id === 'cnom') return go('sec', () => inPop(() => covPopup(), ['[data-k="env.cnomSel"]', '[data-k="env.cnomVal"]']));
  if (id === 'minclass') return dat(['#inputs [data-k="mat.concrete"]', '#inputs [data-k="env.exp"]']);
  if (id === 'wall' || id === 'lam140' || id === 'lamP') return dat(dims);
  if (id === 'stab' || id === 'gen' || /^lam/.test(id)) { const d = at.dir || (/płaszczyźnie b/.test(c.name) ? 'z' : 'y'); return dat([`#inputs [data-k="buck.${S.buck.same ? 'y' : d}.sch"]`, `#inputs [data-k="buck.${S.buck.same ? 'y' : d}.mode"]`, ...dims]); }
  if (['My', 'Mz', 'Nmax', 'biax', 'biaxF', 'asmin', 'asmax', 'asmaxl', 'phimin', 'nbars', 'fit'].includes(id)) return sec([...barZ(id === 'My' ? 'y' : id === 'Mz' ? 'z' : ''), '#sbAuto']);
  if (id === 'sp') { const L = R.lay, F = L.faces; if (!R.g.round && !R.g.isPoly && F.top) return sec(['top', 'bot', 'lft', 'rgt'].filter(k => F[k].clear < L.smin - 0.5).map(k => `#p-sec .facez[data-z="f:${k}"]`).concat(L.minClear < L.smin - 0.5 ? ['#p-sec .cornz'] : [])); return sec(barZ('')); }
  if (id === 'tied') return go('sec', () => inPop(() => tiePopup(), ['[data-k="stir.pins"]']));
  if (id === 'vib') return go('sec', () => { hlg(['#vibOn', '#p-sec .inz']); });
  if (id === 'phit') return go('sec', () => inPop(() => tiePopup(), ['[data-k="stir.d"]']));
  if (id === 'st' || id === 'st2' || /^V[yz]$/.test(id)) return go('sec', () => inPop(() => tiePopup(), ['[data-k="stir.s"]', '[data-k="stir.d"]']));
  if (/^Vmax/.test(id)) return dat(dims);
  if (id === 'Lmax') return dat(['#inputs [data-k="det.Lmax"]']);
  if (id === 'anchF') return dat(['#inputs [data-k="det.hF"]', '#inputs [data-k="det.base"]']);
  if (['sck', 'scqp', 'ssk', 'wk'].includes(id)) return sec([...barZ(''), '#p-sec .zdim']);
  if (/^fire/.test(id)) return dat(['#inputs [data-k="fire.R"]', '#inputs [data-k="fire.muSel"]', ...dims, '#inputs [data-k="env.cnomSel"]']);
  return go('sum', () => { const i = R.checks.indexOf(c); const tr = $(`#p-sum tr[data-ci="${i}"]`); if (tr) { tr.scrollIntoView({ block: 'center' }); flash(tr); } });
}
U.gotoCheck = gotoCheck;

/* ---------------------------------------------------- automatyczny dobór */
function renderAutoBar() {
  const el = $('#autobar'); if (!el) return;
  const eta = (S.design && S.design.eta) || 100;
  el.innerHTML = `<div class="autobar"><button class="btn sm" id="adDims" title="Najmniejszy przekrój (co 50 mm, z zachowaniem proporcji h/b) spełniający wszystkie warunki z dobranym zbrojeniem">⚙ Dobierz przekrój</button><button class="btn sm" id="adReb" title="Najmniejsza masa stali przy bieżącym przekroju – wszystkie sprawdzenia spełnione">⚙ Dobierz zbrojenie</button><button class="btn sm pri" id="adAll" title="Przekrój i zbrojenie">⚙ Dobierz wszystko</button><label class="ateta">wytężenie ≤ <input class="txt" id="adEta" value="${eta}" inputmode="decimal"> %</label></div>`;
  $('#adReb').onclick = () => doAutoReb();
  $('#adDims').onclick = () => runDesign(false);
  $('#adAll').onclick = () => runDesign(true);
  $('#adEta').onchange = e => { const v = parseNum(e.target.value); S.design = S.design || {}; S.design.eta = v && v >= 50 && v <= 100 ? v : 100; e.target.value = S.design.eta; dirty = true; autosave(); };
}
const etaOf = () => ((S.design && S.design.eta) || 100) / 100;
function applyResult(newS, msg) { const name = S.meta.name; S = E.normalize(newS); S.meta.name = name; if (COLS) COLS[curC] = S; dirty = true; renderInputs(); recalc(); updateTitle(); autosave(); if (msg) toast(msg, 5000); }
function doAutoReb() {
  toast('Dobór zbrojenia…', 1200);
  setTimeout(() => {
    const t0 = Date.now(); const r = E.autoReb(S, { eta: etaOf() });
    if (r.ok) { const c = r.cand; applyResult(r.S, `Dobrano zbrojenie (${((Date.now() - t0) / 1000).toFixed(1)} s): ${c.n}⌀${c.d}, A_s = ${fmt(c.As, 0)} mm² – wszystkie warunki spełnione.`); }
    else toast(r.msg || 'Nie znaleziono zbrojenia.', 6000);
  }, 30);
}
function runDesign(withReb) {
  const sizes = E.dimCandidates(S); let i = 0, stop = false; const t0 = Date.now();
  const m = $('#modal');
  m.innerHTML = `<div class="dlg sm"><h3>Dobór przekroju</h3><p id="dgMsg">Sprawdzanie przekrojów…</p><div class="prog"><i id="dgBar" style="width:0%"></i></div><div class="dbtn"><button class="btn" id="dgStop">Przerwij</button></div></div>`;
  m.style.display = 'flex'; $('#dgStop').onclick = () => { stop = true; };
  const step = () => {
    if (stop) { m.style.display = 'none'; toast('Przerwano dobór.'); return; }
    if (i >= sizes.length) { m.style.display = 'none'; toast('Nie znaleziono przekroju spełniającego warunki (do 1200 mm).', 5000); return; }
    const sz = sizes[i++];
    $('#dgMsg').textContent = `Sprawdzanie ${sz.D ? '⌀' + sz.D : sz.b + ' × ' + sz.h} mm…`; $('#dgBar').style.width = (i / sizes.length * 100) + '%';
    const r = E.tryDims(S, sz, { eta: etaOf(), dimsOnly: !withReb });
    if (r.ok) {
      m.style.display = 'none';
      const lay = r.R.lay;
      applyResult(r.S, `Dobrano (${((Date.now() - t0) / 1000).toFixed(1)} s): przekrój ${sz.D ? '⌀' + sz.D : sz.b + ' × ' + sz.h} mm` + (withReb ? `, zbrojenie ${lay.n}⌀${lay.dmax}` : ' (zbrojenie bez zmian – sprawdzone doborem)') + '.');
      return;
    }
    setTimeout(step, 0);
  };
  setTimeout(step, 30);
}

/* ------------------------------- dobór w tle: zbrojenie wymagane, ocena wymiarów przekroju */
// po każdej zmianie danych (z przerwą): dobór zbrojenia przy obecnych wymiarach (opis na wykresie M) i najmniejszy przekrój
// spełniający wszystkie warunki (✔ – wymiary wystarczające, ✖ – za małe, ? – większe niż potrzeba; kliknięcie przyjmuje propozycję)
let dimSt = { key: '' }, dimT = 0;
const dimKey = () => JSON.stringify([S.geom, S.buck, S.mat, S.env, S.loads, S.sec2, S.sls, S.stir, S.det, S.fire, S.coef, S.reb.fixD, S.reb.vib, S.reb.vibOn, S.design]);
function dimQueue() {
  if (!R || (R.errors && R.errors.length) || !hasLoads()) { if (dimSt.key) { dimSt = { key: '' }; dimRepaint(); } return; }
  const key = dimKey(); if (dimSt.key === key) { if (dimSt.done) return; } else { dimSt = { key, pend: true }; }
  clearTimeout(dimT); dimT = setTimeout(() => dimRun(key), 450);
}
function dimRun(key) {
  if (dimSt.key !== key) return;
  let a = null; try { a = E.autoReb(S, { eta: etaOf() }); } catch (e) { console.error(e); }
  dimSt.auto = a; dimSt.pend = false; dimRepaint();
  let sizes = []; try { sizes = E.dimCandidates(S); } catch (e) { sizes = []; }
  const curA = R && R.g ? R.g.Ac : Infinity; let i = 0;
  const step = () => {
    if (dimSt.key !== key) return;
    if (i >= sizes.length) { dimSt.done = true; dimSt.dimsDone = true; dimRepaint(); return; }
    const sz = sizes[i++];
    if (a && a.ok && sz.A > curA * 1.0001) { dimSt.done = true; dimSt.dimsDone = true; dimSt.best = null; dimRepaint(); return; }      // obecny przekrój spełnia – mniejszego nie ma
    let r = null; try { r = E.tryDims(S, sz, { eta: etaOf() }); } catch (e) { r = null; }
    if (r && r.ok) { dimSt.best = { sz, lab: E.dimLabel(sz), S: r.S, n: r.R.lay.n, d: r.R.lay.dmax }; dimSt.done = true; dimSt.dimsDone = true; dimRepaint(); return; }
    setTimeout(step, 0);
  };
  setTimeout(step, 20);
}
function dimRepaint() {
  const on = $('.tabs button.on'); if (on && on.dataset.tab === 'data') { rendered.data = false; renderDataSide(); } else rendered.data = false;
  $$('[data-dimst]').forEach(el => { el.outerHTML = dimBadge(); });
}
const sameSz = (sz) => { const G = S.geom; if (sz.D) return G.shape === 'circ' && sz.D === G.D; if (sz.pipe) return G.pipe.D === sz.pipe.D && G.pipe.t === sz.pipe.t; if (sz.tee) return JSON.stringify(sz.tee) === JSON.stringify({ bf: G.tee.bf, hf: G.tee.hf, bw: G.tee.bw, h: G.tee.h }); if (sz.ang) return sz.ang.b === G.ang.b && sz.ang.h === G.ang.h && sz.ang.tb === G.ang.tb && sz.ang.th === G.ang.th; return sz.b === G.b && sz.h === G.h; };
function dimState() {
  if (!dimSt.key || dimSt.key !== dimKey()) return null;
  const a = dimSt.auto; if (!a) return { st: 'pend' };
  if (!dimSt.dimsDone) return { st: a.ok ? 'ok' : 'pend', pend: true };
  const b = dimSt.best;
  if (!a.ok) return b ? { st: 'bad', b } : { st: 'none' };
  if (b && !sameSz(b.sz)) return { st: 'big', b };
  return { st: 'ok' };
}
function dimBadge() {
  const d = dimState(), sh = shapeTxt(S);
  if (!d) return '<span class="dimst" data-dimst="1"></span>';
  if (d.st === 'pend') return `<span class="dimst" data-dimst="1"><i class="dpend" title="Sprawdzanie wymiarów przekroju…"></i></span>`;
  if (d.st === 'ok') return `<span class="dimst ok" data-dimst="1" title="${esc(`Przekrój ${sh} mm – wystarczający${d.pend ? '' : ' i najmniejszy możliwy'}: zbrojenie dobrane dla tych wymiarów spełnia wszystkie warunki.`)}">✔</span>`;
  if (d.st === 'none') return `<span class="dimst bad" data-dimst="1" title="Nie znaleziono przekroju spełniającego wszystkie warunki (do 1200 mm) – zmień schemat, obciążenia lub materiały.">✖</span>`;
  if (d.st === 'bad') return `<span class="dimst bad" data-dimst="1" data-dsug="1" role="button" tabindex="0">✖<span class="dimtip"><b>Przekrój ${esc(sh)} mm – za mały.</b> Przy tych wymiarach nie da się spełnić wszystkich warunków samym zbrojeniem. Proponowany przekrój: <b>${esc(d.b.lab)} mm</b> ze zbrojeniem ${d.b.n}⌀${d.b.d} – kliknij ✖, aby przyjąć.</span></span>`;
  return `<span class="dimst big" data-dimst="1" data-dsug="1" role="button" tabindex="0">?<span class="dimtip"><b>Przekrój ${esc(sh)} mm spełnia wszystkie warunki, ale jest większy niż potrzeba.</b> Wystarczy <b>${esc(d.b.lab)} mm</b> (zbrojenie ${d.b.n}⌀${d.b.d}) – kliknij ?, aby przyjąć; możesz też zostawić obecne wymiary.</span></span>`;
}
function dimSugHTML() {
  const d = dimState(); if (!d || (d.st !== 'bad' && d.st !== 'big')) return '';
  return `<p class="hint keep" style="margin-top:6px">${d.st === 'bad' ? '✖ Przekrój za mały' : '? Przekrój większy niż potrzeba'} – ${d.st === 'bad' ? 'proponowany' : 'wystarczy'} <b>${esc(d.b.lab)} mm</b> (${d.b.n}⌀${d.b.d}). <button class="lnk" data-dsug="1">przyjmij</button></p>`;
}
function applyDimSug() { const d = dimState(); if (!d || !d.b) return; applyResult(d.b.S, `Przyjęto przekrój ${d.b.lab} mm ze zbrojeniem ${d.b.n}⌀${d.b.d}.`); }
// dane do schematu: nośność M_Rd(N_Ed(x)) zbrojenia przyjętego i wymaganego, opis prętów
function schemeExtra(d, ci) {
  const o = {}, res = R.res || []; if (!res.length) return o;
  const oc = ci !== null && ci !== undefined && res[ci] ? res[ci] : res.reduce((a, q) => (q[d].u > a[d].u ? q : a));
  const ms = Dw.momentSeries(R, oc, d), n = ms.tot.length - 1;
  const mrdOf = RR => { const U2 = RR && RR.dirs && RR.dirs[d] && RR.dirs[d].U; if (!U2) return null; const out = []; for (let i = 0; i <= n; i++) { const N = oc.fr.Nat(i / n), v = U2.MRd(N, ms.tot[i] >= 0 ? 1 : -1); out.push(v === null || !isFinite(v) ? 0 : v / 1e6); } return out; };
  if (R.lay.n) { o.mrd = mrdOf(R); o.cur = `${R.lay.n}⌀${R.lay.dmax}${R.lay.dmin !== R.lay.dmax ? '/' + R.lay.dmin : ''}`; }
  const a = dimSt.key === dimKey() ? dimSt.auto : null;
  if (!hasLoads()) return o;
  if (!a) o.prop = { pend: true };
  else if (!a.ok) o.prop = { err: true };
  else { const L2 = a.R.lay; o.prop = { txt: `${L2.n}⌀${L2.dmax}${S.reb.fixD ? '' : ''}` }; if (!R.lay.n || JSON.stringify(a.R.lay.bars.map(b => [b.d, Math.round(b.x), Math.round(b.y)])) !== JSON.stringify(R.lay.bars.map(b => [b.d, Math.round(b.x), Math.round(b.y)]))) o.mrdP = mrdOf(a.R); }
  return o;
}
// wybór średnicy prętów (klik w opis zbrojenia na wykresie M): liczba prętów dobierana do średnicy, wszystkie warunki
let dselList = null;
function dselPopup() {
  const m = $('#modal'), cur = S.reb.fixD ? +S.reb.fixD : 0, DS = E.MAIN_DIAS.filter(d => d >= S.coef.phiMin && d !== 14);
  let ap = false; try { ap = localStorage.getItem('sz.dsApply') !== '0'; } catch (e) { ap = true; }
  const a = dimSt.key === dimKey() ? dimSt.auto : null;
  const key = dimKey(); if (!dselList || dselList.key !== key) dselList = { key, r: {} };
  const row = d => { const r = dselList.r[d]; return `<tr data-dsd="${d}" class="${cur === d ? 'selr' : ''}"><td><b>⌀${d}</b></td><td>${r === undefined ? '<i class="dpend"></i>' : r.ok ? `${r.n}⌀${d}` : '—'}</td><td class="n">${r && r.ok ? fmt(r.As, 0) : ''}</td><td class="n">${r && r.ok ? fmt(r.As * 7.85e-3, 1) : ''}</td><td class="n">${r && r.ok ? fmt(r.eta * 100, 0) + '%' : r ? '<small>nie mieści się / niespełnione</small>' : ''}</td></tr>`; };
  const draw = () => {
    m.innerHTML = `<div class="dlg barpop dselpop"><h3>Średnica prętów podłużnych</h3>
      <p class="hint keep">Obecnie: ${R.lay.n ? `<b>${R.lay.n}⌀${R.lay.dmax}</b> (przyjęte)` : 'brak zbrojenia'}${a && a.ok ? ` · zbrojenie wymagane (${cur ? 'średnica wybrana' : 'najmniejsza masa stali'}): <b>${a.R.lay.n}⌀${a.R.lay.dmax}</b>` : ''}</p>
      <div class="tscroll"><table class="reqt dsel"><thead><tr><th>⌀</th><th>pręty</th><th>A<sub>s</sub> [mm²]</th><th>masa [kg/m]</th><th>η</th></tr></thead><tbody><tr data-dsd="0" class="${cur ? '' : 'selr'}"><td colspan="5"><b>automatycznie</b> – najmniejsza masa stali${a && a.ok && !cur ? `: ${a.R.lay.n}⌀${a.R.lay.dmax}` : ''}</td></tr>${DS.map(row).join('')}</tbody></table></div>
      <p class="hint keep">Liczba prętów dobrana do średnicy tak, aby spełnić wszystkie warunki (SGN, II rząd, A<sub>s,min</sub>, rozstaw prętów 8.2, SGU, pożar) przy wytężeniu ≤ ${fmt(etaOf() * 100, 0)}%. Wybór obowiązuje też w „Dobierz zbrojenie” i w doborze przekroju (Dane → Zbrojenie: „Średnica prętów przy doborze”).</p>
      <label class="chk sm"><input type="checkbox" id="dsApply" ${ap ? 'checked' : ''}><span>Od razu zastosuj w zbrojeniu słupa (zastępuje obecne zbrojenie podłużne)</span></label>
      <div class="dbtn"><span style="flex:1"></span><button class="btn" id="dsCancel">Anuluj</button></div></div>`;
    $('#dsCancel', m).onclick = closeModal;
    $$('tr[data-dsd]', m).forEach(tr => tr.addEventListener('click', () => {
      const d = +tr.dataset.dsd || 0, apply = $('#dsApply', m).checked; try { localStorage.setItem('sz.dsApply', apply ? '1' : '0'); } catch (e) { /* */ }
      const r = d ? dselList.r[d] : null; if (d && r && !r.ok) { toast(`Prętami ⌀${d} nie da się spełnić wszystkich warunków przy tych wymiarach.`, 4000); return; }
      S.reb.fixD = d ? String(d) : ''; closeModal();
      if (apply) { if (r && r.S) applyResult(Object.assign(r.S, { reb: Object.assign({}, r.S.reb, { fixD: S.reb.fixD }) }), `Przyjęto zbrojenie ${r.n}⌀${d}.`); else doAutoReb(); }
      else { dirty = true; renderInputs(); recalc(); autosave(); }
    }));
  };
  draw(); m.style.display = 'flex'; popRedraw = null;
  // obliczenie wariantów (kolejno, w tle)
  let i = 0; const todo = DS.filter(d => dselList.r[d] === undefined);
  const step = () => { if (!$('#modal .dselpop') || dselList.key !== key || i >= todo.length) return; const d = todo[i++];
    try { const T = JSON.parse(JSON.stringify(S)); T.reb.fixD = String(d); const r = E.autoReb(T, { eta: etaOf() }); dselList.r[d] = r.ok ? { ok: true, n: r.R.lay.n, As: r.R.lay.As, eta: r.R.maxUtil, S: r.S } : { ok: false }; } catch (e) { dselList.r[d] = { ok: false }; }
    if ($('#modal .dselpop')) { const cb = $('#dsApply', m), on = cb ? cb.checked : ap; draw(); const cb2 = $('#dsApply', m); if (cb2) cb2.checked = on; }
    setTimeout(step, 0); };
  setTimeout(step, 30);
}
// kliknięcie strzałki obciążenia na schemacie: lista obciążeń z tą składową (albo tabela sił obliczeniowych)
function loadsPick(kind, dir) {
  if (S.loads.mode === 'direct') { const t = $('#dataside table.dt'); if (t) { t.scrollIntoView({ block: 'center' }); flash(t); } return; }
  const key = kind === 'N' ? ['N', 'eh', 'eb'] : kind === 'H' ? [dir === 'y' ? 'Hh' : 'Hb'] : [dir === 'y' ? 'qh' : 'qb'];
  const list = S.loads.items.map((it, i) => ({ it, i })).filter(q => key.some(k => q.it[k]));
  if (list.length === 1) return loadPopup(list[0].i);
  const m = $('#modal');
  m.innerHTML = `<div class="dlg sm"><h3>${kind === 'N' ? 'Siła podłużna' : kind === 'H' ? 'Siła pozioma w głowicy' : 'Obciążenie poziome na wysokości'} – obciążenia</h3><ul class="plist">${(list.length ? list : S.loads.items.map((it, i) => ({ it, i }))).map(q => `<li><div class="pn"><b>${esc(q.it.name || KIND_N[q.it.kind])}</b><small>${KIND_N[q.it.kind]} · ${key.map(k => q.it[k] ? `${k} = ${fmt(q.it[k], 1)}` : '').filter(Boolean).join(', ')}</small></div><button class="btn" data-lo="${q.i}">Zmień…</button></li>`).join('')}</ul><div class="dbtn"><button class="btn" id="lkNew">+ nowe obciążenie</button><span style="flex:1"></span><button class="btn pri" id="lkClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; popRedraw = null;
  $('#lkClose', m).onclick = closeModal;
  $$('[data-lo]', m).forEach(b => b.onclick = () => loadPopup(+b.dataset.lo));
  $('#lkNew', m).onclick = () => { S.loads.items.push(E.normItem(E.newItem(kind === 'N' ? 'perm' : 'wind', { name: kind === 'N' ? 'Obciążenie stałe' : 'Wiatr', N: kind === 'N' ? 100 : 0, pm: kind !== 'N' }))); changed(false); loadPopup(S.loads.items.length - 1); };
}
// podsumowanie obciążeń pod schematem: suma N charakterystycznych, obliczeniowe max/min
function loadSumHTML() {
  if (!R || !R.items || !R.items.length || !R.res || !R.res.length) return '';
  const it = R.items, G = it.filter(q => q.perm && q.kind !== 'sw').reduce((a, q) => a + (+q.N || 0), 0), Q = it.filter(q => !q.perm && q.kind !== 'dir').reduce((a, q) => a + (+q.N || 0), 0), sw = R.g.selfW * R.g.L / 1e3;
  const nmax = R.res.reduce((a, q) => (q.fr.Nbot > a.fr.Nbot ? q : a)), nmin = R.res.reduce((a, q) => (q.fr.Ntop < a.fr.Ntop ? q : a));
  return `<div class="combsum xres"><b>Obciążenia:</b> ${S.loads.mode === 'cases' ? `N<sub>k</sub>: stałe G = ${fmt(G, 0)} kN${S.loads.sw ? ` + ciężar własny ${fmt(sw, 1)} kN` : ''}, zmienne ΣQ = ${fmt(Q, 0)} kN; ` : ''}N<sub>Ed,max</sub> = <b>${fmt(nmax.fr.Nbot / 1e3, 0)} kN</b> (podstawa, ${esc(nmax.c.name)}), N<sub>Ed,min</sub> = ${fmt(nmin.fr.Ntop / 1e3, 0)} kN (głowica, ${esc(nmin.c.name)}); kombinacji SGN: ${R.res.length}${S.loads.mode === 'cases' ? ` – wg wzorów ${S.loads.comb === '610' ? '6.10' : '6.10a i 6.10b'} PN-EN 1990` : ''}.</div>`;
}
// reakcje podpór (siły na fundament) – od każdego obciążenia (charakterystyczne, I rząd) i dla kombinacji (obliczeniowe, z II rzędem)
function reacTableHTML(ci) {
  if (!R || !R.items || !R.res || !R.res.length) return '';
  const n = 40, f1 = v => fmt(v, 1), dd = R.dists, L = R.g.L;
  const rows = R.items.map((it, k) => { const q = dd[k]; const N0 = q.sw ? R.g.selfW * L / 1e3 : q.Ntop / 1e3; return `<tr><td><b>${esc(it.id)}</b> ${esc(it.name || '')}</td><td class="n">${fmt(N0, 1)}</td><td class="n">${q.sw ? '0,0' : f1(q.y.V[0] / 1e3)}</td><td class="n">${q.sw ? '0,0' : f1(q.z.V[0] / 1e3)}</td><td class="n">${q.sw ? '0,0' : f1(q.y.M[0] / 1e6)}</td><td class="n">${q.sw ? '0,0' : f1(q.z.M[0] / 1e6)}</td></tr>`; }).join('');
  const oc = ci !== null && ci !== undefined && R.res[ci] ? R.res[ci] : null;
  const dRow = o => { const v = d => { const ms = Dw.momentSeries(R, o, d), Lm = L / 1000; return { V: (ms.tot[1] - ms.tot[0]) / (Lm / n), M: ms.tot[0] }; }; const y = v('y'), z = v('z'); return `<tr class="tot"><td>${esc(o.c.name)} <small>(obliczeniowe, z e<sub>i</sub> i II rzędem)</small></td><td class="n">${fmt(o.fr.Nbot / 1e3, 1)}</td><td class="n">${f1(y.V)}</td><td class="n">${f1(z.V)}</td><td class="n">${f1(y.M)}</td><td class="n">${f1(z.M)}</td></tr>`; };
  const govs = oc ? [oc] : [...new Set([R.res.reduce((a, q) => (q.fr.Nbot > a.fr.Nbot ? q : a)), R.res.reduce((a, q) => (q.y.u > a.y.u ? q : a)), R.res.reduce((a, q) => (q.z.u > a.z.u ? q : a))])];
  return `<h4 style="margin-top:10px">Reakcje w podstawie słupa (siły na fundament)</h4><div class="tscroll"><table class="ldsum xres"><thead><tr><th>Obciążenie / kombinacja</th><th>N [kN]</th><th>H<sub>h</sub> [kN]</th><th>H<sub>b</sub> [kN]</th><th>M<sub>y</sub> [kNm]</th><th>M<sub>z</sub> [kNm]</th></tr></thead><tbody>${rows}${govs.map(dRow).join('')}</tbody></table></div><p class="hint keep">Wartości charakterystyczne od poszczególnych obciążeń (I rząd) oraz obliczeniowe dla kombinacji ${oc ? 'wybranej' : 'decydujących (N<sub>max</sub>, η<sub>y</sub>, η<sub>z</sub>)'}; M w podstawie – gdy słup jest w niej utwierdzony.</p>`;
}

/* --------------------------------------------------- panel Danych: schemat */
function renderDataSide() {
  const el = $('#dataside'); if (!el) return;
  if (!R || R.errors.length) { el.innerHTML = colTabsHTML() + errBox(); return; }
  const W = Math.max(240, Math.min(340, (el.clientWidth || 640) / 2 - 18));
  const res = R.res || [];
  const ci = selCombo;
  const comboSel = `<select id="dsCombo" class="cmbsel" title="Kombinacja pokazana na schemacie"><option value="">kombinacja decydująca (dla każdej płaszczyzny)</option>${res.map((q, i) => `<option value="${i}" ${ci === i ? 'selected' : ''}>${esc(q.c.name)}</option>`).join('')}</select>`;
  let h = colTabsHTML();
  const SD = [['M', 'M + pręty', 'Momenty M_Ed i nośność M_Rd; opis – zbrojenie wymagane z doboru (kliknij, aby wybrać średnicę)'], ['V', 'V + strzemiona', 'Siła poprzeczna i strefy strzemion'], ['N', 'N', 'Siła podłużna'], ['R', 'reakcje', 'Reakcje podpór – siły na fundament'], ['buck', 'wyboczenie', 'Postać wyboczenia i długość l₀'], ['none', 'bez wykresu', 'Tylko schemat i obciążenia']];
  h += `<div class="box"><div class="schhead"><h4>Schemat statyczny i siły obliczeniowe</h4><div class="seg">${SD.map(([k, l, t]) => `<button class="${schDiag === k ? 'on' : ''}" data-sd="${k}" title="${esc(t)}">${l}</button>`).join('')}</div></div>${comboSel}
    <div class="schpair">${['y', 'z'].map(d => `<div class="schemewrap">${Dw.schemeSVG(R, S, d, Object.assign({ W, H: 470, diag: schDiag, combo: ci === null ? undefined : ci }, schemeExtra(d, ci)))}</div>`).join('')}</div>
    ${loadSumHTML()}
    ${schDiag === 'R' ? reacTableHTML(ci) : ''}
    <p class="hint">Kliknij podporę lub słup, aby zmienić warunki podparcia i długość wyboczeniową w danej płaszczyźnie; strzałkę obciążenia – aby zmienić obciążenie; opis zbrojenia na wykresie M – aby wybrać średnicę prętów; strefę strzemion (widok V) – aby zmienić strzemiona. Wartości – siły obliczeniowe wybranej kombinacji; M<sub>Ed</sub> z imperfekcją e<sub>i</sub> i efektami II rzędu. Ctrl + kółko – powiększenie.</p></div>`;
  h += `<div class="box"><div class="schhead"><h4>Przekrój ${dimBadge()}</h4><span class="hint keep" style="margin:0">kliknij przekrój – zbrojenie, wymiary</span></div><div class="minisec2">${Dw.sectionSVG(R, { W: 220, H: 220, small: true, edit: true })}<div>${secPropsHTML()}${dimSugHTML()}</div></div></div>`;
  h += S.loads.mode === 'cases' ? loadTableHTML() : directTableHTML();
  h += combosBoxHTML();
  el.innerHTML = h;
  bindDataSide(el);
}
function secPropsHTML() {
  const g = R.g, L = R.lay;
  return `<table class="kv"><tr><td>Przekrój</td><td>${esc(shapeTxt(S))} mm</td></tr><tr><td>A<sub>c</sub></td><td>${fmt(g.Ac / 1e6, 4)} m²</td></tr><tr><td>Zbrojenie</td><td>${L.n ? `${L.n}⌀${L.dmax}${L.dmin !== L.dmax ? '/' + L.dmin : ''}` : '—'}</td></tr><tr><td>A<sub>s</sub> / ρ</td><td>${L.n ? `${fmt(L.As, 0)} mm² / ${fmt(L.As / g.Ac * 100, 2)}%` : '—'}</td></tr><tr><td>Strzemiona</td><td>${L.n ? `⌀${L.dt} co ${R.ties.s} / ${R.ties.sRed} mm` : '—'}</td></tr><tr><td>c<sub>nom</sub></td><td>${R.cov.cnom} mm</td></tr><tr><td>λ<sub>y</sub> / λ<sub>z</sub></td><td>${fmt(R.buck.y.lam, 1)} / ${fmt(R.buck.z.lam, 1)}</td></tr></table>`;
}
const KIND_N = { perm: 'stałe', imp: 'użytkowe', snow: 'śnieg', wind: 'wiatr', other: 'zmienne' };
function loadTableHTML() {
  const its = S.loads.items;
  const v = (x, d) => x ? fmt(x, d === undefined ? 1 : d) : '';
  let ids = { perm: 0, var: 0 };
  const rows = its.map((it, i) => {
    const id = it.off ? '–' : it.kind === 'perm' ? 'G' + (++ids.perm) : 'Q' + (++ids.var);
    const Ms = [[it.Myt, it.Myb], [it.Mzt, it.Mzb]].map(([a, b]) => a || b ? `${v(a)} / ${v(b)}` : '').join('</td><td>');
    const Hs = [it.Hh ? `H<sub>h</sub> ${v(it.Hh)}` : '', it.Hb ? `H<sub>b</sub> ${v(it.Hb)}` : '', it.qh ? `q<sub>h</sub> ${v(it.qh, 2)}` : '', it.qb ? `q<sub>b</sub> ${v(it.qb, 2)}` : '', it.eh ? `e<sub>h</sub> ${v(it.eh, 0)}` : '', it.eb ? `e<sub>b</sub> ${v(it.eb, 0)}` : ''].filter(Boolean).join(', ');
    return `<tr data-openload="${i}" class="${it.off ? 'off' : ''}"><td><input type="checkbox" data-loff="${i}" ${it.off ? '' : 'checked'} title="uwzględnij w obliczeniach"></td><td><b>${id}</b></td><td>${esc(it.name || '(bez nazwy)')}<small> · ${KIND_N[it.kind]}${it.kind === 'imp' ? ' ' + it.cat : ''}${it.pm ? ' ±' : ''}</small></td><td class="n">${v(it.N)}</td><td class="n">${Ms}</td><td class="hs">${Hs}</td></tr>`;
  }).join('');
  return `<div class="box"><div class="schhead"><h4>Zestawienie obciążeń (wartości charakterystyczne)</h4></div>
    <div class="tscroll"><table class="ldsum lt"><thead><tr><th></th><th></th><th>Nazwa</th><th>N [kN]</th><th>M<sub>y</sub> góra / dół [kNm]</th><th>M<sub>z</sub> góra / dół [kNm]</th><th>poziome [kN, kN/m, mm]</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="lnone">Brak obciążeń – dodaj je przyciskami poniżej albo <button class="lnk" data-example="1">wczytaj przykład</button>.</td></tr>'}</tbody></table></div>
    <div class="addbar">${[['perm', '+ stałe'], ['imp', '+ użytkowe'], ['snow', '+ śnieg'], ['wind', '+ wiatr'], ['other', '+ inne zmienne']].map(([k, l]) => `<button class="btn sm" data-addl="${k}">${l}</button>`).join('')}</div>
    <p class="hint">Znak momentu: M &gt; 0 – rozciągana krawędź „−” (lewa na schemacie). Momenty tego samego znaku na obu końcach – słup wygięty jednokierunkowo (najniekorzystniej). Siły H, q i mimośród e &gt; 0 – w kierunku „+”. Kliknij wiersz, aby edytować.</p></div>`;
}
function directTableHTML() {
  const rows = S.loads.direct.map((r, i) => `<tr><td><input type="checkbox" data-doff="${i}" ${r.off ? '' : 'checked'}></td><td><input class="txt" data-dr="${i}.name" value="${esc(r.name)}"></td>${['N', 'Myt', 'Myb', 'Mzt', 'Mzb', 'Vy', 'Vz'].map(k => `<td><input class="txt n" data-dr="${i}.${k}" value="${esc(showNum(r[k]))}" ${k[0] === 'V' ? 'placeholder="auto"' : ''}></td>`).join('')}<td><button class="del" data-ddel="${i}" title="Usuń">×</button></td></tr>`).join('');
  return `<div class="box"><div class="schhead"><h4>Siły obliczeniowe (I rzędu, bez imperfekcji)</h4></div><div class="tscroll"><table class="ldsum dt"><thead><tr><th></th><th>Nazwa</th><th>N<sub>Ed</sub> [kN]</th><th>M<sub>y,góra</sub></th><th>M<sub>y,dół</sub></th><th>M<sub>z,góra</sub></th><th>M<sub>z,dół</sub></th><th>V<sub>y</sub></th><th>V<sub>z</sub></th><th></th></tr></thead><tbody>${rows}</tbody></table></div>
  <div class="addbar"><button class="btn sm" id="drAdd">+ kombinacja</button><button class="btn sm" id="drPaste" title="Wklej wiersze z arkusza (kolumny: nazwa, N, My,góra, My,dół, Mz,góra, Mz,dół)">Wklej z arkusza…</button></div>
  <p class="hint">N w głowicy słupa (ściskanie +); momenty w kNm na końcach słupa (M &gt; 0 – rozciągana krawędź „−”); V<sub>y</sub>, V<sub>z</sub> – opcjonalnie (puste: z różnicy momentów). Ciężar własny dodawany z γ<sub>G</sub>.</p></div>`;
}
function combosBoxHTML() {
  const res = R.res || []; if (!res.length) return '';
  const top = res.slice().sort((a, b) => b.u - a.u).slice(0, 6);
  return `<div class="box"><div class="schhead"><h4>Kombinacje decydujące</h4><span class="hint">${res.length} kombinacji SGN${R.combos.capped ? ' (uproszczone)' : ''}</span></div><div class="tscroll"><table class="ldsum"><thead><tr><th>Kombinacja</th><th>N<sub>Ed</sub> [kN]</th><th>M<sub>Ed,y</sub></th><th>M<sub>Ed,z</sub></th><th>η</th></tr></thead><tbody>${top.map(q => `<tr data-selc="${q.ci}" style="cursor:pointer"><td>${esc(q.c.name)}<br><small>${esc(E.comboDesc(q.c, R.items))}</small></td><td class="n">${fmt(q.fr.Nbot / 1e3, 0)}</td><td class="n">${fmt(q.y.MEd / 1e6, 1)}</td><td class="n">${fmt(q.z.MEd / 1e6, 1)}</td><td class="n"><b>${isFinite(q.u) ? fmt(q.u * 100, 0) + '%' : '∞'}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}
function bindDataSide(el) {
  $$('[data-sd]', el).forEach(b => b.onclick = () => { schDiag = b.dataset.sd; rendered.data = false; renderActive(); });
  $$('[data-dsel]', el).forEach(g => g.addEventListener('click', ev => { ev.stopPropagation(); dselPopup(); }));
  $$('.schemesvg .mhit', el).forEach(r => r.addEventListener('click', ev => { const svg = r.closest('svg'), bb = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, py = vb.y + (ev.clientY - bb.top) * vb.height / bb.height, mt = +svg.dataset.mt, hh = +svg.dataset.hh, L = +svg.dataset.l; const z = Math.max(0, Math.min(L, (1 - (py - mt) / hh) * L)); zSecPopup(Math.round(z / 10) * 10); }));
  $$('[data-ld]', el).forEach(g => g.addEventListener('click', ev => { ev.stopPropagation(); loadsPick(g.dataset.ld, g.closest('svg').dataset.dir); }));
  $$('.schemesvg [data-tz]', el).forEach(g => g.addEventListener('click', ev => { ev.stopPropagation(); tiePopup(); }));
  $$('[data-dsug]', el).forEach(b => b.addEventListener('click', ev => { ev.stopPropagation(); applyDimSug(); }));
  const cs = $('#dsCombo', el); if (cs) cs.onchange = () => { selCombo = cs.value === '' ? null : +cs.value; rendered = {}; renderActive(); };
  $$('[data-sch]', el).forEach(g => g.addEventListener('click', () => schPopup(g.dataset.sch)));
  $$('.minisec2 svg', el).forEach(s => s.addEventListener('click', () => rebPopup()));
  $$('[data-openload]', el).forEach(tr => tr.addEventListener('click', e => { if (e.target.closest('input')) return; loadPopup(+tr.dataset.openload); }));
  $$('[data-loff]', el).forEach(cb => cb.addEventListener('change', () => { S.loads.items[+cb.dataset.loff].off = !cb.checked; changed(false); }));
  $$('[data-addl]', el).forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.addl, n = S.loads.items.filter(i => i.kind === k).length + 1;
    const nm = { perm: 'Obciążenie stałe', imp: 'Obciążenie użytkowe', snow: 'Śnieg', wind: 'Wiatr', other: 'Obciążenie zmienne' }[k] + (n > 1 ? ' ' + n : '');
    S.loads.items.push(E.normItem(E.newItem(k, { name: nm, N: k === 'wind' ? 0 : 100, pm: k === 'wind' }))); changed(false); loadPopup(S.loads.items.length - 1);
  }));
  $$('[data-selc]', el).forEach(tr => tr.addEventListener('click', () => { selCombo = +tr.dataset.selc; rendered = {}; renderActive(); }));
  // tabela sił wprost
  $$('[data-dr]', el).forEach(inp => inp.addEventListener('input', () => {
    const [i, k] = inp.dataset.dr.split('.'); const r = S.loads.direct[+i];
    if (k === 'name') { r.name = inp.value; changed(false); return; }
    const raw = inp.value.trim(); if (raw === '' && k[0] === 'V') { r[k] = ''; inp.classList.remove('bad'); changed(false); return; }
    const v = raw === '' ? 0 : parseNum(raw); inp.classList.toggle('bad', v === null); if (v === null) return; r[k] = v; changed(false);
  }));
  $$('[data-doff]', el).forEach(cb => cb.addEventListener('change', () => { S.loads.direct[+cb.dataset.doff].off = !cb.checked; changed(false); }));
  $$('[data-ddel]', el).forEach(b => b.addEventListener('click', () => { S.loads.direct.splice(+b.dataset.ddel, 1); changed(false); rendered.data = false; }));
  const ad = $('#drAdd', el); if (ad) ad.onclick = () => { S.loads.direct.push(E.normRow({ name: `Kombinacja ${S.loads.direct.length + 1}`, N: 1000 })); changed(false); };
  const ps = $('#drPaste', el); if (ps) ps.onclick = () => pastePopup();
  $$('[data-example]', el).forEach(bt => bt.addEventListener('click', e => { e.stopPropagation(); loadExample(); }));
}
async function loadExample() {
  if (dirty && !(await ask('Wczytać przykładowy słup? Bieżące dane tego słupa zostaną zastąpione.', 'Wczytaj przykład'))) return;
  const ex = E.exampleState(); ex.meta.name = S.meta.name && S.meta.name !== 'Słup S-1' ? S.meta.name : ex.meta.name;
  S = E.normalize(ex); if (COLS) COLS[curC] = S; selCombo = null; dirty = true;
  $('#projName').value = S.meta.name; renderInputs(); recalc(); updateTitle(); autosave();
  toast('Wczytano przykład: słup 350 × 350 mm, l = 4,2 m, obciążenia stałe, użytkowe i wiatr, zbrojenie 8⌀20.', 4500);
}
// zbrojenie wymagane dla przekroju bez zbrojenia (najmniejsza masa stali spełniająca wszystkie warunki) – liczone na żądanie, pamiętane
let reqCache = { key: '', r: null };
const reqKey = () => JSON.stringify([S.geom, S.buck, S.mat, S.env, S.loads, S.sec2, S.sls, S.stir, S.det, S.fire, S.coef, S.reb.fixD, S.design]);
const hasLoads = () => S.loads.mode === 'direct' ? S.loads.direct.some(r => !r.off) : S.loads.items.some(i => !i.off);
function reqRebHTML() {
  if (!hasLoads()) return '<div class="msg wrn">Przekrój bez zbrojenia i bez obciążeń. Dodaj obciążenia w zakładce Dane (albo wczytaj przykład) – program pokaże tu zbrojenie wymagane; możesz też zadać pręty ręcznie.</div>';
  return `<div class="msg wrn reqreb" id="reqReb">Przekrój bez zbrojenia podłużnego – obliczanie zbrojenia wymaganego…</div>`;
}
function fillReqReb(el) {
  const box = $('#reqReb', el); if (!box) return;
  const show = r => {
    if (!r.ok) { box.innerHTML = `Przekrój bez zbrojenia podłużnego. <b>Zbrojenia wymaganego nie znaleziono</b>: ${esc(r.msg || '')} – zwiększ przekrój („Dobierz przekrój” w zakładce Dane).`; return; }
    const c = r.cand, L = r.R.lay;
    box.innerHTML = `Przekrój bez zbrojenia podłużnego. <b>Zbrojenie wymagane</b> (najmniejsza masa stali spełniająca wszystkie sprawdzenia przy wytężeniu ≤ ${fmt(etaOf() * 100, 0)}%): <b>${L.n}⌀${c.d}</b>, A<sub>s</sub> = ${fmt(L.As, 0)} mm² (ρ = ${fmt(L.As / r.R.g.Ac * 100, 2)}%), strzemiona ⌀${L.dt}; A<sub>s,min</sub> = ${fmt(r.R.AsMin, 0)} mm², η = ${fmt(r.R.maxUtil * 100, 0)}%. <button class="btn sm pri" id="reqApply">Przyjmij to zbrojenie</button>`;
    $('#reqApply', box).onclick = () => applyResult(r.S, `Przyjęto zbrojenie wymagane: ${L.n}⌀${c.d}.`);
  };
  const k = reqKey(); if (reqCache.key === k && reqCache.r) { show(reqCache.r); return; }
  setTimeout(() => { if (!$('#reqReb')) return; const r = E.autoReb(S, { eta: etaOf() }); reqCache = { key: k, r }; show(r); }, 30);
}
function pastePopup() {
  const m = $('#modal');
  m.innerHTML = `<div class="dlg"><h3>Wklej siły z arkusza</h3><p>Każdy wiersz: <b>nazwa; N; M<sub>y,góra</sub>; M<sub>y,dół</sub>; M<sub>z,góra</sub>; M<sub>z,dół</sub></b> (separator: tabulator, średnik; przecinek dziesiętny dozwolony). Jednostki: kN, kNm.</p><textarea id="psTxt" class="txt" style="width:100%;height:180px;font-family:var(--mono)"></textarea><label class="chk"><input type="checkbox" id="psRep" checked> zastąp istniejące wiersze</label><div class="dbtn"><button class="btn" id="psCan">Anuluj</button><button class="btn pri" id="psOk">Wstaw</button></div></div>`;
  m.style.display = 'flex';
  $('#psCan').onclick = () => { m.style.display = 'none'; };
  $('#psOk').onclick = () => {
    const rows = $('#psTxt').value.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => l.split(/\t|;/).map(s => s.trim()));
    const out = rows.map((c, i) => { const nums = c.map(parseNum); const hasName = nums[0] === null; const o = hasName ? c.slice(1) : c; const n = o.map(parseNum); return E.normRow({ name: hasName ? c[0] : `Kombinacja ${i + 1}`, N: n[0] || 0, Myt: n[1] || 0, Myb: n[2] || 0, Mzt: n[3] || 0, Mzb: n[4] || 0 }); }).filter(r => r.N || r.Myt || r.Mzt);
    if (!out.length) { toast('Nie rozpoznano żadnego wiersza.'); return; }
    if ($('#psRep').checked) S.loads.direct = out; else S.loads.direct.push(...out);
    m.style.display = 'none'; changed(false); toast(`Wstawiono wierszy: ${out.length}.`);
  };
}

/* ------------------------------------------------------------- okna (popupy) */
function closeModal() { $('#modal').style.display = 'none'; popRedraw = null; }
function fieldPopup(title, items, gid, extra, cls) {
  const m = $('#modal');
  const draw = () => {
    const sc = $('.dlg', m) ? $('.dlg', m).scrollTop : 0;
    m.innerHTML = `<div class="dlg fpop ${cls || ''}"><h3>${title}</h3><div class="fields">${fieldsHTML(items, 'pop_' + gid)}</div>${extra ? extra() : ''}<div class="dbtn"><button class="btn pri" id="fpClose">Zamknij</button></div></div>`;
    bindInputs(m); $('#fpClose', m).onclick = closeModal;
    $('.dlg', m).scrollTop = sc;
    if (cls === 'rebpop') { const pv = $('.rbprev', m); if (pv) pv.innerHTML = R && R.g ? Dw.sectionSVG(R, { W: 300, H: 300 }) : ''; }
  };
  popRedraw = () => { if ($('#modal .fpop')) { const ae = document.activeElement, id = ae && ae.id; draw(); if (id && $('#' + id)) { const el = $('#' + id); el.focus(); if (el.setSelectionRange && el.value) try { el.setSelectionRange(el.value.length, el.value.length); } catch (e) { /* */ } } } };
  draw(); m.style.display = 'flex';
}
function rebPopup() { fieldPopup('Zbrojenie podłużne', POP.reb, 'reb', () => `<div class="rbprev"></div><div class="dbtn" style="justify-content:flex-start"><button class="btn sm" id="rbAuto">⚙ Dobierz zbrojenie</button><button class="btn sm" id="rbClr">Wyczyść zbrojenie</button></div>`, 'rebpop');
  const bind = () => { const a = $('#rbAuto'); if (a) a.onclick = () => { closeModal(); doAutoReb(); }; const c = $('#rbClr'); if (c) c.onclick = () => { S.reb.set = false; closeModal(); changed(true); }; };
  bind(); const pr = popRedraw; popRedraw = () => { pr(); bind(); };
  if (!S.reb.set) { S.reb.set = true; changed(false); }
}
function tiePopup() { fieldPopup('Strzemiona', POP.tie, 'tie'); }
function geoPopup() { fieldPopup('Wymiary przekroju i otulina', POP.geo, 'geo', null, 'rebpop'); }
function schPopup(d) { fieldPopup(`Warunki podparcia – płaszczyzna ${PL(d)} (zginanie M<sub>${d}</sub>)`, d === 'y' ? POP.schY : POP.schZ, d === 'y' ? 'schY' : 'schZ', () => R && R.buck ? `<p class="hint">l₀ = <b>${fmt(R.buck[d].l0 / 1000, 2)} m</b>, λ = ${fmt(R.buck[d].lam, 1)}${R.buck[d].eqn ? ` (wzór ${R.buck[d].eqn})` : ''}. ${S.buck.same ? 'Zmiana dotyczy obu płaszczyzn.' : ''}</p>` : '');
  // przy wspólnych warunkach – edycja płaszczyzny z, gdy same=true, przenosi się na y
  if (d === 'z' && S.buck.same) { fieldPopup('Warunki podparcia – obie płaszczyzny', POP.schY, 'schY'); }
}
function loadPopup(i) {
  const it = S.loads.items[i]; if (!it) return;
  const m = $('#modal');
  const f = (k, l, u, w) => `<div class="row"><label>${sym(l)}</label><input class="txt n" data-lk="${k}" value="${esc(showNum(it[k]))}" inputmode="decimal"><span class="unit">${u || ''}</span></div>`;
  const draw = () => {
    m.innerHTML = `<div class="dlg lpop"><h3>Obciążenie – ${esc(it.name || KIND_N[it.kind])}</h3><div class="fields">
      <div class="row wide"><label>Nazwa</label><input class="txt" data-lk="name" value="${esc(it.name)}"></div>
      <div class="row wide"><label>Rodzaj</label><select data-lsel="kind">${[['perm', 'stałe (G)'], ['imp', 'użytkowe (Q)'], ['snow', 'śnieg (Q)'], ['wind', 'wiatr (Q)'], ['other', 'inne zmienne (ψ podane)']].map(([k, l]) => `<option value="${k}" ${it.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
      ${it.kind === 'imp' ? `<div class="row wide"><label>Kategoria (PN-EN 1990, tab. A1.1)</label><select data-lsel="cat">${['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(c => `<option value="${c}" ${it.cat === c ? 'selected' : ''}>${esc(E.PSI[c].name)}</option>`).join('')}</select></div>` : ''}
      ${it.kind === 'snow' ? `<div class="row wide"><label>Lokalizacja</label><select data-lsel="alt"><option value="low" ${it.alt !== 'high' ? 'selected' : ''}>H ≤ 1000 m n.p.m.</option><option value="high" ${it.alt === 'high' ? 'selected' : ''}>H > 1000 m n.p.m.</option></select></div>` : ''}
      ${it.kind === 'other' ? f('p0', 'ψ₀') + f('p1', 'ψ₁') + f('p2', 'ψ₂') : ''}
      ${it.kind !== 'perm' ? `<label class="chk"><input type="checkbox" data-lchk="pm" ${it.pm ? 'checked' : ''}> obciążenie dwukierunkowe (± – np. wiatr): kombinacje z oboma znakami</label>` : ''}
      ${it.kind !== 'perm' ? `<p class="hint">ψ₀ = ${fmt(E.psiOf(it).p0, 2)}, ψ₁ = ${fmt(E.psiOf(it).p1, 2)}, ψ₂ = ${fmt(E.psiOf(it).p2, 2)}</p>` : ''}
      <div class="lsub">Siła podłużna w głowicy</div>${f('N', 'N (ściskanie +)', 'kN')}${tribHTML(it)}${f('eh', 'mimośród e_h (w płaszczyźnie h)', 'mm')}${f('eb', 'mimośród e_b (w płaszczyźnie b)', 'mm')}
      <div class="lsub">Momenty na końcach (z analizy ramy)</div>${f('Myt', 'M_y – głowica', 'kNm')}${f('Myb', 'M_y – podstawa', 'kNm')}${f('Mzt', 'M_z – głowica', 'kNm')}${f('Mzb', 'M_z – podstawa', 'kNm')}
      <div class="lsub">Obciążenia poziome</div>${f('Hh', 'H_h – siła w głowicy (płaszczyzna h)', 'kN')}${f('Hb', 'H_b – siła w głowicy (płaszczyzna b)', 'kN')}${f('qh', 'q_h – na wysokości (płaszczyzna h)', 'kN/m')}${f('qb', 'q_b – na wysokości (płaszczyzna b)', 'kN/m')}
      <p class="hint">Momenty od obciążeń poziomych i mimośrodu liczone są w schemacie podparcia słupa (zakładka Dane, schemat). Siła H w głowicy słupa usztywnionego przechodzi na podporę (bez momentów).</p>
      </div><div class="dbtn"><button class="btn dng" id="lpDel">Usuń obciążenie</button><span style="flex:1"></span><button class="btn pri" id="lpOk">Zamknij</button></div></div>`;
    $$('[data-lk]', m).forEach(inp => inp.addEventListener('input', () => {
      const k = inp.dataset.lk; if (k === 'name') { it.name = inp.value; changed(false); return; }
      const raw = inp.value.trim(), v = raw === '' ? 0 : parseNum(raw); const bad = v === null || (/^p[012]$/.test(k) && (v < 0 || v > 1)); inp.classList.toggle('bad', bad); if (bad) return; it[k] = v; changed(false);
    }));
    $$('[data-lsel]', m).forEach(sl => sl.addEventListener('change', () => { it[sl.dataset.lsel] = sl.value; if (sl.dataset.lsel === 'kind') it.pm = sl.value === 'wind'; changed(false); draw(); }));
    $$('[data-lchk]', m).forEach(cb => cb.addEventListener('change', () => { it[cb.dataset.lchk] = cb.checked; changed(false); }));
    bindTrib(m, it, draw);
    $('#lpOk', m).onclick = closeModal;
    $('#lpDel', m).onclick = async () => { if (await ask(`Usunąć obciążenie „${esc(it.name || '')}”?`, 'Usuń', true)) { S.loads.items.splice(i, 1); changed(false); } };
  };
  draw(); m.style.display = 'flex'; popRedraw = null;
}
// zbieranie obciążenia z pola (PN-EN 1991-1-1): N = w·A·n (·α_n dla obciążeń użytkowych kat. A–D, 6.3.1.2(11))
const QK = { A: 2.0, B: 3.0, C: 5.0, D: 5.0, E: 7.5, F: 2.5, G: 5.0, H: 0.4 };
function tribOf(it) {
  const t = Object.assign({ A: 0, n: 1, w: '', an: true }, it.trib || {});
  const wDef = it.kind === 'imp' ? QK[it.cat] || 3.0 : it.kind === 'snow' ? 1.2 : it.kind === 'perm' ? 6.0 : 0;
  const w = t.w === '' || t.w === undefined ? wDef : +t.w, n = Math.max(1, Math.round(+t.n || 1));
  const p0 = it.kind === 'imp' && E.psiOf ? E.psiOf(it).p0 : 0, anOk = it.kind === 'imp' && /^[ABCD]$/.test(it.cat) && n > 2;
  const an = anOk && t.an ? Math.min(1, (2 + (n - 2) * p0) / n) : 1;
  return { A: +t.A || 0, n, w, wDef, an, anOk, useAn: !!t.an, N: (+t.A || 0) * w * n * an };
}
function tribHTML(it) {
  if (it.kind === 'wind') return '';
  const q = tribOf(it), open = !!(it.trib && it.trib.open);
  return `<details class="exh trib" ${open ? 'open' : ''}><summary>Zbieranie obciążenia z pola (pole × obciążenie × kondygnacje)</summary><div class="fields">
    <div class="row"><label>Pole zbierania A (z jednej kondygnacji)</label><input class="txt n" data-tb="A" value="${esc(showNum(q.A || ''))}" placeholder="np. 30" inputmode="decimal"><span class="unit">m²</span></div>
    <div class="row"><label>${it.kind === 'imp' ? `Obciążenie q<sub>k</sub> (kat. ${esc(it.cat)}: do ${fmt(q.wDef, 1)} kN/m²)` : it.kind === 'snow' ? 'Obciążenie śniegiem s [kN/m²]' : 'Obciążenie g<sub>k</sub> (strop, wykończenie, ścianki)'}</label><input class="txt n" data-tb="w" value="${esc(showNum(it.trib && it.trib.w !== '' && it.trib.w !== undefined ? it.trib.w : ''))}" placeholder="${showNum(q.wDef)}" inputmode="decimal"><span class="unit">kN/m²</span></div>
    <div class="row"><label>Liczba kondygnacji nad słupem n</label><input class="txt n" data-tb="n" value="${q.n}" inputmode="numeric"><span class="unit"></span></div>
    ${it.kind === 'imp' ? `<label class="chk"><input type="checkbox" data-tbc="an" ${q.useAn ? 'checked' : ''} ${q.anOk ? '' : 'disabled'}><span>redukcja α<sub>n</sub> = (2 + (n − 2)ψ₀)/n (PN-EN 1991-1-1, 6.3.1.2(11); kat. A–D, n > 2)${q.anOk ? ` = ${fmt(q.an, 3)}` : ''}</span></label>` : ''}
    <p class="hint keep">N = ${fmt(q.w, 2)} · ${fmt(q.A, 2)} · ${q.n}${q.an < 1 ? ` · ${fmt(q.an, 3)}` : ''} = <b>${fmt(q.N, 1)} kN</b> <button class="btn sm" data-tbset="1" ${q.N > 0 ? '' : 'disabled'}>Przyjmij N = ${fmt(q.N, 1)} kN</button></p></div></details>`;
}
function bindTrib(m, it, redraw) {
  const d = $('details.trib', m); if (!d) return;
  d.addEventListener('toggle', () => { it.trib = Object.assign({}, it.trib || {}, { open: d.open }); });
  $$('[data-tb]', d).forEach(inp => inp.addEventListener('change', () => { const k = inp.dataset.tb, raw = inp.value.trim(); const v = raw === '' ? '' : parseNum(raw); if (v === null) { inp.classList.add('bad'); return; } it.trib = Object.assign({}, it.trib || {}, { [k]: v, open: true }); autosave(); redraw(); }));
  $$('[data-tbc]', d).forEach(cb => cb.addEventListener('change', () => { it.trib = Object.assign({}, it.trib || {}, { an: cb.checked, open: true }); autosave(); redraw(); }));
  const b = $('[data-tbset]', d); if (b) b.onclick = () => { const q = tribOf(it); it.N = +q.N.toFixed(1); changed(false); redraw(); toast(`Przyjęto N = ${fmt(it.N, 1)} kN z pola zbierania.`); };
}
function ask(msg, okLabel, danger) {
  return new Promise(res => {
    const m = $('#modal');
    m.innerHTML = `<div class="dlg sm"><p>${msg}</p><div class="dbtn"><button class="btn" data-a="0">Anuluj</button><button class="btn ${danger ? 'dng' : 'pri'}" data-a="1">${okLabel}</button></div></div>`;
    m.style.display = 'flex';
    const done = v => { m.style.display = 'none'; m.onclick = null; document.removeEventListener('keydown', kd, true); res(v); };
    const kd = e => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } };
    document.addEventListener('keydown', kd, true);
    m.onclick = e => { const b = e.target.closest('[data-a]'); if (b) done(b.dataset.a === '1'); else if (e.target === m) done(false); };
    $('[data-a="1"]', m).focus();
  });
}

/* ------------------------------------------------------ zakładka Przekrój */
function govOf(d) { return R.res.reduce((a, q) => (q[d].u > a[d].u ? q : a)); }
function renderSection(el) {
  if (!R || R.errors.length) { el.innerHTML = errBox(); return; }
  const g = R.g, L = R.lay, T = R.ties;
  const fails = { bars: R.checks.some(c => /^(sp|asmin|asmax|phimin|nbars)$/.test(c.id) && c.status === 'fail'), ties: R.checks.some(c => /^(tied|phit|st|st2)$/.test(c.id) && c.status === 'fail') };
  let h = `<div class="dsumx"></div><div class="h2">Przekrój i zbrojenie <small>${g.round ? 'kliknij obwód z prętami' : g.isPoly ? 'kliknij krawędź (pręty pośrednie tej krawędzi), naroże' : 'kliknij bok przekroju (pręty tylko na tym boku), naroże'}, wnętrze (strzemiona), pas otuliny lub wymiar; klik w pręt – zaznaczenie, Delete – usunięcie</small></div>`;
  const vOn = S.reb.vibOn !== false;
  h += `<div class="rebbar"><button class="btn sm pri" id="sbAuto">⚙ Dobierz zbrojenie</button><button class="btn sm" id="sbReb">Pręty podłużne…</button><button class="btn sm" id="sbTie">Strzemiona…</button><button class="btn sm" id="sbGeo">Wymiary…</button><button class="btn sm" id="sbCov">Otulina…</button><button class="btn sm" id="sbAreas" title="Pola przekroju prętów – tablica">Tablica A<sub>s</sub></button><button class="btn sm" id="sbClr">Wyczyść zbrojenie</button>${!g.round && !g.isPoly ? `<label class="vib vibon" title="Sprawdzaj prześwit na buławę wibratora wewnątrz zbrojenia (8.2(4)); wyłącz przy innym sposobie zagęszczania"><input type="checkbox" id="vibOn" ${vOn ? 'checked' : ''}>Buława wibratora</label><label class="vib${vOn ? '' : ' off'}">⌀ <span class="combo sm2"><input id="vibD" value="${esc(showNum(S.reb.vib))}" inputmode="decimal" ${vOn ? '' : 'disabled'} autocomplete="off"><button tabindex="-1" data-list='[35,40,45,50,55,60,70]' aria-label="lista">▾</button></span> mm</label>` : ''}</div>`;
  if (!L.n) h += reqRebHTML();
  h += `<div class="flex"><div class="box">${Dw.sectionSVG(R, { W: 400, H: 400, edit: true, fail: fails })}</div>${L.n ? '<div class="box xres" style="min-width:320px;flex:1">' : ''}`;
  if (L.n) {
    const clr = L.minClear, far = g.isPoly ? L.far : g.round ? 0 : Math.max(L.faces.b.far, L.faces.h.far);
    const row = (a, req, prov, ok) => `<tr><td>${a}</td><td>${req}</td><td>${prov}</td><td class="${ok ? 'yes' : 'no'}">${ok ? 'TAK' : 'NIE'}</td></tr>`;
    h += `<h4>Zbrojenie podłużne – wymagane i przyjęte</h4><table class="reqt"><thead><tr><th>Warunek</th><th>wymagane</th><th>przyjęte</th><th>spełniony</th></tr></thead><tbody>
      ${row('A<sub>s,min</sub> = max(0,10·N<sub>Ed</sub>/f<sub>yd</sub>; 0,002·A<sub>c</sub>) – 9.5.2(2)', `≥ ${fmt(R.AsMin, 0)} mm²`, `${fmt(L.As, 0)} mm²`, L.As >= R.AsMin - 0.5)}
      ${row('A<sub>s,max</sub> = 0,04·A<sub>c</sub> – 9.5.2(3)', `≤ ${fmt(0.04 * g.Ac, 0)} mm²`, `${fmt(L.As, 0)} mm²`, L.As <= 0.04 * g.Ac + 0.5)}
      ${row('⌀ ≥ ⌀<sub>min</sub> – 9.5.2(1)', `≥ ${S.coef.phiMin} mm`, `⌀${L.dmin}`, L.dmin >= S.coef.phiMin)}
      ${row('odstęp w świetle – 8.2(2)', `≥ ${fmt(L.smin, 0)} mm`, `${fmt(clr, 0)} mm`, clr >= L.smin - 0.5)}
      ${!g.round ? row('pręt ≤ 150 mm od utrzymanego – 9.5.3(6)', '≤ 150 mm', `${fmt(far, 0)} mm`, far <= 150) : ''}
      ${L.core !== undefined && S.reb.vibOn !== false ? row('prześwit na buławę ⌀' + S.reb.vib + ' – 8.2(4)', `≥ ${fmt(S.reb.vib + 10, 0)} mm`, `${fmt(L.core, 0)} mm`, L.core >= S.reb.vib + 10) : ''}
      </tbody></table>
      ${facesTableHTML()}
      <h4 style="margin-top:12px">Strzemiona</h4><table class="reqt"><thead><tr><th>Warunek</th><th>wymagane</th><th>przyjęte</th><th>spełniony</th></tr></thead><tbody>
      ${row('⌀<sub>t</sub> ≥ max(6; ⌀<sub>max</sub>/4) – 9.5.3(1)', `≥ ${fmt(T.dtReq, 1)} mm`, `⌀${L.dt}`, L.dt >= T.dtReq - 1e-9)}
      ${row('s ≤ s<sub>cl,tmax</sub> = min(20⌀<sub>min</sub>; b; 400) – 9.5.3(3)', `≤ ${fmt(T.scl, 0)} mm`, `${T.s} mm`, T.s <= T.scl + 0.5)}
      ${row('przy stropach i zakładach ≤ 0,6·s<sub>cl,tmax</sub> – 9.5.3(4)', `≤ ${fmt(T.sclRed, 0)} mm`, `${T.sRed} mm`, T.sRed <= T.sclRed + 0.5)}
      ${isFinite(T.sShear) ? row('ścinanie: s ≤ A<sub>sw</sub>·z·f<sub>ywd</sub>·cot θ/V<sub>Ed</sub> – 6.2.3', `≤ ${fmt(T.sShear, 0)} mm`, `${T.s} mm`, T.s <= T.sShear + 0.5) : ''}
      </tbody></table>
      <table class="kv" style="margin-top:10px"><tr><td>Ramiona strzemion (ścinanie w płaszczyźnie h / b)</td><td>${g.round ? 2 : L.legs.y} / ${g.round ? 2 : L.legs.z}</td><td></td></tr><tr><td>N<sub>Rd</sub> = A<sub>c</sub>·f<sub>cd</sub> + A<sub>s</sub>·f<sub>yd</sub></td><td>${fmt(R.NRd0 / 1e3, 0)}</td><td>kN</td></tr><tr><td>Stopień zbrojenia ρ / ω</td><td>${fmt(L.As / g.Ac * 100, 2)}% / ${fmt(R.dirs.y.omega, 3)}</td><td></td></tr><tr><td>Odległość osi prętów od krawędzi a</td><td>${fmt(L.a, 0)}</td><td>mm</td></tr></table>`;
  }
  h += L.n ? `</div></div>` : `</div>`;
  if (L.n && R.res.length) {
    h += `<div class="h2" style="margin-top:16px">Stan graniczny przekroju – kombinacja decydująca <small>odkształcenia w stanie granicznym nośności przy N<sub>Ed</sub> (zgodność odkształceń)</small></div><div class="flex">`;
    ['y', 'z'].forEach(d => { const o = govOf(d), s = o[d].gov; h += `<div class="box xres"><h4>Płaszczyzna ${PL(d)} – ${s.key === 'base' ? 'podstawa' : s.key === 'top' ? 'głowica' : 'strefa środkowa'} <small>${esc(o.c.name)}</small></h4>${Dw.strainSVG(R, d, s, { W: 330, H: 300 })}<table class="kv"><tr><td>M<sub>Ed,${d}</sub> / M<sub>Rd,${d}</sub></td><td>${fmt(s.M / 1e6, 1)} / ${fmt(s.MRd / 1e6, 1)}</td><td>kNm (${isFinite(s.u) ? fmt(s.u * 100, 0) : '∞'}%)</td></tr></table></div>`; });
    h += `</div>`;
  }
  el.innerHTML = h; renderDsum();
  if (!L.n) fillReqReb(el);
  $('#sbAuto', el).onclick = () => doAutoReb();
  $('#sbReb', el).onclick = () => rebPopup();
  $('#sbTie', el).onclick = () => tiePopup();
  $('#sbGeo', el).onclick = () => geoPopup();
  $('#sbCov', el).onclick = () => covPopup();
  $('#sbAreas', el).onclick = () => areasPopup();
  $('#sbClr', el).onclick = () => { S.reb.set = false; changed(true); };
  $$('[data-z]', el).forEach(z => z.addEventListener('click', ev => { ev.stopPropagation(); zoneClick(z.dataset.z); }));
  $$('[data-face]', el).forEach(tr => tr.addEventListener('click', () => zoneClick(tr.dataset.face)));
  const vo = $('#vibOn', el), vd = $('#vibD', el);
  if (vo) vo.addEventListener('change', () => { S.reb.vibOn = vo.checked; changed(false); });
  if (vd) { const ap = fin => { const x = parseNum(vd.value), bad = x === null || x < 20 || x > 90; vd.classList.toggle('bad', bad); if (bad) return; if (x !== S.reb.vib) { S.reb.vib = x; changed(false); } if (fin) vd.value = showNum(x); };
    vd.addEventListener('input', () => ap(false)); vd.addEventListener('change', () => ap(true)); vd.nextElementSibling.addEventListener('mousedown', e => { e.preventDefault(); openList(vd.nextElementSibling); }); vd.dataset.k = 'reb.vib'; vd.dataset.min = '20'; vd.dataset.max = '90'; }
  applyFailMarks(el); barSelPaint();
}
// tabela boków przekroju (prostokąt), krawędzi (T, L) i obwodów (okrągły, pierścieniowy) – kliknięcie wiersza: zmiana zbrojenia tego boku
function facesTableHTML() {
  const L = R.lay, g = R.g; if (!L.n) return '';
  const sm = L.smin, ok = v => `<td class="${v ? 'yes' : 'no'}">${v ? 'TAK' : 'NIE'}</td>`;
  let rows = '';
  if (g.round) {
    const F = L.faces.c;
    rows += `<tr data-face="ring:out" class="xclick"><td>obwód${g.ring ? ' zewnętrzny' : ''}</td><td>${S.reb.nc}⌀${S.reb.dc}</td><td>${fmt(F.ctc, 0)}</td><td>${fmt(F.clearOut !== undefined ? F.clearOut : F.clear, 0)}</td>${ok((F.clearOut !== undefined ? F.clearOut : F.clear) >= sm - 0.5)}</tr>`;
    if (g.ring) rows += `<tr data-face="ring:in" class="xclick"><td>obwód wewnętrzny</td><td>${S.reb.nci ? `${S.reb.nci}⌀${S.reb.dci || S.reb.dc}` : '—'}</td><td>${S.reb.nci ? fmt(F.ctcIn, 0) : '—'}</td><td>${S.reb.nci ? fmt(F.clearIn, 0) : '—'}</td>${S.reb.nci ? ok(F.clearIn >= sm - 0.5) : '<td></td>'}</tr>`;
  } else if (g.isPoly) {
    (L.edges || []).forEach((e, i) => { rows += `<tr data-face="e:${e.ei}" class="xclick"><td>krawędź ${i + 1} (${e.hz ? 'pozioma' : 'pionowa'}, ${fmt(e.len, 0)} mm)</td><td>${e.n ? `${e.n}⌀${e.d}` : '—'}${e.man ? ' <small>zadane</small>' : ''}</td><td>${fmt(e.ctc, 0)}</td><td></td><td></td></tr>`; });
  } else {
    E.FACES.forEach(q => { const f = L.faces[q]; rows += `<tr data-face="f:${q}" class="xclick"><td>bok ${E.FACE_N[q]}</td><td>2⌀${S.reb.dc}${f.nm ? ` + ${f.nm}⌀${f.d}` : ''}</td><td>${fmt(f.ctc, 0)}</td><td>${fmt(f.clear, 0)}</td>${ok(f.clear >= sm - 0.5)}</tr>`; });
  }
  return `<h4 style="margin-top:12px">${g.round ? 'Obwody prętów' : g.isPoly ? 'Krawędzie – pręty pośrednie' : 'Boki przekroju'} <small>kliknij wiersz lub ${g.round ? 'obwód' : g.isPoly ? 'krawędź' : 'bok'} na rysunku</small></h4><table class="reqt"><thead><tr><th>${g.round ? 'Obwód' : g.isPoly ? 'Krawędź' : 'Bok'}</th><th>pręty</th><th>rozstaw osiowy [mm]</th><th>w świetle [mm]</th><th>≥ ${fmt(sm, 0)} mm</th></tr></thead><tbody>${rows}</tbody></table>`;
}
function zoneClick(z) {
  if (z === 'bars') return rebPopup();
  if (z === 'ties') return tiePopup();
  if (z === 'dims') return geoPopup();
  if (z === 'cov') return covPopup();
  if (z === 'corner') return cornerPopup();
  if (z.startsWith('f:')) return facePopup(z.slice(2));
  if (z.startsWith('e:')) return edgePopup(+z.slice(2));
  if (z.startsWith('ring:')) return ringPopup(z.slice(5));
}
// zbrojenie zadawane osobno na bokach prostokąta
function ensurePF() { if (S.reb.pf) return; const F = E.rectFaces(Object.assign({}, S, { reb: Object.assign({}, S.reb, { pf: false }) })); S.reb.fc = JSON.parse(JSON.stringify(F)); S.reb.pf = true; }
const OPP = { top: 'bot', bot: 'top', lft: 'rgt', rgt: 'lft' };
let faceApply = 'one';
function miniPop(title, body, onBind, opts) {
  const m = $('#modal'); opts = opts || {};
  const draw = () => {
    const sc = $('.dlg', m) ? $('.dlg', m).scrollTop : 0;
    m.innerHTML = `<div class="dlg fpop rebpop"><h3>${title}</h3>${body()}<div class="rbprev"></div><div class="dbtn">${opts.extra ? opts.extra() : ''}<span style="flex:1"></span><button class="btn pri" id="mpOk">Zamknij</button></div></div>`;
    const pv = $('.rbprev', m); if (pv && R && R.g && !R.errors.length) pv.innerHTML = Dw.sectionSVG(R, { W: 300, H: 300 });
    $('#mpOk', m).onclick = closeModal; $('.dlg', m).scrollTop = sc;
    onBind(m);
  };
  draw(); m.style.display = 'flex'; popRedraw = draw;
}
const selHTML = (id, opts, cur) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(cur) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
function facePopup(k) {
  if (!S.reb.set) { S.reb.set = true; }
  ensurePF(); changed(false);
  miniPop(`Bok ${E.FACE_N[k]} przekroju – pręty pośrednie`, () => {
    const f = S.reb.fc[k], L = R && R.lay && R.lay.faces && R.lay.faces[k];
    return `<div class="fields"><div class="row"><label>Liczba prętów pośrednich na boku (bez narożnych)</label>${selHTML('fpN', rng(0, 14, 1).map(v => [v, String(v)]), f.n)}<span></span></div>
      <div class="row"><label>Średnica prętów pośrednich</label>${selHTML('fpD', E.MAIN_DIAS.map(d => [d, '⌀' + d]), f.d)}<span></span></div>
      <div class="row wide"><label>Zmiana dotyczy</label><div class="seg">${[['one', 'tylko tego boku'], ['opp', 'tego i przeciwległego'], ['all', 'wszystkich boków']].map(([v, l]) => `<button data-fa="${v}" class="${faceApply === v ? 'on' : ''}">${l}</button>`).join('')}</div></div></div>
      <div class="hint keep">${L ? `Bok ${E.FACE_N[k]}: ${L.nm ? `${L.nm}⌀${L.d} + 2 pręty narożne ⌀${S.reb.dc}` : `tylko pręty narożne ⌀${S.reb.dc}`}; rozstaw osiowy ${fmt(L.ctc, 0)} mm, w świetle ${fmt(L.clear, 0)} mm (wymagane ≥ ${fmt(R.lay.smin, 0)} mm${L.clear < R.lay.smin - 0.5 ? ' – <b style="color:var(--fail)">za mało</b>' : ''})${L.far > 150 ? `; pręt w odległości ${fmt(L.far, 0)} mm od utrzymanego – szpilki: zakładka Strzemiona` : ''}.` : ''} Średnicę prętów narożnych zmienisz, klikając naroże przekroju.</div>`;
  }, m => {
    const tg = () => faceApply === 'all' ? E.FACES : faceApply === 'opp' ? [k, OPP[k]] : [k];
    $('#fpN', m).onchange = e => { tg().forEach(q => { S.reb.fc[q].n = +e.target.value; }); changed(false); };
    $('#fpD', m).onchange = e => { tg().forEach(q => { S.reb.fc[q].d = +e.target.value; }); changed(false); };
    $$('[data-fa]', m).forEach(b => b.onclick = () => { faceApply = b.dataset.fa; $$('[data-fa]', m).forEach(x => x.classList.toggle('on', x === b)); });
    const sy = $('#fpSym', m); if (sy) sy.onclick = () => { S.reb.fc[k] = Object.assign({}, S.reb.fc[OPP[k]]); changed(false); };
  }, { extra: () => `<button class="btn" id="fpSym" title="Przyjmij na tym boku zbrojenie boku przeciwległego">Jak bok przeciwległy</button>` });
}
function cornerPopup() {
  if (!S.reb.set) { S.reb.set = true; changed(false); }
  miniPop(POLY(S) ? 'Pręty w narożach i przecięciach strzemion' : 'Pręty narożne', () => `<div class="fields"><div class="row"><label>Średnica prętów ${POLY(S) ? 'w narożach i przecięciach' : 'narożnych (4 szt.)'}</label>${selHTML('cpD', E.MAIN_DIAS.map(d => [d, '⌀' + d]), S.reb.dc)}<span></span></div></div><div class="hint keep">W każdym narożu przekroju co najmniej jeden pręt (9.5.2(4)); pręty narożne są utrzymane strzemieniem.</div>`,
    m => { $('#cpD', m).onchange = e => { S.reb.dc = +e.target.value; changed(false); }; });
}
function edgePopup(ei) {
  miniPop('Krawędź przekroju – pręty pośrednie', () => {
    const e = (R.lay.edges || []).find(q => q.ei === ei) || {}, ov = S.reb.edge[ei] || {};
    return `<div class="fields"><div class="row"><label>Liczba prętów pośrednich na krawędzi</label>${selHTML('epN', [['auto', `auto – rozstaw ≤ ${S.reb.sMax || '—'} mm (${ov.n === undefined ? e.n : '…'})`], ...rng(0, 20, 1).map(v => [v, String(v)])], ov.n === undefined ? 'auto' : ov.n)}<span></span></div>
      <div class="row"><label>Średnica</label>${selHTML('epD', [['auto', `jak pręty pośrednie (⌀${S.reb.dm})`], ...E.MAIN_DIAS.map(d => [d, '⌀' + d])], ov.d || 'auto')}<span></span></div></div>
      <div class="hint keep">Krawędź ${e.hz ? 'pozioma' : 'pionowa'}, długość między prętami utrzymanymi ${fmt(e.len || 0, 0)} mm; teraz ${e.n || 0} prętów pośrednich⌀${e.d || S.reb.dm}, rozstaw osiowy ≤ ${fmt(e.ctc || 0, 0)} mm.</div>`;
  }, m => {
    const set = (k, v) => { const o = Object.assign({}, S.reb.edge[ei] || {}); if (v === 'auto') delete o[k]; else o[k] = +v; if (Object.keys(o).length) S.reb.edge[ei] = o; else delete S.reb.edge[ei]; changed(false); };
    $('#epN', m).onchange = e => set('n', e.target.value); $('#epD', m).onchange = e => set('d', e.target.value);
    const c = $('#epAll', m); if (c) c.onclick = () => { S.reb.edge = {}; changed(false); };
  }, { extra: () => `<button class="btn" id="epAll" title="Usuń ustawienia wszystkich krawędzi – rozstaw prętów wg s_max">Wszystkie krawędzie – auto</button>` });
}
function ringPopup(w) {
  if (!S.reb.set) { S.reb.set = true; changed(false); }
  const inn = w === 'in';
  miniPop(inn ? 'Pręty – obwód wewnętrzny' : SHP(S) === 'ring' ? 'Pręty – obwód zewnętrzny' : 'Pręty na obwodzie', () => `<div class="fields"><div class="row"><label>Liczba prętów</label>${selHTML('rpN', inn ? [[0, 'brak (jedna warstwa)'], ...rng(4, 40, 1).map(v => [v, String(v)])] : rng(4, 40, 1).map(v => [v, String(v)]), inn ? S.reb.nci : S.reb.nc)}<span></span></div>
    <div class="row"><label>Średnica</label>${selHTML('rpD', inn ? [[0, `jak obwód zewnętrzny (⌀${S.reb.dc})`], ...E.MAIN_DIAS.map(d => [d, '⌀' + d])] : E.MAIN_DIAS.map(d => [d, '⌀' + d]), inn ? S.reb.dci : S.reb.dc)}<span></span></div></div>
    <div class="hint keep">${R && R.lay && R.lay.faces && R.lay.faces.c ? `Rozstaw osiowy ${fmt(inn ? R.lay.faces.c.ctcIn || 0 : R.lay.faces.c.ctc, 0)} mm, w świetle ${fmt(inn ? (S.reb.nci ? R.lay.faces.c.clearIn : 0) : (R.lay.faces.c.clearOut !== undefined ? R.lay.faces.c.clearOut : R.lay.faces.c.clear), 0)} mm (wymagane ≥ ${fmt(R.lay.smin, 0)} mm). ` : ''}W słupie okrągłym co najmniej 4 pręty (9.5.2(4)), zalecane ≥ 6.</div>`,
    m => { $('#rpN', m).onchange = e => { S.reb[inn ? 'nci' : 'nc'] = +e.target.value; changed(false); }; $('#rpD', m).onchange = e => { S.reb[inn ? 'dci' : 'dc'] = +e.target.value; changed(false); }; });
}
function covPopup() { fieldPopup('Otulina betonowa', POP.cov, 'cov', null, 'rebpop'); }
// tablica pól przekroju prętów (n × A_s)
function areasPopup() {
  const m = $('#modal'), ds = E.BAR_DIAS.filter(d => d >= 6), need = R && R.AsMin ? R.AsMin : 0;
  const rows = ds.map(d => `<tr><td><b>⌀${d}</b></td>${rng(1, 12, 1).map(n => { const A = n * E.area(d); return `<td class="n ${need && A >= need ? 'ok' : ''}">${fmt(A, 0)}</td>`; }).join('')}<td class="n">${fmt(E.massPerM(d), 3)}</td></tr>`).join('');
  m.innerHTML = `<div class="dlg wide"><h3>Pola przekroju prętów A<sub>s</sub> [mm²]</h3><p class="hint keep">Kolumny – liczba prętów; ${need ? `wyróżnione – pola ≥ A<sub>s,min</sub> = ${fmt(need, 0)} mm² tego słupa; ` : ''}ostatnia kolumna – masa 1 m pręta.</p><div class="tscroll"><table class="sched areas"><thead><tr><th>⌀</th>${rng(1, 12, 1).map(n => `<th>${n}</th>`).join('')}<th>kg/m</th></tr></thead><tbody>${rows}</tbody></table></div><div class="dbtn"><button class="btn pri" id="arClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; $('#arClose', m).onclick = closeModal;
}
// niespełnione warunki → części przekroju podświetlone na czerwono (do kliknięcia)
const zfOff = new Set();
function failMarks() {
  if (!R || !R.checks || R.bare || !R.lay.n) return [];
  const out = new Map(), L = R.lay, g = R.g;
  const add = (sel, c) => { if (!out.has(sel)) out.set(sel, []); out.get(sel).push(c.key); };
  const bars = d => g.round ? ['.ringz'] : g.isPoly ? ['.facez', '.cornz'] : d === 'y' ? ['.facez[data-z="f:top"]', '.facez[data-z="f:bot"]', '.cornz'] : d === 'z' ? ['.facez[data-z="f:lft"]', '.facez[data-z="f:rgt"]', '.cornz'] : ['.facez', '.cornz'];
  R.checks.filter(c => c.status === 'fail').forEach(c => {
    const id = c.id;
    if (id === 'cnom') return add('.covz', c);
    if (['tied', 'st', 'st2', 'phit', 'Vy', 'Vz'].includes(id)) { add('.inz', c); add('.tieh', c); return; }
    if (id === 'sp') { if (!g.round && !g.isPoly) E.FACES.filter(k => L.faces[k].clear < L.smin - 0.5).forEach(k => add(`.facez[data-z="f:${k}"]`, c)); else bars('').forEach(q => add(q, c)); return; }
    if (/^fire/.test(id)) { add('.covz', c); return; }
    if (['My', 'Mz', 'Nmax', 'biax', 'biaxF', 'asmin', 'asmax', 'asmaxl', 'phimin', 'nbars', 'fit', 'wk', 'ssk'].includes(id)) bars(id === 'My' ? 'y' : id === 'Mz' ? 'z' : '').forEach(q => add(q, c));
  });
  return [...out.entries()].map(([sel, ks]) => ({ sel, key: sel + '|' + ks.sort().join(',') }));
}
function applyFailMarks(root) {
  if (!root) return;
  failMarks().forEach(q => { if (zfOff.has(q.key)) return; $$('svg.secedit ' + q.sel, root).forEach(el => { el.classList.add('zfail'); el.dataset.zf = q.key; }); });
}
document.addEventListener('pointerdown', e => { const z = e.target.closest && e.target.closest('.zfail'); if (!z) return; zfOff.add(z.dataset.zf); $$('.zfail').forEach(x => { if (x.dataset.zf === z.dataset.zf) x.classList.remove('zfail'); }); }, true);
// zaznaczanie i usuwanie prętów w przekroju (klik – zaznacz, Ctrl/Shift + klik – kilka, Delete – usuń, Esc – anuluj)
let barSel = [];
function barSelPaint() {
  $$('.barhit.on').forEach(c => c.classList.remove('on')); $$('.barbar').forEach(e => e.remove());
  const svg = $('#p-sec svg.secedit'); if (!svg || !R || !R.lay) { barSel = []; return; }
  barSel = barSel.filter(i => R.lay.bars[i]);
  if (!barSel.length) return;
  barSel.forEach(i => { const c = $(`.barhit[data-bi="${i}"]`, svg); if (c) c.classList.add('on'); });
  const ds = barSel.map(i => { const b = R.lay.bars[i]; return `⌀${b.d}${b.corner ? ' narożny' : ''}`; });
  const bar = document.createElement('div'); bar.className = 'barbar';
  bar.innerHTML = `<span>Zaznaczono ${barSel.length === 1 ? 'pręt' : barSel.length + ' pręty'}: <b>${esc(ds.join(', '))}</b></span><button class="btn sm dng" data-bdel="1" title="Usuń zaznaczone pręty (klawisz Delete)">Usuń (Delete)</button><button class="btn sm" data-besc="1" title="Anuluj zaznaczenie (Esc)">Anuluj</button>`;
  svg.parentElement.insertAdjacentElement('afterend', bar);
}
function deleteSelBars() {
  if (!barSel.length || !R || !R.lay) return;
  const L = R.lay, g = R.g, sel = barSel.map(i => L.bars[i]).filter(Boolean); let n = 0, skip = 0;
  if (g.circ) { const k = Math.min(sel.length, Math.max(0, S.reb.nc - 4)); S.reb.nc -= k; n = k; skip = sel.length - k; }
  else if (g.ring) { const o = sel.filter(b => b.side !== 'in').length, i2 = sel.filter(b => b.side === 'in').length; const ko = Math.min(o, Math.max(0, S.reb.nc - 4)); S.reb.nc -= ko; let ni = S.reb.nci - i2; if (ni > 0 && ni < 4) ni = 0; n = ko + (S.reb.nci - Math.max(0, ni)); S.reb.nci = Math.max(0, ni); skip = sel.length - n; }
  else if (g.isPoly) { const cnt = {}; sel.forEach(b => { if (b.corner || b.edge === undefined) { skip++; return; } cnt[b.edge] = (cnt[b.edge] || 0) + 1; });
    Object.entries(cnt).forEach(([ei, k]) => { const e = (L.edges || []).find(q => q.ei === +ei); const cur = e ? e.n : 0; S.reb.edge[ei] = Object.assign({}, S.reb.edge[ei] || {}, { n: Math.max(0, cur - k) }); n += Math.min(k, cur); }); }
  else { ensurePF(); sel.forEach(b => { if (b.corner || !S.reb.fc[b.side]) { skip++; return; } if (S.reb.fc[b.side].n > 0) { S.reb.fc[b.side].n--; n++; } }); }
  barSel = []; $$('.barbar').forEach(e => e.remove());
  if (n) changed(true);
  toast(n ? `Usunięto ${n} ${n === 1 ? 'pręt' : n < 5 ? 'pręty' : 'prętów'} – pozostałe pręty na boku rozmieszczone równomiernie.${skip ? ` Pręty narożne (lub minimalna liczba prętów na obwodzie) pozostały – wymagane 9.5.2(4).` : ''}` : 'Pręty narożne i minimalna liczba prętów są wymagane (9.5.2(4)) – zmień ich średnicę, klikając naroże.', 4500);
}
document.addEventListener('click', e => {
  const c = e.target.closest && e.target.closest('#p-sec .barhit');
  if (c) { e.preventDefault(); e.stopPropagation(); const bi = +c.dataset.bi, i = barSel.indexOf(bi);
    if (e.ctrlKey || e.metaKey || e.shiftKey) { if (i >= 0) barSel.splice(i, 1); else barSel.push(bi); }
    else barSel = i >= 0 && barSel.length === 1 ? [] : [bi];
    barSelPaint(); return; }
  if (e.target.closest && e.target.closest('[data-bdel]')) { e.preventDefault(); deleteSelBars(); return; }
  if (e.target.closest && e.target.closest('[data-besc]')) { e.preventDefault(); barSel = []; barSelPaint(); return; }
  if (e.target.closest && e.target.closest('[data-edgeclr]')) { e.preventDefault(); S.reb.edge = {}; changed(true); }
}, true);
document.addEventListener('keydown', e => {
  if (!barSel.length) return;
  if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return;
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelBars(); }
  else if (e.key === 'Escape') { barSel = []; barSelPaint(); e.stopPropagation(); }
}, true);

/* --------------------------------------------------------- zakładka Wykresy */
function renderCharts(el) {
  if (!R || R.errors.length || !R.res.length) { el.innerHTML = errBox() || '<p class="hint">Brak kombinacji – dodaj obciążenia.</p>'; return; }
  const res = R.res;
  const oc = d => selCombo !== null ? res[selCombo] : govOf(d);
  let h = `<div class="dsumx"></div><div class="h2">Wykresy i krzywe interakcji <small>kliknij punkt na krzywej interakcji lub wiersz tabeli – wybór kombinacji</small></div>`;
  h += `<div class="rebbar"><span class="ttl">Kombinacja:</span><select id="chCombo"><option value="">decydująca w każdej płaszczyźnie</option>${res.map((q, i) => `<option value="${i}" ${selCombo === i ? 'selected' : ''}>${esc(q.c.name)} – η = ${isFinite(q.u) ? fmt(q.u * 100, 0) : '∞'}%</option>`).join('')}</select></div>`;
  h += `<div class="flex">`;
  ['y', 'z'].forEach(d => { if (R.lay.n) h += `<div class="box">${Dw.interactionSVG(R, d, { W: 430, H: 400, gov: oc(d).ci })}</div>`; });
  h += `</div>`;
  // wykresy na wysokości słupa: kombinacja (wartości obliczeniowe, z imperfekcją i II rzędem) albo pojedyncze obciążenie (wartości charakterystyczne)
  const src = chSrc !== null && R.items[chSrc] ? chSrc : null;
  h += `<div class="rebbar" style="margin-top:14px"><span class="ttl">Wykresy na wysokości:</span><select id="chSrc"><option value="">kombinacja (siły obliczeniowe)</option>${R.items.map((it, k) => `<option value="${k}" ${src === k ? 'selected' : ''}>obciążenie ${esc(it.id)} – ${esc(it.name || '')} (charakterystyczne)</option>`).join('')}</select><button class="btn sm" id="pinClr" style="display:none" title="Usuń wszystkie znaczniki z wykresów (albo prawy przycisk myszy na wykresie)">Usuń znaczniki</button><span class="hint keep" style="margin:0">Najedź kursorem – wartości na danej wysokości na wszystkich wykresach; kliknij – znacznik; kliknij wartość znacznika – jak obliczono; prawy przycisk – usuń znaczniki.</span></div><div class="flex">`;
  const n = 40, Hc = 400;
  if (src === null) {
    ['y', 'z'].forEach(d => {
      const o = oc(d), ms = Dw.momentSeries(R, o, d), r = o[d];
      const mk = r.secs.map(s => ({ xi: s.xi, v: (s.sg || 1) * s.M / 1e6 * (Math.sign(ms.tot[Math.round(s.xi * 40)] || 1) * (s.sg || 1)), l: fmt(s.M / 1e6, 1), c: Dw.C.red }));
      h += `<div class="box">${Dw.heightChart({ W: 270, H: Hc, L: R.g.L, key: 'M' + d, cu: 'kNm', title: `M_${d} – płaszczyzna ${PL(d)} [kNm]`, unit: `M_${d} [kNm]`, series: [{ v: ms.tot, c: Dw.C.red, fill: Dw.C.red, l: 'M_Ed' }, { v: ms.imp, c: Dw.C.warn, dash: '3 3', w: 1.2, l: '+ e_i' }, { v: ms.M0, c: Dw.C.acc, dash: '6 3', w: 1.3, l: 'M₀' }], marks: mk })}
        <table class="kv xres"><tr><td>Kombinacja</td><td colspan="2">${esc(o.c.name)}</td></tr><tr><td>λ / λ<sub>lim</sub></td><td>${fmt(r.lam, 1)} / ${fmt(r.lamLim, 1)}</td><td>${r.slender ? 'smukły' : 'krępy'}</td></tr><tr><td>M<sub>0Ed</sub> / M<sub>2</sub></td><td>${fmt(r.M0Ed / 1e6, 1)} / ${isFinite(r.M2) ? fmt(r.M2 / 1e6, 1) : '∞'}</td><td>kNm</td></tr><tr><td>e<sub>i</sub> / φ<sub>ef</sub></td><td>${fmt(r.ei, 1)} mm / ${fmt(r.phiEf, 2)}</td><td></td></tr></table></div>`;
    });
    // siła poprzeczna (I rząd) i przyrost od II rzędu (pochodna M_Ed)
    { const V = d => { const o = oc(d), ms = Dw.momentSeries(R, o, d), Lm = R.g.L / 1000; const v1 = Array.from(o.fr[d].V).map(x => x / 1e3); const v2 = ms.tot.map((_, i) => { const a = Math.max(0, i - 1), b = Math.min(n, i + 1); return (ms.tot[b] - ms.tot[a]) / ((b - a) / n * Lm); }); return { v1, v2 }; };
      const Vy = V('y'), Vz = V('z');
      h += `<div class="box">${Dw.heightChart({ W: 250, H: Hc, L: R.g.L, key: 'V', cu: 'kN', title: 'V_Ed [kN] – siła poprzeczna', unit: 'V [kN]', series: [{ v: Vy.v2, c: Dw.C.red, l: 'V_h' }, { v: Vz.v2, c: Dw.C.vio, l: 'V_b' }, { v: Vy.v1, c: Dw.C.red, dash: '4 3', w: 1, l: '' }, { v: Vz.v1, c: Dw.C.vio, dash: '4 3', w: 1, l: '' }] })}<p class="hint keep" style="max-width:250px">Linie ciągłe – V = dM<sub>Ed</sub>/dx (z imperfekcją i II rzędem), przerywane – I rząd. Płaszczyzna h – V<sub>h</sub>, b – V<sub>b</sub>.</p></div>`; }
    { const o = selCombo !== null ? res[selCombo] : govOf('y'), fr = o.fr; const Nv = []; for (let i = 0; i <= n; i++) Nv.push(fr.Nat(i / n) / 1e3);
      h += `<div class="box">${Dw.heightChart({ W: 200, H: Hc, L: R.g.L, key: 'N', cu: 'kN', dp: 0, title: 'N_Ed [kN]', unit: 'N [kN]', series: [{ v: Nv, c: Dw.C.vio, fill: Dw.C.vio, l: '' }], sl: 'N_Ed', marks: [{ xi: 0, v: Nv[0], l: fmt(Nv[0], 0), c: Dw.C.vio }, { xi: 1, v: Nv[n], l: fmt(Nv[n], 0), c: Dw.C.vio }] })}</div>`; }
    // mimośród dodatkowy (imperfekcja + II rząd): e = (M_Ed − M₀)/N_Ed
    { const e = d => { const o = oc(d), ms = Dw.momentSeries(R, o, d); return ms.tot.map((m, i) => { const N = o.fr.Nat(i / n); return N > 1 ? Math.abs(m - ms.M0[i]) * 1e6 / N : 0; }); };
      h += `<div class="box">${Dw.heightChart({ W: 230, H: Hc, L: R.g.L, key: 'e', cu: 'mm', title: 'e_i + e_2 [mm] – wygięcie', unit: 'e [mm]', series: [{ v: e('y'), c: Dw.C.red, l: 'e_h' }, { v: e('z'), c: Dw.C.vio, l: 'e_b' }] })}<p class="hint keep" style="max-width:230px">Mimośród dodatkowy (M<sub>Ed</sub> − M<sub>0</sub>)/N<sub>Ed</sub>: imperfekcja e<sub>i</sub> i ugięcie II rzędu e<sub>2</sub> w każdej płaszczyźnie.</p></div>`; }
  } else {
    const it = R.items[src], dd = R.dists[src];
    const Mk = d => dd.sw ? new Array(n + 1).fill(0) : Array.from(dd[d].M).map(v => v / 1e6), Vk = d => dd.sw ? new Array(n + 1).fill(0) : Array.from(dd[d].V).map(v => v / 1e3);
    const Nk = []; for (let i = 0; i <= n; i++) Nk.push(dd.sw ? R.g.selfW * R.g.L * (1 - i / n) / 1e3 : dd.Ntop / 1e3);
    ['y', 'z'].forEach(d => { h += `<div class="box">${Dw.heightChart({ W: 270, H: Hc, L: R.g.L, key: 'M' + d, cu: 'kNm', title: `M_${d} – ${esc(it.id)} [kNm] (charakt.)`, unit: `M_${d} [kNm]`, series: [{ v: Mk(d), c: Dw.C.acc, fill: Dw.C.acc, l: 'M_k' }] })}</div>`; });
    h += `<div class="box">${Dw.heightChart({ W: 250, H: Hc, L: R.g.L, key: 'V', cu: 'kN', title: `V – ${esc(it.id)} [kN] (charakt.)`, unit: 'V [kN]', series: [{ v: Vk('y'), c: Dw.C.red, l: 'V_h' }, { v: Vk('z'), c: Dw.C.vio, l: 'V_b' }] })}</div>`;
    h += `<div class="box">${Dw.heightChart({ W: 200, H: Hc, L: R.g.L, key: 'N', cu: 'kN', dp: 0, title: `N – ${esc(it.id)} [kN]`, unit: 'N [kN]', series: [{ v: Nk, c: Dw.C.vio, fill: Dw.C.vio, l: '' }], sl: 'N_k' })}<p class="hint keep" style="max-width:200px">${esc(it.name || '')}: wartości charakterystyczne (bez współczynników, imperfekcji i II rzędu).</p></div>`;
  }
  if (R.bx) {
    const ob = res.filter(q => q.biax.fib).reduce((a, q) => (!a || q.biax.fib.u > a.biax.fib.u ? q : a), null);
    const o = selCombo !== null ? res[selCombo] : ob;
    if (o) { const f = o.biax.fib || (() => { const s = o.biax.gov; const cs = s.gov; const sy = o.y.secs.find(q => q.key === s.key), sz = o.z.secs.find(q => q.key === s.key); return { N: s.N, My: cs.My * (sy.sg || 1), Mz: cs.Mz * (sz.sg || 1), u: NaN, key: s.key }; })();
      h += `<div class="box">${Dw.contourSVG(R, f.N, [{ x: f.Mz / 1e6, y: f.My / 1e6, c: Dw.C.red, r: 4.5, gov: true, l: isFinite(f.u) ? fmt(f.u * 100, 0) + '%' : '' }], { W: 380, H: 380 })}<p class="hint">Zginanie ukośne – kontur nośności przy N<sub>Ed</sub> = ${fmt(f.N / 1e3, 0)} kN (${f.key === 'base' ? 'podstawa' : f.key === 'top' ? 'głowica' : 'strefa środkowa'}), metoda włókien.</p></div>`; }
  }
  h += `</div>`;
  // tabela kombinacji
  h += `<div class="h2" style="margin-top:16px">Kombinacje SGN <small>${res.length} kombinacji · η – największe wykorzystanie (zginanie w obu płaszczyznach, zginanie ukośne)</small></div><div class="tscroll"><table class="ctab ccomb"><thead><tr><th>#</th><th>Kombinacja</th><th>Wzór</th><th style="text-align:right">N<sub>Ed</sub> [kN]</th><th style="text-align:right">M<sub>Ed,y</sub></th><th style="text-align:right">M<sub>Ed,z</sub></th><th style="text-align:right">η<sub>y</sub></th><th style="text-align:right">η<sub>z</sub></th><th style="text-align:right">5.39</th><th style="text-align:right">V<sub>Ed</sub> [kN]</th></tr></thead><tbody>`;
  const pc = v => isFinite(v) ? fmt(v * 100, 0) + '%' : '∞';
  res.forEach((q, i) => { h += `<tr data-selc="${i}" class="${selCombo === i ? 'selr' : ''}" style="cursor:pointer"><td>${i + 1}</td><td>${esc(q.c.name)}</td><td><small>${esc(E.comboDesc(q.c, R.items))}</small></td><td class="val">${fmt(q.fr.Nbot / 1e3, 0)}</td><td class="val">${fmt(q.y.MEd / 1e6, 1)}</td><td class="val">${fmt(q.z.MEd / 1e6, 1)}</td><td class="val">${pc(q.y.u)}</td><td class="val">${pc(q.z.u)}</td><td class="val">${q.biax.req ? pc(q.biax.u539) : '—'}</td><td class="val">${fmt(Math.max(q.y.VEd, q.z.VEd) / 1e3, 1)}</td></tr>`; });
  h += `</tbody></table></div>`;
  el.innerHTML = h; renderDsum();
  $('#chCombo', el).onchange = e => { selCombo = e.target.value === '' ? null : +e.target.value; rendered = {}; renderActive(); };
  $('#chSrc', el).onchange = e => { chSrc = e.target.value === '' ? null : +e.target.value; rendered.chart = false; renderActive(); };
  bindHCursor(el);
  $$('[data-selc]', el).forEach(tr => tr.addEventListener('click', () => { selCombo = +tr.dataset.selc; rendered = {}; renderActive(); }));
  $$('circle[data-ci]', el).forEach(c => c.addEventListener('click', () => { selCombo = +c.dataset.ci; rendered = {}; renderActive(); }));
}

// wspólny kursor wykresów wysokościowych zakładki – wartości na wysokości kursora; kliknięcie – znacznik (≤ 8), ponowne kliknięcie
// przy znaczniku – usunięcie, prawy przycisk – usunięcie wszystkich; kliknięcie wartości znacznika – jak obliczono
const hPins = [];
const hsym = t => Dw.ss(String(t || ''));
function hY(c, xm) { return c.mt + (1 - xm / c.L) * (c.H - c.mt - c.mb); }
function hX(c, v) { return c.ml + (v - c.vmin) / (c.vmax - c.vmin) * (c.W - c.ml - c.mr); }
function bindHCursor(root) {
  const svgs = $$('svg.hchart', root); if (!svgs.length) return;
  const xmOf = (svg, ev) => { const c = Dw.CH[svg.dataset.cid]; if (!c) return null; const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; const py = vb.y + (ev.clientY - r.top) * vb.height / r.height; const xm = (1 - (py - c.mt) / (c.H - c.mt - c.mb)) * c.L; return xm < -1e-9 || xm > c.L + 1e-9 ? null : Math.max(0, Math.min(c.L, xm)); };
  const show = xm => svgs.forEach(svg => {
    const c = Dw.CH[svg.dataset.cid]; if (!c) return; const g = $('.cur', svg);
    if (xm === null) { g.style.display = 'none'; return; }
    const py = hY(c, xm); let dots = ''; const rows = [], seen = [];
    c.series.forEach(se => { const v = Dw.hAt(c, se, xm); if (!isFinite(v)) return; dots += `<circle cx="${hX(c, v).toFixed(1)}" cy="${py.toFixed(1)}" r="2.6" fill="${se.c}"/>`; if (!se.l || seen.includes(se.l)) return; seen.push(se.l); rows.push([se.l, fmt(v, c.dp), se.c]); });
    g.style.display = '';
    const ln = $('.curl', g); ln.setAttribute('y1', py); ln.setAttribute('y2', py);
    $('.curd', g).innerHTML = dots;
    const lines = [[`x = ${fmt(xm, 2)} m`, '', '#1b2230'], ...rows.map(([l, v, col]) => [`${hsym(l)} = ${v}${c.unit ? ' ' + c.unit : ''}`, '', col])];
    const tw = Math.max(...lines.map(q => q[0].replace(/<[^>]*>/g, '').length)) * 5.4 + 12, th = lines.length * 12 + 6;
    const bx = Math.max(c.ml + 2, Math.min(c.W - c.mr - tw - 2, c.W - c.mr - tw - 2)), by = py - th - 6 > c.mt ? py - th - 6 : py + 6;
    const bg = $('.curbg', g); bg.setAttribute('x', bx); bg.setAttribute('y', by); bg.setAttribute('width', tw); bg.setAttribute('height', th);
    const tc = c => { let h = String(c).replace('#', '').toLowerCase(); if (h.length === 3) h = h.replace(/./g, x => x + x); return `style="fill:var(--sv-${h}, #${h})"`; };
    $('.curtx', g).innerHTML = lines.map((q, i) => `<tspan x="${bx + 6}" y="${by + 13 + i * 12}" ${tc(q[2])} ${i === 0 ? 'font-weight="600"' : ''}>${q[0]}</tspan>`).join('');
  });
  svgs.forEach(svg => {
    svg.style.cursor = 'crosshair';
    svg.addEventListener('mousemove', ev => show(xmOf(svg, ev)));
    svg.addEventListener('touchmove', ev => { if (ev.touches[0]) show(xmOf(svg, ev.touches[0])); }, { passive: true });
    svg.addEventListener('mouseleave', () => show(null));
    svg.addEventListener('click', ev => {
      const lab = ev.target.closest && ev.target.closest('.pinlab'); if (lab) { chartExplain(svg, +lab.dataset.xm); return; }
      const c = Dw.CH[svg.dataset.cid], xm = xmOf(svg, ev); if (!c || xm === null) return;
      const tol = 7 * c.L / (c.H - c.mt - c.mb), j = hPins.findIndex(v => Math.abs(v - xm) <= tol);
      if (j >= 0) hPins.splice(j, 1); else { hPins.push(+xm.toFixed(3)); if (hPins.length > 8) hPins.shift(); }
      svgs.forEach(drawHPins); upd();
    });
    svg.addEventListener('contextmenu', ev => { if (!hPins.length) return; ev.preventDefault(); hPins.length = 0; svgs.forEach(drawHPins); upd(); toast('Usunięto znaczniki z wykresów.', 1500); });
  });
  const upd = () => { const b = $('#pinClr', root); if (b) b.style.display = hPins.length ? '' : 'none'; };
  const pc = $('#pinClr', root); if (pc) pc.onclick = () => { hPins.length = 0; svgs.forEach(drawHPins); upd(); };
  svgs.forEach(drawHPins); upd();
}
function drawHPins(svg) {
  const c = Dw.CH[svg.dataset.cid]; if (!c) return; const g = $('g.pins', svg); if (!g) return;
  const boxes = []; let s = '';
  hPins.forEach(xm => {
    if (xm < -1e-9 || xm > c.L + 1e-9) return;
    const py = hY(c, xm);
    s += `<line x1="${c.ml}" y1="${py.toFixed(1)}" x2="${c.W - c.mr}" y2="${py.toFixed(1)}" stroke="#a35d00" stroke-width="0.8" stroke-dasharray="2 3" pointer-events="none"/>`;
    const xt = `x = ${fmt(xm, 2)}`, xw = xt.length * 5.2 + 6; boxes.push([c.ml, py - 6, c.ml + xw, py + 6]);
    s += `<rect x="${c.ml}" y="${(py - 6).toFixed(1)}" width="${xw.toFixed(1)}" height="12" rx="2" fill="#a35d00" fill-opacity="0.9" pointer-events="none"/><text x="${(c.ml + xw / 2).toFixed(1)}" y="${(py + 3.2).toFixed(1)}" font-size="9" fill="#ffffff" font-weight="600" text-anchor="middle" pointer-events="none">${xt}</text>`;
    const seen = [];
    c.series.forEach(se => {
      const v = Dw.hAt(c, se, xm); if (!isFinite(v) || seen.some(q => Math.abs(q - v) < 1e-6)) return; seen.push(v);
      const px = hX(c, v), lab = fmt(v, c.dp), tw = lab.length * 5.7 + 4;
      s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3" fill="${se.c}" stroke="#ffffff" stroke-width="0.8" pointer-events="none"/>`;
      const cand = [[px + 5, py - 4, 'start'], [px - 5, py - 4, 'end'], [px + 5, py + 11, 'start'], [px - 5, py + 11, 'end'], [px + 5, py - 15, 'start'], [px - 5, py + 22, 'end']];
      const box = ([x, y, a]) => { let bx = a === 'start' ? x : x - tw; bx = Math.max(2, Math.min(c.W - tw - 2, bx)); return [bx, y - 9, bx + tw, y + 2]; };
      const ok = cand.find(q => { const b = box(q); return b[1] > c.mt - 4 && b[3] < c.H - c.mb + 4 && !boxes.some(z => b[0] < z[2] && b[2] > z[0] && b[1] < z[3] && b[3] > z[1]); }) || cand[0];
      const b = box(ok); boxes.push(b);
      s += `<g class="pinlab" data-xm="${xm}" style="cursor:pointer"><title>${esc(`${(se.l || '').replace(/_/g, '')} x = ${fmt(xm, 2)} m: ${lab}${c.unit ? ' ' + c.unit : ''} – kliknij: jak obliczono`)}</title><rect x="${b[0].toFixed(1)}" y="${b[1].toFixed(1)}" width="${tw.toFixed(1)}" height="11" rx="2" fill="#ffffff" fill-opacity="0.88"/><text x="${(b[0] + tw / 2).toFixed(1)}" y="${ok[1].toFixed(1)}" font-size="10" font-weight="650" fill="${se.c}" text-anchor="middle">${lab}</text></g>`;
    });
  });
  g.innerHTML = s; themeSvgIn(svg.parentNode || svg);
}
// „jak obliczono” w miejscu wykresu: przekrój najbliższy (podstawa, strefa środkowa, głowica) w płaszczyźnie wykresu
function chartExplain(svg, xm) {
  const c = Dw.CH[svg.dataset.cid]; if (!c || !R) return;
  const k = c.key, xi = xm / c.L, where = xi < 0.2 ? 'podstawa' : xi > 0.8 ? 'głowica' : 'strefa środkowa';
  const v = c.series[0] ? Dw.hAt(c, c.series[0], xm) : null, val = v !== null && isFinite(v) ? `${fmt(v, c.dp)}${c.unit ? ' ' + c.unit : ''}` : '';
  const at = `x = ${fmt(xm, 2)} m`;
  if (k === 'My' || k === 'Mz') { const d = k[1]; return explainRowPopup(`MEd MRd płaszczyzna ${PL(d)}`, `płaszczyzna ${PL(d)}`, `Moment M_${d} – ${at}: ${val} (${where})`, 'Nośność przekroju – zginanie', val, '', `moment M_${d} na wysokości ${at}`); }
  if (k === 'V') return explainRowPopup('VEd VRd ścinanie', '', `Siła poprzeczna – ${at}: ${val}`, 'Ścinanie', val, '', `siła poprzeczna na wysokości ${at}`);
  if (k === 'N') return explainRowPopup('NEd N_Ed', '', `Siła podłużna – ${at}: ${val}`, 'kombinacje obciążeń', val, '', `siła podłużna na wysokości ${at}`);
  if (k === 'e') return explainRowPopup('e2 M2 e_i', '', `Mimośród dodatkowy – ${at}: ${val}`, 'Efekty II rzędu', val, '', `mimośród e_i + e_2 na wysokości ${at}`);
}

/* ------------------------------------------------- zakładka Zbrojenie słupa */
function scheduleHTML() {
  const sc = R.sched; if (!sc) return '';
  let h = `<table class="sched"><thead><tr><th>Poz.</th><th>Nazwa</th><th>⌀ [mm]</th><th>Długość [mm]</th><th>Liczba [szt.]</th><th>Długość całk. [m]</th><th>Masa [kg]</th></tr></thead><tbody>`;
  sc.rows.forEach(r => { h += `<tr><td class="n">${r.pos}</td><td>${esc(r.name)}</td><td class="n">${r.d}</td><td class="n">${fmt(r.len, 0)}</td><td class="n">${r.n}</td><td class="n">${fmt(r.tot, 2)}</td><td class="n">${fmt(r.kg, 1)}</td></tr>`; });
  h += `</tbody></table><table class="sched" style="margin-top:8px"><thead><tr><th>Stal</th><th>⌀ [mm]</th><th>Długość [m]</th><th>Masa jedn. [kg/m]</th><th>Masa [kg]</th></tr></thead><tbody>`;
  sc.byD.forEach(q => { h += `<tr><td>${esc(q.steel === 'W' ? R.m.sw.short : R.m.st.short)}</td><td class="n">${q.d}</td><td class="n">${fmt(q.m, 2)}</td><td class="n">${fmt(E.massPerM(q.d), 3)}</td><td class="n">${fmt(q.kg, 1)}</td></tr>`; });
  h += `<tr class="tot"><td colspan="4">Razem (+ ok. 5% na zakłady i odpady – nie wliczono)</td><td class="n">${fmt(sc.tot, 1)}</td></tr></tbody></table>`;
  return h;
}
let view3d = false;
const V3 = { yaw: -0.6, pitch: 0.32, k: 1, px: 0, py: 0, mode: 'rot' };
function renderElev(el) {
  if (!R || R.errors.length) { el.innerHTML = errBox(); return; }
  if (!R.lay.n) { el.innerHTML = `<div class="dsumx"></div><div class="msg wrn">Brak zbrojenia podłużnego – dobierz zbrojenie w zakładce Przekrój i zbrojenie.</div><p><button class="btn pri" id="elAuto">⚙ Dobierz zbrojenie</button></p>`; renderDsum(); $('#elAuto', el).onclick = () => doAutoReb(); return; }
  const T = R.ties, A = R.anch;
  const W2 = Math.max(520, Math.min(760, el.clientWidth - 40 - 360));
  let h = `<div class="dsumx"></div><div class="h2">Zbrojenie słupa <small>przesuń kursor po słupie – obok przekrój na tej wysokości; kliknij słup – przekrój i siły w tym miejscu; kliknij strefę strzemion lub wymiar zakładu, aby zmienić</small><button class="btn sm pri" id="elDxf" style="float:right">Eksport DXF</button></div>`;
  h += `<div class="flex"><div class="box elevbox"><div class="v3sw segsw sm" role="tablist" aria-label="Widok"><button data-v3="2d" class="${view3d ? '' : 'on'}">2D</button><button data-v3="3d" class="${view3d ? 'on' : ''}" title="Widok przestrzenny zbrojenia – obrót, przesuw i powiększenie">3D</button></div>`;
  if (view3d) h += `<div class="v3tools segsw sm" role="toolbar" aria-label="Sterowanie widokiem 3D"><button data-v3m="rot" class="${V3.mode === 'pan' ? '' : 'on'}" title="Przeciąganie lewym przyciskiem obraca widok">⟳ Obrót</button><button data-v3m="pan" class="${V3.mode === 'pan' ? 'on' : ''}" title="Przeciąganie lewym przyciskiem przesuwa widok">✥ Przesuw</button><button data-v3z="1" title="Powiększ">+</button><button data-v3z="-1" title="Pomniejsz">−</button><button data-v3r="1" title="Widok domyślny">⌂</button></div><canvas class="v3d" width="${Math.round(W2)}" height="760"></canvas><p class="hint keep" style="margin:4px 0 0;max-width:${Math.round(W2)}px">Lewy przycisk – obrót lub przesuw (wg trybu) · prawy przycisk albo Shift + przeciągnij – przesuw · Ctrl + kółko lub +/− – powiększenie · dwa palce – przesuw i powiększenie · dwuklik – widok domyślny.</p>`;
  else h += `<div class="elevwrap">${Dw.elevationSVG(R, S, { W: W2, H: 760 })}</div>`;
  h += `</div><div style="display:flex;flex-direction:column;gap:14px;min-width:300px;flex:1"><div class="box hsec" id="hsec"></div>
    <div class="box xres"><h4>Strzemiona i zakłady</h4><table class="kv">
      <tr><td>Strzemiona</td><td>⌀${R.lay.dt} (${esc(R.m.sw.short)})</td><td></td></tr>
      <tr><td>Rozstaw w części środkowej s</td><td>${T.s}</td><td>mm</td></tr>
      <tr><td>Rozstaw przy stropach i w strefie zakładu${T.sRedMan ? ' (zadany)' : ''}</td><td>${T.sRed}</td><td>mm</td></tr>
      <tr><td>Strefa zagęszczenia u dołu${T.zMan ? ' (zadana)' : ` (max(b, h)${T.lapZone ? '; zakład + 4⌀' : ''})`}</td><td>${fmt(T.zBot, 0)}</td><td>mm</td></tr>
      <tr><td>Strefa zagęszczenia u góry</td><td>${fmt(T.zTop, 0)}</td><td>mm</td></tr>
      <tr><td>Liczba strzemion w słupie</td><td>${T.sets}</td><td>szt.</td></tr>
      <tr><td>Długość zakładu l₀ (${A.tension ? 'pręty rozciągane' : 'pręty ściskane'}, α₆ = ${fmt(A.a6, 1)})${A.l0man ? ` – zadana, wymagana ${fmt(A.l0req, 0)}` : ''}</td><td>${fmt(A.l0, 0)}</td><td>mm</td></tr>
      <tr><td>Długość zakotwienia l<sub>bd</sub></td><td>${fmt(A.lbd, 0)}</td><td>mm</td></tr></table>
      <p class="hint">Strzemiona zagęszczone (9.5.3(4)) na długości równej większemu wymiarowi przekroju nad stropem/fundamentem i pod stropem${T.lapZone ? ', a także na długości zakładu prętów ⌀ > 14 mm' : ''}. W strefie zakładu prętów ściskanych – strzemię w odległości ≤ 4⌀ za końcem zakładu (8.7.4.2(4)).</p>
      <div class="dbtn" style="justify-content:flex-start"><button class="btn sm" id="elZone">Strefy strzemion…</button><button class="btn sm" id="elLap">Zakład…</button><button class="btn sm" id="elTie">Strzemiona…</button></div></div></div></div>`;
  h += `<div class="h2" style="margin-top:16px">Wyciągi prętów <small>kliknij pręt lub strzemię, aby zmienić</small></div><div class="box xbars">${Dw.extractsSVG(R, S, { W: 760 })}</div>`;
  h += `<div class="h2" style="margin-top:16px">Zestawienie stali</div><div class="tscroll xres">${scheduleHTML()}</div>`;
  el.innerHTML = h; renderDsum();
  $('#elDxf', el).onclick = () => exportDXF();
  if (ART) { $('#elDxf', el).hidden = true; $('.h2', el).insertAdjacentHTML('beforeend', '<small>eksport DXF i raport .odt – w programie SlupZB.exe lub w pliku app.html</small>'); }
  $$('[data-v3]', el).forEach(b => b.addEventListener('click', () => { view3d = b.dataset.v3 === '3d'; rendered.elev = false; renderElev(el); }));
  const cv = $('canvas.v3d', el); if (cv) draw3D(cv);
  $('#elZone', el).onclick = () => stirZonePopup('bot'); $('#elLap', el).onclick = () => lapPopup(); $('#elTie', el).onclick = () => tiePopup();
  $$('.elevsvg .stzone', el).forEach(g => g.addEventListener('click', ev => { ev.stopPropagation(); stirZonePopup(g.dataset.tz); }));
  $$('.elevsvg .lapdim', el).forEach(g => g.addEventListener('click', ev => { ev.stopPropagation(); lapPopup(); }));
  $$('.xbars svg', el).forEach(sv => { sv.style.cursor = 'pointer'; sv.addEventListener('click', ev => { const t = ev.target.closest('[data-pos]'); const r = t ? R.sched.rows.find(q => String(q.pos) === t.dataset.pos) : null; if (!r) return; if (r.kind === 'tie' || r.kind === 'pin') tiePopup(); else if (r.kind === 'start') lapPopup(); else rebPopup(); }); });
  bindElevHover(el);
}
// przekrój na wysokości z: pręty słupa (+ pręty startowe w strefie zakładu), strzemiona w tym miejscu, siły
function zInfo(z) {
  const T = R.ties, A = R.anch, L = R.g.L, n = 40, xi = Math.max(0, Math.min(1, z / L));
  const zone = z < T.zBot ? 'strefa zagęszczenia u dołu' : z > L - T.zTop ? 'strefa zagęszczenia u góry' : 'część środkowa';
  const sp = z < T.zBot || z > L - T.zTop ? T.sRed : T.s, lap = S.det.base === 'found' || true ? z >= 0 && z <= A.l0 : false;
  const rows = ['y', 'z'].map(d => { const o = govOf(d), ms = Dw.momentSeries(R, o, d), i = Math.round(xi * n), M = ms.tot[i], N = o.fr.Nat(xi), U2 = R.dirs[d].U, MRd = U2 ? U2.MRd(N, M >= 0 ? 1 : -1) : null; return { d, o, M, N, MRd: MRd === null ? NaN : MRd / 1e6 }; });
  return { z, zone, sp, lap, rows };
}
function hoverSecHTML(z) {
  const q = zInfo(z);
  return `<h4>Przekrój na wysokości z = ${fmt(z / 1000, 2)} m <small>· ${q.zone}${q.lap ? ' · strefa zakładu (pręty startowe ○)' : ''}</small></h4>${Dw.sectionSVG(R, { W: 300, H: 300, starter: q.lap })}
    <table class="kv"><tr><td>Zbrojenie</td><td>${R.lay.n}⌀${R.lay.dmax}${q.lap ? ` + ${R.lay.n}⌀${R.lay.dmax} (startowe)` : ''}</td></tr><tr><td>Strzemiona</td><td>⌀${R.lay.dt} co ${q.sp} mm</td></tr>
    ${q.rows.map(r => `<tr><td>M<sub>Ed,${r.d}</sub> / M<sub>Rd,${r.d}</sub></td><td>${fmt(r.M, 1)} / ${fmt(r.MRd, 1)} kNm <small>(${esc(r.o.c.name)})</small></td></tr>`).join('')}<tr><td>N<sub>Ed</sub></td><td>${fmt(q.rows[0].N / 1e3, 0)} kN</td></tr></table>`;
}
function bindElevHover(el) {
  const svg = $('svg.elevsvg', el), hs = $('#hsec', el); if (!hs) return;
  const show = z => { hs.innerHTML = hoverSecHTML(Math.max(0, Math.min(R.g.L, z))); };
  show(R.g.L / 2);
  if (!svg) return;
  const zb = +svg.dataset.zb, k = +svg.dataset.k, Hh = +svg.dataset.hh, mb = +svg.dataset.mb, x0 = +svg.dataset.x0, x1 = +svg.dataset.x1, L = +svg.dataset.l;
  const ns = 'http://www.w3.org/2000/svg', cur = document.createElementNS(ns, 'line');
  cur.setAttribute('x1', x0 - 10); cur.setAttribute('x2', x1 + 10); cur.setAttribute('stroke-width', '1.4'); cur.setAttribute('stroke-dasharray', '4 3'); cur.style.stroke = 'var(--acc)'; cur.style.display = 'none'; cur.style.pointerEvents = 'none'; svg.appendChild(cur);
  const zOf = ev => { const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; const px = vb.x + (ev.clientX - r.left) * vb.width / r.width, py = vb.y + (ev.clientY - r.top) * vb.height / r.height; return { z: zb + (Hh - mb - py) / k, px, py }; };
  const inside = q => q.px >= x0 - 12 && q.px <= x1 + 12 && q.z >= 0 && q.z <= L;
  let pend = null, last = null;
  svg.addEventListener('mousemove', ev => { const q = zOf(ev); if (!inside(q)) { cur.style.display = 'none'; return; } cur.setAttribute('y1', q.py); cur.setAttribute('y2', q.py); cur.style.display = ''; svg.style.cursor = 'crosshair'; const zz = Math.round(q.z / 10) * 10; if (zz === last) return; last = zz; if (!pend) pend = requestAnimationFrame(() => { pend = null; show(last); }); });
  svg.addEventListener('mouseleave', () => { cur.style.display = 'none'; svg.style.cursor = ''; });
  svg.addEventListener('click', ev => { if (ev.target.closest('.stzone, .lapdim')) return; const q = zOf(ev); if (inside(q)) zSecPopup(Math.round(q.z / 10) * 10); });
}
function zSecPopup(z) {
  const L = R.g.L, m = $('#modal'), q = zInfo(z);
  m.innerHTML = `<div class="dlg secpop xres"><h3>Przekrój słupa na wysokości z = ${fmt(z / 1000, 2)} m</h3>
    <div class="secnav"><button class="btn sm" data-dz="-500">▼ 0,5 m</button><button class="btn sm" data-dz="-100">▼ 0,1 m</button><label>z = <input class="txt sm" id="zsZ" value="${fmt(z / 1000, 2)}"> m</label><button class="btn sm" data-dz="100">0,1 m ▲</button><button class="btn sm" data-dz="500">0,5 m ▲</button></div>
    <div class="flex" style="gap:8px;justify-content:center">${Dw.sectionSVG(R, { W: 330, H: 330, edit: true, starter: q.lap })}</div>
    <div class="secedbar"><span>Zmień:</span><button class="btn sm" data-zz="bars">Pręty podłużne</button><button class="btn sm" data-zz="ties">Strzemiona</button><button class="btn sm" data-zz="zone">Strefy strzemion</button><button class="btn sm" data-zz="dims">Wymiary</button><button class="btn sm" data-zz="cov">Otulina</button></div>
    <table class="kv"><tr><td>Miejsce</td><td colspan="2">${q.zone}${q.lap ? ' – strefa zakładu prętów' : ''}</td></tr><tr><td>Strzemiona</td><td colspan="2">⌀${R.lay.dt} co ${q.sp} mm</td></tr>
    ${q.rows.map(r => `<tr><td>Płaszczyzna ${PL(r.d)}: M<sub>Ed,${r.d}</sub> / M<sub>Rd,${r.d}</sub>(N<sub>Ed</sub>)</td><td>${fmt(r.M, 1)} / ${fmt(r.MRd, 1)}</td><td>kNm (${isFinite(r.MRd) && r.MRd > 0 ? fmt(Math.abs(r.M) / r.MRd * 100, 0) : '∞'}%) – ${esc(r.o.c.name)}</td></tr>`).join('')}
    <tr><td>N<sub>Ed</sub></td><td>${fmt(q.rows[0].N / 1e3, 0)}</td><td>kN</td></tr></table>
    <p class="hint keep">Momenty z imperfekcją i efektami II rzędu (kombinacje decydujące w każdej płaszczyźnie); M<sub>Rd</sub> przy N<sub>Ed</sub> na tej wysokości. Kliknij wiersz – jak obliczono.</p>
    <div class="dbtn"><button class="btn pri" id="nClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; popRedraw = null;
  $('#nClose', m).onclick = closeModal;
  $$('[data-dz]', m).forEach(b => b.onclick = () => zSecPopup(Math.max(0, Math.min(L, z + +b.dataset.dz))));
  const inp = $('#zsZ', m); inp.addEventListener('change', () => { const v = parseNum(inp.value); if (v !== null) zSecPopup(Math.max(0, Math.min(L, v * 1000))); }); inp.addEventListener('keydown', e => { if (e.key === 'Enter') inp.dispatchEvent(new Event('change')); });
  $$('[data-zz]', m).forEach(b => b.onclick = () => { const k = b.dataset.zz; if (k === 'zone') stirZonePopup(z < R.ties.zBot ? 'bot' : z > L - R.ties.zTop ? 'top' : 'mid'); else zoneClick(k); });
  $$('svg.secedit [data-z]', m).forEach(zn => zn.addEventListener('click', ev => { ev.stopPropagation(); zoneClick(zn.dataset.z); }));
}
// strefy strzemion: rozstaw w strefie i długość stref zagęszczenia (auto albo zadane)
function stirZonePopup(kz) {
  const T = R.ties;
  const opt = (v, list, auto) => [['auto', auto], ...list.map(x => [x, x + ' mm'])];
  miniPop('Strefy strzemion', () => `<div class="fields">
      <div class="row"><label>Rozstaw w części środkowej s</label>${selHTML('szS', opt(0, [100, 125, 150, 175, 200, 225, 250, 300, 350, 400], `auto (${T.sMan ? T.s : T.sAuto} mm)`), S.stir.s)}<span></span></div>
      <div class="row"><label>Rozstaw w strefach zagęszczenia s<sub>red</sub></label>${selHTML('szR', opt(0, [50, 75, 100, 125, 150, 175, 200, 225, 240], `auto (≤ 0,6·s_cl,tmax = ${fmt(T.sclRed, 0)} mm)`), S.stir.sRed)}<span></span></div>
      <div class="row"><label>Długość strefy u dołu</label>${selHTML('szB', opt(0, [300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000], `auto (${fmt(T.zBotReq, 0)} mm)`), S.stir.zB)}<span></span></div>
      <div class="row"><label>Długość strefy u góry</label>${selHTML('szT', opt(0, [300, 400, 500, 600, 700, 800, 1000], `auto (${fmt(T.zTopReq, 0)} mm)`), S.stir.zT)}<span></span></div></div>
    <div class="hint keep">Wymagane (9.5.3(3), (4)): s ≤ s<sub>cl,tmax</sub> = ${fmt(T.scl, 0)} mm; przy stropach i w strefie zakładu s ≤ ${fmt(T.sclRed, 0)} mm na długości ≥ max(b, h) = ${fmt(T.zB0, 0)} mm${T.lapZone ? ` (u dołu – długość zakładu + 4⌀ = ${fmt(T.lapZone, 0)} mm)` : ''}. Teraz: dół ${fmt(T.zBot, 0)} mm co ${T.sRed}, środek co ${T.s}, góra ${fmt(T.zTop, 0)} mm co ${T.sRed}; ${T.sets} strzemion.${kz ? ` Kliknięta strefa: ${kz === 'bot' ? 'dolna' : kz === 'top' ? 'górna' : 'środkowa'}.` : ''}</div>`,
    m => { const set = (k, v) => { S.stir[k] = v === 'auto' ? 'auto' : +v; changed(true); }; $('#szS', m).onchange = e => set('s', e.target.value); $('#szR', m).onchange = e => set('sRed', e.target.value); $('#szB', m).onchange = e => set('zB', e.target.value); $('#szT', m).onchange = e => set('zT', e.target.value); });
  const pv = $('#modal .rbprev'); if (pv) pv.remove();
  const sel = { bot: '#szB', top: '#szT', mid: '#szS' }[kz]; if (sel) setTimeout(() => hlg('#modal ' + sel), 50);
}
// długość zakładu prętów (auto – wymagana, albo zadana; mniejsza od wymaganej – warunek niespełniony)
function lapPopup() {
  const A = R.anch;
  miniPop('Zakład prętów podłużnych', () => `<div class="fields"><div class="row"><label>Długość zakładu l₀</label><div class="combo"><input id="lpL" value="${S.det.l0Man === 'auto' ? '' : esc(showNum(S.det.l0Man))}" placeholder="auto ${fmt(A.l0req, 0)}" autocomplete="off"><button tabindex="-1" data-list='["", 500, 600, 700, 800, 900, 1000, 1200, 1500]' aria-label="lista">▾</button></div><span class="unit">mm</span></div>
      <div class="row wide"><label>Udział prętów łączonych w jednym przekroju</label>${selHTML('lpA', [['100', 'wszystkie pręty (α₆ = 1,5)'], ['50', '50% prętów (α₆ = 1,4)']], S.det.lap)}</div></div>
    <div class="hint keep">Wymagane (8.7.3): l₀ = α₆·l<sub>b,rqd</sub> ≥ l<sub>0,min</sub> = max(0,3·α₆·l<sub>b,rqd</sub>; 15⌀; 200 mm) → <b>${fmt(A.l0req, 0)} mm</b> (${A.tension ? 'pręty rozciągane' : 'pręty ściskane'}, l<sub>b,rqd</sub> = ${fmt(A.lbrqd, 0)} mm). Puste pole – długość wymagana. Długość zakładu zmienia długości prętów startowych i strefę zagęszczenia strzemion.</div>`,
    m => { const inp = $('#lpL', m); const ap = fin => { const raw = inp.value.trim(); if (raw === '') { if (S.det.l0Man !== 'auto') { S.det.l0Man = 'auto'; changed(false); } inp.classList.remove('bad'); return; } const v = parseNum(raw), bad = v === null || v < 100 || v > 5000; inp.classList.toggle('bad', bad); if (bad) return; if (fin && v !== S.det.l0Man) { S.det.l0Man = v; changed(false); } };
      inp.addEventListener('change', () => ap(true)); inp.addEventListener('keydown', e => { if (e.key === 'Enter') ap(true); });
      inp.nextElementSibling.addEventListener('mousedown', e => { e.preventDefault(); openList(inp.nextElementSibling); });
      inp.dataset.k = 'det.l0Man'; inp.dataset.min = '100'; inp.dataset.max = '5000';
      $('#lpA', m).onchange = e => { S.det.lap = e.target.value; changed(false); }; });
  const pv = $('#modal .rbprev'); if (pv) pv.remove();
}
// widok przestrzenny zbrojenia słupa (canvas): beton (półprzezroczysty), pręty podłużne, pręty startowe, strzemiona i szpilki
function draw3D(cv) {
  const g = R.g, lay = R.lay, T = R.ties, A = R.anch, det = S.det, cov = R.cov, ctx = cv.getContext('2d'), W = cv.width, H = cv.height, dpr = window.devicePixelRatio || 1;
  cv.style.width = W + 'px'; cv.style.height = H + 'px'; cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
  const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  const COL = dark ? { main: '#c9d4e6', start: '#7fa3e0', tie: '#e08a8a', pin: '#e6a35a' } : { main: '#1d2a3f', start: '#1d5bb8', tie: '#a04848', pin: '#b5651d' };
  const L = g.L, hTop = det.hTop, found = det.base === 'found', cont = det.top === 'cont';
  const bw = g.round ? g.D : g.b, bh = g.round ? g.D : g.h;
  const zTop = L + hTop + (cont ? A.l0 : 0), zBot = found ? -det.hF : -Math.min(400, A.l0 * 0.4);
  // współrzędne: [x (wzdłuż b), z (wysokość), y (wzdłuż h)]
  const lines = [], polys = [];
  const box = (x0, x1, z0, z1, y0, y1, kind) => { const c = [[x0, z0, y0], [x1, z0, y0], [x1, z1, y0], [x0, z1, y0], [x0, z0, y1], [x1, z0, y1], [x1, z1, y1], [x0, z1, y1]]; [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 3, 7, 4], [1, 2, 6, 5]].forEach(f => polys.push({ f: f.map(i => c[i]), kind })); };
  const cyl = (cx, cy, r, z0, z1, kind, nS) => { nS = nS || 24; for (let i = 0; i < nS; i++) { const a = i / nS * 2 * Math.PI, b = (i + 1) / nS * 2 * Math.PI; polys.push({ f: [[cx + r * Math.cos(a), z0, cy + r * Math.sin(a)], [cx + r * Math.cos(b), z0, cy + r * Math.sin(b)], [cx + r * Math.cos(b), z1, cy + r * Math.sin(b)], [cx + r * Math.cos(a), z1, cy + r * Math.sin(a)]], kind }); } };
  const colBody = (z0, z1, kind) => { if (g.round) { cyl(g.D / 2, g.D / 2, g.D / 2, z0, z1, kind); if (g.ring) cyl(g.D / 2, g.D / 2, g.Di / 2, z0, z1, kind); } else if (g.isPoly) g.rects.forEach(r => box(r.x0, r.x1, z0, z1, r.y0, r.y1, kind)); else box(0, g.b, z0, z1, 0, g.h, kind); };
  colBody(0, L, 'col');
  if (found) box(-200, bw + 200, -det.hF, 0, -200, bh + 200, 'sup'); else colBody(zBot, 0, 'sup');
  box(-260, bw + 260, L, L + hTop, -260, bh + 260, 'slab');
  if (cont) colBody(L + hTop, zTop, 'sup');
  const cx0 = g.round ? g.D / 2 : g.isPoly ? g.xc : g.b / 2, cy0 = g.round ? g.D / 2 : g.isPoly ? g.yc : g.h / 2;
  const main = R.sched.rows.find(r => r.kind === 'main') || { leg: 0 }, start = R.sched.rows.find(r => r.kind === 'start');
  const zEnd = cont ? zTop : L + hTop - cov.cnom - lay.dt - lay.dmax;
  lay.bars.forEach(b => {
    const w = Math.max(1.2, b.d / 9), vx = cx0 - b.x, vy = cy0 - b.y, Ln = Math.hypot(vx, vy) || 1, ux = vx / Ln, uy = vy / Ln;
    lines.push([[b.x, 0, b.y], [b.x, zEnd, b.y], COL.main, w]);
    if (!cont && main.leg) lines.push([[b.x, zEnd, b.y], [b.x + ux * main.leg, zEnd, b.y + uy * main.leg], COL.main, w]);
    const sx = b.x + ux * b.d * 1.05, sy = b.y + uy * b.d * 1.05;
    if (found && start) { const zb = -(det.hF - det.cF - 20); lines.push([[sx, zb, sy], [sx, A.l0, sy], COL.start, w]); lines.push([[sx, zb, sy], [sx - ux * start.leg, zb, sy - uy * start.leg], COL.start, w]); }
    else lines.push([[sx, zBot, sy], [sx, A.l0, sy], COL.start, w]);
  });
  const c = cov.cnom, dt = lay.dt, tw = Math.max(1, dt / 7);
  const loops = [];
  if (g.round) { loops.push({ circ: lay.Rt }); if (lay.Rti) loops.push({ circ: lay.Rti }); }
  else if (g.isPoly) g.ties.forEach(t => loops.push({ r: [t.x0 + c + dt / 2, t.y0 + c + dt / 2, t.x1 - c - dt / 2, t.y1 - c - dt / 2] }));
  else loops.push({ r: [c + dt / 2, c + dt / 2, g.b - c - dt / 2, g.h - c - dt / 2] });
  T.pos.forEach(z => {
    loops.forEach(lp => {
      if (lp.circ) { const n = 20; for (let i = 0; i < n; i++) { const a = i / n * 2 * Math.PI, b2 = (i + 1) / n * 2 * Math.PI; lines.push([[cx0 + lp.circ * Math.cos(a), z, cy0 + lp.circ * Math.sin(a)], [cx0 + lp.circ * Math.cos(b2), z, cy0 + lp.circ * Math.sin(b2)], COL.tie, tw]); } }
      else { const [x0, y0, x1, y1] = lp.r, P = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]; for (let i = 0; i < 4; i++) lines.push([[P[i][0], z, P[i][1]], [P[(i + 1) % 4][0], z, P[(i + 1) % 4][1]], COL.tie, tw]); }
    });
    lay.pins.forEach(p => {
      if (g.isPoly) { if (p.dir === 'v') lines.push([[p.x, z, p.y0], [p.x, z, p.y1], COL.pin, tw]); else lines.push([[p.x0, z, p.y], [p.x1, z, p.y], COL.pin, tw]); }
      else if (p.dir === 'h') lines.push([[p.x, z, c + dt], [p.x, z, g.h - c - dt], COL.pin, tw]);
      else lines.push([[c + dt, z, p.y], [g.b - c - dt, z, p.y], COL.pin, tw]);
    });
  });
  const xc = bw / 2, yc = (zTop + zBot) / 2, zc = bh / 2;
  const base = Math.min((H - 70) / (zTop - zBot), (W - 60) / Math.max(bw + 520, 1));
  const render = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const cy = Math.cos(V3.yaw), sy = Math.sin(V3.yaw), cp = Math.cos(V3.pitch), sp = Math.sin(V3.pitch), sc0 = base * V3.k;
    const pr = ([x, z, y]) => { const X0 = x - xc, Y0 = z - yc, Z0 = y - zc; const X1 = X0 * cy + Z0 * sy, Z1 = -X0 * sy + Z0 * cy; const Y2 = Y0 * cp - Z1 * sp, Z2 = Y0 * sp + Z1 * cp; return [W / 2 + V3.px + X1 * sc0, H / 2 + V3.py - Y2 * sc0, Z2]; };
    const items = [];
    polys.forEach(({ f, kind }) => { const pp = f.map(pr); items.push({ z: pp.reduce((a, q) => a + q[2], 0) / pp.length, poly: pp, kind }); });
    lines.forEach(([a, b, col, w]) => { const P1 = pr(a), P2 = pr(b); items.push({ z: (P1[2] + P2[2]) / 2 + 1, line: [P1, P2], c: col, w: w * Math.max(0.6, Math.min(2.4, V3.k)) }); });
    items.sort((u, v) => u.z - v.z);
    items.forEach(it => {
      if (it.poly) { ctx.beginPath(); it.poly.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
        ctx.fillStyle = it.kind === 'col' ? (dark ? 'rgba(160,170,190,0.07)' : 'rgba(120,130,150,0.08)') : (dark ? 'rgba(150,160,175,0.10)' : 'rgba(110,120,135,0.10)'); ctx.fill();
        ctx.strokeStyle = it.kind === 'col' ? (dark ? 'rgba(200,210,225,0.35)' : 'rgba(60,70,90,0.35)') : (dark ? 'rgba(200,210,225,0.18)' : 'rgba(60,70,90,0.18)'); ctx.lineWidth = 0.7; ctx.stroke(); }
      else { ctx.beginPath(); ctx.moveTo(it.line[0][0], it.line[0][1]); ctx.lineTo(it.line[1][0], it.line[1][1]); ctx.strokeStyle = it.c; ctx.lineWidth = it.w; ctx.lineCap = 'round'; ctx.stroke(); }
    });
    ctx.fillStyle = dark ? '#c9d4e6' : '#3d4656'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'start';
    ctx.fillText(`${lay.n}⌀${lay.dmax} (granatowe), pręty startowe (niebieskie), strzemiona ⌀${lay.dt} (${T.sets} szt.)`, 10, H - 26);
    ctx.fillText(`obrót ${Math.round(V3.yaw * 180 / Math.PI)}°, pochylenie ${Math.round(V3.pitch * 180 / Math.PI)}°, powiększenie ${Math.round(V3.k * 100)}% · tryb: ${V3.mode === 'pan' ? 'przesuw' : 'obrót'}`, 10, H - 10);
  };
  render();
  const zoomAt = (f, mx, my) => { const k1 = Math.max(0.3, Math.min(30, V3.k * f)), q = k1 / V3.k; V3.px = (mx - W / 2) - (mx - W / 2 - V3.px) * q; V3.py = (my - H / 2) - (my - H / 2 - V3.py) * q; V3.k = k1; };
  const loc = e => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const pts = new Map(); let drag = null, pinch = null;
  cv.oncontextmenu = e => e.preventDefault();
  cv.onpointerdown = e => {
    cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, loc(e));
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], v: Object.assign({}, V3) }; drag = null; return; }
    const pan = V3.mode === 'pan' || e.shiftKey || e.button === 1 || e.button === 2;
    drag = { x: e.clientX, y: e.clientY, v: Object.assign({}, V3), pan }; cv.style.cursor = pan ? 'move' : 'grabbing';
  };
  cv.onpointermove = e => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, loc(e));
    if (pinch && pts.size === 2) { const [a, b] = [...pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mm = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; Object.assign(V3, { k: pinch.v.k, px: pinch.v.px + mm[0] - pinch.m[0], py: pinch.v.py + mm[1] - pinch.m[1] }); zoomAt(d / pinch.d, mm[0], mm[1]); render(); return; }
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.pan) { V3.px = drag.v.px + dx; V3.py = drag.v.py + dy; }
    else { V3.yaw = drag.v.yaw + dx * 0.008; V3.pitch = Math.max(-1.45, Math.min(1.45, drag.v.pitch + dy * 0.008)); }
    render();
  };
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (!pts.size) drag = null; cv.style.cursor = ''; };
  cv.onpointerup = up; cv.onpointercancel = up;
  cv.onwheel = e => { if (!e.ctrlKey) return; e.preventDefault(); const [mx, my] = loc(e); zoomAt(Math.exp(-e.deltaY * 0.002), mx, my); render(); };
  cv.ondblclick = () => { Object.assign(V3, { yaw: -0.6, pitch: 0.32, k: 1, px: 0, py: 0 }); render(); };
  const bar = cv.parentElement && cv.parentElement.querySelector('.v3tools');
  if (bar) {
    bar.querySelectorAll('[data-v3m]').forEach(b => b.onclick = () => { V3.mode = b.dataset.v3m; bar.querySelectorAll('[data-v3m]').forEach(q => q.classList.toggle('on', q === b)); render(); });
    bar.querySelectorAll('[data-v3z]').forEach(b => b.onclick = () => { zoomAt(+b.dataset.v3z > 0 ? 1.25 : 0.8, W / 2, H / 2); render(); });
    const rb = bar.querySelector('[data-v3r]'); if (rb) rb.onclick = () => cv.ondblclick();
  }
}

/* -------------------------------------------------------- Podsumowanie */
const CHECK_DP = { kNm: 1, kN: 1, mm: 1, MPa: 2, 'mm²': 0, '': 3, m: 2, min: 0, 'szt.': 0 };
function ckVal(c, v) { if (c.fmt === 'text') return ''; return fmt(v, CHECK_DP[c.unit] ?? 2); }
function ckCond(c) {
  if (c.fmt === 'text') return c.EdTxt ? `${esc(c.RdTxt)} ≥ ${esc(c.EdTxt)}` : '';
  const u = c.unit ? ' ' + c.unit : '';
  return c.rel === '≥' ? `${ckVal(c, c.Rd)} ≥ ${ckVal(c, c.Ed)}${u}` : `${ckVal(c, c.Ed)} ≤ ${ckVal(c, c.Rd)}${u}`;
}
const STL = { ok: 'OK', fail: 'NIE', warn: 'UWAGA', info: 'INFO' };
U.ckCond = ckCond; U.STL = STL;
function utilBar(c) {
  if ((c.status === 'info' && !/^(lam|biaxF)/.test(c.id)) || (!isFinite(c.ratio) && c.status !== 'fail')) return '';
  const r = isFinite(c.ratio) ? c.ratio : 9.99, w = Math.min(100, r * 100);
  const cls = c.status === 'fail' ? 'fail' : (c.status === 'warn' || r > 0.9) ? 'warn' : '';
  return `<span class="ub ${cls}"><i style="width:${w}%"></i></span><span class="pct">${isFinite(c.ratio) ? fmt(r * 100, 0) + '%' : '∞'}</span>`;
}
const ckKey = c => c.key || (c.id + '|' + c.name);
function renderSummary(el) {
  if (!R || R.errors.length) { el.innerHTML = errBox(); return; }
  const c = R.checks, g = R.g;
  const worst = pred => { const a = c.filter(pred).filter(x => x.status !== 'info'); return a.length ? a.reduce((p, q) => (q.ratio > p.ratio ? q : p)) : null; };
  const card = (t, v, s, ck) => `<div class="card ${ck ? (ck.status === 'fail' ? 'fail' : ck.status === 'warn' ? 'warn' : 'ok') : ''}"><div class="t">${t}</div><div class="v">${v}</div><div class="s">${s}</div></div>`;
  let cards = '';
  if (R.res.length) {
    const wN = worst(x => /^(My|Mz|biax|Nmax)$/.test(x.id));
    const o = R.res.reduce((a, q) => (q.u > a.u ? q : a));
    cards += card('Nośność N + M', wN ? `${fmt(wN.ratio * 100, 0)}%` : '—', `η – największe wykorzystanie · N<sub>Ed,max</sub> = ${fmt(R.NEdMax / 1e3, 0)} kN`, wN);
    cards += card('Smukłość', `${fmt(R.buck.y.lam, 0)} / ${fmt(R.buck.z.lam, 0)}`, `λ<sub>y</sub> / λ<sub>z</sub> · l₀ = ${fmt(R.buck.y.l0 / 1000, 2)} / ${fmt(R.buck.z.l0 / 1000, 2)} m · ${['y', 'z'].some(d => R.res.some(q => q[d].slender)) ? 'efekty II rzędu' : 'bez II rzędu'}`, null);
    cards += card('Momenty obliczeniowe', `${fmt(o.y.MEd / 1e6, 1)} / ${fmt(o.z.MEd / 1e6, 1)}`, `M<sub>Ed,y</sub> / M<sub>Ed,z</sub> [kNm] (z II rzędem)`, null);
    const wV = worst(x => /^V/.test(x.id)); if (wV) cards += card('Ścinanie', `${fmt(Math.max(R.sh.y.VEd, R.sh.z.VEd) / 1e3, 1)} kN`, `V<sub>Ed,max</sub> · ${R.sh.y.needs || R.sh.z.needs ? 'strzemiona obliczeniowe' : 'V<sub>Ed</sub> ≤ V<sub>Rd,c</sub>'}`, wV);
  }
  if (R.lay.n) cards += card('Zbrojenie', `${R.lay.n}⌀${R.lay.dmax}`, `A<sub>s</sub> = ${fmt(R.lay.As, 0)} mm², ρ = ${fmt(R.lay.As / g.Ac * 100, 2)}% · strz. ⌀${R.lay.dt}/${R.ties.s}`, worst(x => /^(asmin|asmax|sp|tied|phimin)$/.test(x.id)));
  cards += card('Otulina', `${R.cov.cnom} mm`, `c<sub>nom</sub> do strzemion · S${R.cov.sc} · ${R.cov.exp}`, c.find(x => x.id === 'cnom'));
  if (R.fire) cards += card('Pożar ' + R.fire.R, R.fire.ok ? 'spełnione' : 'niespełnione', `a = ${fmt(R.fire.a, 0)} mm · μ<sub>fi</sub> = ${fmt(R.fire.mu, 2)} · R(5.7) = ${fmt(R.fire.Rcalc, 0)} min`, { status: R.fire.ok ? 'ok' : 'fail' });
  let html = `<div class="cards">${cards}</div>`;
  const msgs = [...(R.warns || []).map(e => `<div class="msg wrn">${esc(e)}</div>`), ...(R.infos || []).map(e => `<div class="msg wrn">${esc(e)}</div>`)];
  if (msgs.length) html += `<div class="msgs">${msgs.join('')}</div>`;
  const nF = c.filter(x => x.status === 'fail');
  if (nF.length) html += `<div class="failnav">Niespełnione warunki: ${nF.map(x => `<button class="goto" data-goto2="${c.indexOf(x)}" title="Przejdź do miejsca, którego dotyczy warunek">${sym(x.name)}</button>`).join('')}</div>`;
  const ticks = S.meta.ticks || {};
  html += `<div class="tickbar"><span id="tickCnt">Odhaczono: <b>${c.filter(x => ticks[ckKey(x)]).length}</b> z ${c.length}</span><button class="btn sm" id="tickOk">Odhacz spełnione</button><button class="btn sm" id="tickClr">Wyczyść znaczniki</button><span class="hint keep">Znaczniki zmieniają się same: warunek spełniony – zaznaczony, niespełniony – odznaczony. Kliknij numer punktu normy – objaśnienie; warunek lub pasek – jak obliczono; „pokaż →” – miejsce do zmiany.</span></div>`;
  html += `<div class="tscroll"><table class="ctab"><thead><tr><th class="tk">✓</th><th>Sprawdzenie</th><th>Punkt normy</th><th style="text-align:right">Warunek</th><th>Wykorzystanie</th><th>Status</th><th class="nt">Uwagi</th></tr></thead><tbody>`;
  let grp = '';
  c.forEach((x, i) => {
    if (x.grp !== grp) { grp = x.grp; html += `<tr class="g"><td colspan="7">${esc(grp)}</td></tr>`; }
    const on = !!ticks[ckKey(x)];
    html += `<tr class="${on ? 'done' : ''}" data-ci="${i}"><td class="tk"><input type="checkbox" data-tick="${i}" ${on ? 'checked' : ''}></td><td>${sym(x.name)}</td><td class="ref"><button class="nref" data-ref="${i}">${esc(x.ref)}</button></td><td class="val xclick">${ckCond(x)}</td><td class="bar xclick" style="white-space:nowrap">${utilBar(x)}</td><td class="stc"><span class="st ${x.status}">${STL[x.status]}</span>${x.status === 'fail' || x.status === 'warn' ? `<button class="goto" data-goto="${i}" title="Przejdź do miejsca, którego dotyczy warunek – z podświetleniem, co zmienić">pokaż →</button>` : ''}</td><td class="nt">${sym(x.note || '')}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  el.innerHTML = html;
  const setTick = (x, v) => { S.meta.ticks = S.meta.ticks || {}; if (v) S.meta.ticks[ckKey(x)] = true; else delete S.meta.ticks[ckKey(x)]; dirty = true; updateTitle(); autosave(); };
  $$('[data-tick]', el).forEach(cb => cb.addEventListener('change', () => { setTick(c[+cb.dataset.tick], cb.checked); cb.closest('tr').classList.toggle('done', cb.checked); $('#tickCnt', el).innerHTML = `Odhaczono: <b>${c.filter(x => (S.meta.ticks || {})[ckKey(x)]).length}</b> z ${c.length}`; }));
  $('#tickOk', el).onclick = () => { c.forEach(x => { if (x.status === 'ok' || x.status === 'info') setTick(x, true); }); renderSummary(el); };
  $('#tickClr', el).onclick = () => { S.meta.ticks = {}; dirty = true; autosave(); renderSummary(el); };
  $$('[data-ref]', el).forEach(b => b.addEventListener('click', () => normPopup(c[+b.dataset.ref])));
  $$('tr[data-ci] td.xclick', el).forEach(td => td.addEventListener('click', () => explainPopup(c[+td.closest('tr').dataset.ci])));
  $$('[data-goto], [data-goto2]', el).forEach(b => b.addEventListener('click', () => gotoCheck(c[+(b.dataset.goto || b.dataset.goto2)])));
}
// objaśnienie punktu normy (klik w numer punktu w Podsumowaniu) – z wynikiem sprawdzenia w tym projekcie
const normBody = keys => keys.filter(k => window.SZN && window.SZN.N[k]).map(k => { const e = window.SZN.N[k]; return `<div class="nsec"><div class="nlab">${esc(window.SZN.label(k))}</div><h4>${e.t}</h4><p>${e.s}</p>${e.f ? `<div class="nf">${e.f}</div>` : ''}${e.h ? `<div class="nh"><b>Podpowiedź:</b> ${e.h}</div>` : ''}</div>`; }).join('');
function normPopup(x) {
  if (typeof x === 'string') x = { ref: x };
  const keys = window.SZN ? window.SZN.find(x.ref) : [];
  const cond = x.name ? ckCond(x) : '';
  const cur = x.name ? `<div class="ncur"><b>W tym projekcie:</b> ${sym(x.name)}${cond ? ` – ${cond}` : ''}${x.status !== 'info' && isFinite(x.ratio) ? `, wykorzystanie ${fmt(x.ratio * 100, 0)}%` : ''} · <span class="st ${x.status}">${STL[x.status]}</span>${x.note ? `<br><small>${sym(x.note)}</small>` : ''}</div>` : '';
  const m = $('#modal'); m.innerHTML = `<div class="dlg norm"><h3>[${esc(x.ref)}]</h3>${cur}${normBody(keys) || `<p>Brak objaśnienia dla „${esc(x.ref)}”.</p>`}<p class="ndisc">Streszczenia własne – nie zastępują tekstu normy (PN-EN 1992-1-1 z Załącznikiem Krajowym, PN-EN 1992-1-2, PN-EN 1990).</p><div class="dbtn"><button class="btn pri" id="nClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; $('#nClose', m).onclick = closeModal; $('#nClose', m).focus();
}
// raport obliczeń (DOM) – źródło objaśnień „jak obliczono”
let repCache = null;
function repDom() { if (!repCache || repCache.R !== R) { const d = document.createElement('div'); try { d.innerHTML = window.SZR.build(R, S); } catch (e) { d.innerHTML = ''; } repCache = { R, el: d }; } return repCache.el; }
// wyróżnienie (na zielono) wzoru, w którym obliczono klikniętą wielkość, i samej wartości
const XNUM = /\d+⌀\d+|⌀\d+|(?<![\d.,])\d+(?:,\d+)?(?![\d.]|,\d)/g;
const XNUMT = /\d+⌀\d+|⌀\d+|(?<![\d.,])\d{1,3}(?:[   ]\d{3})+(?:,\d+)?(?![\d.]|,\d)|(?<![\d.,])\d+(?:,\d+)?(?![\d.]|,\d)/g;
const xnorm = t => String(t || '').replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1').replace(/[   ]/g, ' ').replace(/−/g, '-');
function xnums(t) {
  const q = xnorm(t).replace(/x = [\d,]+ m/g, ' ').replace(/(wzór|pkt|tab\.?|poz\.?|kombinacja)\s*\d+/gi, ' ');
  return [...new Set((q.match(XNUM) || []).filter(v => /⌀|,/.test(v) || v.length >= 2))].slice(0, 8);
}
const xparse = t => { const q = t.replace(/[\s   ]/g, ''); if (q.includes('⌀')) return { bar: q }; const [i, f] = q.split(','); return { v: parseFloat(i + '.' + (f || '0')), dp: f ? f.length : 0 }; };
function xsame(a, b) {
  if (a.bar || b.bar) { if (!a.bar || !b.bar) return false; const [s1, l1] = a.bar.length <= b.bar.length ? [a.bar, b.bar] : [b.bar, a.bar]; return s1 === l1 || (s1[0] === '⌀' && l1.endsWith(s1)); }
  const dp = Math.min(a.dp, b.dp); if (Math.abs(a.dp - b.dp) > 2) return false;
  if (dp === 0 && Math.max(a.v, b.v) < 10 && a.dp !== b.dp) return false;
  return Math.abs(a.v - b.v) <= 0.5 * Math.pow(10, -dp) + 1e-9;
}
function xtoks(label) {
  return [...new Set((String(label || '').match(/\p{L}[\p{L}\p{N},₀-₉′]*/gu) || []).map(t => t.replace(/,+$/, '')).filter(t => t.length >= 2 && (/[A-ZĄĆĘŁŃÓŚŹŻΑ-Ωα-ωσεξθρφλ]/u.test(t) || /^[a-z]{1,2},[a-z]+$/.test(t)) && !/^(Jak|Wynik|Siła|Moment|Przekrój|TAK|NIE|OK|UWAGA|Zbrojenie|Kombinacja)$/.test(t)))].slice(0, 4);
}
function xprep(label, primTxt, secTxt) {
  const P = xnums(primTxt).map(xparse), S2 = xnums(secTxt).map(xparse).filter(q => !P.some(p => xsame(p, q) && p.dp === q.dp));
  return { P, S2, T: xtoks(label), ph: String(label || '').split(' – ')[0].replace(/\s*\(.*$/, '').trim().toLowerCase() };
}
const xnumsIn = el => (xnorm(el.textContent).match(XNUMT) || []).map(xparse);
function xscore(n, q) {
  const ns = xnorm(n.textContent).replace(/[\s_]/g, ''), nn = xnumsIn(n); let sc = 0, val = 0, def = 0;
  q.P.forEach(v => { if (nn.some(r => xsame(v, r))) { const w = v.bar || v.v >= 10 || v.dp >= 1 ? 5 : 2; sc += w; val += w; } });
  q.S2.forEach(v => { if (nn.some(r => xsame(v, r))) sc += 2; });
  q.T.forEach(t => { const tn = t.replace(/[\s_]/g, ''), te = tn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); if (new RegExp('(^|[^\\p{L}])' + te + '(=|≤|≥|<|>|:)', 'u').test(ns)) { sc += 3; def++; } else if (ns.includes(tn)) sc += 1; });
  if (q.ph.length >= 6 && xnorm(n.textContent).toLowerCase().includes(q.ph)) sc += 1;
  return { sc, val, def };
}
const xcands = root => [...root.querySelectorAll('.eq, tr, p.ln, div.ln, li')].filter(n => !n.querySelector('th') && !n.closest('.fig') && !n.querySelector('.eq, tr'));
function markVals(el, tgt) {
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), tn = [];
  while (walk.nextNode()) tn.push(walk.currentNode);
  tn.forEach(t => {
    const src = t.nodeValue; let last = 0, m, hit = false; const frag = document.createDocumentFragment(); XNUMT.lastIndex = 0;
    while ((m = XNUMT.exec(src))) {
      if (!tgt.some(v => xsame(v, xparse(m[0])))) continue;
      hit = true; frag.appendChild(document.createTextNode(src.slice(last, m.index)));
      const mk = document.createElement('mark'); mk.className = 'xval'; mk.textContent = m[0]; frag.appendChild(mk); last = m.index + m[0].length;
    }
    if (!hit) return; frag.appendChild(document.createTextNode(src.slice(last))); t.parentNode.replaceChild(frag, t);
  });
}
function hiliteFrag(root, label, primTxt, secTxt) {
  if (!root) return null;
  const q = xprep(label, primTxt, secTxt), { P, S2 } = q, cands = xcands(root);
  let best = null, bs = 0;
  cands.forEach(n => { const { sc } = xscore(n, q); if (sc > bs) { bs = sc; best = n; } });
  if (!best || bs < 3) return null;
  const sel = [best];
  if (P.length <= 2) P.forEach(v => { if (sel.length >= 3 || v.bar || (v.v < 10 && v.dp < 2)) return;
    const f = cands.find(n => !sel.includes(n) && (xnorm(n.textContent).match(/=\s*-?[\d ]+(?:,\d+)?/g) || []).some(z => { const r = xparse(z.replace(/^=\s*-?/, '')); return r.dp >= v.dp && xsame(v, r); }));
    if (f) sel.push(f); });
  sel.forEach(el => { el.classList.add('xhit'); const nn = xnumsIn(el), pm = P.filter(v => nn.some(r => xsame(v, r))); markVals(el, pm.length ? pm : S2); });
  const first = cands.find(n => sel.includes(n));
  setTimeout(() => first.scrollIntoView({ block: 'center' }), 30);
  return best;
}
// rozdział raportu dla wielkości (wiersz tabeli, wykres): wg nazwy wielkości i płaszczyzny
const XRX = [
  [/zestawienie stali|masa|\bkg\b|razem/i, /Zbrojenie słupa i zestawienie/i],
  [/zakotw|zakład|l_?bd|lb,rqd|f_?bd|α₆|startow/i, /Zakłady i zakotwienia/i],
  [/c_?nom|otulin|c_?min|Δc|klasa konstrukcji/i, /Otulina/i],
  [/w_?k|rys|s_?r,max|σ_?s|σ_?c|naprężen|SGU/i, /użytkowalności/i],
  [/strzem|s_?cl|szpilk|⌀_?t|ramion/i, /Strzemiona/i],
  [/V_?Ed|V_?Rd|ścin|cot|θ|α_?cw|VEd/i, /Ścinanie/i],
  [/M_?2|e_?2|e2|1\/r|K_?r|K_?φ|II rzęd|N_?B|nominaln|M_?0e|M_?0Ed|φ_?ef|λ_?lim/i, /Efekty II rzędu/i],
  [/λ|smukł|l_?0|l₀|i_?min|imperfek|e_?i|θ_?i|wybocz|pełzan/i, /Długość wyboczeniowa/i],
  [/ukośn|5\.39|kontur/i, /Zginanie ukośne/i],
  [/N_?Rd|N_?Ed|M_?Ed|M_?Rd|MEd|nośn|interakc|zgin|ściskan/i, /Nośność przekroju|Nośność na ściskanie/i],
  [/A_?s,?min|A_?s,?max|odstęp|⌀_?min|ρ|prześwit|buław/i, /Wymagania konstrukcyjne/i],
  [/kombin|ψ|6\.10|G_?k|Q_?k|obciąż|N_?k/i, /Dane wejściowe|Kombinacje SGN/i],
  [/f_?ck|f_?cd|E_?cm|f_?yd|E_?cd|beton|stal/i, /Parametry materiałowe/i],
  [/pożar|ognio|μ_?fi|a_?min|R\s?\d{2,3}/i, /Odporność ogniowa/i],
];
function explainRow(label, loc, rowText, ctx) {
  const t = label + ' ' + rowText, fx = q => (XRX.find(([a]) => a.test(q)) || [])[1];
  const rx = fx(label) || (ctx && fx(ctx)) || fx(t);
  const d = repDom(), nodes = [...d.querySelectorAll('h2, h3, h4, .eq, p, table, .fig, div.ln')];
  if (!rx) return { html: '', sec: '' };
  const lc = (loc || '').toLowerCase(), h2s = nodes.map((n, i) => [n, i]).filter(([n]) => n.tagName === 'H2' && rx.test(n.textContent));
  if (!h2s.length) return { html: '', sec: '' };
  const pick0 = (lc && h2s.find(([n]) => n.textContent.toLowerCase().includes(lc))) || h2s[0], i0 = pick0[1];
  let i1 = nodes.findIndex((n, i) => i > i0 && n.tagName === 'H2'); if (i1 < 0) i1 = nodes.length;
  let a = i0 + 1, b = i1, sub = false;
  if (lc) { const k = nodes.findIndex((n, i) => i > i0 && i < i1 && /^H[34]$/.test(n.tagName) && n.textContent.toLowerCase().includes(lc)); if (k > 0) { a = k; sub = true; b = nodes.findIndex((n, i) => i > k && /^H[23]$/.test(n.tagName)); if (b < 0 || b > i1) b = i1; } }
  const pick = nodes.slice(a, Math.min(b, a + 90)).filter(n => !n.closest('.fig') && !n.classList.contains('fig')).filter(n => !(n.parentElement && n.parentElement.closest('table, .eq, div.ln, p')));
  return { html: pick.map(n => n.outerHTML).join(''), sec: nodes[i0].textContent + (sub ? ' → ' + nodes[a].textContent : '') };
}
function xlocate(label, primTxt, secTxt) {
  const q = xprep(label, primTxt, secTxt); if (!q.P.length && !q.T.length) return null;
  const d = repDom(), cs = xcands(d).map(n => ({ n, r: xscore(n, q) }));
  const pick0 = cs.filter(c => c.r.val >= 5).sort((a, b) => b.r.sc - a.r.sc)[0] || cs.filter(c => c.r.def && c.r.sc >= 3).sort((a, b) => b.r.sc - a.r.sc)[0];
  const best = pick0 && pick0.n; if (!best) return null;
  const nodes = [...d.querySelectorAll('h2, h3, h4, .eq, p, table, .fig, div.ln')], k = nodes.findIndex(n => n === best || n.contains(best)); if (k < 0) return null;
  let i0 = k; while (i0 > 0 && nodes[i0].tagName !== 'H2') i0--;
  let a = k; while (a > i0 && !/^H[34]$/.test(nodes[a].tagName)) a--;
  let b = nodes.findIndex((n, i) => i > a && (n.tagName === 'H2' || (a > i0 && /^H[34]$/.test(n.tagName)))); if (b < 0) b = nodes.length;
  if (a === i0) a = i0 + 1;
  if (b - a > 80) { a = Math.max(a, k - 30); b = Math.min(b, k + 30); }
  const pick = nodes.slice(a, b).filter(n => !n.closest('.fig') && !n.classList.contains('fig')).filter(n => !(n.parentElement && n.parentElement.closest('table, .eq, div.ln, p')));
  return { html: pick.map(n => n.outerHTML).join(''), sec: nodes[i0].textContent + (a > i0 + 1 || /^H[34]$/.test(nodes[a].tagName) ? ' → ' + nodes[a].textContent : '') };
}
// „jak obliczono” dowolnego wyniku (wiersz tabeli, znacznik wykresu): rozdział raportu, wiersz wzoru i wartość wyróżnione na zielono
function explainRowPopup(label, loc, rowText, ctx, valTxt, fullRow, title) {
  const r = explainRow(label, loc, rowText, ctx), m = $('#modal');
  m.innerHTML = `<div class="dlg norm expl"><h3>Jak obliczono: ${title ? sym(title) : esc(String(label).slice(0, 90))}${loc ? ` <small>(${esc(loc)})</small>` : ''}</h3>
    <div class="ncur"><b>Wynik:</b> ${esc(rowText.replace(/\s+/g, ' ').trim().slice(0, 240))}</div>
    ${r.html ? `<h4 class="lsec">Wzory, podstawienia i wyniki – raport: ${esc(r.sec)}</h4><div class="rexp">${r.html}</div>` : `<p class="hint keep">Dla tej wielkości raport nie zawiera osobnego wyprowadzenia – to dana wejściowa albo wynik pomocniczy; pełny tok obliczeń – zakładka Raport obliczeń.</p>`}
    <p class="ndisc">Wzór, w którym obliczono klikniętą wielkość, i jej wartość – wyróżnione na zielono. Odnośniki do punktów normy w tekście można kliknąć.</p><div class="dbtn"><button class="btn pri" id="nClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; $('#nClose', m).onclick = closeModal;
  const pv = valTxt !== undefined && valTxt !== '' ? valTxt : rowText, sv = rowText + ' ' + (fullRow || '');
  if (!hiliteFrag($('.rexp', m), label, pv, sv)) {
    const g = xlocate(label, pv, sv);
    if (g) {
      const box = $('.rexp', m), hint = $('p.hint', m);
      if (box) { box.innerHTML = g.html; $('h4.lsec', m).textContent = 'Wzory, podstawienia i wyniki – raport: ' + g.sec; }
      else if (hint) hint.outerHTML = `<h4 class="lsec">Wzory, podstawienia i wyniki – raport: ${esc(g.sec)}</h4><div class="rexp">${g.html}</div>`;
      hiliteFrag($('.rexp', m), label, pv, sv);
    }
  }
}
U.explainRowPopup = explainRowPopup;
// klik w wiersz tabeli wyników (.xres) – jak obliczono
document.addEventListener('click', e => {
  if (!R || !R.checks) return;
  const tr = e.target.closest && e.target.closest('.xres tr'); if (!tr || tr.classList.contains('xclick') || tr.dataset.face || tr.dataset.selc || tr.dataset.openload) return;
  if (e.target.closest('input, select, button, a, .nref, .nlink, textarea, svg')) return;
  if (tr.querySelector('input, select, textarea') || !tr.querySelector('td')) return;
  if (tr.closest('#p-sum') || tr.closest('.dlg.expl')) return;
  const cells = [...tr.cells].map(c => c.textContent.trim()), row = cells.join(' ').replace(/\s+/g, ' ').trim();
  const tb = tr.closest('table'), head = tb && tb.querySelector('tr th') ? [...tb.querySelectorAll('thead tr:first-child th, tr:first-child th')].map(th => th.textContent.trim()) : [];
  const ci = Math.max(0, [...tr.cells].indexOf(e.target.closest('td')));
  const label = ci > 0 && head[ci] ? `${head[ci]} – ${cells[0]}` : (cells[0] || row);
  const box = tr.closest('.box, .dlg'), lm = /płaszczy[zź]n\w* ([hb])\b/i.exec(row + ' ' + (box ? box.textContent.slice(0, 160) : '')), loc = lm ? `płaszczyzna ${lm[1]}` : '';
  const wrap = tb && (tb.closest('.tscroll') || tb), prev = wrap && wrap.previousElementSibling, ctx = prev && /^H\d$|h2|h4/i.test(prev.tagName + ' ' + prev.className) && prev.textContent.length < 160 ? prev.textContent : (box && box.querySelector('h4') ? box.querySelector('h4').textContent : '');
  explainRowPopup(label, loc, head.length && ci > 0 ? `${head[ci]}: ${cells[ci]} (${cells[0]})` : row, ctx, ci > 0 && xnums(cells[ci]).length ? cells[ci] : cells.slice(1).join(' ') || row, cells.join(' '));
});
// „jak obliczono” – sprawdzenie z Podsumowania: fragment raportu dla tego warunku, wzór i wartość wyróżnione, punkt normy
function explainPopup(c) {
  if (!c) return;
  const d = repDom(), key = c.sec || 'cov', frag = d.querySelector(`section[data-sec="${key}"]`);
  const keys = window.SZN ? window.SZN.find(c.ref) : [], nb = normBody(keys), cond = ckCond(c);
  const m = $('#modal');
  m.innerHTML = `<div class="dlg norm expl"><h3>Jak obliczono: ${sym(c.name)}</h3>
    <div class="ncur"><b>Wynik:</b> ${cond || '—'}${c.status !== 'info' && isFinite(c.ratio) ? ` · wykorzystanie <b>${fmt(c.ratio * 100, 0)}%</b>` : ''} · <span class="st ${c.status}">${STL[c.status]}</span>${c.note ? `<br><small>${sym(c.note)}</small>` : ''}</div>
    ${frag ? `<h4 class="lsec">Wzory, podstawienia i wyniki (z raportu obliczeń)</h4><div class="rexp">${frag.innerHTML}</div>` : ''}
    <h4 class="lsec">Punkt normy [${esc(c.ref)}]</h4>${nb || `<p>Brak objaśnienia dla odnośnika „${esc(c.ref)}”.</p>`}
    <p class="ndisc">Wzór, w którym obliczono wynik, i jego wartość – wyróżnione na zielono. Objaśnienia opracowane na potrzeby programu – nie zastępują treści normy.</p><div class="dbtn">${c.status === 'fail' || c.status === 'warn' ? '<button class="btn" id="exGo">Pokaż, co zmienić →</button>' : ''}<button class="btn" id="exRep">Pokaż w raporcie</button><button class="btn pri" id="nClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; $('#nClose', m).onclick = closeModal; $('#nClose', m).focus();
  const go = $('#exGo', m); if (go) go.onclick = () => gotoCheck(c);
  $('#exRep', m).onclick = () => { closeModal(); U.selectTab('report'); setTimeout(() => { const s2 = $(`#p-report section[data-sec="${key}"]`); if (s2) { s2.scrollIntoView({ block: 'start' }); flash(s2); } }, 80); };
  const tmp = document.createElement('div'); tmp.innerHTML = cond || ''; const lb = c.name.replace(/\s*\(.*$/, ''), pv = xnums(tmp.textContent).length ? tmp.textContent : c.name, sv = c.name + ' ' + (c.note || '');
  if (!hiliteFrag($('.rexp', m), lb, pv, sv)) { const g = xlocate(lb, pv, sv), box = $('.rexp', m);
    if (g && box) { box.innerHTML = g.html; const h4 = box.previousElementSibling; if (h4 && h4.matches('h4.lsec')) h4.textContent = 'Wzory, podstawienia i wyniki – raport: ' + g.sec; hiliteFrag(box, lb, pv, sv); } }
}
// okno objaśnienia odnośnika klikniętego w tekście – osobna warstwa nad oknami dialogowymi
function normRefPopup(ref, keys) {
  let m = $('#nmodal');
  if (!m) { m = document.createElement('div'); m.id = 'nmodal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); document.body.appendChild(m); }
  m.innerHTML = `<div class="dlg norm"><h3>[${esc(ref)}]</h3>${normBody(keys) || `<p>Brak objaśnienia dla odnośnika „${esc(ref)}”.</p>`}<p class="ndisc">Streszczenie i podpowiedź opracowane na potrzeby programu – nie zastępują treści normy.</p><div class="dbtn"><button class="btn pri" id="nmClose">Zamknij</button></div></div>`;
  m.style.display = 'flex';
  const close = () => { m.style.display = 'none'; window.removeEventListener('keydown', kd, true); };
  const kd = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); close(); } };
  window.addEventListener('keydown', kd, true);
  m.onmousedown = e => { if (e.target === m) close(); };
  $('#nmClose', m).onclick = close; $('#nmClose', m).focus();
}
// numery punktów, tablic, rysunków i wzorów normy w tekście → przyciski z objaśnieniem
const NREF_RX = /(PN-EN\s*1990|PN-EN\s*1992-1-2|EN\s*1992-1-2)?([,\s]*)(?:([Tt]abl?\.|[Rr]ys\.|[Ww]zór|[Ww]zory|[Ww]zoru|[Ww]zorach|[Ww]z\.|[Zz]ał\.)\s*)?(\()?(?<![\p{L}\d.,])(\d{1,2}\.\d{1,2}(?:\.\d{1,2}){0,3}[a-zA-Z]{0,3}|[A-E]\.\d{1,2}[A-Z]?|[A-J](?![\p{L}\d]))(\(\d{1,2}\))?(\))?(?!\d|,\d)/gu;
const NL_SKIP = 'svg,button,select,option,textarea,input,script,style,.nlink,.dlg.norm .nsec,#top,.tabs,.nf,[contenteditable],.ctab td.val,.kv td:nth-child(2),.sched';
function linkRefs(root) {
  const B = window.SZN; if (!root || !B || !B.resolve) return 0;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => /\d\.\d|ał\.\s*[A-J]/.test(n.nodeValue) && n.parentElement && !n.parentElement.closest(NL_SKIP) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const list = []; let n; while ((n = tw.nextNode())) list.push(n);
  let cnt = 0;
  list.forEach(tn => {
    const t = tn.nodeValue; let last = 0, made = false; const frag = document.createDocumentFragment();
    NREF_RX.lastIndex = 0; let m, prevEnd = 0;
    while ((m = NREF_RX.exec(t))) {
      const [all, g1, g2, pre, po, tok, tail, pc] = m;
      const pe = prevEnd; prevEnd = m.index + all.length;
      if (!all.length) { NREF_RX.lastIndex++; continue; }
      if (!tok) continue;
      const preL = (pre || '').toLowerCase();
      let kind = /^tab/.test(preL) ? 'tab' : /^rys/.test(preL) ? 'rys' : /^wz/.test(preL) ? 'eq' : /^zał/.test(preL) ? 'zal' : '';
      if (/^[A-J]$/.test(tok) && kind !== 'zal') continue;
      if (!kind && /^\d+\.\d+$/.test(tok) && /[\d]\s*$/.test(t.slice(0, m.index))) continue;
      if (!kind && !po && /^\s*(m|mm|kN|kNm|MPa|%|‰|°)/.test(t.slice(m.index + all.length))) continue;    // liczby z jednostką, nie punkty normy
      if (!kind) { const parts = tok.replace(/[a-zA-Z]+$/, '').split('.').length; kind = parts === 2 && !tail && (po && pc || /[a-zA-Z]$/.test(tok)) ? 'eq' : 'cl'; }
      if (kind === 'cl' && tok.split('.').length === 2 && !po && !/pkt|punkt|rozdz|PN-EN|EN\s/.test(t.slice(Math.max(0, m.index - 14), m.index)) && !/–\s*$|-\s*$/.test(t.slice(Math.max(0, m.index - 3), m.index))) continue;
      const ctx = (g1 || '') + ' ' + t.slice(Math.max(pe, m.index - 40), m.index);
      const keys = B.resolve(kind, tok, ctx);
      if (!keys.length) continue;
      const both = !!(po && pc);
      let s0 = m.index + (g1 || '').length + (g2 || '').length, s1 = m.index + all.length;
      if (po && !both) { if (!pre) s0 += 1; }
      if (pc && !both) s1 -= 1;
      if (s0 > last) frag.appendChild(document.createTextNode(t.slice(last, s0)));
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'nlink'; b.dataset.nk = keys.join(','); b.dataset.nref = t.slice(s0, s1).replace(/^\(|\)$/g, '').trim();
      b.title = keys.map(k => B.label(k)).join('; ') + ' – kliknij, aby zobaczyć objaśnienie';
      b.textContent = t.slice(s0, s1);
      frag.appendChild(b); last = s1; made = true; cnt++;
    }
    if (!made) return;
    if (last < t.length) frag.appendChild(document.createTextNode(t.slice(last)));
    tn.parentNode.replaceChild(frag, tn);
  });
  return cnt;
}
U.linkRefs = linkRefs;
// objaśnienia tekstowe (.hint) – długie zwinięte pod klikalnym „Objaśnienie”; krótkie i komunikaty (.keep) – widoczne
const HX_OPEN = new Set();
function hxOne(el) {
  if (el.id || el.classList.contains('keep') || el.closest('.rexp, #p-report, svg, .dlg.fpop, .rbprev, #modal .dlg.sm') || el.dataset.hint !== undefined) return;
  const kids = [...el.childNodes].filter(n => !(n.nodeType === 3 && !n.textContent.trim()));
  if (!kids.length || (kids.length === 1 && kids[0].nodeName === 'DETAILS' && kids[0].classList.contains('hx'))) return;
  if ((el.textContent || '').length < 140) return;
  const key = el.dataset.xt || (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
  const d = document.createElement('details'), sm = document.createElement('summary'), body = document.createElement('div');
  d.className = 'exh hx'; sm.textContent = el.dataset.xt || 'Objaśnienie';
  kids.forEach(n2 => body.appendChild(n2));
  el.textContent = ''; d.appendChild(sm); d.appendChild(body); el.appendChild(d);
  if (HX_OPEN.has(key)) d.open = true;
  d.addEventListener('toggle', () => { if (d.open) HX_OPEN.add(key); else HX_OPEN.delete(key); });
}
function hxWrap(root) {
  if (!root || root.nodeType !== 1) return;
  if (root.matches('p.hint')) hxOne(root);
  root.querySelectorAll('p.hint').forEach(hxOne);
}
let nlT = 0;
function nlRun() { ['.pane.on', '#modal'].forEach(sel => { const el = $(sel); if (el) linkRefs(el); }); nlObs.takeRecords(); }
const nlObs = new MutationObserver(recs => {
  recs.forEach(r => { if (!r.addedNodes.length || r.target.nodeType !== 1) return; r.addedNodes.forEach(hxWrap); });
  if (!recs.some(r => r.addedNodes.length && r.target.nodeType === 1 && !(r.target.closest && r.target.closest('svg')))) return;
  clearTimeout(nlT); nlT = setTimeout(nlRun, 120);
});
document.addEventListener('click', e => {
  const b = e.target && e.target.closest && e.target.closest('.nlink'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  normRefPopup(b.dataset.nref, (b.dataset.nk || '').split(',').filter(Boolean));
}, true);

/* -------------------------------------------------------------- Raport */
const repMode = () => S.meta.repMode || 'full';
const repRaw = () => repMode() === 'static' ? window.SZR.buildStatic(R, S) : window.SZR.build(R, S);
// raport bez odwołań do normy (domyślnie, jak w BelkaŻB) – dodatkowo odwołania typowe dla słupów
const noRefs = h => window.SZR.noRefs(h).split(/(<[^>]+>)/).map(t => t[0] === '<' ? t : t.replace(/\s*\((?:rozdz|zał)\.[^)]*\)/g, '').replace(/\s+(?:wg|według)\s+\d+\.\d+(?:\.\d+)*(?:\(\d+\))?/g, '').replace(/warunek 5\.38[ab]/g, 'warunek').replace(/\b([Tt]ablic[aąy]) 5\.2a/g, '$1')).join('');
const repBuild = () => { const h = repRaw(); return S.meta.repRefs ? h : noRefs(h); };
const repFull = () => { const h = window.SZR.build(R, S); return S.meta.repRefs ? h : noRefs(h); };
const repStatic = () => { const h = window.SZR.buildStatic(R, S); return S.meta.repRefs ? h : noRefs(h); };
function renderReport(el) {
  if (!R || R.errors.length) { el.innerHTML = errBox(); return; }
  const mode = repMode();
  const tools = `<div class="rtools"><div class="seg">${[['full', 'Raport pełny'], ['static', 'Dane, obciążenia i kombinacje'], ['own', 'Raport własny']].map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-rm="${k}">${l}</button>`).join('')}</div><label class="chk sm" style="margin:0 6px" title="Numery punktów, tablic, rysunków i wzorów normy w raporcie (domyślnie bez – zostają numery wzorów kombinacji PN-EN 1990)"><input type="checkbox" id="rpRefs" ${S.meta.repRefs ? 'checked' : ''}><span>odnośniki do normy</span></label><span style="flex:1"></span><button class="btn" id="rpHtml">Zapisz raport HTML…</button><button class="btn" id="rpOdt">Zapisz .odt (edytowalny)…</button><button class="btn pri" id="rpPrint">Drukuj / zapisz PDF</button></div>`;
  if (mode === 'own') { el.innerHTML = tools + ownToolsHTML() + `<div id="ownrep" contenteditable="true" spellcheck="true">${S.meta.own || repFull()}</div>`; bindOwn(el); }
  else el.innerHTML = tools + `<div id="report">${repBuild()}</div>`;
  $$('[data-rm]', el).forEach(b => b.onclick = () => { S.meta.repMode = b.dataset.rm; dirty = true; autosave(); renderReport(el); });
  const rr = $('#rpRefs', el); if (rr) rr.onchange = () => { S.meta.repRefs = rr.checked; dirty = true; autosave(); repCache = null; renderReport(el); };
  $('#rpHtml', el).onclick = () => exportHTML();
  $('#rpOdt', el).onclick = () => exportODT();
  $('#rpPrint', el).onclick = () => doPrint();
  if (ART) { $('#rpPrint', el).hidden = true; $('#rpOdt', el).hidden = true; if (!Cap.dl) $('#rpHtml', el).hidden = true; }
  $$('#report .nref', el).forEach(b => b.addEventListener('click', () => normPopup(b.dataset.nref || b.textContent)));
}
function ownToolsHTML() { return `<div class="owntools rtools">${[['bold', '<b>B</b>'], ['italic', '<i>I</i>'], ['underline', '<u>U</u>'], ['h2', 'H2'], ['h3', 'H3'], ['p', '¶'], ['ul', '• lista'], ['undo', '↶'], ['redo', '↷']].map(([k, l]) => `<button class="btn sm" data-oc="${k}">${l}</button>`).join('')}<span style="flex:1"></span><button class="btn sm" id="ownIns">Wstaw raport pełny</button><button class="btn sm" id="ownSt">Wstaw dane i kombinacje</button><button class="btn sm" id="ownDate">Wstaw datę</button><button class="btn sm" id="ownRst">Przywróć raport obliczeń</button><button class="btn sm dng" id="ownClr">Wyczyść</button></div><p class="hint">Raport własny: kliknij w tekst i pisz; zmiany zapisują się w projekcie i nie zmieniają się przy kolejnych obliczeniach.</p>`; }
function bindOwn(el) {
  const o = $('#ownrep', el);
  const save = () => { S.meta.own = o.innerHTML; dirty = true; updateTitle(); autosave(); };
  o.addEventListener('input', save);
  $$('[data-oc]', el).forEach(b => b.addEventListener('mousedown', e => { e.preventDefault(); const k = b.dataset.oc; if (k === 'h2' || k === 'h3' || k === 'p') document.execCommand('formatBlock', false, k); else if (k === 'ul') document.execCommand('insertUnorderedList'); else document.execCommand(k); save(); }));
  $('#ownIns', el).onclick = () => { o.focus(); document.execCommand('insertHTML', false, repFull()); save(); };
  $('#ownSt', el).onclick = () => { o.focus(); document.execCommand('insertHTML', false, repStatic()); save(); };
  $('#ownDate', el).onclick = () => { o.focus(); document.execCommand('insertText', false, new Date().toLocaleDateString('pl-PL')); save(); };
  $('#ownRst', el).onclick = async () => { if (await ask('Zastąpić raport własny bieżącym raportem obliczeń?', 'Przywróć')) { delete S.meta.own; dirty = true; autosave(); renderReport(el); } };
  $('#ownClr', el).onclick = async () => { if (await ask('Wyczyścić raport własny?', 'Wyczyść', true)) { S.meta.own = '<p></p>'; dirty = true; autosave(); renderReport(el); } };
}

/* ---------------------------------------------------- motyw kolorów SVG */
const SVCOL = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function themeSvgIn(root) {
  root.querySelectorAll('svg [fill], svg [stroke]').forEach(el => {
    ['fill', 'stroke'].forEach(a => { const v = el.getAttribute(a); if (!v || !SVCOL.test(v)) return; let h = v.slice(1).toLowerCase(); if (h.length === 3) h = h.replace(/./g, c => c + c); el.style.setProperty(a, `var(--sv-${h}, #${h})`); });
  });
}
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.tagName.toLowerCase() === 'svg') themeSvgIn(n.parentNode || n); else if (n.querySelector('svg')) themeSvgIn(n); }))).observe(document.documentElement, { childList: true, subtree: true });

/* ------------------------------------------------------------- host / pliki */
const ART = !!window.__ARTIFACT;
const Cap = { dl: null, db: null, col: null, uid: null, list: [], ready: false, slow: false, err: null };
let cloudId = null, cloudName = '';
const pending = {}; let reqId = 0;
window.__hostReply = (id, res) => { const p = pending[id]; if (p) { delete pending[id]; p(res); } };
function hostCall(op, args) { return new Promise(res => { const id = ++reqId; pending[id] = res; try { window.hostRequest(JSON.stringify(Object.assign({ id, op }, args))); } catch (e) { delete pending[id]; res({ ok: false, err: String(e) }); } }); }
const inHost = () => typeof window.hostRequest === 'function';
function toast(msg, ms) { const t = $('#toast'); t.textContent = msg; t.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(() => t.style.display = 'none', ms || 2600); }
U.toast = toast;
function baseName(p) { return (p || '').split(/[\\/]/).pop(); }
const safeName = ext => (S.meta.name || 'slup').replace(/[\\/:*?"<>|]+/g, '_').trim() + ext;
function updateTitle() {
  if (ART) { $('#fileName').textContent = (dirty ? '● ' : '') + (cloudId ? '☁ ' + (cloudName || 'projekt') : (filePath ? baseName(filePath) : 'nowy projekt')); return; }
  const fn = filePath ? baseName(filePath) : 'bez nazwy';
  $('#fileName').textContent = (dirty ? '● ' : '') + fn;
  const t = `SłupŻB – ${S.meta.name || 'słup'} [${fn}${dirty ? ' *' : ''}]`;
  document.title = t;
  if (typeof window.hostTitle === 'function') { try { window.hostTitle(t); } catch (e) { /* */ } }
}
// kilka słupów w projekcie
let COLS = null, curC = 0;
const colsSync = () => { if (!COLS) COLS = [S]; COLS[curC] = S; };
const colsOut = () => { colsSync(); return COLS.length > 1 ? { cols: COLS.map(b => b), cur: curC } : {}; };
function colsIn(o, st) { if (o && Array.isArray(o.cols) && o.cols.length > 1) { COLS = o.cols.slice(0, 20).map(b => E.normalize(b)); curC = Math.max(0, Math.min(COLS.length - 1, +o.cur || 0)); return COLS[curC]; } COLS = null; curC = 0; return st; }
function switchCol(i) { colsSync(); if (i === curC || !COLS[i]) return; curC = i; S = COLS[i]; selCombo = null; $('#projName').value = S.meta.name || ''; rendered = {}; renderInputs(); recalc(); updateTitle(); autosave(); }
function addCol() { colsSync(); if (COLS.length >= 20) { toast('Maksymalnie 20 słupów w projekcie.'); return; } const n = E.defaultState(); ['mat', 'env', 'coef', 'sls', 'fire', 'sec2', 'det'].forEach(k => { n[k] = JSON.parse(JSON.stringify(S[k])); }); n.meta.name = `Słup S-${COLS.length + 1}`; COLS.push(E.normalize(n)); dirty = true; switchCol(COLS.length - 1); }
function delCol(i) { colsSync(); if (COLS.length < 2) return; COLS.splice(i, 1); if (i < curC) curC--; curC = Math.min(curC, COLS.length - 1); S = COLS[curC]; dirty = true; $('#projName').value = S.meta.name || ''; rendered = {}; renderInputs(); recalc(); updateTitle(); autosave(); }
function colTabsHTML() { colsSync(); return `<div class="beamtabs">${COLS.map((b, i) => `<button class="btab ${i === curC ? 'on' : ''}" data-ctab="${i}" title="${esc(b.meta.name || 'Słup ' + (i + 1))}">${i + 1}<span>${esc((b.meta.name || '').slice(0, 14))}</span>${i === curC && COLS.length > 1 ? `<i data-cdel="${i}" title="Usuń ten słup">×</i>` : ''}</button>`).join('')}${COLS.length < 20 ? '<button class="btab add" data-cadd="1" title="Dodaj kolejny słup – osobne dane i obliczenia">+</button>' : ''}</div>`; }
document.addEventListener('click', async e => {
  const d = e.target.closest && e.target.closest('[data-cdel]'); if (d) { e.stopPropagation(); const i = +d.dataset.cdel; if (await ask(`Usunąć słup „${esc(COLS[i].meta.name || i + 1)}” z projektu?`, 'Usuń', true)) delCol(i); return; }
  const t = e.target.closest && e.target.closest('[data-ctab]'); if (t) { switchCol(+t.dataset.ctab); return; }
  if (e.target.closest && e.target.closest('[data-cadd]')) addCol();
});
let asT = null;
function autosave() {
  clearTimeout(asT);
  asT = setTimeout(() => {
    const data = JSON.stringify(Object.assign({ state: S, filePath, cloudId, cloudName }, colsOut()));
    if (typeof window.hostStore === 'function') { try { window.hostStore(data); } catch (e) { /* */ } }
    else { try { localStorage.setItem('slupzb-autosave', data); } catch (e) { /* */ } }
  }, 600);
}
function projectJSON() { return JSON.stringify(Object.assign({ app: 'SlupZB', version: 1, saved: new Date().toISOString(), state: S }, colsOut()), null, 2); }
async function offerFile(name, data, okMsg) {
  if (!Cap.dl) { toast('Pobieranie plików nie jest dostępne w tym widoku.'); return false; }
  try { await Cap.dl.save({ filename: name, data }); toast(okMsg); return true; }
  catch (e) { const c = e && e.code; if (c === 'declined') return false; toast(c === 'rate_limited' ? 'Poczekaj chwilę – poprzednie pobieranie jeszcze trwa.' : 'Nie udało się pobrać pliku' + (c ? ` (${c})` : '') + '.'); return false; }
}
async function saveFile(as) {
  if (inHost()) {
    const r = await hostCall('save', { path: as ? '' : filePath, name: safeName('.slup'), content: projectJSON(), filter: 'project' });
    if (r && r.ok) { filePath = r.path; dirty = false; updateTitle(); autosave(); toast('Zapisano: ' + baseName(filePath)); } else if (r && r.err) toast('Błąd zapisu: ' + r.err);
  } else if (ART) {
    if (Cap.col && !as) { await cloudSave(false); return; }
    if (await offerFile(safeName('.json'), projectJSON(), 'Plik projektu pobrany.')) { dirty = false; updateTitle(); }
    else if (!Cap.dl && !Cap.col) toast('Zapis niedostępny w tym widoku – zmiany są pamiętane tylko w tej przeglądarce.', 4000);
  } else { download(safeName('.slup'), projectJSON(), 'application/json'); dirty = false; updateTitle(); }
}
function download(name, content, mime) { const a = document.createElement('a'); a.href = URL.createObjectURL(content instanceof Blob ? content : new Blob([content], { type: mime + ';charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
function applyState(st, path, quiet) { S = E.normalize(st); if (COLS) COLS[curC] = S; filePath = path || ''; dirty = false; selCombo = null; $('#projName').value = S.meta.name || ''; renderInputs(); recalc(); updateTitle(); autosave(); if (!quiet) toast('Wczytano: ' + (baseName(path) || S.meta.name || 'projekt')); }
function loadProject(text, path) { let o; try { o = JSON.parse(text); } catch (e) { toast('To nie jest plik projektu SłupŻB (.slup / .json).'); return; } if (o.app && o.app !== 'SlupZB') { toast('To jest plik innego programu (' + o.app + ').'); return; } cloudId = null; cloudName = ''; applyState(colsIn(o, o.state || o), path); }
async function openFile() {
  if (dirty && !(await ask('Niezapisane zmiany zostaną utracone. Otworzyć inny projekt?', 'Otwórz'))) return;
  if (inHost()) { const r = await hostCall('open', { filter: 'project' }); if (r && r.ok) loadProject(r.content, r.path); else if (r && r.err) toast('Błąd odczytu: ' + r.err); }
  else { const inp = $('#fileIn'); inp.value = ''; inp.onchange = () => { const f = inp.files[0]; if (!f) return; f.text().then(t => loadProject(t, f.name)); }; inp.click(); }
}
async function newProject() {
  if (dirty && !(await ask('Niezapisane zmiany zostaną utracone. Utworzyć nowy projekt?', 'Nowy projekt'))) return;
  cloudId = null; cloudName = ''; S = E.defaultState(); COLS = null; curC = 0; filePath = ''; dirty = false; selCombo = null;
  $('#projName').value = S.meta.name; renderInputs(); recalc(); updateTitle(); autosave();
}
function reportDoc(body, title) {
  const css = $('#appcss').textContent;
  return `<!doctype html><html lang="pl" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title || 'Raport – ' + S.meta.name)}</title><style>${css}\nhtml,body{height:auto}body{overflow:auto;padding:20px 16px;background:#fff}.rtools{margin-bottom:14px}@media print{body{padding:0}.rtools{display:none}}</style></head><body>` +
    `<div class="rtools"><button class="btn pri" onclick="window.print()">Drukuj / zapisz PDF</button></div><div id="report">${body !== undefined ? body : repBuild()}</div></body></html>`;
}
const repBody = () => repMode() === 'own' ? (S.meta.own || repFull()) : repBuild();
async function exportHTML() {
  if (!R || R.errors.length) { toast('Usuń błędy danych przed eksportem raportu.'); return; }
  const name = safeName(repMode() === 'static' ? ' – dane i kombinacje.html' : ' – raport.html'), doc = reportDoc(repBody());
  if (inHost()) { const r = await hostCall('save', { path: '', name, content: doc, filter: 'html' }); if (r && r.ok) toast('Zapisano raport: ' + baseName(r.path)); else if (r && r.err) toast('Błąd: ' + r.err); }
  else if (ART) await offerFile(name, doc, 'Raport pobrany – otwórz go i wydrukuj (Ctrl+P).');
  else download(name, doc, 'text/html');
}
async function exportODT() {
  if (!R || R.errors.length) { toast('Usuń błędy danych przed eksportem raportu.'); return; }
  const name = safeName(' – raport.odt');
  toast('Tworzenie pliku .odt…', 1500);
  let u; try { u = await window.SZR.odt(repBody(), (S.meta.name || 'Słup') + ' – raport obliczeń'); } catch (e) { console.error(e); toast('Błąd tworzenia .odt: ' + e.message); return; }
  if (inHost()) { let b = ''; for (let i = 0; i < u.length; i += 0x8000) b += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); const r = await hostCall('save', { path: '', name, content: btoa(b), b64: true, filter: 'odt' }); if (r && r.ok) toast('Zapisano raport: ' + baseName(r.path)); else if (r && r.err) toast('Błąd: ' + r.err); return; }
  const blob = new Blob([u], { type: 'application/vnd.oasis.opendocument.text' });
  if (ART) { await offerFile(name, blob, 'Raport .odt pobrany.'); return; }
  download(name, blob);
}
async function exportDXF() {
  if (!R || R.errors.length || !R.lay.n) { toast('Najpierw zadaj zbrojenie (zakładka Przekrój i zbrojenie).'); return; }
  let txt; try { txt = window.SZX.build(R, S); } catch (e) { console.error(e); toast('Błąd tworzenia DXF: ' + e.message); return; }
  const name = safeName(' – zbrojenie.dxf');
  if (inHost()) { const r = await hostCall('save', { path: '', name, content: txt, filter: 'dxf' }); if (r && r.ok) toast('Zapisano rysunek: ' + baseName(r.path)); else if (r && r.err) toast('Błąd: ' + r.err); }
  else if (ART) await offerFile(name, txt, 'Rysunek DXF pobrany.');
  else download(name, txt, 'application/dxf');
}
function doPrint() {
  if (ART) { U.selectTab('report'); if (Cap.dl) exportHTML(); return; }
  U.selectTab('report');
  setTimeout(() => window.print(), 120);
}

/* --------------------------------------------- moje projekty (konto, db) */
async function initCapabilities() {
  if (!ART || !window.claude || typeof window.claude.use !== 'function') return;
  window.claude.use('downloads').then(dl => { Cap.dl = dl || null; $('#bExport').hidden = !Cap.dl; rendered.report = false; }, () => { /* */ });
  try {
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    if (!db || !user) return;
    const uid = await user.id(); if (!uid) return;
    Cap.db = db; Cap.uid = uid; Cap.col = db.collection('data/users/' + uid);
    $('#bCloud').hidden = false;
    const tmo = setTimeout(() => { if (!Cap.ready) { Cap.slow = true; renderCloud(); } }, 10000);
    Cap.col.orderBy('saved', 'desc').onSnapshot(snap => {
      Cap.list = snap.docs.filter(d => d.exists).map(d => Object.assign({ id: d.id }, d.data()));
      if (!snap.metadata.fromCache) { Cap.ready = true; Cap.slow = false; clearTimeout(tmo); }
      renderCloud();
    }, e => { Cap.err = e && e.code; Cap.ready = true; clearTimeout(tmo); renderCloud(); });
  } catch (e) { /* bez zapisu na koncie */ }
}
const fmtDate = iso => { try { const d = new Date(iso); return d.toLocaleDateString('pl-PL') + ' ' + d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
let cloudOpen = false;
function openCloud() { cloudOpen = true; renderCloud(); $('#modal').style.display = 'flex'; }
function renderCloud() {
  if (!cloudOpen) return;
  const m = $('#modal'); let list;
  if (Cap.err) list = `<p class="pempty">Nie udało się odczytać zapisanych projektów (${esc(Cap.err)}). Zapis do pliku nadal działa.</p>`;
  else if (!Cap.ready && !Cap.list.length) list = `<p class="pempty">${Cap.slow ? 'Nie można teraz połączyć się z zapisanymi projektami.' : 'Wczytywanie zapisanych projektów…'}</p>`;
  else if (!Cap.list.length) list = `<p class="pempty">Nie masz jeszcze zapisanych projektów. Kliknij „Zapisz bieżący”.</p>`;
  else list = `<ul class="plist">${Cap.list.map(p => `<li class="${p.id === cloudId ? 'cur' : ''}"><div class="pn"><b>${esc(p.name || 'bez nazwy')}</b><small>zapisano ${esc(fmtDate(p.saved))}${p.summary ? ' · ' + esc(p.summary) : ''}</small></div><button class="btn" data-po="${esc(p.id)}">Otwórz</button><button class="btn dng" data-pd="${esc(p.id)}">Usuń</button></li>`).join('')}</ul>`;
  m.innerHTML = `<div class="dlg"><h3>Moje projekty</h3><p>Projekty zapisane na Twoim koncie claude.ai – widoczne tylko dla Ciebie.</p><div class="dbtn" style="justify-content:flex-start;margin-top:8px"><button class="btn pri" id="pcSave">${cloudId ? 'Zapisz zmiany' : 'Zapisz bieżący'}</button>${cloudId ? '<button class="btn" id="pcNew">Zapisz jako nowy</button>' : ''}${Cap.dl ? '<button class="btn" id="pcFile">Pobierz plik .json</button>' : ''}</div>${list}<div class="dbtn"><button class="btn" id="pcClose">Zamknij</button></div></div>`;
  m.style.display = 'flex';
  $('#pcClose', m).onclick = () => { cloudOpen = false; m.style.display = 'none'; };
  $('#pcSave', m).onclick = () => cloudSave(false);
  if ($('#pcNew', m)) $('#pcNew', m).onclick = () => cloudSave(true);
  if ($('#pcFile', m)) $('#pcFile', m).onclick = () => offerFile(safeName('.json'), projectJSON(), 'Plik projektu pobrany.');
  $$('[data-po]', m).forEach(b => b.onclick = () => cloudLoad(b.dataset.po));
  $$('[data-pd]', m).forEach(b => b.onclick = () => cloudDelete(b.dataset.pd));
}
const summaryLine = () => `${shapeTxt(S)} mm, l = ${String(S.geom.L).replace('.', ',')} m, ${S.mat.concrete}` + (R && R.checks ? (R.ok ? ' · OK' : ' · niespełnione warunki') : '');
let cloudBusy = false;
async function cloudSave(asNew) {
  if (!Cap.col || cloudBusy) return; cloudBusy = true;
  const ref = (!asNew && cloudId) ? Cap.col.doc(cloudId) : Cap.col.doc();
  const body = JSON.parse(JSON.stringify(Object.assign({ app: 'SlupZB', version: 1, name: S.meta.name || 'bez nazwy', saved: new Date().toISOString(), summary: summaryLine(), state: S }, colsOut())));
  try {
    try { await ref.set(body); } catch (e) { if (e && e.code === 'unavailable') { await new Promise(r => setTimeout(r, 600)); await ref.set(body); } else throw e; }
    cloudId = ref.id; cloudName = body.name; dirty = false; updateTitle(); autosave(); toast('Zapisano na koncie: ' + body.name); renderCloud();
  } catch (e) { const c = e && e.code; toast(c === 'quota_exceeded' ? 'Brak miejsca – usuń niepotrzebne projekty.' : 'Nie udało się zapisać' + (c ? ` (${c})` : '') + '.', 4000); }
  finally { cloudBusy = false; }
}
async function cloudLoad(id) {
  const p = Cap.list.find(x => x.id === id); if (!p) return;
  if (dirty && id !== cloudId && !(await ask('Niezapisane zmiany zostaną utracone. Otworzyć projekt „' + esc(p.name || '') + '”?', 'Otwórz'))) { renderCloud(); return; }
  cloudOpen = false; $('#modal').style.display = 'none'; cloudId = p.id; cloudName = p.name || '';
  applyState(colsIn(p, p.state || {}), '', true); toast('Otwarto: ' + (p.name || 'projekt'));
}
async function cloudDelete(id) {
  const p = Cap.list.find(x => x.id === id); if (!p) return;
  if (await ask(`Usunąć projekt „${esc(p.name || 'bez nazwy')}” z konta? Tej operacji nie można cofnąć.`, 'Usuń', true)) {
    try { await Cap.col.doc(id).delete(); if (id === cloudId) { cloudId = null; cloudName = ''; updateTitle(); autosave(); } toast('Usunięto projekt.'); }
    catch (e) { toast('Nie udało się usunąć projektu' + (e && e.code ? ` (${e.code})` : '') + '.'); }
  }
  openCloud();
}

function about() {
  const m = $('#modal');
  m.innerHTML = `<div class="dlg"><h3>SłupŻB 1.2 – słupy żelbetowe wg Eurokodu 2</h3>
  <p>Wymiarowanie i sprawdzanie słupów żelbetowych wg PN-EN 1992-1-1 (parametry krajowe wg Załącznika Krajowego PL: γ<sub>c</sub> = 1,4, γ<sub>s</sub> = 1,15, α<sub>cc</sub> = 1,0, ⌀<sub>min</sub> = 12 mm), kombinacje wg PN-EN 1990, odporność ogniowa wg PN-EN 1992-1-2 (metoda A).</p>
  <ul>
  <li><b>Przekroje</b> – prostokątne b × h, okrągłe ⌀D, pierścieniowe ⌀D × t (jedna lub dwie warstwy prętów), teowe (T) i kątowe (L); pręty narożne i pośrednie o różnych średnicach, strzemiona dla każdego prostokąta składowego, szpilki z warunku 9.5.3(6); dla T i L nośność w płaszczyźnie z osią obojętną obróconą (drugi moment = 0) i osie główne bezwładności.</li>
  <li><b>Statyka</b> – słup jako pręt o schemacie podparcia w każdej płaszczyźnie (przegub–przegub, wspornik, utwierdzenie–przegub, utwierdzenie–utwierdzenie, utwierdzenie przesuwne); siły N z mimośrodem, momenty końcowe z analizy ramy, siły poziome w głowicy i obciążenie poziome na wysokości; ciężar własny.</li>
  <li><b>Kombinacje</b> – automatycznie (6.10 lub 6.10a/b, każde obciążenie zmienne obecne lub nie, kolejno wiodące, wiatr ±, γ<sub>G,sup</sub>/γ<sub>G,inf</sub>), charakterystyczne i quasi-stałe; albo siły obliczeniowe wprost.</li>
  <li><b>Smukłość i II rząd</b> – długość wyboczeniowa (rys. 5.7, wzory 5.15/5.16), imperfekcje 5.2, λ<sub>lim</sub> (5.13N) z A, B, C, pełzanie efektywne φ<sub>ef</sub> (5.19); metody nominalnej krzywizny (5.8.8), nominalnej sztywności (5.8.7) i ogólna (5.8.6, nieliniowa M–κ, słup modelowy); mimośród minimalny e₀.</li>
  <li><b>Nośność</b> – zgodność odkształceń (parabola-prostokąt lub prostokąt), krzywe interakcji N–M w obu płaszczyznach, zginanie ukośne wg 5.8.9 (5.38a,b i 5.39) oraz kontur M<sub>y</sub>–M<sub>z</sub> metodą włókien; ścinanie 6.2 z wpływem siły ściskającej.</li>
  <li><b>SGU</b> – naprężenia 7.2 i szerokość rys 7.3.4; <b>konstrukcja</b> – rozdz. 9.5 (A<sub>s,min</sub>, A<sub>s,max</sub>, ⌀<sub>min</sub>, strzemiona, rozstaw, strefy zagęszczenia, szpilki), 8.2, zakłady 8.7 i zakotwienia 8.4; <b>pożar</b> – tab. 5.2a i wzór (5.7).</li>
  <li><b>Dobór</b> – zbrojenia (najmniejsza masa stali), przekroju i wszystkiego; rysunek zbrojenia, wyciągi, zestawienie stali, eksport DXF; raport z pełnym tokiem obliczeń (HTML, .odt, PDF).</li></ul>
  <p>Nowy projekt jest pusty (bez obciążeń i zbrojenia): dodaj obciążenia w zestawieniu po prawej stronie zakładki Dane albo wczytaj przykład; w zakładce Przekrój i zbrojenie program pokaże zbrojenie wymagane.</p>
  <p>Praca z rysunkami: kliknij bok przekroju, naroże, wnętrze (strzemiona), pas otuliny lub wymiar; na wykresach – kursor pokazuje wartości, klik stawia znacznik, prawy przycisk usuwa znaczniki; na schemacie w Danych – opis zbrojenia wymaganego (wybór średnicy), strzałki obciążeń, strefy strzemion; w zakładce Zbrojenie słupa – 2D / 3D, przekrój pod kursorem, strefy strzemion i zakład. Ctrl + kółko – powiększenie rysunku. Przyciski nad zakładkami i „pokaż →” w Podsumowaniu prowadzą do miejsca błędu.</p>
  <p>Skróty: F2 – raport, Ctrl+S – zapisz, Ctrl+O – otwórz, Ctrl+P – drukuj raport.</p>
  <p style="font-size:12px;color:var(--ink3)">Program jest narzędziem pomocniczym. Wyniki wymagają weryfikacji przez osobę z odpowiednimi uprawnieniami budowlanymi.</p>
  <div class="dbtn"><button class="btn pri" id="abClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; $('#abClose', m).onclick = closeModal;
}

/* -------------------------------------------------------------- start */
function init() {
  let saved = window.__AUTOSAVE || null;
  if (!saved) { try { saved = JSON.parse(localStorage.getItem('slupzb-autosave') || 'null'); } catch (e) { saved = null; } }
  if (saved && saved.state) { try { S = E.normalize(colsIn(saved, saved.state)); filePath = saved.filePath || ''; cloudId = saved.cloudId || null; cloudName = saved.cloudName || ''; } catch (e) { S = E.defaultState(); } }
  if (ART) { $('#bPrint').hidden = true; $('#bSaveAs').hidden = true; $('#bExport').hidden = true; }
  $('#projName').value = S.meta.name || '';
  $('#projName').addEventListener('input', e => { S.meta.name = e.target.value; dirty = true; updateTitle(); autosave(); rendered.report = false; const bt = $(`.btab[data-ctab="${curC}"] span`); if (bt) bt.textContent = S.meta.name.slice(0, 14); });
  $$('.tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    $$('.pane').forEach(p => p.classList.toggle('on', p.id === 'p-' + b.dataset.tab));
    renderActive();
  }));
  $$('[data-act]').forEach(b => b.addEventListener('click', () => ({ new: newProject, open: openFile, save: () => saveFile(false), saveas: () => saveFile(true), cloud: openCloud, print: doPrint, exporthtml: exportHTML, about })[b.dataset.act]()));
  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (!ART && (e.key === 'F5' || (e.ctrlKey && k === 'r'))) { e.preventDefault(); return; }
    if ($('#modal').style.display === 'flex' && e.key !== 'Escape') return;
    if (e.ctrlKey && k === 's') { e.preventDefault(); saveFile(e.shiftKey); }
    else if (e.ctrlKey && k === 'o') { e.preventDefault(); openFile(); }
    else if (e.ctrlKey && k === 'n' && !ART) { e.preventDefault(); newProject(); }
    else if (e.ctrlKey && k === 'p') { e.preventDefault(); doPrint(); }
    else if (e.key === 'F2') { e.preventDefault(); U.selectTab('report'); }
    else if (e.key === 'Escape') { closeList(); cloudOpen = false; closeModal(); }
  });
  $('#modal').addEventListener('mousedown', e => { if (e.target.id === 'modal' && !$('[data-a]', e.currentTarget)) { cloudOpen = false; closeModal(); } });
  let rz = null, lastW = window.innerWidth;
  window.addEventListener('resize', () => { if (Math.abs(window.innerWidth - lastW) < 40) return; lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(() => { rendered = {}; renderActive(); }, 150); });
  // przeciągany podział Danych
  const sp = $('#dsplit'); if (sp) { let drag = false; sp.addEventListener('mousedown', e => { drag = true; e.preventDefault(); }); window.addEventListener('mouseup', () => { if (drag) { drag = false; rendered.data = false; renderActive(); } }); window.addEventListener('mousemove', e => { if (!drag) return; const w = $('.datawrap'), r = w.getBoundingClientRect(), f = Math.max(0.3, Math.min(0.75, (e.clientX - r.left) / r.width)); w.style.setProperty('--dsl', (f * 100).toFixed(1) + '%'); }); sp.addEventListener('dblclick', () => { $('.datawrap').style.removeProperty('--dsl'); rendered.data = false; renderActive(); }); }
  nlObs.observe(document.body, { childList: true, subtree: true });
  renderInputs(); recalc(); updateTitle(); initCapabilities();
}
U.setState = s => { S = E.normalize(s); selCombo = null; renderInputs(); recalc(); };
U.getState = () => S;
U.selectTab = t => $(`.tabs button[data-tab="${t}"]`).click();
U.recalc = () => recalc();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
