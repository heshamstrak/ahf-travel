import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The NestJS backend is its own project with its own eslint config and "npm run lint" script
    // (backend/eslint.config.mjs); it was never meant to be swept up by the frontend's lint run.
    "backend/**",
  ]),
]);

export default eslintConfig;
