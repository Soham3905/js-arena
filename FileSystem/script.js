let tree = {
  id: 1,
  name: "Root",
  type: "folder",
  expanded: true,
  children: [
    {
      id: 2,
      name: "Documents",
      type: "folder",
      expanded: true,
      children: [
        {
          id: 3,
          name: "Resume.pdf",
          type: "file",
          content: "",
        },
      ],
    },
  ],
};

const saved = localStorage.getItem("tree");
if (saved) {
  tree = JSON.parse(saved);
}

function findNode(node, id) {
  if (node.id === id) return node;
  if (node.children) {
    for (let child of node.children) {
      const result = findNode(child, id);
      if (result) return result;
    }
  }
  return null;
}

function addFolder(parentId) {
  const name = prompt("Enter Folder Name")?.trim();
  if (!name) return;
  const folder = findNode(tree, parentId);
  if (!folder) return;
  if (folder.type !== "folder") return;
  folder.children.push({
    id: Date.now() + Math.random(),
    name: name,
    type: "folder",
    expanded: true,
    children: [],
  });
  refresh();
}

function addFile(parentId) {
  const name = prompt("Enter File Name")?.trim();
  if (!name) return;
  const folder = findNode(tree, parentId);
  if (!folder) return;
  if (folder.type !== "folder") return;
  folder.children.push({
    id: Date.now() + Math.random(),
    name: name,
    type: "file",
    content: "",
  });
  refresh();
}

function renameNode(parentId) {
  if (parentId === tree.id) return;
  const node = findNode(tree, parentId);
  const newName = prompt("Enter New Name")?.trim();
  if (!newName) return;
  node.name = newName;
  refresh();
}

function removeNode(node, id) {
  if (!node.children) return false;
  const index = node.children.findIndex((child) => child.id === id);
  if (index !== -1) {
    node.children.splice(index, 1);
    return true;
  }
  for (let child of node.children) {
    if (removeNode(child, id)) return true;
  }
  return false;
}

function deleteNode(id) {
  if (id === tree.id) return;
  removeNode(tree, id);
  refresh();
}

function renderNode(node) {
  const li = document.createElement("li");
  const icon = node.type === "folder" ? (node.expanded ? "📂" : "📁") : "📄";
  const span = document.createElement("span");
  const addFolderBtn = document.createElement("button");
  const addFileBtn = document.createElement("button");
  const addRenameBtn = document.createElement("button");
  const deleteBtn = document.createElement("button");
  addRenameBtn.textContent = "Rename";
  deleteBtn.textContent = "Delete";
  addFileBtn.textContent = "+ File";
  addFolderBtn.textContent = "+ Folder";

  addFolderBtn.onclick = (e) => {
    e.stopPropagation();
    addFolder(node.id);
  };

  addFileBtn.onclick = (e) => {
    e.stopPropagation();
    addFile(node.id);
  };

  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    if (confirm("Delete this item?")) {
      deleteNode(node.id);
    }
  };

  addRenameBtn.onclick = (e) => {
    e.stopPropagation();
    renameNode(node.id);
  };

  span.addEventListener("click", () => {
    if (node.type === "folder") {
      node.expanded = !node.expanded;
      refresh();
    }
  });

  span.innerHTML = `${icon} ${node.name}`;
  li.appendChild(span);
  if (node.type === "folder") {
    li.appendChild(addFolderBtn);
    li.appendChild(addFileBtn);
  }
  li.appendChild(deleteBtn);
  li.appendChild(addRenameBtn);

  if (node.children && node.expanded) {
    const ul = document.createElement("ul");
    node.children.forEach((element) => {
      ul.appendChild(renderNode(element));
    });
    li.appendChild(ul);
  }
  return li;
}

function refresh() {
  const treeDiv = document.getElementById("tree");
  treeDiv.innerHTML = "";
  const ul = document.createElement("ul");
  ul.appendChild(renderNode(tree));
  treeDiv.appendChild(ul);
  localStorage.setItem("tree", JSON.stringify(tree));
}

refresh();
