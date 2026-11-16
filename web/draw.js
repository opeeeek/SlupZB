/* SłupŻB – rysunki SVG: przekrój, schemat słupa, krzywe interakcji, wykresy na wysokości, rysunek zbrojenia */
(function () {
'use strict';
const D = window.SZD = {};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = (v, dp) => {
  if (dp === undefined) dp = 2;
  if (v === null || v === undefined || typeof v !== 'number' || !isFinite(v)) return '—';
  let s = (Math.abs(v) < 0.5 * Math.pow(10, -dp) ? 0 : v).toFixed(dp);
  const neg = s[0] === '-'; if (neg) s = s.slice(1);
  let [i, f] = s.split('.'); i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + i + (f !== undefined ? ',' + f : '');
};
// tekst z indeksami: M_Ed, N_{Ed,max}
const ss = s => esc(s).replace(/_\{([^}]*)\}|_([0-9A-Za-ząćęłńóśźżθφλ]+(?:,[0-9A-Za-ząćęłńóśźż]+)*)/g, (m, a, b) => `<tspan baseline-shift="sub" font-size="75%">${a || b}</tspan>`);
const svgOpen = (w, h, extra) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${extra || ''}>`;
const tx = (x, y, s, o) => { o = o || {}; return `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" font-size="${o.fs || 11}" fill="${o.c || '#1b2230'}" text-anchor="${o.a || 'middle'}" ${o.w ? `font-weight="${o.w}"` : ''} ${o.rot ? `transform="rotate(${o.rot} ${(+x).toFixed(1)} ${(+y).toFixed(1)})"` : ''} ${o.attr || ''}>${o.raw ? s : ss(s)}</text>`; };
function dimH(x1, x2, y, label, o) { o = o || {};
  return `<g stroke="#5d6778" stroke-width="0.8"><line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/><line x1="${x1}" y1="${y - 4}" x2="${x1}" y2="${y + 4}"/><line x1="${x2}" y1="${y - 4}" x2="${x2}" y2="${y + 4}"/>` +
    `<line x1="${x1 - 3}" y1="${y + 3}" x2="${x1 + 3}" y2="${y - 3}"/><line x1="${x2 - 3}" y1="${y + 3}" x2="${x2 + 3}" y2="${y - 3}"/></g>` + (label ? tx((x1 + x2) / 2, y + (o.below ? 13 : -4), label, { fs: o.fs || 10.5, c: o.c || '#3d4656', attr: o.attr }) : ''); }
function dimV(x, y1, y2, label, o) { o = o || {};
  return `<g stroke="#5d6778" stroke-width="0.8"><line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/><line x1="${x - 4}" y1="${y1}" x2="${x + 4}" y2="${y1}"/><line x1="${x - 4}" y1="${y2}" x2="${x + 4}" y2="${y2}"/>` +
    `<line x1="${x - 3}" y1="${y1 + 3}" x2="${x + 3}" y2="${y1 - 3}"/><line x1="${x - 3}" y1="${y2 + 3}" x2="${x + 3}" y2="${y2 - 3}"/></g>` + (label ? tx(x + (o.right ? 6 : -5), (y1 + y2) / 2 + (o.right ? 3.5 : 0), label, { fs: o.fs || 10.5, c: o.c || '#3d4656', a: o.right ? 'start' : 'middle', rot: o.right ? 0 : -90, attr: o.attr }) : ''); }
const niceTicks = (a, b, n) => {
  const span = b - a; if (!(span > 0)) return [a];
  const raw = span / Math.max(1, n), p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  const st = (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p, out = [];
  for (let v = Math.ceil(a / st) * st; v <= b + 1e-9 * st; v += st) out.push(+v.toFixed(10));
  return out;
};
Object.assign(D, { esc, fmt, ss, svgOpen, tx, dimH, dimV, niceTicks });

const C = { ink: '#1b2230', ink2: '#4a5466', dim: '#3d4656', conc: '#eceef1', concL: '#39414f', bar: '#1d2a3f', tie: '#9b1c22', acc: '#1d5bb8', red: '#c0262d', ok: '#1d7f3c', warn: '#a35d00', vio: '#6a3fb5', grid: '#eef0f3', grid2: '#f3f4f6', mut: '#7a8494', gnd: '#5d6778' };
D.C = C;

/* ------------------------------------------------------------ przekrój */
// o: {W, H, edit, marks, fail:{bars, ties, sp}, axes, small}
D.sectionSVG = function (R, o) {
  o = o || {};
  const g = R.g, lay = R.lay, cov = R.cov, S = R.S;
  const W = o.W || 360, H = o.H || 360, m = o.small ? 22 : 48;
  const k = Math.min((W - 2 * m) / g.b, (H - 2 * m - (o.small ? 0 : 14)) / g.h);
  const bw = g.b * k, bh = g.h * k, ox = (W - bw) / 2, oy = m + (o.small ? 0 : 6);
  const X = x => ox + x * k, Y = y => oy + y * k;
  const dt = lay.dt || 8, c = cov.cnom;
  let s = svgOpen(W, H, `class="secsvg${o.edit ? ' secedit' : ''}"`);
  const fail = o.fail || {};
  const tieCol = fail.ties ? C.red : C.tie, tw = Math.max(1.3, dt * k);
  const barsSVG = () => lay.bars.map(b => `<circle cx="${X(b.x)}" cy="${Y(b.y)}" r="${Math.max(2, b.d / 2 * k)}" fill="${fail.bars ? C.red : C.bar}" ${!b.rest && !g.round && !o.small ? `stroke="${C.warn}" stroke-width="1.2"` : ''}/>`).join('');
  if (g.ring) {
    const cx = X(g.D / 2), cy = Y(g.D / 2), r = g.D / 2 * k, ri = g.Di / 2 * k;
    s += `<path d="M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0 Z M${cx - ri},${cy} a${ri},${ri} 0 1,1 ${2 * ri},0 a${ri},${ri} 0 1,1 ${-2 * ri},0 Z" fill="${C.conc}" fill-rule="evenodd" stroke="${C.concL}" stroke-width="1.4" ${o.edit ? 'data-z="dims" class="zhit"' : ''}/>`;
    if (lay.n) {
      s += `<circle cx="${cx}" cy="${cy}" r="${lay.Rt * k}" fill="none" stroke="${tieCol}" stroke-width="${tw}" ${o.edit ? 'data-z="ties" class="zhit"' : ''}/>`;
      if (lay.Rti) s += `<circle cx="${cx}" cy="${cy}" r="${lay.Rti * k}" fill="none" stroke="${tieCol}" stroke-width="${tw}" ${o.edit ? 'data-z="ties" class="zhit"' : ''}/>`;
      s += barsSVG();
      if (o.edit && o.small) s += `<circle cx="${cx}" cy="${cy}" r="${(lay.Rs + 8) * k}" fill="transparent" data-z="bars" class="zhit barsh" style="pointer-events:stroke" stroke="transparent" stroke-width="${Math.max(10, 30 * k)}"/>`;
      if (o.edit && !o.small) {
        const ri0 = lay.Rsi || (g.Di / 2 + c + dt + lay.dmax / 2), mid = ((lay.Rs - lay.dmax / 2) + (ri0 + lay.dmax / 2)) / 2, wid = Math.max(4, (lay.Rs - lay.dmax / 2) - (ri0 + lay.dmax / 2) - 8);
        s += `<circle cx="${cx}" cy="${cy}" r="${mid * k}" fill="none" stroke="transparent" stroke-width="${wid * k}" style="pointer-events:stroke" data-z="ties" class="zhit inz"><title>Ścianka – strzemiona</title></circle>`;
        s += `<circle cx="${cx}" cy="${cy}" r="${(g.D / 2 - c / 2) * k}" fill="none" stroke="transparent" stroke-width="${Math.max(6, c * k)}" style="pointer-events:stroke" data-z="cov" class="zhit covz"><title>Otulina c_nom = ${c} mm</title></circle><circle cx="${cx}" cy="${cy}" r="${(g.Di / 2 + c / 2) * k}" fill="none" stroke="transparent" stroke-width="${Math.max(6, c * k)}" style="pointer-events:stroke" data-z="cov" class="zhit covz"><title>Otulina c_nom = ${c} mm</title></circle>`;
        s += `<circle cx="${cx}" cy="${cy}" r="${lay.Rs * k}" fill="none" stroke="transparent" stroke-width="${Math.max(12, (lay.dmax + 18) * k)}" style="pointer-events:stroke" data-z="ring:out" class="zhit ringz"><title>Pręty – obwód zewnętrzny</title></circle><circle cx="${cx}" cy="${cy}" r="${ri0 * k}" fill="none" stroke="transparent" stroke-width="${Math.max(12, (lay.dmax + 18) * k)}" style="pointer-events:stroke" data-z="ring:in" class="zhit ringz"><title>Pręty – obwód wewnętrzny${lay.Rsi ? '' : ' (brak – kliknij, aby dodać)'}</title></circle>`;
        s += D.barHits(lay, X, Y, k);
      }
    } else if (o.edit) s += `<circle cx="${cx}" cy="${cy}" r="${(g.D / 2 - g.t / 2) * k}" fill="transparent" stroke="transparent" stroke-width="${g.t * k}" data-z="bars" class="zhit"/>` + tx(cx, cy + 4, 'brak zbrojenia – kliknij', { fs: 11, c: C.mut });
    if (!o.small) {
      s += dimH(ox, ox + bw, oy - 16, `D = ${g.D}`) + dimH(X(g.D / 2 + g.Di / 2), ox + bw, cy, `t = ${g.t}`, { fs: 9.5 });
      if (lay.n) s += D.covLbl(o, cx, oy + bh + 26, c, 'middle', `${lay.n}⌀${lay.dmax} · `, '');
    }
  } else if (g.isPoly) {
    s += `<path d="M${g.outline.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' L')} Z" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.4"/>`;
    if (lay.n) {
      const rr = ((lay.rin || 2 * dt) + dt / 2) * k;
      g.ties.forEach((t, ti) => {
        const x0 = X(t.x0 + c + dt / 2), y0 = Y(t.y0 + c + dt / 2), x1 = X(t.x1 - c - dt / 2), y1 = Y(t.y1 - c - dt / 2);
        s += `<path d="M${x0 + rr},${y0} H${x1 - rr} A${rr},${rr} 0 0 1 ${x1},${y0 + rr} V${y1 - rr} A${rr},${rr} 0 0 1 ${x1 - rr},${y1} H${x0 + rr} A${rr},${rr} 0 0 1 ${x0},${y1 - rr} V${y0 + rr} A${rr},${rr} 0 0 1 ${x0 + rr},${y0} Z" fill="none" stroke="${tieCol}" stroke-width="${tw}" ${o.edit ? 'data-z="ties" class="zhit tieh"' : ''}/>`;
        if (!o.small && ti === 0) s += D.cornerHooks([x0 + rr, y0 + rr], rr, Math.min(Math.max(10 * dt, 75) * k, (y1 - y0) * 0.4), S.stir.hookA === 90 ? 90 : 135, tieCol, tw);
      });
      { const hA = S.stir.hookA === 90 ? 90 : 135, rinP = (dt <= 16 ? 4 : 7) * dt / 2, hL = (R.sched ? R.sched.hook : Math.max(10 * dt, 75)) * k;
        lay.pins.forEach(p => {
          const bx = p.dir === 'v' ? p.x - (p.d + dt) / 2 : null, by = p.dir === 'v' ? null : p.y - (p.d + dt) / 2;
          const near = p.dir === 'v' ? lay.bars.filter(q => Math.abs(q.x - bx) < 1.5 && q.y >= p.y0 - 80 && q.y <= p.y1 + 80) : lay.bars.filter(q => Math.abs(q.y - by) < 1.5 && q.x >= p.x0 - 80 && q.x <= p.x1 + 80);
          if (near.length >= 2) { const A2 = p.dir === 'v' ? near.reduce((m, q) => (q.y < m.y ? q : m)) : near.reduce((m, q) => (q.x < m.x ? q : m)), B2 = p.dir === 'v' ? near.reduce((m, q) => (q.y > m.y ? q : m)) : near.reduce((m, q) => (q.x > m.x ? q : m));
            s += D.pinPath([X(A2.x), Y(A2.y)], [X(B2.x), Y(B2.y)], (Math.max(rinP, A2.d / 2) + dt / 2) * k, (Math.max(rinP, B2.d / 2) + dt / 2) * k, hA, o.small ? 5 : Math.min(hL, 40), tieCol, tw * 0.9, `Szpilka ⌀${dt}: haki ${hA}°`); }
          else if (p.dir === 'v') s += `<line x1="${X(p.x)}" y1="${Y(p.y0)}" x2="${X(p.x)}" y2="${Y(p.y1)}" stroke="${tieCol}" stroke-width="${tw * 0.9}"/>`; else s += `<line x1="${X(p.x0)}" y1="${Y(p.y)}" x2="${X(p.x1)}" y2="${Y(p.y)}" stroke="${tieCol}" stroke-width="${tw * 0.9}"/>`;
        }); }
      s += barsSVG();
    }
    if (o.edit && (o.small || !lay.n)) g.rects.forEach(r => { s += `<rect x="${X(r.x0) + 2}" y="${Y(r.y0) + 2}" width="${(r.x1 - r.x0) * k - 4}" height="${(r.y1 - r.y0) * k - 4}" fill="transparent" data-z="bars" class="zhit barsh"/>`; });
    if (o.edit && !o.small && lay.n) {
      const pth = `M${g.outline.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' L')} Z`, inset = (c + dt + lay.offC) ;
      g.rects.forEach(r => { const w = (r.x1 - r.x0) - 2 * inset, h = (r.y1 - r.y0) - 2 * inset; if (w > 4 && h > 4) s += `<rect x="${X(r.x0 + inset)}" y="${Y(r.y0 + inset)}" width="${w * k}" height="${h * k}" fill="transparent" data-z="ties" class="zhit inz"><title>Wnętrze – strzemiona i szpilki</title></rect>`; });
      s += `<path d="${pth}" fill="none" stroke="transparent" stroke-width="${Math.max(8, 2 * c * k)}" style="pointer-events:stroke" data-z="cov" class="zhit covz"><title>Otulina c_nom = ${c} mm – kliknij, aby zmienić</title></path>`;
      (lay.edges || []).forEach(e => { const a = e.lo + lay.offC + 4, b = e.hi - lay.offC - 4; if (b - a < 10) return; const th = Math.max(14, (e.d + 22) * k), L = (b - a) * k;
        s += e.hz ? `<rect x="${X(a)}" y="${Y(e.cc) - th / 2}" width="${L}" height="${th}" fill="transparent" data-z="e:${e.ei}" class="zhit facez"><title>Krawędź – pręty pośrednie: ${e.n}⌀${e.d}${e.man ? ' (zadane)' : ' (wg rozstawu)'} – kliknij, aby zmienić</title></rect>` : `<rect x="${X(e.cc) - th / 2}" y="${Y(a)}" width="${th}" height="${L}" fill="transparent" data-z="e:${e.ei}" class="zhit facez"><title>Krawędź – pręty pośrednie: ${e.n}⌀${e.d}${e.man ? ' (zadane)' : ' (wg rozstawu)'} – kliknij, aby zmienić</title></rect>`; });
      lay.bars.filter(q => q.corner).forEach(q => { s += `<circle cx="${X(q.x)}" cy="${Y(q.y)}" r="${Math.max(9, (q.d / 2 + 12) * k)}" fill="transparent" data-z="corner" class="zhit cornz"><title>Pręty w narożach i przecięciach strzemion ⌀${q.d} – kliknij, aby zmienić</title></circle>`; });
      s += D.barHits(lay, X, Y, k);
    }
    if (!lay.n && o.edit) s += tx(X(g.xc), Y(g.yc), 'brak zbrojenia – kliknij', { fs: 11, c: C.mut });
    if (!o.small) {
      const G = S.geom;
      s += `<g ${o.edit ? 'data-z="dims" class="zdim"' : ''}>`;
      if (g.shape === 'T') { const q = G.tee, xl = (q.bf - q.bw) / 2; s += dimH(ox, ox + bw, oy - 16, `b_f = ${q.bf}`) + dimV(ox - 18, oy, oy + bh, `h = ${q.h}`) + dimV(ox + bw + 16, oy, Y(q.hf), `h_f = ${q.hf}`, { fs: 9.5 }) + dimH(X(xl), X(xl + q.bw), oy + bh + 14, `b_w = ${q.bw}`, { below: true }); }
      else { const q = G.ang; s += dimH(ox, ox + bw, oy + bh + 14, `b = ${q.b}`, { below: true }) + dimV(ox - 18, oy, oy + bh, `h = ${q.h}`) + dimH(ox, X(q.th), oy - 16, `t = ${q.th}`) + dimV(ox + bw + 16, Y(q.h - q.tb), oy + bh, `t = ${q.tb}`, { fs: 9.5 }); }
      s += '</g>';
      if (lay.n) s += D.covLbl(o, ox, oy + bh + 40, c, 'start', '', ` · ${lay.n}⌀${lay.dmax}${lay.dmin !== lay.dmax ? '/' + lay.dmin : ''} · strz. ⌀${dt}${lay.pins.length ? ' · szpilki ' + lay.pins.length : ''}`);
    }
  } else if (g.circ) {
    const cx = X(g.D / 2), cy = Y(g.D / 2), r = g.D / 2 * k;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.4" ${o.edit ? 'data-z="dims" class="zhit"' : ''}/>`;
    if (lay.n) {
      const rt = (g.D / 2 - c - dt / 2) * k;
      if (o.edit && !o.small) s += `<circle cx="${cx}" cy="${cy}" r="${(lay.Rs - lay.dmax / 2 - 6) * k}" fill="transparent" data-z="ties" class="zhit inz"><title>Wnętrze – strzemiona</title></circle>` + `<circle cx="${cx}" cy="${cy}" r="${(g.D / 2 - c / 2) * k}" fill="none" stroke="transparent" stroke-width="${Math.max(6, c * k)}" style="pointer-events:stroke" data-z="cov" class="zhit covz"><title>Otulina c_nom = ${c} mm – kliknij, aby zmienić</title></circle>`;
      s += `<circle cx="${cx}" cy="${cy}" r="${rt}" fill="none" stroke="${fail.ties ? C.red : C.tie}" stroke-width="${Math.max(1.4, dt * k)}" ${o.edit ? 'data-z="ties" class="zhit tieh"' : ''}/>`;
      lay.bars.forEach((b, i) => { s += `<circle cx="${X(b.x)}" cy="${Y(b.y)}" r="${Math.max(2, b.d / 2 * k)}" fill="${fail.bars ? C.red : C.bar}" ${o.edit && o.small ? 'data-z="bars"' : ''}/>`; });
      if (o.edit && !o.small) s += `<circle cx="${cx}" cy="${cy}" r="${lay.Rs * k}" fill="none" stroke="transparent" stroke-width="${Math.max(14, (lay.dmax + 24) * k)}" style="pointer-events:stroke" data-z="ring:out" class="zhit ringz"><title>Pręty na obwodzie – kliknij: liczba i średnica</title></circle>` + D.barHits(lay, X, Y, k);
    }
    if (!o.small) {
      s += dimH(ox, ox + bw, oy - 16, `D = ${g.D}`);
      if (lay.n) s += D.covLbl(o, cx, oy + bh + 26, c, 'middle', `${lay.n}⌀${lay.dmax} · `, '');
    }
  } else {
    s += `<rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.4"/>`;
    if (lay.n) {
      const cf = lay.cf || { top: c, bot: c, lft: c, rgt: c }, cb0 = lay.bars.find(b => b.corner) || lay.bars[0], rin = lay.rin || 2 * dt, rr = (Math.max(rin, cb0 ? cb0.d / 2 : 0) + dt / 2) * k;
      const x0 = ox + (cf.lft + dt / 2) * k, y0 = oy + (cf.top + dt / 2) * k, x1 = ox + bw - (cf.rgt + dt / 2) * k, y1 = oy + bh - (cf.bot + dt / 2) * k;
      const tieCol = fail.ties ? C.red : C.tie, tw = Math.max(1.3, dt * k), hA = S.stir.hookA === 90 ? 90 : 135, hL = (R.sched ? R.sched.hook : Math.max(10 * dt, 75)) * k;
      s += `<path d="M${x0 + rr},${y0} H${x1 - rr} A${rr},${rr} 0 0 1 ${x1},${y0 + rr} V${y1 - rr} A${rr},${rr} 0 0 1 ${x1 - rr},${y1} H${x0 + rr} A${rr},${rr} 0 0 1 ${x0},${y1 - rr} V${y0 + rr} A${rr},${rr} 0 0 1 ${x0 + rr},${y0} Z" fill="none" stroke="${tieCol}" stroke-width="${tw}" ${o.edit ? 'data-z="ties" class="zhit tieh"' : ''}><title>Strzemię ⌀${dt}: łuki wokół prętów narożnych, φ_m = ${dt <= 16 ? 4 : 7}⌀ = ${(dt <= 16 ? 4 : 7) * dt} mm (tab. 8.1N)</title></path>`;
      // haki w lewym górnym narożu – owinięte wokół pręta narożnego (jak w BelkaŻB)
      if (!o.small) s += D.cornerHooks([x0 + rr, y0 + rr], rr, Math.min(hL, (y1 - y0) * 0.4), hA, tieCol, tw);
      // szpilki: haki owinięte wokół prętów skrajnych (ramię styczne do prętów)
      const rinP = (dt <= 16 ? 4 : 7) * dt / 2;
      lay.pins.forEach(p => {
        const near = p.dir === 'h' ? lay.bars.filter(q => Math.abs(q.x - p.x) < 1.5) : lay.bars.filter(q => Math.abs(q.y - p.y) < 1.5);
        if (near.length < 2) return;
        const A2 = p.dir === 'h' ? near.reduce((m, q) => (q.y < m.y ? q : m)) : near.reduce((m, q) => (q.x < m.x ? q : m)), B2 = p.dir === 'h' ? near.reduce((m, q) => (q.y > m.y ? q : m)) : near.reduce((m, q) => (q.x > m.x ? q : m));
        const RA = Math.max(rinP, A2.d / 2) + dt / 2, RB = Math.max(rinP, B2.d / 2) + dt / 2;
        s += D.pinPath([X(A2.x), Y(A2.y)], [X(B2.x), Y(B2.y)], RA * k, RB * k, hA, o.small ? Math.min(6, hL * 0.5) : Math.min(hL, 0.3 * (p.dir === 'h' ? bw : bh)), tieCol, tw * 0.9, `Szpilka ⌀${dt}: haki ${hA}° owinięte wokół prętów ⌀${A2.d}, φ_m = ${2 * rinP} mm`);
      });
      lay.bars.forEach(b => { s += `<circle cx="${X(b.x)}" cy="${Y(b.y)}" r="${Math.max(2, b.d / 2 * k)}" fill="${fail.bars ? C.red : C.bar}" ${!b.corner && !b.rest && !o.small ? `stroke="${C.warn}" stroke-width="1.2"` : ''}/>`; });
      if (o.edit && o.small) s += `<rect x="${ox + 2}" y="${oy + 2}" width="${bw - 4}" height="${bh - 4}" fill="transparent" data-z="bars" class="zhit barsh"/>`;
      if (o.edit && !o.small) {
        // strefy kliknięcia: otulina (pas przy krawędziach), wnętrze (strzemiona), każdy bok (pręty pośrednie tego boku), naroża, pojedyncze pręty
        const F = lay.faces, band = Math.max(...['top', 'bot', 'lft', 'rgt'].map(q => F[q].d), S.reb.dc) + 22, cf = lay.cf || { top: c, bot: c, lft: c, rgt: c };
        const FN = { top: 'górny', bot: 'dolny', lft: 'lewy', rgt: 'prawy' };
        // otulina każdego boku – osobna strefa (pas przy krawędzi)
        [['top', ox, oy, bw, (cf.top + dt) * k], ['bot', ox, oy + bh - (cf.bot + dt) * k, bw, (cf.bot + dt) * k], ['lft', ox, oy, (cf.lft + dt) * k, bh], ['rgt', ox + bw - (cf.rgt + dt) * k, oy, (cf.rgt + dt) * k, bh]].forEach(([q, x, y, w, h]) => {
          s += `<rect x="${x}" y="${y}" width="${Math.max(3, w)}" height="${Math.max(3, h)}" fill="transparent" data-z="cv:${q}" class="zhit covz"><title>Bok ${FN[q]}: otulina c = ${cf[q]} mm${S.env.cf && S.env.cf[q] !== 'auto' ? ' (zadana dla boku)' : ''} – kliknij: zbrojenie, otulina, wymiar i obciążenie tego boku</title></rect>`; });
        const iL = (cf.lft + dt + band) * k, iT = (cf.top + dt + band) * k, iR = (cf.rgt + dt + band) * k, iB = (cf.bot + dt + band) * k;
        if (bw - iL - iR > 6 && bh - iT - iB > 6) s += `<rect x="${ox + iL}" y="${oy + iT}" width="${bw - iL - iR}" height="${bh - iT - iB}" fill="transparent" data-z="ties" class="zhit inz"><title>Wnętrze – strzemiona i szpilki: kliknij, aby zmienić</title></rect>`;
        ['top', 'bot', 'lft', 'rgt'].forEach(q => { const f = F[q], a = f.pos[0] + S.reb.dc / 2 + 4, L = (f.pos[f.pos.length - 1] - f.pos[0] - S.reb.dc - 8) * k, th = Math.max(14, band * k), t = `<title>Bok ${FN[q]}: ${f.nm ? `${f.nm}⌀${f.d}` : 'bez prętów pośrednich'} – kliknij: zbrojenie, otulina, wymiar i obciążenie tego boku</title>`;
          if (L < 6) return;
          s += f.hz ? `<rect x="${X(a)}" y="${Y(f.c0) - th / 2}" width="${L}" height="${th}" fill="transparent" data-z="f:${q}" class="zhit facez">${t}</rect>` : `<rect x="${X(f.c0) - th / 2}" y="${Y(a)}" width="${th}" height="${L}" fill="transparent" data-z="f:${q}" class="zhit facez">${t}</rect>`; });
        lay.bars.filter(q => q.corner).forEach(q => { s += `<circle cx="${X(q.x)}" cy="${Y(q.y)}" r="${Math.max(9, (q.d / 2 + 12) * k)}" fill="transparent" data-z="corner" class="zhit cornz"><title>Pręty narożne 4⌀${q.d} – kliknij, aby zmienić</title></circle>`; });
        s += D.barHits(lay, X, Y, k);
      }
    } else if (o.edit) s += `<rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" fill="transparent" data-z="bars" class="zhit"/>` + tx(ox + bw / 2, oy + bh / 2, 'brak zbrojenia – kliknij', { fs: 11, c: C.mut });
    if (!o.small) {
      s += `<g ${o.edit ? 'data-z="dims" class="zdim"' : ''}>` + dimH(ox, ox + bw, oy - 16, `b = ${g.b}`) + dimV(ox - 18, oy, oy + bh, `h = ${g.h}`) + '</g>';
      if (lay.n) {
        // odstępy osiowe prętów (łańcuch pod przekrojem i z prawej)
        const F = lay.faces, sm = lay.smin, lbl = f => `${f.n - 1}×${fmt(f.ctc, 0)}`, bad = f => f.clear < sm - 0.5;
        if (lay.cf && S.env.cf) { const cf = lay.cf; ['top', 'bot', 'lft', 'rgt'].forEach(q => { if (S.env.cf[q] === 'auto') return; const p = q === 'top' ? [ox + bw - 4, oy + cf.top * k / 2 + 3, 'end'] : q === 'bot' ? [ox + bw - 4, oy + bh - cf.bot * k / 2 + 3, 'end'] : q === 'lft' ? [ox + 3, oy + bh - 6, 'start'] : [ox + bw - 3, oy + bh - 6, 'end']; s += tx(p[0], p[1], `c = ${cf[q]}`, { fs: 8.5, c: cf[q] < c ? C.red : C.acc, a: p[2], w: 600 }); }); }
        const same = (A, B) => A.nm === B.nm && A.d === B.d;
        if (F.bot.nm && bw > 120) s += dimH(X(F.bot.pos[0]), X(F.bot.pos[F.bot.n - 1]), oy + bh + 14, lbl(F.bot), { below: true, fs: 9.5, c: bad(F.bot) ? C.red : undefined });
        if (F.rgt.nm && bh > 120) s += dimV(ox + bw + 14, Y(F.rgt.pos[0]), Y(F.rgt.pos[F.rgt.n - 1]), lbl(F.rgt), { right: true, fs: 9.5, c: bad(F.rgt) ? C.red : undefined });
        if (F.top.nm && !same(F.top, F.bot) && bw > 120) s += dimH(X(F.top.pos[0]), X(F.top.pos[F.top.n - 1]), oy - 32, lbl(F.top), { fs: 9.5, c: bad(F.top) ? C.red : undefined });
        if (F.lft.nm && !same(F.lft, F.rgt) && bh > 120) s += dimV(ox - 34, Y(F.lft.pos[0]), Y(F.lft.pos[F.lft.n - 1]), lbl(F.lft), { fs: 9.5, c: bad(F.lft) ? C.red : undefined });
        ['top', 'bot', 'lft', 'rgt'].forEach(q => { const f = F[q]; if (!bad(f)) return; const p = f.hz ? [ox + bw / 2, Y(f.c0) + (q === 'top' ? 16 : -10)] : [X(f.c0) + (q === 'lft' ? 10 : -10), oy + bh / 2];
          s += tx(p[0], p[1], `s_cl = ${fmt(f.clear, 0)} < ${fmt(sm, 0)}`, { fs: 9.5, c: C.red, w: 600, a: f.hz ? 'middle' : (q === 'lft' ? 'start' : 'end') }); });
        s += D.covLbl(o, ox, oy + bh + 40, lay.cf && S.env.cf && ['top', 'bot', 'lft', 'rgt'].some(q => S.env.cf[q] !== 'auto') ? `${lay.cf.top}/${lay.cf.bot}/${lay.cf.lft}/${lay.cf.rgt}` : c, 'start', '', ` · ${lay.n}⌀${lay.dmax}${lay.dmin !== lay.dmax ? '/' + lay.dmin : ''} · strz. ⌀${dt}`);
        // znaczniki otuliny przy krawędziach (do strzemion): dół, lewa, góra, prawa
        { const cf = lay.cf || { top: c, bot: c, lft: c, rgt: c }; s += `<g stroke="${C.acc}" stroke-width="1"><line x1="${ox}" y1="${oy + bh + 5}" x2="${ox + cf.lft * k}" y2="${oy + bh + 5}"/><line x1="${ox + bw + 5}" y1="${oy + bh}" x2="${ox + bw + 5}" y2="${oy + bh - cf.bot * k}"/><line x1="${ox + bw + 5}" y1="${oy}" x2="${ox + bw + 5}" y2="${oy + cf.top * k}"/><line x1="${ox + bw}" y1="${oy - 5}" x2="${ox + bw - cf.rgt * k}" y2="${oy - 5}"/></g>`; }
      }
    }
  }
  if (o.small && o.edit && lay.n) s += `<g data-z="cov" class="zhit covtxt" style="cursor:pointer"><title>Otulina – kliknij, aby zmienić</title><rect x="2" y="${H - 16}" width="112" height="15" fill="transparent"/>${tx(4, H - 5, `c_nom = ${c} mm ✎`, { fs: 9.5, c: C.acc, a: 'start', w: 650 })}</g>`;
  if (o.starter && lay.n) {
    // pręty startowe / słupa niższego w strefie zakładu – obok prętów słupa, przesunięte do wnętrza
    const cx0 = g.round ? g.D / 2 : g.isPoly ? g.xc : g.b / 2, cy0 = g.round ? g.D / 2 : g.isPoly ? g.yc : g.h / 2;
    lay.bars.forEach(b => { const vx = cx0 - b.x, vy = cy0 - b.y, L2 = Math.hypot(vx, vy) || 1, sh = b.d * 1.05; s += `<circle cx="${X(b.x + vx / L2 * sh)}" cy="${Y(b.y + vy / L2 * sh)}" r="${Math.max(2, b.d / 2 * k)}" fill="#ffffff" stroke="${C.acc}" stroke-width="1.3"/>`; });
  }
  if (o.axes !== false && !o.small) {
    // osie lokalne: y wzdłuż b, z wzdłuż h (jak rys. 5.8 PN-EN 1992-1-1)
    const ax = W - 52, ay = H - 18;
    s += `<g stroke="${C.mut}" stroke-width="1" fill="${C.mut}"><line x1="${ax}" y1="${ay}" x2="${ax + 22}" y2="${ay}"/><path d="M${ax + 22},${ay - 3} l6,3 l-6,3z"/><line x1="${ax}" y1="${ay}" x2="${ax}" y2="${ay - 22}"/><path d="M${ax - 3},${ay - 22} l3,-6 l3,6z"/></g>` +
      tx(ax + 30, ay + 3.5, 'y', { fs: 9.5, c: C.mut, a: 'start' }) + tx(ax + 5, ay - 24, 'z', { fs: 9.5, c: C.mut, a: 'start' });
  }
  return s + '</svg>';
};

// pręty do zaznaczania (klik – zaznacz, Ctrl/Shift + klik – kilka, Delete – usuń)
D.barHits = function (lay, X, Y, k) {
  return `<g class="bhits">${lay.bars.map((b, i) => `<circle cx="${X(b.x)}" cy="${Y(b.y)}" r="${Math.max(4, (b.d / 2 + 2) * k)}" fill="transparent" class="barhit" data-bi="${i}"><title>Pręt ⌀${b.d}${b.corner ? ' (narożny)' : ''} – kliknij, aby zaznaczyć (Delete – usuń)</title></circle>`).join('')}</g>`;
};

/* ---------------------------------------------- odkształcenia i naprężenia (SGN) */
D.strainSVG = function (R, dir, sec, o) {
  o = o || {};
  const U = R.dirs[dir].U, g = R.g, gd = g.dir[dir], m = R.m;
  const r = U.MRdX(sec.N, sec.sg || 1); if (!r) return '';
  const W = o.W || 300, H = o.H || 300, mt = 30, mb = 34, hh = H - mt - mb, k = hh / gd.depth;
  const flip = (sec.sg || 1) < 0;
  const yOf = y => mt + (flip ? gd.depth - y : y) * k;
  let s = svgOpen(W, H);
  // przekrój (bok)
  const sw = Math.min(70, gd.width * k);
  s += `<rect x="10" y="${mt}" width="${sw}" height="${hh}" fill="${C.conc}" stroke="${C.concL}"/>`;
  (r.bs || []).forEach(b => { s += `<circle cx="${10 + sw / 2}" cy="${yOf(b.y)}" r="3" fill="${C.bar}"/>`; });
  // odkształcenia
  const x0 = sw + 60, ew = 70, emax = Math.max(Math.abs(r.eT), Math.abs(r.eB), 1e-6);
  const ex = e => x0 + e / emax * ew * 0.5;
  s += `<line x1="${x0}" y1="${mt}" x2="${x0}" y2="${mt + hh}" stroke="${C.ink2}"/>`;
  const yT = flip ? mt + hh : mt, yB = flip ? mt : mt + hh;
  s += `<polygon points="${x0},${yT} ${ex(r.eT)},${yT} ${ex(r.eB)},${yB} ${x0},${yB}" fill="${C.acc}" fill-opacity="0.12" stroke="${C.acc}"/>`;
  s += tx(ex(r.eT) + (r.eT >= 0 ? 4 : -4), yT + (flip ? 12 : -4), fmt(r.eT * 1000, 2) + '‰', { fs: 9.5, c: C.acc, a: r.eT >= 0 ? 'start' : 'end' }) + tx(ex(r.eB) + (r.eB >= 0 ? 4 : -4), yB + (flip ? -4 : 12), fmt(r.eB * 1000, 2) + '‰', { fs: 9.5, c: C.acc, a: r.eB >= 0 ? 'start' : 'end' });
  s += tx(x0, 14, 'ε [‰]', { fs: 10.5, w: 600 });
  // naprężenia w betonie (strefa ściskana)
  const x1 = x0 + ew + 50;
  s += `<line x1="${x1}" y1="${mt}" x2="${x1}" y2="${mt + hh}" stroke="${C.ink2}"/>` + tx(x1 + 20, 14, 'σ_c', { fs: 10.5, w: 600 });
  if (r.x !== null && r.x > 0) {
    const xc = Math.min(r.x === Infinity ? gd.depth : r.x, gd.depth), a = xc * k, sw2 = 40;
    const yA = flip ? mt + hh : mt, dirY = flip ? -1 : 1;
    if (m.diag === 'rect') { const aa = Math.min(m.lambda * xc, gd.depth) * k; s += `<rect x="${x1}" y="${flip ? yA - aa : yA}" width="${sw2}" height="${aa}" fill="${C.red}" fill-opacity="0.15" stroke="${C.red}"/>`; }
    else {
      const pts = []; for (let i = 0; i <= 24; i++) { const t = i / 24, yy = t * xc; const e = r.eT + (r.eB - r.eT) * (flip ? (gd.depth - yy) : yy) / gd.depth; const ec = flip ? r.eB + (r.eT - r.eB) * yy / gd.depth : e; const sg = ec <= 0 ? 0 : ec >= m.ec2 ? 1 : 1 - Math.pow(1 - ec / m.ec2, m.npar); pts.push([x1 + sg * sw2, yA + dirY * yy * k]); }
      s += `<polygon points="${x1},${yA} ${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ')} ${x1},${yA + dirY * a}" fill="${C.red}" fill-opacity="0.15" stroke="${C.red}"/>`;
    }
    if (r.x !== Infinity && r.x < gd.depth) { const yx = yA + dirY * a; s += `<line x1="${8}" y1="${yx}" x2="${x1 + 50}" y2="${yx}" stroke="${C.red}" stroke-dasharray="4 3"/>` + tx(x1 + 52, yx + 3.5, `x = ${fmt(r.x, 0)}`, { fs: 9.5, c: C.red, a: 'start' }); }
  }
  const smax = Math.max(...(r.bs || []).map(b => -b.s), 0), cmax = Math.max(...(r.bs || []).map(b => b.s), 0);
  s += tx(10, H - 16, `N = ${fmt(sec.N / 1e3, 1)} kN, M_Rd = ${fmt(Math.abs(r.M) / 1e6, 1)} kNm`, { fs: 10, a: 'start', c: C.ink2 });
  s += tx(10, H - 3, `σ_s: rozc. ${fmt(smax, 0)} MPa, ścisk. ${fmt(cmax, 0)} MPa`, { fs: 10, a: 'start', c: C.ink2 });
  return s + '</svg>';
};

/* --------------------------------------------------- opis otuliny (klikalny, jak w BelkaŻB) */
D.covLbl = function (o, x, y, c, a, pre, post) {
  const t = `c_nom = ${c} mm${o.edit ? ' ✎' : ''}`, w = (t.length - 3) * 5.8 + 8;
  let s = '';
  if (a === 'middle' && pre) { s += tx(x, y, pre.replace(/ · $/, ''), { fs: 10.5, c: C.acc }); y += 15; }
  const xl = a === 'middle' ? x - w / 2 : x;
  s += `<g ${o.edit ? 'data-z="cov" class="zhit covtxt" style="cursor:pointer"' : ''}>${o.edit ? `<title>Otulina – kliknij, aby zmienić (c_min,dur, Δc_dev, otulina każdego boku)</title><rect x="${(xl - 2).toFixed(1)}" y="${y - 12}" width="${w + 4}" height="16" fill="transparent"/>` : ''}${tx(xl, y, t, { fs: 10.5, c: C.acc, a: 'start', w: o.edit ? 650 : 400 })}</g>`;
  if (post) s += tx(xl + w + 4, y, post.replace(/^ · /, '· '), { fs: 10.5, c: C.acc, a: 'start' });
  return s;
};
/* ------------------------------------------------------- haki strzemion i szpilek */
// hak strzemienia zamkniętego w narożu: c – środek łuku [px], R – promień osi [px]; oba końce owinięte wokół pręta narożnego
// (135°: dalszy łuk 45° i prosty odcinek L skierowany do wnętrza przekroju; 90°: końce wzdłuż ramion)
D.cornerHooks = function (c, R, L, ang, col, w, qx, qy) {
  qx = qx || 1; qy = qy || 1;   // ćwiartka naroża: (1,1) – lewy górny
  const P = (a) => [c[0] + R * Math.cos(a) * qx, c[1] + R * Math.sin(a) * qy], f = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`, sw = (sg) => (qx * qy > 0 ? sg : -sg) > 0 ? 1 : 0;
  if (ang === 90) { const t = 4; return `<path d="M${f(P(Math.PI))} v${(L * qy).toFixed(1)} m${-t / 2},0 h${t} M${f(P(1.5 * Math.PI))} h${(L * qx).toFixed(1)} m0,${-t / 2} v${t}" stroke="${col}" stroke-opacity="0.55" stroke-width="${(w * 0.7).toFixed(2)}" stroke-linecap="round" fill="none"><title>hak 90° – zakończenia wzdłuż ramion</title></path>`; }
  const a1 = 0.75 * Math.PI, a2 = 1.75 * Math.PI, p1 = P(a1), p2 = P(a2), k = Math.SQRT1_2;
  const d1 = [k * qx, k * qy], d2 = [k * qx, k * qy];
  return `<path d="M${f(P(Math.PI))} A${R.toFixed(2)},${R.toFixed(2)} 0 0 ${sw(-1)} ${f(p1)} l${(d1[0] * L).toFixed(1)},${(d1[1] * L).toFixed(1)} M${f(P(1.5 * Math.PI))} A${R.toFixed(2)},${R.toFixed(2)} 0 0 ${sw(1)} ${f(p2)} l${(d2[0] * L).toFixed(1)},${(d2[1] * L).toFixed(1)}" stroke="${col}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" fill="none"><title>haki 135° owinięte wokół pręta narożnego</title></path>`;
};
// szpilka (strzemię jednocięte) między prętami A i B: ramię styczne do obu prętów, haki owinięte wokół prętów (135° / 90°)
D.pinPath = function (cA, cB, RA, RB, ang, L, col, w, tip) {
  const ux0 = cB[0] - cA[0], uy0 = cB[1] - cA[1], ul = Math.hypot(ux0, uy0) || 1, u = [ux0 / ul, uy0 / ul], n = [-u[1], u[0]], fn = Math.atan2(n[1], n[0]), a = ang * Math.PI / 180;
  const f = p => `${p[0].toFixed(1)},${p[1].toFixed(1)}`, on = (c, R, t) => [c[0] + R * Math.cos(t), c[1] + R * Math.sin(t)];
  const tA = on(cA, RA, fn), tB = on(cB, RB, fn), aA = fn + a, aB = fn - a, pA = on(cA, RA, aA), pB = on(cB, RB, aB);
  const eA = [pA[0] - Math.sin(aA) * L, pA[1] + Math.cos(aA) * L], eB = [pB[0] + Math.sin(aB) * L, pB[1] - Math.cos(aB) * L];
  return `<path d="M${f(eA)} L${f(pA)} A${RA.toFixed(2)},${RA.toFixed(2)} 0 0 0 ${f(tA)} L${f(tB)} A${RB.toFixed(2)},${RB.toFixed(2)} 0 0 0 ${f(pB)} L${f(eB)}" fill="none" stroke="${col}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round">${tip ? `<title>${tip}</title>` : ''}</path>`;
};
/* ------------------------------------------------------------ schemat słupa */
// kolory obciążeń (jak w legendzie)
D.KC = { perm: '#5d6778', imp: '#1d5bb8', snow: '#6a3fb5', wind: '#1d7f3c', other: '#a35d00', dir: '#7a3db8', sw: '#39414f' };
// odcinki słupa na schemacie: przekrój podstawowy i odcinki zmiennego przekroju (szerokość rysunku proporcjonalna do wymiaru)
D.colSegs = function (R, dir, cw, depth) {
  const g = R.g, L = g.L, P = ((R.S || {}).geom || {}).parts || [];
  const dOf = p => R.S.geom.shape === 'circ' ? p.D : dir === 'y' ? p.h : p.b;
  const cuts = new Set([0, L]); P.forEach(p => { cuts.add(Math.max(0, Math.min(L, p.z0 * 1000))); cuts.add(Math.max(0, Math.min(L, p.z1 * 1000))); });
  const zs = [...cuts].sort((x, y) => x - y), out = [];
  for (let i = 0; i < zs.length - 1; i++) {
    const z0 = zs[i], z1 = zs[i + 1]; if (z1 - z0 < 1) continue;
    const zm = (z0 + z1) / 2, p = P.find(q => q.z0 * 1000 <= zm && q.z1 * 1000 >= zm);
    const dp = p ? dOf(p) : depth, w = p ? Math.max(8, Math.min(48, cw * dp / depth)) : cw;
    out.push({ z0, z1, w, part: !!p, lab: p ? (R.S.geom.shape === 'circ' ? `⌀${p.D}` : `${p.b}×${p.h}`) : '' });
  }
  return out;
};
// obciążenia na schemacie – każde osobno, z oznaczeniem (G1, Q1…) i wartością charakterystyczną
D.schLoads = function (R, dir, o) {
  const g = R.g, { cx, cw, Y, tipY, W } = o; let s = '';
  const zOf = v => (v === '' || v === null || v === undefined || !isFinite(+v) || +v * 1000 >= g.L - 0.5) ? null : Math.max(0, +v * 1000);
  const its = (R.items || []).filter(it => it.kind !== 'sw');
  const col = it => D.KC[it.kind] || C.vio, li = it => it.src === undefined ? '' : it.src, pm = it => it.pm ? '±' : '';
  const hit = (it, k) => `class="ldhit" data-ld="${k}" data-li="${li(it)}" style="cursor:pointer"`;
  const wAt = z => { const q = D.colSegs(R, dir, cw, g.dir[dir].depth).find(q2 => q2.z0 <= z + 1e-6 && q2.z1 >= z - 1e-6); return q ? q.w : cw; };
  if (its.some(it => it.kind === 'dir')) {
    // siły obliczeniowe podane wprost – N_Ed wybranej kombinacji
    return `<g ${hit({}, 'N')}><title>Siła podłużna N_Ed – kliknij, aby zmienić</title><rect x="${cx - 70}" y="${tipY - 38}" width="80" height="40" fill="transparent"/><g stroke="${C.vio}" fill="${C.vio}"><line x1="${cx}" y1="${tipY - 34}" x2="${cx}" y2="${tipY}" stroke-width="1.8"/><path d="M${cx - 4},${tipY - 8} l4,8 l4,-8z"/></g>` + tx(cx - 6, tipY - 24, `N_Ed = ${fmt(o.NT / 1e3, 0)} kN`, { fs: 10, c: C.vio, a: 'end', w: 600 }) + '</g>';
  }
  // ciężar własny (G₀) – opis przy podstawie; wyłączony – wyszarzony „(pominięty)” (jak w BelkaŻB 2.10.2)
  { const on = !!(R.S && R.S.loads && R.S.loads.sw), G0 = (g.selfW || 0) * g.L / 1e3;
    s += `<g opacity="${on ? 1 : 0.5}"><title>${on ? `Ciężar własny słupa G₀ = ${fmt(G0, 1)} kN (${fmt((g.selfW || 0), 2)} kN/m) – wyłączenie: pole w legendzie` : 'Ciężar własny pominięty – włącz polem w legendzie'}</title><line x1="${cx}" y1="${Y(0.9)}" x2="${cx}" y2="${Y(0.1)}" stroke="${D.KC.sw}" stroke-width="0.8" stroke-dasharray="2 4"/>` + tx(cx - 24, Y(0) + 11, on ? `G₀ ${fmt(G0, 1)} kN` : 'G₀ (pominięty)', { fs: 8, c: on ? D.KC.sw : C.mut, a: 'end' }) + '</g>'; }
  // siły pionowe w głowicy – strzałki obok siebie (długość ~ wartość)
  const nTop = its.filter(it => it.N && zOf(it.zN) === null);
  if (nTop.length) {
    const nmax = Math.max(...nTop.map(it => Math.abs(it.N))), n = nTop.length, sp = Math.min(36, Math.max(15, W * 0.6 / n)), rot = sp < 30;
    if (n > 1) s += `<line x1="${cx - (n - 1) / 2 * sp - 4}" y1="${tipY}" x2="${cx + (n - 1) / 2 * sp + 4}" y2="${tipY}" stroke="${C.mut}" stroke-width="0.8"/>`;
    nTop.forEach((it, j) => {
      const x = cx + (j - (n - 1) / 2) * sp, len = 14 + 22 * Math.abs(it.N) / nmax, c = col(it), y0 = tipY - len, dn = it.N >= 0, e = +(dir === 'y' ? it.eh : it.eb) || 0;
      s += `<g ${hit(it, 'N')}><title>${esc(it.id)} ${esc(it.name || '')}: N_k = ${fmt(it.N, 1)} kN${e ? `, mimośród e = ${fmt(e, 0)} mm` : ''}${it.fromAbove ? ` (w tym z kondygnacji wyżej ${fmt(it.fromAbove, 1)} kN)` : ''} – kliknij, aby zmienić</title><rect x="${x - sp / 2}" y="${y0 - 30}" width="${sp}" height="${len + 32}" fill="transparent"/>` +
        `<g stroke="${c}" fill="${c}"><line x1="${x}" y1="${y0}" x2="${x}" y2="${tipY}" stroke-width="1.7"/>${dn ? `<path d="M${x - 3.5},${tipY - 7} l3.5,7 l3.5,-7z"/>` : `<path d="M${x - 3.5},${y0 + 7} l3.5,-7 l3.5,7z"/>`}</g>` +
        (rot ? tx(x + 3, y0 - 3, `${it.id} ${pm(it)}${fmt(it.N, 0)}${e ? ' e' + fmt(e, 0) : ''}`, { fs: 8.5, c, rot: -90, a: 'start', w: 600 })
          : tx(x, y0 - (e ? 24 : 14), it.id, { fs: 9, c, w: 700 }) + tx(x, y0 - (e ? 14 : 4), pm(it) + fmt(it.N, 0), { fs: 8.5, c }) + (e ? tx(x, y0 - 4, `e=${fmt(e, 0)}`, { fs: 7.5, c }) : '')) + '</g>';
    });
  }
  // siły poziome: strzałka po stronie przeciwnej do zwrotu (pcha słup), każda osobno
  const hv = it => +(dir === 'y' ? it.Hh : it.Hb) || 0, qv = it => +(dir === 'y' ? it.qh : it.qb) || 0;
  const used = {};
  its.filter(it => hv(it)).forEach(it => {
    const z = zOf(it.zH), zz = z === null ? g.L : z, k = Math.round(zz), j = used[k] = (used[k] || 0) + 1, v = hv(it), sg = v > 0 ? 1 : -1, c = col(it);
    const y = (z === null ? Y(1) + 8 : Y(zz / g.L)) + (j - 1) * 13, xa = cx - sg * (wAt(zz) / 2 + 3);
    s += `<g ${hit(it, 'H')}><title>${esc(it.id)} ${esc(it.name || '')}: H = ${pm(it)}${fmt(v, 2)} kN${z === null ? ' (głowica)' : ` na wysokości ${fmt(z / 1000, 2)} m`} – kliknij, aby zmienić</title><rect x="${Math.min(xa, xa - sg * 92)}" y="${y - 8}" width="92" height="16" fill="transparent"/>` +
      `<g stroke="${c}" fill="${c}"><line x1="${xa - sg * 32}" y1="${y}" x2="${xa}" y2="${y}" stroke-width="1.6"/><path d="M${xa},${y} l${-sg * 8},-4 v8z"/></g>` + tx(xa - sg * 35, y + 3.5, `${it.id} H=${pm(it)}${fmt(Math.abs(v), 1)}`, { fs: 8.5, c, a: sg > 0 ? 'end' : 'start', w: 600 }) + '</g>';
  });
  // obciążenia rozłożone – osobne pasma
  let jq = 0;
  its.filter(it => qv(it)).forEach(it => {
    const v = qv(it), sg = v > 0 ? 1 : -1, c = col(it), off = cw / 2 + 3 + jq * 24, xa = cx - sg * off; let qq = '';
    for (let i = 1; i < 8; i++) { const y = Y(i / 8); qq += `<line x1="${xa - sg * 17}" y1="${y}" x2="${xa}" y2="${y}"/><path d="M${xa},${y} l${-sg * 5},-2.5 v5z"/>`; }
    s += `<g ${hit(it, 'q')}><title>${esc(it.id)} ${esc(it.name || '')}: q = ${pm(it)}${fmt(v, 2)} kN/m na całej wysokości – kliknij, aby zmienić</title><rect x="${Math.min(xa, xa - sg * 20)}" y="${Y(7 / 8)}" width="20" height="${Y(1 / 8) - Y(7 / 8)}" fill="transparent"/>` +
      `<g stroke="${c}" fill="${c}" stroke-width="1">${qq}<line x1="${xa - sg * 17}" y1="${Y(7 / 8)}" x2="${xa - sg * 17}" y2="${Y(1 / 8)}"/></g>` + tx(xa - sg * 9, Y(1 / 8) + 12 + jq * 11, `${it.id} q=${pm(it)}${fmt(Math.abs(v), 2)}`, { fs: 8.5, c, a: sg > 0 ? 'end' : 'start', w: 600 }) + '</g>';
    jq++;
  });
  // siły pionowe na wysokości (wspornik, mimośród) – każda osobno
  const usedN = {};
  its.filter(it => it.N && zOf(it.zN) !== null).forEach(it => {
    const z = zOf(it.zN), e = +(dir === 'y' ? it.eh : it.eb) || 0, sg = e >= 0 ? 1 : -1, k = Math.round(z), j = usedN[k] = (usedN[k] || 0) + 1, c = col(it);
    const xb = cx + sg * (wAt(z) / 2), xe = xb + sg * 14, y = Y(z / g.L), xr = xe - sg * 6 + sg * (j - 1) * 30;
    s += `<g ${hit(it, 'Nz')}><title>${esc(it.id)} ${esc(it.name || '')}: N = ${fmt(it.N, 1)} kN na wysokości ${fmt(z / 1000, 2)} m${e ? `, mimośród ${fmt(e, 0)} mm (M = ${fmt(it.N * e / 1000, 1)} kNm)` : ''} – kliknij, aby zmienić</title><rect x="${Math.min(xb, xr + sg * 60)}" y="${y - 34}" width="${Math.abs(xr + sg * 60 - xb)}" height="40" fill="transparent"/></g>` +
      (j === 1 ? `<path d="M${xb},${y} h${sg * 14} v8 h${-sg * 14}z" fill="${C.conc}" stroke="${C.concL}"/>` : '') +
      `<g stroke="${c}" fill="${c}"><line x1="${xr}" y1="${y - 28}" x2="${xr}" y2="${y}" stroke-width="1.6"/><path d="M${xr - 4},${y - 7} l4,7 l4,-7z"/></g>` + tx(xr + sg * 4, y - 20, `${it.id} N=${fmt(it.N, 0)}`, { fs: 8.5, c, a: sg > 0 ? 'start' : 'end', w: 600 }) + (e ? tx(xr + sg * 4, y - 9, `e=${fmt(e, 0)}`, { fs: 8, c, a: sg > 0 ? 'start' : 'end' }) : '');
  });
  return s;
};
// dir: 'y' (płaszczyzna h) | 'z' (płaszczyzna b); o: {W, H, diag: 'M'|'N'|'none', combo, click}
D.schemeSVG = function (R, S, dir, o) {
  o = o || {};
  const g = R.g, B = R.buck[dir], sch = B.sch;
  const W = o.W || 300, H = o.H || 440;
  const mt = o.mt || 104, mb = o.mb || 76, cx = W * (o.cxf || 0.44), hh = H - mt - mb;
  const depth = g.dir[dir].depth, cw = Math.max(14, Math.min(34, depth / 25));
  const Y = xi => mt + (1 - xi) * hh;                 // ξ = 0 – podstawa
  let s = svgOpen(W, H, `class="schemesvg" data-dir="${dir}" data-mt="${mt}" data-hh="${hh}" data-l="${g.L}"`);
  s += tx(8, 16, dir === 'y' ? 'Płaszczyzna h – zginanie M_y' : 'Płaszczyzna b – zginanie M_z', { fs: 11.5, w: 650, a: 'start' });
  s += tx(8, 30, `${B.schName.replace(/ \(.*\)/, '')}${B.braced ? '' : ''}`, { fs: 9.5, a: 'start', c: C.ink2 });
  // słup (odcinki zmiennego przekroju – szerokość wg wymiaru odcinka); lewy klik – zaznaczenie, dwuklik – obciążenie w tym miejscu
  const segs = D.colSegs(R, dir, cw, depth);
  s += `<g class="schcol${o.sel ? ' sel' : ''}" data-col="${dir}" style="cursor:pointer"><title>Lewy przycisk – zaznacz słup; dwuklik – dodaj obciążenie w tym miejscu; prawy – menu (obciążenia, przekrój, podparcie)</title>` +
    segs.map(q => `<rect x="${cx - q.w / 2}" y="${Y(q.z1 / g.L)}" width="${q.w}" height="${Math.max(1, Y(q.z0 / g.L) - Y(q.z1 / g.L))}" fill="${o.sel ? '#dbe7fb' : C.conc}" stroke="${o.sel ? C.acc : C.concL}" stroke-width="${o.sel ? 2.2 : 1.2}"/>`).join('') + '</g>';
  segs.filter(q => q.part && Y(q.z0 / g.L) - Y(q.z1 / g.L) > 34).forEach(q => { s += tx(cx + 3, (Y(q.z0 / g.L) + Y(q.z1 / g.L)) / 2, q.lab, { fs: 8, rot: -90, c: C.ink2, w: 600 }); });
  const mainSeg = segs.filter(q => !q.part).sort((a2, b2) => (b2.z1 - b2.z0) - (a2.z1 - a2.z0))[0], xiLab = mainSeg && segs.length > 1 ? (mainSeg.z0 + mainSeg.z1) / 2 / g.L : 0.5;
  // podpory
  const hatch = (x, y, w, up) => { let p = `<line x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}" stroke="${C.ink}" stroke-width="1.6"/>`; for (let i = 0; i <= 6; i++) { const xx = x - w / 2 + i * w / 6; p += `<line x1="${xx}" y1="${y}" x2="${xx - 6}" y2="${y + (up ? -7 : 7)}" stroke="${C.gnd}" stroke-width="0.9"/>`; } return p; };
  const fixedBot = ['cant', 'fp', 'ff', 'ffs'].includes(sch), pinBot = sch === 'pp';
  const nTopN = (R.items || []).filter(it => it.kind !== 'sw' && it.kind !== 'dir' && it.N && !(it.zN !== '' && it.zN !== null && it.zN !== undefined && isFinite(+it.zN) && +it.zN * 1000 < g.L - 0.5)).length, lx = cx + Math.max(16, nTopN > 1 ? (nTopN - 1) / 2 * Math.min(36, Math.max(15, W * 0.6 / nTopN)) + 12 : 16);
  let sup = '';
  if (fixedBot) sup += hatch(cx, Y(0), cw + 26, false);
  if (pinBot) sup += `<path d="M${cx},${Y(0)} l-9,13 h18 z" fill="#ffffff" stroke="${C.ink}" stroke-width="1.3"/>` + hatch(cx, Y(0) + 13, 30, false);
  if (sch === 'pp' || sch === 'fp') sup += `<path d="M${cx},${Y(1)} l-9,-13 h18 z" fill="#ffffff" stroke="${C.ink}" stroke-width="1.3"/><line x1="${cx - 12}" y1="${Y(1) - 13}" x2="${cx + 12}" y2="${Y(1) - 13}" stroke="${C.ink}" stroke-width="1.6"/>` + tx(lx, Y(1) - 6, 'przegub nieprzesuwny', { fs: 8.5, a: 'start', c: C.mut });
  if (sch === 'ff') sup += hatch(cx, Y(1), cw + 26, true);
  if (sch === 'ffs') sup += hatch(cx, Y(1) - 7, cw + 26, true) + `<circle cx="${cx - 8}" cy="${Y(1) - 3.5}" r="3" fill="none" stroke="${C.ink}"/><circle cx="${cx + 8}" cy="${Y(1) - 3.5}" r="3" fill="none" stroke="${C.ink}"/>` + tx(Math.max(cx + 22, lx), Y(1) - 10, 'przesuwne', { fs: 8.5, a: 'start', c: C.mut });
  if (sch === 'cant') sup += tx(Math.max(cx + 14, lx), Y(1) - 4, 'swobodny', { fs: 8.5, a: 'start', c: C.mut });
  s += `<g class="supp" data-sch="${dir}" style="cursor:pointer">${sup}<rect x="${cx - 40}" y="${Y(1) - 22}" width="80" height="22" fill="transparent"/><rect x="${cx - 40}" y="${Y(0)}" width="80" height="22" fill="transparent"/></g>`;
  // kombinacja do pokazania
  const res = R.res || [];
  const oc = o.combo !== undefined && res[o.combo] ? res[o.combo] : (res.length ? res.reduce((a, q) => (q[dir].u > a[dir].u ? q : a)) : null);
  if (oc) {
    const r = oc[dir], fr = oc.fr;
    // obciążenia: każde obciążenie (G1, Q1, …) osobno, wartości charakterystyczne (jak w BelkaŻB); w trybie sił wprost – N_Ed kombinacji
    const NT = fr.Ntop;
    const tipY = Y(1) - ({ pp: 15, fp: 15, ff: 9, ffs: 16, cant: 2 }[sch] || 2);
    s += D.schLoads(R, dir, { cx, cw, Y, tipY, W, NT, oc });
    // wykres
    const mode = o.diag || 'M';
    if ((mode === 'M' || mode === 'V') && R.lay.n) s += `<rect class="mhit" x="${cx + cw / 2 + 2}" y="${Y(1)}" width="${Math.max(10, W - cx - cw / 2 - 6)}" height="${hh}" fill="transparent" style="cursor:crosshair"><title>Kliknij – przekrój i siły na tej wysokości</title></rect>`;
    if (mode === 'M' && r) {
      const ms = D.momentSeries(R, oc, dir), n = ms.M0.length - 1;
      const vals = ms.M0.map(v => v * 1e6), tot = ms.tot.map(v => v * 1e6);
      const m0 = Math.max(...tot.map(Math.abs), ...vals.map(Math.abs), 1), mxA = a => a ? Math.max(...a.map(Math.abs)) * 1e6 : 0, inS = a => a && mxA(a) <= 2.6 * m0;
      const off = [o.mrd && !inS(o.mrd) ? `przyjęte ${fmt(mxA(o.mrd) / 1e6, 0)}` : '', o.mrdP && !inS(o.mrdP) ? `wymagane ${fmt(mxA(o.mrdP) / 1e6, 0)}` : ''].filter(Boolean);
      if (o.mrd && !inS(o.mrd)) o.mrd = null; if (o.mrdP && !inS(o.mrdP)) o.mrdP = null;
      const mx = Math.max(m0, mxA(o.mrd), mxA(o.mrdP));
      if (off.length) s += tx(W - 6, 44, `M_Rd: ${off.join(', ')} kNm (poza skalą)`, { fs: 9, a: 'end', c: C.ok });
      const sc = (W - cx - 40) / mx * 0.9;
      const X = v => Math.max(4, Math.min(W - 4, cx + v * sc));
      // nośność M_Rd(N_Ed(x)) – zbrojenie przyjęte (ciągła) i wymagane z doboru (przerywana), po stronie momentu
      const sgAt = i => (tot[i] >= 0 ? 1 : -1);
      if (o.mrd) s += `<polyline points="${o.mrd.map((v, i) => `${X(sgAt(i) * Math.abs(v) * 1e6).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ')}" fill="none" stroke="${C.ok}" stroke-width="1.5"/>`;
      if (o.mrdP) s += `<polyline points="${o.mrdP.map((v, i) => `${X(sgAt(i) * Math.abs(v) * 1e6).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ')}" fill="none" stroke="${C.ok}" stroke-width="1.4" ${o.mrd ? 'stroke-dasharray="7 3"' : ''}/>`;
      const ptsT = tot.map((v, i) => `${X(v).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ');
      const pts0 = vals.map((v, i) => `${X(v).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ');
      s += `<polygon points="${cx},${Y(0)} ${ptsT} ${cx},${Y(1)}" fill="${C.red}" fill-opacity="0.12" stroke="none"/>`;
      s += `<polyline points="${ptsT}" fill="none" stroke="${C.red}" stroke-width="1.6"/><polyline points="${pts0}" fill="none" stroke="${C.acc}" stroke-width="1.3" stroke-dasharray="5 3"/>`;
      // opisy: podstawa, środek, głowica (wartości obliczeniowe z przekrojów)
      r.secs.forEach(sc2 => { const y = Y(sc2.xi), v = tot[Math.round(sc2.xi * n)]; s += `<circle cx="${X(v)}" cy="${y}" r="2.6" fill="${C.red}"/>` + tx(Math.min(W - 4, X(v) + (v >= 0 ? 5 : -5)), y + (sc2.key === 'top' ? 12 : sc2.key === 'base' ? -5 : 4), fmt(sc2.M / 1e6, 1), { fs: 9.5, c: C.red, a: v >= 0 ? 'start' : 'end', w: 600 }); });
      s += `<g font-size="9.5"><line x1="8" y1="${H - 42}" x2="24" y2="${H - 42}" stroke="${C.acc}" stroke-dasharray="5 3"/>` + tx(28, H - 39, 'M₀ – I rząd', { fs: 9.5, a: 'start', c: C.ink2 }) + `<line x1="100" y1="${H - 42}" x2="116" y2="${H - 42}" stroke="${C.red}" stroke-width="1.6"/>` + tx(120, H - 39, 'M_Ed [kNm]', { fs: 9.5, a: 'start', c: C.ink2 }) +
        (o.mrd || o.mrdP ? `<line x1="8" y1="${H - 28}" x2="24" y2="${H - 28}" stroke="${C.ok}" stroke-width="1.5" ${o.mrd ? '' : 'stroke-dasharray="7 3"'}/>` + tx(28, H - 25, o.mrd ? 'M_Rd – przyjęte' + (o.mrdP ? ' (- - wymagane)' : '') : 'M_Rd – zbrojenie wymagane', { fs: 9.5, a: 'start', c: C.ink2 }) : '') + '</g>';
      // proponowane zbrojenie (dobór w tle) – opis przy największym momencie; kliknięcie – wybór średnicy
      if (o.prop || o.cur) {
        void tot;
        const t1 = o.cur ? `przyjęte: ${o.cur}` : '', t2 = o.prop ? (o.prop.pend ? 'dobór zbrojenia…' : o.prop.txt ? `${o.prop.txt} ▾` : o.prop.err ? 'brak – przekrój za mały' : '') : '';
        const big = !o.cur && o.prop && o.prop.txt, lines = [t1, t2].filter(Boolean), tw = Math.max(big ? 98 : 0, Math.max(t1.length, t2.length) * (big ? 7 : 5.6) + 12), bx = W - tw - 6;
        const yy = 62;
        s += `<g class="dsel" data-dsel="${dir}" style="cursor:pointer"><title>Zbrojenie wymagane (dobór: najmniejsza masa stali spełniająca wszystkie warunki przy obecnych wymiarach) – kliknij, aby wybrać średnicę prętów</title><rect x="${bx}" y="${yy - (big ? 22 : 11)}" width="${Math.max(tw, big ? 98 : 0)}" height="${lines.length * 13 + (big ? 18 : 5)}" rx="4" fill="#ffffff" fill-opacity="0.92" stroke="${C.ok}" stroke-width="1"/>` +
          (big ? tx(bx + 6, yy - 10, 'zbrojenie wymagane', { fs: 8.5, a: 'start', c: C.mut }) : '') +
          lines.map((t, i) => tx(bx + 6, yy + i * 13 + (big ? 3 : 0), t, { fs: big ? 12 : 10, a: 'start', c: i === lines.length - 1 && o.prop ? (o.prop.err ? C.red : C.ok) : C.ink, w: 700 })).join('') + '</g>';
      }
    } else if (mode === 'N') {
      const mx = Math.max(Math.abs(fr.Nbot), 1), sc = (W - cx - 40) / mx * 0.8;
      s += `<polygon points="${cx},${Y(0)} ${cx + fr.Nbot * sc},${Y(0)} ${cx + fr.Ntop * sc},${Y(1)} ${cx},${Y(1)}" fill="${C.vio}" fill-opacity="0.12" stroke="${C.vio}"/>` + tx(cx + fr.Nbot * sc + 4, Y(0) - 4, fmt(fr.Nbot / 1e3, 0), { fs: 9.5, c: C.vio, a: 'start' }) + tx(cx + fr.Ntop * sc + 4, Y(1) + 12, fmt(fr.Ntop / 1e3, 0), { fs: 9.5, c: C.vio, a: 'start' });
      s += tx(8, H - 25, 'N_Ed [kN] – z ciężarem własnym', { fs: 9.5, a: 'start', c: C.ink2 });
    } else if (mode === 'V') {
      // siła poprzeczna V_Ed = dM_Ed/dx (z II rzędem), nośność V_Rd,c i V_Rd,s; strefy strzemion (kliknięcie – zmiana)
      const ms = D.momentSeries(R, oc, dir), n = ms.tot.length - 1, Lm = g.L / 1000;
      const V = D.vSeries(R, oc, dir); void Lm;
      const q = (R.sh || {})[dir], VRc = q ? q.VRdc / 1e3 : 0, VRs = q && q.VRds ? q.VRds / 1e3 : 0;
      const vm = Math.max(...V.map(Math.abs), 1), showRc = VRc > 0 && VRc <= 4 * vm, sc = (W - cx - 40) / Math.max(vm, showRc ? VRc : 0) * 0.85, X = v => Math.max(4, Math.min(W - 4, cx + v * sc));
      if (VRc > 0 && !showRc) s += tx(W - 6, 44, `V_Rd,c = ${fmt(VRc, 0)} kN (poza skalą)`, { fs: 9, a: 'end', c: C.ok });
      const pts = V.map((v, i) => `${X(Math.abs(v)).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ');
      s += `<polygon points="${cx},${Y(0)} ${pts} ${cx},${Y(1)}" fill="${C.red}" fill-opacity="0.12"/><polyline points="${pts}" fill="none" stroke="${C.red}" stroke-width="1.5"/>`;
      if (showRc) s += `<line x1="${X(VRc)}" y1="${Y(1)}" x2="${X(VRc)}" y2="${Y(0)}" stroke="${C.ok}" stroke-width="1.3" stroke-dasharray="6 3"/>` + tx(X(VRc) - 3, Y(1) + 12, `V_Rd,c = ${fmt(VRc, 0)}`, { fs: 9, c: C.ok, a: 'end' });
      const iV = V.reduce((a2, v, i) => (Math.abs(v) > Math.abs(V[a2]) ? i : a2), 0); s += `<circle cx="${X(Math.abs(V[iV]))}" cy="${Y(iV / n)}" r="2.6" fill="${C.red}"/>` + tx(X(Math.abs(V[iV])) + 4, Y(iV / n) - 4, fmt(Math.abs(V[iV]), 1), { fs: 9.5, c: C.red, a: 'start', w: 600 });
      const T = R.ties;
      if (T && R.lay.n) {
        const zx = cx - cw / 2 - 30, band = (y0, y1, txt, k) => `<g class="stzone" data-tz="${k}"><title>Strzemiona ${txt} – kliknij, aby zmienić</title><rect x="${zx - 4}" y="${Y(y1 / g.L)}" width="22" height="${Math.max(4, Y(y0 / g.L) - Y(y1 / g.L))}" fill="${C.tie}" fill-opacity="${k === 'mid' ? 0.08 : 0.2}" stroke="${C.tie}" stroke-width="0.8"/></g>` + tx(zx - 7, (Y(y0 / g.L) + Y(y1 / g.L)) / 2 + 3, txt, { fs: 9, c: C.tie, a: 'end', w: 600 });
        s += band(0, T.zBot, `⌀${R.lay.dt}/${T.sRed}`, 'bot');
        if (g.L - T.zBot - T.zTop > 1) s += band(T.zBot, g.L - T.zTop, `⌀${R.lay.dt}/${T.s}`, 'mid');
        if (T.zTop > 1) s += band(g.L - T.zTop, g.L, `⌀${R.lay.dt}/${T.sRed}`, 'top');
      }
      s += tx(8, H - 39, `V_Ed = dM_Ed/dx [kN]${q ? `; V_Ed,max = ${fmt(q.VEd / 1e3, 1)} kN` : ''}`, { fs: 9.5, a: 'start', c: C.ink2 }) + tx(8, H - 25, `z lewej – strzemiona w strefach (kliknij)${VRs ? `; V_Rd,s = ${fmt(VRs, 0)} kN` : ''}`, { fs: 9, a: 'start', c: C.mut });
    } else if (mode === 'R') {
      // reakcje podpór (siły na fundament i strop) – wartości obliczeniowe kombinacji, z imperfekcją i II rzędem
      const ms = D.momentSeries(R, oc, dir), n = ms.tot.length - 1, Lm = g.L / 1000;
      const VV = D.vSeries(R, oc, dir), Vat = i => VV[i]; void Lm;
      const fixB = ['cant', 'fp', 'ff', 'ffs'].includes(sch), supT = sch !== 'cant', fixT = sch === 'ff' || sch === 'ffs';
      const arrH = (y, v, lab) => { const sg = v >= 0 ? -1 : 1, xa = cx + sg * (cw / 2 + 2); return `<g stroke="${C.ok}" fill="${C.ok}"><line x1="${xa + sg * 30}" y1="${y}" x2="${xa}" y2="${y}" stroke-width="1.7"/><path d="M${xa},${y} l${sg * 8},-4 v8z"/></g>` + tx(xa + sg * 33, y + 3.5, lab, { fs: 9.5, c: C.ok, a: sg > 0 ? 'start' : 'end', w: 600 }); };
      const arcM = (y, v, lab, up) => `<path d="M${cx + cw / 2 + 8},${y + (up ? 12 : -12)} a14,14 0 0,${v >= 0 ? 1 : 0} 0,${up ? -24 : 24}" fill="none" stroke="${C.ok}" stroke-width="1.5"/>` + tx(cx + cw / 2 + 26, y + (up ? -8 : 14), lab, { fs: 9.5, c: C.ok, a: 'start', w: 600 });
      const N0 = fr.Nbot / 1e3, Vb = Vat(0), Vt = Vat(n), Mb = ms.tot[0], Mt = ms.tot[n];
      s += `<g stroke="${C.ok}" fill="${C.ok}"><line x1="${cx + cw / 2 + 40}" y1="${Y(0) + 26}" x2="${cx + cw / 2 + 40}" y2="${Y(0) + 4}" stroke-width="1.8"/><path d="M${cx + cw / 2 + 36},${Y(0) + 12} l4,-8 l4,8z"/></g>` + tx(cx + cw / 2 + 46, Y(0) + 20, `R_N = ${fmt(N0, 0)} kN`, { fs: 9.5, c: C.ok, a: 'start', w: 600 });
      s += arrH(Y(0) - 6, Vb, `H = ${fmt(Math.abs(Vb), 1)} kN`);
      if (fixB || Math.abs(Mb) > 0.05) s += arcM(Y(0) - 26, Mb, `M = ${fmt(Math.abs(Mb), 1)} kNm`, true);
      if (supT) s += arrH(Y(1) + 8, -Vt, `H = ${fmt(Math.abs(Vt), 1)} kN`);
      if (supT && (fixT || Math.abs(Mt) > 0.05)) s += arcM(Y(1) + 30, Mt, `M = ${fmt(Math.abs(Mt), 1)} kNm`, false);
      s += tx(8, H - 39, 'Reakcje (obliczeniowe, z e_i i II rzędem)', { fs: 9.5, a: 'start', c: C.ink2 }) + tx(8, H - 25, 'tabela reakcji od obciążeń – pod schematem', { fs: 9, a: 'start', c: C.mut });
    } else if (mode === 'buck') {
      // postać wyboczenia i długość wyboczeniowa
      const n = 40, amp = 22; let p = '';
      for (let i = 0; i <= n; i++) { const xi = i / n; let v = sch === 'cant' ? 1 - Math.cos(Math.PI * xi / 2) : sch === 'ffs' ? (1 - Math.cos(Math.PI * xi)) / 2 : window.EC2.m2Shape(sch, true, xi); p += `${(cx - cw / 2 - 8 - v * amp).toFixed(1)},${Y(xi).toFixed(1)} `; }
      s += `<polyline points="${p}" fill="none" stroke="${C.warn}" stroke-width="1.4" stroke-dasharray="6 3"/>`;
      // wartości: e_i (imperfekcja), e_2 (ugięcie II rzędu) w miejscu największego wygięcia, l₀, λ / λ_lim, N_B
      let iMx = 0, vMx = 0; for (let i = 0; i <= n; i++) { const xi = i / n, v = sch === 'cant' ? 1 - Math.cos(Math.PI * xi / 2) : sch === 'ffs' ? (1 - Math.cos(Math.PI * xi)) / 2 : window.EC2.m2Shape(sch, true, xi); if (Math.abs(v) > vMx) { vMx = Math.abs(v); iMx = i; } }
      const NEd = r ? Math.max(1, (B.braced ? fr.Nmid : fr.Nbot)) : 1, e2 = r && isFinite(r.M2) && r.M2 > 0 ? r.M2 / NEd : 0, ym = Y(iMx / n), xm = cx - cw / 2 - 8 - vMx * amp;
      s += `<circle cx="${xm}" cy="${ym}" r="2.8" fill="${C.warn}"/><line x1="${xm}" y1="${ym}" x2="${cx - cw / 2}" y2="${ym}" stroke="${C.warn}" stroke-width="0.8" stroke-dasharray="2 2"/>`;
      const eT = (r ? r.ei : 0) + (isFinite(e2) ? e2 : 0);
      s += tx(xm + 2, ym - 8, `${fmt(eT, 1)}`, { fs: 10, a: 'middle', c: C.red, w: 700 });
      s += tx(8, H - 52, `e_i = ${fmt(r ? r.ei : 0, 1)} mm, e_2 = ${r && r.slender ? (isFinite(r.M2) ? fmt(e2, 1) : '∞') : '0'} mm → e_i + e_2 = ${fmt(eT, 1)} mm`, { fs: 9.5, a: 'start', c: C.red, w: 600 });
      s += tx(8, H - 39, `l₀ = ${fmt(B.l0 / 1000, 2)} m (β = ${fmt(B.beta, 2)}), λ = ${fmt(B.lam, 1)} ${r && r.slender ? '>' : '≤'} λ_lim = ${r ? fmt(r.lamLim, 1) : '—'}`, { fs: 9.5, a: 'start', c: C.ink2 });
      s += tx(8, H - 25, r && r.NB ? `N_B = ${fmt(r.NB / 1e3, 0)} kN, N_Ed = ${fmt(NEd / 1e3, 0)} kN` : `N_Ed = ${fmt(NEd / 1e3, 0)} kN; wygięcie e_i + e_2 – w miejscu największego ugięcia`, { fs: 9, a: 'start', c: C.mut });
    }
    s += tx(8, H - 9, `${(oc.c.name || '').slice(0, 40)} · N_Ed,głowica = ${fmt(NT / 1e3, 0)} kN`, { fs: 9, a: 'start', c: C.mut });
  }
  // wymiary
  if (o.dims !== false) s += dimV(cx - cw / 2 - 46, Y(1), Y(0), `L = ${fmt(g.L / 1000, 2)} m`, { fs: 10 });
  // na środku słupa: klasa betonu i przekrój × długość (jak w BelkaŻB 2.10 – na środku przęsła)
  if (o.cls) s += tx(cx + 3, Y(xiLab), `${o.cls} · ${o.sec || ''} × ${fmt(g.L / 1000, 2)} m`, { fs: 8.5, rot: -90, c: C.ink2, w: 600 });
  s += tx(W - 6, 16, `l₀ = ${fmt(B.l0 / 1000, 2)} m`, { fs: 10.5, a: 'end', w: 600, c: C.warn }) + tx(W - 6, 30, `λ = ${fmt(B.lam, 1)}`, { fs: 10, a: 'end', c: C.ink2 });
  return s + '</svg>';
};

/* ------------------------------------------------------- wykres xy (interakcja) */
// o: {W, H, title, xl, yl, curves:[{pts:[[x,y]], c, fill, dash, l}], points:[{x,y,c,r,l,gov}], sym:true}
D.xyChart = function (o) {
  const W = o.W || 420, H = o.H || 380, ml = 56, mr = 16, mt = 40, mb = 42;
  const xs = [], ys = [];
  (o.curves || []).forEach(c => c.pts.forEach(p => { xs.push(p[0]); ys.push(p[1]); }));
  (o.points || []).forEach(p => { xs.push(p.x); ys.push(p.y); });
  let xmin = Math.min(0, ...xs), xmax = Math.max(0, ...xs), ymin = Math.min(0, ...ys), ymax = Math.max(0, ...ys);
  if (o.sym) { const a = Math.max(Math.abs(xmin), Math.abs(xmax)); xmin = -a; xmax = a; }
  if (o.symY) { const a = Math.max(Math.abs(ymin), Math.abs(ymax)); ymin = -a; ymax = a; }
  const px = (xmax - xmin) * 0.06 || 1, py = (ymax - ymin) * 0.06 || 1; xmin -= px; xmax += px; ymin -= py; ymax += py;
  const X = x => ml + (x - xmin) / (xmax - xmin) * (W - ml - mr), Y = y => H - mb - (y - ymin) / (ymax - ymin) * (H - mt - mb);
  let s = svgOpen(W, H, 'class="xychart"');
  s += tx(ml - 40, 16, o.title || '', { fs: 12, w: 650, a: 'start' });
  niceTicks(ymin, ymax, 7).forEach(t => { s += `<line x1="${ml}" y1="${Y(t)}" x2="${W - mr}" y2="${Y(t)}" stroke="${C.grid}"/>` + tx(ml - 5, Y(t) + 3.5, fmt(t, 0), { fs: 9.5, c: C.mut, a: 'end' }); });
  niceTicks(xmin, xmax, 7).forEach(t => { s += `<line x1="${X(t)}" y1="${mt}" x2="${X(t)}" y2="${H - mb}" stroke="${C.grid2}"/>` + tx(X(t), H - mb + 13, fmt(t, 0), { fs: 9.5, c: C.mut }); });
  s += `<line x1="${ml}" y1="${Y(0)}" x2="${W - mr}" y2="${Y(0)}" stroke="${C.concL}"/><line x1="${X(0)}" y1="${mt}" x2="${X(0)}" y2="${H - mb}" stroke="${C.concL}"/>`;
  s += tx((ml + W - mr) / 2, H - 6, o.xl || '', { fs: 10.5, c: C.ink2 }) + tx(13, (mt + H - mb) / 2, o.yl || '', { fs: 10.5, c: C.ink2, rot: -90 });
  (o.curves || []).forEach(c => {
    const pts = c.pts.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
    s += c.fill ? `<polygon points="${pts}" fill="${c.fill}" fill-opacity="${c.fo || 0.08}" stroke="${c.c}" stroke-width="${c.w || 1.6}" ${c.dash ? `stroke-dasharray="${c.dash}"` : ''}/>` : `<polyline points="${pts}" fill="none" stroke="${c.c}" stroke-width="${c.w || 1.6}" ${c.dash ? `stroke-dasharray="${c.dash}"` : ''}/>`;
  });
  (o.points || []).forEach(p => { s += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${p.r || 2.6}" fill="${p.c || C.acc}" ${p.gov ? `stroke="#ffffff" stroke-width="1"` : 'fill-opacity="0.75"'} ${p.ci !== undefined ? `data-ci="${p.ci}" style="cursor:pointer"` : ''}><title>${esc(p.t || '')}</title></circle>`; if (p.l) s += tx(X(p.x) + 6, Y(p.y) - 6, p.l, { fs: 9.5, c: p.c || C.acc, a: 'start', w: 600 }); });
  // legenda
  let ly = mt + 4; (o.legend || []).forEach(l => { s += `<line x1="${W - mr - 150}" y1="${ly}" x2="${W - mr - 134}" y2="${ly}" stroke="${l.c}" stroke-width="2" ${l.dash ? `stroke-dasharray="${l.dash}"` : ''}/>` + (l.dot ? `<circle cx="${W - mr - 142}" cy="${ly}" r="3" fill="${l.c}"/>` : '') + tx(W - mr - 130, ly + 3.5, l.l, { fs: 9.5, a: 'start', c: C.ink2 }); ly += 13; });
  return s + '</svg>';
};
// krzywa interakcji N–M w kierunku (zamknięta: M > 0 i M < 0)
D.interactionSVG = function (R, dir, o) {
  o = o || {};
  const U = R.dirs[dir].U;
  let loop;
  if (U.rotTab) { const t = U.rotTab; loop = t.Ns.map((N, i) => [(t.P[i] || 0) / 1e6, N / 1e3]).concat(t.Ns.map((N, i) => [-(t.Q[i] || 0) / 1e6, N / 1e3]).reverse()); }
  else {
    const P = U.pos.curve(90).map(([M, N]) => [M / 1e6, N / 1e3]);
    const Nn = U.neg.curve(90).map(([M, N]) => [-M / 1e6, N / 1e3]);
    loop = P.concat(Nn.reverse());
  }
  const pts = [];
  const res = R.res || [], govC = o.gov;
  res.forEach(q => { const r = q[dir]; r.secs.forEach(sc => { pts.push({ x: (sc.sg || 1) * sc.M / 1e6, y: sc.N / 1e3, c: q.ci === govC ? C.red : C.acc, r: q.ci === govC ? 4 : 2.4, gov: q.ci === govC, ci: q.ci, t: `${q.c.name} – ${sc.key === 'base' ? 'podstawa' : sc.key === 'top' ? 'głowica' : 'środek'}: N = ${fmt(sc.N / 1e3, 1)} kN, M = ${fmt(sc.M / 1e6, 1)} kNm, η = ${fmt(sc.u * 100, 0)}%` }); }); });
  pts.sort((a, b) => (a.gov ? 1 : 0) - (b.gov ? 1 : 0));
  return D.xyChart({ W: o.W || 420, H: o.H || 400, title: o.title || (dir === 'y' ? 'Krzywa interakcji N–M_y (płaszczyzna h)' : 'Krzywa interakcji N–M_z (płaszczyzna b)'), xl: dir === 'y' ? 'M_y [kNm]' : 'M_z [kNm]', yl: 'N [kN] (ściskanie +)', curves: [{ pts: loop, c: C.ok, fill: C.ok, fo: 0.07 }], points: pts, sym: true,
    legend: [{ c: C.ok, l: 'nośność N_Rd – M_Rd' }, { c: C.acc, l: 'kombinacje (M_Ed z II rz.)', dot: true }, { c: C.red, l: 'kombinacja decydująca', dot: true }] });
};
// kontur M_y – M_z przy N (metoda włókien)
D.contourSVG = function (R, N, pts, o) {
  o = o || {};
  if (!R.bx) return '';
  const ct = R.bx.contour(N); if (!ct) return '';
  const loop = ct.map(([My, Mz]) => [Mz / 1e6, My / 1e6]);
  loop.push(loop[0]);
  return D.xyChart({ W: o.W || 400, H: o.H || 400, title: o.title || `Kontur nośności M_z – M_y przy N = ${fmt(N / 1e3, 0)} kN`, xl: 'M_z [kNm]', yl: 'M_y [kNm]', curves: [{ pts: loop, c: C.ok, fill: C.ok, fo: 0.07 }], points: pts, sym: true, symY: true,
    legend: [{ c: C.ok, l: 'kontur M_Rd (włókna)' }, { c: C.red, l: 'M_Ed (decydujące)', dot: true }] });
};

/* -------------------------------------------- wykres wartości na wysokości słupa */
// o: {W, H, L (mm), series:[{v: Float64Array/[] (ξ = i/n), c, l, dash, fill}], title, unit, marks}
D.heightChart = function (o) {
  const W = o.W || 260, H = o.H || 380, ml = 40, mr = 16, mt = 42, mb = 38;
  const all = o.series.flatMap(s => Array.from(s.v)).concat([0]);
  let vmin = Math.min(...all), vmax = Math.max(...all); if (vmax - vmin < 1e-9) { vmax += 1; vmin -= 1; }
  const pad = (vmax - vmin) * 0.12; vmin -= pad; vmax += pad;
  const X = v => ml + (v - vmin) / (vmax - vmin) * (W - ml - mr), Y = xi => mt + (1 - xi) * (H - mt - mb);
  // dane wykresu do kursora (wartości w miejscu kursora) i znaczników (kliknięcie) – wspólne dla wykresów zakładki
  const cid = 'h' + (++D.chSeq);
  D.CH[cid] = { W, H, ml, mr, mt, mb, vmin, vmax, L: (o.L || 1000) / 1000, unit: o.cu || '', dp: o.dp !== undefined ? o.dp : 1, title: o.title || '', key: o.key || '', series: o.series.map(se => ({ v: Array.from(se.v), c: se.c, l: se.l || o.sl || '' })) };
  let s = svgOpen(W, H, `class="hchart" data-cid="${cid}"`);
  s += tx(6, 14, o.title || '', { fs: 11.5, w: 650, a: 'start' });
  niceTicks(vmin, vmax, 5).forEach(t => { s += `<line x1="${X(t)}" y1="${mt}" x2="${X(t)}" y2="${H - mb}" stroke="${C.grid}"/>` + tx(X(t), H - mb + 13, fmt(t, Math.abs(vmax - vmin) < 10 ? 1 : 0), { fs: 9.5, c: C.mut }); });
  const L = (o.L || 1000) / 1000;
  niceTicks(0, L, 5).forEach(t => { const y = Y(t / L); s += `<line x1="${ml}" y1="${y}" x2="${W - mr}" y2="${y}" stroke="${C.grid2}"/>` + tx(ml - 4, y + 3.5, fmt(t, 1), { fs: 9.5, c: C.mut, a: 'end' }); });
  s += `<line x1="${X(0)}" y1="${mt}" x2="${X(0)}" y2="${H - mb}" stroke="${C.concL}" stroke-width="1.2"/>`;
  s += tx((ml + W - mr) / 2, H - 6, o.unit || '', { fs: 10, c: C.ink2 }) + tx(11, (mt + H - mb) / 2, 'x [m] od podstawy', { fs: 9.5, c: C.ink2, rot: -90 });
  o.series.forEach(se => {
    const v = Array.from(se.v), n = v.length - 1;
    const pts = v.map((y, i) => `${X(y).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ');
    if (se.fill) s += `<polygon points="${X(0)},${Y(0)} ${pts} ${X(0)},${Y(1)}" fill="${se.fill}" fill-opacity="0.12"/>`;
    s += `<polyline points="${pts}" fill="none" stroke="${se.c}" stroke-width="${se.w || 1.6}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ''}/>`;
  });
  (o.marks || []).forEach(mk => { s += `<circle cx="${X(mk.v)}" cy="${Y(mk.xi)}" r="2.8" fill="${mk.c}"/>` + tx(X(mk.v) + (mk.v >= 0 ? 5 : -5), Y(mk.xi) + (mk.xi > 0.9 ? 12 : mk.xi < 0.1 ? -4 : 4), mk.l, { fs: 9.5, c: mk.c, a: mk.v >= 0 ? 'start' : 'end', w: 600 }); });
  let lx = 6; const ly = 28;
  o.series.filter(se => se.l).forEach(se => { s += `<line x1="${lx}" y1="${ly}" x2="${lx + 14}" y2="${ly}" stroke="${se.c}" stroke-width="2" ${se.dash ? `stroke-dasharray="${se.dash}"` : ''}/>` + tx(lx + 17, ly + 3.5, se.l, { fs: 9, a: 'start', c: C.ink2 }); lx += se.l.length * 5.2 + 30; });
  s += `<g class="pins"></g><g class="cur" style="display:none;pointer-events:none"><line class="curl" x1="${ml}" x2="${W - mr}" y1="0" y2="0" stroke="#1d5bb8" stroke-width="1" stroke-dasharray="3 2"/><g class="curd"></g><rect class="curbg" x="0" y="0" width="10" height="10" rx="3" fill="#ffffff" fill-opacity="0.93" stroke="#c9ced6"/><text class="curtx" x="0" y="0" font-size="10" fill="#1b2230"></text></g>`;
  return s + '</svg>';
};
D.CH = {}; D.chSeq = 0; D.ss = ss;
// wartość serii wykresu wysokościowego na wysokości x [m] (interpolacja liniowa)
D.hAt = (c, se, xm) => { const v = se.v, n = v.length - 1, t = Math.max(0, Math.min(1, xm / c.L)) * n, i = Math.min(n - 1, Math.floor(t)), f = t - i; return v[i] + (v[i + 1] - v[i]) * f; };
// rozkłady momentów kombinacji w kierunku: M0, M0 + e_i·N, M_Ed (z II rzędem)
// siła poprzeczna [kN]: I rząd z MES (bez skoków od momentów skupionych) + pochodna przyrostu od II rzędu (M₂·kształt)
D.vSeries = function (R, oc, dir) {
  const ms = D.momentSeries(R, oc, dir), n = ms.tot.length - 1, Lm = R.g.L / 1000, V1 = Array.from(oc.fr[dir].V).map(v => v / 1e3), d = ms.tot.map((t, i) => t - ms.imp[i]);
  return d.map((_, i) => { const a = Math.max(0, i - 1), b = Math.min(n, i + 1); return (V1[i] || 0) + (d[b] - d[a]) / ((b - a) / n * Lm); });
};
D.momentSeries = function (R, oc, dir) {
  const r = oc[dir], fr = oc.fr, B = R.buck[dir], E = window.EC2;
  const M0 = Array.from(fr[dir].M), n = M0.length - 1;
  const M2 = isFinite(r.M2) ? r.M2 : 0;
  const sgn = v => (r.braced ? (r.tr ? r.sg : r.sEnd) : (v !== 0 ? Math.sign(v) : r.sg)) || 1;
  const imp = M0.map((v, i) => v + sgn(v) * Math.max(0, fr.Nat(i / n)) * r.ei);
  const tot = M0.map((v, i) => { const xi = i / n; const sh = r.braced ? E.m2Shape(B.sch, true, xi) : E.m2Shape(B.sch, false, xi); return imp[i] + sgn(v) * M2 * sh; });
  return { M0: M0.map(v => v / 1e6), imp: imp.map(v => v / 1e6), tot: tot.map(v => v / 1e6) };
};

/* --------------------------------------------------------- rysunek zbrojenia słupa */
D.elevationSVG = function (R, S, o) {
  o = o || {};
  const g = R.g, lay = R.lay, sch = R.sched, T = R.ties, A = R.anch, cov = R.cov;
  if (!lay.n || !sch) return '';
  const det = S.det, L = g.L, hTop = det.hTop, found = det.base === 'found', cont = det.top === 'cont';
  const zTop = L + hTop + (cont ? A.l0 : 0), zBot = found ? -det.hF : -Math.min(400, A.l0 * 0.4);
  const span = zTop - zBot;
  const H = o.H || 720, W = o.W || 560, mt = 30, mb = 40;
  const k = (H - mt - mb) / span;
  const depth = g.dir.y.depth, wcol = Math.max(40, Math.min(150, depth * k * 1.0));
  const kx = wcol / depth;
  const cx = 210;
  const Y = z => H - mb - (z - zBot) * k, X = x => cx - wcol / 2 + x * kx;
  const bF = det.bF !== 'auto' && det.bF ? det.bF : depth + 800, bT = det.bTop !== 'auto' && det.bTop ? det.bTop : depth + 1200;
  const fw = Math.min(380, Math.max(wcol + 20, bF * kx)), sw = Math.min(400, Math.max(wcol + 30, bT * kx));
  let s = svgOpen(W, H, `class="elevsvg" data-zb="${zBot}" data-zt="${zTop}" data-k="${k}" data-hh="${H}" data-mb="${mb}" data-x0="${X(0)}" data-x1="${X(depth)}" data-l="${L}"`);
  // fundament / słup niższy (kliknięcie – wymiary)
  if (found) s += `<g class="fhit" data-el="found" style="cursor:pointer"><title>Fundament h_F = ${det.hF} mm, szerokość ${fmt(bF, 0)} mm – kliknij, aby zmienić wymiary i zakotwienie prętów startowych</title><rect x="${cx - fw / 2}" y="${Y(0)}" width="${fw}" height="${Y(zBot) - Y(0)}" fill="${C.conc}" stroke="${C.concL}"/>` + tx(cx + fw / 2 - 4, Y(zBot) - 6, `fundament h_F = ${det.hF}`, { fs: 9.5, a: 'end', c: C.mut }) + '</g>';
  else s += `<g class="fhit" data-el="found" style="cursor:pointer"><title>Słup kondygnacji niższej – kliknij, aby zmienić (fundament / słup niższy)</title><rect x="${X(0)}" y="${Y(0)}" width="${wcol}" height="${Y(zBot) - Y(0)}" fill="${C.conc}" stroke="${C.concL}" stroke-dasharray="5 3"/>` + tx(cx, Y(zBot) - 4, 'słup kondygnacji niższej', { fs: 9.5, c: C.mut }) + '</g>';
  // słup – odcinki zmiennego przekroju (szerokość wg wymiaru odcinka w płaszczyźnie h)
  const PP = (S.geom.parts || []).filter(p => !g.isPoly && p.z1 > p.z0);
  const redAt = z => { const p = PP.find(q => q.z0 * 1000 <= z + 1e-6 && q.z1 * 1000 >= z - 1e-6 && z > 0 && z < L); if (!p) return 0; const dp = g.round ? p.D : p.h; return Math.max(0, (depth - dp) / 2); };
  const cuts = [...new Set([0, L].concat(PP.flatMap(p => [Math.max(0, Math.min(L, p.z0 * 1000)), Math.max(0, Math.min(L, p.z1 * 1000))])))].sort((a2, b2) => a2 - b2);
  for (let i = 0; i < cuts.length - 1; i++) { const z0 = cuts[i], z1 = cuts[i + 1]; if (z1 - z0 < 1) continue; const rd = redAt((z0 + z1) / 2); s += `<rect x="${X(rd)}" y="${Y(z1)}" width="${(depth - 2 * rd) * kx}" height="${Y(z0) - Y(z1)}" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.2"/>`; if (rd > 0 && Y(z0) - Y(z1) > 40) s += tx(X(depth - rd) + 3, (Y(z0) + Y(z1)) / 2, g.round ? `⌀${depth - 2 * rd}` : `h = ${depth - 2 * rd}`, { fs: 8.5, rot: -90, c: C.mut }); }
  // strop / belka u góry (kliknięcie – wymiary)
  s += `<g class="fhit" data-el="slab" style="cursor:pointer"><title>Strop / belka nad słupem h = ${hTop} mm – kliknij, aby zmienić</title><rect x="${cx - sw / 2}" y="${Y(L + hTop)}" width="${sw}" height="${Y(L) - Y(L + hTop)}" fill="${C.conc}" stroke="${C.concL}"/>` + tx(cx + sw / 2 - 4, Y(L + hTop) - 4, `strop / belka h = ${hTop}`, { fs: 9.5, a: 'end', c: C.mut }) + '</g>';
  const CK = R.crank, up = S.upSec, upD = up && up.shape !== 'other' ? (g.round ? up.D : up.h) : 0, upR = upD && upD < depth ? (depth - upD) / 2 : 0;
  if (cont) s += `<rect x="${X(upR)}" y="${Y(zTop)}" width="${(depth - 2 * upR) * kx}" height="${Y(L + hTop) - Y(zTop)}" fill="none" stroke="${C.concL}" stroke-dasharray="5 3"/>` + tx(cx, Y(zTop) - 4, `słup kondygnacji wyższej${upR ? ` (${g.round ? '⌀' + upD : 'h = ' + upD})` : ''}`, { fs: 9.5, c: C.mut });
  // pręty: dwa skrajne w widoku (lewy / prawy)
  const ysB = lay.bars.map(q => q.y), xb = [Math.min(...ysB), Math.max(...ysB)];
  const main = sch.rows.find(r => r.kind === 'main'), start = sch.rows.find(r => r.kind === 'start');
  const zEnd = cont ? zTop : L + hTop - cov.cnom - lay.dt - main.d, zbS = -(found && start ? start.inF : 0);
  const tgt = {};
  // promień osi gięcia: φ_m/2 + ⌀/2, φ_m wg tab. 8.1N (4⌀ dla ⌀ ≤ 16, 7⌀ dla ⌀ > 16) – w skali rysunku (oś pozioma kx, pionowa k)
  const rAx = d => (d <= 16 ? 4 : 7) * d / 2 + d / 2;
  const crk = cont && CK && CK.ek > 0, sepUp = cont && CK && CK.sep;
  xb.forEach((xx, i) => {
    const sg = i === 0 ? 1 : -1, x = X(xx), dM = main.d, Rm = rAx(dM);
    // oś pręta: przesunięcia na zmianach przekroju (odgięcia 1:6 w większym odcinku) i w węźle stropu
    const pts = [[xx + sg * redAt(1), 0]];
    for (let j = 1; j < cuts.length - 1; j++) { const zc = cuts[j], rB = redAt(zc - 1), rT = redAt(zc + 1); if (Math.abs(rT - rB) < 0.5) continue; const lk = 6 * Math.abs(rT - rB); if (rT > rB) { pts.push([xx + sg * rB, zc - lk], [xx + sg * rT, zc]); } else { pts.push([xx + sg * rB, zc], [xx + sg * rT, zc + lk]); } }
    const rTop = redAt(L - 1);
    if (crk) { pts.push([xx + sg * rTop, CK.z0], [xx + sg * (rTop + CK.ek), CK.z1], [xx + sg * (rTop + CK.ek), zEnd]); }
    else if (cont && !sepUp) pts.push([xx + sg * rTop, zEnd]);
    const zE = sepUp ? L + hTop - cov.cnom - lay.dt - dM : zEnd;
    if (!cont || sepUp) {
      // koniec w stropie: odgięcie do wnętrza (anch) lub prosty (zakład osobnymi prętami)
      const xe = xx + sg * rTop;
      if (!cont) { const leg = Math.min(main.leg, depth * 1.6), rx = Rm * kx, ry = Rm * k, xp = X(xe);
        s += `<path d="M${X(pts[0][0])},${Y(0)} ${pts.slice(1).map(q => `L${X(q[0])},${Y(q[1])}`).join(' ')} L${xp},${Y(zE - Rm)} A${rx.toFixed(2)},${ry.toFixed(2)} 0 0 ${sg > 0 ? 1 : 0} ${xp + sg * rx},${Y(zE)} H${xp + sg * leg * kx}" fill="none" stroke="${C.bar}" stroke-width="2.2" stroke-linejoin="round"><title>Pręt ⌀${dM}: odgięcie w stropie – ramię ${fmt(main.leg, 0)} mm, φ_m = ${(dM <= 16 ? 4 : 7)}⌀ = ${(dM <= 16 ? 4 : 7) * dM} mm (tab. 8.1N)</title></path>`; }
      else s += `<polyline points="${pts.map(q => `${X(q[0])},${Y(q[1])}`).join(' ')} ${X(xe)},${Y(zE)}" fill="none" stroke="${C.bar}" stroke-width="2.2"/>`;
    } else s += `<polyline points="${pts.map(q => `${X(q[0])},${Y(q[1])}`).join(' ')}" fill="none" stroke="${C.bar}" stroke-width="2.2" stroke-linejoin="round"><title>Pręt ⌀${dM}${crk ? `: odgięcie (butelkowanie) e_k = ${fmt(CK.ek, 0)} mm na ${fmt(CK.lk, 0)} mm (1:6), dalej zakład l₀ = ${fmt(A.l0, 0)} mm w słupie wyżej` : `: zakład l₀ = ${fmt(A.l0, 0)} mm w słupie wyżej`}</title></polyline>`;
    // pręty słupa wyżej (zakład) – od góry stropu, po zewnętrznej stronie prętów odgiętych
    if (cont) { const xu = X(xx + sg * Math.max(upR, sepUp ? 0 : rTop)), zu0 = sepUp ? L + hTop - (A.lbd || A.l0) : L + hTop, zu1 = zTop; s += `<line x1="${xu}" y1="${Y(zu0)}" x2="${xu}" y2="${Y(zu1) - 6}" stroke="${C.mut}" stroke-width="2" stroke-dasharray="7 3"><title>${sepUp ? 'Pręty startowe słupa wyżej – zakotwione w słupie dolnym' : 'Pręty słupa wyżej – zakład z prętami odgiętymi'}</title></line>`; }
    // koniec pręta u góry – kliknięcie: odgięcie / zakład
    const xEnd = X(pts[pts.length - 1][0]);
    s += `<g class="bend" data-end="top" style="cursor:pointer"><title>${cont ? `Zakład z prętami słupa wyżej l₀ = ${fmt(A.l0, 0)} mm${crk ? `, odgięcie 1:6 (e_k = ${fmt(CK.ek, 0)} mm)` : ''}` : `Odgięcie w stropie ${fmt(main.leg, 0)} mm`} – kliknij, aby zmienić</title><circle cx="${cont ? xEnd : X(xx + sg * rTop)}" cy="${Y(cont ? (crk ? CK.z1 : zE) : zE)}" r="7" fill="transparent" stroke="${C.acc}" stroke-width="1" stroke-dasharray="2 2"/></g>`;
    // pręty startowe: stopka w fundamencie z łukiem gięcia w skali; albo pręty słupa niższego (zakład)
    const xs = x + sg * 4;
    if (found && start) { const dS = start.d, Rs = rAx(dS), rx = Rs * kx, ry = Rs * k, leg = Math.max(Rs + 20, start.leg) * kx;
      s += `<path d="M${xs - sg * leg},${Y(zbS)} H${xs - sg * rx} A${rx.toFixed(2)},${ry.toFixed(2)} 0 0 ${sg > 0 ? 0 : 1} ${xs},${Y(zbS + Rs)} V${Y(A.l0)}" fill="none" stroke="${C.acc}" stroke-width="2"><title>Pręt startowy ⌀${dS}: stopka ${fmt(start.leg, 0)} mm, φ_m = ${(dS <= 16 ? 4 : 7)}⌀ = ${(dS <= 16 ? 4 : 7) * dS} mm</title></path><g class="bend" data-end="foot" style="cursor:pointer"><title>Pręty startowe: zagłębienie ${fmt(start.inF, 0)} mm, stopka ${fmt(start.leg, 0)} mm – kliknij, aby zmienić</title><circle cx="${xs}" cy="${Y(zbS)}" r="7" fill="transparent" stroke="${C.acc}" stroke-width="1" stroke-dasharray="2 2"/></g>`; }
    else s += `<line x1="${xs}" y1="${Y(zBot)}" x2="${xs}" y2="${Y(A.l0)}" stroke="${C.mut}" stroke-width="2" stroke-dasharray="6 3"/>`;
    if (i === 1) { tgt.main = [X(xx + sg * redAt(L * 0.3)), Y(Math.min(zEnd, L) * 0.55 + 0.45 * Math.max(A.l0, 0))]; tgt.startUp = [xs, Y(A.l0 * 0.55)]; }
  });
  if (crk) { const xq = X(depth) + 6, yq = (Y(CK.z0) + Y(CK.z1)) / 2; s += tx(X(0) - 8, Y(CK.z0) + 3, `1:6`, { fs: 8.5, a: 'end', c: C.bar, w: 600 }); void xq; void yq; }
  if (sepUp) s += tx(cx, Y(L + hTop) - 6, `zmiana przekroju ${fmt(CK.red, 0)} mm > 75 – osobne pręty startowe`, { fs: 8.5, c: C.red });
  // strzemiona
  T.pos.forEach(z => { const rd = redAt(z); s += `<line x1="${X(rd) + 3}" y1="${Y(z)}" x2="${X(depth - rd) - 3}" y2="${Y(z)}" stroke="${C.tie}" stroke-width="1.2"/>`; });
  if (crk && !CK.inSlab) { const zz = Math.max(0, CK.z0 - 20); s += `<line x1="${X(0) + 3}" y1="${Y(zz)}" x2="${X(depth) - 3}" y2="${Y(zz)}" stroke="${C.tie}" stroke-width="2"><title>Dodatkowe strzemię w miejscu odgięcia (siła odchylająca ≈ F/6)</title></line>`; }
  // wymiary – lewa strona
  const xl = cx - wcol / 2 - 70;
  s += dimV(xl, Y(L), Y(0), `L = ${fmt(L, 0)}`);
  s += dimV(xl, Y(L + hTop), Y(L), `${hTop}`, { fs: 9.5 });
  const lapG = (a, b) => `<g class="lapdim" style="cursor:pointer"><title>Długość zakładu prętów l₀ = ${fmt(A.l0, 0)} mm${A.l0man ? ' (zadana ręcznie)' : ''} – kliknij, aby zmienić</title><rect x="${xl - 40}" y="${Y(b)}" width="26" height="${Y(a) - Y(b)}" fill="transparent"/>` + dimV(xl - 26, Y(b), Y(a), `l₀ = ${fmt(A.l0, 0)}${A.l0man ? '*' : ''}`, { fs: 9.5, c: A.l0man ? C.acc : undefined }) + '</g>';
  s += lapG(0, A.l0);
  if (cont) s += lapG(L + hTop, zTop);
  if (found && start) s += `<g class="fhit" data-el="found" style="cursor:pointer">${dimV(xl, Y(0), Y(zbS), `${fmt(start.inF, 0)}`, { fs: 9.5 })}</g>`;
  // strefy strzemion – prawa strona: linia wymiarowa z opisem pionowym, uchwyty granic stref (przeciąganie)
  const xr = cx + wcol / 2 + 16;
  [[50, T.zBot, T.sRed, 'bot'], [T.zBot, L - T.zTop, T.s, 'mid'], [L - T.zTop, L - 50, T.sRed, 'top']].filter(q => q[1] - q[0] > 1).forEach(([a, b, sp, kz]) => {
    const yA = Y(a), yB = Y(b), lab = `${fmt(b - a, 0)}: ⌀${lay.dt} co ${fmt(sp, 0)}`;
    s += `<g class="stzone" data-tz="${kz}" style="cursor:pointer"><title>Strefa strzemion: ${fmt(b - a, 0)} mm, ⌀${lay.dt} co ${fmt(sp, 0)} mm – kliknij, aby zmienić rozstaw lub długość strefy</title><rect x="${xr - 6}" y="${yB}" width="22" height="${Math.max(6, yA - yB)}" fill="transparent"/>` + dimV(xr, yB, yA, '', {}) +
      (yA - yB > lab.length * 5.4 + 6 ? tx(xr + 11, (yA + yB) / 2, lab, { fs: 9.5, rot: -90, c: sp < T.s ? C.tie : C.dim }) : tx(xr + 11, (yA + yB) / 2 + 3, `co ${fmt(sp, 0)}`, { fs: 8.5, c: sp < T.s ? C.tie : C.dim, a: 'start' })) + '</g>';
  });
  [['bot', T.zBot], ['top', L - T.zTop]].forEach(([kz, z]) => { if (z <= 0 || z >= L) return; s += `<g class="zdrag" data-zd="${kz}" style="cursor:ns-resize"><title>Przeciągnij, aby zmienić długość strefy zagęszczenia ${kz === 'bot' ? 'u dołu' : 'u góry'} (${fmt(kz === 'bot' ? T.zBot : T.zTop, 0)} mm)</title><rect x="${xr - 10}" y="${Y(z) - 5}" width="20" height="10" fill="transparent"/><line x1="${xr - 8}" y1="${Y(z)}" x2="${xr + 8}" y2="${Y(z)}" stroke="${C.acc}" stroke-width="2.4"/><path d="M${xr},${Y(z) - 7} l-3,3 h6z M${xr},${Y(z) + 7} l-3,-3 h6z" fill="${C.acc}"/></g>`; });
  // odnośniki pozycji: opis na półce poziomej, ukośna linia ze strzałką dokładnie do pręta / strzemienia
  const tie = sch.rows.find(r => r.kind === 'tie'), pins = sch.rows.filter(r => r.kind === 'pin');
  const zNear = zt => T.pos.reduce((a, z) => (Math.abs(z - zt) < Math.abs(a - zt) ? z : a), T.pos[0]);
  const items = [];
  items.push({ pos: main.pos, txt: `${main.n}⌀${main.d} l = ${fmt(main.len, 0)}`, t: tgt.main });
  if (start) items.push({ pos: start.pos, txt: `${start.n}⌀${start.d} l = ${fmt(start.len, 0)}`, t: tgt.startUp });
  const zT1 = zNear(L * 0.4); items.push({ pos: tie.pos, txt: `${tie.n} szt. ⌀${tie.d} l = ${fmt(tie.len, 0)}`, t: [X(depth * 0.72), Y(zT1)] });
  pins.forEach((p, i) => { const zp = zNear(L * (0.3 - i * 0.06)); items.push({ pos: p.pos, txt: `${p.n} szt. ⌀${p.d} l = ${fmt(p.len, 0)}`, t: [X(depth * (0.4 - i * 0.1)), Y(zp)] }); });
  const xLab = xr + 46, rowH = 22;
  items.sort((a, b2) => a.t[1] - b2.t[1]);
  let yPrev = -Infinity;
  items.forEach(it => {
    let yl = Math.max(it.t[1] - 26, yPrev + rowH, mt + 14); yl = Math.min(yl, H - mb - 4); yPrev = yl;
    const tw = it.txt.length * 5.6 + 24, x0 = xLab, y0 = yl + 4;
    const dx = it.t[0] - x0, dy = it.t[1] - y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, ah = 7, aw = 3.2;
    const bx = it.t[0] - ux * ah, by = it.t[1] - uy * ah;
    s += `<g class="ldr"><line x1="${x0}" y1="${y0}" x2="${x0 + tw}" y2="${y0}" stroke="${C.ink2}" stroke-width="0.9"/><line x1="${x0}" y1="${y0}" x2="${bx}" y2="${by}" stroke="${C.ink2}" stroke-width="0.9"/>` +
      `<path d="M${it.t[0]},${it.t[1]} L${bx - uy * aw},${by + ux * aw} L${bx + uy * aw},${by - ux * aw} Z" fill="${C.ink}"/>` +
      `<circle cx="${x0 + 9}" cy="${yl - 4}" r="7.5" fill="#ffffff" stroke="${C.ink}"/>` + tx(x0 + 9, yl - 0.8, String(it.pos), { fs: 9, w: 700 }) + tx(x0 + 20, yl, it.txt, { fs: 9.5, a: 'start' }) + '</g>';
  });
  // przekrój A–A
  const za = L * 0.5;
  s += `<g stroke="${C.ink}" stroke-width="1.2"><line x1="${X(0) - 18}" y1="${Y(za)}" x2="${X(0) - 4}" y2="${Y(za)}"/><line x1="${X(depth) + 4}" y1="${Y(za)}" x2="${X(depth) + 12}" y2="${Y(za)}"/></g>` + tx(X(0) - 22, Y(za) + 4, 'A', { fs: 11, w: 700, a: 'end' });
  s += tx(8, 16, 'Widok słupa – płaszczyzna h (rysunek poglądowy, wymiary w mm)', { fs: 11, w: 650, a: 'start' });
  return s + '</svg>';
};
// wyciągi prętów (kształty z wymiarami, bez skali)
D.extractsSVG = function (R, S, o) {
  o = o || {};
  const sch = R.sched; if (!sch) return '';
  const W = o.W || 760, rowH = 64, H = 20 + sch.rows.length * rowH;
  let s = svgOpen(W, H, 'class="extsvg"');
  sch.rows.forEach((r, i) => {
    const y = 20 + i * rowH + 30, x0 = 120, x1 = W - 170;
    s += `<g data-pos="${r.pos}" data-kind="${r.kind}" class="xrow"><title>${esc(r.name)} – kliknij, aby zmienić</title><rect x="2" y="${y - 30}" width="${W - 4}" height="${rowH - 2}" fill="transparent"/></g>`;
    s += `<circle cx="20" cy="${y - 6}" r="9" fill="#ffffff" stroke="${C.ink}"/>` + tx(20, y - 2.5, String(r.pos), { fs: 10, w: 700 }) + tx(34, y - 2, `${r.n}×⌀${r.d}`, { fs: 10.5, w: 650, a: 'start' }) + tx(34, y + 11, r.name.slice(0, 18), { fs: 8.5, a: 'start', c: C.mut });
    const col = r.kind === 'tie' || r.kind === 'pin' ? C.tie : r.kind === 'start' || r.kind === 'startUp' ? C.acc : C.bar;
    if (r.shape === 'I') s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${col}" stroke-width="2.4"/>` + tx((x0 + x1) / 2, y - 6, fmt(r.straight, 0), { fs: 10 });
    else if (r.shape === 'L') {
      // zagięcie łukiem o średnicy trzpienia wg tab. 8.1N (4⌀ dla ⌀ ≤ 16, 7⌀ dla ⌀ > 16) – promień w skali rysunku pręta
      const lg = Math.max(20, Math.min(56, r.leg / r.len * (x1 - x0) * 2)), km = r.d <= 16 ? 4 : 7, phm = km * r.d, sl = lg / Math.max(1, r.leg), rr = Math.max(2.5, Math.min(lg - 4, (phm / 2 + r.d / 2) * sl));   // promień osi w skali ramienia
      s += `<path d="M${x0},${y - lg} V${y - rr} A${rr},${rr} 0 0 0 ${x0 + rr},${y} H${x1}" fill="none" stroke="${col}" stroke-width="2.4"/>` + tx((x0 + x1) / 2, y - 6, fmt(r.straight, 0), { fs: 10 }) + tx(x0 - 6, y - lg / 2 + 3, fmt(r.leg, 0), { fs: 10, a: 'end' }) + tx(x0 + rr + 6, y + 12, `φ_m = ${km}⌀ = ${phm}`, { fs: 9, a: 'start', c: C.mut });
    }
    else if (r.shape === 'S') { const bt = r.bt, ht = r.ht, sc = Math.min(44 / ht, 120 / bt), w = bt * sc, h = ht * sc, xx = x0 + 30, yy = y - h / 2 - 4, km = r.d <= 16 ? 4 : 7, Rr = Math.max(2, (km * r.d / 2 + r.d / 2) * sc), hA = S.stir.hookA === 90 ? 90 : 135;
      s += `<rect x="${xx}" y="${yy}" width="${w}" height="${h}" rx="${Rr.toFixed(2)}" fill="none" stroke="${col}" stroke-width="2"/>` + D.cornerHooks([xx + Rr, yy + Rr], Rr, Math.min(r.hook * sc, h * 0.45), hA, col, 2) + tx(xx + w / 2, yy - 4, fmt(bt, 0), { fs: 9.5 }) + tx(xx + w + 6, y, fmt(ht, 0), { fs: 9.5, a: 'start' }) + tx(xx + w + 60, y + 3, `haki ${hA}°: ${fmt(r.hook, 0)} mm · φ_m = ${km}⌀ = ${km * r.d} mm`, { fs: 9.5, a: 'start', c: C.mut }); }
    else if (r.shape === 'K') {
      // pręt odgięty w węźle (butelkowanie): prosty a, odgięcie e_k na długości l_k (1:6), prosty b (zakład w słupie wyżej) – rysunek bez skali, odgięcie powiększone
      const tot = r.a + r.lk + r.b, wa = Math.max(60, (x1 - x0 - 30) * r.a / tot), wk = 30, wb = Math.max(40, x1 - x0 - wa - wk), dy = 10;
      s += `<polyline points="${x0},${y} ${x0 + wa},${y} ${x0 + wa + wk},${y - dy} ${x0 + wa + wk + wb},${y - dy}" fill="none" stroke="${col}" stroke-width="2.4" stroke-linejoin="round"/>` + tx(x0 + wa / 2, y + 13, fmt(r.a, 0), { fs: 10 }) + tx(x0 + wa + wk / 2, y + 13, `${fmt(r.lk, 0)}`, { fs: 9, c: C.mut }) + tx(x0 + wa + wk + wb / 2, y - dy - 5, fmt(r.b, 0), { fs: 10 }) + tx(x0 + wa + wk + 4, y + 3, `e = ${fmt(r.ek, 0)} (1:6)`, { fs: 9, a: 'start', c: C.mut });
    }
    else if (r.shape === 'O') { s += `<circle cx="${x0 + 50}" cy="${y - 4}" r="22" fill="none" stroke="${col}" stroke-width="2"/>` + tx(x0 + 82, y, `⌀ osi ${fmt(r.Dt, 0)}, haki ${fmt(r.hook, 0)}, φ_m = 4⌀ = ${4 * r.d}`, { fs: 9.5, a: 'start' }); }
    else if (r.shape === 'P') { const hA = S.stir.hookA === 90 ? 90 : 135, km = r.d <= 16 ? 4 : 7, Rr = 5; s += D.pinPath([x0 + 4, y - Rr], [x0 + 156, y - Rr], Rr, Rr, hA, 12, col, 2) + tx(x0 + 80, y + 12, fmt(r.len - 2 * r.hook, 0), { fs: 9.5 }) + tx(x0 + 176, y + 3, `haki ${hA}°: ${fmt(r.hook, 0)} mm · φ_m = ${km}⌀ = ${km * r.d} mm`, { fs: 9.5, a: 'start', c: C.mut }); }
    s += tx(W - 10, y + 3, `l = ${fmt(r.len, 0)} mm`, { fs: 10.5, a: 'end', w: 650 });
  });
  return s + '</svg>';
};
})();
