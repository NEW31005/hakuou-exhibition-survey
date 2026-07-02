import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "gas/**",
      "Code.gs",
      "index.html",
      "dashboard.html"
    ]
  },
  ...nextVitals,
  ...nextTypescript
];

export default eslintConfig;
