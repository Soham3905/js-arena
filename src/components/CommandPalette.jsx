/**
 * CommandPalette.jsx
 *
 * VS Code-style command palette (Ctrl+Shift+P).
 * Shows all available commands with shortcuts, allows filtering by name or
 * category, and executes the selected command on Enter / click.
 *
 * Data flow:
 *   App.jsx dispatches OPEN_COMMAND_PALETTE → workspace.search.commandPaletteOpen = true
 *   This component reads that flag and renders itself as a fixed overlay.
 *   Commands call App's dispatch() directly, so REQUEST_ACTIONS (rename/delete)
 *   still show the native prompt/confirm dialogs from App.jsx.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ACTIONS,
  getActiveFile,
  getActiveFileId,
  canUndo,
  canRedo,
} from "../functions";
import shortcutsJson from "../shortcuts/shortcuts.json";

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST_ACTIONS — must match the constants in App.jsx
// ─────────────────────────────────────────────────────────────────────────────
const REQUEST_ACTIONS = {
  RENAME_NODE: "REQUEST_RENAME_NODE",
  DELETE_NODE: "REQUEST_DELETE_NODE",
};

// ─────────────────────────────────────────────────────────────────────────────
// Command registry
// All commands the palette knows about. Data is read from shortcuts.json for
// the keyboard combo so remapping shortcuts.json automatically updates here.
// ─────────────────────────────────────────────────────────────────────────────

function buildCommands(dispatch, workspace) {
  const activeFile   = getActiveFile(workspace);
  const activeFileId = getActiveFileId(workspace);

  // Close the palette, then after a tick execute the action so the palette
  // unmounts before any prompt() / confirm() blocks the event loop.
  const run = (fn) => () => {
    dispatch({ type: ACTIONS.CLOSE_COMMAND_PALETTE });
    setTimeout(fn, 30);
  };

  return [
    // ── File ──────────────────────────────────────────────────────────────────
    {
      id:        "saveFile",
      label:     "Save File",
      category:  "File",
      icon:      "💾",
      shortcut:  shortcutsJson.saveFile,
      disabled:  !activeFile,
      action:    run(() => dispatch({ type: ACTIONS.SAVE_FILE, fileId: activeFileId })),
    },

    // ── Run ───────────────────────────────────────────────────────────────────
    {
      id:        "runFile",
      label:     "Run Active File",
      category:  "Run",
      icon:      "▶",
      shortcut:  shortcutsJson.runFile,
      disabled:  !activeFile,
      action:    run(() => dispatch({ type: ACTIONS.RUN_ACTIVE_FILE, fileId: activeFileId })),
    },
    {
      id:        "runTests",
      label:     "Run Tests",
      category:  "Run",
      icon:      "🧪",
      shortcut:  shortcutsJson.runTests,
      disabled:  !activeFile,
      action:    run(() => dispatch({ type: ACTIONS.RUN_TESTS, fileId: activeFileId })),
    },

    // ── Edit ──────────────────────────────────────────────────────────────────
    {
      id:        "renameNode",
      label:     "Rename File",
      category:  "Edit",
      icon:      "✏️",
      shortcut:  shortcutsJson.renameNode,
      disabled:  !activeFile,
      action:    run(() => dispatch({
        type:        REQUEST_ACTIONS.RENAME_NODE,
        nodeId:      activeFileId,
        currentName: activeFile?.name,
      })),
    },
    {
      id:        "deleteNode",
      label:     "Delete File",
      category:  "Edit",
      icon:      "🗑",
      shortcut:  shortcutsJson.deleteNode,
      disabled:  !activeFile,
      action:    run(() => dispatch({ type: REQUEST_ACTIONS.DELETE_NODE, nodeId: activeFileId })),
    },
    {
      id:        "undo",
      label:     "Undo",
      category:  "Edit",
      icon:      "↶",
      shortcut:  shortcutsJson.undo,
      disabled:  !canUndo(workspace),
      action:    run(() => dispatch({ type: ACTIONS.UNDO })),
    },
    {
      id:        "redo",
      label:     "Redo",
      category:  "Edit",
      icon:      "↷",
      shortcut:  shortcutsJson.redo,
      disabled:  !canRedo(workspace),
      action:    run(() => dispatch({ type: ACTIONS.REDO })),
    },

    // ── Search ────────────────────────────────────────────────────────────────
    {
      id:        "quickOpen",
      label:     "Quick Open (File Search)",
      category:  "Search",
      icon:      "🔍",
      shortcut:  shortcutsJson.quickOpen,
      disabled:  false,
      action:    run(() => dispatch({ type: ACTIONS.OPEN_QUICK_OPEN })),
    },
    {
      id:        "searchContent",
      label:     "Search in Files",
      category:  "Search",
      icon:      "🔎",
      shortcut:  shortcutsJson.searchContent,
      disabled:  false,
      action:    run(() => dispatch({ type: ACTIONS.OPEN_CONTENT_SEARCH })),
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Renders a keyboard combo like "Ctrl+Shift+P" as individual keycap chips. */
function ShortcutBadge({ combo, active }) {
  if (!combo) return null;
  const keys = combo.split("+");
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
      {keys.map((k, i) => (
        <React.Fragment key={k}>
          <kbd style={{
            padding:      "1px 6px",
            fontSize:     10,
            fontFamily:   "monospace",
            letterSpacing:"0.02em",
            background:   "#1a1a1a",
            border:       "1px solid #555",
            borderBottom: "2px solid #3a3a3a",
            borderRadius: 4,
            color:        active ? "#9cdcfe" : "#888",
            lineHeight:   1.6,
            whiteSpace:   "nowrap",
          }}>
            {k}
          </kbd>
          {i < keys.length - 1 && (
            <span style={{ fontSize: 8, color: "#444" }}>+</span>
          )}
        </React.Fragment>
      ))}
    </span>
  );
}

