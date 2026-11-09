"""Generuje web/svgtheme.css: tokeny --sv-<hex> dla kolorów rysunków SVG (jasny / ciemny / druk)."""
import colorsys, pathlib, re
w = pathlib.Path(__file__).parent / 'web'
src = ''.join((w / f).read_text(encoding='utf-8') for f in ('ui.js', 'report.js', 'draw.js'))
cols = set()
for h in re.findall(r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', src):
    h = h.lower()
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    cols.add(h)
def dark(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    hh, l, s = colorsys.rgb_to_hls(r, g, b)
    if h == 'ffffff':
        return '#151b24'   # biel rysunku = tło panelu w trybie ciemnym
    if s < 0.45 and 0.40 <= l <= 0.70:
        # szarości opisów i osi: pozostają szare, nieco jaśniejsze
        r2, g2, b2 = colorsys.hls_to_rgb(hh, max(l, 0.60), min(s, 0.20))
        return '#%02x%02x%02x' % tuple(round(v * 255) for v in (r2, g2, b2))
    if s < 0.45 or l < 0.22 or l > 0.86:
        # neutralne tusze i wypełnienia: odwrócenie jasności (tusz -> jasny, papier -> ciemny)
        l2 = 0.10 + 0.80 * (1 - l)
        l2 = max(l2, 0.62) if l < 0.5 else min(l2, 0.30)
        s2 = min(s, 0.30)
    else:
        # kolory semantyczne: ten sam odcień, rozjaśniony do czytelności na ciemnym tle
        l2 = max(l, 0.64); s2 = min(1.0, s * 0.95)
    r2, g2, b2 = colorsys.hls_to_rgb(hh, l2, s2)
    return '#%02x%02x%02x' % tuple(round(v * 255) for v in (r2, g2, b2))
cols = sorted(cols)
light = ' '.join(f'--sv-{c}: #{c};' for c in cols)
darkv = ' '.join(f'--sv-{c}: {dark(c)};' for c in cols)
css = f"""/* wygenerowane przez gen_svgtheme.py – kolory rysunków SVG */
:root {{ {light} }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ {darkv} }} }}
:root[data-theme="dark"] {{ {darkv} }}
@media print {{ :root:not([data-print]) {{ {light} }} }}
#report {{ {light} }}
"""
(w / 'svgtheme.css').write_text(css, encoding='utf-8')
for c in cols: print(c, '->', dark(c))
