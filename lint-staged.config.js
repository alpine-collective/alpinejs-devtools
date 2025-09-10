// lint-staged.config.js
export default {
  '*.{js,ts,tsx,css,md,html,json}': 'prettier --write',
  '**/*.{ts,tsx}': () => 'pnpm typecheck',
};
