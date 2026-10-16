const icons = {
  dashboard: 'M3 3h7v7H3zM14 3h7v11h-7zM3 14h7v7H3zM14 18h7v3h-7z',
  products: 'm12 3 9 5-9 5-9-5 9-5ZM3 8v9l9 5 9-5V8M12 13v9',
  categories: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  branches: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M8 9h1m6 0h1',
  promotions: 'm3 3 10 1 9 9-9 9-9-9-1-10ZM8 8h.01',
  orders: 'M6 3h12v19l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 5h6',
  users: 'M15 21v-3a6 6 0 0 0-12 0v3M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 9a5 5 0 0 1 4 5v4',
  settings: 'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
  refresh: 'M20 4v6h-6M4 20v-6h6M5 8a8 8 0 0 1 14-2l1 4M4 14l1 4a8 8 0 0 0 14-2',
  trend: 'm3 17 6-6 4 3 8-10m-6 0h6v6',
  wallet: 'M3 6h17v15H3V6Zm0 0 14-3v3m-2 6h5v5h-5z',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
  logout: 'M10 4H4v16h6m-1-8h12m-4-4 4 4-4 4',
  external: 'M14 3h7v7m0-7L10 14M10 4H4v16h16v-6',
  check: 'm5 12 4 4L19 6'
} as const;
export type AdminIconName = keyof typeof icons;
export function AdminIcon({ name }: { name: AdminIconName }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[name]} />
    </svg>
  );
}
