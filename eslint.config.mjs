import pluginJs from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin";
import tseslint from "typescript-eslint";

export default [
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  stylistic.configs["all-flat"],
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
    },
  },
];
