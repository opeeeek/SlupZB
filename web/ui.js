/* SłupŻB – interfejs użytkownika */
(function () {
'use strict';
const E = window.EC2, Dw = window.SZD;
const U = window.SZ = {};
let S = E.defaultState();
let R = null, filePath = '', dirty = false, rendered = {}, selCombo = null, schDiag = 'M';

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
    { k: 'geom.shape', t: 'sel', l: 'Kształt przekroju', o: [['rect', 'prostokątny b × h'], ['circ', 'okrągły ⌀D']], re: true },
    { k: 'geom.b', t: 'num', l: 'Wymiar b (wzdłuż osi y)', u: 'mm', list: [250, 300, 350, 400, 450, 500, 600, 700, 800], min: 150, show: s => !CIRC(s), re: true },
    { k: 'geom.h', t: 'num', l: 'Wymiar h (wzdłuż osi z)', u: 'mm', list: [250, 300, 350, 400, 450, 500, 600, 700, 800, 1000], min: 150, show: s => !CIRC(s), re: true },
    { k: 'geom.D', t: 'num', l: 'Średnica D', u: 'mm', list: [300, 350, 400, 450, 500, 600, 700, 800, 1000], min: 200, show: CIRC, re: true },
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
    { k: 'stir.pins', t: 'sel', l: 'Szpilki / strzemiona wewnętrzne', o: [['auto', 'gdzie wymagane (9.5.3(6): ≤ 150 mm)'], ['all', 'przy każdym pręcie'], ['none', 'brak – tylko strzemię obwodowe']], wide: true, re: true, show: s => !CIRC(s) },
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
    { t: 'hint', h: () => R && R.fire ? `a = ${fmt(R.fire.a, 0)} mm (oś pręta od krawędzi), μ<sub>fi</sub> = ${fmt(R.fire.mu, 2)}, l<sub>0,fi</sub> = ${fmt(R.fire.l0fi / 1000, 2)} m; ${R.fire.aReq !== null && R.fire.aReq !== undefined ? `tab. 5.2a: a ≥ ${fmt(R.fire.aReq, 0)} mm` : ''}; wzór (5.7): R = ${fmt(R.fire.Rcalc, 0)} min → <b style="color:var(--${R.fire.ok ? 'ok' : 'fail'})">${R.fire.ok ? 'spełnione' : 'niespełnione'}</b>` : '' },
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
    { k: 'reb.nb', t: 'sel', l: 'Liczba prętów wzdłuż boku b (z narożnymi)', o: () => rng(2, 12, 1).map(v => [v, String(v)]), num: true, re: true, show: s => !CIRC(s) },
    { k: 'reb.nh', t: 'sel', l: 'Liczba prętów wzdłuż boku h (z narożnymi)', o: () => rng(2, 12, 1).map(v => [v, String(v)]), num: true, re: true, show: s => !CIRC(s) },
    { k: 'reb.nc', t: 'sel', l: 'Liczba prętów na obwodzie', o: () => rng(4, 32, 1).map(v => [v, String(v)]), num: true, re: true, show: CIRC },
    { k: 'reb.dc', t: 'sel', l: s => CIRC(s) ? 'Średnica prętów' : 'Średnica prętów narożnych', o: () => E.MAIN_DIAS.map(d => [d, '⌀' + d]), num: true, re: true },
    { k: 'reb.dm', t: 'sel', l: 'Średnica prętów pośrednich', o: () => E.MAIN_DIAS.map(d => [d, '⌀' + d]), num: true, re: true, show: s => !CIRC(s) },
    { t: 'hint', h: () => rebHint() },
  ],
  tie: [
    { k: 'stir.d', t: 'sel', l: 'Średnica strzemion ⌀_{t}', o: [['auto', 'auto: max(6; ⌀/4)'], ...E.TIE_DIAS.map(d => [d, '⌀' + d])], re: true },
    { k: 'stir.s', t: 'num', auto: true, l: 'Rozstaw podstawowy s', u: 'mm', list: ['auto', 100, 150, 200, 250, 300, 350, 400], ph: 'auto' },
    { k: 'stir.pins', t: 'sel', l: 'Szpilki / strzemiona wewnętrzne', o: [['auto', 'gdzie wymagane (≤ 150 mm od pręta utrzymanego)'], ['all', 'przy każdym pręcie'], ['none', 'brak']], wide: true, re: true, show: s => !CIRC(s) },
    { k: 'stir.hookA', t: 'sel', l: 'Haki strzemion', o: [[135, '135° (zalecane)'], [90, '90°']], num: true },
    { t: 'hint', h: () => R && R.ties ? `Wymagane: ⌀<sub>t</sub> ≥ ${fmt(R.ties.dtReq, 1)} mm; s ≤ ${fmt(R.ties.scl, 0)} mm (strefy przy stropach i zakładach ≤ ${fmt(R.ties.sclRed, 0)} mm)${isFinite(R.ties.sShear) ? `; ze ścinania s ≤ ${fmt(R.ties.sShear, 0)} mm` : ''}.` : '' },
  ],
  geo: [
    { k: 'geom.b', t: 'num', l: 'Wymiar b', u: 'mm', list: [250, 300, 350, 400, 450, 500, 600, 700, 800], min: 150, show: s => !CIRC(s), re: true },
    { k: 'geom.h', t: 'num', l: 'Wymiar h', u: 'mm', list: [250, 300, 350, 400, 450, 500, 600, 700, 800], min: 150, show: s => !CIRC(s), re: true },
    { k: 'geom.D', t: 'num', l: 'Średnica D', u: 'mm', list: [300, 350, 400, 450, 500, 600, 700, 800], min: 200, show: CIRC, re: true },
    { k: 'env.cnomSel', t: 'sel', l: 'Otulina c_{nom}', o: [['auto', 'automatycznie – wymagana'], ['manual', 'podana ręcznie']], wide: true, re: true },
    { k: 'env.cnomVal', t: 'num', l: 'Przyjęta otulina c_{nom}', u: 'mm', list: rng(15, 80, 5), min: 0, show: s => s.env.cnomSel === 'manual' },
  ],
};
POP.schY = [...buckFields('y').map(f => Object.assign({}, f, { show: f.k.endsWith('.sch') || f.k.endsWith('.mode') ? undefined : s => s.buck.y.mode === (f.k.endsWith('beta') ? 'beta' : f.k.endsWith('l0') ? 'l0' : 'k'), l: typeof f.l === 'function' ? f.l(Object.assign({}, S, { buck: { same: true } })) : f.l })), { k: 'buck.same', t: 'chk', l: 'Jednakowe w obu płaszczyznach', re: true }];
POP.schZ = [...buckFields('z').map(f => Object.assign({}, f, { show: f.k.endsWith('.sch') || f.k.endsWith('.mode') ? undefined : s => s.buck.z.mode === (f.k.endsWith('beta') ? 'beta' : f.k.endsWith('l0') ? 'l0' : 'k'), l: typeof f.l === 'function' ? f.l(Object.assign({}, S, { buck: { same: true } })) : f.l })), { k: 'buck.same', t: 'chk', l: 'Jednakowe w obu płaszczyznach', re: true }];

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
  const clr = g.circ ? L.faces.c.clear : Math.min(L.faces.b.clear, L.faces.h.clear);
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
    if (el.dataset.k === 'reb.dc' && !CIRC(S) && S.reb.dm < S.reb.dc && false) S.reb.dm = S.reb.dc;
    changed(!!el.dataset.re);
  }));
  $$('input[type=checkbox][data-k]', host).forEach(el => el.addEventListener('change', () => { setP(S, el.dataset.k, el.checked); if (el.dataset.k === 'buck.same' && el.checked) S.buck.z = JSON.parse(JSON.stringify(S.buck.y)); changed(!!el.dataset.re); }));
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
  if (selCombo !== null && (!R.res || !R.res[selCombo])) selCombo = null;
  refreshHints();
  renderStatus();
  renderDsum();
  rendered = {};
  renderActive();
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
    h += `<button class="dsb ${st}" data-dg="${gi}" title="${esc(w.name.replace(/_\{?([^}]*)\}?/g, '$1'))}${isFinite(w.ratio) ? ' – ' + fmt(w.ratio * 100, 0) + '%' : ''}"><span class="ic">${st === 'fail' ? '✖' : st === 'warn' ? '!' : '✔'}</span>${a ? `<b>${a}</b> ` : ''}${l}<span class="pc">${isFinite(w.ratio) ? fmt(w.ratio * 100, 0) + '%' : '∞'}</span>${bad ? `<span class="nb">${bad}</span>` : ''}</button>`;
  });
  if (R.res && R.res.length) { const sl = DIRS().some(d => R.res.some(q => q[d].slender)); h += `<span class="dsb ${sl ? 'warn' : 'ok'}" style="cursor:default" title="Smukłość λ względem λ_lim"><span class="ic">λ</span>${sl ? 'słup smukły – II rząd' : 'efekty II rzędu pomijalne'}</span>`; }
  return h + '</div>';
}
const DIRS = () => ['y', 'z'];
function renderDsum() {
  $$('#dsum, .dsumx').forEach(el => {
    el.innerHTML = dsumHTML();
    $$('[data-auto]', el).forEach(b => b.addEventListener('click', () => doAutoReb()));
    $$('[data-dg]', el).forEach(b => b.addEventListener('click', () => {
      const pr = DSUM[+b.dataset.dg][2], c = R.checks.filter(pr);
      const x = c.find(q => q.status === 'fail') || c.find(q => q.status === 'warn') || c.reduce((a, q) => (!a || q.ratio > a.ratio ? q : a), null);
      if (x) explainPopup(x);
    }));
  });
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

/* --------------------------------------------------- panel Danych: schemat */
function renderDataSide() {
  const el = $('#dataside'); if (!el) return;
  if (!R || R.errors.length) { el.innerHTML = colTabsHTML() + errBox(); return; }
  const W = Math.max(240, Math.min(340, (el.clientWidth || 640) / 2 - 18));
  const res = R.res || [];
  const ci = selCombo;
  const comboSel = `<select id="dsCombo" class="cmbsel" title="Kombinacja pokazana na schemacie"><option value="">kombinacja decydująca (dla każdej płaszczyzny)</option>${res.map((q, i) => `<option value="${i}" ${ci === i ? 'selected' : ''}>${esc(q.c.name)}</option>`).join('')}</select>`;
  let h = colTabsHTML();
  h += `<div class="box"><div class="schhead"><h4>Schemat statyczny i siły obliczeniowe</h4><div class="seg">${[['M', 'M'], ['N', 'N'], ['buck', 'wyboczenie']].map(([k, l]) => `<button class="${schDiag === k ? 'on' : ''}" data-sd="${k}">${l}</button>`).join('')}</div></div>${comboSel}
    <div class="schpair">${['y', 'z'].map(d => `<div class="schemewrap">${Dw.schemeSVG(R, S, d, { W, H: 460, diag: schDiag, combo: ci === null ? undefined : ci })}</div>`).join('')}</div>
    <p class="hint">Kliknij podporę lub słup, aby zmienić warunki podparcia i długość wyboczeniową w danej płaszczyźnie. Wartości – siły obliczeniowe wybranej kombinacji; M<sub>Ed</sub> z imperfekcją e<sub>i</sub> i efektami II rzędu.</p></div>`;
  h += `<div class="box"><div class="schhead"><h4>Przekrój</h4><span class="hint">kliknij przekrój – zbrojenie, wymiary</span></div><div class="minisec2">${Dw.sectionSVG(R, { W: 220, H: 220, small: true, edit: true })}<div>${secPropsHTML()}</div></div></div>`;
  h += S.loads.mode === 'cases' ? loadTableHTML() : directTableHTML();
  h += combosBoxHTML();
  el.innerHTML = h;
  bindDataSide(el);
}
function secPropsHTML() {
  const g = R.g, L = R.lay;
  return `<table class="kv"><tr><td>Przekrój</td><td>${g.circ ? '⌀' + g.D : g.b + ' × ' + g.h} mm</td></tr><tr><td>A<sub>c</sub></td><td>${fmt(g.Ac / 1e6, 4)} m²</td></tr><tr><td>Zbrojenie</td><td>${L.n ? `${L.n}⌀${L.dmax}${L.dmin !== L.dmax ? '/' + L.dmin : ''}` : '—'}</td></tr><tr><td>A<sub>s</sub> / ρ</td><td>${L.n ? `${fmt(L.As, 0)} mm² / ${fmt(L.As / g.Ac * 100, 2)}%` : '—'}</td></tr><tr><td>Strzemiona</td><td>${L.n ? `⌀${L.dt} co ${R.ties.s} / ${R.ties.sRed} mm` : '—'}</td></tr><tr><td>c<sub>nom</sub></td><td>${R.cov.cnom} mm</td></tr><tr><td>λ<sub>y</sub> / λ<sub>z</sub></td><td>${fmt(R.buck.y.lam, 1)} / ${fmt(R.buck.z.lam, 1)}</td></tr></table>`;
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
    <div class="tscroll"><table class="ldsum lt"><thead><tr><th></th><th></th><th>Nazwa</th><th>N [kN]</th><th>M<sub>y</sub> góra / dół [kNm]</th><th>M<sub>z</sub> góra / dół [kNm]</th><th>poziome [kN, kN/m, mm]</th></tr></thead><tbody>${rows || '<tr><td colspan="7" class="lnone">Brak obciążeń – dodaj poniżej.</td></tr>'}</tbody></table></div>
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
function geoPopup() { fieldPopup('Wymiary przekroju i otulina', POP.geo, 'geo'); }
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
      <div class="lsub">Siła podłużna w głowicy</div>${f('N', 'N (ściskanie +)', 'kN')}${f('eh', 'mimośród e_h (w płaszczyźnie h)', 'mm')}${f('eb', 'mimośród e_b (w płaszczyźnie b)', 'mm')}
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
    $('#lpOk', m).onclick = closeModal;
    $('#lpDel', m).onclick = async () => { if (await ask(`Usunąć obciążenie „${esc(it.name || '')}”?`, 'Usuń', true)) { S.loads.items.splice(i, 1); changed(false); } };
  };
  draw(); m.style.display = 'flex'; popRedraw = null;
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
  let h = `<div class="dsumx"></div><div class="h2">Przekrój i zbrojenie <small>kliknij pręty (zbrojenie podłużne), strzemię lub wymiar, aby zmienić; „Dobierz zbrojenie” – najmniejsza masa stali spełniająca wszystkie warunki</small></div>`;
  h += `<div class="rebbar"><button class="btn sm pri" id="sbAuto">⚙ Dobierz zbrojenie</button><button class="btn sm" id="sbReb">Pręty podłużne…</button><button class="btn sm" id="sbTie">Strzemiona…</button><button class="btn sm" id="sbGeo">Wymiary i otulina…</button><button class="btn sm" id="sbClr">Wyczyść zbrojenie</button></div>`;
  if (!L.n) h += `<div class="msg wrn">Przekrój bez zbrojenia podłużnego – pokazano nośność betonu. Użyj „Dobierz zbrojenie” albo zadaj pręty.</div>`;
  h += `<div class="flex"><div class="box">${Dw.sectionSVG(R, { W: 400, H: 400, edit: true, fail: fails })}</div><div class="box" style="min-width:320px;flex:1">`;
  if (L.n) {
    const clr = g.circ ? L.faces.c.clear : Math.min(L.faces.b.clear, L.faces.h.clear);
    const row = (a, req, prov, ok) => `<tr><td>${a}</td><td>${req}</td><td>${prov}</td><td class="${ok ? 'yes' : 'no'}">${ok ? 'TAK' : 'NIE'}</td></tr>`;
    h += `<h4>Zbrojenie podłużne – wymagane i przyjęte</h4><table class="reqt"><thead><tr><th>Warunek</th><th>wymagane</th><th>przyjęte</th><th>spełniony</th></tr></thead><tbody>
      ${row('A<sub>s,min</sub> = max(0,10·N<sub>Ed</sub>/f<sub>yd</sub>; 0,002·A<sub>c</sub>) – 9.5.2(2)', `≥ ${fmt(R.AsMin, 0)} mm²`, `${fmt(L.As, 0)} mm²`, L.As >= R.AsMin - 0.5)}
      ${row('A<sub>s,max</sub> = 0,04·A<sub>c</sub> – 9.5.2(3)', `≤ ${fmt(0.04 * g.Ac, 0)} mm²`, `${fmt(L.As, 0)} mm²`, L.As <= 0.04 * g.Ac + 0.5)}
      ${row('⌀ ≥ ⌀<sub>min</sub> – 9.5.2(1)', `≥ ${S.coef.phiMin} mm`, `⌀${L.dmin}`, L.dmin >= S.coef.phiMin)}
      ${row('odstęp w świetle – 8.2(2)', `≥ ${fmt(L.smin, 0)} mm`, `${fmt(clr, 0)} mm`, clr >= L.smin - 0.5)}
      ${!g.circ ? row('pręt ≤ 150 mm od utrzymanego – 9.5.3(6)', '≤ 150 mm', `${fmt(Math.max(L.faces.b.far, L.faces.h.far), 0)} mm`, Math.max(L.faces.b.far, L.faces.h.far) <= 150) : ''}
      </tbody></table>
      <h4 style="margin-top:12px">Strzemiona</h4><table class="reqt"><thead><tr><th>Warunek</th><th>wymagane</th><th>przyjęte</th><th>spełniony</th></tr></thead><tbody>
      ${row('⌀<sub>t</sub> ≥ max(6; ⌀<sub>max</sub>/4) – 9.5.3(1)', `≥ ${fmt(T.dtReq, 1)} mm`, `⌀${L.dt}`, L.dt >= T.dtReq - 1e-9)}
      ${row('s ≤ s<sub>cl,tmax</sub> = min(20⌀<sub>min</sub>; b; 400) – 9.5.3(3)', `≤ ${fmt(T.scl, 0)} mm`, `${T.s} mm`, T.s <= T.scl + 0.5)}
      ${row('przy stropach i zakładach ≤ 0,6·s<sub>cl,tmax</sub> – 9.5.3(4)', `≤ ${fmt(T.sclRed, 0)} mm`, `${T.sRed} mm`, T.sRed <= T.sclRed + 0.5)}
      ${isFinite(T.sShear) ? row('ścinanie: s ≤ A<sub>sw</sub>·z·f<sub>ywd</sub>·cot θ/V<sub>Ed</sub> – 6.2.3', `≤ ${fmt(T.sShear, 0)} mm`, `${T.s} mm`, T.s <= T.sShear + 0.5) : ''}
      </tbody></table>
      <table class="kv" style="margin-top:10px"><tr><td>Ramiona strzemion (ścinanie w płaszczyźnie h / b)</td><td>${g.circ ? 2 : L.legs.y} / ${g.circ ? 2 : L.legs.z}</td><td></td></tr><tr><td>N<sub>Rd</sub> = A<sub>c</sub>·f<sub>cd</sub> + A<sub>s</sub>·f<sub>yd</sub></td><td>${fmt(R.NRd0 / 1e3, 0)}</td><td>kN</td></tr><tr><td>Stopień zbrojenia ρ / ω</td><td>${fmt(L.As / g.Ac * 100, 2)}% / ${fmt(R.dirs.y.omega, 3)}</td><td></td></tr><tr><td>Odległość osi prętów od krawędzi a</td><td>${fmt(L.a, 0)}</td><td>mm</td></tr></table>`;
  }
  h += `</div></div>`;
  if (L.n && R.res.length) {
    h += `<div class="h2" style="margin-top:16px">Stan graniczny przekroju – kombinacja decydująca <small>odkształcenia w stanie granicznym nośności przy N<sub>Ed</sub> (zgodność odkształceń)</small></div><div class="flex">`;
    ['y', 'z'].forEach(d => { const o = govOf(d), s = o[d].gov; h += `<div class="box"><h4>Płaszczyzna ${PL(d)} – ${s.key === 'base' ? 'podstawa' : s.key === 'top' ? 'głowica' : 'strefa środkowa'} <small>${esc(o.c.name)}</small></h4>${Dw.strainSVG(R, d, s, { W: 330, H: 300 })}<table class="kv"><tr><td>M<sub>Ed,${d}</sub> / M<sub>Rd,${d}</sub></td><td>${fmt(s.M / 1e6, 1)} / ${fmt(s.MRd / 1e6, 1)}</td><td>kNm (${isFinite(s.u) ? fmt(s.u * 100, 0) : '∞'}%)</td></tr></table></div>`; });
    h += `</div>`;
  }
  el.innerHTML = h; renderDsum();
  $('#sbAuto', el).onclick = () => doAutoReb();
  $('#sbReb', el).onclick = () => rebPopup();
  $('#sbTie', el).onclick = () => tiePopup();
  $('#sbGeo', el).onclick = () => geoPopup();
  $('#sbClr', el).onclick = () => { S.reb.set = false; changed(true); };
  $$('[data-z]', el).forEach(z => z.addEventListener('click', ev => { ev.stopPropagation(); const k = z.dataset.z; if (k === 'bars') rebPopup(); else if (k === 'ties') tiePopup(); else geoPopup(); }));
}

