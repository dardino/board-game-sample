import globals from "globals";
import baseConfig from "../eslint.config.mjs";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser }},
  ...baseConfig,
  {
    rules: {
      "@stylistic/object-property-newline": [
        "error",
        { allowAllPropertiesOnSameLine: true },
      ],
      "@stylistic/function-call-argument-newline": [
        "error",
        "consistent",
      ],
      "@stylistic/padded-blocks": [
        "error",
        { classes: "always", blocks: "never", switches: "always" },
        { allowSingleLineBlocks: true },
      ],
      "@stylistic/array-element-newline": ["error", "consistent"],
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
];
