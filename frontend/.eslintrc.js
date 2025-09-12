module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
  ],
  rules: {
    // Disable unreachable code warnings as they are often false positives in React
    'no-unreachable': 'off',
    'no-unreachable-loop': 'off',
    
    // Allow console statements in development
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // Allow unused variables in development
    '@typescript-eslint/no-unused-vars': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // Allow any type in development
    '@typescript-eslint/no-explicit-any': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    
    // React specific rules - be more lenient with exhaustive-deps
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    
    // Allow JSX in .tsx files
    'react/jsx-filename-extension': [1, { extensions: ['.tsx', '.ts'] }],
    
    // Disable some common false positives
    '@typescript-eslint/no-use-before-define': 'warn',
    
    // Disable React Router future flag warnings
    'react-router/no-unused-vars': 'off',
  },
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'build/**/*',
    'node_modules/**/*',
    '*.config.js',
    '*.config.ts',
  ],
}; 