/* --------------------------------------------------------- zakładka Wykresy */
function renderCharts(el) {
  if (!R || R.errors.length || !R.res.length) { el.innerHTML = errBox() || '<p class="hint">Brak kombinacji – dodaj obciążenia.</p>'; return; }
  const res = R.res;
  const oc = d => selCombo !== null ? res[selCombo] : govOf(d);
  let h = `<div class="dsumx"></div><div class="h2">Wykresy i krzywe interakcji <small>kliknij punkt na krzywej interakcji lub wiersz tabeli – wybór kombinacji</small></div>`;
  h += `<div class="rebbar"><span class="ttl">Kombinacja:</span><select id="chCombo"><option value="">decydująca w każdej płaszczyźnie</option>${res.map((q, i) => `<option value="${i}" ${selCombo === i ? 'selected' : ''}>${esc(q.c.name)} – η = ${isFinite(q.u) ? fmt(q.u * 100, 0) : '∞'}%</option>`).join('')}</select></div>`;
  h += `<div class="flex">`;
  ['y', 'z'].forEach(d => { if (R.lay.n) h += `<div class="box">${Dw.interactionSVG(R, d, { W: 430, H: 400, gov: oc(d).ci })}</div>`; });
  h += `</div><div class="flex" style="margin-top:14px">`;
  ['y', 'z'].forEach(d => {
    const o = oc(d), ms = Dw.momentSeries(R, o, d), r = o[d];
    const mk = r.secs.map(s => ({ xi: s.xi, v: (s.sg || 1) * s.M / 1e6 * (Math.sign(ms.tot[Math.round(s.xi * 40)] || 1) * (s.sg || 1)), l: fmt(s.M / 1e6, 1), c: Dw.C.red }));
    h += `<div class="box">${Dw.heightChart({ W: 280, H: 400, L: R.g.L, title: `M_${d} – płaszczyzna ${PL(d)} [kNm]`, unit: `M_${d} [kNm]`, series: [{ v: ms.tot, c: Dw.C.red, fill: Dw.C.red, l: 'M_Ed' }, { v: ms.imp, c: Dw.C.warn, dash: '3 3', w: 1.2, l: '+ e_i' }, { v: ms.M0, c: Dw.C.acc, dash: '6 3', w: 1.3, l: 'M₀' }], marks: mk })}
      <table class="kv"><tr><td>Kombinacja</td><td colspan="2">${esc(o.c.name)}</td></tr><tr><td>λ / λ<sub>lim</sub></td><td>${fmt(r.lam, 1)} / ${fmt(r.lamLim, 1)}</td><td>${r.slender ? 'smukły' : 'krępy'}</td></tr><tr><td>M<sub>0Ed</sub> / M<sub>2</sub></td><td>${fmt(r.M0Ed / 1e6, 1)} / ${isFinite(r.M2) ? fmt(r.M2 / 1e6, 1) : '∞'}</td><td>kNm</td></tr><tr><td>e<sub>i</sub> / φ<sub>ef</sub></td><td>${fmt(r.ei, 1)} mm / ${fmt(r.phiEf, 2)}</td><td></td></tr></table></div>`;
  });
  { const o = selCombo !== null ? res[selCombo] : govOf('y'), fr = o.fr, n = 40; const Nv = []; for (let i = 0; i <= n; i++) Nv.push(fr.Nat(i / n) / 1e3);
    h += `<div class="box">${Dw.heightChart({ W: 220, H: 400, L: R.g.L, title: 'N_Ed [kN]', unit: 'N [kN]', series: [{ v: Nv, c: Dw.C.vio, fill: Dw.C.vio }], marks: [{ xi: 0, v: Nv[0], l: fmt(Nv[0], 0), c: Dw.C.vio }, { xi: 1, v: Nv[n], l: fmt(Nv[n], 0), c: Dw.C.vio }] })}</div>`; }
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
  $$('[data-selc]', el).forEach(tr => tr.addEventListener('click', () => { selCombo = +tr.dataset.selc; rendered = {}; renderActive(); }));
  $$('circle[data-ci]', el).forEach(c => c.addEventListener('click', () => { selCombo = +c.dataset.ci; rendered = {}; renderActive(); }));
}

