import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
mkdirSync(`${root}/client/public/fonts`, { recursive: true });
for (const [family, weights] of Object.entries({
  inter: [400, 500, 600],
  'space-grotesk': [500, 700],
  'jetbrains-mono': [400, 500],
})) {
  for (const weight of weights) {
    const file = `${family}-latin-${weight}-normal.woff2`;
    copyFileSync(
      `${root}/node_modules/@fontsource/${family}/files/${file}`,
      `${root}/client/public/fonts/${file}`,
    );
  }
  copyFileSync(
    `${root}/node_modules/@fontsource/${family}/LICENSE`,
    `${root}/client/public/fonts/${family}-LICENSE.txt`,
  );
}
