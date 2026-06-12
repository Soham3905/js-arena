import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaFolder, FaFolderOpen, FaFileAlt, FaFileCode, FaFileImage, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import ContextMenu from "./ContextMenu";
import {
  ACTIONS,
  createTree,
  getRootNodeId,
  searchContent,
} from "../functions";
import shortcutsJson from "../shortcuts/shortcuts.json";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const REQUEST_ACTIONS = {
  ADD_FILE:      "REQUEST_ADD_FILE",
  ADD_FOLDER:    "REQUEST_ADD_FOLDER",
  COPY_NODE:     "REQUEST_COPY_NODE",
  CUT_NODE:      "REQUEST_CUT_NODE",
  DELETE_NODE:   "REQUEST_DELETE_NODE",
  DUPLICATE_NODE:"REQUEST_DUPLICATE_NODE",
  MOVE_NODE:     "REQUEST_MOVE_NODE",
  PASTE_NODE:    "REQUEST_PASTE_NODE",
  RENAME_NODE:   "REQUEST_RENAME_NODE",
};

// Human-readable labels + categories for each shortcut command
const SHORTCUT_META = {
  saveFile:       { label: "Save File",           category: "File",   icon: "💾" },
  runFile:        { label: "Run File",            category: "Run",    icon: "▶" },
  runTests:       { label: "Run Tests",           category: "Run",    icon: "🧪" },
  renameNode:     { label: "Rename",              category: "Edit",   icon: "✏️" },
  deleteNode:     { label: "Delete",              category: "Edit",   icon: "🗑" },
  quickOpen:      { label: "Quick Open",          category: "Search", icon: "🔍" },
  searchContent:  { label: "Search in Files",     category: "Search", icon: "🔎" },
  commandPalette: { label: "Command Palette",     category: "Search", icon: "⌨" },
  undo:           { label: "Undo",                category: "Edit",   icon: "↶" },
  redo:           { label: "Redo",                category: "Edit",   icon: "↷" },
};

