module.exports = {
    env: { node: true },
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended-type-checked",
        "prettier",
    ],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
    },
    root: true,
    rules: {
        "no-console": "error",
        "dot-notation": "error",
        "@typescript-eslint/require-await": "off",
        "@typescript-eslint/no-unused-vars": [
            "error",
            { argsIgnorePattern: "^_" },
        ],
        "@typescript-eslint/no-misused-promises": [
            "error",
            { checksVoidReturn: { arguments: false } },
        ],
    },
};
