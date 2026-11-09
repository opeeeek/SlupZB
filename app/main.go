//go:build windows

// SłupŻB – okno aplikacji (WebView2) z interfejsem HTML osadzonym w pliku .exe.
package main

import (
	_ "embed"
	"encoding/base64"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"unicode/utf16"
	"unsafe"

	webview2 "github.com/jchv/go-webview2"
	"golang.org/x/sys/windows"
)

//go:embed app.html
var appHTML string

const appTitle = "SłupŻB – słupy żelbetowe wg PN-EN 1992-1-1"

var (
	user32           = windows.NewLazySystemDLL("user32.dll")
	comdlg32         = windows.NewLazySystemDLL("comdlg32.dll")
	shell32          = windows.NewLazySystemDLL("shell32.dll")
	pGetSystemMetric = user32.NewProc("GetSystemMetrics")
	pGetDpiForSystem = user32.NewProc("GetDpiForSystem")
	pMessageBoxW     = user32.NewProc("MessageBoxW")
	pGetSaveFileName = comdlg32.NewProc("GetSaveFileNameW")
	pGetOpenFileName = comdlg32.NewProc("GetOpenFileNameW")
	pCommDlgExtError = comdlg32.NewProc("CommDlgExtendedError")
	pShellExecuteW   = shell32.NewProc("ShellExecuteW")
)

type openFileName struct {
	lStructSize       uint32
	hwndOwner         uintptr
	hInstance         uintptr
	lpstrFilter       *uint16
	lpstrCustomFilter *uint16
	nMaxCustFilter    uint32
	nFilterIndex      uint32
	lpstrFile         *uint16
	nMaxFile          uint32
	lpstrFileTitle    *uint16
	nMaxFileTitle     uint32
	lpstrInitialDir   *uint16
	lpstrTitle        *uint16
	flags             uint32
	nFileOffset       uint16
	nFileExtension    uint16
	lpstrDefExt       *uint16
	lCustData         uintptr
	lpfnHook          uintptr
	lpTemplateName    *uint16
	pvReserved        unsafe.Pointer
	dwReserved        uint32
	flagsEx           uint32
}

const (
	ofnOverwritePrompt = 0x00000002
	ofnNoChangeDir     = 0x00000008
	ofnPathMustExist   = 0x00000800
	ofnFileMustExist   = 0x00001000
	ofnExplorer        = 0x00080000
)

// łańcuch UTF-16 z osadzonymi znakami NUL (filtry okien dialogowych)
func utf16z(s string) *uint16 {
	u := utf16.Encode([]rune(s))
	u = append(u, 0)
	return &u[0]
}

func filterFor(kind string) (string, string) {
	if kind == "html" {
		return "Raport HTML (*.html)\x00*.html;*.htm\x00Wszystkie pliki (*.*)\x00*.*\x00", "html"
	}
	if kind == "dxf" {
		return "Rysunek DXF (*.dxf)\x00*.dxf\x00Wszystkie pliki (*.*)\x00*.*\x00", "dxf"
	}
	if kind == "odt" {
		return "Dokument OpenDocument (*.odt)\x00*.odt\x00Wszystkie pliki (*.*)\x00*.*\x00", "odt"
	}
	return "Projekt słupa (*.slup)\x00*.slup\x00Plik JSON (*.json)\x00*.json\x00Wszystkie pliki (*.*)\x00*.*\x00", "slup"
}

func fileDialog(owner uintptr, save bool, kind, initial, title string) (string, bool) {
	filter, ext := filterFor(kind)
	buf := make([]uint16, 4096)
	if initial != "" {
		u := utf16.Encode([]rune(initial))
		if len(u) < len(buf)-1 {
			copy(buf, u)
		}
	}
	var ofn openFileName
	ofn.lStructSize = uint32(unsafe.Sizeof(ofn))
	ofn.hwndOwner = owner
	ofn.lpstrFilter = utf16z(filter)
	ofn.nFilterIndex = 1
	ofn.lpstrFile = &buf[0]
	ofn.nMaxFile = uint32(len(buf))
	ofn.lpstrTitle = utf16z(title)
	ofn.lpstrDefExt = utf16z(ext)
	ofn.flags = ofnExplorer | ofnNoChangeDir | ofnPathMustExist
	proc := pGetOpenFileName
	if save {
		ofn.flags |= ofnOverwritePrompt
		proc = pGetSaveFileName
	} else {
		ofn.flags |= ofnFileMustExist
	}
	r, _, _ := proc.Call(uintptr(unsafe.Pointer(&ofn)))
	if r == 0 {
		return "", false
	}
	return windows.UTF16ToString(buf), true
}

func messageBox(owner uintptr, text, caption string, flags uintptr) int {
	t, _ := windows.UTF16PtrFromString(text)
	c, _ := windows.UTF16PtrFromString(caption)
	r, _, _ := pMessageBoxW.Call(owner, uintptr(unsafe.Pointer(t)), uintptr(unsafe.Pointer(c)), flags)
	return int(r)
}

func shellOpen(path string) {
	verb, _ := windows.UTF16PtrFromString("open")
	p, _ := windows.UTF16PtrFromString(path)
	pShellExecuteW.Call(0, uintptr(unsafe.Pointer(verb)), uintptr(unsafe.Pointer(p)), 0, 0, 1)
}

type hostReq struct {
	ID      int    `json:"id"`
	Op      string `json:"op"`
	Path    string `json:"path"`
	Name    string `json:"name"`
	Content string `json:"content"`
	Filter  string `json:"filter"`
	B64     bool   `json:"b64"`
}

