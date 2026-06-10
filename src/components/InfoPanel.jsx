import React from "react";

export default function InfoPanel({ componentConfig, workspace }) {
  return (
    <div className="info-panel">
      <div className="mb-2 font-semibold">Info</div>
      <div className="text-xs text-gray-500">This panel is driven by normalized JSON metadata.</div>
      <pre className="mt-2">{JSON.stringify(componentConfig || {}, null, 2)}</pre>
      <div className="mt-3 text-xs text-gray-500">
        Open tabs: {workspace.tabs?.openTabs?.length || 0} | Search index: {workspace.search?.searchIndex?.length || 0}
      </div>
    </div>
  );
}
