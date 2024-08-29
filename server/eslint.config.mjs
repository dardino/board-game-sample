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
  {
    rules: {
      "@stylistic/function-call-argument-newline": [
        "error",
        "consistent",
      ],
      "@stylistic/object-property-newline": [
        "error",
        { allowAllPropertiesOnSameLine: true },
      ],
      "@stylistic/padded-blocks": [
        "error",
        { classes: "always", switches: "always" },
        { allowSingleLineBlocks: true },
      ],
      "@stylistic/array-element-newline": [
        "error",
        "consistent",
      ],
    },
  },
];
