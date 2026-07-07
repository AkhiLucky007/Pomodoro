# FocusDesk

A lightweight, native cross-platform desktop productivity and task management application. Built with a web-tech-in-a-native-shell architecture, FocusDesk combines the flexibility of modern web development with the performance and security of Rust.

## Features

*   **Local-First Persistence:** User settings, tasks, and session histories are securely persisted to disk via Tauri's Rust backend, ensuring state survives as a true desktop application.
*   **Dynamic, Contrast-Aware Theming:** Supports 13+ curated presets and infinite custom backgrounds. Text, border, and navigation colors are computed at runtime using WCAG relative-luminance calculations to guarantee perfect readability against any background.
*   **Custom Liquid-Glass UI:** Features a hand-built, user-adjustable frosted-glass material utilizing backdrop blur, saturation boosting, and CSS pseudo-element sheen that holds up against arbitrary backgrounds.
*   **Physics-Tuned Navigation:** Distance-aware routing logic calculates transitions dynamically. Jumping between non-adjacent UI sections travels further and faster, creating a seamless, lag-free spatial experience.
*   **Pure-Web Pinch-to-Zoom:** A unified gesture system utilizing wheel + `ctrlKey` and the standard Touch Events API to normalize trackpad pinches across macOS (WKWebView), Windows (WebView2), and Linux (WebKitGTK) without native code duplication.
*   **Synthesized Audio Engine:** Zero external sound files. All UI audio (ticks, alarms, interactions) is generated on the fly using the Web Audio API via oscillators and gain envelopes.
*   **Strict Webview Bounds:** Carefully managed `overscroll-behavior` and custom swipe detection prevent native webview bounce-and-reveal behaviors.

## Tech Stack

*   **Core / Shell:** [Tauri v2](https://tauri.app/) (Rust)
*   **Frontend:** React 19, TypeScript, Vite 6
*   **Styling:** Tailwind CSS v4
*   **Animation:** Motion (formerly Framer Motion)
*   **Icons:** Lucide React
*   **Audio:** Web Audio API

## Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Rust](https://www.rust-lang.org/tools/install)
*   System dependencies for Tauri (varies by OS; see [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites))

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/AkhiLucky007/Pomodoro.git
   cd FocusDesk
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run the application in development mode:**

   ```bash
   npm run tauri dev
   ```

4. **Build the application for your platform:**

   ```bash
   npm run tauri build
   ```
