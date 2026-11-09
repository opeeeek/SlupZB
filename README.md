# SłupŻB 1.0 – obliczenia słupów żelbetowych wg PN-EN 1992-1-1

Program analogiczny do BelkaŻB (ten sam układ, wygląd i sposób pracy), przeznaczony do wymiarowania i sprawdzania słupów żelbetowych.

Trzy postacie tej samej aplikacji (wspólny kod z katalogu `web/`):
- `SlupZB.exe` – program dla Windows 10/11 (jeden plik, bez instalacji, WebView2); projekty `*.slup`, autozapis w `%LOCALAPPDATA%\SlupZB`,
- `app/app.html` – plik do otwarcia w dowolnej przeglądarce (offline),
- `webapp/slupzb.html` – wersja do publikacji jako strona claude.ai (artefakt): „Moje projekty” na koncie, pobieranie projektu i raportu.

## Zakładki

- **Dane** – formularz (przekrój, wysokość, warunki podparcia i długość wyboczeniowa w obu płaszczyznach, materiały, otulina, obciążenia i kombinacje, efekty II rzędu, pełzanie i SGU, zbrojenie konstrukcyjne, odporność ogniowa, współczynniki krajowe), obok **schemat słupa w płaszczyznach h i b** z siłami obliczeniowymi i wykresem M<sub>Ed</sub> (I rząd, imperfekcja, II rząd), N lub postacią wyboczenia; podgląd przekroju; **zestawienie obciążeń** (kliknięcie wiersza – edycja), albo tabela **sił obliczeniowych wprost** (z programu statycznego, także „Wklej z arkusza”); kombinacje decydujące. Nad danymi: szybkie sprawdzenia oraz **Dobierz przekrój / Dobierz zbrojenie / Dobierz wszystko** z wytężeniem ≤ η. Kilka słupów w jednym projekcie (zakładki 1, 2, … nad schematem).
- **Przekrój i zbrojenie** – rysunek przekroju (kliknij pręty, strzemię lub wymiar, aby zmienić), tabele „wymagane / przyjęte”, stan odkształceń w stanie granicznym w obu płaszczyznach.
- **Wykresy i interakcja N–M** – krzywe interakcji N–M<sub>y</sub> i N–M<sub>z</sub> z punktami wszystkich kombinacji (klik – wybór kombinacji), wykresy M<sub>y</sub>, M<sub>z</sub> i N na wysokości, kontur nośności M<sub>y</sub>–M<sub>z</sub> (zginanie ukośne), tabela kombinacji.
- **Zbrojenie słupa** – widok z prętami, prętami startowymi, zakładami, strefami zagęszczenia strzemion i odnośnikami pozycji, przekrój A–A, wyciągi prętów, zestawienie stali, **eksport DXF** (AutoCAD R12).
- **Podsumowanie** – karty wyników i tabela wszystkich sprawdzeń z wykorzystaniem; klik numeru punktu normy – objaśnienie; klik warunku – „jak obliczono” (fragment raportu z wzorami).
- **Raport obliczeń** – raport pełny (wzory, podstawienia, wyniki, rysunki), raport skrócony (dane, obciążenia, kombinacje), raport własny (edytowalny); zapis HTML, .odt (LibreOffice / Word), druk / PDF.

## Zakres obliczeń

