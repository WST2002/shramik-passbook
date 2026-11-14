export const ROUTES = ['home', 'add', 'days', 'ledger', 'confirm', 'register', 'settings'] as const;

export type Route = (typeof ROUTES)[number];

export function routeFromHash(hash: string): Route {
  const name = hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(name) ? (name as Route) : 'home';
}

export function codeFromHash(hash: string): string | undefined {
  const match = /^#code=(.+)$/.exec(hash);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function isContractorPage(pathname: string): boolean {
  return /\/confirm\/?(index\.html)?$/.test(pathname);
}