/* ------------------------------------------------- zakładka Zbrojenie słupa */
function scheduleHTML() {
  const sc = R.sched; if (!sc) return '';
  const steelOf = r => r.steel === 'W' ? R.m.sw.id : R.m.st.id;
  let h = `<table class="sched"><thead><tr><th>Poz.</th><th>Nazwa</th><th>⌀ [mm]</th><th>Długość [mm]</th><th>Liczba [szt.]</th><th>Długość całk. [m]</th><th>Masa [kg]</th></tr></thead><tbody>`;
  sc.rows.forEach(r => { h += `<tr><td class="n">${r.pos}</td><td>${esc(r.name)}</td><td class="n">${r.d}</td><td class="n">${fmt(r.len, 0)}</td><td class="n">${r.n}</td><td class="n">${fmt(r.tot, 2)}</td><td class="n">${fmt(r.kg, 1)}</td></tr>`; });
  h += `</tbody></table><table class="sched" style="margin-top:8px"><thead><tr><th>Stal</th><th>⌀ [mm]</th><th>Długość [m]</th><th>Masa jedn. [kg/m]</th><th>Masa [kg]</th></tr></thead><tbody>`;
  sc.byD.forEach(q => { h += `<tr><td>${esc(q.steel === 'W' ? R.m.sw.id : R.m.st.id)}</td><td class="n">${q.d}</td><td class="n">${fmt(q.m, 2)}</td><td class="n">${fmt(E.massPerM(q.d), 3)}</td><td class="n">${fmt(q.kg, 1)}</td></tr>`; });
  h += `<tr class="tot"><td colspan="4">Razem (+ ok. 5% na zakłady i odpady – nie wliczono)</td><td class="n">${fmt(sc.tot, 1)}</td></tr></tbody></table>`;
  return h;
}
function renderElev(el) {
  if (!R || R.errors.length) { el.innerHTML = errBox(); return; }
  if (!R.lay.n) { el.innerHTML = `<div class="dsumx"></div><div class="msg wrn">Brak zbrojenia podłużnego – dobierz zbrojenie w zakładce Przekrój i zbrojenie.</div>`; renderDsum(); return; }
  const T = R.ties, A = R.anch;
  let h = `<div class="dsumx"></div><div class="h2">Zbrojenie słupa <small>widok, przekrój A–A, wyciągi prętów i zestawienie stali</small><button class="btn sm pri" id="elDxf" style="float:right">Eksport DXF</button></div>`;
  h += `<div class="flex"><div class="box">${Dw.elevationSVG(R, S, { W: 600, H: 760 })}</div><div style="display:flex;flex-direction:column;gap:14px;min-width:300px;flex:1"><div class="box"><h4>Przekrój A–A</h4>${Dw.sectionSVG(R, { W: 320, H: 320 })}</div>
    <div class="box"><h4>Strzemiona i zakłady</h4><table class="kv">
      <tr><td>Strzemiona</td><td>⌀${R.lay.dt} (${esc(R.m.sw.id)})</td><td></td></tr>
      <tr><td>Rozstaw w części środkowej s</td><td>${T.s}</td><td>mm</td></tr>
      <tr><td>Rozstaw przy stropach i w strefie zakładu</td><td>${T.sRed}</td><td>mm</td></tr>
      <tr><td>Strefa zagęszczenia u dołu (max(b, h)${T.lapZone ? '; zakład + 4⌀' : ''})</td><td>${fmt(T.zBot, 0)}</td><td>mm</td></tr>
      <tr><td>Strefa zagęszczenia u góry</td><td>${fmt(T.zTop, 0)}</td><td>mm</td></tr>
      <tr><td>Liczba strzemion w słupie</td><td>${T.sets}</td><td>szt.</td></tr>
      <tr><td>Długość zakładu l₀ (${A.tension ? 'pręty rozciągane' : 'pręty ściskane'}, α₆ = ${fmt(A.a6, 1)})</td><td>${fmt(A.l0, 0)}</td><td>mm</td></tr>
      <tr><td>Długość zakotwienia l<sub>bd</sub></td><td>${fmt(A.lbd, 0)}</td><td>mm</td></tr></table>
      <p class="hint">Strzemiona zagęszczone (9.5.3(4)) na długości równej większemu wymiarowi przekroju nad stropem/fundamentem i pod stropem${T.lapZone ? ', a także na długości zakładu prętów ⌀ > 14 mm' : ''}. W strefie zakładu prętów ściskanych – strzemię w odległości ≤ 4⌀ za końcem zakładu (8.7.4.2(4)).</p></div></div></div>`;
  h += `<div class="h2" style="margin-top:16px">Wyciągi prętów</div><div class="box">${Dw.extractsSVG(R, S, { W: 760 })}</div>`;
  h += `<div class="h2" style="margin-top:16px">Zestawienie stali</div><div class="tscroll">${scheduleHTML()}</div>`;
  el.innerHTML = h; renderDsum();
  $('#elDxf', el).onclick = () => exportDXF();
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
const ckKey = c => c.id + '|' + c.name;
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
  if (nF.length) html += `<div class="failnav">Niespełnione warunki: ${nF.map(x => `<button class="goto" data-goto="${c.indexOf(x)}">${sym(x.name)}</button>`).join('')}</div>`;
  const ticks = S.meta.ticks || {};
  html += `<div class="tickbar"><span id="tickCnt">Odhaczono: <b>${c.filter(x => ticks[ckKey(x)]).length}</b> z ${c.length}</span><button class="btn sm" id="tickOk">Odhacz spełnione</button><button class="btn sm" id="tickClr">Wyczyść znaczniki</button><span class="hint">Kliknij numer punktu normy – objaśnienie; kliknij warunek lub pasek – jak obliczono.</span></div>`;
  html += `<div class="tscroll"><table class="ctab"><thead><tr><th class="tk">✓</th><th>Sprawdzenie</th><th>Punkt normy</th><th style="text-align:right">Warunek</th><th>Wykorzystanie</th><th>Status</th><th class="nt">Uwagi</th></tr></thead><tbody>`;
  let grp = '';
  c.forEach((x, i) => {
    if (x.grp !== grp) { grp = x.grp; html += `<tr class="g"><td colspan="7">${esc(grp)}</td></tr>`; }
    const on = !!ticks[ckKey(x)];
    html += `<tr class="${on ? 'done' : ''}" data-ci="${i}"><td class="tk"><input type="checkbox" data-tick="${i}" ${on ? 'checked' : ''}></td><td>${sym(x.name)}</td><td class="ref"><button class="nref" data-ref="${i}">${esc(x.ref)}</button></td><td class="val xclick">${ckCond(x)}</td><td class="bar xclick" style="white-space:nowrap">${utilBar(x)}</td><td class="stc"><span class="st ${x.status}">${STL[x.status]}</span></td><td class="nt">${sym(x.note || '')}</td></tr>`;
  });
  html += `</tbody></table></div>`;
  el.innerHTML = html;
  const setTick = (x, v) => { S.meta.ticks = S.meta.ticks || {}; if (v) S.meta.ticks[ckKey(x)] = true; else delete S.meta.ticks[ckKey(x)]; dirty = true; updateTitle(); autosave(); };
  $$('[data-tick]', el).forEach(cb => cb.addEventListener('change', () => { setTick(c[+cb.dataset.tick], cb.checked); cb.closest('tr').classList.toggle('done', cb.checked); $('#tickCnt', el).innerHTML = `Odhaczono: <b>${c.filter(x => (S.meta.ticks || {})[ckKey(x)]).length}</b> z ${c.length}`; }));
  $('#tickOk', el).onclick = () => { c.forEach(x => { if (x.status === 'ok' || x.status === 'info') setTick(x, true); }); renderSummary(el); };
  $('#tickClr', el).onclick = () => { S.meta.ticks = {}; dirty = true; autosave(); renderSummary(el); };
  $$('[data-ref]', el).forEach(b => b.addEventListener('click', () => normPopup(c[+b.dataset.ref].ref)));
  $$('tr[data-ci] td.xclick', el).forEach(td => td.addEventListener('click', () => explainPopup(c[+td.closest('tr').dataset.ci])));
  $$('[data-goto]', el).forEach(b => b.addEventListener('click', () => explainPopup(c[+b.dataset.goto])));
}
// objaśnienie punktu normy
function normPopup(ref) {
  const N = window.SZN; const keys = N ? N.find(ref) : [];
  const body = keys.map(k => { const e = N.N[k]; return `<div class="nsec"><div class="nlab">${esc(N.label(k))}</div><h4>${e.t}</h4><p>${e.s}</p>${e.f ? `<div class="nf">${e.f}</div>` : ''}${e.h ? `<div class="nh"><b>Podpowiedź:</b> ${e.h}</div>` : ''}</div>`; }).join('') || `<p>Brak objaśnienia dla „${esc(ref)}”.</p>`;
  const m = $('#modal'); m.innerHTML = `<div class="dlg norm"><h3>${esc(ref)}</h3>${body}<p class="ndisc">Streszczenia własne – nie zastępują tekstu normy.</p><div class="dbtn"><button class="btn pri" id="nClose">Zamknij</button></div></div>`;
  m.style.display = 'flex'; $('#nClose', m).onclick = closeModal;
}
// „jak obliczono” – fragment raportu dla sprawdzenia
let repCache = null;
function explainPopup(c) {
  if (!repCache || repCache.R !== R) { const tmp = document.createElement('div'); tmp.innerHTML = window.SZR.build(R, S); repCache = { R, el: tmp }; }
  const key = c.sec || 'cov';
  const frag = repCache.el.querySelector(`section[data-sec="${key}"]`);
  const m = $('#modal');
  m.innerHTML = `<div class="dlg secpop wide"><h3>Jak obliczono – ${sym(c.name)}</h3><div class="hint">Status: <span class="st ${c.status}">${STL[c.status]}</span> · ${ckCond(c)}${isFinite(c.ratio) && c.status !== 'info' ? ` · η = ${fmt(c.ratio * 100, 0)}%` : ''} · <button class="nref" id="exRef">${esc(c.ref)}</button></div><div id="report" class="expl">${frag ? frag.innerHTML : '<p>Szczegóły w raporcie obliczeń.</p>'}</div><div class="dbtn"><button class="btn" id="exRep">Pokaż w raporcie</button><button class="btn pri" id="exClose">Zamknij</button></div></div>`;
  m.style.display = 'flex';
  $('#exClose', m).onclick = closeModal;
  $('#exRef', m).onclick = () => normPopup(c.ref);
  $('#exRep', m).onclick = () => { closeModal(); U.selectTab('report'); setTimeout(() => { const s = $(`#p-report section[data-sec="${key}"]`); if (s) { s.scrollIntoView({ block: 'start' }); flash(s); } }, 80); };
}

