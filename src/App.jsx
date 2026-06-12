import React, { useEffect, useRef, useState, useMemo } from "react";
import { appConfig } from "./config";
import CommandPalette from "./components/CommandPalette";
import ConsolePanel from "./components/ConsolePanel";
import Editor from "./components/Editor";
import FileTree from "./components/FileTree";
import Header from "./components/Header";
import InfoPanel from "./components/InfoPanel";
import Placeholder from "./components/Placeholder";
import Preview from "./components/Preview";
import TestCasePanel from "./components/TestCasePanel";
import * as F from "./functions";
import { ALLOWED_EXTENSIONS, isAllowedExtension } from "./functions";
import { getWorkspacePart, setWorkspacePart } from "./db";
import { initShortcuts, destroyShortcuts } from "./shortcuts/shortcutManager";

const STORAGE_KEY = "sdui.appConfig.v4";
const EDIT_HISTORY_IDLE_MS = 500;

const REQUEST_ACTIONS = {
  ADD_FILE: "REQUEST_ADD_FILE",
  ADD_FOLDER: "REQUEST_ADD_FOLDER",
  COPY_NODE: "REQUEST_COPY_NODE",
  CUT_NODE: "REQUEST_CUT_NODE",
  DELETE_NODE: "REQUEST_DELETE_NODE",
  DUPLICATE_NODE: "REQUEST_DUPLICATE_NODE",
  MOVE_NODE: "REQUEST_MOVE_NODE",
  PASTE_NODE: "REQUEST_PASTE_NODE",
  RENAME_NODE: "REQUEST_RENAME_NODE",
  CHANGE_PRESET: "CHANGE_PRESET",
  RESIZE_PANEL: "RESIZE_PANEL",
  ADD_TEST_CASE: "ADD_TEST_CASE",
  UPDATE_TEST_CASE: "UPDATE_TEST_CASE",
  DELETE_TEST_CASE: "DELETE_TEST_CASE"
};

