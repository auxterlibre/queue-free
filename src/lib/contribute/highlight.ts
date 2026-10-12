// Browser-side syntax colouring for the contribute form, using the same
// highlighter and Godot token theme the site builds its pages with. Loaded
// lazily so the form itself stays light.
import { createHighlighterCore, type HighlighterCore, type ThemeRegistrationRaw } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { bundledLanguages } from 'shiki/langs';
import { escapeHtml as esc, plainLines, wrapLine, type LineOptions } from './code-lines.ts';

export type CodeLang = 'gdscript' | 'csharp' | 'txt';

export interface CodeThemes {
	dark: ThemeRegistrationRaw;
	light: ThemeRegistrationRaw;
}

export class Highlighter {
	private constructor(private core: HighlighterCore) {}

	static async create(themes: CodeThemes): Promise<Highlighter> {
		const [gdscript, csharp] = await Promise.all([bundledLanguages.gdscript(), bundledLanguages.csharp()]);
		const core = await createHighlighterCore({
			themes: [themes.dark, themes.light],
			langs: [gdscript, csharp],
			engine: createJavaScriptRegexEngine({ forgiving: true }),
		});
		return new Highlighter(core);
	}

	lines(code: string, lang: CodeLang, opts: LineOptions = {}): string {
		if (lang === 'txt') return plainLines(code, opts);
		const { tokens } = this.core.codeToTokens(code, {
			lang,
			themes: { dark: 'godot-4-modern', light: 'godot-4-light' },
			defaultColor: false,
		});
		return tokens
			.map((line, i) => {
				const inner = line
					.map((t) => {
						const style =
							typeof t.htmlStyle === 'string'
								? t.htmlStyle
								: Object.entries(t.htmlStyle ?? {})
										.map(([k, v]) => `${k}:${v}`)
										.join(';');
						return style ? `<span class="tok" style="${esc(style)}">${esc(t.content)}</span>` : esc(t.content);
					})
					.join('');
				return wrapLine(inner, i + 1, opts);
			})
			.join('');
	}
}
