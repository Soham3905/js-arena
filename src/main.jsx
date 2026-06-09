// d:/Programming/SDUI/src/main.jsx
// Minimal Vite / React entry. Keeps project structure small per user's request.
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
