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

      {/* Center: Search */}
      <div className="flex-1 max-w-[380px] relative" ref={searchRef}>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#888] pointer-events-none"
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85-.017.017zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
          </svg>
          <input
            type="text"
            id="header-search"
            placeholder="Search files and content…"
            className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-[#252526] border border-[#4a4a4a] rounded text-[#cccccc] placeholder-[#666] focus:outline-none focus:ring-1 focus:ring-[#007acc] focus:border-[#007acc] transition-shadow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
        </div>
        {isSearchFocused && searchQuery.trim() !== "" && (
          <div className="absolute top-full left-0 w-full mt-1 bg-[#252526] border border-[#4a4a4a] rounded shadow-2xl max-h-[300px] overflow-auto z-50">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-[#888] text-[12px] italic">No results for "{searchQuery}"</div>
            ) : (
              <ul className="flex flex-col divide-y divide-[#3c3c3c]">
                {searchResults.map((item, index) => (
                  <li key={`${item.id}_${index}`}>
                    <button
                      className="w-full text-left px-3 py-2 hover:bg-[#094771] transition-colors group"
                      onClick={() => {
                        dispatch({ type: ACTIONS.OPEN_FILE, fileId: item.fileId });
                        setIsSearchFocused(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="font-medium text-[#cccccc] text-[12px] truncate">{item.path}</div>
                      <div className="text-[#888] text-[11px] truncate mt-0.5 group-hover:text-[#aaa]">
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

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 min-w-[200px] justify-end">
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
          title="Save (Ctrl+S)"
        >
          <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2 1h9l3 3v11H2V1zm7 0v4h4M5 9h6m-6 3h6"/>
          </svg>
          Save
        </button>

        <button
          id="header-run"
          className="flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium rounded transition-colors disabled:opacity-40 bg-[#0e7a0d] text-white hover:bg-[#1a9e19] border border-[#0e7a0d] disabled:cursor-not-allowed shadow-sm"
          disabled={!canRun}
          onClick={() => dispatch({ type: ACTIONS.RUN_ACTIVE_FILE, fileId: activeFile?.id })}
          title="Run file"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <polygon points="2,1 9,5 2,9"/>
          </svg>
          Run
        </button>
      </div>
    </div>
  );
}
