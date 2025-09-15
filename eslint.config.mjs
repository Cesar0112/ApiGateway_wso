// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/naming-convention': [
        'error',
        // Variables y funciones: camelCase
        {
          selector: ['variable', 'function'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // Variables CONSTANTES: UPPER_CASE
        {
          selector: 'variable',
          modifiers: ['const'],
          types: ['boolean', 'string', 'number', 'array'],
          format: ['UPPER_CASE'],
        },
        // Clases: PascalCase
        {
          selector: 'class',
          format: ['PascalCase'],
        },
        // Interfaces: PascalCase y prefijo "I" (opcional)
        {
          selector: 'interface',
          format: ['PascalCase'],
          prefix: ['I'],
        },
        // Type aliases: PascalCase
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        // Enum members: PascalCase
        {
          selector: 'enumMember',
          format: ['PascalCase'],
        },
        // Propiedades privadas: camelCase con underscore inicial
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ]
    },
  },
);