// ─────────────────────────────────────────────────────────────────────────────
//  DEPENDENCY GRAPH
//  Responsible for: finding the entry point, parsing imports, resolving paths,
//  and building a topological dependency graph via DFS.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Searches the workspace fileTree for a file named "index.js".
 * Returns the file node if found, or null.
 *
 * @param {object} workspace - The workspace state object.
 * @returns {object|null} The file node for index.js, or null.
 */
export function findEntryFile(workspace) {
  const fileTree = workspace?.fileTree || {};
  for (const node of Object.values(fileTree)) {
    if (node && node.type === "file" && node.name === "index.js") {
      return node;
    }
  }
  return null;
}

/**
 * Extracts all relative import paths from a block of source code.
 *
 * Only handles static ES module import syntax:
 *   import { x } from "./file.js"
 *   import x from "./file.js"
 *   import "./file.js"
 *
 * Returns an array of unique relative path strings (those starting with ".").
 *
 * @param {string} code - Source code to scan.
 * @returns {string[]} Array of unique relative import paths.
 */
export function detectImports(code) {
  const paths = [];
  // Matches all static ES import forms that reference a relative path:
  //   import "./x.js"                   (side-effect)
  //   import x from "./x.js"            (default)
  //   import { a, b } from "./x.js"     (named)
  //   import * as ns from "./x.js"      (namespace)
  //   import x, { a } from "./x.js"     (mixed)
  //
  // Strategy: match `import` then skip everything up to the final `from`
  // before a quote, OR match a bare `import "./path"` with no `from`.
  // Two alternations keep it simple and avoid cross-line backtracking issues.
  const re = /^[ \t]*import\s+(?:[^"'\n]*?\bfrom\s+)?["'](\.{1,2}\/[^"'\n]+)["']/gm;
  let match;
  while ((match = re.exec(code)) !== null) {
    const p = match[1];
    if (!paths.includes(p)) paths.push(p);
  }
  return paths;
}

/**
 * Given the current file's absolute path (e.g. "/src/index.js") and a
 * relative import path (e.g. "./utils/math.js" or "../helper.js"), resolves
 * the absolute workspace path and returns the matching file node.
 *
 * This uses proper segment-by-segment resolution — the same algorithm used
 * by Node.js, Vite, Webpack, and Rollup — so that:
 *   /src/index.js + ./utils/math.js  => /src/utils/math.js
 *   /src/a/b.js   + ../c.js          => /src/c.js
 *
 * @param {object} workspace     - The workspace state object.
 * @param {string} currentFilePath - Absolute path of the file doing the import.
 * @param {string} relativePath  - The import specifier (must start with ".").
 * @returns {object|null} The resolved file node, or null if not found.
 */
export function resolveImportPath(workspace, currentFilePath, relativePath) {
  // Extract the directory of the current file.
  // e.g. "/src/components/math.js" -> "/src/components"
  // e.g. "/index.js"              -> ""
  const lastSlashIndex = currentFilePath.lastIndexOf("/");
  const currentDir = lastSlashIndex >= 0 ? currentFilePath.substring(0, lastSlashIndex) : "";

  // Concatenate and split into segments for resolution.
  const combined = currentDir + "/" + relativePath;
  const segments = combined.split("/");

  const resolved = [];
  for (const seg of segments) {
    if (!seg || seg === ".") continue;
    if (seg === "..") {
      if (resolved.length > 0) resolved.pop();
      continue;
    }
    resolved.push(seg);
  }

  const absolutePath = "/" + resolved.join("/");

  // Look up the node by its absolute path in the file tree.
  const fileTree = workspace?.fileTree || {};
  for (const node of Object.values(fileTree)) {
    if (node && node.type === "file" && node.path === absolutePath) {
      return node;
    }
  }
  return null;
}

/**
 * Builds a dependency graph by DFS starting from the entry file node.
 * Detects circular imports and missing files.
 *
 * The returned `order` array is in topological order (dependencies before
 * the files that import them), which is the correct concatenation order
 * for the bundler.
 *
 * Example:
 *   index.js imports math.js, math.js imports helper.js
 *   order => ["/helper.js", "/math.js", "/index.js"]
 *   graph => { "index.js": ["math.js"], "math.js": ["helper.js"], "helper.js": [] }
 *
 * @param {object} workspace       - The workspace state object.
 * @param {object} entryFileNode   - The file node to start traversal from.
 * @returns {{ graph: object, order: string[], errors: object[] }}
 */
export function buildDependencyGraph(workspace, entryFileNode) {
  const graph = {};        // filename => [dependency filenames]
  const order = [];        // topological order of file paths
  const errors = [];
  const visited = new Set();   // fully processed paths
  const inStack = new Set();   // paths currently in the DFS call stack

  function getContent(node) {
    return workspace?.fileContents?.[node.contentId]?.content || "";
  }

  function dfs(node) {
    // Circular import: this node is already being processed up the call stack.
    if (inStack.has(node.path)) {
      errors.push({ type: "CIRCULAR", from: node.path, path: node.path });
      return;
    }
    // Already fully processed — skip.
    if (visited.has(node.path)) return;

    inStack.add(node.path);

    const code = getContent(node);
    const importPaths = detectImports(code);
    const depNames = [];

    for (const relPath of importPaths) {
      const depNode = resolveImportPath(workspace, node.path, relPath);
      if (!depNode) {
        errors.push({ type: "MISSING", from: node.path, path: relPath });
        continue;
      }
      depNames.push(depNode.name);
      dfs(depNode);
    }

    graph[node.name] = depNames;
    inStack.delete(node.path);
    visited.add(node.path);

    // Push AFTER all dependencies — this gives topological (dependency-first) order.
    if (!order.includes(node.path)) order.push(node.path);
  }

  dfs(entryFileNode);
  return { graph, order, errors };
}
