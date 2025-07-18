/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */
/** @type {import('jest').Config} */
const config = {
  // A list of paths to modules that run some code to configure or set up the testing framework before each test
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // The test environment that will be used for testing
  testEnvironment: "jest-environment-jsdom",

  moduleNameMapper: {
    "^@axa-fr/react-oidc$": "<rootDir>/stories/mocks/react-oidc.mock.tsx",
    "^../../hooks/metadata$": "<rootDir>/stories/mocks/metadata.mock.tsx",
    "^./jobDataService$": "<rootDir>/stories/mocks/jobDataService.mock.ts",
  },
};

export default config;
