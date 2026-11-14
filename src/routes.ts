export const ROUTES = ['home', 'add', 'days', 'ledger', 'confirm', 'register', 'settings'] as const;

export type Route = (typeof ROUTES)[number];

export function routeFromHash(hash: string): Route {
  const name = hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'home';
}

export function codeFromHash(hash: string): string | undefined {
  const match = /^#code=(.+)$/.exec(hash);
  if (!match) return undefined;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function isContractorPage(pathname: string): boolean {
  return /\/confirm\/?(index\.html)?$/.test(pathname);
}
