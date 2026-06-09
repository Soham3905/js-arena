export const GRID = { cols: 144, rows: 100 };

export const layout = {
  header: {
    id: "header",
    type: "Header",
    visible: true,
    title: "Header",
    colStart: 1,
    colEnd: 145,
    rowStart: 1,
    rowEnd: 8,
    props: {},
    permissions: { editable: false },
    metadata: {},
  },

  tree: {
    id: "tree",
    type: "FileTree",
    visible: true,
    title: "Explorer",
    colStart: 1,
    colEnd: 36,
    rowStart: 8,
    rowEnd: 100,
    props: { allowRename: true, allowDelete: true, allowAddFolder: true, allowAddFile: true },
    permissions: { editable: true },
    metadata: {},
  },

  editor: {
    id: "editor",
    type: "Editor",
    visible: true,
    title: "Editor",
    colStart: 36,
    colEnd: 106,
    rowStart: 8,
    rowEnd: 100,
    props: { readonly: false },
    permissions: { editable: true },
    metadata: {},
  },

  preview: {
    id: "preview",
    type: "Preview",
    visible: true,
    title: "Preview",
    colStart: 106,
    colEnd: 145,
    rowStart: 8,
    rowEnd: 60,
    props: {},
    permissions: { editable: false },
    metadata: {},
  },

  infoPanel: {
    id: "infoPanel",
    type: "InfoPanel",
    visible: true,
    title: "Info",
    colStart: 106,
    colEnd: 145,
    rowStart: 60,
    rowEnd: 100,
    props: {},
    permissions: { editable: false },
    metadata: {},
  },
};

export const treeData = {
  id: 1,
  name: "Workspace",
  type: "folder",
  expanded: true,
  children: [
    {
      id: 2,
      name: "Frontend",
      type: "folder",
      expanded: true,
      children: [
        {
          id: 3,
          name: "src",
          type: "folder",
          expanded: true,
          children: [
            { id: 4, name: "App.jsx", type: "file", content: "export default function App() {}" },
            { id: 5, name: "main.jsx", type: "file", content: "import React from 'react'" },
            { id: 6, name: "FileTree.jsx", type: "file", content: "function FileTree(){}" },
          ],
        },
        {
          id: 7,
          name: "public",
          type: "folder",
          expanded: false,
          children: [{ id: 8, name: "logo.png", type: "file", content: "Image Placeholder" }],
        },
      ],
    },
    {
      id: 9,
      name: "Backend",
      type: "folder",
      expanded: false,
      children: [
        { id: 10, name: "server.js", type: "file", content: "const express = require('express')" },
        { id: 11, name: "routes.js", type: "file", content: "export default routes" },
      ],
    },
    { id: 12, name: "README.md", type: "file", content: "Project Documentation" },
    { id: 13, name: "package.json", type: "file", content: '{"name":"sdui-project"}' },
  ],
};

export const componentConfig = {
  Header: { description: "Top header bar" },
  FileTree: { description: "Explorer tree" },
  Editor: { description: "Text editor" },
  Preview: { description: "File preview" },
  InfoPanel: { description: "Small metadata/help panel" },
};

export default { GRID, layout, treeData, componentConfig };
