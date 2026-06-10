import React from "react";
import EditorMonaco from "@monaco-editor/react";
import { ACTIONS, canWriteNode, getActiveContent, getActiveFile, getNodePermissions, getOpenTabs } from "../functions";

function getLanguage(file) {
  if (!file) return "plaintext";
  const ext = file.extension || "";
  const map = { js: "javascript", jsx: "javascript", ts: "typescript", tsx: "typescript", json: "json", html: "html", css: "css", md: "markdown" };
  return map[ext] || "plaintext";
}

function getLangColor(lang) {
  const colors = {
    javascript: "#f7df1e",
    typescript: "#3178c6",
    json: "#f59e0b",
    html: "#e34c26",
    css: "#264de4",
    markdown: "#083fa1",
  };
  return colors[lang] || "#888";
}

export default function Editor({ workspace, dispatch, readonly = false }) {
  const openTabs = getOpenTabs(workspace);
  const selectedFile = getActiveFile(workspace);
  const selectedContent = getActiveContent(workspace);
  const canWrite = selectedFile ? canWriteNode(workspace, selectedFile.id) : false;
  const isReadonly = readonly || !canWrite;
  const language = getLanguage(selectedFile);

  return (
    <div className="flex h-full w-full flex-col min-w-0 min-h-0 bg-[#1e1e1e] overflow-hidden">
      {/* Tab Bar — VS Code style */}
      <div className="flex-none flex items-stretch bg-[#2d2d2d] border-b border-[#252526] overflow-x-auto" style={{ minHeight: 35 }}>
        {openTabs.length === 0 ? (
          <div className="flex items-center px-4 text-[12px] text-[#888] italic">No files open</div>
        ) : (
          openTabs.map((tab) => {
            const node = workspace.fileTree?.[tab.fileId];
            const active = tab.fileId === workspace.tabs?.activeTabId;
            const lang = getLanguage(node);

            return (
              <button
                key={tab.fileId}
                type="button"
                onClick={() => dispatch({ type: ACTIONS.SWITCH_TAB, fileId: tab.fileId })}
                className={`group flex items-center gap-2 px-4 text-[13px] min-w-max border-r border-[#252526] transition-none relative flex-none outline-none ${
                  active
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]"
                    : "bg-[#2d2d2d] text-[#969696] hover:text-[#cccccc] border-t-2 border-t-transparent"
                }`}
                style={{ height: 35 }}
              >
                {/* Language color dot */}
                <span
                  className="w-2 h-2 rounded-full flex-none opacity-80"
                  style={{ backgroundColor: getLangColor(lang) }}
                />
                <span className={tab.dirty ? "italic" : ""}>
                  {node ? node.name : tab.fileId}
                  {tab.dirty ? " ●" : ""}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  aria-label="Close tab"
                  className={`ml-1 flex items-center justify-center w-4 h-4 rounded text-[10px] transition-colors flex-none ${
                    active
                      ? "text-[#969696] hover:text-white hover:bg-white/10"
                      : "opacity-0 group-hover:opacity-100 text-[#969696] hover:text-white hover:bg-white/10"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: ACTIONS.CLOSE_TAB, fileId: tab.fileId });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      dispatch({ type: ACTIONS.CLOSE_TAB, fileId: tab.fileId });
                    }
                  }}
                >
                  ✕
                </span>
              </button>
            );
          })
        )}
      </div>

      {/* Breadcrumb path */}
      {selectedFile && (
        <div className="flex-none flex items-center px-3 py-0.5 bg-[#1e1e1e] border-b border-[#2d2d2d] text-[11px] text-[#858585]">
          <span>{selectedFile.path || selectedFile.name}</span>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative bg-[#1e1e1e]">
        {!selectedFile ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#555] gap-3">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-30">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="text-[13px]">Open a file from the Explorer to start editing</span>
          </div>
        ) : (
          <EditorMonaco
            height="100%"
            language={language}
            theme={workspace.settings?.theme === "light" ? "light" : "vs-dark"}
            value={selectedContent}
            options={{
              readOnly: isReadonly,
              minimap: { enabled: true },
              wordWrap: workspace.settings?.wordWrap ? "on" : "off",
              fontSize: workspace.settings?.fontSize || 14,
              tabSize: workspace.settings?.tabSize || 2,
              lineNumbers: "on",
              automaticLayout: true,
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              cursorBlinking: "smooth",
              smoothScrolling: true,
            }}
            onChange={(value) =>
              dispatch({
                type: ACTIONS.UPDATE_FILE_CONTENT,
                fileId: selectedFile.id,
                content: value || "",
              })
            }
          />
        )}
      </div>

      {/* Status Bar — VS Code blue bar */}
      <div className="flex-none flex items-center justify-between px-3 py-0.5 bg-[#007acc] text-white text-[11px]" style={{ minHeight: 22 }}>
        <div className="flex items-center gap-4">
          {selectedFile && (
            <>
              <span className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getLangColor(language) }}
                />
                {language.toUpperCase()}
              </span>
              <span>{isReadonly ? "🔒 Read Only" : "✎ Editing"}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span>Spaces: {workspace.settings?.tabSize || 2}</span>
          <span>UTF-8</span>
          {selectedFile && <span>{selectedFile.name}</span>}
        </div>
      </div>
    </div>
  );
}
