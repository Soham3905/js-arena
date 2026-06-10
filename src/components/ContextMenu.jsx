import React, { useEffect } from "react";

export default function ContextMenu({ x, y, items, onClose }) {
  useEffect(() => {
    const handleOutsideClick = () => onClose();
    window.addEventListener("click", handleOutsideClick);
    window.addEventListener("contextmenu", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
      window.removeEventListener("contextmenu", handleOutsideClick);
    };
  }, [onClose]);

  if (!items || items.length === 0) return null;

  // Make sure menu doesn't go off screen
  const menuStyle = {
    top: Math.min(y, window.innerHeight - (items.length * 30)),
    left: Math.min(x, window.innerWidth - 160),
  };

  return (
    <div 
      className="fixed bg-white border border-gray-200 shadow-lg rounded py-1 z-[100] min-w-[160px] text-sm"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {items.map((item, index) => {
        if (item === "separator") {
          return <div key={index} className="h-px bg-gray-200 my-1 mx-2" />;
        }
        return (
          <button
            key={index}
            className={`w-full text-left px-4 py-1.5 flex items-center gap-2
              ${item.danger ? "text-red-600 hover:bg-red-50" : "hover:bg-blue-50 text-gray-700 hover:text-blue-600"}
              disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-gray-700`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            disabled={item.disabled}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
