import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  ACTIONS,
  canExecuteNode,
  canRedo,
  canUndo,
  canWriteNode,
  findEntryFile,
  getActiveFile,
  getActiveTab,
  searchFiles,
  searchContent,
} from "../functions";
import { LAYOUT_PRESETS, DEFAULT_LAYOUT_ID } from "../layouts";
import { getShortcutLabel } from "../shortcuts/shortcutManager";

// ────────────────────────────────────────────────────────────
// Layout SVG icons (small 28×20 diagrams representing each layout)
// ────────────────────────────────────────────────────────────
function LayoutIcon({ preset, size = 28 }) {
  const W = size;
  const H = Math.round(size * 0.72);
  const s = preset.sections;

  // Convert 100-grid coords to pixel coords
  const x = (col) => Math.round(((col - 1) / 100) * W);
  const y = (row) => Math.round(((row - 1) / 100) * H);
  const w = (c1, c2) => Math.max(1, x(c2) - x(c1));
  const h = (r1, r2) => Math.max(1, y(r2) - y(r1));

  const vis = preset.visibility;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", flexShrink: 0 }}>
      {/* Background */}
      <rect x={0} y={0} width={W} height={H} fill="#1e1e1e" rx={2} />
      {/* Header bar */}
      <rect x={x(s.header.colStart)} y={y(s.header.rowStart)} width={w(s.header.colStart, s.header.colEnd)} height={h(s.header.rowStart, s.header.rowEnd)} fill="#3c3c3c" />
      {/* Tree */}
      {vis.tree && <rect x={x(s.tree.colStart)} y={y(s.tree.rowStart)} width={w(s.tree.colStart, s.tree.colEnd)} height={h(s.tree.rowStart, s.tree.rowEnd)} fill="#252526" />}
      {/* Editor */}
      {vis.editor && <rect x={x(s.editor.colStart)} y={y(s.editor.rowStart)} width={w(s.editor.colStart, s.editor.colEnd)} height={h(s.editor.rowStart, s.editor.rowEnd)} fill="#1e1e2e" />}
      {/* TestCases */}
      {vis.testCases && <rect x={x(s.testCases.colStart)} y={y(s.testCases.rowStart)} width={w(s.testCases.colStart, s.testCases.colEnd)} height={h(s.testCases.rowStart, s.testCases.rowEnd)} fill="#2a2a3a" />}
      {/* Console */}
      {vis.console && <rect x={x(s.console.colStart)} y={y(s.console.rowStart)} width={w(s.console.colStart, s.console.colEnd)} height={h(s.console.rowStart, s.console.rowEnd)} fill="#1a1a1a" />}
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Layout Picker dropdown
// ────────────────────────────────────────────────────────────
function LayoutPicker({ activePresetId, dispatch }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const activePreset = LAYOUT_PRESETS.find((p) => p.id === activePresetId) || LAYOUT_PRESETS[0];

  function selectPreset(id) {
    dispatch({ type: ACTIONS.CHANGE_LAYOUT, layoutId: id });
    setOpen(false);
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        id="header-layout-picker"
        title="Change Layout"
        aria-label="Change layout"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 h-7 px-2.5 text-[12px] font-medium rounded border transition-colors
          ${open
            ? "bg-[#007acc]/20 border-[#007acc] text-white"
            : "bg-[#252526] border-[#4a4a4a] text-[#cccccc] hover:bg-[#3a3a3a] hover:border-[#666]"
          }`}
      >
        {/* Mini layout preview */}
        <LayoutIcon preset={activePreset} size={24} />
        <span className="hidden sm:inline truncate max-w-[80px]">{activePreset.name}</span>
        {/* Chevron */}
        <svg
          width="8" height="8" viewBox="0 0 10 6" fill="currentColor"
          style={{ opacity: 0.7, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s" }}
        >
          <path d="M0 0l5 6 5-6z" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          role="listbox"
          aria-label="Layout presets"
          className="absolute right-0 top-full mt-1.5 z-[100] bg-[#252526] border border-[#4a4a4a] rounded-lg shadow-2xl overflow-hidden"
          style={{ minWidth: 260, maxHeight: 420, overflowY: "auto" }}
        >
          {/* Heading */}
          <div className="px-4 pt-3 pb-2 border-b border-[#3c3c3c]">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#888]">
              Layout Presets
            </p>
          </div>

          {/* Preset list */}
          <ul className="p-1.5 flex flex-col gap-0.5">
            {LAYOUT_PRESETS.map((preset) => {
              const isActive = preset.id === activePreset.id;
              return (
                <li key={preset.id}>
                  <button
                    id={`layout-preset-${preset.id}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => selectPreset(preset.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors
                      ${isActive
                        ? "bg-[#007acc]/20 border border-[#007acc]/40 text-white"
                        : "text-[#cccccc] hover:bg-white/5 border border-transparent"
                      }`}
                  >
                    {/* SVG preview */}
                    <div className={`rounded flex-none p-0.5 ${isActive ? "ring-1 ring-[#007acc]" : "ring-1 ring-[#3c3c3c]"}`}>
                      <LayoutIcon preset={preset} size={40} />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-medium truncate">{preset.name}</span>
                        {isActive && (
                          <span className="flex-none text-[10px] px-1.5 py-0.5 rounded-full bg-[#007acc] text-white font-semibold leading-none">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#888] mt-0.5 truncate">{preset.description}</div>
                    </div>

                    {/* Check mark */}
                    {isActive && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-none text-[#007acc]">
                        <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Footer hint */}
          <div className="px-4 py-2.5 border-t border-[#3c3c3c]">
            <p className="text-[10px] text-[#555]">
              Tip: You can also edit <code className="text-[#888]">layout.sections</code> in config.js for full control.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Search Overlay — VS Code style, mode-aware
// ────────────────────────────────────────────────────────────
function SearchOverlay({ workspace, dispatch }) {
  const isOpen   = workspace?.search?.isOpen  ?? false;
  const mode     = workspace?.search?.mode    ?? "file";

  const [query, setQuery]               = useState("");
  const [activeIndex, setActiveIndex]   = useState(0);
  const inputRef                        = useRef(null);
  const overlayRef                      = useRef(null);

  // ── Compute results ──────────────────────────────────────
  const results = (() => {
    const q = query.trim();
    if (!q) return [];
    if (mode === "file") return searchFiles(workspace, q);
    return searchContent(workspace, q);
  })();

  // ── Auto-focus input when overlay opens ─────────────────
  useEffect(() => {
    if (isOpen) {
      // Small delay so the browser doesn't swallow the keystroke that opened it
      const id = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(id);
    } else {
      // Reset when closed
      setQuery("");
      setActiveIndex(0);
    }
  }, [isOpen]);

  // Reset active index when results change
  useEffect(() => { setActiveIndex(0); }, [results.length, mode]);

  // ── Close on outside click ───────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target)) {
        dispatch({ type: ACTIONS.CLOSE_SEARCH });
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, [isOpen, dispatch]);

  // ── Keyboard navigation inside the overlay ───────────────
  const handleKeyDown = useCallback((e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      dispatch({ type: ACTIONS.CLOSE_SEARCH });
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      openResult(results[activeIndex]);
    }
  }, [results, activeIndex]);

  function openResult(item) {
    dispatch({ type: ACTIONS.OPEN_FILE, fileId: item.fileId });
    dispatch({ type: ACTIONS.CLOSE_SEARCH });
  }

  if (!isOpen) return null;

  const modeLabel   = mode === "file" ? "Quick Open" : "Search";
  const placeholder = mode === "file"
    ? "Type a filename to open…"
    : "Type to search inside files…";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "60px",
        background: "rgba(0,0,0,0.45)",
      }}
    >
      <div
        ref={overlayRef}
        role="dialog"
        aria-label={modeLabel}
        style={{
          width: "100%",
          maxWidth: 560,
          background: "#252526",
          border: "1px solid #4a4a4a",
          borderRadius: 8,
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ── Mode toggle tabs ── */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid #3c3c3c",
          background: "#1e1e1e",
        }}>
          {[
            { id: "file",    label: "Files",   shortcut: getShortcutLabel("quickOpen") },
            { id: "content", label: "Content", shortcut: getShortcutLabel("searchContent") },
          ].map((tab) => {
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                id={`search-mode-${tab.id}`}
                onClick={() => dispatch({ type: tab.id === "file" ? ACTIONS.OPEN_QUICK_OPEN : ACTIONS.OPEN_CONTENT_SEARCH })}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#fff" : "#888",
                  background: "transparent",
                  border: "none",
                  borderBottom: active ? "2px solid #007acc" : "2px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "color 0.12s, border-color 0.12s",
                }}
              >
                {tab.label}
                <span style={{
                  fontSize: 10,
                  color: active ? "#569cd6" : "#555",
                  background: "#2d2d2d",
                  border: "1px solid #3c3c3c",
                  borderRadius: 3,
                  padding: "1px 5px",
                  fontFamily: "monospace",
                  letterSpacing: "0.03em",
                }}>
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search input ── */}
        <div style={{ position: "relative", padding: "10px 12px" }}>
          {/* Search icon */}
          <svg
            style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)", color: "#888", pointerEvents: "none" }}
            width="13" height="13" viewBox="0 0 16 16" fill="currentColor"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85-.017.017zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input
            ref={inputRef}
            id="search-overlay-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            style={{
              width: "100%",
              paddingLeft: 34,
              paddingRight: 12,
              paddingTop: 8,
              paddingBottom: 8,
              fontSize: 13,
              background: "#3c3c3c",
              border: "1px solid #007acc",
              borderRadius: 4,
              color: "#cccccc",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* ── Results list ── */}
        {query.trim() && (
          <div
            role="listbox"
            aria-label="Search results"
            style={{ maxHeight: 320, overflowY: "auto", borderTop: "1px solid #2d2d2d" }}
          >
            {results.length === 0 ? (
              <div style={{
                padding: "16px 20px",
                color: "#666",
                fontSize: 12,
                fontStyle: "italic",
                textAlign: "center",
              }}>
                {mode === "file"
                  ? `No files matching "${query}"`
                  : `No content matches for "${query}"`}
              </div>
            ) : (
              results.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={`${item.id}_${index}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => openResult(item)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 16px",
                      background: isActive ? "#094771" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      transition: "background 0.08s",
                    }}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    {/* File path */}
                    <span style={{ fontSize: 12, color: isActive ? "#fff" : "#cccccc", fontWeight: 500 }}>
                      {mode === "content"
                        ? <><span style={{ color: isActive ? "#9cdcfe" : "#888", marginRight: 4 }}>{item.name}:{item.lineNumber}</span></>
                        : item.path}
                    </span>
                    {/* Preview / subtitle */}
                    <span style={{ fontSize: 11, color: isActive ? "#aaa" : "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mode === "content" ? item.lineText : item.path}
                    </span>
                  </button>
                );
              })
            )}
            {/* Result count footer */}
            {results.length > 0 && (
              <div style={{
                padding: "6px 16px",
                fontSize: 10,
                color: "#555",
                borderTop: "1px solid #2d2d2d",
                background: "#1e1e1e",
              }}>
                {results.length} result{results.length !== 1 ? "s" : ""}
                {mode === "content" && " · Use ↑↓ to navigate, Enter to open"}
                {mode === "file"    && " · Enter to open, Esc to close"}
              </div>
            )}
          </div>
        )}

        {/* Empty-state hint when no query yet */}
        {!query.trim() && (
          <div style={{
            padding: "12px 16px 16px",
            fontSize: 11,
            color: "#555",
            borderTop: "1px solid #2d2d2d",
          }}>
            {mode === "file"
              ? "Start typing to search files by name or path"
              : "Start typing to search inside file contents"}
            <div style={{ marginTop: 6, display: "flex", gap: 12 }}>
              <span style={{ color: "#444" }}>↑↓ navigate</span>
              <span style={{ color: "#444" }}>↵ open</span>
              <span style={{ color: "#444" }}>Esc close</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────
export default function Header({ workspace, dispatch, title }) {
  const activeFile = getActiveFile(workspace);
  const activeTab = getActiveTab(workspace);
  const canSave = activeFile && activeTab?.dirty && canWriteNode(workspace, activeFile.id);
  const canRunFile = activeFile && canExecuteNode(workspace, activeFile.id);
  const entryFile = findEntryFile(workspace);
  const canRunProject = entryFile !== null;
  const activeLabel = activeFile ? `${activeFile.name}${activeTab?.dirty ? " ●" : ""}` : null;

  // The active layout preset ID is stored on workspace.layout.activePresetId (set by changeLayout)
  // Fall back to "default" if not yet set.
  const activePresetId = workspace?.layout?.activePresetId || DEFAULT_LAYOUT_ID;

  // Shortcut labels for tooltips — read dynamically from shortcuts.json
  const kbSave  = getShortcutLabel("saveFile");
  const kbRun   = getShortcutLabel("runFile");
  const kbTests = getShortcutLabel("runTests");
  const kbSearch = getShortcutLabel("quickOpen");

  return (
    <>
      {/* VS Code-style search overlay — rendered as a portal-like fixed overlay */}
      <SearchOverlay workspace={workspace} dispatch={dispatch} />

      <div className="flex h-full items-center justify-between gap-4 bg-[#3c3c3c] px-4 py-1 text-sm border-b border-[#252526]">
        {/* Left: Logo + workspace name + active file */}
        <div className="flex items-center gap-3 min-w-[180px]">
          {/* VS Code-style icon */}
          <div className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none">
              <path d="M74.9 5.1L37.3 40.2 15.6 23.4 5 29.3v41.4l10.6 5.9L37.3 59.8l37.6 35.1L95 88.3V11.7L74.9 5.1z" fill="#007ACC"/>
            </svg>
            <span className="font-semibold text-[13px] text-white tracking-wide">
              {title || workspace.workspace?.name || "SDUI IDE"}
            </span>
          </div>

          {activeLabel && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#252526] border border-[#4a4a4a] rounded text-[11px] text-[#cccccc] truncate max-w-[160px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#007acc] flex-none" />
              {activeLabel}
            </div>
          )}
        </div>

        {/* Center: Quick Open trigger (replaces always-on search input) */}
        <div className="flex-1 max-w-[380px]">
          <button
            id="header-search-trigger"
            title={`Quick Open (${kbSearch})`}
            aria-label="Quick Open — search files"
            onClick={() => dispatch({ type: ACTIONS.OPEN_QUICK_OPEN })}
            className="w-full flex items-center gap-2 pl-3 pr-2 py-1.5 text-[12px] bg-[#3a3a3a] border border-[#555] rounded text-[#888] hover:bg-[#444] hover:border-[#666] hover:text-[#aaa] transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="flex-none">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85-.017.017zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
            <span className="flex-1 text-left">Search files…</span>
            <kbd className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded bg-[#252526] border border-[#4a4a4a] text-[#666] font-mono">
              {kbSearch}
            </kbd>
          </button>
        </div>

        {/* Right: Layout picker + Actions */}
        <div className="flex items-center gap-1.5 min-w-[200px] justify-end">
          {/* Layout Picker */}
          <LayoutPicker activePresetId={activePresetId} dispatch={dispatch} />

          <div className="w-px h-4 bg-white/15 mx-1" />

          <button
            id="header-undo"
            className="w-7 h-7 flex items-center justify-center text-[#cccccc] hover:bg-white/10 rounded disabled:opacity-30 transition-colors text-[16px]"
            disabled={!canUndo(workspace)}
            title="Undo (Ctrl+Z)"
            onClick={() => dispatch({ type: ACTIONS.UNDO })}
          >
            ↶
          </button>
          <button
            id="header-redo"
            className="w-7 h-7 flex items-center justify-center text-[#cccccc] hover:bg-white/10 rounded disabled:opacity-30 transition-colors text-[16px]"
            disabled={!canRedo(workspace)}
            title="Redo (Ctrl+Y)"
            onClick={() => dispatch({ type: ACTIONS.REDO })}
          >
            ↷
          </button>

          <div className="w-px h-4 bg-white/15 mx-1" />

          <button
            id="header-save"
            className="flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium rounded transition-colors disabled:opacity-40 bg-[#252526] text-[#cccccc] hover:bg-[#3a3a3a] border border-[#4a4a4a] disabled:cursor-not-allowed"
            disabled={!canSave}
            onClick={() => dispatch({ type: ACTIONS.SAVE_FILE, fileId: activeFile?.id })}
            title={`Save (${kbSave})`}
          >
            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 1h9l3 3v11H2V1zm7 0v4h4M5 9h6m-6 3h6"/>
            </svg>
            Save
          </button>

          <button
            id="header-run-file"
            className="flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium rounded transition-colors disabled:opacity-40 bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a] border border-[#333] disabled:cursor-not-allowed shadow-sm"
            disabled={!canRunFile}
            onClick={() => dispatch({ type: ACTIONS.RUN_ACTIVE_FILE, fileId: activeFile?.id })}
            title={`Run file (${kbRun})`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <polygon points="2,1 9,5 2,9"/>
            </svg>
            Run File
          </button>
          <button
            id="header-run-project"
            className="flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium rounded transition-colors bg-[#0e7a0d] text-white hover:bg-[#1a9e19] border border-[#0e7a0d] shadow-sm"
            onClick={() => dispatch({ type: ACTIONS.RUN_PROJECT })}
            title={canRunProject ? `Run Project — index.js` : `No index.js found — click to auto-create and run your project`}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <polygon points="2,1 9,5 2,9"/>
            </svg>
            Run Project
          </button>
        </div>
      </div>
    </>
  );
}
