/**
 * Jest configuration for the hash-to-ipfs extension.
 *
 * This file sets up a TypeScript-aware test environment with ts-jest,
 * configures module resolution to match the browser extension's
 * imports, and ensures that style imports are mocked during tests.
 *
 * The configuration is intentionally verbose so developers can
 * easily tweak any option without hunting for defaults.
 */
module.exports = {
  /** Use ts-jest to transform TypeScript files. */
  preset: 'ts-jest',
  /** Run tests in a browser-like environment (DOM). */
  testEnvironment: 'jsdom',

  /** Only look for test files inside the `tests` directory. */
  roots: ['<rootDir>/tests'],

  /** Pattern to locate test files. */
  testMatch: [
    '**/*.test.ts',
    '**/*.spec.ts'
  ],

  /** Transform TypeScript and TSX files using ts-jest. */
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },

  /**
   * Mock style imports so that importing CSS/SCSS does not break the test
   * environment. The mock file simply exports an empty object.
   */
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
    /** Resolve aliased imports (e.g., @/ui.tsx). */
    '^@/(.*)$': '<rootDir>/$1'
  },

  /**
   * Optional setup file that can configure global test utilities.
   * Keep it minimal to avoid side effects in tests.
   */
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  /** Gather coverage from all source files, excluding mocks and typings. */
  collectCoverageFrom: [
    '**/*.{ts,tsx}',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/*.d.ts'
  ],

  /** Where to output the coverage reports. */
  coverageDirectory: '<rootDir>/coverage',

  /** Provide ts-jest with the correct tsconfig. */
  globals: {
    'ts-jest': { tsconfig: 'tsconfig.json' }
  },

  /** Verbose output helps pinpoint failing tests quickly. */
  verbose: true,

  /** Use a reasonable amount of parallel workers. */
  maxWorkers: '50%',

  /** Friendly name that shows up in the Jest summary. */
  displayName: 'hash-to-ipfs'
};