# SłupŻB 1.2 – obliczenia słupów żelbetowych wg PN-EN 1992-1-1

Program analogiczny do BelkaŻB (ten sam układ, wygląd i sposób pracy), przeznaczony do wymiarowania i sprawdzania słupów żelbetowych.

Trzy postacie tej samej aplikacji (wspólny kod z katalogu `web/`):
- `SlupZB.exe` – program dla Windows 10/11 (jeden plik, bez instalacji, WebView2); projekty `*.slup`, autozapis w `%LOCALAPPDATA%\SlupZB`,
- `app/app.html` – plik do otwarcia w dowolnej przeglądarce (offline),
- `webapp/slupzb.html` – wersja do publikacji jako strona claude.ai (artefakt): „Moje projekty” na koncie, pobieranie projektu i raportu.

## Poprawki 1.2 – funkcje przeniesione z BelkaŻB

- **Szybkie sprawdzenia nad zakładkami → Podsumowanie.** Kliknięcie przycisku (SGN N + M, ścinanie, SGU, konstrukcja, pożar) przenosi do Podsumowania i wyróżnia wiersz warunku niespełnionego (albo z uwagą, albo decydującego).
- **„pokaż →” w Podsumowaniu** przy warunkach niespełnionych i z uwagami: przejście do miejsca, którego dotyczy warunek, z czerwonym podświetleniem tego, co zmienić (bok przekroju, strzemiona, otulina, warunki podparcia, wymiary, długość pręta, fundament, pożar). Niespełnione warunki są też zaznaczone na rysunku przekroju (pulsujące strefy, znikają po kliknięciu).
- **Znaczniki „sprawdzone” zmieniają się same:** warunek, który przestał być spełniony – odznaczany; który zaczął być spełniony – zaznaczany; w nowym projekcie spełnione warunki są zaznaczone. Klucze znaczników nie zależą od wartości w nazwie warunku.
- **Przekrój – edycja z rysunku:** kliknięcie **boku** (górny, dolny, lewy, prawy) – liczba i średnica prętów pośrednich tylko na tym boku (albo na boku przeciwległym / wszystkich bokach); **naroże** – średnica prętów narożnych; **wnętrze** – strzemiona i szpilki; **pas otuliny** – otulina c<sub>nom</sub> (z klasą ekspozycji i Δc<sub>dev</sub>); **wymiar** – wymiary przekroju. Przekroje T i L – kliknięcie **krawędzi** (liczba prętów pośrednich na krawędzi albo rozstaw automatyczny, średnica); okrągły i pierścieniowy – kliknięcie **obwodu** (zewnętrznego / wewnętrznego, osobna średnica warstwy wewnętrznej).
- **Zbrojenie niesymetryczne:** silnik liczy pręty osobno na każdym boku prostokąta (szpilki wspólne dla prętów naprzeciw siebie, utrzymanie prętów 9.5.3(6) na każdym boku, odstępy w świetle), nośność zależna od znaku momentu; tabela „Boki przekroju” (pręty, rozstaw osiowy, w świetle, warunek 8.2) – kliknięcie wiersza otwiera edycję boku; łańcuchy wymiarowe rozstawu na każdym boku, za mały odstęp w świetle – na czerwono.
- **Zaznaczanie i usuwanie prętów:** klik pręta – zaznaczenie (Ctrl/Shift – kilka), Delete – usunięcie (pozostałe pręty boku rozmieszczone równomiernie); pręty narożne i minimalna liczba prętów na obwodzie są chronione (9.5.2(4)).
- **Buława wibratora** (pasek zbrojenia, domyślnie wyłączona): sprawdzenie prześwitu ⌀ + 10 mm w polu między strzemieniem i szpilkami (8.2(4)). **Tablica pól przekroju prętów** (n × A<sub>s</sub>, masa 1 m).
- **Wykresy na wysokości słupa:** M<sub>y</sub>, M<sub>z</sub>, **V** (dM<sub>Ed</sub>/dx z II rzędem i I rząd), N oraz **mimośród e<sub>i</sub> + e<sub>2</sub>** (wygięcie); **kursor** pokazuje wartości na danej wysokości na wszystkich wykresach jednocześnie; **kliknięcie stawia znacznik** (do 8; kropki i wartości na wszystkich wykresach), kliknięcie przy znaczniku – usunięcie, **prawy przycisk – usunięcie wszystkich**, kliknięcie wartości – „jak obliczono”. Wykresy od **pojedynczych obciążeń** (wartości charakterystyczne).
- **Schemat w Danych:** widoki **M + pręty** (M<sub>Ed</sub>, nośność M<sub>Rd</sub>(N<sub>Ed</sub>(x)) zbrojenia przyjętego i wymaganego, opis „przyjęte / wymagane n⌀” – **zbrojenie wymagane z doboru w tle**; kliknięcie opisu – **wybór średnicy** z listą wariantów ⌀12–⌀32: liczba prętów, A<sub>s</sub>, masa, η, „od razu zastosuj”), **V + strzemiona** (V<sub>Ed</sub>, V<sub>Rd,c</sub>, strefy strzemion – klik zmienia strzemiona), N, **reakcje** (siły na fundament: z każdego obciążenia i z kombinacji decydujących, tabela pod schematem), wyboczenie, bez wykresu. Kliknięcie strzałki obciążenia – edycja obciążenia; kliknięcie wykresu – przekrój i siły na tej wysokości; podsumowanie obciążeń pod schematem (N<sub>k</sub>, N<sub>Ed,max/min</sub>).
- **Ocena wymiarów przekroju ✔ / ✖ / ?** (w tle, po każdej zmianie): ✖ – przekrój za mały (proponowany przekrój ze zbrojeniem, kliknięcie przyjmuje), ? – większy niż potrzeba (wystarczy …), ✔ – wystarczający.
- **Zbrojenie słupa – przełącznik 2D / 3D:** widok przestrzenny (beton półprzezroczysty, pręty, pręty startowe, strzemiona i szpilki; obrót, przesuw, powiększenie, dotyk). W 2D: **przekrój pod kursorem** (na wysokości kursora, w strefie zakładu z prętami startowymi), kliknięcie słupa – okno przekroju na wysokości z nawigacją ▲▼, siłami i M<sub>Rd</sub>; kliknięcie **strefy strzemion** – rozstaw w części środkowej i w strefach zagęszczenia oraz długości stref (auto lub zadane, sprawdzane z 9.5.3(4)); kliknięcie **wymiaru zakładu** – długość zakładu (auto lub zadana, sprawdzana z wymaganą 8.7.3) i udział prętów łączonych; kliknięcie wyciągu pręta – edycja.
- **„Jak obliczono” z zielonym wyróżnieniem** wzoru i wartości we fragmencie raportu – dla warunków z Podsumowania, wierszy tabel wyników (Przekrój, Wykresy, Zbrojenie słupa, reakcje, okna przekroju) i znaczników na wykresach; przycisk „Pokaż, co zmienić →”.
- **Numery normy klikalne w całym programie** (punkty, tablice, rysunki, wzory, PN-EN 1990, PN-EN 1992-1-2) – okno objaśnienia nad oknami dialogowymi; długie objaśnienia zwinięte pod „Objaśnienie”.
- **Powiększanie wszystkich rysunków:** Ctrl + kółko (względem kursora), przeciąganie – przesuw, dwuklik lub „✕” – 100%.
- **Raport bez odwołań do normy** (jak w BelkaŻB 2.9.11; zostają numery wzorów kombinacji PN-EN 1990) – z przełącznikiem „odnośniki do normy”; raport własny: „Wstaw raport pełny”, „Wstaw dane i kombinacje”, „Wstaw datę”.
- **Zbieranie obciążenia z pola** (okno obciążenia): N = w·A·n z q<sub>k</sub> wg kategorii PN-EN 1991-1-1 i redukcją α<sub>n</sub> = (2 + (n − 2)ψ<sub>0</sub>)/n (6.3.1.2(11)), przycisk „Przyjmij N”.
- **Odporność ogniowa – co zmienić** (otulina o Δ, wymiar, liczba prętów) i **przykłady klas ekspozycji** (okno z tabelą).

