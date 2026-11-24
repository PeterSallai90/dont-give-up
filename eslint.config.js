import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "src/generated/", "node_modules/", "coverage/", "android/", "ios/"] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/explicit-function-return-type": ["error", { allowExpressions: true }],
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  { files: ["tools/**"], rules: { "no-console": "off" } },
);
