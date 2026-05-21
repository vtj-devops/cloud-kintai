import path from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      "amplify-codegen-temp/models",
      "amplify-codegen-temp/models/models",
      "src/ui-components/**",
      "node_modules",
      ".vscode",
      "amplify",
      ".devcontainer",
      "buid",
      "public",
      "infra",
    ],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  ...compat.config({
    root: true,
    env: {
      browser: true,
      es2023: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
    ],
    overrides: [
      {
        env: {
          node: true,
        },
        files: [".eslintrc.{js,cjs}"],
        parserOptions: {
          sourceType: "script",
        },
      },
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: [
      "@typescript-eslint",
      "react",
      "react-hooks",
      "import",
      "simple-import-sort",
      "unused-imports",
      "boundaries",
    ],
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "processes", pattern: "src/processes/**" },
        { type: "pages", pattern: "src/pages/**" },
        { type: "features", pattern: "src/features/**" },
        { type: "entities", pattern: "src/entities/**" },
        { type: "shared", pattern: "src/shared/**" },
      ],
    },
    rules: {
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "unused-imports/no-unused-imports": "error",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/static-components": "warn", // render中のコンポーネント定義を警告レベルに
      "boundaries/element-types": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: "app",
              allow: ["processes", "pages", "features", "entities", "shared"],
            },
            {
              from: "processes",
              allow: ["pages", "features", "entities", "shared"],
            },
            { from: "pages", allow: ["features", "entities", "shared"] },
            { from: "features", allow: ["entities", "shared"] },
            { from: "entities", allow: ["shared"] },
            { from: "shared", allow: ["shared"] },
          ],
          message:
            "依存方向は app -> processes -> pages -> features -> entities -> shared のみ許可されています",
        },
      ],
      "boundaries/no-private": [
        "error",
        {
          allowUncles: false,
          message:
            "features から app/pages/processes への依存は禁止されています",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "CallExpression[callee.property.name='sort']",
          message:
            "Use Array.prototype.toSorted() instead of sort() to avoid mutation.",
        },
        {
          selector: "CallExpression[callee.property.name='reverse']",
          message:
            "Use Array.prototype.toReversed() instead of reverse() to avoid mutation.",
        },
        {
          selector: "CallExpression[callee.property.name='splice']",
          message:
            "Use Array.prototype.toSpliced() instead of splice() to avoid mutation.",
        },
        {
          selector: "CallExpression[callee.property.name='hasOwnProperty']",
          message: "Use Object.hasOwn() instead of hasOwnProperty().",
        },
      ],
      "max-lines-per-function": [
        "warn",
        {
          max: 220,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  }),
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@mui/material",
              importNames: ["Button", "IconButton"],
              message:
                "Use AppButton/AppIconButton from @/shared/ui/button instead.",
            },
            {
              name: "@mui/material/Button",
              message: "Use AppButton from @/shared/ui/button instead.",
            },
            {
              name: "@mui/material/IconButton",
              message: "Use AppIconButton from @/shared/ui/button instead.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "src/features/admin/holidayCalendar/**/*.{ts,tsx,js,jsx}",
      "src/features/admin/staff/ui/actions/CreateStaffDialog.tsx",
      "src/features/admin/staff/ui/editor/AdminStaffEditor.tsx",
      "src/features/admin/staffAttendanceList/**/*.{ts,tsx,js,jsx}",
      "src/features/attendance/daily-list/**/*.{ts,tsx,js,jsx}",
      "src/features/attendance/edit/ui/ChangeRequestDialog/**/*.{ts,tsx,js,jsx}",
      "src/features/attendance/list/**/*.{ts,tsx,js,jsx}",
      "src/features/attendance/statistics/**/*.{ts,tsx,js,jsx}",
      "src/features/shift/collaborative/components/**/*.{ts,tsx,js,jsx}",
      "src/features/shift/management/**/*.{ts,tsx,js,jsx}",
      "src/features/shift/request-form/**/*.{ts,tsx,js,jsx}",
      "src/features/splitView/**/*.{ts,tsx,js,jsx}",
      "src/pages/admin/AdminLayout.tsx",
      "src/pages/preview/**/*.{ts,tsx,js,jsx}",
      "src/pages/shift/collaborative/ShiftCollaborativePrototype.tsx",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
];
