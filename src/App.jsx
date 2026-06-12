import React, { useEffect, useRef, useState, useMemo } from "react";
import { appConfig } from "./config";
import ConsolePanel from "./components/ConsolePanel";
import Editor from "./components/Editor";
import FileTree from "./components/FileTree";
import Header from "./components/Header";
import InfoPanel from "./components/InfoPanel";
import Placeholder from "./components/Placeholder";
import Preview from "./components/Preview";
import TestCasePanel from "./components/TestCasePanel";
import * as F from "./functions";
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
        applyWorkspaceAction({ type: F.ACTIONS.ADD_FILE, parentId: action.parentId, name });
        return;
      }
      case REQUEST_ACTIONS.RENAME_NODE: {
        const newName = prompt("Enter New Name", action.currentName || "")?.trim();
        if (!newName) return;
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
      default:
        applyWorkspaceAction(action);
    }
  }

  // Keep dispatchRef in sync so shortcutManager always calls the latest dispatch
  dispatchRef.current = dispatch;

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
  );
}
