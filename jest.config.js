/** @type {import('ts-jest').JestConfigWithTsJest} */
// eslint-disable-next-line no-undef
module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    verbose: true,
    collectCoverage: true,
    coverageProvider: "v8",
    collectCoverageFrom: ["src/**/*.ts", "!tests/**", "!**/node_modules/**"],
    // jwks-rsa depends on jose v6, which is published as ESM only. Jest runs
    // CommonJS, so jose has to be run through ts-jest instead of being skipped
    // with the rest of node_modules.
    transform: {
        "^.+\\.[tj]sx?$": [
            "ts-jest",
            { tsconfig: { allowJs: true, module: "commonjs" } },
        ],
    },
    transformIgnorePatterns: ["/node_modules/(?!jose/)"],
};
