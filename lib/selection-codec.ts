export interface SelectionItem {
  folder: string;
  filename: string;
}

export const SELECTION_HEADER = 'FRAMEFINDER_SELECTION_V1';

export function encodeSelection(eventName: string, items: SelectionItem[]): string {
  const lines = items.map((i) => `${i.folder} | ${i.filename}`);
  return `I've finished selecting photos for ${eventName} — ${items.length} photos selected\n\n${SELECTION_HEADER}\n${lines.join('\n')}`;
}

export function decodeSelection(text: string): SelectionItem[] | null {
  const idx = text.indexOf(SELECTION_HEADER);
  if (idx === -1) return null;
  const items: SelectionItem[] = [];
  for (const line of text.slice(idx + SELECTION_HEADER.length).split('\n')) {
    const m = line.match(/^\s*(.+?)\s*\|\s*(.+?)\s*$/);
    if (m) items.push({ folder: m[1], filename: m[2] });
  }
  return items;
}
