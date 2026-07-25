module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    verbose: true,
    collectCoverage: true,
    coverageProvider: "v8",
    collectCoverageFrom: ["src/**/*.ts", "!tests/**", "!**/node_modules/**"],
    transform: {
        "^.+\\.[tj]sx?$": [
            "ts-jest",
            { tsconfig: { allowJs: true, module: "commonjs" } },
        ],
    },
    transformIgnorePatterns: ["/node_modules/(?!jose/)"],
};