// Group shortcuts by category
function groupShortcuts() {
  const groups = {};
  for (const [id, combo] of Object.entries(shortcutsJson)) {
    const meta = SHORTCUT_META[id] || { label: id, category: "Other", icon: "•" };
    if (!groups[meta.category]) groups[meta.category] = [];
    groups[meta.category].push({ id, combo, ...meta });
  }
  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// File icon helper
// ─────────────────────────────────────────────────────────────────────────────

function getFileIcon(extension) {
  switch (extension) {
    case "js":
    case "jsx": return <FaFileCode className="text-yellow-400" size={13} />;
    case "ts":
    case "tsx": return <FaFileCode className="text-blue-400"   size={13} />;
    case "json":return <FaFileCode className="text-orange-400" size={13} />;
    case "md":  return <FaFileAlt  className="text-gray-400"   size={13} />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":return <FaFileImage className="text-purple-400" size={13} />;
    default:    return <FaFileAlt  className="text-gray-400"   size={13} />;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Bar Button
// ─────────────────────────────────────────────────────────────────────────────

function ActivityButton({ id, title, active, onClick, children }) {
  return (
    <button
      id={id}
      title={title}
      aria-label={title}
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        position: "relative",
        color: active ? "#ffffff" : "#858585",
        transition: "color 0.15s",
        outline: "none",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#cccccc"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#858585"; }}
    >
      {/* Active indicator bar */}
      {active && (
        <span style={{
          position: "absolute",
          left: 0, top: "50%", transform: "translateY(-50%)",
          width: 2, height: 24,
          background: "#007acc",
          borderRadius: "0 2px 2px 0",
        }} />
      )}
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Explorer (existing FileTree)
// ─────────────────────────────────────────────────────────────────────────────

function FileTreeNode({
  node, depth, activeFileId, allowAddFile, allowAddFolder,
  allowDelete, allowRename, clipboard, dispatch, rootNodeId, workspace, onContextMenu,
}) {
  const isFolder   = node.type === "folder";
  const isSelected = activeFileId === node.id;
  const isRoot     = node.id === rootNodeId;
  const indentPx   = depth * 12;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isFolder) dispatch({ type: ACTIONS.TOGGLE_FOLDER, nodeId: node.id });
    else          dispatch({ type: ACTIONS.OPEN_FILE, fileId: node.id });
  };

  const menuItems = [];
  if (isFolder) {
    if (allowAddFile)   menuItems.push({ label: "New File",   action: () => dispatch({ type: REQUEST_ACTIONS.ADD_FILE,   parentId: node.id }) });
    if (allowAddFolder) menuItems.push({ label: "New Folder", action: () => dispatch({ type: REQUEST_ACTIONS.ADD_FOLDER, parentId: node.id }) });
  }
  if (!isRoot) {
    if (menuItems.length > 0) menuItems.push({ type: "separator" });
    if (allowRename) menuItems.push({ label: "Rename", action: () => dispatch({ type: REQUEST_ACTIONS.RENAME_NODE, nodeId: node.id, currentName: node.name }) });
    if (allowDelete) menuItems.push({ label: "Delete", action: () => dispatch({ type: REQUEST_ACTIONS.DELETE_NODE, nodeId: node.id }) });
    menuItems.push({ type: "separator" });
    menuItems.push({ label: "Cut",  action: () => dispatch({ type: REQUEST_ACTIONS.CUT_NODE,  nodeId: node.id }) });
    menuItems.push({ label: "Copy", action: () => dispatch({ type: REQUEST_ACTIONS.COPY_NODE, nodeId: node.id }) });
  }
  if (isFolder && clipboard?.nodeId) {
    menuItems.push({ type: "separator" });
    menuItems.push({ label: "Paste", action: () => dispatch({ type: REQUEST_ACTIONS.PASTE_NODE, targetParentId: node.id }) });
  }

  return (
    <li>
      <div
        className={`group flex items-center h-[22px] cursor-pointer select-none text-[13px] transition-colors ${
          isSelected ? "bg-[#094771] text-white" : "text-[#cccccc] hover:bg-[#2a2d2e]"
        }`}
        style={{ paddingLeft: `${indentPx + 8}px`, paddingRight: "4px" }}
        onClick={handleToggle}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e, node, menuItems); }}
      >
        <span className="w-4 flex-none flex items-center justify-center mr-0.5">
          {isFolder ? (node.expanded ? <FaChevronDown size={9} className="opacity-70" /> : <FaChevronRight size={9} className="opacity-70" />) : null}
        </span>
        <span className="mr-1.5 flex-none flex items-center">
          {isFolder
            ? (node.expanded ? <FaFolderOpen className="text-[#e8c27a]" size={13} /> : <FaFolder className="text-[#e8c27a]" size={13} />)
            : getFileIcon(node.extension)}
        </span>
        <span className={`truncate flex-1 ${isRoot ? "font-semibold text-[#bbbbbb] uppercase text-[11px] tracking-wider" : ""}`}>
          {node.name}
        </span>
        {!isRoot && menuItems.length > 0 && (
          <div
            className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 ml-1 flex-none"
            onClick={(e) => { e.stopPropagation(); onContextMenu(e, node, menuItems); }}
          >
            <MdMoreVert size={14} className="opacity-70" />
          </div>
        )}
      </div>
      {isFolder && node.expanded && node.children?.length ? (
        <ul>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id} depth={depth + 1} activeFileId={activeFileId}
              allowAddFile={allowAddFile} allowAddFolder={allowAddFolder}
              allowDelete={allowDelete} allowRename={allowRename}
              clipboard={clipboard} dispatch={dispatch} node={child}
              rootNodeId={rootNodeId} workspace={workspace} onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ExplorerPanel({ workspace, dispatch, allowAddFile, allowAddFolder, allowDelete, allowRename, clipboard }) {
  const [contextMenu, setContextMenu] = useState(null);
  const tree       = createTree(workspace);
  const activeFileId = workspace.tabs?.activeTabId || null;
  const rootNodeId   = getRootNodeId(workspace);

  const handleContextMenu = (e, node, items) => {
    e.preventDefault(); e.stopPropagation();
    if (items.length === 0) return;
    setContextMenu({ x: e.clientX, y: e.clientY, node, items });
  };

  return (
    <div className="flex flex-col h-full bg-[#252526] overflow-hidden select-none" onClick={() => setContextMenu(null)}>
      {/* Panel header */}
      <div className="flex-none flex items-center justify-between px-3 py-2 border-b border-[#3c3c3c]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#bbbbbb]">Explorer</span>
        <div className="flex items-center gap-1">
          {allowAddFile && (
            <button
              title="New File"
              className="p-1 rounded text-[#bbbbbb] hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => dispatch({ type: REQUEST_ACTIONS.ADD_FILE, parentId: rootNodeId })}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M9 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7L9 2zm0 1.5L12.5 7H9V3.5zM8 9h1v2h2v1H9v2H8v-2H6v-1h2V9z"/>
              </svg>
            </button>
          )}
          {allowAddFolder && (
            <button
              title="New Folder"
              className="p-1 rounded text-[#bbbbbb] hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => dispatch({ type: REQUEST_ACTIONS.ADD_FOLDER, parentId: rootNodeId })}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 4H8L6 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zm-4 5H8v2H7V9H5V8h2V6h1v2h2v1z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-1">
        {tree ? (
          <ul className="list-none m-0 p-0">
            <FileTreeNode
              depth={0} activeFileId={activeFileId}
              allowAddFile={allowAddFile} allowAddFolder={allowAddFolder}
              allowDelete={allowDelete} allowRename={allowRename}
              clipboard={clipboard} dispatch={dispatch}
              node={tree} rootNodeId={rootNodeId}
              workspace={workspace} onContextMenu={handleContextMenu}
            />
          </ul>
        ) : (
          <div className="p-4 text-sm text-[#888] italic text-center">Empty Workspace</div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={() => setContextMenu(null)} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Content Search
// ─────────────────────────────────────────────────────────────────────────────

function SearchPanel({ workspace, dispatch }) {
  const [query, setQuery]           = useState("");
  const [activeIdx, setActiveIdx]   = useState(0);
  const inputRef                    = useRef(null);

  // Auto-focus when panel becomes visible
  useEffect(() => {
    const id = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, []);

  const results = query.trim() ? searchContent(workspace, query) : [];

  // Group results by file
  const byFile = results.reduce((acc, r) => {
    if (!acc[r.fileId]) acc[r.fileId] = { name: r.name, path: r.path, lines: [] };
    acc[r.fileId].lines.push(r);
    return acc;
  }, {});

  const flatResults = results; // for keyboard nav

  useEffect(() => setActiveIdx(0), [query]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, flatResults.length - 1)); return; }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); return; }
    if (e.key === "Enter" && flatResults[activeIdx]) {
      e.preventDefault();
      dispatch({ type: ACTIONS.OPEN_FILE, fileId: flatResults[activeIdx].fileId });
    }
  }, [flatResults, activeIdx, dispatch]);

  let globalIdx = 0;

  return (
    <div className="flex flex-col h-full bg-[#252526] overflow-hidden">
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-3 py-2 border-b border-[#3c3c3c]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#bbbbbb]">Search</span>
        {results.length > 0 && (
          <span className="text-[10px] text-[#666]">{results.length} result{results.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Search input */}
      <div style={{ padding: "10px 10px 6px" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "#888", pointerEvents: "none" }}
            width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85-.017.017zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input
            ref={inputRef}
            id="sidebar-search-input"
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search in files…"
            style={{
              width: "100%",
              paddingLeft: 26,
              paddingRight: 8,
              paddingTop: 6,
              paddingBottom: 6,
              fontSize: 12,
              background: "#3c3c3c",
              border: "1px solid #007acc",
              borderRadius: 4,
              color: "#cccccc",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <p style={{ fontSize: 10, color: "#555", marginTop: 5, marginBottom: 0 }}>
          ↑↓ navigate · Enter open · Ctrl+Shift+F for overlay
        </p>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {!query.trim() ? (
          <div style={{ padding: "20px 14px", textAlign: "center" }}>
            <svg style={{ margin: "0 auto 10px", display: "block", opacity: 0.2 }} width="32" height="32" viewBox="0 0 16 16" fill="#ccc">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85-.017.017zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
            </svg>
            <p style={{ fontSize: 11, color: "#555", lineHeight: 1.6 }}>
              Search across all<br />file contents
            </p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: "16px 14px", textAlign: "center", fontSize: 11, color: "#666", fontStyle: "italic" }}>
            No results for "{query}"
          </div>
        ) : (
          Object.entries(byFile).map(([fileId, file]) => (
            <div key={fileId}>
              {/* File group header */}
              <div style={{
                padding: "5px 12px 3px",
                fontSize: 11,
                fontWeight: 600,
                color: "#cccccc",
                background: "#2d2d2d",
                borderTop: "1px solid #3c3c3c",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}>
                <FaFileCode size={11} className="text-yellow-400 flex-none" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
              </div>
              {/* Line matches */}
              {file.lines.map((r) => {
                const thisIdx = globalIdx++;
                const isActive = thisIdx === activeIdx;
                return (
                  <button
                    key={r.id}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "4px 12px 4px 24px",
                      background: isActive ? "#094771" : "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                    onMouseEnter={() => setActiveIdx(thisIdx)}
                    onClick={() => dispatch({ type: ACTIONS.OPEN_FILE, fileId: r.fileId })}
                  >
                    <span style={{ fontSize: 11, color: isActive ? "#aaa" : "#666", fontFamily: "monospace", flexShrink: 0 }}>
                      {r.lineNumber}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: isActive ? "#fff" : "#cccccc",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}>
                      {r.lineText}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Panel: Keyboard Shortcuts Reference
// ─────────────────────────────────────────────────────────────────────────────

function KbdKey({ children }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      padding: "1px 5px",
      background: "#1e1e1e",
      border: "1px solid #555",
      borderBottom: "2px solid #444",
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "monospace",
      color: "#c9d1d9",
      whiteSpace: "nowrap",
      letterSpacing: "0.02em",
      lineHeight: 1.5,
    }}>
      {children}
    </span>
  );
}

function ShortcutsPanel() {
  const groups = groupShortcuts();
  const categoryOrder = ["File", "Run", "Search", "Edit"];

  return (
    <div className="flex flex-col h-full bg-[#252526] overflow-hidden">
      {/* Header */}
      <div className="flex-none px-3 py-2 border-b border-[#3c3c3c]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#bbbbbb]">
          Keyboard Shortcuts
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 0 16px" }}>
        {categoryOrder.map(cat => {
          const items = groups[cat];
          if (!items?.length) return null;
          return (
            <div key={cat} style={{ marginBottom: 4 }}>
              {/* Category label */}
              <div style={{
                padding: "6px 12px 4px",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#569cd6",
                borderTop: cat !== categoryOrder[0] ? "1px solid #2d2d2d" : "none",
                marginTop: cat !== categoryOrder[0] ? 4 : 0,
              }}>
                {cat}
              </div>

              {/* Shortcut rows */}
              {items.map(({ id, label, combo, icon }) => {
                // Split combo into individual key tokens for rendering
                const keys = combo.split("+");
                return (
                  <div
                    key={id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "5px 12px",
                      gap: 8,
                      transition: "background 0.1s",
                      cursor: "default",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "#2a2d2e"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    {/* Label */}
                    <span style={{ fontSize: 12, color: "#cccccc", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ marginRight: 5, fontSize: 11 }}>{icon}</span>
                      {label}
                    </span>

                    {/* Key combo */}
                    <span style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                      {keys.map((k, i) => (
                        <React.Fragment key={k}>
                          <KbdKey>{k}</KbdKey>
                          {i < keys.length - 1 && (
                            <span style={{ fontSize: 9, color: "#555" }}>+</span>
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Bar Icons (SVG)
// ─────────────────────────────────────────────────────────────────────────────

function IconExplorer({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function IconSearch({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      <line x1="11" y1="8" x2="11" y2="14"/>
      <line x1="8" y1="11" x2="14" y2="11"/>
    </svg>
  );
}

function IconKeyboard({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export: the full sidebar (activity bar + panel)
// ─────────────────────────────────────────────────────────────────────────────

export default function FileTree({
  workspace, dispatch,
  allowAddFile, allowAddFolder, allowDelete, allowRename, clipboard,
}) {
  const [activePanel, setActivePanel] = useState("explorer");

  function togglePanel(panel) {
    setActivePanel(p => p === panel ? panel : panel); // always show clicked
  }

  const PANELS = [
    { id: "explorer", title: "Explorer",            Icon: IconExplorer },
    { id: "search",   title: "Search (Ctrl+Shift+F)",Icon: IconSearch  },
    { id: "shortcuts",title: "Keyboard Shortcuts",  Icon: IconKeyboard },
  ];

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden" }}>

      {/* ── Activity Bar ── */}
      <div style={{
        width: 40,
        flexShrink: 0,
        background: "#333333",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 4,
        paddingBottom: 4,
        borderRight: "1px solid #252526",
      }}>
        {PANELS.map(({ id, title, Icon }) => (
          <ActivityButton
            key={id}
            id={`sidebar-tab-${id}`}
            title={title}
            active={activePanel === id}
            onClick={() => togglePanel(id)}
          >
            <Icon size={22} />
          </ActivityButton>
        ))}
      </div>

      {/* ── Panel Content ── */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        {activePanel === "explorer" && (
          <ExplorerPanel
            workspace={workspace} dispatch={dispatch}
            allowAddFile={allowAddFile} allowAddFolder={allowAddFolder}
            allowDelete={allowDelete} allowRename={allowRename}
            clipboard={clipboard}
          />
        )}
        {activePanel === "search" && (
          <SearchPanel workspace={workspace} dispatch={dispatch} />
        )}
        {activePanel === "shortcuts" && (
          <ShortcutsPanel />
        )}
      </div>
    </div>
  );
}
