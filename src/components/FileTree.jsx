import React, { useState } from "react";
import { FaFolder, FaFolderOpen, FaFileAlt, FaFileCode, FaFileImage, FaChevronRight, FaChevronDown } from "react-icons/fa";
import { MdMoreVert } from "react-icons/md";
import ContextMenu from "./ContextMenu";
import {
  ACTIONS,
  canDeleteNode,
  canMoveNode,
  canRenameNode,
  canWriteNode,
  createTree,
  getNodePermissions,
  getRootNodeId,
  searchWorkspace,
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
    case "ts":
    case "tsx":
    case "json":
      return <FaFileCode className="text-yellow-500" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return <FaFileImage className="text-purple-500" />;
    default:
      return <FaFileAlt className="text-gray-400" />;
  }
}

function FileTreeNode({
  node,
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
  
  if (node.id !== rootNodeId) {
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
        className={`group flex items-center py-1 px-2 cursor-pointer select-none text-gray-700 hover:bg-gray-200 ${isSelected ? "bg-blue-100 text-blue-900 font-medium" : ""}`}
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, node, menuItems);
        }}
      >
        <span className="w-4 flex justify-center text-gray-400 mr-1 flex-none">
          {isFolder ? (node.expanded ? <FaChevronDown size={10} /> : <FaChevronRight size={10} />) : null}
        </span>
        
        <span className="mr-2 flex-none">
          {isFolder ? (
            node.expanded ? <FaFolderOpen className="text-blue-400" /> : <FaFolder className="text-blue-400" />
          ) : (
            getFileIcon(node.extension)
          )}
        </span>
        
        <span className="truncate flex-1 text-sm">{node.name}</span>
        
        {menuItems.length > 0 && (
          <div 
            className="hidden group-hover:flex items-center justify-center w-6 h-6 rounded hover:bg-gray-300 ml-1 flex-none"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, node, menuItems);
            }}
          >
            <MdMoreVert size={16} />
          </div>
        )}
      </div>

      {isFolder && node.expanded && node.children?.length ? (
        <ul className="pl-4">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.id}
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
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      node,
      items
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return (
    <div className="flex h-full flex-col bg-[#f8f9fa] overflow-auto select-none" onClick={closeContextMenu}>
      {tree ? (
        <ul className="py-2 pr-2">
          <FileTreeNode
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
        <div className="p-4 text-sm text-gray-500 italic text-center">Empty Workspace</div>
      )}
      
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
