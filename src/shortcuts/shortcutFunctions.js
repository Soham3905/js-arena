/**
 * shortcutFunctions.js
 *
 * Contains the actual action handlers for each keyboard shortcut command.
 * Functions here ONLY delegate to the existing dispatch / action architecture —
 * no business logic lives here. This keeps commands decoupled from key bindings.
 *
 * Usage:
 *   const fns = createShortcutFunctions(getWorkspace, dispatch);
 *   fns.saveFile();   // dispatches SAVE_FILE for the active file
 */

import { ACTIONS, getActiveFile, getActiveFileId } from "../functions";

// REQUEST_ACTIONS mirror the local constants in App.jsx.
// These are the "UI-level" actions that need prompts/confirms before becoming
// real workspace actions. They are handled by the dispatch() function in App.jsx.
const REQUEST_ACTIONS = {
  RENAME_NODE: "REQUEST_RENAME_NODE",
  DELETE_NODE: "REQUEST_DELETE_NODE",
};

/**
 * Creates a map of command-id → handler function.
 *
 * @param {() => object} getWorkspace  – Returns the current workspace snapshot.
 *                                       Must be a getter (not the snapshot itself)
 *                                       so handlers always read the latest state.
 * @param {(action: object) => void} dispatch  – The central App dispatch function.
 * @returns {Record<string, () => void>}
 */
export function createShortcutFunctions(getWorkspace, dispatch) {
  return {
    /**
     * Save the currently-active file.
     * Mirrors the Save button in Header.jsx.
     */
    saveFile() {
      const ws = getWorkspace();
      const activeFile = getActiveFile(ws);
      if (!activeFile) return;
      dispatch({ type: ACTIONS.SAVE_FILE, fileId: activeFile.id });
    },

    /**
     * Run the currently-active file.
     * Mirrors the Run button in Header.jsx.
     */
    runFile() {
      const ws = getWorkspace();
      const activeFileId = getActiveFileId(ws);
      if (!activeFileId) return;
      dispatch({ type: ACTIONS.RUN_ACTIVE_FILE, fileId: activeFileId });
    },

    /**
     * Run tests for the currently-active file.
     * Mirrors the "Run Tests" button in TestCasePanel.jsx.
     */
    runTests() {
      const ws = getWorkspace();
      const activeFileId = getActiveFileId(ws);
      if (!activeFileId) return;
      dispatch({ type: ACTIONS.RUN_TESTS, fileId: activeFileId });
    },

    /**
     * Trigger rename for the active file.
     * Routes through REQUEST_RENAME_NODE so App.jsx shows the prompt.
     */
    renameNode() {
      const ws = getWorkspace();
      const activeFile = getActiveFile(ws);
      if (!activeFile) return;
      dispatch({
        type: REQUEST_ACTIONS.RENAME_NODE,
        nodeId: activeFile.id,
        currentName: activeFile.name,
      });
    },

    /**
     * Trigger delete for the active file.
     * Routes through REQUEST_DELETE_NODE so App.jsx shows the confirm dialog.
     */
    deleteNode() {
      const ws = getWorkspace();
      const activeFile = getActiveFile(ws);
      if (!activeFile) return;
      dispatch({
        type: REQUEST_ACTIONS.DELETE_NODE,
        nodeId: activeFile.id,
      });
    },

    /**
     * Open Quick Open (file search, Ctrl+P).
     * Sets search mode to "file" and opens the search overlay.
     */
    quickOpen() {
      dispatch({ type: ACTIONS.OPEN_QUICK_OPEN });
    },

    /**
     * Open Content Search (Ctrl+Shift+F).
     * Sets search mode to "content" and opens the search overlay.
     */
    searchContent() {
      dispatch({ type: ACTIONS.OPEN_CONTENT_SEARCH });
    },

    /**
     * Command Palette placeholder (Ctrl+Shift+P).
     * Currently opens the content search as a fallback.
     * Replace this with a real command palette in the future.
     */
    commandPalette() {
      dispatch({ type: ACTIONS.OPEN_QUICK_OPEN });
    },

    /**
     * Undo the last action.
     */
    undo() {
      dispatch({ type: ACTIONS.UNDO });
    },

    /**
     * Redo the previously undone action.
     */
    redo() {
      dispatch({ type: ACTIONS.REDO });
    },
  };
}
