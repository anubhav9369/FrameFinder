"use client";

import { useState } from "react";

interface FaqItem {
  q: string;
  a: string;
}

export default function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="divide-y divide-zinc-800 rounded-2xl border border-zinc-800 bg-zinc-900/60">
      {items.map((item, i) => (
        <div key={item.q}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            aria-expanded={open === i}
          >
            <span className="font-medium">{item.q}</span>
            <span className="text-zinc-500">{open === i ? "−" : "+"}</span>
          </button>
          {open === i && (
            <p className="px-6 pb-5 text-sm leading-relaxed text-zinc-400">
              {item.a}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
