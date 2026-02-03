import baseConfig from '@s8e/configs/tailwind';

export default {
  ...baseConfig,
  content: [
    './app/**/*.{ts,tsx,mdx}',
    './components/**/*.{ts,tsx,mdx}',
    '../../packages/ui/src/**/*.{ts,tsx,mdx}'
  ]
};
