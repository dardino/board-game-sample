import globals from "globals";

import baseConfig from "../eslint.config.mjs";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { ignores: [
    "dist/**/*.*",
    "**/*.d.ts",
  ] },
  { languageOptions: { globals: globals.node }},
  ...baseConfig,
];
