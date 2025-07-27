import globals from 'globals';
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
	{
		ignores: [
			'**/*.js',
			'**/node_modules/',
			'backend/production/**',
			'infrastructure/.cdk.staging/*',
			'infrastructure/cdk.out/**/**',
			'backend/src/types/*.d.ts',
			'infrastructure/jest.config.js',
			'**/production/**/*.js',
			'**/cdk.out/**',
			'**/*.config.js',
			'**/*.test.ts',
		],
	},
	js.configs.recommended,
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest,
			},
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: [
					'./backend/tsconfig.json',
					'./infrastructure/tsconfig.json',
				],
			},
		},
		files: ['backend/**/*.ts', 'infrastructure/**/*.ts'],
		plugins: {
			'@typescript-eslint': ts,
		},
		rules: {
			'no-console': 'warn',
			'no-debugger': 'error',
			'@typescript-eslint/no-unused-vars': 'error'
		},
		ignores: [
			'**/*.js',
		],
	},
];
