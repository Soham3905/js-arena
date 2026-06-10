import React, { useState, useRef, useEffect } from "react";
import { ACTIONS, canExecuteNode, canRedo, canUndo, canWriteNode, getActiveFile, getActiveTab, searchWorkspace } from "../functions";

export default function Header({ workspace, dispatch, title }) {
  const activeFile = getActiveFile(workspace);
  const activeTab = getActiveTab(workspace);
  const canSave = activeFile && activeTab?.dirty && canWriteNode(workspace, activeFile.id);
  const canRun = activeFile && canExecuteNode(workspace, activeFile.id);
  const activeLabel = activeFile ? `${activeFile.name}${activeTab?.dirty ? " ●" : ""}` : null;

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchResults = searchQuery.trim() ? searchWorkspace(workspace, searchQuery) : [];
  const searchRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <div className="flex h-full items-center justify-between gap-4 bg-[#f8f9fa] px-4 py-1 text-sm border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-4 min-w-[200px]">
        <div className="font-bold text-gray-800 tracking-wide">{title || workspace.workspace?.name || "Workspace"}</div>
        {activeLabel && (
          <div className="px-2 py-1 bg-white border rounded text-xs text-gray-600 truncate max-w-[200px]">
            {activeLabel}
          </div>
        )}
      </div>

      <div className="flex-1 max-w-[400px] relative" ref={searchRef}>
        <input
          type="text"
          placeholder="Search files and content..."
          className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-inner"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
        />
        {isSearchFocused && searchQuery.trim() !== "" && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg max-h-[300px] overflow-auto z-50">
            {searchResults.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 text-sm">No results found</div>
            ) : (
              <ul className="flex flex-col">
                {searchResults.map((item, index) => (
                  <li key={`${item.id}_${index}`} className="border-b border-gray-100 last:border-b-0">
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 transition-colors"
                      onClick={() => {
                        dispatch({ type: ACTIONS.OPEN_FILE, fileId: item.fileId });
                        setIsSearchFocused(false);
                      }}
                    >
                      <div className="font-medium text-gray-800">{item.path}</div>
                      <div className="text-xs text-gray-500 truncate mt-1">
                        {item.matchType === "content" ? `Line ${item.lineNumber}: ${item.lineText}` : "File match"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 min-w-[200px] justify-end">
        <button
          className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
          disabled={!canUndo(workspace)}
          title="Undo"
          onClick={() => dispatch({ type: ACTIONS.UNDO })}
        >
          ↶
        </button>
        <button
          className="px-2 py-1 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50"
          disabled={!canRedo(workspace)}
          title="Redo"
          onClick={() => dispatch({ type: ACTIONS.REDO })}
        >
          ↷
        </button>
        <div className="w-px h-4 bg-gray-300 mx-1" />
        <button
          className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded font-medium disabled:opacity-50"
          disabled={!canSave}
          onClick={() => dispatch({ type: ACTIONS.SAVE_FILE, fileId: activeFile?.id })}
        >
          Save
        </button>
        <button
          className="px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded font-medium disabled:opacity-50"
          disabled={!canRun}
          onClick={() => dispatch({ type: ACTIONS.RUN_ACTIVE_FILE, fileId: activeFile?.id })}
        >
          Run
        </button>
      </div>
    </div>
  );
}
