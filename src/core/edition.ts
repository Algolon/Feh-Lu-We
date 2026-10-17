// Public route selects the family-safe game without changing the full edition.
// Keep the decision path-based (not a query flag) and centralised for world, audio and saves.
export function isFamilyEditionPath(pathname: string, basePath = import.meta.env.BASE_URL): boolean {
  const base = basePath.endsWith('/') ? basePath : basePath + '/';
  const route = base + 'game';
  return pathname === route || pathname === route + '/' || pathname === route + '/index.html';
}

export const FAMILY_EDITION = typeof location !== 'undefined' && isFamilyEditionPath(location.pathname);
