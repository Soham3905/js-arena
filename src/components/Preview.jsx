import React from "react";
import { getActiveContent, getActiveFile } from "../functions";

export default function Preview({ workspace }) {
  const selectedFile = getActiveFile(workspace);
  const selectedContent = getActiveContent(workspace);

  if (!selectedFile) {
    return <div className="text-sm text-gray-500">No file selected</div>;
  }

  return (
    <div className="preview">
      <div className="mb-2 text-xs text-gray-600">Preview</div>
      <PreviewBody file={selectedFile} content={selectedContent} />
    </div>
  );
}

function PreviewBody({ file, content }) {
  switch (file.extension) {
    case "json":
      return <pre className="whitespace-pre-wrap">{formatJson(content)}</pre>;
    case "md":
      return <pre className="whitespace-pre-wrap font-serif">{content}</pre>;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
      return <div className="rounded border border-dashed p-4 text-sm text-gray-500">Image preview requires binary asset support.</div>;
    default:
      return <pre className="whitespace-pre-wrap">{content}</pre>;
  }
}

function formatJson(content) {
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}
