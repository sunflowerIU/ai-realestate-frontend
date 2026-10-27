"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Ellipsis } from "lucide-react";

export type RowAction = {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  destructive?: boolean;
};

export function RowActions({ actions }: { actions: RowAction[] }) {
  const [position, setPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position) return;
    menu.current?.querySelector("button")?.focus();
    function dismiss(event: PointerEvent) {
      if (
        trigger.current?.contains(event.target as Node) ||
        menu.current?.contains(event.target as Node)
      )
        return;
      setPosition(null);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setPosition(null);
      trigger.current?.focus();
    }
    function close() {
      setPosition(null);
    }
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="row-actions-trigger"
        aria-label="Record actions"
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={() => {
          if (position) return setPosition(null);
          const rect = trigger.current!.getBoundingClientRect();
          const menuHeight = actions.length * 37 + 10;
          setPosition({
            top:
              rect.bottom + menuHeight + 6 > window.innerHeight
                ? Math.max(8, rect.top - menuHeight - 6)
                : rect.bottom + 6,
            right: Math.max(8, window.innerWidth - rect.right),
          });
        }}
      >
        <Ellipsis size={19} />
      </button>
      {position &&
        createPortal(
          <div
            ref={menu}
            className="row-actions-menu"
            role="menu"
            style={position}
          >
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                role="menuitem"
                className={action.destructive ? "row-actions-destructive" : undefined}
                onClick={() => {
                  setPosition(null);
                  action.onClick();
                }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
