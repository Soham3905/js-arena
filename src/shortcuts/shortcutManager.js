/**
 * shortcutManager.js
 *
 * Manages the global keyboard shortcut system.
 *
 * Architecture:
 *  1. Reads shortcuts.json at import time (Vite handles JSON imports natively).
 *  2. Parses each "Ctrl+Shift+F" string into a structured descriptor.
 *  3. Attaches ONE window-level "keydown" listener.
 *  4. On each keydown event, finds the matching command and calls its handler.
 *
 * Design goals:
 *  - Zero hardcoded key strings in application code.
 *  - Future-proof: swap shortcuts.json entries to remap without code changes.
 *  - Monaco-safe: skips commands that Monaco editor should handle natively,
 *    unless the command is in our explicit override list.
 *  - Provides getShortcutMap() for tooltip / settings panel use.
 *
 * Public API:
 *   initShortcuts(getWorkspace, dispatch)  – start listening
 *   destroyShortcuts()                     – remove the listener (React cleanup)
 *   getShortcutMap()                       – { commandId: "Ctrl+S", … }
 *   getShortcutLabel(commandId)            – "Ctrl+S"
 */

import shortcutsJson from "./shortcuts.json";
import { createShortcutFunctions } from "./shortcutFunctions";

// ─────────────────────────────────────────────────────────────────────────────
// Internal state
// ─────────────────────────────────────────────────────────────────────────────

/** Parsed descriptor list — built once at module initialisation. */
const _descriptors = buildDescriptors(shortcutsJson);

/** Currently active keydown listener reference (for cleanup). */
let _listener = null;

/** Live handler map — set by initShortcuts(). */
let _handlers = {};

// Commands we explicitly intercept even when Monaco has focus.
// These are important enough to override Monaco's default behaviour.
const MONACO_OVERRIDE_COMMANDS = new Set([
  "saveFile",
  "runFile",
  "runTests",
  "quickOpen",
  "searchContent",
  "commandPalette",
]);

// ─────────────────────────────────────────────────────────────────────────────
// Key parsing helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parses a shortcut string like "Ctrl+Shift+F" into a descriptor object.
 *
 * @param {string} commandId
 * @param {string} combo  e.g. "Ctrl+Shift+F", "F2", "Delete"
 * @returns {{ commandId, ctrl, shift, alt, meta, key, raw }}
 */
function parseCombo(commandId, combo) {
  const parts = combo.split("+");
  const modifiers = new Set(parts.slice(0, -1).map((p) => p.toLowerCase()));
  const rawKey = parts[parts.length - 1];

  return {
    commandId,
    ctrl:  modifiers.has("ctrl"),
    shift: modifiers.has("shift"),
    alt:   modifiers.has("alt"),
    meta:  modifiers.has("meta"),
    // Normalise key: single chars → lowercase, special keys → as-is
    key: rawKey.length === 1 ? rawKey.toLowerCase() : rawKey,
    raw: combo,
  };
}

/**
 * Builds the full descriptor list from the shortcuts map.
 *
 * @param {Record<string, string>} map
 * @returns {Array<ReturnType<parseCombo>>}
 */
function buildDescriptors(map) {
  return Object.entries(map).map(([commandId, combo]) =>
    parseCombo(commandId, combo)
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Event matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the normalised key string from a KeyboardEvent.
 * Handles both regular keys and special keys like "Enter", "Delete", "F2".
 */
function getEventKey(e) {
  if (e.key.length === 1) return e.key.toLowerCase();
  return e.key; // "Enter", "Delete", "F2", "Escape", …
}

/**
 * Returns true if the keyboard event matches the descriptor.
 */
function matchesDescriptor(e, descriptor) {
  return (
    e.ctrlKey  === descriptor.ctrl  &&
    e.shiftKey === descriptor.shift &&
    e.altKey   === descriptor.alt   &&
    e.metaKey  === descriptor.meta  &&
    getEventKey(e) === descriptor.key
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the active element is inside the Monaco editor.
 * Monaco renders its editable area as a <textarea class="inputarea"> inside
 * a container with class "monaco-editor".
 */
function isMonacoFocused() {
  const el = document.activeElement;
  if (!el) return false;
  return el.closest?.(".monaco-editor") != null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core keydown handler
// ─────────────────────────────────────────────────────────────────────────────

function handleKeyDown(e) {
  const inMonaco = isMonacoFocused();

  for (const descriptor of _descriptors) {
    if (!matchesDescriptor(e, descriptor)) continue;

    const handler = _handlers[descriptor.commandId];
    if (typeof handler !== "function") continue;

    // If Monaco has focus and we're not overriding, let Monaco handle it.
    if (inMonaco && !MONACO_OVERRIDE_COMMANDS.has(descriptor.commandId)) continue;

    e.preventDefault();
    handler();
    return; // Only fire the first matching command.
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialises the shortcut manager.
 *
 * @param {() => object} getWorkspace
 *   A getter that returns the current workspace state.
 *   Must be a function (not the value) so handlers always read latest state.
 *
 * @param {(action: object) => void} dispatch
 *   The central App dispatch function.
 */
export function initShortcuts(getWorkspace, dispatch) {
  // Build the handler map fresh (supports hot re-init during development).
  _handlers = createShortcutFunctions(getWorkspace, dispatch);

  if (_listener) {
    window.removeEventListener("keydown", _listener, true);
  }

  _listener = handleKeyDown;
  window.addEventListener("keydown", _listener, true); // capture phase
}

/**
 * Removes the global keydown listener. Call this in React's useEffect cleanup.
 */
export function destroyShortcuts() {
  if (_listener) {
    window.removeEventListener("keydown", _listener, true);
    _listener = null;
  }
  _handlers = {};
}

/**
 * Returns the raw shortcut map { commandId: "Ctrl+S" } loaded from shortcuts.json.
 * Useful for rendering tooltips or a Keyboard Shortcuts settings panel.
 *
 * @returns {Record<string, string>}
 */
export function getShortcutMap() {
  return { ...shortcutsJson };
}

/**
 * Returns the display label for a single command, e.g. "Ctrl+S".
 * Returns "" if the command has no mapping.
 *
 * @param {string} commandId
 * @returns {string}
 */
export function getShortcutLabel(commandId) {
  return shortcutsJson[commandId] || "";
}
