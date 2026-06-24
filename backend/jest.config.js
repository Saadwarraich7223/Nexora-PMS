export default {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  setupFiles: ["<rootDir>/tests/helpers/setupEnv.js"],
  clearMocks: true,
  verbose: false,
  coverageDirectory: "coverage",
  testTimeout: 1200000000,
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/index.js",
    "!src/config/env.js",
    "!src/sockets/**",
  ],
};
