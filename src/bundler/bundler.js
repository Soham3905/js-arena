// ─────────────────────────────────────────────────────────────────────────────
//  BUNDLER
//  Responsible for: stripping import/export syntax and concatenating files in
//  topological dependency order to produce a single executable bundle.
// ─────────────────────────────────────────────────────────────────────────────

import { buildDependencyGraph } from "./dependencyGraph.js";

// ─────────────────────────────────────────────────────────────────────────────
//  SUPPORTED EXPORT TRANSFORMATIONS
//
//  ✅ export function foo() {}         -> function foo() {}
//  ✅ export const x = ...             -> const x = ...
//  ✅ export let x = ...               -> let x = ...
//  ✅ export var x = ...               -> var x = ...
//  ✅ export class Foo {}              -> class Foo {}
//  ✅ export async function foo() {}   -> async function foo() {}
//  ✅ export default function App() {} -> function App() {}
//  ✅ export default class App {}      -> class App {}
//
//  ❌ NOT SUPPORTED (removed silently, no crash):
//     export default someVariable;
//     export { a, b };
//     export * from "./other.js";
//
//  These unsupported forms are stripped to prevent syntax errors in the
//  bundled output. Users should use named exports instead.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Removes all static import statements from a block of source code.
 * Only removes single-line static imports (not dynamic import()).
 *
 * @param {string} code - Source code to process.
 * @returns {string} Code with all import lines removed.
 */
export function stripImports(code) {
  return code.replace(/^\s*import\s[^\n]*/gm, "");
}

/**
 * Strips the `export` keyword from declarations so they become plain
 * function/const/let/var/class declarations accessible to the whole bundle.
 *
 * See the supported/unsupported table above for details.
 *
 * @param {string} code - Source code to process.
 * @returns {{ code: string, hasDefaultExport: boolean }}
 */
export function stripExports(code) {
  // Step 1: Strip `export default` from named function/class declarations.
  //   export default function App() {} -> function App() {}
  //   export default class App {}      -> class App {}
  let stripped = code.replace(
    /^(\s*)export\s+default\s+(function|class)(\s+)/gm,
    "$1$2$3"
  );

  // Step 2: Strip `export` keyword from other named declarations.
  //   export function foo()  -> function foo()
  //   export const x = ...   -> const x = ...
  stripped = stripped.replace(
    /^(\s*)export\s+((?:async\s+)?(?:function|class|const|let|var)\s)/gm,
    "$1$2"
  );

  // Step 3: Remove remaining `export default ...` statements (unsupported).
  //   e.g., `export default add;` — we can't easily inline a bare identifier
  //   into a flat bundle, so we remove it to prevent syntax errors.
  let hasDefaultExport = false;
  stripped = stripped.replace(/^\s*export\s+default\s+[^\n]*/gm, () => {
    hasDefaultExport = true;
    return "";
  });

  // Step 4: Detect and remove unsupported re-export / named-export forms.
  //   export { a, b };
  //   export { a } from "./x.js";
  //   export * from "./other.js";
  //
  // These cannot be inlined into a flat bundle — detect them so bundleProject
  // can emit a diagnostic, then strip them to prevent syntax errors.
  let unsupportedExports = false;
  stripped = stripped.replace(
    /^\s*export\s+\{[^}]*\}\s*(?:from\s+["'][^"']+["'])?\s*;?\s*$/gm,
    () => { unsupportedExports = true; return ""; }
  );
  stripped = stripped.replace(
    /^\s*export\s+\*\s+from\s+["'][^"']+["']\s*;?\s*$/gm,
    () => { unsupportedExports = true; return ""; }
  );

  return { code: stripped, hasDefaultExport, unsupportedExports };
}

/**
 * Bundles the project starting from the entry file node.
 *
 * The pipeline:
 *   1. Build a dependency graph via DFS from the entry file.
 *   2. Collect files in topological order (dependencies first).
 *   3. Strip imports and exports from each file.
 *   4. Concatenate into a single executable string.
 *
 * @param {object} workspace     - The workspace state object.
 * @param {object} entryFileNode - The entry file node (index.js).
 * @returns {{ code: string, graph: object, diagnostics: string[] }}
 */
export function bundleProject(workspace, entryFileNode) {
  const { graph, order, errors } = buildDependencyGraph(workspace, entryFileNode);
  const diagnostics = [];

  // Emit bundler diagnostics for graph errors.
  for (const err of errors) {
    if (err.type === "CIRCULAR") {
      diagnostics.push(`⚠ Circular import detected involving: ${err.path}`);
    } else if (err.type === "MISSING") {
      diagnostics.push(`⚠ Import not found: "${err.path}" (imported from ${err.from})`);
    }
  }

  // Build a filePath => fileNode lookup.
  const fileTree = workspace?.fileTree || {};
  const pathToNode = {};
  for (const node of Object.values(fileTree)) {
    if (node && node.type === "file") pathToNode[node.path] = node;
  }

  // Concatenate each file's transformed code in dependency-first order.
  const chunks = [];
  for (const filePath of order) {
    const node = pathToNode[filePath];
    if (!node) continue;

    const rawCode = workspace?.fileContents?.[node.contentId]?.content || "";
    const withoutImports = stripImports(rawCode);
    const { code: withoutExports, hasDefaultExport, unsupportedExports } = stripExports(withoutImports);

    if (hasDefaultExport) {
      diagnostics.push(
        `⚠ "${node.name}" uses "export default <identifier>" which is not supported ` +
        `by the bundler (V1). Use "export default function ..." or "export default class ..." instead.`
      );
    }

    if (unsupportedExports) {
      diagnostics.push(
        `⚠ Unsupported export syntax found in ${node.name}`
      );
    }

    // Section comments make error traces easier to read.
    chunks.push(`// ── ${node.name} ──`);
    chunks.push(withoutExports.trim());
    chunks.push(""); // blank line separator
  }

  return {
    code: chunks.join("\n"),
    graph,
    diagnostics,
  };
}
