"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/templates/modern-clean/shared";

type Props = {
  startDate: string | null;
  endDate: string | null;
  isCurrent?: boolean;
  showIsCurrent?: boolean;
  onSave: (startDate: string | null, endDate: string | null, isCurrent: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
};

export function EditableDateRange({
  startDate,
  endDate,
  isCurrent = false,
  showIsCurrent = false,
  onSave,
  className,
  style,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const display = formatDateRange(startDate, endDate, isCurrent) || "Add dates";

  return (
    <>
      <span
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        style={style}
        className={cn(
          "cursor-pointer rounded-sm px-1 transition-colors hover:bg-blue-50",
          (!startDate && !endDate) && "text-gray-300 italic",
          className
        )}
      >
        {display}
      </span>

      {isOpen && (
        <DatePickerPortal
          triggerRef={triggerRef}
          startDate={startDate}
          endDate={endDate}
          isCurrent={isCurrent}
          showIsCurrent={showIsCurrent}
          onSave={(s, e, c) => {
            onSave(s, e, c);
            setIsOpen(false);
          }}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

function DatePickerPortal({
  triggerRef,
  startDate,
  endDate,
  isCurrent,
  showIsCurrent,
  onSave,
  onClose,
}: {
  triggerRef: React.RefObject<HTMLSpanElement | null>;
  startDate: string | null;
  endDate: string | null;
  isCurrent: boolean;
  showIsCurrent: boolean;
  onSave: (startDate: string | null, endDate: string | null, isCurrent: boolean) => void;
  onClose: () => void;
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [start, setStart] = useState(startDate ?? "");
  const [end, setEnd] = useState(endDate ?? "");
  const [current, setCurrent] = useState(isCurrent);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.left });
    }
  }, [triggerRef]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Small delay so the click that opens the popover doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const handleSave = () => {
    onSave(start || null, current ? null : (end || null), current);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
      className="w-64 rounded-lg bg-white p-3 shadow-ambient border-ghost"
    >
      <div className="space-y-3">
        <div>
          <label className="text-[0.7rem] font-medium uppercase tracking-wider text-gray-500">
            Start Date
          </label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="text-[0.7rem] font-medium uppercase tracking-wider text-gray-500">
            End Date
          </label>
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            disabled={current}
            className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {showIsCurrent && (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={current}
              onChange={(e) => setCurrent(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700">I currently work here</span>
          </label>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 rounded-md bg-[#182034] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
