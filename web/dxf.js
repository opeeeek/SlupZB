/* SłupŻB – eksport rysunku zbrojenia słupa do pliku DXF (AutoCAD R12, ASCII).
   Arkusz w milimetrach papieru: widok słupa w skali 1:K, przekrój 1:Ks, zestawienie stali. */
(function () {
'use strict';
const SZX = window.SZX = {};
// tekst DXF: znak średnicy %%c, pozostałe znaki spoza ASCII jako \U+XXXX
const enc = t => String(t).replace(/[⌀ØøΦ]/g, '%%c').replace(/°/g, '%%d').replace(/±/g, '%%p')
  .replace(/[^\x20-\x7e]/g, ch => '\\U+' + ch.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
const LAYERS = [['BETON', 7, 'CONTINUOUS'], ['PODPORY', 8, 'CONTINUOUS'], ['OSIE', 8, 'CENTER'], ['STRZEMIONA', 1, 'CONTINUOUS'],
  ['ZBR_PODLUZNE', 5, 'CONTINUOUS'], ['ZBR_STARTOWE', 4, 'CONTINUOUS'], ['SZPILKI', 6, 'CONTINUOUS'],
  ['WYMIARY', 8, 'CONTINUOUS'], ['OPISY', 7, 'CONTINUOUS'], ['TABELA', 7, 'CONTINUOUS'], ['PRZEKROJE', 7, 'CONTINUOUS']];

function writer() {
  const o = [], bb = [Infinity, Infinity, -Infinity, -Infinity];
  const n = v => { const r = Math.round(v * 1000) / 1000; return Object.is(r, -0) ? '0' : String(r); };
  const add = (...a) => { for (let i = 0; i < a.length; i += 2) o.push(String(a[i]), String(a[i + 1])); };
  const ext = (x, y) => { if (!isFinite(x) || !isFinite(y)) return; bb[0] = Math.min(bb[0], x); bb[1] = Math.min(bb[1], y); bb[2] = Math.max(bb[2], x); bb[3] = Math.max(bb[3], y); };
  const W = {
    line(x1, y1, x2, y2, L) { add(0, 'LINE', 8, L, 10, n(x1), 20, n(y1), 30, 0, 11, n(x2), 21, n(y2), 31, 0); ext(x1, y1); ext(x2, y2); },
    circle(x, y, r, L) { add(0, 'CIRCLE', 8, L, 10, n(x), 20, n(y), 30, 0, 40, n(r)); ext(x - r, y - r); ext(x + r, y + r); },
    arc(x, y, r, a0, a1, L) { add(0, 'ARC', 8, L, 10, n(x), 20, n(y), 30, 0, 40, n(r), 50, n(a0), 51, n(a1)); ext(x - r, y - r); ext(x + r, y + r); },
    // pręt w przekroju – wypełnione koło (polilinia o szerokości r z dwóch łuków)
    dot(x, y, r, L) { const w = r; add(0, 'POLYLINE', 8, L, 66, 1, 10, 0, 20, 0, 30, 0, 70, 1, 40, n(w), 41, n(w));
      add(0, 'VERTEX', 8, L, 10, n(x - r / 2), 20, n(y), 30, 0, 42, 1); add(0, 'VERTEX', 8, L, 10, n(x + r / 2), 20, n(y), 30, 0, 42, 1); add(0, 'SEQEND', 8, L); ext(x - r, y - r); ext(x + r, y + r); },
    text(x, y, h, t, L, al, rot) {
      const s = enc(t), j = al === 'c' ? 1 : al === 'r' ? 2 : 0;
      add(0, 'TEXT', 8, L, 10, n(x), 20, n(y), 30, 0, 40, n(h), 1, s);
      if (rot) add(50, n(rot));
      if (j) add(72, j, 11, n(x), 21, n(y), 31, 0);
      const w = String(t).length * h * 0.6;
      if (rot) { ext(x - h, y); ext(x, y + w); } else { const x0 = j === 1 ? x - w / 2 : j === 2 ? x - w : x; ext(x0, y); ext(x0 + w, y + h); }
    },
    pline(pts, L, closed) { for (let i = 0; i < pts.length - 1; i++) W.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], L); if (closed && pts.length > 2) W.line(pts[pts.length - 1][0], pts[pts.length - 1][1], pts[0][0], pts[0][1], L); },
    rrect(x0, y0, x1, y1, r, L) {
      r = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
      W.line(x0 + r, y0, x1 - r, y0, L); W.line(x1, y0 + r, x1, y1 - r, L); W.line(x1 - r, y1, x0 + r, y1, L); W.line(x0, y1 - r, x0, y0 + r, L);
      if (r > 0) { W.arc(x1 - r, y0 + r, r, 270, 360, L); W.arc(x1 - r, y1 - r, r, 0, 90, L); W.arc(x0 + r, y1 - r, r, 90, 180, L); W.arc(x0 + r, y0 + r, r, 180, 270, L); }
    },
    dimH(x1, x2, y, label, h) { h = h || 2; const L = 'WYMIARY'; W.line(x1, y, x2, y, L); [x1, x2].forEach(x => { W.line(x, y - 1.2, x, y + 1.2, L); W.line(x - 0.7, y - 0.7, x + 0.7, y + 0.7, L); }); if (label) W.text((x1 + x2) / 2, y + 0.8, h, label, 'WYMIARY', 'c'); },
    dimV(x, y1, y2, label, h) { h = h || 2; const L = 'WYMIARY'; W.line(x, y1, x, y2, L); [y1, y2].forEach(y => { W.line(x - 1.2, y, x + 1.2, y, L); W.line(x - 0.7, y - 0.7, x + 0.7, y + 0.7, L); }); if (label) W.text(x - 0.8, (y1 + y2) / 2, h, label, 'WYMIARY', 'c', 90); },
    bbox: () => bb.slice(),
    out: () => o,
  };
  return W;
}

SZX.build = function (R, S) {
  const U = window.SZ, fmt = (v, dp) => U.fmt(v, dp).replace(/[\s   ]/g, '');
  const g = R.g, lay = R.lay, A = R.anch, T = R.ties, sc = R.sched, cov = R.cov, det = S.det;
  const L = g.L, hTop = det.hTop, found = det.base === 'found', cont = det.top === 'cont';
  const zTop = L + hTop + (cont ? A.l0 : 0), zBot = found ? -det.hF : -A.l0 * 0.5;
  const K = [20, 25, 50, 75, 100].find(k => (zTop - zBot) / k <= 260) || 125;
  const Ks = Math.max(g.b, g.h) <= 800 ? 10 : 20;
  const D = writer();
  const depth = g.dir.y.depth;
  const ox = 40, X = x => ox + x / K, Y = z => z / K;
  // ================= WIDOK
  if (found) { const fw = depth + 1200; D.pline([[X(depth / 2 - fw / 2), Y(0)], [X(depth / 2 + fw / 2), Y(0)], [X(depth / 2 + fw / 2), Y(zBot)], [X(depth / 2 - fw / 2), Y(zBot)]], 'BETON', true); }
  D.pline([[X(0), Y(0)], [X(depth), Y(0)], [X(depth), Y(L)], [X(0), Y(L)]], 'BETON', true);
  { const sw = depth + 1400; D.pline([[X(depth / 2 - sw / 2), Y(L)], [X(depth / 2 + sw / 2), Y(L)], [X(depth / 2 + sw / 2), Y(L + hTop)], [X(depth / 2 - sw / 2), Y(L + hTop)]], 'BETON', true); }
  if (cont) { D.line(X(0), Y(L + hTop), X(0), Y(zTop), 'OSIE'); D.line(X(depth), Y(L + hTop), X(depth), Y(zTop), 'OSIE'); }
  const main = sc.rows.find(r => r.kind === 'main'), start = sc.rows.find(r => r.kind === 'start');
  const off = lay.offC || lay.a;
  [off, depth - off].forEach((xx, i) => {
    const zEnd = cont ? zTop : L + hTop - cov.cnom - lay.dt - main.d;
    D.line(X(xx), Y(0), X(xx), Y(zEnd), 'ZBR_PODLUZNE');
    if (!cont) D.line(X(xx), Y(zEnd), X(xx + (i === 0 ? 1 : -1) * main.leg), Y(zEnd), 'ZBR_PODLUZNE');
    const xs = xx + (i === 0 ? 1 : -1) * main.d;
    if (found && start) { const zb = -(det.hF - det.cF - 20); D.pline([[X(xs + (i === 0 ? -1 : 1) * start.leg), Y(zb)], [X(xs), Y(zb)], [X(xs), Y(A.l0)]], 'ZBR_STARTOWE'); }
  });
  T.pos.forEach(z => D.line(X(lay.dt + cov.cnom), Y(z), X(depth - cov.cnom - lay.dt), Y(z), 'STRZEMIONA'));
  // wymiary
  const xd = X(0) - 14;
  D.dimV(xd, Y(0), Y(L), fmt(L, 0)); D.dimV(xd, Y(L), Y(L + hTop), fmt(hTop, 0)); D.dimV(xd - 8, Y(0), Y(A.l0), 'l0=' + fmt(A.l0, 0));
  if (cont) D.dimV(xd - 8, Y(L + hTop), Y(zTop), 'l0=' + fmt(A.l0, 0));
  const xr = X(depth) + 10;
  [[50, T.zBot, T.sRed], [T.zBot, L - T.zTop, T.s], [L - T.zTop, L - 50, T.sRed]].filter(q => q[1] - q[0] > 1).forEach(([a, b, s]) => { D.dimV(xr, Y(a), Y(b), ''); D.text(xr + 3, (Y(a) + Y(b)) / 2, 2, `${fmt(b - a, 0)}: %%c${lay.dt} co ${fmt(s, 0)}`, 'OPISY'); });
  // opisy pozycji
  const xl = X(depth) + 70;
  let yl = Y(L * 0.75);
  sc.rows.forEach(r => { D.circle(xl, yl, 3, 'OPISY'); D.text(xl, yl - 1, 2.5, String(r.pos), 'OPISY', 'c'); D.text(xl + 5, yl - 1, 2.5, `${r.n} %%c${r.d} l=${fmt(r.len, 0)}`, 'OPISY'); yl -= 9; });
  D.text(ox, Y(zTop) + 8, 3.5, `${S.meta.name || 'Słup'} – widok, skala 1:${K}`, 'OPISY');
  // ================= PRZEKRÓJ A–A (1:Ks)
  const sx = xl + 90, sy = Y(L * 0.6), Xs = x => sx + x / Ks, Ys = y => sy - y / Ks;
  D.text(sx, sy + 8, 3.5, `Przekrój A-A, skala 1:${Ks}`, 'OPISY');
  if (g.circ) {
    D.circle(Xs(g.D / 2), Ys(g.D / 2), g.D / 2 / Ks, 'PRZEKROJE');
    D.circle(Xs(g.D / 2), Ys(g.D / 2), (g.D / 2 - cov.cnom - lay.dt / 2) / Ks, 'STRZEMIONA');
  } else {
    D.pline([[Xs(0), Ys(0)], [Xs(g.b), Ys(0)], [Xs(g.b), Ys(g.h)], [Xs(0), Ys(g.h)]], 'PRZEKROJE', true);
    const o = cov.cnom + lay.dt / 2, r = (lay.rin + lay.dt / 2) / Ks;
    D.rrect(Xs(o), Ys(g.h - o), Xs(g.b - o), Ys(o), r, 'STRZEMIONA');
    lay.pins.forEach(p => { if (p.dir === 'h') D.line(Xs(p.x + p.d / 2 + lay.dt / 2), Ys(o), Xs(p.x + p.d / 2 + lay.dt / 2), Ys(g.h - o), 'SZPILKI'); else D.line(Xs(o), Ys(p.y + p.d / 2 + lay.dt / 2), Xs(g.b - o), Ys(p.y + p.d / 2 + lay.dt / 2), 'SZPILKI'); });
    D.dimH(Xs(0), Xs(g.b), Ys(0) + 6, fmt(g.b, 0)); D.dimV(Xs(0) - 6, Ys(g.h), Ys(0), fmt(g.h, 0));
  }
  lay.bars.forEach(b => D.dot(Xs(b.x), Ys(b.y), Math.max(0.6, b.d / Ks), 'ZBR_PODLUZNE'));
  D.text(sx, Ys(g.h) - 8, 2.5, `${lay.n} %%c${lay.dmax}, strz. %%c${lay.dt}, cnom=${cov.cnom}`, 'OPISY');
  // ================= ZESTAWIENIE STALI
  const cols = [['Poz.', 12], ['Nazwa', 70], ['%%c', 12], ['l [mm]', 20], ['n [szt.]', 18], ['L [m]', 20], ['m [kg]', 20]];
  const tw = cols.reduce((a, c) => a + c[1], 0), rh = 6, ty0 = Ys(g.h) - 25;
  const lines = [cols.map(c => c[0]), ...sc.rows.map(r => [r.pos, r.name, r.d, fmt(r.len, 0), r.n, fmt(r.tot, 2), fmt(r.kg, 1)]), ['', 'Razem', '', '', '', '', fmt(sc.tot, 1)]];
  D.text(sx, ty0 + 4, 3, 'Zestawienie stali', 'TABELA');
  lines.forEach((ln, i) => {
    const yy = ty0 - i * rh;
    D.line(sx, yy, sx + tw, yy, 'TABELA');
    let xx = sx;
    ln.forEach((t, j) => { const cw = cols[j][1], numc = j !== 1 && i > 0; D.text(numc ? xx + cw - 1.2 : xx + 1.2, yy - rh + 1.6, i === 0 ? 2 : 2.2, String(t).slice(0, j === 1 ? 40 : 14), 'TABELA', numc ? 'r' : 'l'); xx += cw; });
  });
  const yEnd = ty0 - lines.length * rh;
  D.line(sx, yEnd, sx + tw, yEnd, 'TABELA');
  { let xx = sx; [0, ...cols.map(q => q[1])].forEach(cw => { xx += cw; D.line(xx, ty0, xx, yEnd, 'TABELA'); }); }

  // ================= nagłówek, tabele, zapis
  const bb = D.bbox();
  const H = [];
  const add = (...a) => { for (let i = 0; i < a.length; i += 2) H.push(String(a[i]), String(a[i + 1])); };
  add(0, 'SECTION', 2, 'HEADER', 9, '$ACADVER', 1, 'AC1009', 9, '$DWGCODEPAGE', 3, 'ANSI_1250', 9, '$INSBASE', 10, 0, 20, 0, 30, 0,
    9, '$EXTMIN', 10, bb[0].toFixed(2), 20, bb[1].toFixed(2), 30, 0, 9, '$EXTMAX', 10, bb[2].toFixed(2), 20, bb[3].toFixed(2), 30, 0,
    9, '$LIMMIN', 10, bb[0].toFixed(2), 20, bb[1].toFixed(2), 9, '$LIMMAX', 10, bb[2].toFixed(2), 20, bb[3].toFixed(2), 9, '$LTSCALE', 40, 1, 9, '$TEXTSTYLE', 7, 'STANDARD', 9, '$INSUNITS', 70, 4, 9, '$MEASUREMENT', 70, 1, 0, 'ENDSEC');
  add(0, 'SECTION', 2, 'TABLES');
  add(0, 'TABLE', 2, 'LTYPE', 70, 3);
  add(0, 'LTYPE', 2, 'CONTINUOUS', 70, 0, 3, 'Solid line', 72, 65, 73, 0, 40, 0);
  add(0, 'LTYPE', 2, 'CENTER', 70, 0, 3, 'Center ____ _ ____', 72, 65, 73, 4, 40, 12, 49, 8, 49, -1.5, 49, 1, 49, -1.5);
  add(0, 'LTYPE', 2, 'DASHED', 70, 0, 3, 'Dashed __ __', 72, 65, 73, 2, 40, 4, 49, 2.5, 49, -1.5);
  add(0, 'ENDTAB');
  add(0, 'TABLE', 2, 'LAYER', 70, LAYERS.length + 1);
  add(0, 'LAYER', 2, '0', 70, 0, 62, 7, 6, 'CONTINUOUS');
  LAYERS.forEach(([nm, col, lt]) => add(0, 'LAYER', 2, nm, 70, 0, 62, col, 6, lt));
  add(0, 'ENDTAB');
  add(0, 'TABLE', 2, 'STYLE', 70, 1, 0, 'STYLE', 2, 'STANDARD', 70, 0, 40, 0, 41, 0.9, 50, 0, 71, 0, 42, 2.5, 3, 'arial.ttf', 4, '', 0, 'ENDTAB');
  add(0, 'ENDSEC');
  add(0, 'SECTION', 2, 'BLOCKS', 0, 'ENDSEC');
  add(0, 'SECTION', 2, 'ENTITIES');
  const body = D.out();
  const tail = ['0', 'ENDSEC', '0', 'EOF'];
  return H.concat(body, tail).join('\r\n') + '\r\n';
};
SZX.enc = enc;
})();
