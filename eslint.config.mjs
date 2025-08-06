import globals from 'globals';
import js from '@eslint/js';
import ts from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import stylistic from '@stylistic/eslint-plugin';

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
			'@stylistic': stylistic,
		},
		rules: {
			'no-console': [
				'error',
				{
					allow: ['warn', 'error'],
				},
			],
			'no-debugger': 'error',
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'after-used',
					caughtErrors: 'none',
					ignoreRestSiblings: true,
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
				},
			],
			'no-unused-vars': [
				'error',
				{
					vars: 'all',
					args: 'after-used',
					caughtErrors: 'none',
					ignoreRestSiblings: true,
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
				},
			],
			semi: 'off',

			// https://eslint.style/rules/
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/no-extra-semi': 'error',
			'@stylistic/arrow-parens': ['error', 'as-needed'],
			'@stylistic/quotes': [
				'error',
				'single',
				{
					allowTemplateLiterals: 'always',
				},
			],
		},
		ignores: ['**/*.js'],
	},
];
