/* SłupŻB – raport obliczeniowy (notka obliczeniowa z pełnym tokiem obliczeń) */
(function () {
'use strict';
const SZR = window.SZR = {};
const PLN = d => d === 'y' ? 'h' : 'b';
const SECN = { base: 'podstawa', mid: 'strefa środkowa', top: 'głowica' };

function helpers() {
  const U = window.SZ, D = window.SZD;
  const { fmt, sym, esc } = U;
  const f = (v, d) => fmt(v, d === undefined ? 2 : d);
  let hn = 0, h3n = 0;
  const H2 = t => { h3n = 0; return `<h2>${++hn}. ${t}</h2>`; };
  const H3 = t => `<h3>${hn}.${++h3n}. ${t}</h3>`;
  const eq = (lhs, fx, sub, val, unit, ref, stt) => {
    let s = `<div class="eq">${sym(lhs)}`;
    if (fx) s += ` = ${sym(fx)}`;
    if (sub) s += ` = ${sym(sub)}`;
    if (val !== undefined && val !== null && val !== '') s += ` = <b>${val}</b>`;
    if (unit) s += ` ${unit}`;
    if (stt) s += ` <span class="${stt[0]}">${stt[1]}</span>`;
    if (ref) s += `<span class="r">[${ref}]</span>`;
    return s + '</div>';
  };
  const line = (t, ref) => `<div class="eq">${t}${ref ? `<span class="r">[${ref}]</span>` : ''}</div>`;
  const cmp = (a, rel, b, unit, d, okTxt) => {
    const good = rel === '≤' ? a <= b * (1 + 1e-9) + 1e-9 : rel === '<' ? a < b : a >= b * (1 - 1e-9) - 1e-9;
    return `<div class="eq">${f(a, d)} ${rel} ${f(b, d)} ${unit || ''} <span class="${good ? 'ok' : 'fail'}">${good ? '✔ ' + (okTxt || 'warunek spełniony') : '✖ warunek NIESPEŁNIONY'}</span></div>`;
  };
  const note = t => `<p class="note">${t}</p>`;
  const sec = (key, html) => `<section data-sec="${key}">${html}</section>`;
  return { U, D, fmt, sym, esc, f, H2, H3, eq, line, cmp, note, sec };
}
const govOf = (R, d) => R.res.reduce((a, q) => (q[d].u > a[d].u ? q : a));

// dane, materiały, otulina, obciążenia i kombinacje (wspólne dla obu raportów)
function partData(R, S, h, full) {
  const { esc, f, H2, H3, eq, line, note, sec, D } = h, E = window.EC2;
  const g = R.g, m = R.m, cov = R.cov, lay = R.lay;
  let o = '';
  o += H2('Dane wejściowe');
  o += line(`Element: <b>${esc(S.meta.name || 'słup')}</b>${S.meta.note ? ' – ' + esc(S.meta.note) : ''}`);
  o += line(`Przekrój: ${g.circ ? `okrągły, średnica D = ${g.D} mm` : `prostokątny b × h = ${g.b} × ${g.h} mm (b – wzdłuż osi y, h – wzdłuż osi z)`}; A<sub>c</sub> = ${f(g.Ac / 1e6, 4)} m²; wysokość słupa w świetle l = ${f(g.L / 1000, 2)} m`);
  ['y', 'z'].forEach(d => { const B = R.buck[d]; o += line(`Płaszczyzna ${PLN(d)} (zginanie M<sub>${d}</sub>): ${esc(B.schName)}`); });
  o += line(`Beton ${esc(S.mat.concrete)}, stal podłużna ${esc(m.st.name)}, strzemiona ${esc(m.sw.name)}; kruszywo d<sub>g</sub> = ${S.mat.dg} mm`);
  o += line(`Klasa ekspozycji: ${cov.exps.join(', ')}; projektowy okres użytkowania ${S.env.life} lat`);
  if (lay.n) o += line(`Zbrojenie podłużne: ${g.circ ? `${lay.n}⌀${lay.dmax} równomiernie na obwodzie` : `${lay.n} prętów: narożne 4⌀${S.reb.dc}${lay.n > 4 ? `, pośrednie ⌀${S.reb.dm} (wzdłuż b: ${S.reb.nb} szt., wzdłuż h: ${S.reb.nh} szt. – z narożnymi)` : ''}`}; A<sub>s</sub> = ${f(lay.As, 0)} mm², ρ = ${f(lay.As / g.Ac * 100, 2)}%`);
  else o += line('<b>Zbrojenie podłużne nie zostało zadane</b> – sprawdzenia nośności dotyczą przekroju niezbrojonego.');
  if (lay.n) o += line(`Strzemiona ⌀${lay.dt}, rozstaw s = ${R.ties.s} mm, przy stropach i w strefie zakładu s = ${R.ties.sRed} mm${lay.pins.length ? `; szpilki: ${lay.pins.length} w przekroju` : ''}`);
  o += line(`Metoda analizy efektów II rzędu: ${{ nc: 'nominalnej krzywizny (5.8.8)', ns: 'nominalnej sztywności (5.8.7)', gen: 'ogólna – analiza nieliniowa (5.8.6)' }[S.sec2.method]}; zginanie ukośne: ${S.sec2.biax === 'fiber' ? 'kontur nośności (metoda włókien)' : 'wzór (5.39)'}`);
  o += H2('Parametry materiałowe');
  o += H3(`Beton ${esc(S.mat.concrete)}`);
  o += eq('f_{ck}', '', '', f(m.fck, 0), 'MPa', 'tab. 3.1') + eq('f_{cm}', 'f_{ck} + 8', '', f(m.fcm, 0), 'MPa');
  o += eq('f_{cd}', 'α_{cc}·f_{ck}/γ_{c}', `${f(m.acc, 2)}·${f(m.fck, 0)}/${f(m.gc, 2)}`, f(m.fcd, 2), 'MPa', '3.1.6');
  o += eq('E_{cm}', '', '', f(m.Ecm / 1000, 0), 'GPa', 'tab. 3.1') + eq('E_{cd}', 'E_{cm}/γ_{cE}', `${f(m.Ecm / 1000, 0)}/${f(m.gcE, 2)}`, f(m.Ecd / 1000, 2), 'GPa', '5.8.6(3)');
  o += line(`ε<sub>c2</sub> = ${f(m.ec2 * 1000, 2)}‰, ε<sub>cu2</sub> = ${f(m.ecu2 * 1000, 2)}‰, n = ${f(m.npar, 2)}; ε<sub>c3</sub> = ${f(m.ec3 * 1000, 2)}‰, ε<sub>cu3</sub> = ${f(m.ecu3 * 1000, 2)}‰; wykres do wymiarowania: ${m.diag === 'rect' ? 'prostokątny (λ = ' + f(m.lambda, 2) + ', η = ' + f(m.eta, 2) + ')' : 'parabola-prostokąt'}`, '3.1.7');
  o += H3(`Stal ${esc(m.st.name)}`);
  o += eq('f_{yd}', 'f_{yk}/γ_{s}', `${m.fyk}/${f(m.gs, 2)}`, f(m.fyd, 1), 'MPa', '3.2.7') + eq('ε_{yd}', 'f_{yd}/E_{s}', `${f(m.fyd, 1)}/200 000`, f(m.eyd * 1000, 3), '‰') + eq('f_{ywd}', 'f_{ywk}/γ_{s}', `${m.fywk}/${f(m.gs, 2)}`, f(m.fywd, 1), 'MPa');
  // otulina
  let c = H2('Otulina betonowa');
  c += line(`Klasa konstrukcji: ${cov.mods.map(esc).join('; ')} → <b>S${cov.sc}</b>`, 'tab. 4.3N');
  c += eq('c_{min,dur}', '', '', cov.cdur, 'mm', 'tab. 4.4N') + eq('c_{min,b}', '⌀ (pręt podłużny) / ⌀_{t} (strzemię)', `${cov.cminb_main} / ${cov.cminb_sw}`, '', 'mm', '4.4.1.2(3)');
  c += eq('c_{min}', 'max(c_{min,b}; c_{min,dur} + Δc_{dur,γ} − Δc_{dur,st} − Δc_{dur,add}; 10 mm)', '', `${cov.cmin_sw} / ${cov.cmin_main}`, 'mm (strzemię / pręt)', '4.4.1.2');
  c += eq('c_{nom}', 'max(c_{min,s} + Δc_{dev}; c_{min,pręt} + Δc_{dev} − ⌀_{t})', `max(${cov.cmin_sw} + ${cov.dcdev}; ${cov.cmin_main} + ${cov.dcdev} − ${cov.dSw})`, f(cov.req, 0), 'mm → ' + cov.reqR + ' mm', '4.4.1.1');
  c += line(`Przyjęto otulinę strzemion c<sub>nom</sub> = <b>${cov.cnom} mm</b>${cov.manual ? ' (podana ręcznie)' : ''} ${cov.cnom >= cov.reqR ? '<span class="ok">✔</span>' : '<span class="fail">✖ mniej niż wymagane</span>'}; minimalna klasa betonu: ${cov.minCls} (${cov.minFrom}) ${cov.minOk ? '<span class="ok">✔</span>' : '<span class="warn">⚠ klasa betonu niższa od zalecanej</span>'}`, 'zał. E');
  o += sec('cov', c);
  // obciążenia
  o += H2(S.loads.mode === 'direct' ? 'Siły obliczeniowe (wprowadzone)' : 'Obciążenia i kombinacje');
  if (S.loads.mode === 'direct') {
    R.items.forEach(it => { if (it.kind === 'sw') { o += line(`G₀ – ciężar własny słupa: ${f(g.selfW, 2)} kN/m × ${f(g.L / 1000, 2)} m = ${f(g.selfW * g.L / 1000, 1)} kN (w kombinacjach z γ<sub>G</sub> = ${f(S.loads.gG, 2)})`); return; }
      o += line(`<b>${esc(it.id)}</b> – ${esc(it.name)}: N<sub>Ed</sub> = ${f(it.N, 1)} kN; M<sub>y</sub>: głowica ${f(it.Myt, 2)}, podstawa ${f(it.Myb, 2)} kNm; M<sub>z</sub>: głowica ${f(it.Mzt, 2)}, podstawa ${f(it.Mzb, 2)} kNm${it.Vy !== '' ? `; V<sub>y</sub> = ${f(+it.Vy, 1)} kN` : ''}${it.Vz !== '' ? `; V<sub>z</sub> = ${f(+it.Vz, 1)} kN` : ''}`); });
    o += note(`Siły I rzędu bez imperfekcji. Do pełzania przyjęto M<sub>0Eqp</sub>/M<sub>0Ed</sub> = ${f(S.loads.rqp, 2)}, do SGU siły charakterystyczne = ${f(S.loads.rk, 2)} × obliczeniowe.`);
  } else {
    o += H3('Obciążenia charakterystyczne');
    R.items.forEach(it => {
      if (it.kind === 'sw') { o += line(`<b>G₀</b> – ciężar własny słupa: 25 kN/m³ × ${f(g.Ac / 1e6, 4)} m² = ${f(g.selfW, 2)} kN/m; u podstawy ${f(g.selfW * g.L / 1000, 1)} kN`); return; }
      const parts = [];
      if (it.N) parts.push(`N = ${f(it.N, 1)} kN`); if (it.eh) parts.push(`e<sub>h</sub> = ${f(it.eh, 0)} mm`); if (it.eb) parts.push(`e<sub>b</sub> = ${f(it.eb, 0)} mm`);
      if (it.Myt || it.Myb) parts.push(`M<sub>y</sub>: głowica ${f(it.Myt, 2)}, podstawa ${f(it.Myb, 2)} kNm`); if (it.Mzt || it.Mzb) parts.push(`M<sub>z</sub>: głowica ${f(it.Mzt, 2)}, podstawa ${f(it.Mzb, 2)} kNm`);
      if (it.Hh) parts.push(`H<sub>h</sub> = ${f(it.Hh, 2)} kN`); if (it.Hb) parts.push(`H<sub>b</sub> = ${f(it.Hb, 2)} kN`); if (it.qh) parts.push(`q<sub>h</sub> = ${f(it.qh, 2)} kN/m`); if (it.qb) parts.push(`q<sub>b</sub> = ${f(it.qb, 2)} kN/m`);
      o += line(`<b>${esc(it.id)}</b> – ${esc(it.name || '')} (${it.perm ? 'stałe' : esc(it.psi.name)}${it.pm ? ', działa w obu kierunkach ±' : ''}${it.perm ? '' : `; ψ₀ = ${f(it.psi.p0, 2)}, ψ₁ = ${f(it.psi.p1, 2)}, ψ₂ = ${f(it.psi.p2, 2)}`}): ${parts.join('; ') || 'brak wartości'}`);
    });
    o += H3('Kombinacje oddziaływań');
    o += line(S.loads.comb === '610' ? `SGN – wzór (6.10): γ<sub>G,sup</sub> = ${f(S.loads.gG, 2)}, γ<sub>G,inf</sub> = ${f(S.loads.gGinf, 2)}, γ<sub>Q</sub> = ${f(S.loads.gQ, 2)}` : `SGN – wzory (6.10a) i (6.10b): γ<sub>G,sup</sub> = ${f(S.loads.gG, 2)}, ξ = ${f(S.loads.xi, 2)}, γ<sub>G,inf</sub> = ${f(S.loads.gGinf, 2)}, γ<sub>Q</sub> = ${f(S.loads.gQ, 2)}`, 'PN-EN 1990, 6.4.3.2');
    o += line(`Liczba kombinacji SGN: ${R.combos.U.length} (każde obciążenie zmienne obecne lub nie, kolejno wiodące, obciążenia dwukierunkowe z oboma znakami, ciężar stały z γ<sub>G,sup</sub> i γ<sub>G,inf</sub>); SGU: charakterystycznych ${R.combos.K.length} (6.14b), quasi-stałych ${R.combos.QP.length} (6.16b).`);
    if (R.combos.capped) o += note('Liczba wariantów obciążeń zmiennych przekracza 729 – przyjęto wszystkie obciążenia zmienne jednocześnie (obciążenia dwukierunkowe ze znakami ±).');
  }
  if (full && R.res.length) {
    const top = R.res.slice().sort((a, b) => b.u - a.u).slice(0, 8);
    o += H3('Kombinacje decydujące (siły I rzędu)');
    top.forEach(q => { o += line(`<b>${esc(q.c.name)}</b>: ${esc(E.comboDesc(q.c, R.items))} → N<sub>Ed</sub> = ${f(q.fr.Ntop / 1e3, 1)} kN (głowica) / ${f(q.fr.Nbot / 1e3, 1)} kN (podstawa); M<sub>0y</sub>: ${f(q.y.Mt / 1e6, 2)} / ${f(q.y.Mb / 1e6, 2)} kNm; M<sub>0z</sub>: ${f(q.z.Mt / 1e6, 2)} / ${f(q.z.Mb / 1e6, 2)} kNm; η = ${isFinite(q.u) ? f(q.u * 100, 0) + '%' : '∞'}`); });
  }
  o += `<div class="fig">${['y', 'z'].map(d => D.schemeSVG(R, S, d, { W: 330, H: 440, diag: 'M' })).join('')}</div>`;
  return o;
}

SZR.build = function (R, S) {
  const h = helpers(); const { esc, f, H2, H3, eq, line, cmp, note, sec, D, U } = h, E = window.EC2;
  const g = R.g, m = R.m, lay = R.lay;
  let o = '';
  o += `<h1>${esc(S.meta.name || 'Słup')} – obliczenia statyczno-wytrzymałościowe</h1><p class="note">Słup żelbetowy wg PN-EN 1992-1-1 (z Załącznikiem Krajowym), PN-EN 1990, PN-EN 1992-1-2. Jednostki: kN, kNm, mm, MPa.</p>`;
  o += partData(R, S, h, true);
  if (!R.res.length) return o + H2('Wyniki') + line('Brak kombinacji obciążeń – dodaj obciążenia.');
  // ---- długość wyboczeniowa, imperfekcje, pełzanie
  o += H2('Długość wyboczeniowa, smukłość i imperfekcje');
  const imp = R.imp, cr = R.creep;
  ['y', 'z'].forEach(d => {
    const B = R.buck[d], gd = g.dir[d];
    let s = H3(`Płaszczyzna ${PLN(d)} (zginanie M<sub>${d}</sub>, wymiar ${gd.depth} mm)`);
    s += line(`Schemat: ${esc(B.schName)} – układ ${B.braced ? 'usztywniony (bez przesuwu głowicy)' : 'nieusztywniony (przesuwny)'}`, 'rys. 5.7');
    if (B.mode === 'k') {
      s += line(`Podatności węzłów: k₁ = ${f(B.k1in, 3)}, k₂ = ${f(B.k2in, 3)}${B.k1in < 0.1 || B.k2in < 0.1 ? ' (przyjęto k ≥ 0,1 – utwierdzenie idealne nie występuje)' : ''}`, '5.8.3.2(3)');
      s += B.braced ? eq('l_{0}', '0,5·l·√((1 + k₁/(0,45 + k₁))·(1 + k₂/(0,45 + k₂)))', '', f(B.l0, 0), 'mm', '(5.15)') : eq('l_{0}', 'l·max(√(1 + 10·k₁k₂/(k₁ + k₂)); (1 + k₁/(1 + k₁))·(1 + k₂/(1 + k₂)))', `${f(g.L, 0)}·max(${f(B.la, 3)}; ${f(B.lc, 3)})`, f(B.l0, 0), 'mm', '(5.16)');
    } else if (B.mode === 'l0') s += eq('l_{0}', '', '', f(B.l0, 0), 'mm (podana)', '5.8.3.2');
    else s += eq('l_{0}', 'β·l', `${f(B.beta, 2)}·${f(g.L, 0)}`, f(B.l0, 0), 'mm', '5.8.3.2');
    s += eq('i', '√(I_{c}/A_{c})', `√(${f(gd.I / 1e6, 1)}·10⁶/${f(g.Ac, 0)})`, f(gd.i, 1), 'mm') + eq('λ', 'l_{0}/i', `${f(B.l0, 0)}/${f(gd.i, 1)}`, f(B.lam, 1), '', '(5.14)');
    o += sec('slenB' + d, s);
  });
  o += H3('Imperfekcje geometryczne');
  if (imp.mode === 'theta') {
    o += eq('α_{h}', '2/√l', `2/√${f(g.L / 1000, 2)}`, f(imp.ah, 3), '(2/3 ≤ α_{h} ≤ 1)', '5.2(5)') + eq('α_{m}', '√(0,5·(1 + 1/m))', `m = ${imp.m}`, f(imp.am, 3), '') + eq('θ_{i}', 'θ_{0}·α_{h}·α_{m}', `(1/200)·${f(imp.ah, 3)}·${f(imp.am, 3)}`, f(imp.th, 5), 'rad', '(5.1)');
    ['y', 'z'].forEach(d => { o += eq(`e_{i,${d}}`, 'θ_{i}·l_{0}/2', `${f(imp.th, 5)}·${f(R.buck[d].l0, 0)}/2`, f(imp[d], 1), 'mm', '(5.2)'); });
  } else if (imp.mode === 'l400') ['y', 'z'].forEach(d => { o += eq(`e_{i,${d}}`, 'l_{0}/400', `${f(R.buck[d].l0, 0)}/400`, f(imp[d], 1), 'mm', '5.2(9)'); });
  else ['y', 'z'].forEach(d => { o += eq(`e_{i,${d}}`, '', '', f(imp[d], 1), 'mm (podany)', '5.2'); });
  o += note('Imperfekcje uwzględnia się jako dodatkowy mimośród siły N<sub>Ed</sub> w kierunku niekorzystnym; przy zginaniu ukośnym – tylko w jednym kierunku jednocześnie (5.8.9(2)).');
  o += H3('Pełzanie (zał. B)');
  if (cr.sel === 'auto') {
    o += eq('h_{0}', '2A_{c}/u', `2·${f(g.Ac, 0)}/${f(g.u, 0)}`, f(cr.h0, 0), 'mm');
    o += eq('φ_{RH}', m.fcm <= 35 ? '1 + (1 − RH/100)/(0,1·∛h_{0})' : '[1 + (1 − RH/100)/(0,1·∛h_{0})·α₁]·α₂', m.fcm <= 35 ? '' : `α₁ = ${f(cr.a1, 3)}, α₂ = ${f(cr.a2, 3)}`, f(cr.phiRH, 3), '', '(B.3)');
    o += eq('β(f_{cm})', '16,8/√f_{cm}', `16,8/√${f(m.fcm, 0)}`, f(cr.bfcm, 3), '', '(B.4)') + eq('β(t_{0})', '1/(0,1 + t_{0}^{0,20})', `t₀ = ${f(cr.t0adj, 1)} d`, f(cr.bt0, 3), '', '(B.5)');
    o += eq('φ(∞, t_{0})', 'φ_{RH}·β(f_{cm})·β(t_{0})', `${f(cr.phiRH, 3)}·${f(cr.bfcm, 3)}·${f(cr.bt0, 3)}`, f(cr.phi, 3), '', '(B.2)');
  } else o += line(cr.sel === 'off' ? 'Pełzanie pominięte (φ = 0).' : `Przyjęto φ(∞, t₀) = ${f(cr.phi, 2)}.`);
  o += note('Pełzanie efektywne φ<sub>ef</sub> = φ(∞, t₀)·M<sub>0Eqp</sub>/M<sub>0Ed</sub> (5.19) wyznaczono dla każdej kombinacji z momentu I rzędu kombinacji quasi-stałej o tym samym układzie obciążeń.');
  // ---- efekty II rzędu i nośność w każdej płaszczyźnie
  ['y', 'z'].forEach(d => {
    const q = govOf(R, d), r = q[d], B = R.buck[d], Dd = R.dirs[d], gd = g.dir[d];
    let s = H2(`Efekty II rzędu – płaszczyzna ${PLN(d)} (M<sub>${d}</sub>)`);
    s += line(`Kombinacja decydująca: <b>${esc(q.c.name)}</b> = ${esc(E.comboDesc(q.c, R.items))}`);
    s += eq('N_{Ed}', B.braced ? 'N w połowie wysokości' : 'N u podstawy', '', f(r.NEd / 1e3, 1), 'kN') + line(`N<sub>Ed</sub> w głowicy ${f(r.Ntop / 1e3, 1)} kN, u podstawy ${f(r.Nbot / 1e3, 1)} kN`);
    s += line(`Momenty I rzędu na końcach: głowica M = ${f(r.Mt / 1e6, 2)} kNm, podstawa M = ${f(r.Mb / 1e6, 2)} kNm${r.tr ? '; w słupie występuje obciążenie poprzeczne (rozkład nieliniowy, M<sub>max,wewn</sub> = ' + f(r.Mint / 1e6, 2) + ' kNm)' : ''}`);
    s += eq('M_{02}', '|M| większy', '', f(r.M02 / 1e6, 2), 'kNm') + eq('M_{01}', 'M mniejszy (ze znakiem względem M_{02})', '', f(r.M01 / 1e6, 2), 'kNm');
    s += eq('N_{Ed}·e_{i}', '', `${f(r.NEd / 1e3, 1)}·${f(r.ei, 1)}·10⁻³`, f(r.NEd * r.ei / 1e6, 2), 'kNm');
    if (B.braced) {
      s += eq('M_{02}', 'M_{02} + N_{Ed}·e_{i}', `${f(r.M02 / 1e6, 2)} + ${f(r.NEd * r.ei / 1e6, 2)}`, f(r.M02i / 1e6, 2), 'kNm') + eq('M_{01}', 'M_{01} + N_{Ed}·e_{i}', `${f(r.M01 / 1e6, 2)} + ${f(r.NEd * r.ei / 1e6, 2)}`, f(r.M01i / 1e6, 2), 'kNm');
      s += eq('M_{0e}', 'max(0,6·M_{02} + 0,4·M_{01}; 0,4·M_{02})', `max(0,6·${f(r.M02i / 1e6, 2)} + 0,4·${f(r.M01i / 1e6, 2)}; 0,4·${f(r.M02i / 1e6, 2)})`, f(r.M0e / 1e6, 2), 'kNm', '(5.32)');
      if (r.tr) s += eq('M_{0Ed}', 'max(M_{0e}; M_{max,wewn} + N_{Ed}·e_{i})', '', f(r.M0Ed / 1e6, 2), 'kNm');
      else s += eq('M_{0Ed}', 'M_{0e}', '', f(r.M0Ed / 1e6, 2), 'kNm');
    } else s += eq('M_{0Ed}', 'M_{0,koniec} + N_{Ed}·e_{i}', '', f(r.M0Ed / 1e6, 2), 'kNm', '5.8.8.2(1)');
    s += H3('Pełzanie efektywne i smukłość graniczna');
    if (r.M0Eqp !== undefined) s += eq('M_{0Eqp}', '(kombinacja quasi-stała, z N_{qp}·e_{i})', '', f(r.M0Eqp / 1e6, 2), 'kNm');
    s += eq('φ_{ef}', 'φ(∞,t_{0})·M_{0Eqp}/M_{0Ed}', `${f(Dd.phiInf, 3)}·${f(r.rqp, 3)}`, f(r.phiEf, 3), '', '(5.19)');
    if (r.creepIgn) s += note('Pełzanie pominięte – spełnione warunki 5.8.4(4): φ(∞,t₀) ≤ 2, λ ≤ 75, M<sub>0Ed</sub>/N<sub>Ed</sub> ≥ h.');
    s += eq('n', 'N_{Ed}/(A_{c}·f_{cd})', `${f(r.NEd, 0)}/(${f(g.Ac, 0)}·${f(m.fcd, 2)})`, f(r.n, 3), '', '5.8.3.1');
    s += eq('ω', 'A_{s}·f_{yd}/(A_{c}·f_{cd})', `${f(lay.As, 0)}·${f(m.fyd, 1)}/(${f(g.Ac, 0)}·${f(m.fcd, 2)})`, f(r.omega, 3), '');
    s += eq('A', '1/(1 + 0,2·φ_{ef})', '', f(r.A, 3), '') + eq('B', '√(1 + 2ω)', '', f(r.Bc, 3), '');
    s += r.Cmode === 'ends' ? eq('C', '1,7 − r_{m}', `r_{m} = M_{01}/M_{02} = ${f(r.rm, 3)}`, f(r.C, 3), '') : eq('C', '', { unbraced: 'układ nieusztywniony', transverse: 'obciążenie poprzeczne w słupie', imp: 'momenty I rzędu głównie od imperfekcji' }[r.Cmode], f(r.C, 2), '');
    s += eq('λ_{lim}', '20·A·B·C/√n', `20·${f(r.A, 3)}·${f(r.Bc, 3)}·${f(r.C, 3)}/√${f(r.n, 3)}`, f(r.lamLim, 1), '', '(5.13N)');
    s += line(`λ = ${f(r.lam, 1)} ${r.slender ? '&gt;' : '≤'} λ<sub>lim</sub> = ${f(r.lamLim, 1)} → ${r.slender ? '<b>efekty II rzędu należy uwzględnić</b>' : 'efekty II rzędu można pominąć (5.8.2(6))'}`, '5.8.3.1(1)');
    if (r.slender) {
      if (r.method === 'nc' || (r.method === 'gen' && !r.gen)) {
        s += H3('Metoda nominalnej krzywizny (5.8.8)');
        s += eq('i_{s}', '√(Σ A_{s,i}·(y_{i} − h/2)²/A_{s})', '', f(Dd.is, 1), 'mm') + eq('d', 'h/2 + i_{s}', `${f(gd.depth / 2, 1)} + ${f(Dd.is, 1)}`, f(r.d, 1), 'mm', '5.8.8.3(2)');
        s += eq('1/r_{0}', 'ε_{yd}/(0,45·d)', `${f(m.eyd, 5)}/(0,45·${f(r.d, 1)})`, f(r.r0 * 1e6, 3) + '·10⁻⁶', '1/mm', '5.8.8.3(1)');
        s += eq('n_{u}', '1 + ω', '', f(r.nu, 3), '') + eq('K_{r}', '(n_{u} − n)/(n_{u} − n_{bal}) ≤ 1', `(${f(r.nu, 3)} − ${f(r.n, 3)})/(${f(r.nu, 3)} − 0,4)`, f(r.Kr, 3), '', '(5.36)');
        s += eq('β', '0,35 + f_{ck}/200 − λ/150', `0,35 + ${f(m.fck, 0)}/200 − ${f(r.lam, 1)}/150`, f(r.betaPhi, 3), '') + eq('K_{φ}', '1 + β·φ_{ef} ≥ 1', `1 + ${f(r.betaPhi, 3)}·${f(r.phiEf, 3)}`, f(r.Kphi, 3), '', '(5.37)');
        s += eq('1/r', 'K_{r}·K_{φ}·1/r_{0}', `${f(r.Kr, 3)}·${f(r.Kphi, 3)}·${f(r.r0 * 1e6, 3)}·10⁻⁶`, f(r.curv * 1e6, 3) + '·10⁻⁶', '1/mm', '(5.34)');
        s += eq('e_{2}', '(1/r)·l_{0}²/c', `${f(r.curv * 1e6, 3)}·10⁻⁶·${f(r.l0, 0)}²/${f(r.c, 2)}`, f(r.e2, 1), 'mm', '5.8.8.2(4)');
        s += eq('M_{2}', 'N_{Ed}·e_{2}', `${f(r.NEd / 1e3, 1)}·${f(r.e2, 1)}·10⁻³`, f(r.M2 / 1e6, 2), 'kNm', '(5.33)');
      } else if (r.method === 'ns') {
        s += H3('Metoda nominalnej sztywności (5.8.7)');
        if (r.nsEq === '5.26') s += eq('K_{c}', '0,3/(1 + 0,5·φ_{ef})', '', f(r.Kc, 4), '', '(5.26)') + line('K<sub>s</sub> = 0');
        else s += eq('k_{1}', '√(f_{ck}/20)', '', f(r.k1, 3), '', '(5.23)') + eq('k_{2}', 'n·λ/170 ≤ 0,20', `${f(r.n, 3)}·${f(r.lam, 1)}/170`, f(r.k2, 4), '', '(5.24)') + eq('K_{c}', 'k_{1}·k_{2}/(1 + φ_{ef})', `${f(r.k1, 3)}·${f(r.k2, 4)}/(1 + ${f(r.phiEf, 3)})`, f(r.Kc, 4), '', '(5.22)') + line(`K<sub>s</sub> = 1 (ρ = ${f(r.rho * 100, 2)}% ≥ 0,2%)`, '5.8.7.2(2)');
        s += eq('I_{s}', 'Σ A_{s,i}·(y_{i} − h/2)²', '', f(Dd.Is / 1e6, 2) + '·10⁶', 'mm⁴') + eq('EI', 'K_{c}·E_{cd}·I_{c} + K_{s}·E_{s}·I_{s}', `${f(r.Kc, 4)}·${f(m.Ecd, 0)}·${f(Dd.Ic / 1e6, 0)}·10⁶ + ${r.Ks}·200 000·${f(Dd.Is / 1e6, 2)}·10⁶`, f(r.EI / 1e12, 3), 'MNm²', '(5.21)');
        s += eq('N_{B}', 'π²·EI/l_{0}²', `π²·${f(r.EI / 1e12, 3)}·10¹²/${f(r.l0, 0)}²`, f(r.NB / 1e3, 1), 'kN');
        if (r.unstable) s += line('<span class="fail">✖ N<sub>Ed</sub> ≥ N<sub>B</sub> – utrata stateczności</span>');
        else { s += eq('β', r.c0 ? 'π²/c_{0}' : '', r.c0 ? `c₀ = ${r.c0} (M_{0e} stały)` : 'przyjęto 1,0 (5.8.7.3(3))', f(r.beta, 3), '', '5.8.7.3'); s += eq('M_{Ed}', 'M_{0Ed}·[1 + β/(N_{B}/N_{Ed} − 1)]', `${f(r.M0Ed / 1e6, 2)}·[1 + ${f(r.beta, 3)}/(${f(r.NB / 1e3, 1)}/${f(r.NEd / 1e3, 1)} − 1)]`, f((r.M0Ed + r.M2) / 1e6, 2), 'kNm', '(5.28)'); s += eq('M_{2}', 'M_{Ed} − M_{0Ed}', '', f(r.M2 / 1e6, 2), 'kNm'); }
      }
      if (r.method === 'gen' && r.gen) {
        s += H3('Metoda ogólna (5.8.6) – analiza nieliniowa słupa modelowego');
        s += line(`Zależność σ–ε betonu wg 3.1.5 z f<sub>cd</sub> i E<sub>cd</sub> = ${f(m.Ecd / 1000, 2)} GPa; odkształcenia betonu × (1 + φ<sub>ef</sub>) = ${f(1 + r.phiEf, 3)} (pełzanie, 5.8.6(4)); stal sprężysto-plastyczna f<sub>yd</sub>; beton rozciągany pominięty.`, '5.8.6');
        s += line(`Słup modelowy: ${B.braced ? `pręt przegubowy o długości l<sub>0</sub> = ${f(r.l0, 0)} mm z momentami M<sub>01</sub>, M<sub>02</sub> i łukiem wstępnym e<sub>i</sub>·sin(πx/l<sub>0</sub>)` : `wspornik o długości l<sub>0</sub>/2 = ${f(r.l0 / 2, 0)} mm z momentem M<sub>0Ed</sub> i pochyleniem θ<sub>i</sub>`}; krzywizny z zależności M–κ przy N<sub>Ed</sub>, ugięcia przez dwukrotne całkowanie (iteracja do zbieżności).`);
        if (r.gen.unstable) s += line(`<span class="fail">✖ ${esc(r.gen.note || 'brak stanu równowagi')}</span>`);
        else s += eq('M_{max}', 'max |M_{0}(x) + N_{Ed}·(e_{0}(x) + y(x))|', `y_{max} = ${f(r.gen.ymax, 1)} mm, M_{max,M–κ} = ${f(r.gen.Mmax / 1e6, 1)} kNm`, f(r.gen.Mtot / 1e6, 2), 'kNm') + eq('M_{2}', 'M_{max} − M_{0Ed}', '', f(r.M2 / 1e6, 2), 'kNm');
      }
    } else s += eq('M_{2}', '', '', '0', 'kNm');
    s += H3('Momenty obliczeniowe w przekrojach');
    r.secs.forEach(x => {
      const e0 = S.sec2.e0 ? x.N * r.e0 : 0;
      let t = `${SECN[x.key]}: N<sub>Ed</sub> = ${f(x.N / 1e3, 1)} kN; M<sub>Ed</sub> = `;
      if (x.key === 'mid' && B.braced) t += `${x.mOpt === 'M01+0,5M2' ? `M<sub>01</sub> + 0,5·M<sub>2</sub> = ${f(r.M01i / 1e6, 2)} + 0,5·${f(r.M2 / 1e6, 2)}` : `M<sub>0Ed</sub> + M<sub>2</sub> = ${f(r.M0Ed / 1e6, 2)} + ${f(r.M2 / 1e6, 2)}`}`;
      else t += `|M<sub>0</sub>| + N·e<sub>i</sub>${x.M2 ? ' + M<sub>2</sub>' : ''} = ${f(Math.abs(x.M0) / 1e6, 2)} + ${f(x.Mimp / 1e6, 2)}${x.M2 ? ' + ' + f(x.M2 / 1e6, 2) : ''}`;
      t += ` = ${f((x.M - (x.e0gov ? 0 : 0)) / 1e6, 2)} kNm`;
      if (S.sec2.e0) t += `; N·e<sub>0</sub> = ${f(x.N / 1e3, 1)}·${f(r.e0, 0)}·10⁻³ = ${f(e0 / 1e6, 2)} kNm${x.e0gov ? ' – <b>decyduje mimośród minimalny</b>' : ''}`;
      s += line(t + ` → <b>M<sub>Ed</sub> = ${f(x.M / 1e6, 2)} kNm</b>`, x.key === 'mid' && B.braced ? '5.8.8.2(3)' : '6.1(4)');
    });
    s += `<div class="fig">${D.heightChart({ W: 300, H: 380, L: g.L, title: `M_${d} – płaszczyzna ${PLN(d)} [kNm]`, unit: `M_${d} [kNm]`, series: (() => { const ms = D.momentSeries(R, q, d); return [{ v: ms.tot, c: D.C.red, fill: D.C.red, l: 'M_Ed' }, { v: ms.imp, c: D.C.warn, dash: '3 3', w: 1.2, l: '+ e_i' }, { v: ms.M0, c: D.C.acc, dash: '6 3', w: 1.3, l: 'M₀' }]; })() })}</div>`;
    o += sec('slen' + d, s);
    // nośność
    let u = H2(`Nośność przekroju – zginanie z siłą podłużną w płaszczyźnie ${PLN(d)}`);
    u += line(`Metoda ogólna przekroju (zgodność odkształceń): płaskie przekroje, beton ${m.diag === 'rect' ? 'prostokątny wykres naprężeń' : 'parabola-prostokąt'} z ε<sub>cu</sub> = ${f(m.ecu * 1000, 2)}‰ (przy ściskaniu osiowym ε<sub>c</sub> ≤ ${f(m.ec * 1000, 2)}‰), stal f<sub>yd</sub> = ${f(m.fyd, 1)} MPa, ε<sub>ud</sub> = ${f(m.eud * 1000, 1)}‰; wytrzymałość betonu na rozciąganie pominięta.`, '6.1(2), 6.1(5)');
    const x = r.gov, MR = x.MRd;
    u += line(`Przekrój decydujący: <b>${SECN[x.key]}</b>, kombinacja ${esc(q.c.name)}`);
    u += eq('N_{Ed}', '', '', f(x.N / 1e3, 1), 'kN') + eq('M_{Ed}', '', '', f(x.M / 1e6, 2), 'kNm');
    u += eq('M_{Rd}(N_{Ed})', '(z krzywej interakcji)', '', MR === null ? '—' : f(MR / 1e6, 2), 'kNm');
    u += MR === null ? line('<span class="fail">✖ N<sub>Ed</sub> przekracza nośność przekroju na ściskanie</span>') : cmp(x.M / 1e6, '≤', MR / 1e6, 'kNm', 2, `η = ${f(x.u * 100, 0)}%`);
    if (lay.n) u += `<div class="fig">${D.interactionSVG(R, d, { W: 460, H: 400, gov: q.ci })}</div>`;
    o += sec('uls' + d, u);
  });
  // ---- ściskanie osiowe
  {
    const oN = R.res.reduce((a, q) => (q.fr.Nbot > a.fr.Nbot ? q : a));
    const Nmax = Math.min(R.dirs.y.U.Nmax, R.dirs.z.U.Nmax);
    let s = H2('Nośność na ściskanie osiowe');
    s += eq('N_{Rd}', 'A_{c}·f_{cd} + A_{s}·σ_{s}(ε_{c2})', '', f(Nmax / 1e3, 1), 'kN', '6.1(5)') + eq('N_{Ed,max}', '', esc(oN.c.name), f(oN.fr.Nbot / 1e3, 1), 'kN');
    s += cmp(oN.fr.Nbot / 1e3, '≤', Nmax / 1e3, 'kN', 1);
    s += note(`Dla porównania A<sub>c</sub>·f<sub>cd</sub> + A<sub>s</sub>·f<sub>yd</sub> = ${f(R.NRd0 / 1e3, 1)} kN (przy ε<sub>c2</sub> = ${f(m.ec2 * 1000, 1)}‰ naprężenie w stali E<sub>s</sub>·ε<sub>c2</sub> = ${f(Math.min(m.fyd, 200000 * m.ec2), 0)} MPa).`);
    o += sec('ulsN', s);
  }
  // ---- zginanie ukośne
  {
    const ob = R.res.reduce((a, q) => ((q.biax.u539 || 0) > (a.biax.u539 || 0) ? q : a));
    let s = H2('Zginanie ukośne (5.8.9)');
    const By = R.buck.y, Bz = R.buck.z;
    s += eq('λ_{y}/λ_{z}', '', `${f(By.lam, 1)}/${f(Bz.lam, 1)}`, f(By.lam / Bz.lam, 2), '', '(5.38a)') + line(`warunek λ<sub>y</sub>/λ<sub>z</sub> ≤ 2 i λ<sub>z</sub>/λ<sub>y</sub> ≤ 2: ${By.lam / Bz.lam <= 2 && Bz.lam / By.lam <= 2 ? '<span class="ok">spełniony</span>' : '<span class="warn">niespełniony</span>'}`);
    const sg = ob.biax.gov, cs = sg.gov;
    s += line(`Kombinacja: <b>${esc(ob.c.name)}</b>, przekrój: ${SECN[sg.key]}, N<sub>Ed</sub> = ${f(sg.N / 1e3, 1)} kN, imperfekcja w płaszczyźnie ${cs.imp === 'y' ? 'h' : 'b'}`);
    s += eq('e_{z}/h_{eq}', 'M_{Edy}/(N_{Ed}·h_{eq})', `${f(cs.My / 1e6, 2)}·10³/(${f(sg.N / 1e3, 1)}·${f(g.heq, 0)})`, f(cs.relH, 4), '') + eq('e_{y}/b_{eq}', 'M_{Edz}/(N_{Ed}·b_{eq})', `${f(cs.Mz / 1e6, 2)}·10³/(${f(sg.N / 1e3, 1)}·${f(g.beq, 0)})`, f(cs.relB, 4), '');
    s += line(`(e<sub>y</sub>/b<sub>eq</sub>)/(e<sub>z</sub>/h<sub>eq</sub>) = ${isFinite(cs.rr) ? f(cs.rr, 3) : '∞'} → ${cs.eccOk ? 'warunek 5.38b spełniony (≤ 0,2 lub ≥ 5)' : 'warunek 5.38b niespełniony'}`, '(5.38b)');
    if (!ob.biax.req) s += line('<span class="ok">✔ Warunki 5.38a i 5.38b spełnione we wszystkich kombinacjach – wystarczają sprawdzenia w każdej płaszczyźnie osobno.</span>', '5.8.9(3)');
    else {
      s += eq('N_{Rd}', 'A_{c}·f_{cd} + A_{s}·f_{yd}', '', f(cs.NRd / 1e3, 1), 'kN') + eq('N_{Ed}/N_{Rd}', '', '', f(cs.ratio, 3), '');
      s += eq('a', g.circ ? '2,0 (przekrój kołowy)' : 'interpolacja: 0,1 → 1,0; 0,7 → 1,5; 1,0 → 2,0', '', f(cs.a, 3), '');
      s += eq('M_{Rdy}', '', '', f(cs.MRdy / 1e6, 2), 'kNm') + eq('M_{Rdz}', '', '', f(cs.MRdz / 1e6, 2), 'kNm');
      s += eq('(M_{Edz}/M_{Rdz})^{a} + (M_{Edy}/M_{Rdy})^{a}', '', `(${f(cs.Mz / 1e6, 2)}/${f(cs.MRdz / 1e6, 2)})^{${f(cs.a, 2)}} + (${f(cs.My / 1e6, 2)}/${f(cs.MRdy / 1e6, 2)})^{${f(cs.a, 2)}}`, f(cs.v, 3), '', '(5.39)');
      s += cmp(cs.v, '≤', 1, '', 3);
    }
    const fibs = R.res.filter(q => q.biax.fib);
    if (fibs.length) {
      const w = fibs.reduce((a, q) => (q.biax.fib.u > a.biax.fib.u ? q : a)), fb = w.biax.fib;
      s += H3('Sprawdzenie dokładne – kontur nośności M_y–M_z (metoda włókien)');
      s += line(`Kombinacja ${esc(w.c.name)}, ${SECN[fb.key]}: N<sub>Ed</sub> = ${f(fb.N / 1e3, 1)} kN, M<sub>Ed,y</sub> = ${f(fb.My / 1e6, 2)} kNm, M<sub>Ed,z</sub> = ${f(fb.Mz / 1e6, 2)} kNm; |M<sub>Ed</sub>| = ${f(Math.hypot(fb.My, fb.Mz) / 1e6, 2)} kNm, nośność w tym kierunku M<sub>Rd</sub> = ${f(fb.MRd / 1e6, 2)} kNm → η = <b>${f(fb.u * 100, 0)}%</b> ${fb.u <= 1 ? '<span class="ok">✔</span>' : '<span class="fail">✖</span>'}`, '6.1');
      s += `<div class="fig">${D.contourSVG(R, fb.N, [{ x: fb.Mz / 1e6, y: fb.My / 1e6, c: D.C.red, r: 4.5, gov: true }], { W: 420, H: 400 })}</div>`;
    }
    o += sec('biax', s);
  }
  // ---- ścinanie
  ['y', 'z'].forEach(d => {
    const q = R.sh[d]; if (!q) return;
    let s = H2(`Ścinanie w płaszczyźnie ${PLN(d)} (6.2)`);
    s += line(`Kombinacja ${esc(q.gov.c.name)}`);
    s += eq('V_{Ed}', S.sec2.V2 ? 'max|V_{0}| + π·M_{2}/l_{0}' : 'max|V_{0}|', `${f(q.V0 / 1e3, 2)} + ${f(q.V2 / 1e3, 2)}`, f(q.VEd / 1e3, 2), 'kN');
    s += eq('b_{w}', '', '', f(q.bw, 0), 'mm') + eq('d', g.circ ? 'r + 2r_{s}/π' : '', '', f(q.d, 0), 'mm') + eq('z', '0,9·d', '', f(q.z, 0), 'mm');
    s += eq('k', '1 + √(200/d) ≤ 2,0', '', f(q.k, 3), '') + eq('ρ_{l}', 'A_{sl}/(b_{w}·d) ≤ 0,02', `${f(q.Asl, 0)}/(${f(q.bw, 0)}·${f(q.d, 0)})`, f(q.rhoL, 4), '');
    s += eq('σ_{cp}', 'N_{Ed,min}/A_{c} ≤ 0,2·f_{cd}', `${f(q.Nmin / 1e3, 1)}·10³/${f(g.Ac, 0)}`, f(q.scp, 2), 'MPa');
    s += eq('V_{Rd,c}', '[C_{Rd,c}·k·(100ρ_{l}f_{ck})^{1/3} + k_{1}σ_{cp}]·b_{w}·d ≥ (v_{min} + k_{1}σ_{cp})·b_{w}·d', `max(${f(q.VRdc1 / 1e3, 1)}; ${f(q.VRdc2 / 1e3, 1)})`, f(q.VRdc / 1e3, 1), 'kN', '(6.2)');
    if (!q.needs) s += cmp(q.VEd / 1e3, '≤', q.VRdc / 1e3, 'kN', 1, 'zbrojenie na ścinanie obliczeniowo zbędne – strzemiona wg 9.5.3');
    else {
      s += eq('A_{sw}', `${q.legs}·π·⌀_{t}²/4`, '', f(q.Asw, 1), 'mm²') + eq('cot θ', '', '', f(q.cot, 2), '');
      s += eq('V_{Rd,s}', 'A_{sw}/s·z·f_{ywd}·cot θ', `${f(q.Asw, 1)}/${q.s}·${f(q.z, 0)}·${f(m.fywd, 1)}·${f(q.cot, 2)}`, f(q.VRds / 1e3, 1), 'kN', '(6.8)');
      s += cmp(q.VEd / 1e3, '≤', q.VRds / 1e3, 'kN', 1);
    }
    s += eq('α_{cw}', '(σ_{cp}/f_{cd})', '', f(q.acw, 3), '', '(6.11aN)') + eq('V_{Rd,max}', 'α_{cw}·b_{w}·z·ν_{1}·f_{cd}/(cot θ + tan θ)', `${f(q.acw, 3)}·${f(q.bw, 0)}·${f(q.z, 0)}·${f(m.nu1, 3)}·${f(m.fcd, 2)}/(${f(q.cot, 2)} + ${f(1 / q.cot, 2)})`, f(q.VRdmax / 1e3, 1), 'kN', '(6.9)');
    s += cmp(q.VEd / 1e3, '≤', q.VRdmax / 1e3, 'kN', 1);
    o += sec('shear' + d, s);
  });
  // ---- SGU
  if (R.sls) {
    const L = R.sls; let s = H2('Stan graniczny użytkowalności');
    s += line(`Przekrój zarysowany (beton nie przenosi rozciągania), zginanie ukośne z siłą podłużną; E<sub>cm</sub> = ${f(m.Ecm / 1000, 0)} GPa, E<sub>c,eff</sub> = E<sub>cm</sub>/(1 + φ) = ${f(L.Eeff / 1000, 2)} GPa.`, '7.1');
    if (L.K && L.K.wc) s += line(`Kombinacja charakterystyczna (${esc(L.K.wc.c.name)}, ${['podstawa', '', 'środek'][0] && (L.K.wc.i === 0 ? 'podstawa' : L.K.wc.i === 40 ? 'głowica' : 'środek')}): N = ${f(L.K.wc.N / 1e3, 1)} kN, M<sub>y</sub> = ${f(L.K.wc.My / 1e6, 2)}, M<sub>z</sub> = ${f(L.K.wc.Mz / 1e6, 2)} kNm → σ<sub>c</sub> = <b>${f(L.sck, 2)} MPa</b> ${L.needSck ? '' : '(sprawdzenie wymagane w klasach XD, XF, XS)'}`, '7.2(2)');
    s += cmp(L.sck, '≤', L.lim.sck, `MPa = k₁·f<sub>ck</sub>`, 2);
    if (L.Q && L.Q.wc) s += line(`Kombinacja quasi-stała (${esc(L.Q.wc.c.name)}): σ<sub>c,qp</sub> = <b>${f(L.scqp, 2)} MPa</b>`, '7.2(3)');
    s += cmp(L.scqp, '≤', L.lim.scqp, 'MPa = k₂·f<sub>ck</sub> (pełzanie liniowe)', 2);
    s += line(`Naprężenia rozciągające w stali (kombinacja charakterystyczna): σ<sub>s</sub> = <b>${f(L.ssk, 1)} MPa</b>`, '7.2(5)') + cmp(L.ssk, '≤', L.lim.ssk, 'MPa = k₃·f<sub>yk</sub>', 1);
    if (L.wk) {
      const w = L.wk;
      s += H3('Szerokość rys (7.3.4)');
      s += line(`Kombinacja quasi-stała ${esc(w.cname)}, płaszczyzna ${PLN(w.dir)}: N = ${f(w.N / 1e3, 1)} kN, M = ${f(w.M / 1e6, 2)} kNm; x = ${f(w.x, 0)} mm, σ<sub>s</sub> = ${f(w.ss, 1)} MPa`);
      s += eq('h_{c,ef}', 'min(2,5(h − d); (h − x)/3; h/2)', '', f(w.ht, 0), 'mm') + eq('ρ_{p,eff}', 'A_{s}/A_{c,eff}', `${f(w.AsT, 0)}/${f(w.Aceff, 0)}`, f(w.rho, 4), '', '(7.10)');
      s += eq('ε_{sm} − ε_{cm}', '[σ_{s} − k_{t}·f_{ct,eff}/ρ_{p,eff}·(1 + α_{e}ρ_{p,eff})]/E_{s} ≥ 0,6σ_{s}/E_{s}', '', f(w.de * 1000, 3), '‰', '(7.9)');
      s += w.srNote === '7.11' ? eq('s_{r,max}', 'k_{3}·c + k_{1}k_{2}k_{4}·⌀/ρ_{p,eff}', `3,4·${f(w.c, 0)} + 0,8·0,5·0,425·${w.phiB}/${f(w.rho, 4)}`, f(w.sr, 0), 'mm', '(7.11)') : eq('s_{r,max}', '1,3·(h − x)', '', f(w.sr, 0), 'mm', '(7.14)');
      s += eq('w_{k}', 's_{r,max}·(ε_{sm} − ε_{cm})', '', f(w.wk, 3), 'mm', '(7.8)') + cmp(w.wk, '≤', w.wmax, 'mm = w<sub>max</sub> (tab. 7.1N)', 3);
    } else s += line('W kombinacji quasi-stałej pręty nie są rozciągane – rysy nie powstają (sprawdzenie szerokości rys zbędne).', '7.3');
    o += sec('sls', s);
  }
  // ---- konstrukcja
  if (lay.n) {
    const T = R.ties;
    let s = H2('Wymagania konstrukcyjne (rozdz. 9.5, 8.2)');
    s += eq('A_{s,min}', 'max(0,10·N_{Ed}/f_{yd}; 0,002·A_{c})', `max(0,10·${f(R.NEdMax, 0)}/${f(m.fyd, 1)}; 0,002·${f(g.Ac, 0)})`, f(R.AsMin, 0), 'mm²', '(9.12N)') + cmp(lay.As, '≥', R.AsMin, 'mm²', 0);
    s += eq('A_{s,max}', '0,04·A_{c}', '', f(0.04 * g.Ac, 0), 'mm²', '9.5.2(3)') + cmp(lay.As, '≤', 0.04 * g.Ac, 'mm²', 0) + line(`w strefie zakładu: ${S.det.lap === '100' ? '2' : '1,5'}·A<sub>s</sub> = ${f((S.det.lap === '100' ? 2 : 1.5) * lay.As, 0)} mm² ≤ 0,08·A<sub>c</sub> = ${f(0.08 * g.Ac, 0)} mm² ${(S.det.lap === '100' ? 2 : 1.5) * lay.As <= 0.08 * g.Ac ? '<span class="ok">✔</span>' : '<span class="fail">✖</span>'}`);
    s += line(`Średnica prętów podłużnych ⌀ = ${lay.dmin}${lay.dmax !== lay.dmin ? '/' + lay.dmax : ''} mm ≥ ⌀<sub>min</sub> = ${S.coef.phiMin} mm ${lay.dmin >= S.coef.phiMin ? '<span class="ok">✔</span>' : '<span class="fail">✖</span>'}`, '9.5.2(1)');
    s += line(g.circ ? `Liczba prętów ${lay.n} ≥ 4 ${lay.n >= 4 ? '<span class="ok">✔</span>' : '<span class="fail">✖</span>'}` : 'Pręt w każdym narożu przekroju <span class="ok">✔</span>', '9.5.2(4)');
    const clr = g.circ ? lay.faces.c.clear : Math.min(lay.faces.b.clear, lay.faces.h.clear);
    s += eq('s_{min}', 'max(k_{1}·⌀; d_{g} + k_{2}; 20 mm)', `max(${lay.dmax}; ${S.mat.dg} + 5; 20)`, f(lay.smin, 0), 'mm', '8.2(2)') + cmp(clr, '≥', lay.smin, 'mm (najmniejszy odstęp w świetle)', 0);
    o += sec('det', s);
    let t = H2('Strzemiona (9.5.3)');
    t += eq('⌀_{t}', '≥ max(6 mm; ⌀_{max}/4)', `max(6; ${lay.dmax}/4)`, f(T.dtReq, 1), 'mm', '9.5.3(1)') + cmp(lay.dt, '≥', T.dtReq, 'mm (przyjęto ⌀' + lay.dt + ')', 1);
    t += eq('s_{cl,tmax}', 'min(20·⌀_{min}; b_{min}; 400 mm)', `min(20·${lay.dmin}; ${g.dmin}; 400)`, f(T.scl, 0), 'mm', '9.5.3(3)') + cmp(T.s, '≤', T.scl, 'mm (przyjęto s = ' + T.s + ' mm)', 0);
    t += eq('0,6·s_{cl,tmax}', '', '', f(T.sclRed, 0), 'mm', '9.5.3(4)') + cmp(T.sRed, '≤', T.sclRed, 'mm – strefy przy stropach (długość ' + f(T.zB0, 0) + ' mm) i zakładu', 0);
    if (!g.circ) { const far = Math.max(lay.faces.b.far, lay.faces.h.far); t += line(`Największa odległość w świetle pręta od pręta utrzymanego strzemieniem lub szpilką: ${f(far, 0)} mm ≤ 150 mm ${far <= 150 ? '<span class="ok">✔</span>' : '<span class="fail">✖</span>'}; szpilek w przekroju: ${lay.pins.length}`, '9.5.3(6)'); }
    if (isFinite(T.sShear)) t += line(`Rozstaw wymagany ze ścinania s ≤ ${f(T.sShear, 0)} mm`, '6.2.3');
    t += line(`Rozmieszczenie: strefa dolna ${f(T.zBot, 0)} mm co ${T.sRed} mm${T.lapZone ? ` (obejmuje zakład l₀ + 4⌀ = ${f(T.lapZone, 0)} mm, ⌀ > 14 mm)` : ''}, część środkowa ${f(T.zMid, 0)} mm co ${T.s} mm, strefa górna ${f(T.zTop, 0)} mm co ${T.sRed} mm; razem ${T.sets} strzemion.`);
    o += sec('ties', t);
    const A = R.anch;
    let a = H2('Zakłady i zakotwienia prętów (8.4, 8.7)');
    a += line(`Warunki przyczepności dobre (pręty pionowe): η₁ = ${f(A.eta1, 1)}, η₂ = ${f(A.eta2, 2)}`, '8.4.2(2)');
    a += eq('f_{bd}', '2,25·η_{1}·η_{2}·f_{ctd}', `2,25·${f(A.eta1, 1)}·${f(A.eta2, 2)}·${f(m.fctdBond, 2)}`, f(A.fbd, 2), 'MPa', '(8.2)');
    a += eq('l_{b,rqd}', '(⌀/4)·(σ_{sd}/f_{bd})', `(${A.dia}/4)·(${f(A.sigma, 1)}/${f(A.fbd, 2)})`, f(A.lbrqd, 0), 'mm', '(8.3)');
    a += line(`Pręty ${A.tension ? 'rozciągane (w kombinacjach SGN występuje rozciąganie krawędzi przekroju)' : 'ściskane we wszystkich kombinacjach SGN'}; α₁ = α₂ = α₃ = α₅ = 1,0; α₆ = ${f(A.a6, 1)} (${S.det.lap === '100' ? 'wszystkie pręty łączone w jednym przekroju' : '50% prętów'})`, 'tab. 8.2, 8.3');
    a += eq('l_{0,min}', 'max(0,3·α_{6}·l_{b,rqd}; 15⌀; 200 mm)', '', f(A.l0minC, 0), 'mm', '(8.11)') + eq('l_{0}', 'α_{6}·l_{b,rqd} ≥ l_{0,min}', `${f(A.a6, 1)}·${f(A.lbrqd, 0)}`, f(A.l0, 0), 'mm', '(8.10)');
    a += eq('l_{bd}', A.tension ? 'max(α_{1}·l_{b,rqd}; l_{b,min}) (rozciąganie)' : 'max(l_{b,rqd}; l_{b,min}) (ściskanie)', `l_{b,min} = ${f(A.tension ? A.lbminT : A.lbminC, 0)} mm`, f(A.lbd, 0), 'mm', '(8.4)');
    if (S.det.base === 'found') { const av = S.det.hF - S.det.cF - 20; a += line(`Zakotwienie prętów startowych w fundamencie: h<sub>F</sub> − c − 20 = ${f(av, 0)} mm ${av >= A.lbd ? '≥' : '<'} l<sub>bd</sub> = ${f(A.lbd, 0)} mm ${av >= A.lbd ? '<span class="ok">✔</span>' : '<span class="warn">⚠ zwiększ wysokość fundamentu lub zastosuj odgięcia (przy rozciąganiu) / mniejsze średnice</span>'}`, '8.4.4'); }
    if (S.det.top === 'anch') a += line(`Góra słupa: pręty zakotwione w stropie (h = ${S.det.hTop} mm) z odgięciem 90° – długość odgięcia ${f(R.sched.rows[0].leg, 0)} mm.`);
    o += sec('anch', a);
  }
  // ---- pożar
  if (R.fire) {
    const F = R.fire; let s = H2(`Odporność ogniowa ${F.R} (PN-EN 1992-1-2, metoda A)`);
    s += eq('N_{Ed,fi}', 'η_{fi}·N_{Ed}', `${f(F.eta, 2)}·${f(R.NEdMax / 1e3, 1)}`, f(F.NEdFi / 1e3, 1), 'kN', '2.4.2(3)');
    s += eq('μ_{fi}', S.fire.muSel === 'manual' ? '(podany)' : 'N_{Ed,fi}/N_{Rd} ≈ η_{fi}·η_{N}', S.fire.muSel === 'manual' ? '' : `${f(F.eta, 2)}·${f(F.uAx, 3)}`, f(F.mu, 3), '', '5.3.2(3)');
    s += line(`Odległość osi prętów od krawędzi: a = c<sub>nom</sub> + ⌀<sub>t</sub> + ⌀/2 = <b>${f(F.a, 0)} mm</b>; wymiar b = ${f(F.b, 0)} mm`);
    s += line(`Warunki stosowania: l<sub>0,fi</sub> = ${f(F.l0fi / 1000, 2)} m ${F.condL ? '≤' : '&gt;'} 3 m; e = ${f(F.e, 0)} mm ${F.condE ? '≤' : '&gt;'} e<sub>max</sub> = ${f(F.emax, 0)} mm; A<sub>s</sub>/A<sub>c</sub> = ${f(F.rho * 100, 2)}% ${F.condA ? '&lt;' : '≥'} 4%`, '5.3.2(2)');
    if (F.side === 'one') s += line(`Tablica 5.2a (ekspozycja jednostronna): b<sub>min</sub> = ${F.bmin} mm, a<sub>min</sub> = ${F.amin} mm → ${F.tabOk ? '<span class="ok">✔ spełnione</span>' : '<span class="fail">✖ niespełnione</span>'}`, 'tab. 5.2a');
    else s += line(`Tablica 5.2a (interpolacja μ<sub>fi</sub>): ${F.aReq === null ? 'wymiar b mniejszy od minimalnego' : `a<sub>min</sub> = ${f(F.aReq, 1)} mm${F.need8 ? ', co najmniej 8 prętów' : ''}`} → ${F.tabOk ? '<span class="ok">✔ spełnione</span>' : '<span class="fail">✖ niespełnione</span>'}`, 'tab. 5.2a');
    s += eq('R_{ηfi}', '83·[1 − μ_{fi}·(1 + ω)/((0,85/α_{cc}) + ω)]', `ω = ${f(F.omega, 3)}`, f(F.Reta, 2), '') + eq('R_{a}', '1,60·(a − 30)', '', f(F.Ra, 2), '') + eq('R_{l}', '9,60·(5 − l_{0,fi})', '', f(F.Rl, 2), '') + eq('R_{b}', '0,09·b′', `b′ = ${f(F.bp, 0)} mm`, f(F.Rb, 2), '') + eq('R_{n}', '', `n = ${lay.n}`, f(F.Rn, 0), '');
    s += eq('R', '120·((R_{ηfi} + R_{a} + R_{l} + R_{b} + R_{n})/120)^{1,8}', '', f(F.Rcalc, 0), 'min', '(5.7)') + cmp(F.Rcalc, '≥', F.Rreq, 'min', 0) + (F.formValid ? '' : note('Wzór (5.7) poza zakresem stosowania (25 ≤ a ≤ 80 mm, 200 ≤ b′ ≤ 450 mm, l₀,fi ≤ 6 m, h ≤ 1,5b) – wynik informacyjny.'));
    s += line(`<b>Wniosek: ${F.ok ? '<span class="ok">odporność ogniowa ' + F.R + ' zapewniona</span>' : '<span class="fail">odporność ogniowa ' + F.R + ' niezapewniona – zwiększ otulinę (a) lub wymiary przekroju</span>'}</b>`);
    o += sec('fire', s);
  }
  // ---- zestawienie stali
  if (R.sched) {
    let s = H2('Zbrojenie słupa i zestawienie stali');
    s += `<div class="fig">${D.elevationSVG(R, S, { W: 560, H: 700 })}${D.sectionSVG(R, { W: 320, H: 320 })}</div>`;
    R.sched.rows.forEach(r => { s += line(`Poz. ${r.pos} – ${esc(r.name)}: ${r.n} × ⌀${r.d}, l = ${f(r.len, 0)} mm, razem ${f(r.tot, 2)} m, ${f(r.kg, 1)} kg`); });
    R.sched.byD.forEach(q => { s += line(`${esc(q.steel === 'W' ? m.sw.id : m.st.id)} ⌀${q.d}: ${f(q.m, 2)} m × ${f(window.EC2.massPerM(q.d), 3)} kg/m = ${f(q.kg, 1)} kg`); });
    s += line(`<b>Masa stali razem: ${f(R.sched.tot, 1)} kg</b> (bez naddatków)`);
    o += sec('sched', s);
  }
  // ---- zestawienie sprawdzeń
  o += H2('Zestawienie sprawdzeń');
  const st = c => `<span class="${c.status}">${c.status === 'ok' ? '✔' : c.status === 'warn' ? '⚠' : c.status === 'fail' ? '✖' : 'ℹ'}</span>`;
  let grp = '';
  R.checks.forEach(c => { if (c.grp !== grp) { grp = c.grp; o += `<h3>${esc(grp)}</h3>`; } o += line(`${h.sym(c.name)}: ${U.ckCond(c)}${c.status !== 'info' && isFinite(c.ratio) && c.fmt !== 'text' ? `, η = ${f(c.ratio * 100, 0)}%` : ''} ${st(c)}`, c.ref); });
  const nF = R.checks.filter(c => c.status === 'fail').length;
  o += `<p class="verdict"><span class="${nF ? 'fail' : 'ok'}">${nF ? `✖ Niespełnione warunki: ${nF}.` : `✔ Wszystkie warunki nośności, użytkowalności i wymagania konstrukcyjne są spełnione. Maksymalne wykorzystanie η = ${f((R.maxUtil || 0) * 100, 0)}%.`}</span></p>`;
  return o;
};
// raport skrócony: dane, obciążenia, kombinacje
SZR.buildStatic = function (R, S) {
  const h = helpers(); const { esc, f, H2, line } = h, E = window.EC2;
  let o = `<h1>${esc(S.meta.name || 'Słup')} – dane, obciążenia i kombinacje</h1>` + partData(R, S, h, false);
  if (R.res && R.res.length) {
    o += H2('Kombinacje SGN – siły I rzędu i obliczeniowe');
    R.res.forEach((q, i) => { o += line(`${i + 1}. <b>${esc(q.c.name)}</b>: ${esc(E.comboDesc(q.c, R.items))}; N<sub>Ed</sub> = ${f(q.fr.Ntop / 1e3, 1)} / ${f(q.fr.Nbot / 1e3, 1)} kN; M<sub>Ed,y</sub> = ${f(q.y.MEd / 1e6, 2)} kNm, M<sub>Ed,z</sub> = ${f(q.z.MEd / 1e6, 2)} kNm (z imperfekcją i II rzędem); η = ${isFinite(q.u) ? f(q.u * 100, 0) + '%' : '∞'}`); });
  }
  return o;
};
})();

