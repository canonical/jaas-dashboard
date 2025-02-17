import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import prettier from "eslint-plugin-prettier";
import vitest from "eslint-plugin-vitest";
import promise from "eslint-plugin-promise";
import reactRefresh from "eslint-plugin-react-refresh";
import react from "eslint-plugin-react";
import _import from "eslint-plugin-import";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...fixupConfigRules(
    compat.extends(
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react/jsx-runtime",
      "plugin:prettier/recommended",
      "plugin:import/typescript",
      "plugin:promise/recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react-hooks/recommended",
    ),
  ),
  {
    plugins: {
      prettier: fixupPluginRules(prettier),
      vitest,
      promise: fixupPluginRules(promise),
      "react-refresh": reactRefresh,
      react: fixupPluginRules(react),
      import: fixupPluginRules(_import),
    },
    languageOptions: {
      globals: {
        window: true,
        document: true,
        localStorage: true,
        windowLocation: true,
        jujuDashboardConfig: true,
        lightningjs: true,
      },
      parser: tsParser,
      ecmaVersion: 5,
      sourceType: "script",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        project: "./tsconfig.json",
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      "import/resolver": { node: { paths: ["src"] } },
      react: { version: "detect" },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "prefer-promise-reject-errors": "error",
      "@typescript-eslint/await-thenable": "error",
      "react/jsx-filename-extension": [1, { extensions: [".js", ".tsx"] }],
      "import/prefer-default-export": 0,
      "import/imports-first": ["error", "absolute-first"],
      "import/newline-after-import": "error",
      "import/order": [
        "error",
        {
          "newlines-between": "always",
          alphabetize: { order: "asc" },
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
        },
      ],
      "vitest/prefer-expect-assertions": 0,
      "vitest/no-hooks": 0,
      "default-case": 0,
      "no-param-reassign": 0,
      "no-case-declarations": 0,
      "no-constant-condition": ["error", { checkLoops: false }],
      "prefer-destructuring": 0,
      "react/no-unescaped-entities": 0,
      "react/display-name": 0,
      "@typescript-eslint/no-duplicate-enum-values": 0,
      "promise/catch-or-return": ["error", { allowFinally: true }],
      "react-refresh/only-export-components": ["error"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          caughtErrors: "none",
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": [
        "error",
        { allowShortCircuit: true },
      ],
    },
  },
];
