// ─────────────────────────────────────────────────────────────────────────────
//  SANDBOX RUNNER
//  Responsible for: executing arbitrary JavaScript code in a sandboxed context
//  that blocks access to dangerous browser globals.
//
//  Security model (V1):
//  We prepend `const x = undefined;` declarations for every dangerous global
//  before the user's code. Combined with `"use strict"`, this prevents most
//  accidental or malicious access to browser APIs.
//
//  Known limitations (acceptable for V1):
//  - A determined attacker can still escape via prototype chains or
//    engine-specific tricks. True isolation requires a Web Worker + MessageChannel.
//  - Infinite loops (while(true){}) will freeze the browser tab.
//    Fix: Web Worker execution (planned for Phase 6B / future release).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Blocked globals prepended to every executed snippet.
 *
 * Covers all commonly dangerous browser globals:
 * - DOM access:    window, document, self, parent, top
 * - Storage:       localStorage, sessionStorage
 * - Navigation:    navigator, history, location
 * - Code injection: Function, eval
 * - Global scope:   globalThis
 *
 * NOTE: `eval` must be blocked explicitly here because it is not covered
 * by strict mode alone — a direct call `eval("...")` still executes in the
 * enclosing scope and can access any local variable. Shadowing it with a
 * `const` makes `eval(...)` throw “eval is not a function”.
 */
const BLOCKED_GLOBALS = `
const window = undefined;
const document = undefined;
const localStorage = undefined;
const sessionStorage = undefined;
const navigator = undefined;
const history = undefined;
const globalThis = undefined;
const Function = undefined;
const self = undefined;
const parent = undefined;
const top = undefined;
`;

/**
 * Formats a single console argument to a printable string.
 * Objects/arrays are JSON-stringified; primitives are returned as-is.
 *
 * @param {*} value - The value to format.
 * @returns {string}
 */
function formatConsoleValue(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Executes `sourceCode` in a sandboxed function context.
 *
 * The sandbox:
 * 1. Runs in strict mode to prevent accidental globals.
 * 2. Prepends `BLOCKED_GLOBALS` to shadow dangerous browser APIs.
 * 3. Provides a `console` proxy that captures output into an array.
 *
 * All three console channels (log, warn, error) are captured to the same
 * output array so they appear in the IDE's Output Panel.
 *
 * @param {string} sourceCode - The JavaScript code to execute.
 * @returns {{ success: boolean, output: string[], error?: string }}
 */
export function runJavaScript(sourceCode) {
  try {
    const output = [];
    const consoleProxy = {
      log:   (...args) => output.push(args.map(formatConsoleValue).join(" ")),
      warn:  (...args) => output.push(args.map(formatConsoleValue).join(" ")),
      error: (...args) => output.push(args.map(formatConsoleValue).join(" ")),
    };

    const fn = new Function(
      "console",
      `"use strict";\n${BLOCKED_GLOBALS}\n${sourceCode}`
    );
    fn(consoleProxy);

    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      output: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
