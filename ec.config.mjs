import { defineEcConfig } from '@astrojs/starlight/expressive-code';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { dark, light } from './src/styles/palette.mjs';
import { godotTheme } from './src/styles/code-theme.mjs';

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
		borderWidth: (ctx) => palette(ctx).frame.borderWidth,
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
