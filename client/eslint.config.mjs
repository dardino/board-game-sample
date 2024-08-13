import globals from "globals";
import baseConfig from "../eslint.config.mjs";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser }},
  ...baseConfig,
];