/* -------------------------------------------------------------- Raport */
const repMode = () => S.meta.repMode || 'full';
const repBuild = () => repMode() === 'static' ? window.SZR.buildStatic(R, S) : window.SZR.build(R, S);
function renderReport(el) {
  if (!R || R.errors.length) { el.innerHTML = errBox(); return; }
  const mode = repMode();
  const tools = `<div class="rtools"><div class="seg">${[['full', 'Raport pełny'], ['static', 'Dane, obciążenia i kombinacje'], ['own', 'Raport własny']].map(([k, l]) => `<button class="${mode === k ? 'on' : ''}" data-rm="${k}">${l}</button>`).join('')}</div><span style="flex:1"></span><button class="btn" id="rpHtml">Zapisz raport HTML…</button><button class="btn" id="rpOdt">Zapisz .odt (edytowalny)…</button><button class="btn pri" id="rpPrint">Drukuj / zapisz PDF</button></div>`;
  if (mode === 'own') { el.innerHTML = tools + ownToolsHTML() + `<div id="ownrep" contenteditable="true" spellcheck="true">${S.meta.own || window.SZR.build(R, S)}</div>`; bindOwn(el); }
  else el.innerHTML = tools + `<div id="report">${repBuild()}</div>`;
  $$('[data-rm]', el).forEach(b => b.onclick = () => { S.meta.repMode = b.dataset.rm; dirty = true; autosave(); renderReport(el); });
  $('#rpHtml', el).onclick = () => exportHTML();
  $('#rpOdt', el).onclick = () => exportODT();
  $('#rpPrint', el).onclick = () => doPrint();
  if (ART) { $('#rpPrint', el).hidden = true; if (!Cap.dl) { $('#rpHtml', el).hidden = true; $('#rpOdt', el).hidden = true; } }
  $$('#report .nref', el).forEach(b => b.addEventListener('click', () => normPopup(b.dataset.nref || b.textContent)));
}
function ownToolsHTML() { return `<div class="owntools rtools">${[['bold', '<b>B</b>'], ['italic', '<i>I</i>'], ['underline', '<u>U</u>'], ['h2', 'H2'], ['h3', 'H3'], ['p', '¶'], ['ul', '• lista'], ['undo', '↶'], ['redo', '↷']].map(([k, l]) => `<button class="btn sm" data-oc="${k}">${l}</button>`).join('')}<span style="flex:1"></span><button class="btn sm" id="ownIns">Wstaw raport pełny</button><button class="btn sm" id="ownRst">Przywróć raport obliczeń</button><button class="btn sm dng" id="ownClr">Wyczyść</button></div><p class="hint">Raport własny: kliknij w tekst i pisz; zmiany zapisują się w projekcie i nie zmieniają się przy kolejnych obliczeniach.</p>`; }
function bindOwn(el) {
  const o = $('#ownrep', el);
  const save = () => { S.meta.own = o.innerHTML; dirty = true; updateTitle(); autosave(); };
  o.addEventListener('input', save);
  $$('[data-oc]', el).forEach(b => b.addEventListener('mousedown', e => { e.preventDefault(); const k = b.dataset.oc; if (k === 'h2' || k === 'h3' || k === 'p') document.execCommand('formatBlock', false, k); else if (k === 'ul') document.execCommand('insertUnorderedList'); else document.execCommand(k); save(); }));
  $('#ownIns', el).onclick = () => { o.focus(); document.execCommand('insertHTML', false, window.SZR.build(R, S)); save(); };
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
const repBody = () => repMode() === 'own' ? (S.meta.own || window.SZR.build(R, S)) : repBuild();
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
const summaryLine = () => `${CIRC(S) ? '⌀' + S.geom.D : S.geom.b + '×' + S.geom.h} mm, l = ${String(S.geom.L).replace('.', ',')} m, ${S.mat.concrete}` + (R && R.checks ? (R.ok ? ' · OK' : ' · niespełnione warunki') : '');
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
  m.innerHTML = `<div class="dlg"><h3>SłupŻB 1.0 – słupy żelbetowe wg Eurokodu 2</h3>
  <p>Wymiarowanie i sprawdzanie słupów żelbetowych wg PN-EN 1992-1-1 (parametry krajowe wg Załącznika Krajowego PL: γ<sub>c</sub> = 1,4, γ<sub>s</sub> = 1,15, α<sub>cc</sub> = 1,0, ⌀<sub>min</sub> = 12 mm), kombinacje wg PN-EN 1990, odporność ogniowa wg PN-EN 1992-1-2 (metoda A).</p>
  <ul>
  <li><b>Przekroje</b> – prostokątne b × h i okrągłe ⌀D; pręty narożne i pośrednie o różnych średnicach, szpilki dobierane z warunku 9.5.3(6).</li>
  <li><b>Statyka</b> – słup jako pręt o schemacie podparcia w każdej płaszczyźnie (przegub–przegub, wspornik, utwierdzenie–przegub, utwierdzenie–utwierdzenie, utwierdzenie przesuwne); siły N z mimośrodem, momenty końcowe z analizy ramy, siły poziome w głowicy i obciążenie poziome na wysokości; ciężar własny.</li>
  <li><b>Kombinacje</b> – automatycznie (6.10 lub 6.10a/b, każde obciążenie zmienne obecne lub nie, kolejno wiodące, wiatr ±, γ<sub>G,sup</sub>/γ<sub>G,inf</sub>), charakterystyczne i quasi-stałe; albo siły obliczeniowe wprost.</li>
  <li><b>Smukłość i II rząd</b> – długość wyboczeniowa (rys. 5.7, wzory 5.15/5.16), imperfekcje 5.2, λ<sub>lim</sub> (5.13N) z A, B, C, pełzanie efektywne φ<sub>ef</sub> (5.19); metody nominalnej krzywizny (5.8.8), nominalnej sztywności (5.8.7) i ogólna (5.8.6, nieliniowa M–κ, słup modelowy); mimośród minimalny e₀.</li>
  <li><b>Nośność</b> – zgodność odkształceń (parabola-prostokąt lub prostokąt), krzywe interakcji N–M w obu płaszczyznach, zginanie ukośne wg 5.8.9 (5.38a,b i 5.39) oraz kontur M<sub>y</sub>–M<sub>z</sub> metodą włókien; ścinanie 6.2 z wpływem siły ściskającej.</li>
  <li><b>SGU</b> – naprężenia 7.2 i szerokość rys 7.3.4; <b>konstrukcja</b> – rozdz. 9.5 (A<sub>s,min</sub>, A<sub>s,max</sub>, ⌀<sub>min</sub>, strzemiona, rozstaw, strefy zagęszczenia, szpilki), 8.2, zakłady 8.7 i zakotwienia 8.4; <b>pożar</b> – tab. 5.2a i wzór (5.7).</li>
  <li><b>Dobór</b> – zbrojenia (najmniejsza masa stali), przekroju i wszystkiego; rysunek zbrojenia, wyciągi, zestawienie stali, eksport DXF; raport z pełnym tokiem obliczeń (HTML, .odt, PDF).</li></ul>
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
  renderInputs(); recalc(); updateTitle(); initCapabilities();
}
U.setState = s => { S = E.normalize(s); selCombo = null; renderInputs(); recalc(); };
U.getState = () => S;
U.selectTab = t => $(`.tabs button[data-tab="${t}"]`).click();
U.recalc = () => recalc();
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
