import type { CSSProperties } from 'react';

export type IconName =
  | 'arrow'
  | 'back'
  | 'sound'
  | 'muted'
  | 'close'
  | 'shield'
  | 'lock'
  | 'bolt'
  | 'users'
  | 'check'
  | 'copy'
  | 'eye'
  | 'code'
  | 'crown'
  | 'external'
  | 'fish';
const paths: Record<IconName, string> = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  back: 'M20 12H4m6-6-6 6 6 6',
  sound: 'M11 4 6 8H3v8h3l5 4V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  muted: 'M11 4 6 8H3v8h3l5 4V4Zm5 5 6 6m0-6-6 6',
  close: 'm6 6 12 12M6 18 18 6',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Zm-4 9 3 3 5-6',
  lock: 'M6 10h12v11H6V10Zm2 0V6a4 4 0 0 1 8 0v4m-4 4v3',
  bolt: 'm13 2-9 12h7l-1 8 10-13h-8l1-7Z',
  users:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m18 0v-2a4 4 0 0 0-3-3.8M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 0a4 4 0 0 1 0 8',
  check: 'm5 12 4 4L19 6',
  copy: 'M9 9h12v12H9V9ZM5 15H3V3h12v2',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16',
  crown: 'm3 6 5 5 4-8 4 8 5-5-2 14H5L3 6Z',
  external: 'M14 3h7v7m0-7L10 14m-1-9H3v16h16v-6',
  fish: 'M15 3v11a7 7 0 0 1-14 0v-3l4 4m10-6 7-4v12l-7-4',
};
export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
