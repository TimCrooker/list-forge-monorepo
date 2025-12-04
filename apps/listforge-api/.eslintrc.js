module.exports = {
  extends: ['@listforge/config/eslint/nestjs'],
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  ignorePatterns: ['.eslintrc.js', 'dist'],
};

