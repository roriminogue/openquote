import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"] ?? reactHooks.configs["recommended-latest"],
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  globalIgnores([
    "dist/**",
    // Native iPhone build output.
    "ios/build/**",
    "ios/App/App/public/**",
    // Built by `npx astryx theme build` from openquoteTheme.ts, plus the descriptor in the shape the CLI expects.
    "src/themes/openquote/openquote.*",
    "src/themes/openquote/*.doc.mjs",
  ]),
]);
