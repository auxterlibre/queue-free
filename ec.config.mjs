import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { dark, light } from './src/styles/palette.mjs';

const scope = (scope, foreground) => ({ scope, settings: { foreground } });

const godotTheme = (name, type, { code, frame }) => ({
	name,
	type,
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
});

// Style overrides take a function so each theme reads its own palette.
const palette = ({ theme }) => (theme.type === 'light' ? light : dark);

export default defineEcConfig({
	themes: [godotTheme('godot-4-modern', 'dark', dark), godotTheme('godot-4-light', 'light', light)],
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
		borderColor: (ctx) => palette(ctx).frame.border,
		borderWidth: '2px',
		borderRadius: '0.5rem',
		frames: {
			shadowColor: 'transparent',
			editorBackground: (ctx) => palette(ctx).frame.code,
			editorTabBarBackground: (ctx) => palette(ctx).frame.error,
			editorActiveTabBackground: (ctx) => palette(ctx).frame.code,
			editorActiveTabForeground: (ctx) => palette(ctx).code.default,
			editorActiveTabIndicatorTopColor: 'transparent',
			editorActiveTabIndicatorBottomColor: 'transparent',
			editorTabBarBorderBottomColor: (ctx) => palette(ctx).frame.border,
			terminalBackground: (ctx) => palette(ctx).frame.code,
			terminalTitlebarBackground: (ctx) => palette(ctx).frame.error,
		},
		lineNumbers: {
			foreground: (ctx) => palette(ctx).code.dim,
		},
		textMarkers: {
			// Right/wrong reads better than diff +/- for a tutorial. The glyphs are
			// Material icons drawn as masks in theme.css; no text content here.
			insDiffIndicatorContent: "''",
			delDiffIndicatorContent: "''",
		},
	},
});
