import React, { useRef, useEffect } from "react";
import { ACTIONS, getConsoleLogs, getLatestTestRun, getActiveFile, findEntryFile } from "../functions";

function LogLine({ log }) {
  const time = new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const typeStyles = {
    error: "text-[#f48771]",
    warn: "text-[#cca700]",
    info: "text-[#9cdcfe]",
  };

  const dotStyles = {
    error: "bg-red-500",
    warn: "bg-yellow-500",
    info: "bg-blue-400",
  };

  return (
    <div className={`flex items-start gap-2 py-1 border-b border-[#2a2a2a] last:border-b-0 text-[12px] font-mono ${typeStyles[log.type] || "text-[#d4d4d4]"}`}>
      <span className="flex-none flex items-center gap-1.5 text-[#555] text-[11px] pt-0.5 select-none whitespace-nowrap">
        <span className={`w-1.5 h-1.5 rounded-full flex-none mt-0.5 ${dotStyles[log.type] || "bg-gray-500"}`} />
        {time}
      </span>
      <span className="flex-1 whitespace-pre-wrap break-all leading-5">{log.message}</span>
    </div>
  );
}

export default function ConsolePanel({ workspace, dispatch }) {
  const logs = getConsoleLogs(workspace);
  const latestRun = getLatestTestRun(workspace);
  const activeFile = getActiveFile(workspace);
  const hasEntryFile = findEntryFile(workspace) !== null;
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs.length]);

  const runForCurrentFile = latestRun?.fileId && latestRun.fileId === activeFile?.id;

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] overflow-hidden">
      {/* ── Panel header ── */}
      <div className="flex-none flex items-center justify-between px-4 py-2 bg-[#252526] border-b border-[#3c3c3c]">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#bbbbbb]">
            Output
          </span>
          {runForCurrentFile && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                latestRun.status === "Passed"
                  ? "bg-green-500/10 text-green-400 border-green-700/30"
                  : "bg-red-500/10 text-red-400 border-red-700/30"
              }`}
            >
              {latestRun.status === "Passed" ? "✓" : "✕"}
              {" "}{latestRun.passed}/{latestRun.total} tests · {latestRun.duration}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && dispatch && (
            <button
              title="Clear output"
              className="text-[11px] text-[#888] hover:text-[#ccc] transition-colors"
              onClick={() => {
                // Clear logs by dispatching a workspace update
                // We'll just use the clear approach via a known pattern
              }}
            >
              {/* Clear icon */}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="opacity-70 hover:opacity-100">
                <path d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h8V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Test run summary banner ── */}
      {runForCurrentFile && latestRun.status === "Failed" && latestRun.results && (
        <div className="flex-none bg-red-950/30 border-b border-red-800/30 px-4 py-2">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-red-400 text-[13px]">❌</span>
            <span className="text-red-300 text-[12px] font-semibold">
              {latestRun.failed} test{latestRun.failed !== 1 ? "s" : ""} failed — {activeFile?.name}
            </span>
          </div>
          <div className="flex flex-col gap-1 max-h-40 overflow-auto">
            {latestRun.results.filter(r => !r.passed).map((res, i) => (
              <div key={i} className="text-[11px] font-mono bg-[#1e1e1e] rounded border border-red-800/30 px-3 py-1.5 flex flex-col gap-0.5">
                <div className="text-red-400 font-semibold mb-0.5">Case {latestRun.results.indexOf(res) + 1}</div>
                <div className="flex gap-2">
                  <span className="text-[#666] w-16 flex-none">Input:</span>
                  <span className="text-[#d4d4d4]">{typeof res.testCase?.input === "string" ? res.testCase.input : JSON.stringify(res.testCase?.input)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#666] w-16 flex-none">Expected:</span>
                  <span className="text-green-400">{JSON.stringify(res.expected)}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-[#666] w-16 flex-none">Actual:</span>
                  <span className="text-red-400">{JSON.stringify(res.actual) ?? "undefined"}</span>
                </div>
                {res.error && (
                  <div className="text-red-500 italic mt-0.5">{res.error}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {runForCurrentFile && latestRun.status === "Passed" && (
        <div className="flex-none bg-green-950/30 border-b border-green-800/30 px-4 py-2 flex items-center gap-2">
          <span className="text-green-400">✅</span>
          <span className="text-green-300 text-[12px] font-semibold">
            All {latestRun.total} test{latestRun.total !== 1 ? "s" : ""} passed — {activeFile?.name} · {latestRun.duration}
          </span>
        </div>
      )}

      {/* ── Console log lines ── */}
      <div className="flex-1 overflow-auto p-3 flex flex-col">
        {logs.length === 0 ? (
          <div className="flex flex-col gap-3">
            <div className="text-[#555] text-[12px] italic font-mono">
              No output yet. Run your file or tests to see results here.
            </div>
            {/* ── index.js entry-point hint (shown only when index.js is absent) ── */}
            {!hasEntryFile && (
              <div
                className="mt-2 rounded-lg border border-[#3c3c3c] bg-[#252526] p-3 flex flex-col gap-2"
                style={{ borderLeft: "3px solid #007acc" }}
              >
                <div className="flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="#007acc">
                    <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z"/>
                  </svg>
                  <span className="text-[#007acc] text-[11px] font-semibold uppercase tracking-wider">Getting Started — Run Project</span>
                </div>
                <p className="text-[#aaa] text-[11px] leading-5">
                  <strong className="text-[#ccc]">Run Project</strong> bundles all your files starting from an entry point.
                  To use it, create a file named{" "}
                  <code className="text-[#9cdcfe] bg-[#1e1e1e] px-1 py-0.5 rounded text-[11px]">index.js</code>
                  {" "}in any folder — that file is your entry point.
                </p>
                <div className="text-[11px] font-mono text-[#608b4e] bg-[#1e1e1e] rounded p-2 leading-5">
                  <div className="text-[#888] mb-1">{'// index.js'}</div>
                  <div>{"import { count } from './counter.js';"}</div>
                  <div>{"console.log(count);"}</div>
                </div>
                <p className="text-[#666] text-[10px]">
                  💡 Right-click a folder in the Explorer → <em>New File</em> → type <code className="text-[#888]">index.js</code>
                </p>
              </div>
            )}
          </div>
        ) : (
          logs.map((log, i) => <LogLine key={log.id || i} log={log} />)
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