const availableComponents = {
  Header,
  FileTree,
  Editor,
  Preview,
  InfoPanel,
  ConsolePanel,
  TestCasePanel,
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-red-500 bg-red-50 h-full w-full overflow-auto">
          Something went wrong: {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}

const SectionWrapper = React.memo(({ section, registry, props, className = "", style = {} }) => {
  const Component = registry[section.type] || Placeholder;

  if (section.type === "Header") {
    return (
      <div className={`w-full h-full z-10 ${className}`} style={style} role="region" aria-label={section.title}>
        <ErrorBoundary>
          <Component {...props} />
        </ErrorBoundary>
      </div>
    );
  }

  // All panel sections render their own internal header — just provide a border wrapper
  return (
    <div
      className={`flex flex-col w-full h-full min-w-0 min-h-0 overflow-hidden border border-[#3c3c3c] ${className}`}
      style={style}
      role="region"
      aria-label={section.title}
    >
      <ErrorBoundary>
        <Component {...props} />
      </ErrorBoundary>
    </div>
  );
});

export default function App() {
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  // Controls the "no index.js found — create it?" modal
  const [showIndexModal, setShowIndexModal] = useState(false);
  const pendingEditRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  // Always-current workspace ref — used by shortcut handlers to avoid stale closures
  const workspaceRef = useRef(null);
  // Stable ref to dispatch — avoids shortcutManager needing a re-init on every render
  const dispatchRef = useRef(null);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 900);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  useEffect(() => { 
    async function loadData() {
      const savedStr = localStorage.getItem(STORAGE_KEY);
      let baseConfig = savedStr ? JSON.parse(savedStr) : null;

      if (!baseConfig) {
        baseConfig = { ...appConfig };
        baseConfig.layoutSizes = { explorerWidth: 280, testPanelWidth: 350, consoleHeight: 250 };
        baseConfig.layoutPreset = "vscode";
        await setWorkspacePart("fileContents", baseConfig.fileContents);
        await setWorkspacePart("history", baseConfig.history);
        await setWorkspacePart("runtime", baseConfig.runtime);
      } else {
        baseConfig.fileContents = await getWorkspacePart("fileContents") || {};
        baseConfig.history = await getWorkspacePart("history") || { undoStack: [], redoStack: [] };
        baseConfig.runtime = await getWorkspacePart("runtime") || { testCases: {}, executions: [], console: { logs: [] } };

        // Force the layout to reset from config.js so old 144-column configs don't break the new 100-column grid
        baseConfig.layout = appConfig.layout;
      }

      setWorkspace(F.hydrateWorkspace(baseConfig, appConfig));
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!workspace) return;
    // Keep workspaceRef in sync so shortcut handlers read the latest state
    workspaceRef.current = workspace;
  }, [workspace]);

  // Initialise the keyboard shortcut system once the workspace is ready
  useEffect(() => {
    if (!workspace || !dispatchRef.current) return;
    initShortcuts(() => workspaceRef.current, dispatchRef.current);
    return () => destroyShortcuts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!workspace]); // re-init only when workspace transitions null→loaded

  useEffect(() => {
    if (!workspace) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const { fileContents, history, runtime, ...localPart } = workspace;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localPart));

      setWorkspacePart("fileContents", fileContents).catch(console.error);
      setWorkspacePart("history", history).catch(console.error);
      setWorkspacePart("runtime", runtime).catch(console.error);
    }, 1000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [workspace]);

  useEffect(
    () => () => {
      if (pendingEditRef.current?.timerId) {
        window.clearTimeout(pendingEditRef.current.timerId);
      }
    },
    []
  );

  function clearPendingEdit() {
    if (pendingEditRef.current?.timerId) {
      window.clearTimeout(pendingEditRef.current.timerId);
    }
    pendingEditRef.current = null;
  }

  function flushPendingEdit() {
    const pending = pendingEditRef.current;
    if (!pending?.snapshot) return;

    if (pending.timerId) {
      window.clearTimeout(pending.timerId);
    }

    setWorkspace((prev) =>
      F.commitHistorySnapshot(prev, pending.snapshot, {
        type: F.ACTIONS.UPDATE_FILE_CONTENT,
        fileId: pending.fileId,
      })
    );
    pendingEditRef.current = null;
  }

  function scheduleEditorHistory(fileId, snapshot) {
    if (pendingEditRef.current?.timerId) {
      window.clearTimeout(pendingEditRef.current.timerId);
    }

    const timerId = window.setTimeout(() => {
      const pending = pendingEditRef.current;
      if (!pending?.snapshot) return;

      setWorkspace((prev) =>
        F.commitHistorySnapshot(prev, pending.snapshot, {
          type: F.ACTIONS.UPDATE_FILE_CONTENT,
          fileId: pending.fileId,
        })
      );
      pendingEditRef.current = null;
    }, EDIT_HISTORY_IDLE_MS);

    pendingEditRef.current = { fileId, snapshot, timerId };
  }

  function updateEditorContent(action) {
    setWorkspace((prev) => {
      const activePending = pendingEditRef.current;

      if (!activePending || activePending.fileId !== action.fileId) {
        scheduleEditorHistory(action.fileId, F.createHistorySnapshot(prev));
      } else {
        scheduleEditorHistory(action.fileId, activePending.snapshot);
      }

      return F.dispatchWorkspaceAction(prev, {
        ...action,
        recordHistory: false,
      });
    });
  }

  function applyWorkspaceAction(action) {
    setWorkspace((prev) => F.dispatchWorkspaceAction(prev, action));
  }

  function dispatch(action) {
    if (!action?.type) return;

    if (action.type === F.ACTIONS.UPDATE_FILE_CONTENT) {
      updateEditorContent(action);
      return;
    }

    flushPendingEdit();

    switch (action.type) {
      case REQUEST_ACTIONS.ADD_FOLDER: {
        const name = prompt("Enter Folder Name")?.trim();
        if (!name) return;
        applyWorkspaceAction({ type: F.ACTIONS.ADD_FOLDER, parentId: action.parentId, name });
        return;
      }
      case REQUEST_ACTIONS.ADD_FILE: {
        const name = prompt("Enter File Name")?.trim();
        if (!name) return;
        if (!isAllowedExtension(name)) {
          const ext = name.includes(".") ? name.split(".").pop() : "(none)";
          alert(
            `❌ Unsupported file type: ".${ext}"\n\n` +
            `Allowed extensions: ${ALLOWED_EXTENSIONS.map(e => "." + e).join(", ")}\n\n` +
            `Only .js and .jsx files can be executed. .txt, .json, and .md can be opened and edited.`
          );
          return;
        }
        applyWorkspaceAction({ type: F.ACTIONS.ADD_FILE, parentId: action.parentId, name });
        return;
      }
      case REQUEST_ACTIONS.RENAME_NODE: {
        const newName = prompt("Enter New Name", action.currentName || "")?.trim();
        if (!newName) return;
        const nodeBeingRenamed = workspaceRef.current?.fileTree?.[action.nodeId];
        if (nodeBeingRenamed?.type === "file") {
          if (!isAllowedExtension(newName)) {
            const ext = newName.includes(".") ? newName.split(".").pop() : "(none)";
            alert(
              `❌ Unsupported file type: ".${ext}"\n\n` +
              `Allowed extensions: ${ALLOWED_EXTENSIONS.map(e => "." + e).join(", ")}`
            );
            return;
          }
        }
        applyWorkspaceAction({ type: F.ACTIONS.RENAME_NODE, nodeId: action.nodeId, newName });
        return;
      }
      case REQUEST_ACTIONS.DELETE_NODE: {
        if (!confirm("Delete this item?")) return;
        applyWorkspaceAction({ type: F.ACTIONS.DELETE_NODE, nodeId: action.nodeId });
        return;
      }
      case REQUEST_ACTIONS.DUPLICATE_NODE:
        applyWorkspaceAction({ type: F.ACTIONS.DUPLICATE_NODE, nodeId: action.nodeId });
        return;
      case REQUEST_ACTIONS.COPY_NODE:
        setClipboard({ mode: "copy", nodeId: action.nodeId });
        return;
      case REQUEST_ACTIONS.CUT_NODE:
        setClipboard({ mode: "cut", nodeId: action.nodeId });
        return;
      case REQUEST_ACTIONS.PASTE_NODE:
        if (!clipboard?.nodeId) return;
        if (clipboard.mode === "copy") {
          applyWorkspaceAction({
            type: F.ACTIONS.DUPLICATE_NODE,
            nodeId: clipboard.nodeId,
            targetParentId: action.targetParentId,
          });
          return;
        }
        applyWorkspaceAction({
          type: F.ACTIONS.MOVE_NODE,
          nodeId: clipboard.nodeId,
          nextParentId: action.targetParentId,
        });
        setClipboard(null);
        return;
      case REQUEST_ACTIONS.MOVE_NODE:
        applyWorkspaceAction({
          type: F.ACTIONS.MOVE_NODE,
          nodeId: action.nodeId,
          nextParentId: action.nextParentId,
        });
        if (clipboard?.mode === "cut" && clipboard.nodeId === action.nodeId) {
          setClipboard(null);
        }
        return;
      case F.ACTIONS.RUN_PROJECT: {
        clearPendingEdit();
        // If there is no index.js yet, offer to create one instead of
        // silently failing with an error buried in the Output panel.
        if (!F.findEntryFile(workspaceRef.current)) {
          setShowIndexModal(true);
          return;
        }
        applyWorkspaceAction(action);
        return;
      }
      case F.ACTIONS.SAVE_FILE:
      case F.ACTIONS.RUN_ACTIVE_FILE:
      case F.ACTIONS.RUN_TESTS:
      case F.ACTIONS.OPEN_FILE:
      case F.ACTIONS.CLOSE_TAB:
      case F.ACTIONS.SWITCH_TAB:
      case F.ACTIONS.UNDO:
      case F.ACTIONS.REDO:
      case F.ACTIONS.ADD_TEST_CASE:
      case F.ACTIONS.UPDATE_TEST_CASE:
      case F.ACTIONS.DELETE_TEST_CASE:
      case F.ACTIONS.CHANGE_LAYOUT:
        clearPendingEdit();
        applyWorkspaceAction(action);
        return;
      // ── Search overlay ───────────────────────────────────────────────
      case F.ACTIONS.OPEN_QUICK_OPEN:
      case F.ACTIONS.OPEN_CONTENT_SEARCH:
      case F.ACTIONS.CLOSE_SEARCH:
        applyWorkspaceAction(action);
        return;
      // ── Command palette ──────────────────────────────────
      case F.ACTIONS.OPEN_COMMAND_PALETTE:
      case F.ACTIONS.CLOSE_COMMAND_PALETTE:
        applyWorkspaceAction(action);
        return;
      default:
        applyWorkspaceAction(action);
    }
  }

  // Keep dispatchRef in sync so shortcutManager always calls the latest dispatch
  dispatchRef.current = dispatch;

  /**
   * Called when the user clicks "Create" in the no-index.js modal.
   *
   * All four steps run inside a SINGLE setWorkspace call so React commits
   * them together — no intermediate renders, no stale-closure issues:
   *   1. addFile      — creates index.js in the workspace root folder
   *   2. updateContent — writes the starter template into it
   *   3. openTab      — opens it in the editor
   *   4. runProject   — bundles and executes immediately
   */
  function handleCreateIndexAndRun() {
    setShowIndexModal(false);
    setWorkspace((prev) => {
      const rootId = prev?.workspace?.rootNodeId;
      if (!rootId) return prev;

      // 1. Create index.js in the root folder.
      let next = F.addFile(prev, rootId, "index.js");

      // 2. Find the node that was just created.
      const newNode = Object.values(next.fileTree || {}).find(
        (n) => n && n.type === "file" && n.name === "index.js"
      );
      if (!newNode?.contentId) return next;

      // 3. Populate it with a minimal starter template.
      const starterCode = [
        "// index.js — entry point for Run Project",
        "// Import from other files in your workspace:",
        "//   import { myFunc } from './myFile.js';",
        "",
        'console.log("Project started!");',
      ].join("\n");
      next = F.updateContent(next, newNode.contentId, starterCode);

      // 4. Open the new file so the user sees it immediately.
      next = F.openTab(next, newNode.id, { pinned: false });

      // 5. Run the project right away (bundle + execute).
      next = F.runProject(next);

      return next;
    });
  }

  if (isMobile) {
    return (
      <div style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 50%, #16213e 100%)",
        color: "#fff",
        textAlign: "center",
        padding: "2rem",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "1.5rem" }}>🖥️</div>
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: 700,
          marginBottom: "1rem",
          background: "linear-gradient(90deg, #a78bfa, #60a5fa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Desktop Only
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "1rem", maxWidth: "320px", lineHeight: 1.6 }}>
          This IDE is designed for larger screens.
          <br />
          Please switch to a <strong style={{ color: "#c4b5fd" }}>desktop or laptop</strong> for the best experience.
        </p>
        <div style={{
          marginTop: "2rem",
          padding: "0.6rem 1.4rem",
          borderRadius: "8px",
          border: "1px solid #334155",
          color: "#64748b",
          fontSize: "0.85rem",
        }}>
          Minimum width: 900px
        </div>
      </div>
    );
  }

  if (loading || !workspace) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Loading IDE...</div>;
  }

  const componentConfig = F.createComponentConfig(workspace);
  const registry = F.resolveComponentRegistry(workspace.componentRegistry, availableComponents);

  const getSectionProps = (section) => {
    return {
      section,
      registry,
      props: {
        ...section.props,
        clipboard,
        componentConfig,
        dispatch,
        section,
        title: section.title,
        type: section.type,
        workspace,
      }
    };
  };

  return (
    <>
      {/* Command Palette — fixed overlay, rendered above the IDE grid */}
      <CommandPalette workspace={workspace} dispatch={dispatch} />

      {/* ── No index.js modal ─────────────────────────────────────────────── */}
      {showIndexModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="index-modal-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(2px)",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowIndexModal(false); }}
        >
          <div
            style={{
              background: "#252526",
              border: "1px solid #454545",
              borderRadius: 10,
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
              width: "100%",
              maxWidth: 440,
              padding: "28px 28px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              fontFamily: "'Segoe UI', system-ui, sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                background: "#1e3a5f",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 16 16" fill="#569cd6">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z"/>
                </svg>
              </div>
              <div>
                <div id="index-modal-title" style={{ color: "#ffffff", fontSize: 14, fontWeight: 600, lineHeight: 1.3 }}>
                  No Entry Point Found
                </div>
                <div style={{ color: "#888", fontSize: 11, marginTop: 2 }}>
                  Run Project needs an index.js to start
                </div>
              </div>
            </div>

            {/* Body */}
            <p style={{ color: "#cccccc", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
              <strong style={{ color: "#fff" }}>Run Project</strong> bundles all your
              files starting from a single entry point. Create{" "}
              <code style={{
                background: "#1e1e1e", color: "#9cdcfe",
                padding: "1px 6px", borderRadius: 4, fontSize: 12,
              }}>index.js</code>{" "}
              automatically and start coding right away.
            </p>

            {/* Preview */}
            <div style={{
              background: "#1e1e1e",
              border: "1px solid #3c3c3c",
              borderRadius: 6,
              padding: "10px 14px",
              fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
              fontSize: 12,
              lineHeight: 1.7,
            }}>
              <div style={{ color: "#608b4e" }}>{'// index.js — entry point for Run Project'}</div>
              <div style={{ color: "#608b4e" }}>{'// Import from other files in your workspace:'}</div>
              <div style={{ color: "#608b4e" }}>{"//   import { myFunc } from './myFile.js';"}</div>
              <div style={{ color: "#555", marginTop: 4 }}>&nbsp;</div>
              <div>
                <span style={{ color: "#dcdcaa" }}>console</span>
                <span style={{ color: "#d4d4d4" }}>.</span>
                <span style={{ color: "#dcdcaa" }}>log</span>
                <span style={{ color: "#d4d4d4" }}>(</span>
                <span style={{ color: "#ce9178" }}>&quot;Project started!&quot;</span>
                <span style={{ color: "#d4d4d4" }}>);</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
              <button
                id="index-modal-cancel"
                onClick={() => setShowIndexModal(false)}
                style={{
                  padding: "7px 18px", fontSize: 13, fontWeight: 500,
                  background: "transparent",
                  color: "#cccccc",
                  border: "1px solid #454545",
                  borderRadius: 6, cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#3a3a3a"; e.currentTarget.style.borderColor = "#666"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#454545"; }}
              >
                Cancel
              </button>
              <button
                id="index-modal-create"
                onClick={handleCreateIndexAndRun}
                style={{
                  padding: "7px 20px", fontSize: 13, fontWeight: 600,
                  background: "#0e7a0d",
                  color: "#ffffff",
                  border: "1px solid #0e7a0d",
                  borderRadius: 6, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1a9e19"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#0e7a0d"; }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2zm1 9H7V7h2v4zm0-5H7V4h2v2z"/>
                </svg>
                Create index.js
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="h-screen w-full overflow-hidden text-sm"
        style={{
          background: "#1e1e1e",
          display: "grid",
          gridTemplateColumns: `repeat(100, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(100, minmax(0, 1fr))`,
          gap: "1px",
        }}
      >
        {workspace.layout?.sections?.filter(s => s.visible).map(section => {
          const style = {
            gridColumn: `${section.position.colStart} / ${section.position.colEnd}`,
            gridRow: `${section.position.rowStart} / ${section.position.rowEnd}`
          };
          return <SectionWrapper key={section.id} {...getSectionProps(section)} style={style} />;
        })}
      </div>
    </>
  );
}
