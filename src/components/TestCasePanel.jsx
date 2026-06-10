import React from "react";
import {
  ACTIONS,
  canExecuteNode,
  getActiveFile,
  getCurrentTestCases,
  getLatestTestRun,
} from "../functions";

export default function TestCasePanel({ workspace, dispatch }) {
  const activeFile = getActiveFile(workspace);
  const running = workspace.runtime?.running ?? false;

  // Issue #6: Show a cleaner empty state when no file is selected
  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="text-center text-gray-400 text-sm">
          <div className="text-2xl mb-2">📂</div>
          <div>Select a file to view test cases</div>
        </div>
      </div>
    );
  }

  const testCases = getCurrentTestCases(workspace, activeFile.id);
  const latestRun = getLatestTestRun(workspace);
  // Issue #5: Use Boolean() for safety
  const canRunTests = Boolean(activeFile) && canExecuteNode(workspace, activeFile.id);

  return (
    <div className="flex h-full flex-col gap-3 p-2 bg-gray-50 overflow-auto">
      <div className="rounded border bg-white p-3 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold uppercase tracking-wide text-gray-600">Test Cases</div>
          <div className="flex gap-2">
            <button
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs font-medium rounded border border-gray-300 transition-colors"
              onClick={() => {
                dispatch({ type: ACTIONS.ADD_TEST_CASE, fileId: activeFile.id });
              }}
            >
              + Add Case
            </button>
            {/* Issue #11: Show running state on button */}
            <button
              className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                canRunTests && !running
                  ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-700 shadow-sm"
                  : "bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed"
              }`}
              onClick={() => {
                if (canRunTests && !running) {
                  dispatch({ type: ACTIONS.RUN_TESTS, fileId: activeFile.id });
                }
              }}
              disabled={!canRunTests || running}
            >
              {running ? "Running..." : "Run Tests"}
            </button>
          </div>
        </div>

        {(!testCases || testCases.length === 0) ? (
          <div className="text-sm text-gray-500 p-4 text-center border border-dashed rounded bg-gray-50">
            No test cases found. Click "+ Add Case" to create one.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {testCases.map((tc, index) => (
              <div key={tc.id} className="border rounded p-3 bg-gray-50/50 hover:bg-white transition-colors relative group">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-xs font-bold text-gray-700 bg-gray-200 px-2 py-1 rounded">Case {index + 1}</div>
                    {/* Issue #7: Hidden badge */}
                    {tc.hidden && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-1.5 py-0.5 rounded">Hidden</span>
                    )}
                  </div>
                  <button
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    onClick={() => dispatch({ type: ACTIONS.DELETE_TEST_CASE, testCaseId: tc.id, fileId: activeFile.id })}
                    title="Delete Test Case"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Input</label>
                    <textarea
                      className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-mono"
                      rows={2}
                      value={typeof tc.input === "string" ? tc.input : JSON.stringify(tc.input)}
                      onChange={(e) => {
                        dispatch({
                          type: ACTIONS.UPDATE_TEST_CASE,
                          testCaseId: tc.id,
                          fileId: activeFile.id,
                          updates: {
                            input: (() => {
                              try {
                                return JSON.parse(e.target.value);
                              } catch {
                                return e.target.value;
                              }
                            })()
                          }
                        });
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Expected Output</label>
                    <textarea
                      className="w-full text-sm border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow font-mono"
                      rows={1}
                      value={typeof tc.expected === "string" ? tc.expected : JSON.stringify(tc.expected)}
                      onChange={(e) => {
                        dispatch({
                          type: ACTIONS.UPDATE_TEST_CASE,
                          testCaseId: tc.id,
                          fileId: activeFile.id,
                          updates: {
                            expected: (() => {
                              try {
                                return JSON.parse(e.target.value);
                              } catch {
                                return e.target.value;
                              }
                            })()
                          }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issue #8: Only show results for the current active file */}
      {latestRun && latestRun.fileId === activeFile.id && (
        <div className={`rounded border p-4 shadow-sm ${latestRun.status === 'Passed' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-black/10">
            <div className="flex items-center gap-2">
              <span className={`text-lg ${latestRun.status === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
                {latestRun.status === 'Passed' ? '✓' : '✕'}
              </span>
              <span className={`font-bold ${latestRun.status === 'Passed' ? 'text-green-800' : 'text-red-800'}`}>
                {latestRun.status}
              </span>
            </div>
            <span className="text-sm font-medium bg-white/60 px-2 py-1 rounded">
              {latestRun.passed} / {latestRun.total} passed{" "}
              <span className="text-gray-500 font-normal">({latestRun.duration})</span>
            </span>
          </div>

          {latestRun.error && (
            <div className="text-sm text-red-700 mt-2 font-mono whitespace-pre-wrap bg-red-100/50 p-2 rounded border border-red-200">{latestRun.error}</div>
          )}

          {/* Issue #9: Scroll container for large result sets */}
          <div className="max-h-80 overflow-auto flex flex-col gap-2 mt-2">
            {latestRun.results && latestRun.results.map((res, i) => (
              !res.passed && (
                <div key={i} className="text-sm bg-white p-3 border border-red-200 rounded shadow-sm">
                  <div className="font-semibold text-red-700 mb-2 border-b border-red-100 pb-1">Case {i + 1} Failed</div>
                  <div className="grid grid-cols-[80px_1fr] gap-1 mb-1">
                    <span className="text-gray-500 font-medium">Input:</span>
                    <span className="font-mono bg-gray-50 px-1 rounded border border-gray-100">{JSON.stringify(res.testCase.input)}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1 mb-1">
                    <span className="text-gray-500 font-medium">Expected:</span>
                    <span className="font-mono bg-green-50 text-green-700 px-1 rounded border border-green-100">{JSON.stringify(res.expected)}</span>
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-1">
                    <span className="text-gray-500 font-medium">Actual:</span>
                    <span className="font-mono bg-red-50 text-red-700 px-1 rounded border border-red-100">{JSON.stringify(res.actual)}</span>
                  </div>
                  {res.error && <div className="text-red-600 mt-2 pt-2 border-t border-red-100 italic">{res.error}</div>}
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
