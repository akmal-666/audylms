import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: ['**/*.svelte'],
		languageOptions: {
			parserOptions: {
				parser: ts.parser
			}
		},
		rules: {
			// SvelteKit uses direct href navigation for internal links — this rule
			// is designed for SPAs without a router, not for SvelteKit.
			'svelte/no-navigation-without-resolve': 'off'
		}
	},
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'.vercel/',
			'dist/',
			'node_modules/',
			'src/lib/types/database.types.ts'
		]
	}
];
