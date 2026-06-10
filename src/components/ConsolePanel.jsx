import React from "react";
import { getConsoleLogs } from "../functions";

export default function ConsolePanel({ workspace }) {
  const logs = getConsoleLogs(workspace);

  return (
    <div className="flex h-full flex-col bg-[#1e1e1e] text-gray-300 overflow-auto p-3 font-mono text-sm">
      {logs.length === 0 ? (
        <div className="text-gray-500 italic">No console output.</div>
      ) : (
        logs.map((log, i) => (
          <div key={log.id || i} className={`mb-1 pb-1 border-b border-[#2d2d2d] ${log.type === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
            <span className="opacity-50 mr-2 text-xs">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className="whitespace-pre-wrap">{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
