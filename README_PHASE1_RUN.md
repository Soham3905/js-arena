# Phase 1: Run React (Vite) + Tailwind version

## Assumption
This repo currently contains only the React source files under `src/`.
You still need a Vite + React + Tailwind project setup plus dependencies.

## 1) Install / scaffold Vite React
Run these in PowerShell from `d:\Programming\SDUI`:

```powershell
cd d:\Programming\SDUI
npm create vite@latest react-file-system -- --template react
cd react-file-system
npm install
```

## 2) Install Tailwind
```powershell
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 3) Configure Tailwind content
In `react-file-system/tailwind.config.js`, set:

```js
content: ["./index.html", "./src/**/*.{js,jsx}"]
```

## 4) Add Phase 1 files
Copy these files into `react-file-system/src/`:
- `src/data/fileTree.js`
- `src/hooks/useFileSystem.js`
- `src/components/FileTree.jsx`
- `src/components/Editor.jsx`
- `src/App.jsx`

Also ensure you have `react-file-system/src/main.jsx` using `App`.

Typical `main.jsx`:
```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

## 5) Start dev server
```powershell
npm run dev
```

Open the shown local URL.

## Storage behavior
Edits persist in `localStorage` under key: `tree`.