type hostRes struct {
	OK      bool   `json:"ok"`
	Path    string `json:"path,omitempty"`
	Content string `json:"content,omitempty"`
	Err     string `json:"err,omitempty"`
}

func jsonStr(v interface{}) string { b, _ := json.Marshal(v); return string(b) }

func dataDir() string {
	base := os.Getenv("LOCALAPPDATA")
	if base == "" {
		base = os.TempDir()
	}
	d := filepath.Join(base, "SlupZB")
	_ = os.MkdirAll(d, 0o755)
	return d
}

func systemMetric(i uintptr) int { r, _, _ := pGetSystemMetric.Call(i); return int(r) }

func systemDPI() int {
	if pGetDpiForSystem.Find() == nil {
		if r, _, _ := pGetDpiForSystem.Call(); r > 0 {
			return int(r)
		}
	}
	return 96
}

// tryb awaryjny: brak środowiska WebView2 – otwarcie aplikacji w przeglądarce
func fallback() {
	p := filepath.Join(os.TempDir(), "SlupZB.html")
	if err := os.WriteFile(p, []byte(appHTML), 0o644); err != nil {
		messageBox(0, "Nie można uruchomić aplikacji: "+err.Error(), "SłupŻB", 0x10)
		return
	}
	messageBox(0, "Nie znaleziono składnika Microsoft Edge WebView2 Runtime (standardowo obecny w Windows 10/11).\n\n"+
		"Aplikacja zostanie otwarta w domyślnej przeglądarce – obliczenia działają tak samo, a projekty zapisywane są do folderu Pobrane.\n\n"+
		"Aby korzystać z wersji okienkowej, zainstaluj WebView2 Runtime:\nhttps://developer.microsoft.com/microsoft-edge/webview2/", "SłupŻB", 0x40)
	shellOpen(p)
}

func main() {
	dir := dataDir()
	autosavePath := filepath.Join(dir, "autosave.json")

	dpi := systemDPI()
	scale := float64(dpi) / 96.0
	sw, sh := systemMetric(0), systemMetric(1) // SM_CXSCREEN, SM_CYSCREEN
	w0, h0 := int(1500*scale), int(960*scale)
	if sw > 0 && w0 > sw-int(40*scale) {
		w0 = sw - int(40*scale)
	}
	if sh > 0 && h0 > sh-int(80*scale) {
		h0 = sh - int(80*scale)
	}
	if w0 < 800 {
		w0 = 800
	}
	if h0 < 560 {
		h0 = 560
	}

	w := webview2.NewWithOptions(webview2.WebViewOptions{
		Debug:     false,
		AutoFocus: true,
		DataPath:  filepath.Join(dir, "WebView2"),
		WindowOptions: webview2.WindowOptions{
			Title:  appTitle,
			Width:  uint(w0),
			Height: uint(h0),
			IconId: 2,
			Center: sw > w0 && sh > h0,
		},
	})
	if w == nil {
		fallback()
		return
	}
	defer w.Destroy()
	w.SetSize(int(1000*scale), int(620*scale), webview2.HintMin)

	hwnd := uintptr(w.Window())

	handle := func(raw string) {
		var q hostReq
		res := hostRes{}
		if err := json.Unmarshal([]byte(raw), &q); err != nil {
			return
		}
		switch q.Op {
		case "save":
			path := q.Path
			if path == "" {
				title := "Zapisz projekt słupa"
				if q.Filter == "html" {
					title = "Zapisz raport HTML"
				}
				if q.Filter == "dxf" {
					title = "Zapisz rysunek zbrojenia (DXF)"
				}
				if q.Filter == "odt" {
					title = "Zapisz raport (OpenDocument .odt)"
				}
				p, ok := fileDialog(hwnd, true, q.Filter, q.Name, title)
				if !ok {
					if e, _, _ := pCommDlgExtError.Call(); e != 0 {
						res.Err = "błąd okna dialogowego"
					}
					break
				}
				path = p
			}
			data := []byte(q.Content)
			if q.B64 {
				b, err := base64.StdEncoding.DecodeString(q.Content)
				if err != nil {
					res.Err = err.Error()
					break
				}
				data = b
			}
			if err := os.WriteFile(path, data, 0o644); err != nil {
				res.Err = err.Error()
				break
			}
			res.OK, res.Path = true, path
		case "open":
			p, ok := fileDialog(hwnd, false, q.Filter, "", "Otwórz projekt słupa")
			if !ok {
				break
			}
			b, err := os.ReadFile(p)
			if err != nil {
				res.Err = err.Error()
				break
			}
			res.OK, res.Path, res.Content = true, p, strings.TrimPrefix(string(b), "\ufeff")
		}
		w.Eval("window.__hostReply(" + jsonStr(q.ID) + "," + jsonStr(res) + ")")
	}

	// okna dialogowe uruchamiane poza obsługą komunikatu WebView2 (Dispatch)
	_ = w.Bind("hostRequest", func(raw string) {
		w.Dispatch(func() { handle(raw) })
	})
	_ = w.Bind("hostStore", func(data string) error {
		return os.WriteFile(autosavePath, []byte(data), 0o644)
	})
	_ = w.Bind("hostTitle", func(t string) {
		w.Dispatch(func() { w.SetTitle(t) })
	})

	init := "window.__HOST='webview2';"
	if b, err := os.ReadFile(autosavePath); err == nil && json.Valid(b) {
		init += "window.__AUTOSAVE=" + string(b) + ";"
	}
	w.Init(init)
	w.SetHtml(appHTML)
	w.Run()
}