- **Przekroje**: prostokątne b × h (pręty narożne i pośrednie o różnych średnicach) i okrągłe ⌀D; nośność metodą zgodności odkształceń (parabola-prostokąt lub prostokąt, 3.1.7; stal 3.2.7; przy ściskaniu osiowym ε<sub>c</sub> ≤ ε<sub>c2</sub>).
- **Statyka**: schemat podparcia osobno w płaszczyznach h i b (przegub–przegub, wspornik, utwierdzenie–przegub, utwierdzenie–utwierdzenie, utwierdzenie przesuwne); siła N w głowicy z mimośrodem, momenty końcowe z analizy ramy, siły poziome w głowicy, obciążenie poziome na wysokości; ciężar własny (N rośnie ku podstawie).
- **Kombinacje (PN-EN 1990)**: 6.10 lub 6.10a/6.10b, wszystkie warianty obciążeń zmiennych (obecne lub nie, kolejno wiodące), obciążenia dwukierunkowe (wiatr ±), γ<sub>G,sup</sub>/γ<sub>G,inf</sub>; charakterystyczne 6.14b i quasi-stałe 6.16b; albo siły obliczeniowe wprost.
- **Smukłość i efekty II rzędu (5.8)**: długość wyboczeniowa wg rys. 5.7, z β lub z podatności węzłów (5.15)/(5.16); imperfekcje 5.2 (θ<sub>i</sub>, e<sub>i</sub> = θ<sub>i</sub>l<sub>0</sub>/2 lub l<sub>0</sub>/400); λ<sub>lim</sub> = 20ABC/√n z A (φ<sub>ef</sub>), B (ω), C (r<sub>m</sub>); pełzanie efektywne φ<sub>ef</sub> (5.19) dla każdej kombinacji, φ(∞,t<sub>0</sub>) wg zał. B; metody: **nominalnej krzywizny** (5.8.8: M<sub>0e</sub>, K<sub>r</sub>, K<sub>φ</sub>, e<sub>2</sub>), **nominalnej sztywności** (5.8.7: EI z (5.21)–(5.22) lub (5.26), N<sub>B</sub>, β), **ogólna** (5.8.6: zależność M–κ z wykresu 3.1.5 z f<sub>cd</sub>, E<sub>cd</sub>, pełzanie przez (1 + φ<sub>ef</sub>), słup modelowy, iteracja ugięć); mimośród minimalny e<sub>0</sub> (6.1(4)); przekroje podstawy, strefy środkowej i głowicy z właściwym N.
- **Zginanie ukośne (5.8.9)**: kryteria (5.38a), (5.38b), warunek (5.39) z wykładnikiem a; imperfekcje tylko w jednym kierunku; dodatkowo kontur nośności M<sub>y</sub>–M<sub>z</sub> metodą włókien.
- **Ścinanie (6.2)**: V<sub>Rd,c</sub> z σ<sub>cp</sub>, V<sub>Rd,s</sub>, V<sub>Rd,max</sub> z α<sub>cw</sub>, dobór cot θ; V<sub>Ed</sub> z I rzędu i (opcjonalnie) π·M<sub>2</sub>/l<sub>0</sub>.
- **SGU**: naprężenia 7.2 (σ<sub>c</sub>, σ<sub>c,qp</sub> – liniowość pełzania, σ<sub>s</sub>) w przekroju zarysowanym przy zginaniu ukośnym, szerokość rys 7.3.4.
- **Konstrukcja**: otulina 4.4.1 (tab. 4.3N, 4.4N, zał. E), ⌀<sub>min</sub> = 12 mm, A<sub>s,min</sub>, A<sub>s,max</sub> (także w zakładach), pręt w każdym narożu, odstępy 8.2, strzemiona 9.5.3 (⌀<sub>t</sub>, s<sub>cl,tmax</sub>, strefy 0,6·s<sub>cl,tmax</sub> przy stropach i zakładach), szpilki z warunku 150 mm (9.5.3(6)); zakłady 8.7 (ściskanie/rozciąganie, α<sub>6</sub>) i zakotwienie prętów startowych w fundamencie 8.4.
- **Odporność ogniowa (PN-EN 1992-1-2, metoda A)**: tablica 5.2a (interpolacja μ<sub>fi</sub>, ekspozycja jedno- i wielostronna, warunek 8 prętów) i wzór (5.7), warunki stosowania (l<sub>0,fi</sub>, e<sub>max</sub>, A<sub>s</sub>/A<sub>c</sub>).
- **Dobór**: zbrojenia (najmniejsza masa stali spełniająca wszystkie sprawdzenia), przekroju (co 50 mm z zachowaniem proporcji) i obu jednocześnie; wytężenie docelowe η.

Parametry krajowe (ZK PL): γ<sub>c</sub> = 1,4, γ<sub>s</sub> = 1,15, γ<sub>cE</sub> = 1,2, α<sub>cc</sub> = 1,0, ⌀<sub>min</sub> = 12 mm; wartości można zmienić w grupie „Współczynniki i parametry krajowe”.

## Weryfikacja

`node tests/weryfikacja.js` – 49 porównań z obliczeniami niezależnymi: momenty w schematach podparcia (qL²/8, 9qL²/128, qL²/12, qL²/24, qL²/3, HL/2…), długości wyboczeniowe (rys. 5.7, wzory 5.15/5.16), nośność przekroju (N<sub>Rd</sub>, M<sub>Rd</sub> przy N = 0 – rachunek ręczny), pełny tok metody nominalnej krzywizny i nominalnej sztywności dla słupa wzorcowego (N<sub>Ed</sub>, e<sub>i</sub>, M<sub>0e</sub>, φ(∞,t<sub>0</sub>), φ<sub>ef</sub>, λ<sub>lim</sub>, e<sub>2</sub>, M<sub>Ed</sub>, EI, N<sub>B</sub>), wykładnik a (5.39), zakłady, wzór (5.7) i tablica 5.2a, wymagania 9.5, kombinacje, dobór zbrojenia i przekroju.

## Struktura źródeł

- `web/engine.js` – silnik obliczeń (czysty JavaScript, działa też w Node.js),
- `web/draw.js` – rysunki SVG (przekrój, schemat, krzywe interakcji, wykresy, rysunek zbrojenia),
- `web/ui.js`, `web/style.css`, `web/index.html` – interfejs,
- `web/report.js` – raport obliczeń, eksport .odt,
- `web/dxf.js` – eksport DXF, `web/norms.js` – objaśnienia punktów normy,
- `build_html.py` – skleja pliki w `app/app.html` i `webapp/slupzb.html`,
- `app/main.go` – okno Windows (WebView2), okna dialogowe plików, autozapis; `app/icon.ico`, `app/app.manifest`.

## Kompilacja

```
python3 build_html.py
cd app
go run github.com/akavel/rsrc@v0.10.2 -manifest app.manifest -ico icon.ico -o rsrc_windows_amd64.syso
GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-H windowsgui -s -w" -o ../SlupZB.exe .
```

Program jest narzędziem pomocniczym – wyniki wymagają weryfikacji przez projektanta z uprawnieniami.
