import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";


/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  stylistic.configs["all"],
  {
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "@stylistic/quote-props": [
        "error",
        "consistent-as-needed",
      ],
      "@stylistic/indent": [
        "error",
        2,
      ],
      "@stylistic/object-curly-spacing": [
        "error",
        "always",
        {
          arraysInObjects: true,
          objectsInObjects: false,
        },
      ],
      "@stylistic/array-bracket-spacing": [
        "error",
        "never",
      ],
      "@stylistic/comma-dangle": [
        "error",
        "always-multiline",
      ],
      "@stylistic/function-call-argument-newline": [
        "error",
        "consistent",
      ],
      "@stylistic/function-paren-newline": [
        "error",
        "multiline-arguments",
      ],
    },
  },
  {
    files: ["client/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: { globals: globals.browser },
    rules: {
      "@stylistic/object-property-newline": [
        "error",
        { allowAllPropertiesOnSameLine: true },
      ],
      "@stylistic/padded-blocks": [
        "error",
        { classes: "always",
          blocks: "never",
          switches: "always" },
        { allowSingleLineBlocks: true },
      ],
      "@stylistic/array-element-newline": [
        "error",
        "consistent",
      ],
      "@stylistic/max-len": [
        "error",
        {
          code: 150, // (default 80) enforces a maximum line length
          tabWidth: 2, // (default 4) specifies the character width for tab characters
          /*
           * "comments": 120, // enforces a maximum line length for comments; defaults to value of code
           * "ignorePattern": , // ignores lines matching a regular expression; can only match a single line and need to be double escaped when written in YAML or JSON
           */
          ignoreComments: true, // : true ignores all trailing comments and comments on their own line
          ignoreTrailingComments: true, // : true ignores only trailing comments
          ignoreUrls: true, // : true ignores lines that contain a URL
          ignoreStrings: true, // : true ignores lines that contain a double-quoted or single-quoted string
          ignoreTemplateLiterals: true, // : true ignores lines that contain a template literal
          ignoreRegExpLiterals: true, // : true ignores lines that contain a RegExp literal
        },
      ],
    },
  },
  {
    files: ["server/**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: { globals: globals.node },
    rules: {
      "@stylistic/object-property-newline": [
        "error",
        { allowAllPropertiesOnSameLine: true },
      ],
      "@stylistic/padded-blocks": [
        "error",
        { classes: "always",
          switches: "always" },
        { allowSingleLineBlocks: true },
      ],
      "@stylistic/array-element-newline": [
        "error",
        "consistent",
      ],
    },
  },
];
