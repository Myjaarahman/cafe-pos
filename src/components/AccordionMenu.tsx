"use client";

import { useState } from "react";
import { MenuItem } from "@/types";

export default function AccordionMenu({
  groupedMenu,
  onAdd,
}: {
  groupedMenu: Record<string, MenuItem[]>;
  onAdd: (item: MenuItem) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (key: string) => {
    setOpen(prev => (prev === key ? null : key));
  };

  return (
    <div className="space-y-3 max-h-[72vh] overflow-auto pr-1">
      {Object.entries(groupedMenu).map(([group, items]) => {
        const isOpen = open === group;

        return (
          <div
            key={group}
            className="rounded-xl border border-amber-300 bg-amber-50"
          >
            {/* Header */}
            <button
              onClick={() => toggle(group)}
              className="w-full flex justify-between items-center px-3 py-2 hover:bg-amber-100"
            >
              <div className="text-sm font-semibold text-amber-800">
                {group}
              </div>
              <span className="text-xs">{isOpen ? "▲" : "▼"}</span>
            </button>

            {/* Items */}
            <div
              className={`grid grid-cols-2 md:grid-cols-3 gap-3 px-3 transition-all overflow-hidden ${
                isOpen ? "max-h-96 py-3" : "max-h-0"
              }`}
            >
              {items.map(item => (
                <button
                  key={item.id}
                  className="border rounded-xl p-4 text-left bg-white active:scale-95"
                  onClick={() => onAdd(item)}
                >
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-zinc-600">
                    RM {Number(item.price).toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