## Poprawki 1.1

- **Nowe przekroje: teowy (T), kątowy (L) i pierścieniowy (rura ⌀D × t)** – obok prostokątnego i okrągłego.
  - T: półka b<sub>f</sub> × h<sub>f</sub>, środnik b<sub>w</sub>, wysokość h; L: b × h, grubości ramion t<sub>h</sub> i t<sub>b</sub>; pierścień: D, t, jedna lub dwie warstwy prętów (obwód zewnętrzny i wewnętrzny), obręcze zewnętrzna i wewnętrzna.
  - Charakterystyki: pole, środek ciężkości, I<sub>y</sub>, I<sub>z</sub>, I<sub>yz</sub>, osie główne i i<sub>min</sub> (dla L – informacja o smukłości względem osi głównej najmniejszej bezwładności).
  - Zbrojenie T i L: pręty w narożach strzemion i w przecięciach ich obrysów (także przy narożach wewnętrznych), pręty pośrednie na ścianach co ≤ s<sub>max</sub> (równo między prętami utrzymanymi), osobne strzemię zamknięte dla każdego prostokąta składowego, szpilki z warunku 150 mm (9.5.3(6)); sprawdzenie pręta w każdym narożu wypukłym.
  - Nośność T i L w płaszczyźnie liczona metodą włókien z **osią obojętną obróconą tak, by moment w drugiej płaszczyźnie był zerowy** – dla przekroju niesymetrycznego oś równoległa do krawędzi zawyżałaby nośność (dla przykładowego L 600×600 o ok. 20%). Krzywe interakcji w zakładce Wykresy pokazują tę nośność.
  - Ścinanie: b<sub>w</sub> – najmniejsza szerokość w kierunku ścinania (pierścień: 2t); pożar: tablica 5.2a i wzór (5.7) jako ocena przybliżona (b = najmniejsza grubość ramienia, b′ = 4A<sub>c</sub>/u) z notą w raporcie.
  - Dobór zbrojenia (średnica × rozstaw prętów pośrednich; dla pierścienia jedna lub dwie warstwy) i przekroju (skalowanie wymiarów z zachowaniem proporcji), zestawienie stali ze strzemionami każdego obrysu, rysunki, DXF, raport.
