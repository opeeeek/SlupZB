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
      if (o.edit) s += `<circle cx="${cx}" cy="${cy}" r="${(lay.Rs + 8) * k}" fill="transparent" data-z="bars" class="zhit barsh" style="pointer-events:stroke" stroke="transparent" stroke-width="${Math.max(10, 30 * k)}"/>`;
    } else if (o.edit) s += `<circle cx="${cx}" cy="${cy}" r="${(g.D / 2 - g.t / 2) * k}" fill="transparent" stroke="transparent" stroke-width="${g.t * k}" data-z="bars" class="zhit"/>` + tx(cx, cy + 4, 'brak zbrojenia – kliknij', { fs: 11, c: C.mut });
    if (!o.small) {
      s += dimH(ox, ox + bw, oy - 16, `D = ${g.D}`) + dimH(X(g.D / 2 + g.Di / 2), ox + bw, cy, `t = ${g.t}`, { fs: 9.5 });
      if (lay.n) s += tx(cx, oy + bh + 26, `${lay.n}⌀${lay.dmax} · c_nom = ${c} mm`, { fs: 10.5, c: C.acc });
    }
  } else if (g.isPoly) {
    s += `<path d="M${g.outline.map(([x, y]) => `${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' L')} Z" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.4"/>`;
    if (lay.n) {
      const rr = ((lay.rin || 2 * dt) + dt / 2) * k;
      g.ties.forEach((t, ti) => {
        const x0 = X(t.x0 + c + dt / 2), y0 = Y(t.y0 + c + dt / 2), x1 = X(t.x1 - c - dt / 2), y1 = Y(t.y1 - c - dt / 2);
        s += `<path d="M${x0 + rr},${y0} H${x1 - rr} A${rr},${rr} 0 0 1 ${x1},${y0 + rr} V${y1 - rr} A${rr},${rr} 0 0 1 ${x1 - rr},${y1} H${x0 + rr} A${rr},${rr} 0 0 1 ${x0},${y1 - rr} V${y0 + rr} A${rr},${rr} 0 0 1 ${x0 + rr},${y0} Z" fill="none" stroke="${tieCol}" stroke-width="${tw}" ${o.edit ? 'data-z="ties" class="zhit tieh"' : ''}/>`;
        if (!o.small && ti === 0) { const P = [X(t.x0 + lay.offC), Y(t.y0 + lay.offC)], rad = (S.reb.dc / 2 + dt / 2) * k, L = Math.max(8, Math.max(10 * dt, 75) * k); [1, -1].forEach(sg => { const st = [P[0] + Math.SQRT1_2 * rad * sg, P[1] - Math.SQRT1_2 * rad * sg]; s += `<line x1="${st[0]}" y1="${st[1]}" x2="${st[0] + Math.SQRT1_2 * L}" y2="${st[1] + Math.SQRT1_2 * L}" stroke="${tieCol}" stroke-width="${tw}" stroke-linecap="round"/>`; }); }
      });
      lay.pins.forEach(p => { if (p.dir === 'v') s += `<line x1="${X(p.x)}" y1="${Y(p.y0)}" x2="${X(p.x)}" y2="${Y(p.y1)}" stroke="${tieCol}" stroke-width="${tw * 0.9}"/>`; else s += `<line x1="${X(p.x0)}" y1="${Y(p.y)}" x2="${X(p.x1)}" y2="${Y(p.y)}" stroke="${tieCol}" stroke-width="${tw * 0.9}"/>`; });
      s += barsSVG();
    }
    if (o.edit) g.rects.forEach(r => { s += `<rect x="${X(r.x0) + 2}" y="${Y(r.y0) + 2}" width="${(r.x1 - r.x0) * k - 4}" height="${(r.y1 - r.y0) * k - 4}" fill="transparent" data-z="bars" class="zhit barsh"/>`; });
    if (!lay.n && o.edit) s += tx(X(g.xc), Y(g.yc), 'brak zbrojenia – kliknij', { fs: 11, c: C.mut });
    if (!o.small) {
      const G = S.geom;
      s += `<g ${o.edit ? 'data-z="dims" class="zdim"' : ''}>`;
      if (g.shape === 'T') { const q = G.tee, xl = (q.bf - q.bw) / 2; s += dimH(ox, ox + bw, oy - 16, `b_f = ${q.bf}`) + dimV(ox - 18, oy, oy + bh, `h = ${q.h}`) + dimV(ox + bw + 16, oy, Y(q.hf), `h_f = ${q.hf}`, { fs: 9.5 }) + dimH(X(xl), X(xl + q.bw), oy + bh + 14, `b_w = ${q.bw}`, { below: true }); }
      else { const q = G.ang; s += dimH(ox, ox + bw, oy + bh + 14, `b = ${q.b}`, { below: true }) + dimV(ox - 18, oy, oy + bh, `h = ${q.h}`) + dimH(ox, X(q.th), oy - 16, `t = ${q.th}`) + dimV(ox + bw + 16, Y(q.h - q.tb), oy + bh, `t = ${q.tb}`, { fs: 9.5 }); }
      s += '</g>';
      if (lay.n) s += tx(ox, oy + bh + 40, `c_nom = ${c} mm · ${lay.n}⌀${lay.dmax}${lay.dmin !== lay.dmax ? '/' + lay.dmin : ''} · strz. ⌀${dt}${lay.pins.length ? ' · szpilki ' + lay.pins.length : ''}`, { fs: 10.5, c: C.acc, a: 'start' });
    }
  } else if (g.circ) {
    const cx = X(g.D / 2), cy = Y(g.D / 2), r = g.D / 2 * k;
    s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.4" ${o.edit ? 'data-z="dims" class="zhit"' : ''}/>`;
    if (lay.n) {
      const rt = (g.D / 2 - c - dt / 2) * k;
      s += `<circle cx="${cx}" cy="${cy}" r="${rt}" fill="none" stroke="${fail.ties ? C.red : C.tie}" stroke-width="${Math.max(1.4, dt * k)}" ${o.edit ? 'data-z="ties" class="zhit"' : ''}/>`;
      lay.bars.forEach((b, i) => { s += `<circle cx="${X(b.x)}" cy="${Y(b.y)}" r="${Math.max(2, b.d / 2 * k)}" fill="${fail.bars ? C.red : C.bar}" ${o.edit ? 'data-z="bars"' : ''}/>`; });
    }
    if (!o.small) {
      s += dimH(ox, ox + bw, oy - 16, `D = ${g.D}`);
      if (lay.n) s += tx(cx, oy + bh + 26, `${lay.n}⌀${lay.dmax} · c_nom = ${c} mm`, { fs: 10.5, c: C.acc });
    }
  } else {
    s += `<rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.4"/>`;
    if (lay.n) {
      const off = (c + dt / 2) * k, rr = ((lay.rin || 2 * dt) + dt / 2) * k;
      const x0 = ox + off, y0 = oy + off, x1 = ox + bw - off, y1 = oy + bh - off;
      const tieCol = fail.ties ? C.red : C.tie, tw = Math.max(1.3, dt * k);
      s += `<path d="M${x0 + rr},${y0} H${x1 - rr} A${rr},${rr} 0 0 1 ${x1},${y0 + rr} V${y1 - rr} A${rr},${rr} 0 0 1 ${x1 - rr},${y1} H${x0 + rr} A${rr},${rr} 0 0 1 ${x0},${y1 - rr} V${y0 + rr} A${rr},${rr} 0 0 1 ${x0 + rr},${y0} Z" fill="none" stroke="${tieCol}" stroke-width="${tw}" ${o.edit ? 'data-z="ties" class="zhit tieh"' : ''}/>`;
      // haki 135° w lewym górnym narożu
      const cb = lay.bars.find(b => b.corner) || lay.bars[0];
      if (cb && !o.small) {
        const P = [X(lay.offC), Y(lay.offC)], u = [Math.SQRT1_2, Math.SQRT1_2], nn = [Math.SQRT1_2, -Math.SQRT1_2], rad = (cb.d / 2 + dt / 2) * k, L = Math.max(8, Math.max(10 * dt, 75) * k);
        [1, -1].forEach(sg => { const st = [P[0] + nn[0] * rad * sg, P[1] + nn[1] * rad * sg]; s += `<line x1="${st[0]}" y1="${st[1]}" x2="${st[0] + u[0] * L}" y2="${st[1] + u[1] * L}" stroke="${tieCol}" stroke-width="${tw}" stroke-linecap="round"/>`; });
      }
      // szpilki
      lay.pins.forEach(p => {
        const sh = (p.d / 2 + dt / 2) * k;
        if (p.dir === 'h') { const x = X(p.x) + sh; s += `<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="${tieCol}" stroke-width="${tw * 0.9}" stroke-dasharray="${o.small ? '' : ''}"/><path d="M${x},${y0} l${-5},${5}" stroke="${tieCol}" stroke-width="${tw * 0.8}" fill="none"/><path d="M${x},${y1} l${-5},${-5}" stroke="${tieCol}" stroke-width="${tw * 0.8}" fill="none"/>`; }
        else { const y = Y(p.y) + sh; s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${tieCol}" stroke-width="${tw * 0.9}"/><path d="M${x0},${y} l${5},${-5}" stroke="${tieCol}" stroke-width="${tw * 0.8}" fill="none"/><path d="M${x1},${y} l${-5},${-5}" stroke="${tieCol}" stroke-width="${tw * 0.8}" fill="none"/>`; }
      });
      lay.bars.forEach(b => { s += `<circle cx="${X(b.x)}" cy="${Y(b.y)}" r="${Math.max(2, b.d / 2 * k)}" fill="${fail.bars ? C.red : C.bar}" ${!b.corner && !b.rest && !o.small ? `stroke="${C.warn}" stroke-width="1.2"` : ''}/>`; });
      if (o.edit) s += `<rect x="${ox + 2}" y="${oy + 2}" width="${bw - 4}" height="${bh - 4}" fill="transparent" data-z="bars" class="zhit barsh"/>`;
    } else if (o.edit) s += `<rect x="${ox}" y="${oy}" width="${bw}" height="${bh}" fill="transparent" data-z="bars" class="zhit"/>` + tx(ox + bw / 2, oy + bh / 2, 'brak zbrojenia – kliknij', { fs: 11, c: C.mut });
    if (!o.small) {
      s += `<g ${o.edit ? 'data-z="dims" class="zdim"' : ''}>` + dimH(ox, ox + bw, oy - 16, `b = ${g.b}`) + dimV(ox - 18, oy, oy + bh, `h = ${g.h}`) + '</g>';
      if (lay.n) {
        // odstępy osiowe prętów (łańcuch pod przekrojem i z prawej)
        const fb = lay.faces.b, fh = lay.faces.h;
        if (fb && fb.n > 2 && bw > 120) { const yy = oy + bh + 14; s += dimH(X(fb.pos[0]), X(fb.pos[fb.n - 1]), yy, `${fb.n - 1}×${fmt(fb.ctc, 0)}`, { below: true, fs: 9.5 }); }
        if (fh && fh.n > 2 && bh > 120) { s += dimV(ox + bw + 14, Y(fh.pos[0]), Y(fh.pos[fh.n - 1]), `${fh.n - 1}×${fmt(fh.ctc, 0)}`, { right: true, fs: 9.5 }); }
        s += tx(ox, oy + bh + 40, `c_nom = ${c} mm · ${lay.n}⌀${lay.dmax}${lay.dmin !== lay.dmax ? '/' + lay.dmin : ''} · strz. ⌀${dt}`, { fs: 10.5, c: C.acc, a: 'start' });
      }
    }
  }
  if (o.axes !== false && !o.small) {
    // osie lokalne: y wzdłuż b, z wzdłuż h (jak rys. 5.8 PN-EN 1992-1-1)
    const ax = W - 52, ay = H - 18;
    s += `<g stroke="${C.mut}" stroke-width="1" fill="${C.mut}"><line x1="${ax}" y1="${ay}" x2="${ax + 22}" y2="${ay}"/><path d="M${ax + 22},${ay - 3} l6,3 l-6,3z"/><line x1="${ax}" y1="${ay}" x2="${ax}" y2="${ay - 22}"/><path d="M${ax - 3},${ay - 22} l3,-6 l3,6z"/></g>` +
      tx(ax + 30, ay + 3.5, 'y', { fs: 9.5, c: C.mut, a: 'start' }) + tx(ax + 5, ay - 24, 'z', { fs: 9.5, c: C.mut, a: 'start' });
  }
  return s + '</svg>';
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

/* ------------------------------------------------------------ schemat słupa */
// dir: 'y' (płaszczyzna h) | 'z' (płaszczyzna b); o: {W, H, diag: 'M'|'N'|'none', combo, click}
D.schemeSVG = function (R, S, dir, o) {
  o = o || {};
  const g = R.g, B = R.buck[dir], sch = B.sch;
  const W = o.W || 300, H = o.H || 440;
  const mt = 96, mb = 54, cx = W * 0.44, hh = H - mt - mb;
  const depth = g.dir[dir].depth, cw = Math.max(14, Math.min(34, depth / 25));
  const Y = xi => mt + (1 - xi) * hh;                 // ξ = 0 – podstawa
  let s = svgOpen(W, H, `class="schemesvg" data-dir="${dir}"`);
  s += tx(8, 16, dir === 'y' ? 'Płaszczyzna h – zginanie M_y' : 'Płaszczyzna b – zginanie M_z', { fs: 11.5, w: 650, a: 'start' });
  s += tx(8, 30, `${B.schName.replace(/ \(.*\)/, '')}${B.braced ? '' : ''}`, { fs: 9.5, a: 'start', c: C.ink2 });
  // słup
  s += `<rect x="${cx - cw / 2}" y="${Y(1)}" width="${cw}" height="${hh}" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.2" data-sch="${dir}" class="schcol"/>`;
  // podpory
  const hatch = (x, y, w, up) => { let p = `<line x1="${x - w / 2}" y1="${y}" x2="${x + w / 2}" y2="${y}" stroke="${C.ink}" stroke-width="1.6"/>`; for (let i = 0; i <= 6; i++) { const xx = x - w / 2 + i * w / 6; p += `<line x1="${xx}" y1="${y}" x2="${xx - 6}" y2="${y + (up ? -7 : 7)}" stroke="${C.gnd}" stroke-width="0.9"/>`; } return p; };
  const fixedBot = ['cant', 'fp', 'ff', 'ffs'].includes(sch), pinBot = sch === 'pp';
  let sup = '';
  if (fixedBot) sup += hatch(cx, Y(0), cw + 26, false);
  if (pinBot) sup += `<path d="M${cx},${Y(0)} l-9,13 h18 z" fill="#ffffff" stroke="${C.ink}" stroke-width="1.3"/>` + hatch(cx, Y(0) + 13, 30, false);
  if (sch === 'pp' || sch === 'fp') sup += `<path d="M${cx},${Y(1)} l-9,-13 h18 z" fill="#ffffff" stroke="${C.ink}" stroke-width="1.3"/><line x1="${cx - 12}" y1="${Y(1) - 13}" x2="${cx + 12}" y2="${Y(1) - 13}" stroke="${C.ink}" stroke-width="1.6"/>` + tx(cx + 16, Y(1) - 6, 'przegub nieprzesuwny', { fs: 8.5, a: 'start', c: C.mut });
  if (sch === 'ff') sup += hatch(cx, Y(1), cw + 26, true);
  if (sch === 'ffs') sup += hatch(cx, Y(1) - 7, cw + 26, true) + `<circle cx="${cx - 8}" cy="${Y(1) - 3.5}" r="3" fill="none" stroke="${C.ink}"/><circle cx="${cx + 8}" cy="${Y(1) - 3.5}" r="3" fill="none" stroke="${C.ink}"/>` + tx(cx + 22, Y(1) - 10, 'przesuwne', { fs: 8.5, a: 'start', c: C.mut });
  if (sch === 'cant') sup += tx(cx + 14, Y(1) - 4, 'swobodny', { fs: 8.5, a: 'start', c: C.mut });
  s += `<g class="supp" data-sch="${dir}" style="cursor:pointer">${sup}<rect x="${cx - 40}" y="${Y(1) - 22}" width="80" height="22" fill="transparent"/><rect x="${cx - 40}" y="${Y(0)}" width="80" height="22" fill="transparent"/></g>`;
  // kombinacja do pokazania
  const res = R.res || [];
  const oc = o.combo !== undefined && res[o.combo] ? res[o.combo] : (res.length ? res.reduce((a, q) => (q[dir].u > a[dir].u ? q : a)) : null);
  if (oc) {
    const r = oc[dir], fr = oc.fr;
    // obciążenia (wartości obliczeniowe tej kombinacji)
    const NT = fr.Ntop;
    const tipY = Y(1) - ({ pp: 15, fp: 15, ff: 9, ffs: 16, cant: 2 }[sch] || 2);
    s += `<g stroke="${C.vio}" fill="${C.vio}"><line x1="${cx}" y1="${tipY - 34}" x2="${cx}" y2="${tipY}" stroke-width="1.8"/><path d="M${cx - 4},${tipY - 8} l4,8 l4,-8z"/></g>` + tx(cx - 6, tipY - 24, `N_Ed = ${fmt(NT / 1e3, 0)} kN`, { fs: 10, c: C.vio, a: 'end', w: 600 });
    // poziome: siły skupione w głowicy i obciążenie rozłożone (suma wkładów pozycji)
    let H0 = 0, q0 = 0;
    (R.items || []).forEach((it, i) => { const f = oc.c.f[i]; if (!f || it.kind === 'sw') return; H0 += f * (dir === 'y' ? it.Hh || 0 : it.Hb || 0); q0 += f * (dir === 'y' ? it.qh || 0 : it.qb || 0); });
    if (Math.abs(H0) > 1e-6) { const sg = H0 > 0 ? 1 : -1, xa = cx + sg * (cw / 2 + 4); s += `<g stroke="${C.acc}" fill="${C.acc}"><line x1="${xa + sg * 34}" y1="${Y(1) + 8}" x2="${xa}" y2="${Y(1) + 8}" stroke-width="1.6"/><path d="M${xa},${Y(1) + 8} l${-sg * 8},-4 v8z"/></g>` + tx(xa + sg * 36, Y(1) + 4, `H = ${fmt(Math.abs(H0), 1)} kN`, { fs: 9.5, c: C.acc, a: sg > 0 ? 'start' : 'end' }); }
    if (Math.abs(q0) > 1e-6) { const sg = q0 > 0 ? 1 : -1; let qq = ''; for (let i = 1; i < 8; i++) { const y = Y(i / 8), xa = cx - sg * (cw / 2 + 2); qq += `<line x1="${xa - sg * 18}" y1="${y}" x2="${xa}" y2="${y}"/><path d="M${xa},${y} l${-sg * 5},-2.5 v5z"/>`; } s += `<g stroke="${C.acc}" fill="${C.acc}" stroke-width="1">${qq}<line x1="${cx - sg * (cw / 2 + 20)}" y1="${Y(7 / 8)}" x2="${cx - sg * (cw / 2 + 20)}" y2="${Y(1 / 8)}"/></g>` + tx(cx - sg * (cw / 2 + 20), Y(7 / 8) - 8, `q = ${fmt(Math.abs(q0), 2)} kN/m`, { fs: 9.5, c: C.acc, a: sg > 0 ? 'end' : 'start' }); }
    // wykres
    const mode = o.diag || 'M';
    if (mode === 'M' && r) {
      const ms = D.momentSeries(R, oc, dir), n = ms.M0.length - 1;
      const vals = ms.M0.map(v => v * 1e6), tot = ms.tot.map(v => v * 1e6);
      const mx = Math.max(...tot.map(Math.abs), ...vals.map(Math.abs), 1);
      const sc = (W - cx - 40) / mx * 0.9;
      const X = v => cx + v * sc;
      const ptsT = tot.map((v, i) => `${X(v).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ');
      const pts0 = vals.map((v, i) => `${X(v).toFixed(1)},${Y(i / n).toFixed(1)}`).join(' ');
      s += `<polygon points="${cx},${Y(0)} ${ptsT} ${cx},${Y(1)}" fill="${C.red}" fill-opacity="0.12" stroke="none"/>`;
      s += `<polyline points="${ptsT}" fill="none" stroke="${C.red}" stroke-width="1.6"/><polyline points="${pts0}" fill="none" stroke="${C.acc}" stroke-width="1.3" stroke-dasharray="5 3"/>`;
      // opisy: podstawa, środek, głowica (wartości obliczeniowe z przekrojów)
      r.secs.forEach(sc2 => { const y = Y(sc2.xi), v = tot[Math.round(sc2.xi * n)]; s += `<circle cx="${X(v)}" cy="${y}" r="2.6" fill="${C.red}"/>` + tx(Math.min(W - 4, X(v) + (v >= 0 ? 5 : -5)), y + (sc2.key === 'top' ? 12 : sc2.key === 'base' ? -5 : 4), fmt(sc2.M / 1e6, 1), { fs: 9.5, c: C.red, a: v >= 0 ? 'start' : 'end', w: 600 }); });
      s += `<g font-size="9.5"><line x1="8" y1="${H - 30}" x2="24" y2="${H - 30}" stroke="${C.acc}" stroke-dasharray="5 3"/>` + tx(28, H - 27, 'M₀ – I rząd', { fs: 9.5, a: 'start', c: C.ink2 }) + `<line x1="100" y1="${H - 30}" x2="116" y2="${H - 30}" stroke="${C.red}" stroke-width="1.6"/>` + tx(120, H - 27, 'M_Ed – z e_i i II rzędem [kNm]', { fs: 9.5, a: 'start', c: C.ink2 }) + '</g>';
    } else if (mode === 'N') {
      const mx = Math.max(Math.abs(fr.Nbot), 1), sc = (W - cx - 40) / mx * 0.8;
      s += `<polygon points="${cx},${Y(0)} ${cx + fr.Nbot * sc},${Y(0)} ${cx + fr.Ntop * sc},${Y(1)} ${cx},${Y(1)}" fill="${C.vio}" fill-opacity="0.12" stroke="${C.vio}"/>` + tx(cx + fr.Nbot * sc + 4, Y(0) - 4, fmt(fr.Nbot / 1e3, 0), { fs: 9.5, c: C.vio, a: 'start' }) + tx(cx + fr.Ntop * sc + 4, Y(1) + 12, fmt(fr.Ntop / 1e3, 0), { fs: 9.5, c: C.vio, a: 'start' });
      s += tx(8, H - 27, 'N_Ed [kN] – z ciężarem własnym', { fs: 9.5, a: 'start', c: C.ink2 });
    } else if (mode === 'buck') {
      // postać wyboczenia i długość wyboczeniowa
      const n = 40, amp = 22; let p = '';
      for (let i = 0; i <= n; i++) { const xi = i / n; let v = sch === 'cant' ? 1 - Math.cos(Math.PI * xi / 2) : sch === 'ffs' ? (1 - Math.cos(Math.PI * xi)) / 2 : window.EC2.m2Shape(sch, true, xi); p += `${(cx - cw / 2 - 8 - v * amp).toFixed(1)},${Y(xi).toFixed(1)} `; }
      s += `<polyline points="${p}" fill="none" stroke="${C.warn}" stroke-width="1.4" stroke-dasharray="6 3"/>`;
      s += tx(8, H - 27, `postać wyboczenia (poglądowo), β = ${fmt(B.beta, 2)}`, { fs: 9.5, a: 'start', c: C.ink2 });
    }
    s += tx(8, H - 12, `${(oc.c.name || '').slice(0, 52)}`, { fs: 9, a: 'start', c: C.mut });
  }
  // wymiary
  s += dimV(cx - cw / 2 - 46, Y(1), Y(0), `L = ${fmt(g.L / 1000, 2)} m`, { fs: 10 });
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
  let s = svgOpen(W, H, 'class="hchart"');
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
  return s + '</svg>';
};
// rozkłady momentów kombinacji w kierunku: M0, M0 + e_i·N, M_Ed (z II rzędem)
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
  let s = svgOpen(W, H, 'class="elevsvg"');
  // fundament / słup niższy
  if (found) { const fw = wcol + 160; s += `<rect x="${cx - fw / 2}" y="${Y(0)}" width="${fw}" height="${Y(zBot) - Y(0)}" fill="${C.conc}" stroke="${C.concL}"/>` + tx(cx + fw / 2 - 4, Y(zBot) - 6, `fundament h_F = ${det.hF}`, { fs: 9.5, a: 'end', c: C.mut }); }
  else { s += `<rect x="${X(0)}" y="${Y(0)}" width="${wcol}" height="${Y(zBot) - Y(0)}" fill="${C.conc}" stroke="${C.concL}" stroke-dasharray="5 3"/>` + `<rect x="${cx - wcol / 2 - 70}" y="${Y(0) - 0}" width="${wcol + 140}" height="${Math.max(6, 200 * k)}" fill="${C.conc}" stroke="${C.concL}" transform="translate(0,${-Math.max(6, 200 * k)})" opacity="0"/>` + tx(cx, Y(zBot) - 4, 'słup kondygnacji niższej', { fs: 9.5, c: C.mut }); }
  // słup
  s += `<rect x="${X(0)}" y="${Y(L)}" width="${wcol}" height="${Y(0) - Y(L)}" fill="${C.conc}" stroke="${C.concL}" stroke-width="1.2"/>`;
  // strop / belka u góry
  const sw = wcol + 180;
  s += `<rect x="${cx - sw / 2}" y="${Y(L + hTop)}" width="${sw}" height="${Y(L) - Y(L + hTop)}" fill="${C.conc}" stroke="${C.concL}"/>` + tx(cx + sw / 2 - 4, Y(L + hTop) - 4, `strop / belka h = ${hTop}`, { fs: 9.5, a: 'end', c: C.mut });
  if (cont) s += `<rect x="${X(0)}" y="${Y(zTop)}" width="${wcol}" height="${Y(L + hTop) - Y(zTop)}" fill="none" stroke="${C.concL}" stroke-dasharray="5 3"/>` + tx(cx, Y(zTop) - 4, 'słup kondygnacji wyższej', { fs: 9.5, c: C.mut });
  // pręty: dwa skrajne w widoku (lewy/prawy)
  const ysB = lay.bars.map(q => q.y), xb = [Math.min(...ysB), Math.max(...ysB)];
  const main = sch.rows.find(r => r.kind === 'main'), start = sch.rows.find(r => r.kind === 'start');
  xb.forEach((xx, i) => {
    const x = X(xx);
    const zEnd = cont ? zTop : L + hTop - cov.cnom - lay.dt - main.d;
    s += `<line x1="${x}" y1="${Y(0)}" x2="${x}" y2="${Y(zEnd)}" stroke="${C.bar}" stroke-width="2.2"/>`;
    if (!cont) { const leg = main.leg * kx * 0.6, sg = i === 0 ? 1 : -1; s += `<line x1="${x}" y1="${Y(zEnd)}" x2="${x + sg * Math.max(14, leg)}" y2="${Y(zEnd)}" stroke="${C.bar}" stroke-width="2.2"/>`; }
    // pręty startowe / z niższej kondygnacji (przesunięte do wnętrza)
    const xs = x + (i === 0 ? 4 : -4);
    if (found && start) { const zb = -(det.hF - det.cF - 20), sg = i === 0 ? -1 : 1; s += `<polyline points="${xs + sg * Math.max(16, start.leg * kx * 0.6)},${Y(zb)} ${xs},${Y(zb)} ${xs},${Y(A.l0)}" fill="none" stroke="${C.acc}" stroke-width="2"/>`; }
    else s += `<line x1="${xs}" y1="${Y(zBot)}" x2="${xs}" y2="${Y(A.l0)}" stroke="${C.mut}" stroke-width="2" stroke-dasharray="6 3"/>`;
  });
  // strzemiona
  T.pos.forEach(z => { s += `<line x1="${X(0) + 3}" y1="${Y(z)}" x2="${X(depth) - 3}" y2="${Y(z)}" stroke="${C.tie}" stroke-width="1.2"/>`; });
  // wymiary – lewa strona
  const xl = cx - wcol / 2 - 70;
  s += dimV(xl, Y(L), Y(0), `L = ${fmt(L, 0)}`);
  s += dimV(xl, Y(L + hTop), Y(L), `${hTop}`, { fs: 9.5 });
  s += dimV(xl - 26, Y(A.l0), Y(0), `l₀ = ${fmt(A.l0, 0)}`, { fs: 9.5 });
  if (cont) s += dimV(xl - 26, Y(zTop), Y(L + hTop), `l₀ = ${fmt(A.l0, 0)}`, { fs: 9.5 });
  if (found) s += dimV(xl, Y(0), Y(-(det.hF - det.cF - 20)), `${fmt(det.hF - det.cF - 20, 0)}`, { fs: 9.5 });
  // strefy strzemion – prawa strona
  const xr = cx + wcol / 2 + 18;
  const zones = [[50, T.zBot, T.sRed], [T.zBot, L - T.zTop, T.s], [L - T.zTop, L - 50, T.sRed]].filter(q => q[1] - q[0] > 1);
  zones.forEach(([a, b, sp]) => { const n = Math.round((b - a) / sp); s += dimV(xr, Y(b), Y(a), '', {}) + tx(xr + 6, (Y(a) + Y(b)) / 2 + 3.5, `${fmt(b - a, 0)}: ⌀${lay.dt} co ${fmt(sp, 0)}`, { fs: 9.5, a: 'start', c: sp < T.s ? C.tie : C.dim }); });
  // odnośniki pozycji
  const lab = (n, txt, x, y, xt) => `<line x1="${x}" y1="${y}" x2="${xt}" y2="${y}" stroke="${C.ink2}" stroke-width="0.8"/><circle cx="${xt + 9}" cy="${y}" r="8" fill="#ffffff" stroke="${C.ink}"/>` + tx(xt + 9, y + 3.5, String(n), { fs: 9.5, w: 700 }) + tx(xt + 21, y + 3.5, txt, { fs: 9.5, a: 'start' });
  const xLab = W - 190;
  s += lab(main.pos, `${main.n}⌀${main.d} l = ${fmt(main.len, 0)}`, X(xb[1]), Y(L * 0.62), xLab);
  if (start) s += lab(start.pos, `${start.n}⌀${start.d} l = ${fmt(start.len, 0)}`, X(xb[1]) - 4, Y(A.l0 * 0.5), xLab);
  const tie = sch.rows.find(r => r.kind === 'tie');
  s += lab(tie.pos, `${tie.n} szt. ⌀${tie.d} l = ${fmt(tie.len, 0)}`, X(depth * 0.5), Y(L * 0.42 - (T.pos.length ? 0 : 0)), xLab);
  const pins = sch.rows.filter(r => r.kind === 'pin');
  pins.forEach((p, i) => { s += lab(p.pos, `${p.n} szt. ⌀${p.d} l = ${fmt(p.len, 0)}`, X(depth * 0.3), Y(L * (0.32 - i * 0.07)), xLab); });
  // przekrój A–A
  const za = L * 0.5;
  s += `<g stroke="${C.ink}" stroke-width="1.2"><line x1="${X(0) - 18}" y1="${Y(za)}" x2="${X(0) - 4}" y2="${Y(za)}"/><line x1="${X(depth) + 4}" y1="${Y(za)}" x2="${X(depth) + 18}" y2="${Y(za)}"/></g>` + tx(X(0) - 22, Y(za) + 4, 'A', { fs: 11, w: 700, a: 'end' }) + tx(X(depth) + 22, Y(za) + 4, 'A', { fs: 11, w: 700, a: 'start' });
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
    s += `<circle cx="20" cy="${y - 6}" r="9" fill="#ffffff" stroke="${C.ink}"/>` + tx(20, y - 2.5, String(r.pos), { fs: 10, w: 700 }) + tx(34, y - 2, `${r.n}×⌀${r.d}`, { fs: 10.5, w: 650, a: 'start' }) + tx(34, y + 11, r.name.slice(0, 18), { fs: 8.5, a: 'start', c: C.mut });
    const col = r.kind === 'tie' || r.kind === 'pin' ? C.tie : r.kind === 'start' ? C.acc : C.bar;
    if (r.shape === 'I') s += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${col}" stroke-width="2.4"/>` + tx((x0 + x1) / 2, y - 6, fmt(r.straight, 0), { fs: 10 });
    else if (r.shape === 'L') { const lg = Math.max(20, Math.min(60, r.leg / r.len * (x1 - x0) * 2)); s += `<polyline points="${x0},${y - lg} ${x0},${y} ${x1},${y}" fill="none" stroke="${col}" stroke-width="2.4"/>` + tx((x0 + x1) / 2, y - 6, fmt(r.straight, 0), { fs: 10 }) + tx(x0 - 6, y - lg / 2 + 3, fmt(r.leg, 0), { fs: 10, a: 'end' }); }
    else if (r.shape === 'S') { const bt = r.bt, ht = r.ht, sc = Math.min(44 / ht, 120 / bt), w = bt * sc, h = ht * sc, xx = x0 + 30; s += `<rect x="${xx}" y="${y - h / 2 - 4}" width="${w}" height="${h}" rx="3" fill="none" stroke="${col}" stroke-width="2"/><line x1="${xx + 3}" y1="${y - h / 2 - 1}" x2="${xx + 11}" y2="${y - h / 2 + 7}" stroke="${col}" stroke-width="2"/><line x1="${xx + 1}" y1="${y - h / 2 + 3}" x2="${xx + 9}" y2="${y - h / 2 + 11}" stroke="${col}" stroke-width="2"/>` + tx(xx + w / 2, y - h / 2 - 8, fmt(bt, 0), { fs: 9.5 }) + tx(xx + w + 6, y, fmt(ht, 0), { fs: 9.5, a: 'start' }) + tx(xx + w + 60, y + 3, `haki 135°: ${fmt(r.hook, 0)} mm`, { fs: 9.5, a: 'start', c: C.mut }); }
    else if (r.shape === 'O') { s += `<circle cx="${x0 + 50}" cy="${y - 4}" r="22" fill="none" stroke="${col}" stroke-width="2"/>` + tx(x0 + 82, y, `⌀ osi ${fmt(r.Dt, 0)}, haki ${fmt(r.hook, 0)}`, { fs: 9.5, a: 'start' }); }
    else if (r.shape === 'P') { s += `<polyline points="${x0 + 10},${y - 12} ${x0},${y} ${x0 + 160},${y} ${x0 + 150},${y - 12}" fill="none" stroke="${col}" stroke-width="2"/>` + tx(x0 + 80, y - 6, fmt(r.len - 2 * r.hook, 0), { fs: 9.5 }); }
    s += tx(W - 10, y + 3, `l = ${fmt(r.len, 0)} mm`, { fs: 10.5, a: 'end', w: 650 });
  });
  return s + '</svg>';
};
})();
