import React, { useState } from "react";
import {
  ACTIONS,
  canExecuteNode,
  getActiveFile,
  getCurrentTestCases,
  getLatestTestRun,
} from "../functions";

function safeStringify(val) {
  if (val === undefined) return "undefined";
  if (val === null) return "null";
  try { return JSON.stringify(val); } catch { return String(val); }
}

function StatusBadge({ status }) {
  const passed = status === "Passed";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        passed ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"
      }`}
    >
      {passed ? "✓" : "✕"} {status}
    </span>
  );
}

export default function TestCasePanel({ workspace, dispatch }) {
  const [activeCase, setActiveCase] = useState(0);
  const activeFile = getActiveFile(workspace);
  const running = workspace.runtime?.running ?? false;

  if (!activeFile) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
        <div className="text-center text-[#555] text-sm">
          <div className="text-3xl mb-3">📂</div>
          <div>Select a file to view test cases</div>
        </div>
      </div>
    );
  }

  const testCases = getCurrentTestCases(workspace, activeFile.id);
  const latestRun = getLatestTestRun(workspace);
  const canRunTests = Boolean(activeFile) && canExecuteNode(workspace, activeFile.id);
  const runForCurrentFile = latestRun?.fileId === activeFile.id;

  // clamp activeCase index
  const safeCaseIdx = testCases.length > 0 ? Math.min(activeCase, testCases.length - 1) : 0;
  const currentCase = testCases[safeCaseIdx] || null;
  const currentResult = runForCurrentFile && latestRun?.results?.[safeCaseIdx];

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] overflow-hidden">
      {/* ── Panel header ── */}
      <div className="flex-none flex items-center justify-between px-4 py-2.5 bg-[#252526] border-b border-[#3c3c3c]">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#bbbbbb]">
          Test Cases
        </span>
        <div className="flex items-center gap-2">
          <button
            id="btn-add-test-case"
            className="flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium rounded bg-[#3c3c3c] text-[#cccccc] hover:bg-[#4a4a4a] border border-[#555] transition-colors"
            onClick={() => {
              dispatch({ type: ACTIONS.ADD_TEST_CASE, fileId: activeFile.id });
              setActiveCase(testCases.length); // jump to new case
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M4 0h2v4h4v2H6v4H4V6H0V4h4z"/>
            </svg>
            Add Case
          </button>
          <button
            id="btn-run-tests"
            className={`flex items-center gap-1.5 h-7 px-3 text-[12px] font-medium rounded border transition-colors ${
              canRunTests && !running
                ? "bg-[#0e7a0d] hover:bg-[#1a9e19] text-white border-[#0e7a0d] shadow-sm"
                : "bg-[#3c3c3c] text-[#666] border-[#555] cursor-not-allowed"
            }`}
            onClick={() => {
              if (canRunTests && !running) {
                dispatch({ type: ACTIONS.RUN_TESTS, fileId: activeFile.id });
              }
            }}
            disabled={!canRunTests || running}
          >
            {running ? (
              <span className="animate-pulse">⏳</span>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <polygon points="2,1 9,5 2,9"/>
              </svg>
            )}
            {running ? "Running…" : "Run Tests"}
          </button>
        </div>
      </div>

      {/* ── No test cases ── */}
      {testCases.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#555]">
          <div className="text-3xl">🧪</div>
          <div className="text-[13px]">No test cases yet</div>
          <button
            className="text-[12px] text-[#007acc] hover:underline"
            onClick={() => dispatch({ type: ACTIONS.ADD_TEST_CASE, fileId: activeFile.id })}
          >
            + Add your first test case
          </button>
        </div>
      ) : (
        <>
          {/* ── Case tabs ── */}
          <div className="flex-none flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto border-b border-[#3c3c3c] bg-[#1e1e1e]">
            {testCases.map((tc, i) => {
              const result = runForCurrentFile ? latestRun?.results?.[i] : null;
              const hasPassed = result?.passed === true;
              const hasFailed = result !== null && result?.passed === false;

              return (
                <button
                  key={tc.id}
                  onClick={() => setActiveCase(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] rounded-t border-t-2 transition-colors whitespace-nowrap ${
                    i === safeCaseIdx
                      ? "bg-[#252526] text-white border-t-[#007acc]"
                      : "text-[#888] hover:text-[#ccc] hover:bg-[#2a2d2e] border-t-transparent"
                  }`}
                >
                  {hasPassed && <span className="text-green-400 text-[10px]">✓</span>}
                  {hasFailed && <span className="text-red-400 text-[10px]">✕</span>}
                  Case {i + 1}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Delete test case"
                    className="ml-1 text-[#555] hover:text-red-400 transition-colors text-[10px] leading-none cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: ACTIONS.DELETE_TEST_CASE, testCaseId: tc.id, fileId: activeFile.id });
                      setActiveCase(Math.max(0, i - 1));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        dispatch({ type: ACTIONS.DELETE_TEST_CASE, testCaseId: tc.id, fileId: activeFile.id });
                        setActiveCase(Math.max(0, i - 1));
                      }
                    }}
                    title="Delete"
                  >
                    ✕
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Active case content ── */}
          {currentCase && (
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
              {/* Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#888]">
                  Input
                </label>
                <textarea
                  id={`test-input-${currentCase.id}`}
                  className="w-full text-[13px] rounded border border-[#3c3c3c] bg-[#252526] text-[#d4d4d4] p-3 font-mono focus:ring-1 focus:ring-[#007acc] focus:border-[#007acc] outline-none resize-none transition-shadow"
                  rows={3}
                  placeholder="e.g. [2, 3] or 5 or &quot;hello&quot;"
                  value={typeof currentCase.input === "string" ? currentCase.input : safeStringify(currentCase.input)}
                  onChange={(e) => {
                    dispatch({
                      type: ACTIONS.UPDATE_TEST_CASE,
                      testCaseId: currentCase.id,
                      fileId: activeFile.id,
                      updates: { input: e.target.value },
                    });
                  }}
                />
              </div>

              {/* Expected Output */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#888]">
                  Expected Output
                </label>
                <textarea
                  id={`test-expected-${currentCase.id}`}
                  className="w-full text-[13px] rounded border border-[#3c3c3c] bg-[#252526] text-[#d4d4d4] p-3 font-mono focus:ring-1 focus:ring-[#007acc] focus:border-[#007acc] outline-none resize-none transition-shadow"
                  rows={2}
                  placeholder="e.g. 5"
                  value={typeof currentCase.expected === "string" ? currentCase.expected : safeStringify(currentCase.expected)}
                  onChange={(e) => {
                    dispatch({
                      type: ACTIONS.UPDATE_TEST_CASE,
                      testCaseId: currentCase.id,
                      fileId: activeFile.id,
                      updates: { expected: e.target.value },
                    });
                  }}
                />
              </div>

              {/* Result for this case */}
              {currentResult && (
                <div
                  className={`rounded-lg border p-4 ${
                    currentResult.passed
                      ? "bg-green-950/40 border-green-800/40"
                      : "bg-red-950/40 border-red-800/40"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xl ${currentResult.passed ? "text-green-400" : "text-red-400"}`}>
                      {currentResult.passed ? "✅" : "❌"}
                    </span>
                    <span className={`text-[13px] font-semibold ${currentResult.passed ? "text-green-300" : "text-red-300"}`}>
                      {currentResult.passed ? "Test Passed" : "Test Failed"}
                    </span>
                  </div>

                  {!currentResult.passed && (
                    <div className="flex flex-col gap-2 text-[12px]">
                      <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                        <span className="text-[#888] font-medium pt-0.5">Input</span>
                        <code className="bg-[#1e1e1e] px-2 py-1 rounded border border-[#3c3c3c] text-[#d4d4d4] break-all">
                          {safeStringify(currentResult.testCase?.input)}
                        </code>
                      </div>
                      <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                        <span className="text-[#888] font-medium pt-0.5">Expected</span>
                        <code className="bg-[#1e1e1e] px-2 py-1 rounded border border-green-800/40 text-green-300 break-all">
                          {safeStringify(currentResult.expected)}
                        </code>
                      </div>
                      <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                        <span className="text-[#888] font-medium pt-0.5">Actual</span>
                        <code className="bg-[#1e1e1e] px-2 py-1 rounded border border-red-800/40 text-red-300 break-all">
                          {safeStringify(currentResult.actual)}
                        </code>
                      </div>
                      {currentResult.error && (
                        <div className="mt-1 bg-red-950/60 text-red-400 px-3 py-2 rounded border border-red-800/30 font-mono text-[11px] whitespace-pre-wrap">
                          {currentResult.error}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Overall run summary ── */}
          {runForCurrentFile && latestRun && (
            <div className={`flex-none flex items-center justify-between px-4 py-2 border-t ${
              latestRun.status === "Passed"
                ? "border-green-800/40 bg-green-950/30"
                : "border-red-800/40 bg-red-950/30"
            }`}>
              <div className="flex items-center gap-2">
                <span className={`text-[13px] ${latestRun.status === "Passed" ? "text-green-400" : "text-red-400"}`}>
                  {latestRun.status === "Passed" ? "✅" : "❌"}
                </span>
                <span className={`text-[12px] font-semibold ${latestRun.status === "Passed" ? "text-green-300" : "text-red-300"}`}>
                  {latestRun.status === "Passed" ? "All tests passed" : "Some tests failed"}
                </span>
              </div>
              <span className="text-[12px] text-[#888]">
                {latestRun.passed}/{latestRun.total} passed · {latestRun.duration}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
