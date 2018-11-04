module.exports = {
  setupFiles: ['<rootDir>/enzymeSetup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsConfig: 'tsconfig.json',
    },
  },
  testMatch: ['<rootDir>/src/*.test.(ts|tsx|js)'],
}
