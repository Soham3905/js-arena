import React from "react";

export default function Placeholder({ type }) {
  return <div className="text-sm text-red-600">Unknown component: {type}</div>;
}
