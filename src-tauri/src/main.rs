// Prevents additional console window on Windows in release, do not remove!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Pinch-to-zoom used to be wired up here via a macOS-only WKWebView call
    // (setAllowsMagnification), which only ever worked on one platform and
    // conflicted with the in-app zoom below. Zoom is now implemented once in
    // JS (see src/App.tsx / usePinchZoom) using wheel + touch events, which
    // behave the same across WebView2 (Windows), WebKitGTK (Linux), and
    // WKWebView (macOS) since they all run the same web content - no
    // per-platform native code needed.
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