/* eksport .odt (OpenDocument) – jak w BelkaŻB */
(function () {
'use strict';
const SZR = window.SZR;
SZR.odt = async function (html, title) {
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-10000px;top:0;width:1000px;'; host.innerHTML = html; document.body.appendChild(host);
  const pics = [];
  const svgPng = async svg => {
    const vb = svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width ? svg.viewBox.baseVal : null;
    const w = vb ? vb.width : (+svg.getAttribute('width') || svg.getBoundingClientRect().width || 800), h = vb ? vb.height : (+svg.getAttribute('height') || svg.getBoundingClientRect().height || 400);
    const cl = svg.cloneNode(true); cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); cl.setAttribute('width', w); cl.setAttribute('height', h);
    cl.querySelectorAll('[style*="var("]').forEach(el => el.removeAttribute('style'));
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(cl).replace(/var\(--[^,)]+,\s*([^)]+)\)/g, '$1').replace(/var\(--[^)]+\)/g, '#1b2230'));
    const img = new Image(); await new Promise(res => { img.onload = res; img.onerror = res; img.src = src; });
    const k = 2, cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
    const cx = cv.getContext('2d'); cx.fillStyle = '#ffffff'; cx.fillRect(0, 0, cv.width, cv.height); try { cx.drawImage(img, 0, 0, cv.width, cv.height); } catch (e) { /* */ }
    const b64 = cv.toDataURL('image/png').split(',')[1], bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const name = `Pictures/r${pics.length + 1}.png`; pics.push({ name, data: u });
    const wcm = Math.min(17, w / 96 * 2.54 * 0.85), hcm = wcm * h / w;
    return `<draw:frame draw:name="r${pics.length}" text:anchor-type="as-char" svg:width="${wcm.toFixed(2)}cm" svg:height="${hcm.toFixed(2)}cm"><draw:image xlink:href="${name}" xlink:type="simple" xlink:show="embed" xlink:actuate="onLoad"/></draw:frame>`;
  };
  const inline = async el => {
    let o = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { o += esc(n.nodeValue.replace(/\s+/g, ' ')); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName.toLowerCase();
      if (t === 'svg') { o += await svgPng(n); continue; }
      if (t === 'br') { o += '<text:line-break/>'; continue; }
      if (t === 'sub') { o += `<text:span text:style-name="Tsub">${await inline(n)}</text:span>`; continue; }
      if (t === 'sup') { o += `<text:span text:style-name="Tsup">${await inline(n)}</text:span>`; continue; }
      if (t === 'b' || t === 'strong' || t === 'th') { o += `<text:span text:style-name="Tb">${await inline(n)}</text:span>`; continue; }
      if (n.classList && (n.classList.contains('ok') || n.classList.contains('fail') || n.classList.contains('warn'))) { o += `<text:span text:style-name="${n.classList.contains('ok') ? 'Tok' : n.classList.contains('fail') ? 'Tfail' : 'Twarn'}">${await inline(n)}</text:span>`; continue; }
      if (n.classList && n.classList.contains('r')) { o += `<text:tab/>${await inline(n)}`; continue; }
      o += await inline(n);
    }
    return o;
  };
  let body = `<text:p text:style-name="Title">${esc(title || 'Raport obliczeń')}</text:p>`;
  const block = async el => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { if (n.nodeValue.trim()) body += `<text:p text:style-name="Body">${esc(n.nodeValue.trim())}</text:p>`; continue; }      // tekst wpisany wprost (raport własny)
      if (n.nodeType !== 1) continue;
      const t = n.tagName.toLowerCase();
      if (t === 'br') continue;
      if (/^h[1-4]$/.test(t)) { body += `<text:h text:style-name="H${t[1]}" text:outline-level="${+t[1] > 1 ? +t[1] - 1 : 1}">${await inline(n)}</text:h>`; continue; }
      if (t === 'table') {
        if (n.classList.contains('pwrap')) { const tb = n.querySelector('td.pbody'); if (tb) await block(tb); continue; }
        const rows = [...n.querySelectorAll('tr')]; if (!rows.length) continue; const nc = Math.max(...rows.map(r => [...r.children].reduce((a, c) => a + (+c.getAttribute('colspan') || 1), 0)));
        body += `<table:table table:style-name="Tab"><table:table-column table:number-columns-repeated="${nc}"/>`;
        for (const r of rows) { body += '<table:table-row>'; for (const c of r.children) { const cs = +c.getAttribute('colspan') || 1; body += `<table:table-cell table:style-name="Cell" office:value-type="string"${cs > 1 ? ` table:number-columns-spanned="${cs}"` : ''}><text:p text:style-name="${c.tagName === 'TH' ? 'Th' : 'Td'}">${await inline(c)}</text:p></table:table-cell>`; for (let k = 1; k < cs; k++) body += '<table:covered-table-cell/>'; } body += '</table:table-row>'; }
        body += '</table:table>'; continue;
      }
      if (t === 'div' && (n.classList.contains('fig') || n.classList.contains('tscroll'))) { if (n.querySelector('table') && !n.querySelector('svg')) { await block(n); continue; } body += `<text:p text:style-name="Fig">${await inline(n)}</text:p>`; continue; }
      if (t === 'ul' || t === 'ol') { for (const li of n.children) body += `<text:p text:style-name="Li">• ${await inline(li)}</text:p>`; continue; }
      if (t === 'div' && n.children.length && [...n.children].some(c => /^(h[1-4]|table|div|p|ul|ol)$/i.test(c.tagName)) && !n.classList.contains('eq')) { await block(n); continue; }
      const st = n.classList.contains('eq') ? 'Eq' : n.classList.contains('note') ? 'Note' : n.classList.contains('verdict') ? 'Verdict' : 'Body';
      const tx = await inline(n); if (tx.trim()) body += `<text:p text:style-name="${st}">${tx}</text:p>`;
    }
  };
  try { await block(host); } finally { host.remove(); }
  const NS = 'xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.2"';
  const ps = (n, o) => `<style:style style:name="${n}" style:family="paragraph"${o.parent ? ` style:parent-style-name="${o.parent}"` : ''}><style:paragraph-properties fo:margin-top="${o.mt || '0cm'}" fo:margin-bottom="${o.mb || '0.1cm'}"${o.ml ? ` fo:margin-left="${o.ml}"` : ''}${o.tab ? '><style:tab-stops><style:tab-stop style:position="16.5cm" style:type="right"/></style:tab-stops></style:paragraph-properties>' : '/>'}<style:text-properties fo:font-size="${o.fs || '10pt'}"${o.b ? ' fo:font-weight="bold"' : ''}${o.c ? ` fo:color="${o.c}"` : ''}${o.it ? ' fo:font-style="italic"' : ''}/></style:style>`;
  const styles = `<?xml version="1.0" encoding="UTF-8"?><office:document-styles ${NS}><office:styles><style:default-style style:family="paragraph"><style:text-properties style:font-name="Calibri" fo:font-family="Calibri, Arial, sans-serif" fo:font-size="10pt" fo:language="pl" fo:country="PL"/></style:default-style></office:styles><office:automatic-styles><style:page-layout style:name="PL"><style:page-layout-properties fo:page-width="21cm" fo:page-height="29.7cm" fo:margin-top="1.8cm" fo:margin-bottom="1.8cm" fo:margin-left="2cm" fo:margin-right="1.8cm"/></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Standard" style:page-layout-name="PL"/></office:master-styles></office:document-styles>`;
  const content = `<?xml version="1.0" encoding="UTF-8"?><office:document-content ${NS}><office:automatic-styles>` +
    ps('Title', { fs: '16pt', b: true, mb: '0.3cm' }) + ps('H1', { fs: '13pt', b: true, mt: '0.4cm', mb: '0.15cm', c: '#1d3f78' }) + ps('H2', { fs: '13pt', b: true, mt: '0.4cm', mb: '0.15cm', c: '#1d3f78' }) + ps('H3', { fs: '11pt', b: true, mt: '0.25cm', mb: '0.1cm' }) + ps('H4', { fs: '10pt', b: true, mt: '0.2cm' }) +
    ps('Body', {}) + ps('Eq', { ml: '0.4cm', tab: true }) + ps('Note', { fs: '9pt', it: true, c: '#4a5466' }) + ps('Verdict', { fs: '11pt', b: true, mt: '0.3cm' }) + ps('Li', { ml: '0.4cm' }) + ps('Fig', { mt: '0.2cm', mb: '0.2cm' }) + ps('Td', { fs: '9pt', mb: '0cm' }) + ps('Th', { fs: '9pt', b: true, mb: '0cm' }) +
    `<style:style style:name="Tsub" style:family="text"><style:text-properties style:text-position="sub 58%"/></style:style><style:style style:name="Tsup" style:family="text"><style:text-properties style:text-position="super 58%"/></style:style><style:style style:name="Tb" style:family="text"><style:text-properties fo:font-weight="bold"/></style:style>` +
    `<style:style style:name="Tok" style:family="text"><style:text-properties fo:color="#1d7f3c" fo:font-weight="bold"/></style:style><style:style style:name="Tfail" style:family="text"><style:text-properties fo:color="#c0262d" fo:font-weight="bold"/></style:style><style:style style:name="Twarn" style:family="text"><style:text-properties fo:color="#a35d00" fo:font-weight="bold"/></style:style>` +
    `<style:style style:name="Tab" style:family="table"><style:table-properties style:width="17cm" table:align="left" fo:margin-top="0.15cm" fo:margin-bottom="0.15cm"/></style:style><style:style style:name="Cell" style:family="table-cell"><style:table-cell-properties fo:padding="0.05cm" fo:border="0.5pt solid #9aa3b0"/></style:style>` +
    `</office:automatic-styles><office:body><office:text>${body}</office:text></office:body></office:document-content>`;
  const manifest = `<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.2"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text" manifest:version="1.2"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>${pics.map(p => `<manifest:file-entry manifest:full-path="${p.name}" manifest:media-type="image/png"/>`).join('')}</manifest:manifest>`;
  const enc = new TextEncoder();
  return SZR.zip([{ name: 'mimetype', data: enc.encode('application/vnd.oasis.opendocument.text') }, { name: 'META-INF/manifest.xml', data: enc.encode(manifest) }, { name: 'styles.xml', data: enc.encode(styles) }, { name: 'content.xml', data: enc.encode(content) }, ...pics]);
};
// ZIP (metoda „stored”, CRC-32) – wystarcza dla OpenDocument
// raport bez odwołań do punktów, tablic, rysunków i załączników normy oraz numerów wzorów – zostają numery wzorów kombinacji (PN-EN 1990: 6.10, 6.10a/b, 6.11, 6.14–6.16)
SZR.noRefs = function (html) {
  const COMBO = /^\(?6\.1[0-6][ab]?(?:\s*\/\s*6\.1[0-6][ab]?(?:,b)?)*\)?:?$/;
  const KW = '(?:tab\\.|tabl\\.|tablica|tablicy|rys\\.|zał\\.|załącznik|wz[óo]r)';
  const ATOM = `(?:${KW}\\s*(?:[A-Z]\\.?)?(?:\\d+(?:\\.\\d+)*)?[A-Za-z]?|(?:[A-Z]\\.)?[1-9]\\d?\\.\\d{1,2}(?:\\.\\d{1,2})*[a-zN]?(?:\\(\\d+\\))*)`;
  const PART = new RegExp(`^(?:wg\\s+|por\\.\\s+|patrz\\s+)?(?:(?:PN-)?EN\\s[\\d-]+,?\\s*)?${ATOM}(?:\\s*(?:,|i|oraz)\\s*${ATOM})*$`);
  const isRef = t => { t = t.trim(); if (!t || COMBO.test(t)) return false; return PART.test(t); };
  const clean = s => {
    if (!/\d\.\d|tab\.|tabl|rys\.|zał\.|wz[óo]r/.test(s)) return s;
    let o = s;
    // nawiasy (także z jednym poziomem zagnieżdżenia): części będące odwołaniami usuwane, nawias pusty – cały
    o = o.replace(/\s?\(((?:[^()]|\([^()]*\))*)\)/g, (m, inner) => {
      const parts = inner.split(/\s*(?:,|;| \/ | – )\s*/); const keep = parts.filter(q => !isRef(q));
      if (keep.length === parts.length) return m;
      if (!keep.length || keep.every(q => !q.trim())) return '';
      return `${m[0] === ' ' ? ' ' : ''}(${keep.join(', ')})`;
    });
    // odwołania poza nawiasami: „tab. 4.4N”, „zał. E”, punkty z podpunktem / numerem ustępu (np. 8.2(4), 9.2.1.1(1), 4.4.1)
    o = o.replace(new RegExp(`(,\\s*)?\\b${KW}\\s*(?:[A-Z]\\.?)?(?:\\d+(?:\\.\\d+)*)?[A-Za-z]?(?=[\\s,.;:)]|$)`, 'g'), '');
    o = o.replace(/(^|[^=\d.,\s]\s|[(\[,;]\s?)((?:wg\s+)?(?:[1-9]\d?\.\d{1,2}(?:\.\d{1,2})+|[1-9]\d?\.\d{1,2})(?:\(\d+\))+|[1-9]\d?\.\d{1,2}(?:\.\d{1,2}){2,})(?=[\s,.;:)\]]|$)/g, (m, pre, ref) => COMBO.test(ref) ? m : pre.replace(/[,;]\s?$/, ''));
    o = o.replace(/=\s*,\s*/g, '= ').replace(/\(\s*,\s*/g, '(').replace(/,\s*\)/g, ')').replace(/\(\s*\)/g, '').replace(/ {2,}/g, ' ').replace(/ ([,.;:])/g, '$1');
    return o;
  };
  const t = document.createElement('template'); t.innerHTML = html;
  t.content.querySelectorAll('span.r').forEach(sp => { const tx = sp.textContent.replace(/^\s*\[|\]\s*$/g, '').trim(); if (!COMBO.test(tx)) sp.remove(); });
  const w = document.createTreeWalker(t.content, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentNode && /^(style|script)$/i.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  nodes.forEach(n => { const v = clean(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; });
  return t.innerHTML;
};
SZR.zip = function (files) {
  const T = SZR._crcT || (SZR._crcT = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })());
  const crc = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = T[(c ^ u[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const d = new Date(), dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  files.forEach(f => {
    const nm = enc.encode(f.name), c = crc(f.data), sz = f.data.length;
    const lh = new DataView(new ArrayBuffer(30)); lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true); lh.setUint16(10, tm, true); lh.setUint16(12, dt, true); lh.setUint32(14, c, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true); lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), nm, f.data);
    const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, tm, true); ch.setUint16(14, dt, true); ch.setUint32(16, c, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true); ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
    cen.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + sz;
  });
  const cs = cen.reduce((a, u) => a + u.length, 0), ed = new DataView(new ArrayBuffer(22)); ed.setUint32(0, 0x06054b50, true); ed.setUint16(8, files.length, true); ed.setUint16(10, files.length, true); ed.setUint32(12, cs, true); ed.setUint32(16, off, true);
  const all = [...parts, ...cen, new Uint8Array(ed.buffer)], n = all.reduce((a, u) => a + u.length, 0), out = new Uint8Array(n); let p = 0; all.forEach(u => { out.set(u, p); p += u.length; });
  return out;
};
})();
