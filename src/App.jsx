import React, { useEffect, useState } from "react";
import { layout, treeData, GRID, componentConfig } from "./config";
import * as F from "./functions";

function Header({ title }) {
  return (
    <div className="flex items-center justify-between">
      <div className="text-lg font-bold text-gray-800">{title}</div>
    </div>
  );
}

function Placeholder({ type }) {
  return <div className="text-sm text-red-600">Unknown component: {type}</div>;
}

export default function App() {
  const STORAGE_KEY = "sdui.tree.v1";

  // Load tree from localStorage or from config treeData (JSON-only source)
  const [tree, setTree] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : F.clone(treeData);
  });

  const [selectedFileId, setSelectedFileId] = useState(null);
  const selectedFile = selectedFileId ? F.findNode(tree, selectedFileId) : null;

  // Editor content mirrors selected file.
  const [editorContent, setEditorContent] = useState("");
  useEffect(() => {
    if (!selectedFile || selectedFile.type !== "file") {
      setEditorContent("");
      return;
    }
    setEditorContent(selectedFile.content || "");
  }, [selectedFileId]);

  // Persist tree
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
  }, [tree]);


  const registry = {
    Header: Header,
    FileTree: FileTreeComponent,
    Editor: EditorComponent,
    Preview: PreviewComponent,
    InfoPanel: InfoPanelComponent,
    Placeholder: Placeholder,
  };

  function handleAddFolder(parentId) {
    const name = prompt("Enter Folder Name")?.trim();
    if (!name) return;
    setTree((prev) => F.addFolder(prev, parentId, name));
  }

  function handleAddFile(parentId) {
    const name = prompt("Enter File Name")?.trim();
    if (!name) return;
    setTree((prev) => F.addFile(prev, parentId, name));
  }

  function handleRename(nodeId) {
    if (nodeId === tree.id) return; // don't rename root
    const newName = prompt("Enter New Name")?.trim();
    if (!newName) return;
    setTree((prev) => F.renameNode(prev, nodeId, newName));
  }

  function handleDelete(nodeId) {
    if (nodeId === tree.id) return; // don't delete root
    if (!confirm("Delete this item?")) return;
    setTree((prev) => F.deleteNode(prev, nodeId));
    if (selectedFileId === nodeId) {
      setSelectedFileId(null);
      setEditorContent("");
    }
  }

  function handleToggleExpanded(nodeId) {
    setTree((prev) => F.toggleFolderExpanded(prev, nodeId));
  }

  function handleSelectFile(fileId) {
    const node = F.findNode(tree, fileId);
    if (!node || node.type !== "file") return;
    setSelectedFileId(fileId);
  }

  function handleUpdateEditorContent(next) {
    setEditorContent(next);
    if (!selectedFileId) return;
    setTree((prev) => F.updateFileContent(prev, selectedFileId, next));
  }

  const containerStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${GRID.cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${GRID.rows}, minmax(0, 1fr))`,
    gap: "8px",
    height: "80vh",
  };

  function FileTreeComponent(props) {
    return (
      <div className="w-full file-tree">
        <ul>
          <FileTreeNode node={tree} selectedFileId={selectedFileId} />
        </ul>
      </div>
    );
  }

  function FileTreeNode({ node, selectedFileId }) {
    const icon = node.type === "folder" ? (node.expanded ? "📂" : "📁") : "📄";
    const isSelected = node.type === "file" && node.id === selectedFileId;

    return (
      <li className="select-none">
        <div
          className={"file-node " + (isSelected ? "selected" : "")}
          onClick={() => {
            if (node.type === "folder") handleToggleExpanded(node.id);
            if (node.type === "file") handleSelectFile(node.id);
          }}
        >
          <span className="icon">{icon}</span>
          <span className="name">{node.name}</span>

          {node.type === "folder" && (
            <div className="ml-auto flex items-center gap-1">
              <button
                className="btn small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddFolder(node.id);
                }}
                type="button"
              >
                + Folder
              </button>
              <button
                className="btn small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddFile(node.id);
                }}
                type="button"
              >
                + File
              </button>
            </div>
          )}

          <div className="flex items-center gap-1 ml-2">
            <button
              className="btn small"
              onClick={(e) => {
                e.stopPropagation();
                handleRename(node.id);
              }}
              type="button"
            >
              Rename
            </button>
            <button
              className="btn small danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(node.id);
              }}
              type="button"
            >
              Delete
            </button>
          </div>
        </div>

        {node.type === "folder" && node.expanded && node.children && (
          <ul className="ml-4 border-l border-gray-100 pl-2">
            {node.children.map((child) => (
              <FileTreeNode key={child.id} node={child} selectedFileId={selectedFileId} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  function EditorComponent() {
    return (
      <div className="flex h-full w-full flex-col gap-3">
        <div className="rounded border bg-white p-3">
          <div className="text-sm text-gray-600">Selected</div>
          <div className="mt-1 font-semibold">{selectedFile ? selectedFile.name : "Select a file"}</div>
        </div>

        <textarea
          className="editor-textarea"
          rows={15}
          placeholder="File content will appear here"
          value={editorContent}
          onChange={(e) => handleUpdateEditorContent(e.target.value)}
        />
      </div>
    );
  }

  function PreviewComponent() {
    if (!selectedFile) return <div className="text-sm text-gray-500">No file selected</div>;
    return (
      <div className="preview">
        <div className="mb-2 text-xs text-gray-600">Preview</div>
        <pre className="whitespace-pre-wrap">{selectedFile.content}</pre>
      </div>
    );
  }

  function InfoPanelComponent() {
    return (
      <div className="info-panel">
        <div className="mb-2 font-semibold">Info</div>
        <div className="text-xs text-gray-500">This panel is driven by JSON metadata.</div>
        <pre className="mt-2">{JSON.stringify(componentConfig || {}, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">
        <div style={containerStyle} className="w-full sdui-grid">
          {Object.values(layout).map((section) => {
            if (!section.visible) return null;
            const Component = registry[section.type] || registry.Placeholder;
            const style = F.sectionStyle(section);

            // Merge JSON props (serializable) — runtime actions live in App.jsx closures.
            const props = { ...section.props };

            return (
              <div key={section.id} style={style} className="p-0">
                <div className="sdui-section" role="region" aria-label={section.title}>
                  <div className="sdui-section-header">{section.title}</div>
                  <div className="sdui-section-body">
                    <Component {...props} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
 


