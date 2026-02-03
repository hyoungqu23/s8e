import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    '../../apps/**/*.{ts,tsx,mdx}',
    '../../packages/ui/**/*.{ts,tsx,mdx}'
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
