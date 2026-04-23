/**
 * Jest configuration for TypeScript + React
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(gif|ttf|eot|svg|png|jpg|jpeg)$": "<rootDir>/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@app/(.*)$": "<rootDir>/src/app/$1",
    "^@processes/(.*)$": "<rootDir>/src/processes/$1",
    "^@pages/(.*)$": "<rootDir>/src/pages/$1",
    "^@features/(.*)$": "<rootDir>/src/features/$1",
    "^@entities/(.*)$": "<rootDir>/src/entities/$1",
    "^@shared/(.*)$": "<rootDir>/src/shared/$1",
  },
  // Ignore directories used by e2e tests and build artifacts
  testPathIgnorePatterns: [
    "/node_modules/",
    "/build/",
    "/playwright/",
    "/tests/",
    "/amplify/",
  ],
  // Only run tests located under src (unit tests)
  testMatch: ["**/src/**/?(*.)+(spec|test).[tj]s?(x)"],
  transform: {
    "^.+\\.(ts|tsx)$": "<rootDir>/__mocks__/importMetaTransformer.cjs",
    "^.+\\.(yaml|yml)$": "<rootDir>/__mocks__/yamlTransformer.cjs",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node", "yaml", "yml"],
  // Coverage configuration
  coverageReporters: ["text", "lcov", "html"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
    "!src/ui-components/**",
    "!src/aws-exports.js",
    "!src/amplifyconfiguration.json",
    "!src/graphql/**",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.spec.{ts,tsx}",
  ],
  coverageThreshold: {
    global: {
      statements: 38,
      branches: 28,
      functions: 31,
      lines: 38,
    },
  },
};
