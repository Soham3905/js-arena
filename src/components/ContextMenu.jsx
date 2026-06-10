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
    top: Math.min(y, window.innerHeight - (items.length * 32 + 16)),
    left: Math.min(x, window.innerWidth - 180),
  };

  return (
    <div
      className="fixed bg-[#252526] border border-[#454545] shadow-2xl rounded py-1 z-[100] min-w-[180px] text-[12px]"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      {items.map((item, index) => {
        // Support both {type:"separator"} and "separator" string
        if (item === "separator" || item?.type === "separator") {
          return <div key={index} className="h-px bg-[#3c3c3c] my-1 mx-2" />;
        }
        // Support both item.action and item.onClick
        const handler = item.action || item.onClick;
        return (
          <button
            key={index}
            className={`w-full text-left px-3 py-1.5 flex items-center gap-2 transition-colors
              ${item.danger
                ? "text-red-400 hover:bg-red-900/30"
                : "text-[#cccccc] hover:bg-[#094771] hover:text-white"
              }
              disabled:opacity-40 disabled:cursor-not-allowed`}
            onClick={() => {
              if (handler) handler();
              onClose();
            }}
            disabled={item.disabled}
          >
            {item.icon && <span className="w-4 flex-none opacity-70">{item.icon}</span>}
            {item.label}
            {item.shortcut && (
              <span className="ml-auto text-[10px] text-[#888] pl-4">{item.shortcut}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
