import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Ignore build outputs and node utility scripts
  { ignores: [
    "**/.next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Node scripts that use require()
    "create-admin.js",
    "create-newsletter-table.js",
    "run-cloudinary-migration.js",
    "scripts/**",
  ] },
  // Next.js recommended configs with TypeScript
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Project-specific rules
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "prefer-const": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "@next/next/no-img-element": "warn",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
