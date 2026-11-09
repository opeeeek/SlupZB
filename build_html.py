"""Buduje dwie wersje interfejsu z plików web/:
   app/app.html          – pełny dokument (program .exe i plik do otwarcia w przeglądarce),
   webapp/slupzb.html    – strona do publikacji jako artefakt (bez doctype/html/head/body)."""
import pathlib, subprocess, sys
root = pathlib.Path(__file__).parent
w = root / 'web'
subprocess.run([sys.executable, str(root / 'gen_svgtheme.py')], check=True, stdout=subprocess.DEVNULL)
tpl = (w / 'index.html').read_text(encoding='utf-8')
css = (w / 'style.css').read_text(encoding='utf-8') + '\n' + (w / 'svgtheme.css').read_text(encoding='utf-8')
parts = {}
for tag, fn in [('/*@@ENGINE@@*/', 'engine.js'), ('/*@@NORMS@@*/', 'norms.js'), ('/*@@DRAW@@*/', 'draw.js'), ('/*@@UI@@*/', 'ui.js'), ('/*@@REPORT@@*/', 'report.js'), ('/*@@DXF@@*/', 'dxf.js')]:
    src = (w / fn).read_text(encoding='utf-8')
    assert '</script' not in src.lower(), fn
    parts[tag] = src
head, rest = tpl.split('<!--@@BODY-->')
body, tail = rest.split('<!--@@END-->')
head = head.replace('<!--@@HEAD-->', '').lstrip()
def fill(s):
    for k, v in parts.items(): s = s.replace(k, v)
    return s.replace('/*@@CSS@@*/', css)

full = fill(head + body.replace('<!--@@FLAGS-->', '') + tail)
(root / 'app' / 'app.html').write_text(full, encoding='utf-8')

web = ('<title>SłupŻB</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
       '<style id="appcss">/*@@CSS@@*/</style>\n'
       + body.replace('<!--@@FLAGS-->', '<script>window.__ARTIFACT = true;</script>'))
web = fill(web)
(root / 'webapp').mkdir(exist_ok=True)
(root / 'webapp' / 'slupzb.html').write_text(web, encoding='utf-8')
print('app/app.html', len(full.encode()), 'B;  webapp/slupzb.html', len(web.encode()), 'B')
