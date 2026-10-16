import type { CSSProperties } from 'react';

const paths = {
  home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
  flame: 'M12 3c1 5-4 6-3 10 1-2 3-3 4-5 5 4 7 8 4 12-3 3-8 2-10-1C3 14 7 9 12 3Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0ZM9 10a3 3 0 1 0 6 0 3 3 0 0 0-6 0',
  bag: 'M5 7h14l1 14H4L5 7Zm3 0V6a4 4 0 0 1 8 0v1',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'm6 6 12 12M6 18 18 6',
  search: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6',
  check: 'm5 12 4 4L19 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
  heart: 'M12 21 3 12C-2 5 7 0 12 7c5-7 14-2 9 5l-9 9Z',
  photo: 'M3 4h18v16H3V4Zm0 12 5-5 4 4 3-3 6 6M15 8h.01',
  chat: 'M21 11a9 9 0 0 1-13 8l-5 2 1-5A9 9 0 1 1 21 11ZM8 11h8',
  phone: 'M5 3h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c-8 4-20-8-16-16Z'
} as const;

export function SiteIcon({
  name,
  className,
  style
}: {
  name: keyof typeof paths;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      style={style}
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}
