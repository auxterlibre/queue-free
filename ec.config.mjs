import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { code, frame } from './src/styles/palette.mjs';

const scope = (scope, foreground) => ({ scope, settings: { foreground } });

const godotTheme = {
	name: 'godot-4-modern',
	type: 'dark',
	colors: {
		'editor.background': frame.code,
		'editor.foreground': code.default,
		'editorLineNumber.foreground': code.dim,
		'editorLineNumber.activeForeground': code.dim,
		'editorGroupHeader.tabsBackground': frame.error,
		'tab.activeBackground': frame.code,
		'tab.activeForeground': code.default,
		'tab.inactiveBackground': frame.error,
	},
	tokenColors: [
		scope(['source', 'variable'], code.default),
		scope(['punctuation', 'keyword.operator', 'meta.brace'], code.symbol),
		scope(['keyword', 'storage', 'keyword.operator.wordlike', 'keyword.operator.boolean', 'constant.language'], code.keyword),
		scope(['keyword.control'], code.controlFlow),
		scope(['entity.name.type.class.builtin', 'keyword.type', 'storage.type.primitive'], code.baseType),
		scope(['entity.name.type', 'support.class', 'entity.other.inherited-class'], code.engineType),
		scope(['comment', 'punctuation.definition.comment'], code.dim),
		scope(['string', 'constant.character.escape'], code.string),
		scope(['constant.numeric'], code.number),
		scope(['entity.name.function', 'entity.name.function.other', 'support.function'], code.function),
		scope(['variable.other.property', 'variable.other.member'], code.member),
		scope(['entity.name.function.decorator', 'punctuation.definition.decorator'], code.annotation),
		scope(
			['meta.literal.nodepath', 'meta.literal.nodepath keyword.control.flow', 'meta.literal.nodepath constant.character.escape'],
			code.path,
		),
		scope(['meta.function.gdscript meta.literal.nodepath constant.character.escape'], code.string),
	],
};

export default defineEcConfig({
	themes: [godotTheme],
	minSyntaxHighlightingColorContrast: 0,
	plugins: [pluginLineNumbers()],
	defaultProps: {
		showLineNumbers: true,
		overridesByLang: {
			'txt,sh,bash,powershell': { showLineNumbers: false },
		},
	},
	styleOverrides: {
		codeFontFamily: "'JetBrains Mono', monospace",
		codeFontSize: '0.875rem',
		codeLineHeight: '1.5rem',
		codePaddingBlock: '1rem',
		codePaddingInline: '1rem',
		borderColor: frame.border,
		borderWidth: '2px',
		borderRadius: '0.5rem',
		frames: {
			shadowColor: 'transparent',
			editorBackground: frame.code,
			editorTabBarBackground: frame.error,
			editorActiveTabBackground: frame.code,
			editorActiveTabForeground: code.default,
			editorActiveTabIndicatorTopColor: 'transparent',
			editorActiveTabIndicatorBottomColor: 'transparent',
			editorTabBarBorderBottomColor: frame.border,
			terminalBackground: frame.code,
			terminalTitlebarBackground: frame.error,
		},
		lineNumbers: {
			foreground: code.dim,
		},
	},
});
