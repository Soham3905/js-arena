export function clone(obj) {
  if (typeof structuredClone === "function") return structuredClone(obj);
  return JSON.parse(JSON.stringify(obj));
}

export function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function findNode(root, id) {
  if (!root) return null;
  if (root.id === id) return root;
  if (!root.children) return null;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

// Remove a node by id. Returns a new cloned tree (does not mutate input)
export function deleteNode(tree, id) {
  const copy = clone(tree);

  // Prevent deleting root
  if (copy.id === id) return copy;

  function removeRecursive(node, idToRemove) {
    if (!node.children) return false;
    const idx = node.children.findIndex((c) => c.id === idToRemove);
    if (idx !== -1) {
      node.children.splice(idx, 1);
      return true;
    }
    for (const child of node.children) {
      if (removeRecursive(child, idToRemove)) return true;
    }
    return false;
  }

  removeRecursive(copy, id);
  return copy;
}

export function addFolder(tree, parentId, name) {
  const copy = clone(tree);
  const parent = findNode(copy, parentId);
  if (!parent || parent.type !== "folder") return copy;
  if (!parent.children) parent.children = [];
  parent.children.push({ id: generateId(), name, type: "folder", expanded: true, children: [] });
  return copy;
}

export function addFile(tree, parentId, name) {
  const copy = clone(tree);
  const parent = findNode(copy, parentId);
  if (!parent || parent.type !== "folder") return copy;
  if (!parent.children) parent.children = [];
  parent.children.push({ id: generateId(), name, type: "file", content: "" });
  return copy;
}

export function renameNode(tree, nodeId, newName) {
  const copy = clone(tree);
  const node = findNode(copy, nodeId);
  if (!node) return copy;
  node.name = newName;
  return copy;
}

export function toggleFolderExpanded(tree, nodeId) {
  const copy = clone(tree);
  const node = findNode(copy, nodeId);
  if (!node || node.type !== "folder") return copy;
  node.expanded = !node.expanded;
  return copy;
}

export function updateFileContent(tree, fileId, nextContent) {
  const copy = clone(tree);
  const node = findNode(copy, fileId);
  if (!node || node.type !== "file") return copy;
  node.content = nextContent;
  return copy;
}

// Layout helper: convert section JSON to CSS grid styles
export function sectionStyle(section) {
  return {
    gridColumn: `${section.colStart} / ${section.colEnd}`,
    gridRow: `${section.rowStart} / ${section.rowEnd}`,
    minHeight: 0,
  };
}

export default {
  clone,
  generateId,
  findNode,
  deleteNode,
  addFolder,
  addFile,
  renameNode,
  toggleFolderExpanded,
  updateFileContent,
  sectionStyle,
};