/** One command row inside the list. */
function CommandRow({ cmd, isActive, onHover, onExecute }) {
  return (
    <button
      disabled={cmd.disabled}
      onClick={() => !cmd.disabled && onExecute(cmd)}
      onMouseEnter={onHover}
      style={{
        width:          "100%",
        textAlign:      "left",
        padding:        "8px 16px",
        background:     isActive && !cmd.disabled ? "#094771" : "transparent",
        border:         "none",
        cursor:         cmd.disabled ? "not-allowed" : "pointer",
        display:        "flex",
        alignItems:     "center",
        gap:            10,
        opacity:        cmd.disabled ? 0.38 : 1,
        transition:     "background 0.07s",
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: 15, flexShrink: 0, width: 22, textAlign: "center" }}>
        {cmd.icon}
      </span>

      {/* Label */}
      <span style={{
        fontSize: 13,
        color:    isActive ? "#ffffff" : "#cccccc",
        flex:     1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace:   "nowrap",
      }}>
        {cmd.label}
      </span>

      {/* Keyboard shortcut */}
      <ShortcutBadge combo={cmd.shortcut} active={isActive} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function CommandPalette({ workspace, dispatch }) {
  const isOpen = workspace?.search?.commandPaletteOpen ?? false;

  const [query,     setQuery]     = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef  = useRef(null);
  const overlayRef= useRef(null);

  // Focus input when palette opens; reset on close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [isOpen]);

  // All available commands, freshly computed from current workspace state
  const allCommands = buildCommands(dispatch, workspace);

  // Filter by query (searches label + category)
  const filtered = query.trim()
    ? allCommands.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : allCommands;

  // Reset active index whenever filter changes
  useEffect(() => setActiveIdx(0), [query]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        dispatch({ type: ACTIONS.CLOSE_COMMAND_PALETTE });
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isOpen, dispatch]);

  // Keyboard navigation within the list
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      dispatch({ type: ACTIONS.CLOSE_COMMAND_PALETTE });
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIdx];
      if (cmd && !cmd.disabled) cmd.action();
    }
  }, [filtered, activeIdx, dispatch]);

  if (!isOpen) return null;

  // Group by category for section headers
  const CATEGORY_ORDER = ["File", "Run", "Edit", "Search"];
  const byCategory = filtered.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Build a flat ordered list for keyboard-nav index tracking
  let flatIdx = 0;

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         10000,
        display:        "flex",
        alignItems:     "flex-start",
        justifyContent: "center",
        paddingTop:     60,
        background:     "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        ref={overlayRef}
        role="dialog"
        aria-label="Command Palette"
        aria-modal="true"
        style={{
          width:        "100%",
          maxWidth:     600,
          background:   "#252526",
          border:       "1px solid #454545",
          borderRadius: 10,
          boxShadow:    "0 24px 70px rgba(0,0,0,0.75)",
          overflow:     "hidden",
          display:      "flex",
          flexDirection:"column",
        }}
      >
        {/* ── Header bar ── */}
        <div style={{
          padding:       "8px 14px",
          borderBottom:  "1px solid #3a3a3a",
          background:    "#2d2d2d",
          display:       "flex",
          alignItems:    "center",
          gap:           8,
        }}>
          <span style={{ fontSize: 11, color: "#569cd6", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            ⌨ Command Palette
          </span>
          <span style={{ flex: 1 }} />
          <ShortcutBadge combo={shortcutsJson.commandPalette} active={false} />
        </div>

        {/* ── Search input ── */}
        <div style={{ position: "relative", padding: "10px 12px 8px" }}>
          <svg
            style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", color: "#888", pointerEvents: "none" }}
            width="13" height="13" viewBox="0 0 16 16" fill="currentColor"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input
            ref={inputRef}
            id="command-palette-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command…"
            aria-label="Search commands"
            style={{
              width:        "100%",
              paddingLeft:  34,
              paddingRight: 12,
              paddingTop:   9,
              paddingBottom:9,
              fontSize:     13,
              background:   "#3c3c3c",
              border:       "1px solid #007acc",
              borderRadius: 5,
              color:        "#cccccc",
              outline:      "none",
              boxSizing:    "border-box",
            }}
          />
        </div>

        {/* ── Result count hint ── */}
        {query.trim() && (
          <div style={{ padding: "0 14px 6px", fontSize: 10, color: "#555" }}>
            {filtered.length === 0 ? `No commands match "${query}"` : `${filtered.length} command${filtered.length !== 1 ? "s" : ""} found`}
          </div>
        )}

        {/* ── Command list ── */}
        <div
          role="listbox"
          aria-label="Commands"
          style={{ maxHeight: 400, overflowY: "auto", borderTop: "1px solid #2a2a2a" }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "20px", color: "#555", fontSize: 12, fontStyle: "italic", textAlign: "center" }}>
              No commands match your search.
            </div>
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const cmds = byCategory[cat];
              if (!cmds?.length) return null;
              return (
                <div key={cat}>
                  {/* Category header */}
                  <div style={{
                    padding:     "6px 16px 3px",
                    fontSize:    10,
                    fontWeight:  700,
                    letterSpacing:"0.12em",
                    textTransform:"uppercase",
                    color:       "#569cd6",
                    background:  "#1e1e1e",
                    borderTop:   "1px solid #2a2a2a",
                  }}>
                    {cat}
                  </div>

                  {/* Command rows */}
                  {cmds.map((cmd) => {
                    const thisIdx = flatIdx++;
                    return (
                      <CommandRow
                        key={cmd.id}
                        cmd={cmd}
                        isActive={thisIdx === activeIdx}
                        onHover={() => setActiveIdx(thisIdx)}
                        onExecute={(c) => c.action()}
                      />
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding:     "7px 16px",
          borderTop:   "1px solid #2a2a2a",
          background:  "#1e1e1e",
          display:     "flex",
          gap:         16,
          fontSize:    10,
          color:       "#4a4a4a",
        }}>
          <span>↑↓&nbsp; navigate</span>
          <span>↵&nbsp; execute</span>
          <span>Esc&nbsp; close</span>
        </div>
      </div>
    </div>
  );
}
