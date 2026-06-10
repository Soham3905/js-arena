import React from "react";
import EditorMonaco from "@monaco-editor/react";
import { ACTIONS, canWriteNode, getActiveContent, getActiveFile, getNodePermissions, getOpenTabs } from "../functions";

export default function Editor({ workspace, dispatch, readonly = false }) {
  const openTabs = getOpenTabs(workspace);
  const selectedFile = getActiveFile(workspace);
  const selectedContent = getActiveContent(workspace);
  const canWrite = selectedFile ? canWriteNode(workspace, selectedFile.id) : false;
  const permissions = selectedFile ? getNodePermissions(workspace, selectedFile.id) : null;
  const isReadonly = readonly || !canWrite;

  const language = selectedFile?.extension === "js" || selectedFile?.extension === "jsx" ? "javascript" : 
                   selectedFile?.extension === "ts" || selectedFile?.extension === "tsx" ? "typescript" :
                   selectedFile?.extension === "json" ? "json" : 
                   selectedFile?.extension === "html" ? "html" : 
                   selectedFile?.extension === "css" ? "css" : 
                   selectedFile?.extension === "md" ? "markdown" : "plaintext";

  return (
    <div className="flex h-full w-full flex-col min-w-0 min-h-0 bg-[#1e1e1e] overflow-hidden">
      {/* Tabs */}
      <div className="flex flex-wrap bg-[#2d2d2d] border-b border-[#1e1e1e] overflow-x-auto flex-none relative z-10">
        {openTabs.length ? (
          openTabs.map((tab) => {
            const node = workspace.fileTree?.[tab.fileId];
            const active = tab.fileId === workspace.tabs?.activeTabId;

            return (
              <button
                key={tab.fileId}
                type="button"
                onClick={() => dispatch({ type: ACTIONS.SWITCH_TAB, fileId: tab.fileId })}
                className={
                  "flex items-center gap-2 px-4 py-2 text-xs min-w-max border-r border-[#1e1e1e] border-t-2 " +
                  (active ? "bg-[#1e1e1e] text-white border-t-blue-500" : "bg-[#2d2d2d] text-gray-300 hover:bg-[#2d2d2d] hover:text-white border-t-transparent")
                }
              >
                <span className="text-white">{node ? node.name : tab.fileId}</span>
                {tab.dirty ? <span className="text-white">*</span> : null}
                <span
                  role="button"
                  tabIndex={0}
                  className="ml-2 text-gray-400 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                  onClick={(event) => {
                    event.stopPropagation();
                    dispatch({ type: ACTIONS.CLOSE_TAB, fileId: tab.fileId });
                  }}
                >
                  ✕
                </span>
              </button>
            );
          })
        ) : (
          <div className="text-sm text-gray-500 p-2">No open tabs</div>
        )}
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative bg-[#1e1e1e] z-0">
        {!selectedFile ? (
           <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">Select a file to edit</div>
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
      
      {/* Status Bar */}
      {selectedFile && (
        <div className="flex-none bg-[#007acc] text-white text-[10px] px-2 py-0.5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>{selectedFile.name}</span>
            <span>{isReadonly ? "Read Only" : "Editing"}</span>
            <span>{language.toUpperCase()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Spaces: {workspace.settings?.tabSize || 2}</span>
            <span>UTF-8</span>
          </div>
        </div>
      )}
    </div>
  );
}
