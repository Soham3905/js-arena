import React, { useState } from "react";
import { FaFolder, FaFolderOpen, FaFileAlt, FaFileCode, FaFileImage, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import ContextMenu from "./ContextMenu";
import {
  ACTIONS,
  createTree,
  getRootNodeId,
} from "../functions";

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
};

function getFileIcon(extension) {
  switch (extension) {
    case "js":
    case "jsx":
      return <FaFileCode className="text-yellow-400" size={13} />;
    case "ts":
    case "tsx":
      return <FaFileCode className="text-blue-400" size={13} />;
    case "json":
      return <FaFileCode className="text-orange-400" size={13} />;
    case "md":
      return <FaFileAlt className="text-gray-400" size={13} />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return <FaFileImage className="text-purple-400" size={13} />;
    default:
      return <FaFileAlt className="text-gray-400" size={13} />;
  }
}

function FileTreeNode({
  node,
  depth,
  activeFileId,
  allowAddFile,
  allowAddFolder,
  allowDelete,
  allowRename,
  clipboard,
  dispatch,
  rootNodeId,
  workspace,
  onContextMenu,
}) {
  const isFolder = node.type === "folder";
  const isSelected = activeFileId === node.id;
  const isRoot = node.id === rootNodeId;
  const indentPx = depth * 12;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isFolder) {
      dispatch({ type: ACTIONS.TOGGLE_FOLDER, nodeId: node.id });
    } else {
      dispatch({ type: ACTIONS.OPEN_FILE, fileId: node.id });
    }
  };

  const menuItems = [];

  if (isFolder) {
    if (allowAddFile) menuItems.push({ label: "New File", action: () => dispatch({ type: REQUEST_ACTIONS.ADD_FILE, parentId: node.id }) });
    if (allowAddFolder) menuItems.push({ label: "New Folder", action: () => dispatch({ type: REQUEST_ACTIONS.ADD_FOLDER, parentId: node.id }) });
  }

  if (!isRoot) {
    if (menuItems.length > 0) menuItems.push({ type: "separator" });
    if (allowRename) menuItems.push({ label: "Rename", action: () => dispatch({ type: REQUEST_ACTIONS.RENAME_NODE, nodeId: node.id, currentName: node.name }) });
    if (allowDelete) menuItems.push({ label: "Delete", action: () => dispatch({ type: REQUEST_ACTIONS.DELETE_NODE, nodeId: node.id }) });
    menuItems.push({ type: "separator" });
    menuItems.push({ label: "Cut", action: () => dispatch({ type: REQUEST_ACTIONS.CUT_NODE, nodeId: node.id }) });
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
          isSelected
            ? "bg-[#094771] text-white"
            : "text-[#cccccc] hover:bg-[#2a2d2e]"
        }`}
        style={{ paddingLeft: `${indentPx + 8}px`, paddingRight: "4px" }}
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, node, menuItems);
        }}
      >
        {/* Chevron for folders */}
        <span className="w-4 flex-none flex items-center justify-center mr-0.5">
          {isFolder ? (
            node.expanded ? (
              <FaChevronDown size={9} className="opacity-70" />
            ) : (
              <FaChevronRight size={9} className="opacity-70" />
            )
          ) : null}
        </span>

        {/* Icon */}
        <span className="mr-1.5 flex-none flex items-center">
          {isFolder ? (
            node.expanded ? (
              <FaFolderOpen className="text-[#e8c27a]" size={13} />
            ) : (
              <FaFolder className="text-[#e8c27a]" size={13} />
            )
          ) : (
            getFileIcon(node.extension)
          )}
        </span>

        {/* Name */}
        <span className={`truncate flex-1 ${isRoot ? "font-semibold text-[#bbbbbb] uppercase text-[11px] tracking-wider" : ""}`}>
          {node.name}
        </span>

        {/* More menu button */}
        {!isRoot && menuItems.length > 0 && (
          <div
            className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 ml-1 flex-none"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, node, menuItems);
            }}
          >
            <MdMoreVert size={14} className="opacity-70" />
          </div>
        )}
      </div>

      {isFolder && node.expanded && node.children?.length ? (
        <ul>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
              depth={depth + 1}
              activeFileId={activeFileId}
              allowAddFile={allowAddFile}
              allowAddFolder={allowAddFolder}
              allowDelete={allowDelete}
              allowRename={allowRename}
              clipboard={clipboard}
              dispatch={dispatch}
              node={child}
              rootNodeId={rootNodeId}
              workspace={workspace}
              onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function FileTree({
  workspace,
  dispatch,
  allowAddFile,
  allowAddFolder,
  allowDelete,
  allowRename,
  clipboard,
}) {
  const [contextMenu, setContextMenu] = useState(null);

  const tree = createTree(workspace);
  const activeFileId = workspace.tabs?.activeTabId || null;
  const rootNodeId = getRootNodeId(workspace);

  const handleContextMenu = (e, node, items) => {
    e.preventDefault();
    e.stopPropagation();
    if (items.length === 0) return;
    setContextMenu({ x: e.clientX, y: e.clientY, node, items });
  };

  const closeContextMenu = () => setContextMenu(null);

  return (
    <div className="flex h-full flex-col bg-[#252526] overflow-hidden select-none" onClick={closeContextMenu}>
      {/* EXPLORER header — VS Code style */}
      <div className="flex-none flex items-center justify-between px-4 py-2 border-b border-[#3c3c3c]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#bbbbbb]">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          {allowAddFile && (
            <button
              title="New File"
              className="p-1 rounded text-[#bbbbbb] hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => {
                const rootId = rootNodeId;
                dispatch({ type: REQUEST_ACTIONS.ADD_FILE, parentId: rootId });
              }}
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
              onClick={() => {
                dispatch({ type: REQUEST_ACTIONS.ADD_FOLDER, parentId: rootNodeId });
              }}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M14 4H8L6 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1zm-4 5H8v2H7V9H5V8h2V6h1v2h2v1z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-auto py-1">
        {tree ? (
          <ul className="list-none m-0 p-0">
            <FileTreeNode
              depth={0}
              activeFileId={activeFileId}
              allowAddFile={allowAddFile}
              allowAddFolder={allowAddFolder}
              allowDelete={allowDelete}
              allowRename={allowRename}
              clipboard={clipboard}
              dispatch={dispatch}
              node={tree}
              rootNodeId={rootNodeId}
              workspace={workspace}
              onContextMenu={handleContextMenu}
            />
          </ul>
        ) : (
          <div className="p-4 text-sm text-[#888] italic text-center">Empty Workspace</div>
        )}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