- **Nowy projekt jest pusty** – bez obciążeń i bez zbrojenia (jak w BelkaŻB). W pustym zestawieniu obciążeń przycisk „wczytaj przykład”. W zakładce Przekrój i zbrojenie dla przekroju bez prętów program pokazuje **zbrojenie wymagane** (najmniejsza masa stali spełniająca wszystkie sprawdzenia przy zadanym wytężeniu) z przyciskiem „Przyjmij to zbrojenie”.

## Zakładki

- **Dane** – formularz (przekrój, wysokość, warunki podparcia i długość wyboczeniowa w obu płaszczyznach, materiały, otulina, obciążenia i kombinacje, efekty II rzędu, pełzanie i SGU, zbrojenie konstrukcyjne, odporność ogniowa, współczynniki krajowe), obok **schemat słupa w płaszczyznach h i b** z siłami obliczeniowymi i wykresem M<sub>Ed</sub> (I rząd, imperfekcja, II rząd), N lub postacią wyboczenia; podgląd przekroju; **zestawienie obciążeń** (kliknięcie wiersza – edycja), albo tabela **sił obliczeniowych wprost** (z programu statycznego, także „Wklej z arkusza”); kombinacje decydujące. Nad danymi: szybkie sprawdzenia oraz **Dobierz przekrój / Dobierz zbrojenie / Dobierz wszystko** z wytężeniem ≤ η. Kilka słupów w jednym projekcie (zakładki 1, 2, … nad schematem).
- **Przekrój i zbrojenie** – rysunek przekroju z klikalnymi strefami (każdy bok / krawędź / obwód – pręty tylko tam, naroża, wnętrze – strzemiona, pas otuliny, wymiary; pręty – zaznaczanie i usuwanie), tabele „wymagane / przyjęte” i „Boki przekroju”, stan odkształceń w stanie granicznym w obu płaszczyznach.
- **Wykresy i interakcja N–M** – krzywe interakcji N–M<sub>y</sub> i N–M<sub>z</sub> z punktami wszystkich kombinacji (klik – wybór kombinacji), wykresy M<sub>y</sub>, M<sub>z</sub>, V, N i e<sub>i</sub> + e<sub>2</sub> na wysokości (kursor z wartościami, znaczniki, wykresy od pojedynczych obciążeń), kontur nośności M<sub>y</sub>–M<sub>z</sub> (zginanie ukośne), tabela kombinacji.
- **Zbrojenie słupa** – widok 2D / 3D z prętami, prętami startowymi, zakładami, strefami zagęszczenia strzemion (klikalne) i odnośnikami pozycji, przekrój na wysokości kursora, wyciągi prętów, zestawienie stali, **eksport DXF** (AutoCAD R12).
- **Podsumowanie** – karty wyników i tabela wszystkich sprawdzeń z wykorzystaniem; klik numeru punktu normy – objaśnienie; klik warunku – „jak obliczono” (fragment raportu z wzorami).
- **Raport obliczeń** – raport pełny (wzory, podstawienia, wyniki, rysunki), raport skrócony (dane, obciążenia, kombinacje), raport własny (edytowalny); zapis HTML, .odt (LibreOffice / Word), druk / PDF.

## Zakres obliczeń

- **Przekroje**: prostokątne b × h (pręty narożne i pośrednie o różnych średnicach), okrągłe ⌀D, pierścieniowe ⌀D × t, teowe i kątowe; nośność metodą zgodności odkształceń (parabola-prostokąt lub prostokąt, 3.1.7; stal 3.2.7; przy ściskaniu osiowym ε<sub>c</sub> ≤ ε<sub>c2</sub>).
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

`node tests/weryfikacja.js` – 73 porównania z obliczeniami niezależnymi: momenty w schematach podparcia (qL²/8, 9qL²/128, qL²/12, qL²/24, qL²/3, HL/2…), długości wyboczeniowe (rys. 5.7, wzory 5.15/5.16), nośność przekroju (N<sub>Rd</sub>, M<sub>Rd</sub> przy N = 0 – rachunek ręczny), pełny tok metody nominalnej krzywizny i nominalnej sztywności dla słupa wzorcowego (N<sub>Ed</sub>, e<sub>i</sub>, M<sub>0e</sub>, φ(∞,t<sub>0</sub>), φ<sub>ef</sub>, λ<sub>lim</sub>, e<sub>2</sub>, M<sub>Ed</sub>, EI, N<sub>B</sub>), wykładnik a (5.39), zakłady, wzór (5.7) i tablica 5.2a, wymagania 9.5, kombinacje, dobór zbrojenia i przekroju; przekroje T, L i pierścieniowe (pole, środek ciężkości, I<sub>y</sub>, I<sub>z</sub>, I<sub>yz</sub>, I<sub>min</sub>, N<sub>Rd</sub>, zgodność metody włókien z krzywą interakcji, pręty w narożach, dobór zbrojenia), pusty start projektu.

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
