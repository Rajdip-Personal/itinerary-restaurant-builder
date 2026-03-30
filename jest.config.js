// jest.config.js
const sharedConfig = {
  preset: 'ts-jest',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^types/(.*)$': '<rootDir>/types/$1',
    '^utils/(.*)$': '<rootDir>/utils/$1',
    '^services/(.*)$': '<rootDir>/services/$1',
    '^hooks/(.*)$': '<rootDir>/hooks/$1',
    '^components/(.*)$': '<rootDir>/components/$1',
    '^data/(.*)$': '<rootDir>/data/$1',
    '^__tests__/(.*)$': '<rootDir>/__tests__/$1',
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    'utils/**/*.ts',
    'hooks/**/*.ts',
    'components/**/*.tsx',
    '!**/*.d.ts',
  ],
};

module.exports = {
  projects: [
    {
      ...sharedConfig,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.ts'],
    },
    {
      ...sharedConfig,
      displayName: 'jsdom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/__tests__/**/*.test.tsx'],
      setupFilesAfterSetup: ['@testing-library/jest-dom'],
    },
  ],
};
