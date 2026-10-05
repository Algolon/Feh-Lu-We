// Small drawn SVG icon set for the HUD and inventory (consistent across platforms, unlike emoji).
// 24×24 viewBox, stroke-based, currentColor so they follow the button's text colour.

const P: Record<string, string> = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  hint: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
  notes: 'M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h11M9 8h6M9 11h4',
  bag: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2M9 12h6',
  map: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14',
  close: 'M6 6l12 12M18 6L6 18',
  // items
  invitation: 'M3 7h18v11H3zM3 7l9 6 9-6',
  torch: 'M4 10h9v4H4zM13 9l5-3v12l-5-3zM20 9l2-1M20 15l2 1',
  matches: 'M4 9h16v8H4zM4 12h16M8 9V5M8 5a1 1 0 1 1 0-.1',
  notebook: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM9 3v18M12 8h4M12 11h3',
  key: 'M7 15a3 3 0 1 1 0-.1zM10 14l9-9M16 8l2 2M14 10l2 2',
  kindling: 'M3 16l18-6M3 12l18 6M5 19h14',
  token: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 17v-6M12 11l-3-3M12 11l3-3M12 14l-2-1M12 14l2-1',
  crank: 'M5 18V8h8M13 8v-3M13 5h5M5 18h3',
  crest: 'M5 4h14v6c0 6-4 9-7 10-3-1-7-4-7-10zM12 7v10M8 11h8',
  fragment: 'M5 4h10l4 4-2 3 2 3-2 3 1 3H5zM8 9h6M8 13h5',
};

const ITEM_ICON: Record<string, string> = {
  invitation: 'invitation', torch: 'torch', matches: 'matches', notebook: 'notebook', frontKey: 'key', studyKey: 'key',
  shedKey: 'key', kindling: 'kindling', token: 'token', crank: 'crank', crest: 'crest', cottageKey: 'key', fragment: 'fragment',
};

export function icon(name: string, size = 24, label = ''): string {
  const d = P[name] ?? P.close;
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}><path d="${d}"/></svg>`;
}

export const itemIcon = (id: string, size = 30) => icon(ITEM_ICON[id] ?? 'notebook', size);
